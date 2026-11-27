enum PunchType {
  punchIn,
  punchOut,
}

enum SyncStatus {
  synced,
  pending,
}

class Punch {
  const Punch({
    required this.id,
    required this.employeeId,
    required this.locationId,
    required this.punchType,
    required this.timestamp,
    required this.latitude,
    required this.longitude,
    required this.distanceFromCenterM,
    this.selfiePath,
    this.syncStatus = SyncStatus.synced,
    this.isAutoClosed = false,
    this.note,
  });

  final String id;
  final String employeeId;
  final String locationId;
  final PunchType punchType;
  final DateTime timestamp;
  final double latitude;
  final double longitude;
  final double distanceFromCenterM;
  final String? selfiePath;
  final SyncStatus syncStatus;
  final bool isAutoClosed;
  final String? note;

  Punch copyWith({
    String? id,
    String? employeeId,
    String? locationId,
    PunchType? punchType,
    DateTime? timestamp,
    double? latitude,
    double? longitude,
    double? distanceFromCenterM,
    String? selfiePath,
    SyncStatus? syncStatus,
    bool? isAutoClosed,
    String? note,
  }) {
    return Punch(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      locationId: locationId ?? this.locationId,
      punchType: punchType ?? this.punchType,
      timestamp: timestamp ?? this.timestamp,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      distanceFromCenterM: distanceFromCenterM ?? this.distanceFromCenterM,
      selfiePath: selfiePath ?? this.selfiePath,
      syncStatus: syncStatus ?? this.syncStatus,
      isAutoClosed: isAutoClosed ?? this.isAutoClosed,
      note: note ?? this.note,
    );
  }
}
