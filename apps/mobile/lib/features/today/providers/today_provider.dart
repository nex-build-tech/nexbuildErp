import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/day_summary.dart';
import '../../../data/models/employee.dart';
import '../../../data/models/punch.dart';
import '../../../data/models/work_location.dart';
import '../../../data/models/work_session.dart';
import '../../home/providers/home_dashboard_provider.dart';

class TodayState {
  const TodayState({
    required this.employee,
    required this.selectedDate,
    required this.todayPunches,
    required this.todaySessions,
    required this.todaySummary,
    required this.locations,
    required this.isPunchedIn,
    required this.workedTodayLive,
    this.isLoading = false,
  });

  final Employee employee;
  final DateTime selectedDate;
  final List<Punch> todayPunches;
  final List<WorkSession> todaySessions;
  final DaySummary todaySummary;
  final List<WorkLocation> locations;
  final bool isPunchedIn;
  final Duration workedTodayLive;
  final bool isLoading;

  Duration get totalBreakDuration => todaySummary.totalBreak;
  int get sessionCount => todaySessions.length;

  WorkLocation? getLocation(String? locationId) {
    if (locationId == null) return null;
    try {
      return locations.firstWhere((loc) => loc.id == locationId);
    } catch (_) {
      return null;
    }
  }

  TodayState copyWith({
    Employee? employee,
    DateTime? selectedDate,
    List<Punch>? todayPunches,
    List<WorkSession>? todaySessions,
    DaySummary? todaySummary,
    List<WorkLocation>? locations,
    bool? isPunchedIn,
    Duration? workedTodayLive,
    bool? isLoading,
  }) {
    return TodayState(
      employee: employee ?? this.employee,
      selectedDate: selectedDate ?? this.selectedDate,
      todayPunches: todayPunches ?? this.todayPunches,
      todaySessions: todaySessions ?? this.todaySessions,
      todaySummary: todaySummary ?? this.todaySummary,
      locations: locations ?? this.locations,
      isPunchedIn: isPunchedIn ?? this.isPunchedIn,
      workedTodayLive: workedTodayLive ?? this.workedTodayLive,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class TodayNotifier extends Notifier<TodayState> {
  @override
  TodayState build() {
    final homeState = ref.watch(homeDashboardProvider);

    return TodayState(
      employee: homeState.employee,
      selectedDate: DateTime.now(),
      todayPunches: homeState.todayPunches,
      todaySessions: homeState.todaySessions,
      todaySummary: homeState.todaySummary,
      locations: homeState.assignedLocations,
      isPunchedIn: homeState.isPunchedIn,
      workedTodayLive: homeState.workedTodayLive,
      isLoading: homeState.isLoading,
    );
  }

  void changeDate(DateTime date) {
    state = state.copyWith(selectedDate: date);
  }

  Future<void> refresh() async {
    await ref.read(homeDashboardProvider.notifier).refreshDashboard();
  }
}

final todayProvider = NotifierProvider<TodayNotifier, TodayState>(
  TodayNotifier.new,
);
