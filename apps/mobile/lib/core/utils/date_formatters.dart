import 'package:intl/intl.dart';

abstract final class DateFormatters {
  static final DateFormat _timeFormat = DateFormat('hh:mm a');
  static final DateFormat _dateFormat = DateFormat('EEEE, d MMM');
  static final DateFormat _shortDateFormat = DateFormat('EEE, d MMM');
  static final DateFormat _monthYearFormat = DateFormat('MMM yyyy');

  static String formatTime(DateTime dateTime) => _timeFormat.format(dateTime);

  static String formatDate(DateTime dateTime) => _dateFormat.format(dateTime);

  static String formatShortDate(DateTime dateTime) => _shortDateFormat.format(dateTime);

  static String formatMonthYear(DateTime dateTime) => _monthYearFormat.format(dateTime);

  /// Formats duration into "Xh Ym" or "Ym" if hours is 0
  static String formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0) {
      final paddedM = minutes.toString().padLeft(2, '0');
      return '${hours}h ${paddedM}m';
    }
    return '${minutes}m';
  }

  /// Formats duration with seconds for live ticking: "Xh Ym Zs"
  static String formatDurationWithSeconds(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    final paddedM = minutes.toString().padLeft(2, '0');
    final paddedS = seconds.toString().padLeft(2, '0');

    if (hours > 0) {
      return '${hours}h ${paddedM}m ${paddedS}s';
    }
    return '${paddedM}m ${paddedS}s';
  }

  /// Returns contextual greeting based on current hour
  static String getGreeting(DateTime dateTime, String name) {
    final hour = dateTime.hour;
    if (hour < 12) {
      return 'Good morning, $name';
    } else if (hour < 17) {
      return 'Good afternoon, $name';
    } else {
      return 'Good evening, $name';
    }
  }
}
