import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:trueshift/app/app.dart';

void main() {
  testWidgets('Phase 3: Selfie Capture, Verification, Failure handling, and Punch Result flow',
      (WidgetTester tester) async {
    // 1. Launch App via TrueShiftApp router
    await tester.pumpWidget(
      const ProviderScope(
        child: TrueShiftApp(),
      ),
    );

    // Skip splash (1.5s) to Login
    await tester.pump(const Duration(milliseconds: 1600));
    await tester.pumpAndSettle();

    // Fill valid phone & send OTP
    await tester.enterText(find.byType(TextField).first, '9876543210');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Send OTP'));
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    // Enter valid 6-digit OTP: 123456
    final otpFields = find.byType(TextField);
    for (int i = 0; i < 6; i++) {
      await tester.enterText(otpFields.at(i), '${i + 1}');
    }
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    // On Permissions screen -> Tap Continue to Home
    expect(find.text('Permissions required'), findsOneWidget);
    await tester.tap(find.text('Continue to Home'));
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    // 2. Now on HomeScreen
    expect(find.textContaining('Ramesh'), findsOneWidget);
    expect(find.text('Green Valley – Tower B'), findsOneWidget);
    expect(find.text('Punched out'), findsOneWidget);
    expect(find.text('Punch In with selfie'), findsOneWidget);

    // 3. Tap "Punch In with selfie" -> Navigates to /punch/selfie
    await tester.tap(find.text('Punch In with selfie'));
    await tester.pumpAndSettle();

    // 4. Verify SelfieScreen UI elements
    expect(find.text('Punch In · Selfie'), findsOneWidget);
    expect(find.textContaining('Green Valley – Tower B'), findsOneWidget);
    expect(find.text('Keep your face inside the oval'), findsOneWidget);
    expect(find.text("Blink once to confirm it's live"), findsOneWidget);
    expect(find.text('Front camera'), findsOneWidget);
    expect(
      find.text('Front camera · Live photo only · No gallery upload'),
      findsOneWidget,
    );
    expect(find.text('Simulate: Success'), findsOneWidget);
    expect(find.text('Face not clear'), findsOneWidget);

    // 5. Test Failure Simulation Flow
    // Tap "Face not clear" toggle chip
    await tester.tap(find.text('Face not clear'));
    await tester.pumpAndSettle();

    // Tap round shutter button (camera icon)
    final shutter = find.byIcon(Icons.camera_alt_rounded);
    expect(shutter, findsOneWidget);
    await tester.tap(shutter);
    await tester.pump();

    // Verify "Verifying liveness..." spinner overlay is shown
    expect(find.text('Verifying liveness...'), findsOneWidget);

    // Advance clock by 1.2s to complete mock verification delay
    await tester.pump(const Duration(milliseconds: 1200));
    await tester.pumpAndSettle();

    // Verify Failure Modal appears
    expect(find.text('Face not clear'), findsAtLeastNWidgets(1));
    expect(
      find.text('Please ensure good lighting and look directly into the camera.'),
      findsOneWidget,
    );
    expect(find.text('Try Again'), findsOneWidget);

    // Tap "Try Again"
    await tester.tap(find.text('Try Again'));
    await tester.pumpAndSettle();

    // Modal dismissed, still on Selfie Screen
    expect(find.text('Punch In · Selfie'), findsOneWidget);

    // 6. Test Successful Capture Flow
    // Switch toggle to "Simulate: Success"
    await tester.tap(find.text('Simulate: Success'));
    await tester.pumpAndSettle();

    // Tap shutter button
    await tester.tap(shutter);
    await tester.pump();
    expect(find.text('Verifying liveness...'), findsOneWidget);

    // Advance past verification delay
    await tester.pump(const Duration(milliseconds: 1200));
    await tester.pumpAndSettle();

    // 7. Verify PunchSuccessScreen for Punch In
    expect(find.text('Punched In'), findsOneWidget);
    expect(find.byIcon(Icons.check_rounded), findsOneWidget);

    // Details Card inspection
    expect(find.textContaining('Ramesh Patil (EMP-0142)'), findsOneWidget);
    expect(find.text('Site Engineer'), findsOneWidget);
    expect(find.text('Location'), findsOneWidget);
    expect(find.text('Green Valley – Tower B'), findsOneWidget);
    expect(find.text('GPS'), findsOneWidget);
    expect(find.text('18.5204° N, 73.8567° E (accuracy ±8m)'), findsOneWidget);
    expect(find.text('Geofence'), findsOneWidget);
    expect(find.textContaining('42 m from centre (Allowed: 200 m)'), findsOneWidget);
    expect(find.text('Verification'), findsOneWidget);
    expect(find.text('Face verified (confidence 98.4%)'), findsOneWidget);
    expect(find.text('Device'), findsOneWidget);
    expect(find.text('Samsung Galaxy M34 · Android 14'), findsOneWidget);

    // Amber Reminder Banner
    expect(
      find.text('Remember to punch out when leaving site. Next punch allowed after 15 minutes.'),
      findsOneWidget,
    );
    expect(find.text('Done'), findsOneWidget);

    // 8. Tap "Done" -> Navigates to HomeScreen
    await tester.ensureVisible(find.text('Done'));
    await tester.tap(find.text('Done'));
    await tester.pumpAndSettle();

    // 9. Verify HomeScreen reflects Punched In state
    expect(find.text('Punched in'), findsOneWidget);
    expect(find.text('Punch Out with selfie'), findsOneWidget);

    // 10. Test Punch Out Flow
    await tester.tap(find.text('Punch Out with selfie'));
    await tester.pumpAndSettle();

    // Verify on Selfie Screen with "Punch Out · Selfie" title
    expect(find.text('Punch Out · Selfie'), findsOneWidget);

    // Tap shutter button for Punch Out
    await tester.tap(find.byIcon(Icons.camera_alt_rounded));
    await tester.pump();
    expect(find.text('Verifying liveness...'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 1200));
    await tester.pumpAndSettle();

    // 11. Verify PunchSuccessScreen for Punch Out
    expect(find.text('Punched Out'), findsOneWidget);
    // Blue Reminder Banner for Punch Out
    expect(
      find.textContaining('Shift completed. Total hours worked today:'),
      findsOneWidget,
    );

    // Tap "Done" -> Back to Home
    await tester.ensureVisible(find.text('Done'));
    await tester.tap(find.text('Done'));
    await tester.pumpAndSettle();

    // Verify Home reflects Punched Out state
    expect(find.text('Punched out'), findsOneWidget);
    expect(find.text('Punch In with selfie'), findsOneWidget);
  });
}
