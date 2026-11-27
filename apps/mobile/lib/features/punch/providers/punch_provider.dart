import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/punch.dart';
import '../../../data/models/work_location.dart';
import '../../home/providers/home_dashboard_provider.dart';
import '../services/camera_service.dart';

final cameraServiceProvider = Provider<CameraService>((ref) {
  return MockCameraService();
});

class PunchState {
  const PunchState({
    this.isVerifying = false,
    this.simulateFailure = false,
    this.failureReason,
    this.lastCreatedPunch,
    this.lastLocation,
    this.lastDistanceMeters,
    this.lastSessionNumber = 1,
  });

  final bool isVerifying;
  final bool simulateFailure;
  final String? failureReason;
  final Punch? lastCreatedPunch;
  final WorkLocation? lastLocation;
  final int? lastDistanceMeters;
  final int lastSessionNumber;

  PunchState copyWith({
    bool? isVerifying,
    bool? simulateFailure,
    String? failureReason,
    bool clearFailure = false,
    Punch? lastCreatedPunch,
    WorkLocation? lastLocation,
    int? lastDistanceMeters,
    int? lastSessionNumber,
  }) {
    return PunchState(
      isVerifying: isVerifying ?? this.isVerifying,
      simulateFailure: simulateFailure ?? this.simulateFailure,
      failureReason: clearFailure ? null : (failureReason ?? this.failureReason),
      lastCreatedPunch: lastCreatedPunch ?? this.lastCreatedPunch,
      lastLocation: lastLocation ?? this.lastLocation,
      lastDistanceMeters: lastDistanceMeters ?? this.lastDistanceMeters,
      lastSessionNumber: lastSessionNumber ?? this.lastSessionNumber,
    );
  }
}

class PunchNotifier extends Notifier<PunchState> {
  @override
  PunchState build() => const PunchState();

  void toggleSimulateFailure() {
    state = state.copyWith(
      simulateFailure: !state.simulateFailure,
      clearFailure: true,
    );
  }

  void clearFailure() {
    state = state.copyWith(clearFailure: true);
  }

  Future<bool> captureAndVerify({
    required PunchType punchType,
    required WorkLocation location,
    required int distanceMeters,
    String? note,
  }) async {
    state = state.copyWith(isVerifying: true, clearFailure: true);

    // Mock 1 second verification
    await Future<void>.delayed(const Duration(milliseconds: 1000));

    if (state.simulateFailure) {
      state = state.copyWith(
        isVerifying: false,
        failureReason:
            'Please ensure good lighting and look directly into the camera.',
      );
      return false;
    }

    final cameraService = ref.read(cameraServiceProvider);
    final selfiePath = await cameraService.takePicture();

    final repo = ref.read(attendanceRepositoryProvider);
    final position = await repo.getCurrentPosition();

    final punch = await repo.submitPunch(
      locationId: location.id,
      punchType: punchType,
      latitude: position.latitude,
      longitude: position.longitude,
      distanceFromCenterM: distanceMeters.toDouble(),
      selfiePath: selfiePath,
      note: note,
    );

    // Refresh Home Dashboard state
    await ref.read(homeDashboardProvider.notifier).refreshDashboard();
    // Count session number
    final todayPunches = await repo.getPunchesForDay(DateTime.now());
    final inPunchesCount = todayPunches.where((p) => p.punchType == PunchType.punchIn).length;

    state = state.copyWith(
      isVerifying: false,
      lastCreatedPunch: punch,
      lastLocation: location,
      lastDistanceMeters: distanceMeters,
      lastSessionNumber: inPunchesCount > 0 ? inPunchesCount : 1,
      clearFailure: true,
    );

    return true;
  }
}

final punchProvider = NotifierProvider<PunchNotifier, PunchState>(
  PunchNotifier.new,
);
