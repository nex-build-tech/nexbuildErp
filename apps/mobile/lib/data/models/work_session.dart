class WorkSession {
  const WorkSession({
    required this.inTime,
    this.outTime,
    required this.duration,
    required this.locationId,
    this.note,
    this.isAutoClosed = false,
  });

  final DateTime inTime;
  final DateTime? outTime;
  final Duration duration;
  final String locationId;
  final String? note;
  final bool isAutoClosed;

  bool get isRunning => outTime == null;

  WorkSession copyWith({
    DateTime? inTime,
    DateTime? outTime,
    Duration? duration,
    String? locationId,
    String? note,
    bool? isAutoClosed,
  }) {
    return WorkSession(
      inTime: inTime ?? this.inTime,
      outTime: outTime ?? this.outTime,
      duration: duration ?? this.duration,
      locationId: locationId ?? this.locationId,
      note: note ?? this.note,
      isAutoClosed: isAutoClosed ?? this.isAutoClosed,
    );
  }
}
