import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/attendance_config.dart';
import '../../../core/utils/attendance_logic.dart';
import '../../../core/utils/geo_utils.dart';
import '../../../data/mock/mock_attendance_repository.dart';
import '../../../data/models/day_summary.dart';
import '../../../data/models/employee.dart';
import '../../../data/models/punch.dart';
import '../../../data/models/work_location.dart';
import '../../../data/models/work_session.dart';
import '../../../data/repositories/attendance_repository.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return MockAttendanceRepository();
});

class HomeDashboardState {
  const HomeDashboardState({
    required this.employee,
    required this.assignedLocations,
    required this.selectedLocation,
    required this.todayPunches,
    required this.todaySessions,
    required this.todaySummary,
    required this.isPunchedIn,
    this.lastPunch,
    required this.isInsideGeofence,
    required this.currentDistanceMeters,
    required this.workedTodayLive,
    this.isLoading = false,
    this.isRefreshingLocation = false,
    this.isMockOutside = false,
    this.isApprovalSubmitted = false,
    this.isOfflineMode = false,
    this.isMockLocationDetected = false,
    this.pendingSyncCount = 0,
  });

  final Employee employee;
  final List<WorkLocation> assignedLocations;
  final WorkLocation selectedLocation;
  final List<Punch> todayPunches;
  final List<WorkSession> todaySessions;
  final DaySummary todaySummary;
  final bool isPunchedIn;
  final Punch? lastPunch;
  final bool isInsideGeofence;
  final int currentDistanceMeters;
  final Duration workedTodayLive;
  final bool isLoading;
  final bool isRefreshingLocation;
  final bool isMockOutside;
  final bool isApprovalSubmitted;
  final bool isOfflineMode;
  final bool isMockLocationDetected;
  final int pendingSyncCount;

  bool get isNearBoundary =>
      (currentDistanceMeters - selectedLocation.radiusMeters).abs() <= 25;

  HomeDashboardState copyWith({
    Employee? employee,
    List<WorkLocation>? assignedLocations,
    WorkLocation? selectedLocation,
    List<Punch>? todayPunches,
    List<WorkSession>? todaySessions,
    DaySummary? todaySummary,
    bool? isPunchedIn,
    Punch? lastPunch,
    bool? isInsideGeofence,
    int? currentDistanceMeters,
    Duration? workedTodayLive,
    bool? isLoading,
    bool? isRefreshingLocation,
    bool? isMockOutside,
    bool? isApprovalSubmitted,
    bool? isOfflineMode,
    bool? isMockLocationDetected,
    int? pendingSyncCount,
  }) {
    return HomeDashboardState(
      employee: employee ?? this.employee,
      assignedLocations: assignedLocations ?? this.assignedLocations,
      selectedLocation: selectedLocation ?? this.selectedLocation,
      todayPunches: todayPunches ?? this.todayPunches,
      todaySessions: todaySessions ?? this.todaySessions,
      todaySummary: todaySummary ?? this.todaySummary,
      isPunchedIn: isPunchedIn ?? this.isPunchedIn,
      lastPunch: lastPunch ?? this.lastPunch,
      isInsideGeofence: isInsideGeofence ?? this.isInsideGeofence,
      currentDistanceMeters: currentDistanceMeters ?? this.currentDistanceMeters,
      workedTodayLive: workedTodayLive ?? this.workedTodayLive,
      isLoading: isLoading ?? this.isLoading,
      isRefreshingLocation: isRefreshingLocation ?? this.isRefreshingLocation,
      isMockOutside: isMockOutside ?? this.isMockOutside,
      isApprovalSubmitted: isApprovalSubmitted ?? this.isApprovalSubmitted,
      isOfflineMode: isOfflineMode ?? this.isOfflineMode,
      isMockLocationDetected:
          isMockLocationDetected ?? this.isMockLocationDetected,
      pendingSyncCount: pendingSyncCount ?? this.pendingSyncCount,
    );
  }
}

class HomeDashboardNotifier extends Notifier<HomeDashboardState> {
  AttendanceRepository get _repository => ref.read(attendanceRepositoryProvider);
  final AttendanceConfig _config = const AttendanceConfig();
  Timer? _tickerTimer;

  @override
  HomeDashboardState build() {
    ref.onDispose(() {
      _tickerTimer?.cancel();
    });

    final initialState = _createInitialState();

    // Schedule async init on next tick
    Future.microtask(() {
      _initDashboard();
      _startLiveTicker();
    });

    return initialState;
  }

