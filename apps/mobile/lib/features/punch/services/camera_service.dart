/// Abstract camera service interface.
/// Allows swapping between mock placeholder and the real `camera` package
/// without modifying presentation widgets.
abstract class CameraService {
  Future<void> initialize();
  Future<String> takePicture();
  Future<void> dispose();
  bool get isInitialized;
}

class MockCameraService implements CameraService {
  bool _initialized = false;

  @override
  bool get isInitialized => _initialized;

  @override
  Future<void> initialize() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    _initialized = true;
  }

  @override
  Future<String> takePicture() async {
    // Returns a mock path for the captured selfie
    return 'mock://selfie_${DateTime.now().millisecondsSinceEpoch}.jpg';
  }

  @override
  Future<void> dispose() async {
    _initialized = false;
  }
}
