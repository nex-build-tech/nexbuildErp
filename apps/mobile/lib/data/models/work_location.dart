enum LocationType {
  site,
  office,
}

class WorkLocation {
  const WorkLocation({
    required this.id,
    required this.name,
    required this.locationType,
    required this.latitude,
    required this.longitude,
    required this.radiusMeters,
    this.isPrimary = false,
  });

  final String id;
  final String name;
  final LocationType locationType;
  final double latitude;
  final double longitude;
  final double radiusMeters;
  final bool isPrimary;

  String get typeLabel => locationType == LocationType.site
      ? 'Construction site'
      : 'Office location';

  WorkLocation copyWith({
    String? id,
    String? name,
    LocationType? locationType,
    double? latitude,
    double? longitude,
    double? radiusMeters,
    bool? isPrimary,
  }) {
    return WorkLocation(
      id: id ?? this.id,
      name: name ?? this.name,
      locationType: locationType ?? this.locationType,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      radiusMeters: radiusMeters ?? this.radiusMeters,
      isPrimary: isPrimary ?? this.isPrimary,
    );
  }
}
