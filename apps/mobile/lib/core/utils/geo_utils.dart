import 'dart:math' as math;

abstract final class GeoUtils {
  static const double earthRadiusMeters = 6371000.0;

  /// Calculates geodesic distance between two coordinates in meters using the Haversine formula.
  static double distanceInMeters(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    final dLat = _toRadians(lat2 - lat1);
    final dLng = _toRadians(lng2 - lng1);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRadians(lat1)) *
            math.cos(_toRadians(lat2)) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  /// Determines whether the user's coordinates fall within the site radius.
  static bool isInsideGeofence({
    required double userLat,
    required double userLng,
    required double siteLat,
    required double siteLng,
    required double radiusMeters,
  }) {
    final distance = distanceInMeters(userLat, userLng, siteLat, siteLng);
    return distance <= radiusMeters;
  }

  static double _toRadians(double degrees) => degrees * (math.pi / 180.0);
}
