import 'work_session.dart';

enum DayStatus {
  present,
  late,
  halfDay,
  absent,
  weeklyOff,
  holiday,
  upcoming,
}

class DaySummary {
  const DaySummary({
    required this.date,
    required this.sessions,
    required this.totalWorked,
    required this.totalBreak,
    required this.status,
    this.isLate = false,
  });

  final DateTime date;
  final List<WorkSession> sessions;
  final Duration totalWorked;
  final Duration totalBreak;
  final DayStatus status;
  final bool isLate;

  DaySummary copyWith({
    DateTime? date,
    List<WorkSession>? sessions,
    Duration? totalWorked,
    Duration? totalBreak,
    DayStatus? status,
    bool? isLate,
  }) {
    return DaySummary(
      date: date ?? this.date,
      sessions: sessions ?? this.sessions,
      totalWorked: totalWorked ?? this.totalWorked,
      totalBreak: totalBreak ?? this.totalBreak,
      status: status ?? this.status,
      isLate: isLate ?? this.isLate,
    );
  }
}
