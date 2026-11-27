import '../config/attendance_config.dart';
import '../../data/models/day_summary.dart';
import '../../data/models/punch.dart';
import '../../data/models/work_session.dart';

abstract final class AttendanceLogic {
  /// Pairs In/Out punches chronologically into WorkSessions.
  /// Handles running sessions, auto-closed punches, and unpaired punches.
  static List<WorkSession> buildSessions(
    List<Punch> punches, {
    DateTime? now,
  }) {
    if (punches.isEmpty) return <WorkSession>[];

    final sortedPunches = List<Punch>.from(punches)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    final sessions = <WorkSession>[];
    Punch? currentIn;

    for (final punch in sortedPunches) {
      if (punch.punchType == PunchType.punchIn) {
        if (currentIn != null) {
          // Previous In was left open, close it at current punch timestamp
          final duration = punch.timestamp.difference(currentIn.timestamp);
          sessions.add(
            WorkSession(
              inTime: currentIn.timestamp,
              outTime: punch.timestamp,
              duration: duration.isNegative ? Duration.zero : duration,
              locationId: currentIn.locationId,
              note: currentIn.note,
              isAutoClosed: true,
            ),
          );
        }
        currentIn = punch;
      } else if (punch.punchType == PunchType.punchOut) {
        if (currentIn != null) {
          final duration = punch.timestamp.difference(currentIn.timestamp);
          sessions.add(
            WorkSession(
              inTime: currentIn.timestamp,
              outTime: punch.timestamp,
              duration: duration.isNegative ? Duration.zero : duration,
              locationId: currentIn.locationId,
              note: punch.note ?? currentIn.note,
              isAutoClosed: punch.isAutoClosed,
            ),
          );
          currentIn = null;
        }
      }
    }

    // Handle trailing open session
    if (currentIn != null) {
      final currentTime = now ?? DateTime.now();
      final duration = currentTime.difference(currentIn.timestamp);
      sessions.add(
        WorkSession(
          inTime: currentIn.timestamp,
          outTime: null,
          duration: duration.isNegative ? Duration.zero : duration,
          locationId: currentIn.locationId,
          note: currentIn.note,
        ),
      );
    }

    return sessions;
  }

  /// Calculates the day summary including worked hours, breaks, and DayStatus.
  static DaySummary calculateDaySummary(
    List<Punch> punches,
    AttendanceConfig config,
    DateTime date, {
    DateTime? now,
  }) {
    final sessions = buildSessions(punches, now: now);

    var totalWorked = Duration.zero;
    for (final session in sessions) {
      totalWorked += session.duration;
    }

    var totalBreak = Duration.zero;
    for (int i = 1; i < sessions.length; i++) {
      final prevOut = sessions[i - 1].outTime;
      if (prevOut != null) {
        final breakDuration = sessions[i].inTime.difference(prevOut);
        if (!breakDuration.isNegative) {
          totalBreak += breakDuration;
        }
      }
    }

    // Check late status
    final shiftStart = config.getShiftStart(date);
    final graceDeadline = shiftStart.add(config.gracePeriod);

    bool isLate = false;
    final firstInPunch = punches
        .where((p) => p.punchType == PunchType.punchIn)
        .fold<Punch?>(null, (earliest, p) {
      if (earliest == null) return p;
      return p.timestamp.isBefore(earliest.timestamp) ? p : earliest;
    });

    if (firstInPunch != null) {
      isLate = firstInPunch.timestamp.isAfter(graceDeadline);
    }

    // Determine DayStatus
    final today = now ?? DateTime.now();
    final todayStart = DateTime(today.year, today.month, today.day);
    final dateStart = DateTime(date.year, date.month, date.day);
    final isFuture = dateStart.isAfter(todayStart);

    DayStatus status;
    if (date.weekday == DateTime.sunday) {
      status = DayStatus.weeklyOff;
    } else if (isFuture && punches.isEmpty) {
      status = DayStatus.upcoming;
    } else if (totalWorked >= config.fullDayDuration) {
      status = isLate ? DayStatus.late : DayStatus.present;
    } else if (totalWorked >= config.halfDayDuration) {
      status = DayStatus.halfDay;
    } else {
      status = DayStatus.absent;
    }

    return DaySummary(
      date: date,
      sessions: sessions,
      totalWorked: totalWorked,
      totalBreak: totalBreak,
      status: status,
      isLate: isLate,
    );
  }
}
