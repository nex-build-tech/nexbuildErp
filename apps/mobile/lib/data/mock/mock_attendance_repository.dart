import '../../core/config/attendance_config.dart';
import '../../core/utils/attendance_logic.dart';
import '../../core/utils/geo_utils.dart';
import '../models/day_summary.dart';
import '../models/employee.dart';
import '../models/punch.dart';
import '../models/work_location.dart';
import '../repositories/attendance_repository.dart';

class MockAttendanceRepository implements AttendanceRepository {
  MockAttendanceRepository({
    this.config = const AttendanceConfig(),
  }) {
    _initializeSeedData();
  }

  final AttendanceConfig config;

  bool _isMockOutside = false;

  @override
  bool get isMockOutsideRadius => _isMockOutside;

  @override
  void toggleMockRadius(bool outside) {
    _isMockOutside = outside;
  }

  late Employee _currentEmployee;
  late List<WorkLocation> _locations;
  late Map<String, List<Punch>> _punchesByDate;

  void _initializeSeedData() {
    _currentEmployee = const Employee(
      id: 'emp_0142',
      name: 'Ramesh Patil',
      code: 'EMP-0142',
      role: 'Site Engineer',
      employeeType: EmployeeType.site,
      assignedLocationIds: ['loc_01', 'loc_02'],
      shiftStart: '09:00 AM',
      shiftEnd: '06:00 PM',
      phone: '9876543210',
      deviceBound: true,
    );

    _locations = const [
      WorkLocation(
        id: 'loc_01',
        name: 'Green Valley – Tower B',
        locationType: LocationType.site,
        latitude: 18.52043,
        longitude: 73.85674,
        radiusMeters: 200.0,
        isPrimary: true,
      ),
      WorkLocation(
        id: 'loc_02',
        name: 'Sunrise Plaza – Phase 1',
        locationType: LocationType.site,
        latitude: 18.52981,
        longitude: 73.86432,
        radiusMeters: 150.0,
        isPrimary: false,
      ),
      WorkLocation(
        id: 'loc_03',
        name: 'Corporate HQ – Pune',
        locationType: LocationType.office,
        latitude: 18.53500,
        longitude: 73.84000,
        radiusMeters: 100.0,
        isPrimary: false,
      ),
    ];

    // Today seed data (Saturday, 21 Nov 2026)
    final now = DateTime.now();
    final todayKey = _dateKey(now);

    final punch1In = DateTime(now.year, now.month, now.day, 9, 2);
    final punch1Out = DateTime(now.year, now.month, now.day, 13, 10);
    final punch2In = DateTime(now.year, now.month, now.day, 13, 55);
    final punch2Out = DateTime(now.year, now.month, now.day, 16, 5);

    _punchesByDate = {
      todayKey: [
        Punch(
          id: 'p_01',
          employeeId: _currentEmployee.id,
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: punch1In,
          latitude: 18.52060,
          longitude: 73.85680,
          distanceFromCenterM: 38.0,
          syncStatus: SyncStatus.synced,
        ),
        Punch(
          id: 'p_02',
          employeeId: _currentEmployee.id,
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: punch1Out,
          latitude: 18.52060,
          longitude: 73.85680,
          distanceFromCenterM: 40.0,
          note: 'Lunch break',
          syncStatus: SyncStatus.synced,
        ),
        Punch(
          id: 'p_03',
          employeeId: _currentEmployee.id,
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: punch2In,
          latitude: 18.52070,
          longitude: 73.85690,
          distanceFromCenterM: 51.0,
          syncStatus: SyncStatus.synced,
        ),
        Punch(
          id: 'p_04',
          employeeId: _currentEmployee.id,
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: punch2Out,
          latitude: 18.52055,
          longitude: 73.85682,
          distanceFromCenterM: 42.0,
          note: 'Material yard visit',
          syncStatus: SyncStatus.synced,
        ),
      ],
    };

    _seedPast2Months(now);
  }

