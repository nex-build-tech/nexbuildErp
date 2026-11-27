import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/attendance_logic.dart';
import '../../../data/mock/mock_attendance_repository.dart';
import '../../../data/models/day_summary.dart';
import '../../../data/models/employee.dart';
import '../../../data/models/punch.dart';
import '../../../data/models/work_location.dart';
import '../../../data/repositories/attendance_repository.dart';
import '../../home/providers/home_dashboard_provider.dart';

class HistoryState {
  const HistoryState({
    required this.selectedMonth,
    required this.summaries,
    required this.employee,
    required this.locations,
    this.selectedDay,
    this.selectedDaySummary,
    this.selectedDayPunches = const [],
    this.isLoading = false,
  });

  final DateTime selectedMonth;
  final List<DaySummary> summaries;
  final Employee employee;
  final List<WorkLocation> locations;
  final DateTime? selectedDay;
  final DaySummary? selectedDaySummary;
  final List<Punch> selectedDayPunches;
  final bool isLoading;

  // Monthly metric counts
  int get presentCount =>
      summaries.where((s) => s.status == DayStatus.present).length;

  int get lateCount =>
      summaries.where((s) => s.status == DayStatus.late).length;

  int get halfDayCount =>
      summaries.where((s) => s.status == DayStatus.halfDay).length;

  int get absentCount =>
      summaries.where((s) => s.status == DayStatus.absent).length;

  Duration get totalWorkedHours {
    var total = Duration.zero;
    for (final s in summaries) {
      total += s.totalWorked;
    }
    return total;
  }

  bool get canGoNext {
    final now = DateTime.now();
    // Cannot navigate past the current month
    if (selectedMonth.year > now.year) return false;
    if (selectedMonth.year == now.year && selectedMonth.month >= now.month) {
      return false;
    }
    return true;
  }

  bool get canGoPrev {
    final now = DateTime.now();
    // Allow navigating up to 12 months in the past
    final minDate = DateTime(now.year, now.month - 12, 1);
    return selectedMonth.isAfter(minDate);
  }

  WorkLocation? getLocation(String id) {
    try {
      return locations.firstWhere((l) => l.id == id);
    } catch (_) {
      return locations.isNotEmpty ? locations.first : null;
    }
  }

  HistoryState copyWith({
    DateTime? selectedMonth,
    List<DaySummary>? summaries,
    Employee? employee,
    List<WorkLocation>? locations,
    DateTime? selectedDay,
    DaySummary? selectedDaySummary,
    List<Punch>? selectedDayPunches,
    bool? isLoading,
  }) {
    return HistoryState(
      selectedMonth: selectedMonth ?? this.selectedMonth,
      summaries: summaries ?? this.summaries,
      employee: employee ?? this.employee,
      locations: locations ?? this.locations,
      selectedDay: selectedDay ?? this.selectedDay,
      selectedDaySummary: selectedDaySummary ?? this.selectedDaySummary,
      selectedDayPunches: selectedDayPunches ?? this.selectedDayPunches,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class HistoryNotifier extends Notifier<HistoryState> {
  late final AttendanceRepository _repository;

  @override
  HistoryState build() {
    _repository = ref.watch(attendanceRepositoryProvider);
    final now = DateTime.now();
    final currentMonth = DateTime(now.year, now.month, 1);

    const dummyEmp = Employee(
      id: 'emp_0142',
      name: 'Ramesh Patil',
      code: 'EMP-0142',
      role: 'Site Engineer',
      employeeType: EmployeeType.site,
      assignedLocationIds: ['loc_01'],
      shiftStart: '09:00 AM',
      shiftEnd: '06:00 PM',
      phone: '9876543210',
    );

    final initialState = HistoryState(
      selectedMonth: currentMonth,
      summaries: const [],
      employee: dummyEmp,
      locations: const [],
      isLoading: true,
    );

    // Initial load
    Future.microtask(_initHistory);

    return initialState;
  }

  Future<void> _initHistory() async {
    state = state.copyWith(isLoading: true);
    final emp = await _repository.getCurrentEmployee();
    final locs = await _repository.getAssignedLocations();
    final summaries = await _repository.getMonthSummary(
      state.selectedMonth.year,
      state.selectedMonth.month,
    );

    state = state.copyWith(
      employee: emp,
      locations: locs,
      summaries: summaries,
      isLoading: false,
    );
  }

  Future<void> selectMonth(DateTime month) async {
    final normalized = DateTime(month.year, month.month, 1);
    state = state.copyWith(selectedMonth: normalized, isLoading: true);

    final summaries = await _repository.getMonthSummary(
      normalized.year,
      normalized.month,
    );

    state = state.copyWith(
      summaries: summaries,
      isLoading: false,
      selectedDay: null,
      selectedDaySummary: null,
      selectedDayPunches: const [],
    );
  }

  Future<void> previousMonth() async {
    if (!state.canGoPrev) return;
    final prev = DateTime(
      state.selectedMonth.year,
      state.selectedMonth.month - 1,
      1,
    );
    await selectMonth(prev);
  }

  Future<void> nextMonth() async {
    if (!state.canGoNext) return;
    final next = DateTime(
      state.selectedMonth.year,
      state.selectedMonth.month + 1,
      1,
    );
    await selectMonth(next);
  }

  Future<void> selectDay(DateTime date) async {
    final punches = await _repository.getPunchesForDay(date);
    DaySummary? summary;
    try {
      summary = state.summaries.firstWhere(
        (s) =>
            s.date.year == date.year &&
            s.date.month == date.month &&
            s.date.day == date.day,
      );
    } catch (_) {
      if (_repository is MockAttendanceRepository) {
        summary = AttendanceLogic.calculateDaySummary(
          punches,
          _repository.config,
          date,
        );
      }
    }

    state = state.copyWith(
      selectedDay: date,
      selectedDaySummary: summary,
      selectedDayPunches: punches,
    );
  }

  Future<void> refresh() async {
    await selectMonth(state.selectedMonth);
  }
}

final historyProvider = NotifierProvider<HistoryNotifier, HistoryState>(
  HistoryNotifier.new,
);