  static HomeDashboardState _createInitialState() {
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
    const dummyLoc = WorkLocation(
      id: 'loc_01',
      name: 'Green Valley – Tower B',
      locationType: LocationType.site,
      latitude: 18.52043,
      longitude: 73.85674,
      radiusMeters: 200.0,
      isPrimary: true,
    );
    final now = DateTime.now();
    return HomeDashboardState(
      employee: dummyEmp,
      assignedLocations: const [dummyLoc],
      selectedLocation: dummyLoc,
      todayPunches: const [],
      todaySessions: const [],
      todaySummary: DaySummary(
        date: now,
        sessions: const [],
        totalWorked: const Duration(hours: 6, minutes: 18),
        totalBreak: const Duration(minutes: 45),
        status: DayStatus.halfDay,
      ),
      isPunchedIn: false,
      isInsideGeofence: true,
      currentDistanceMeters: 42,
      workedTodayLive: const Duration(hours: 6, minutes: 18),
      isLoading: true,
    );
  }

  void _startLiveTicker() {
    _tickerTimer?.cancel();
    _tickerTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (state.isPunchedIn) {
        state = state.copyWith(
          workedTodayLive: state.workedTodayLive + const Duration(seconds: 1),
        );
      }
    });
  }

  Future<void> _initDashboard() async {
    state = state.copyWith(isLoading: true);
    final employee = await _repository.getCurrentEmployee();
    final locations = await _repository.getAssignedLocations();
    final selected = locations.firstWhere(
      (loc) => loc.isPrimary,
      orElse: () => locations.first,
    );

    final punches = await _repository.getPunchesForDay(DateTime.now());
    final sessions = AttendanceLogic.buildSessions(punches);
    final summary = AttendanceLogic.calculateDaySummary(
      punches,
      _config,
      DateTime.now(),
    );

    final isPunchedIn = punches.isNotEmpty &&
        punches.last.punchType == PunchType.punchIn;

    final position = await _repository.getCurrentPosition();
    final dist = GeoUtils.distanceInMeters(
      position.latitude,
      position.longitude,
      selected.latitude,
      selected.longitude,
    ).round();

    final isInside = dist <= selected.radiusMeters;

    state = state.copyWith(
      employee: employee,
      assignedLocations: locations,
      selectedLocation: selected,
      todayPunches: punches,
      todaySessions: sessions,
      todaySummary: summary,
      isPunchedIn: isPunchedIn,
      lastPunch: punches.isNotEmpty ? punches.last : null,
      isInsideGeofence: isInside,
      currentDistanceMeters: dist,
      workedTodayLive: summary.totalWorked,
      isMockOutside: _repository.isMockOutsideRadius,
      isLoading: false,
    );
  }

  /// Debug toggle: switch between Inside and Outside site radius
  Future<void> toggleGeofenceRadius() async {
    final newOutsideState = !state.isMockOutside;
    _repository.toggleMockRadius(newOutsideState);

    final position = await _repository.getCurrentPosition();
    final dist = GeoUtils.distanceInMeters(
      position.latitude,
      position.longitude,
      state.selectedLocation.latitude,
      state.selectedLocation.longitude,
    ).round();

    final isInside = dist <= state.selectedLocation.radiusMeters;

    state = state.copyWith(
      isMockOutside: newOutsideState,
      isInsideGeofence: isInside,
      currentDistanceMeters: dist,
    );
  }

  /// Debug toggle: switch EmployeeType between site and office
  void toggleEmployeeType() {
    final newType = state.employee.employeeType == EmployeeType.site
        ? EmployeeType.office
        : EmployeeType.site;

    final updatedEmployee = state.employee.copyWith(employeeType: newType);
    if (_repository is MockAttendanceRepository) {
      (_repository as MockAttendanceRepository).updateEmployeeType(newType);
    }

    // Auto-select office location if switching to office
    WorkLocation selected = state.selectedLocation;
    if (newType == EmployeeType.office) {
      selected = state.assignedLocations.firstWhere(
        (loc) => loc.locationType == LocationType.office,
        orElse: () => state.selectedLocation,
      );
    } else {
      selected = state.assignedLocations.firstWhere(
        (loc) => loc.locationType == LocationType.site,
        orElse: () => state.selectedLocation,
      );
    }

    state = state.copyWith(
      employee: updatedEmployee,
      selectedLocation: selected,
    );
  }

  /// Change selected work location
  Future<void> selectLocation(WorkLocation location) async {
    final position = await _repository.getCurrentPosition();
    final dist = GeoUtils.distanceInMeters(
      position.latitude,
      position.longitude,
      location.latitude,
      location.longitude,
    ).round();

    final isInside = dist <= location.radiusMeters;

    state = state.copyWith(
      selectedLocation: location,
      isInsideGeofence: isInside,
      currentDistanceMeters: dist,
    );
  }

  /// Refreshes mock GPS location
  Future<void> refreshLocation() async {
    state = state.copyWith(isRefreshingLocation: true);
    await Future<void>.delayed(const Duration(milliseconds: 600));

    final position = await _repository.getCurrentPosition();
    final dist = GeoUtils.distanceInMeters(
      position.latitude,
      position.longitude,
      state.selectedLocation.latitude,
      state.selectedLocation.longitude,
    ).round();

    final isInside = dist <= state.selectedLocation.radiusMeters;

    state = state.copyWith(
      isRefreshingLocation: false,
      isInsideGeofence: isInside,
      currentDistanceMeters: dist,
    );
  }

  /// Static approval request bottom sheet submission
  Future<void> submitApprovalRequest(String reason) async {
    state = state.copyWith(isApprovalSubmitted: true);
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  /// Reloads punches, sessions, day summary, and recalculates isPunchedIn
  Future<void> refreshDashboard() async {
    final punches = await _repository.getPunchesForDay(DateTime.now());
    final sessions = AttendanceLogic.buildSessions(punches);
    final summary = AttendanceLogic.calculateDaySummary(
      punches,
      _config,
      DateTime.now(),
    );

    final isPunchedIn = punches.isNotEmpty &&
        punches.last.punchType == PunchType.punchIn;

    state = state.copyWith(
      todayPunches: punches,
      todaySessions: sessions,
      todaySummary: summary,
      isPunchedIn: isPunchedIn,
      lastPunch: punches.isNotEmpty ? punches.last : null,
      workedTodayLive: summary.totalWorked,
    );
  }

  /// Direct toggle punch for dashboard testing (pre-Phase 3 selfie flow)
  Future<void> togglePunchDirect() async {
    if (!state.isInsideGeofence) return;

    final newType = state.isPunchedIn ? PunchType.punchOut : PunchType.punchIn;
    final position = await _repository.getCurrentPosition();

    await _repository.submitPunch(
      locationId: state.selectedLocation.id,
      punchType: newType,
      latitude: position.latitude,
      longitude: position.longitude,
      distanceFromCenterM: state.currentDistanceMeters.toDouble(),
      note: newType == PunchType.punchOut ? 'Shift break' : null,
    );

    final punches = await _repository.getPunchesForDay(DateTime.now());
    final sessions = AttendanceLogic.buildSessions(punches);
    final summary = AttendanceLogic.calculateDaySummary(
      punches,
      _config,
      DateTime.now(),
    );

    state = state.copyWith(
      todayPunches: punches,
      todaySessions: sessions,
      todaySummary: summary,
      isPunchedIn: newType == PunchType.punchIn,
      lastPunch: punches.last,
      workedTodayLive: summary.totalWorked,
      pendingSyncCount: state.isOfflineMode ? state.pendingSyncCount + 1 : 0,
    );
  }

  /// Debug toggle: switch between online and offline / low-network mode
  void toggleOfflineMode() {
    final newOffline = !state.isOfflineMode;
    state = state.copyWith(
      isOfflineMode: newOffline,
      pendingSyncCount: newOffline ? (state.isPunchedIn ? 1 : 0) : 0,
    );
  }

  /// Debug toggle: simulate mock location / fake GPS detection
  void toggleMockLocationDetection() {
    state = state.copyWith(
      isMockLocationDetected: !state.isMockLocationDetected,
    );
  }

  /// Debug toggle: simulate proximity near the geofence boundary (185m on 200m radius)
  void simulateNearBoundary() {
    final nearDist = (state.selectedLocation.radiusMeters - 15).round();
    state = state.copyWith(
      currentDistanceMeters: nearDist,
      isInsideGeofence: true,
      isMockOutside: false,
    );
  }
}

final homeDashboardProvider =
    NotifierProvider<HomeDashboardNotifier, HomeDashboardState>(
  HomeDashboardNotifier.new,
);
