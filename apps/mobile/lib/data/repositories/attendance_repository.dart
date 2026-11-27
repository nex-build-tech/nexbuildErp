import '../models/day_summary.dart';
import '../models/employee.dart';
import '../models/punch.dart';
import '../models/work_location.dart';

abstract class AttendanceRepository {
  Future<Employee> getCurrentEmployee();
  Future<List<WorkLocation>> getAssignedLocations();
  Future<List<Punch>> getPunchesForDay(DateTime date);
  Future<List<DaySummary>> getMonthSummary(int year, int month);
  Future<Punch> submitPunch({
    required String locationId,
    required PunchType punchType,
    required double latitude,
    required double longitude,
    required double distanceFromCenterM,
    String? selfiePath,
    String? note,
  });

  /// Mock position helper for simulating inside vs outside geofence radius
  Future<({double latitude, double longitude})> getCurrentPosition();
  bool get isMockOutsideRadius;
  void toggleMockRadius(bool outside);
}
