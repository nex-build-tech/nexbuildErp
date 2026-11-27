/// Attendance thresholds and shift configuration.
/// Kept strictly in config, never hardcoded.
class AttendanceConfig {
  const AttendanceConfig({
    this.fullDayMinutes = 480, // 8 hours
    this.halfDayMinutes = 240, // 4 hours
    this.gracePeriodMinutes = 15,
    this.shiftStartHour = 9,
    this.shiftStartMinute = 0,
    this.shiftEndHour = 18,
    this.shiftEndMinute = 0,
  });

  final int fullDayMinutes;
  final int halfDayMinutes;
  final int gracePeriodMinutes;
  final int shiftStartHour;
  final int shiftStartMinute;
  final int shiftEndHour;
  final int shiftEndMinute;

  Duration get fullDayDuration => Duration(minutes: fullDayMinutes);
  Duration get halfDayDuration => Duration(minutes: halfDayMinutes);
  Duration get gracePeriod => Duration(minutes: gracePeriodMinutes);

  DateTime getShiftStart(DateTime date) {
    return DateTime(
      date.year,
      date.month,
      date.day,
      shiftStartHour,
      shiftStartMinute,
    );
  }

  DateTime getShiftEnd(DateTime date) {
    return DateTime(
      date.year,
      date.month,
      date.day,
      shiftEndHour,
      shiftEndMinute,
    );
  }
}