  void _seedPast2Months(DateTime now) {
    for (int daysAgo = 60; daysAgo >= 1; daysAgo--) {
      final date = now.subtract(Duration(days: daysAgo));
      final key = _dateKey(date);

      // Sundays are weekly off
      if (date.weekday == DateTime.sunday) {
        continue;
      }

      // Modulo patterns for varied attendance
      final mod = date.day % 10;
      if (mod == 3) {
        // Absent / Leave (no punches)
        continue;
      } else if (mod == 7) {
        // Half Day: 09:05 AM to 01:45 PM (4h 40m)
        final pIn = DateTime(date.year, date.month, date.day, 9, 5);
        final pOut = DateTime(date.year, date.month, date.day, 13, 45);
        _punchesByDate[key] = [
          Punch(
            id: 'p_${key}_in',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchIn,
            timestamp: pIn,
            latitude: 18.52043,
            longitude: 73.85674,
            distanceFromCenterM: 42.0,
            syncStatus: SyncStatus.synced,
          ),
          Punch(
            id: 'p_${key}_out',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchOut,
            timestamp: pOut,
            latitude: 18.52043,
            longitude: 73.85674,
            distanceFromCenterM: 40.0,
            note: 'Doctor appointment - Half day',
            syncStatus: SyncStatus.synced,
          ),
        ];
      } else if (mod == 9) {
        // Late arrival (> 9:15 AM grace): 09:35 AM to 01:15 PM, 02:00 PM to 06:15 PM
        final p1In = DateTime(date.year, date.month, date.day, 9, 35);
        final p1Out = DateTime(date.year, date.month, date.day, 13, 15);
        final p2In = DateTime(date.year, date.month, date.day, 14, 0);
        final p2Out = DateTime(date.year, date.month, date.day, 18, 15);
        _punchesByDate[key] = [
          Punch(
            id: 'p_${key}_in1',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchIn,
            timestamp: p1In,
            latitude: 18.52043,
            longitude: 73.85674,
            distanceFromCenterM: 45.0,
            note: 'Traffic delay on highway',
            syncStatus: SyncStatus.synced,
          ),
          Punch(
            id: 'p_${key}_out1',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchOut,
            timestamp: p1Out,
            latitude: 18.52043,
            longitude: 73.85674,
            distanceFromCenterM: 38.0,
            note: 'Lunch break',
            syncStatus: SyncStatus.synced,
          ),
          Punch(
            id: 'p_${key}_in2',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchIn,
            timestamp: p2In,
            latitude: 18.52043,
            longitude: 73.85674,
            distanceFromCenterM: 42.0,
            syncStatus: SyncStatus.synced,
          ),
          Punch(
            id: 'p_${key}_out2',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchOut,
            timestamp: p2Out,
            latitude: 18.52043,
            longitude: 73.85674,
            distanceFromCenterM: 40.0,
            syncStatus: SyncStatus.synced,
          ),
        ];
      } else {
        // Standard Present Full Day (~8h 25m): 09:02 AM - 01:10 PM, 01:55 PM - 06:15 PM
        final p1In = DateTime(date.year, date.month, date.day, 9, 2);
        final p1Out = DateTime(date.year, date.month, date.day, 13, 10);
        final p2In = DateTime(date.year, date.month, date.day, 13, 55);
        final p2Out = DateTime(date.year, date.month, date.day, 18, 15);
        _punchesByDate[key] = [
          Punch(
            id: 'p_${key}_in1',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchIn,
            timestamp: p1In,
            latitude: 18.52060,
            longitude: 73.85680,
            distanceFromCenterM: 38.0,
            syncStatus: SyncStatus.synced,
          ),
          Punch(
            id: 'p_${key}_out1',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchOut,
            timestamp: p1Out,
            latitude: 18.52060,
            longitude: 73.85680,
            distanceFromCenterM: 40.0,
            note: 'Lunch break',
            syncStatus: SyncStatus.synced,
          ),
          Punch(
            id: 'p_${key}_in2',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchIn,
            timestamp: p2In,
            latitude: 18.52070,
            longitude: 73.85690,
            distanceFromCenterM: 51.0,
            syncStatus: SyncStatus.synced,
          ),
          Punch(
            id: 'p_${key}_out2',
            employeeId: _currentEmployee.id,
            locationId: 'loc_01',
            punchType: PunchType.punchOut,
            timestamp: p2Out,
            latitude: 18.52055,
            longitude: 73.85682,
            distanceFromCenterM: 42.0,
            note: 'Site inspection completed',
            syncStatus: SyncStatus.synced,
          ),
        ];
      }
    }
  }

  String _dateKey(DateTime date) => '${date.year}-${date.month}-${date.day}';

  @override
  Future<Employee> getCurrentEmployee() async {
    return _currentEmployee;
  }

  void updateEmployeeType(EmployeeType type) {
    _currentEmployee = _currentEmployee.copyWith(employeeType: type);
  }

  @override
  Future<List<WorkLocation>> getAssignedLocations() async {
    return _locations;
  }

  @override
  Future<List<Punch>> getPunchesForDay(DateTime date) async {
    final key = _dateKey(date);
    return List.unmodifiable(_punchesByDate[key] ?? <Punch>[]);
  }

  @override
  Future<List<DaySummary>> getMonthSummary(int year, int month) async {
    // Generate sample history
    final daysInMonth = DateTime(year, month + 1, 0).day;
    final summaries = <DaySummary>[];

    for (int day = 1; day <= daysInMonth; day++) {
      final date = DateTime(year, month, day);
      final key = _dateKey(date);
      final punches = _punchesByDate[key] ?? <Punch>[];
      summaries.add(AttendanceLogic.calculateDaySummary(punches, config, date));
    }

    return summaries;
  }

  @override
  Future<Punch> submitPunch({
    required String locationId,
    required PunchType punchType,
    required double latitude,
    required double longitude,
    required double distanceFromCenterM,
    String? selfiePath,
    String? note,
  }) async {
    final now = DateTime.now();
    final key = _dateKey(now);
    final dayList = _punchesByDate.putIfAbsent(key, () => <Punch>[]);

    DateTime punchTimestamp = now;
    if (dayList.isNotEmpty) {
      final lastTime = dayList.last.timestamp;
      if (!punchTimestamp.isAfter(lastTime)) {
        punchTimestamp = lastTime.add(const Duration(minutes: 15));
      }
    }

    final punch = Punch(
      id: 'p_${DateTime.now().millisecondsSinceEpoch}',
      employeeId: _currentEmployee.id,
      locationId: locationId,
      punchType: punchType,
      timestamp: punchTimestamp,
      latitude: latitude,
      longitude: longitude,
      distanceFromCenterM: distanceFromCenterM,
      selfiePath: selfiePath,
      note: note,
      syncStatus: SyncStatus.synced,
    );

    dayList.add(punch);

    return punch;
  }

  @override
  Future<({double latitude, double longitude})> getCurrentPosition() async {
    final primaryLocation = _locations.first;

    if (_isMockOutside) {
      // Offset by exactly 340 meters
      return (
        latitude: primaryLocation.latitude + 0.0030576,
        longitude: primaryLocation.longitude,
      );
    } else {
      // Offset by exactly 42 meters
      return (
        latitude: primaryLocation.latitude + 0.0003776,
        longitude: primaryLocation.longitude,
      );
    }
  }

  double calculateDistanceFrom(WorkLocation location, double userLat, double userLng) {
    return GeoUtils.distanceInMeters(
      userLat,
      userLng,
      location.latitude,
      location.longitude,
    );
  }
}
