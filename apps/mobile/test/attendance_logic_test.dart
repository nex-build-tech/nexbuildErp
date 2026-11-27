import 'package:flutter_test/flutter_test.dart';
import 'package:trueshift/core/config/attendance_config.dart';
import 'package:trueshift/core/utils/attendance_logic.dart';
import 'package:trueshift/core/utils/geo_utils.dart';
import 'package:trueshift/data/models/day_summary.dart';
import 'package:trueshift/data/models/punch.dart';

void main() {
  group('GeoUtils Unit Tests', () {
    test('Haversine distance calculates accurately for known points', () {
      // Pune station to Shaniwar Wada (~2.6 km)
      const lat1 = 18.5284;
      const lon1 = 73.8744;
      const lat2 = 18.5196;
      const lon2 = 73.8553;

      final distance = GeoUtils.distanceInMeters(lat1, lon1, lat2, lon2);
      expect(distance, greaterThan(2200.0));
      expect(distance, lessThan(2700.0));
    });

    test('isInsideGeofence returns true when within radius and false when outside', () {
      const siteLat = 18.52043;
      const siteLng = 73.85674;
      const radiusMeters = 200.0;

      // Point ~42m away (0.00038 deg lat is ~42m)
      final isInside = GeoUtils.isInsideGeofence(
        userLat: siteLat + 0.00038,
        userLng: siteLng,
        siteLat: siteLat,
        siteLng: siteLng,
        radiusMeters: radiusMeters,
      );
      expect(isInside, isTrue);

      // Point ~340m away (0.00305 deg lat is ~339m)
      final isOutside = GeoUtils.isInsideGeofence(
        userLat: siteLat + 0.00305,
        userLng: siteLng,
        siteLat: siteLat,
        siteLng: siteLng,
        radiusMeters: radiusMeters,
      );
      expect(isOutside, isFalse);
    });
  });

  group('AttendanceLogic Unit Tests', () {
    const config = AttendanceConfig(
      fullDayMinutes: 480, // 8h
      halfDayMinutes: 240, // 4h
      gracePeriodMinutes: 15,
      shiftStartHour: 9,
      shiftStartMinute: 0,
      shiftEndHour: 18,
      shiftEndMinute: 0,
    );

    final testDate = DateTime(2026, 11, 21); // Saturday

    test('buildSessions correctly pairs In and Out punches into sessions', () {
      final punches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 2),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '2',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 13, 10),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
          note: 'Lunch break',
        ),
        Punch(
          id: '3',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 13, 55),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '4',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 16, 5),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];

      final sessions = AttendanceLogic.buildSessions(punches);
      expect(sessions.length, equals(2));
      expect(sessions[0].duration.inMinutes, equals(248)); // 4h 08m
      expect(sessions[1].duration.inMinutes, equals(130)); // 2h 10m
    });

    test('buildSessions handles open running session correctly', () {
      final punches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];

      final now = DateTime(2026, 11, 21, 11, 30);
      final sessions = AttendanceLogic.buildSessions(punches, now: now);

      expect(sessions.length, equals(1));
      expect(sessions[0].isRunning, isTrue);
      expect(sessions[0].duration.inMinutes, equals(150)); // 2h 30m
    });

    test('calculateDaySummary evaluates Present (>= 8h), Half Day (>= 4h), and Absent (< 4h)', () {
      // 1. Full day punches: 9:00 AM to 5:30 PM (8h 30m worked)
      final fullDayPunches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '2',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 17, 30),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];
      final fullDaySummary = AttendanceLogic.calculateDaySummary(fullDayPunches, config, testDate);
      expect(fullDaySummary.status, equals(DayStatus.present));
      expect(fullDaySummary.isLate, isFalse);
      expect(fullDaySummary.totalWorked.inHours, equals(8));

      // 2. Half day punches: 9:00 AM to 1:30 PM (4h 30m worked)
      final halfDayPunches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '2',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 13, 30),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];
      final halfDaySummary = AttendanceLogic.calculateDaySummary(halfDayPunches, config, testDate);
      expect(halfDaySummary.status, equals(DayStatus.halfDay));

      // 3. Late arrival (> 9:15 AM)
      final latePunches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 25), // 25 min after shift start (> 15m grace)
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '2',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 18, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];
      final lateSummary = AttendanceLogic.calculateDaySummary(latePunches, config, testDate);
      expect(lateSummary.isLate, isTrue);
      expect(lateSummary.status, equals(DayStatus.late));

      // 4. Absent on 0 punches
      final zeroSummary = AttendanceLogic.calculateDaySummary([], config, testDate);
      expect(zeroSummary.status, equals(DayStatus.absent));
      expect(zeroSummary.totalWorked, equals(Duration.zero));

      // 5. Absent on < 4h worked
      final under4hPunches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '2',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 11, 30), // 2h 30m worked
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];
      final under4hSummary = AttendanceLogic.calculateDaySummary(under4hPunches, config, testDate);
      expect(under4hSummary.status, equals(DayStatus.absent));
      expect(under4hSummary.totalWorked.inMinutes, equals(150));
    });

    test('buildSessions handles missing Out and consecutive Ins gracefully', () {
      final punches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        // Missing Out: employee punches In again at 14:00
        Punch(
          id: '2',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 14, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '3',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 18, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];

      final sessions = AttendanceLogic.buildSessions(punches);
      expect(sessions.length, equals(2));
      // First session auto-closed at 14:00
      expect(sessions[0].isAutoClosed, isTrue);
      expect(sessions[0].outTime, equals(DateTime(2026, 11, 21, 14, 0)));
      expect(sessions[0].duration.inHours, equals(5));
      // Second session closed normally
      expect(sessions[1].outTime, equals(DateTime(2026, 11, 21, 18, 0)));
      expect(sessions[1].duration.inHours, equals(4));
    });

    test('calculateDaySummary handles punch across shift end accurately', () {
      // Punch In at 09:00 AM, Punch Out at 19:30 PM (overtime, across 18:00 shift end)
      final otPunches = [
        Punch(
          id: '1',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchIn,
          timestamp: DateTime(2026, 11, 21, 9, 0),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
        Punch(
          id: '2',
          employeeId: 'emp_01',
          locationId: 'loc_01',
          punchType: PunchType.punchOut,
          timestamp: DateTime(2026, 11, 21, 19, 30),
          latitude: 18.0,
          longitude: 73.0,
          distanceFromCenterM: 40,
        ),
      ];

      final summary = AttendanceLogic.calculateDaySummary(otPunches, config, testDate);
      expect(summary.totalWorked.inMinutes, equals(630)); // 10h 30m
      expect(summary.status, equals(DayStatus.present));
    });
  });
}
