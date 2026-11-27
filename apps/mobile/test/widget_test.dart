import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:trueshift/app/app.dart';

void main() {
  testWidgets('Complete Phase 1 Onboarding & Auth flow to Home',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: TrueShiftApp(),
      ),
    );

    // 1. Initial frame: Splash Screen
    expect(find.text('TrueShift'), findsOneWidget);
    expect(find.text('Real hours. Real shifts.'), findsOneWidget);

    // 2. Advance past 1.5s splash delay -> routes to LoginScreen
    await tester.pump(const Duration(milliseconds: 1600));
    await tester.pumpAndSettle();

    expect(find.text('NexBuild Attendance'), findsOneWidget);
    expect(find.text('+91'), findsOneWidget);
    expect(find.text('Send OTP'), findsOneWidget);

    // 3. Validation: Test invalid mobile number (< 10 digits)
    await tester.tap(find.text('Send OTP'));
    await tester.pumpAndSettle();
    expect(
      find.text('Please enter a valid 10-digit mobile number'),
      findsOneWidget,
    );

    // 4. Enter valid 10-digit mobile number
    await tester.enterText(find.byType(TextField).first, '9876543210');
    await tester.pumpAndSettle();

    await tester.tap(find.text('Send OTP'));
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    // 5. Lands on OtpScreen
    expect(find.text('Enter OTP sent by SMS'), findsOneWidget);
    expect(find.textContaining('Mobile: +91 98765 43210'), findsOneWidget);
    expect(find.text('Verify OTP'), findsOneWidget);

    // Find all 6 digit TextFields
    final textFields = find.byType(TextField);
    expect(textFields, findsNWidgets(6));

    // 6. Test invalid OTP (e.g. 999999)
    for (int i = 0; i < 6; i++) {
      await tester.enterText(textFields.at(i), '9');
    }
    await tester.pumpAndSettle();

    await tester.tap(find.text('Verify OTP'));
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    expect(
      find.text('Invalid OTP. Use 123456 to continue.'),
      findsOneWidget,
    );

    // 7. Enter valid OTP: 123456 (auto-submits on the 6th digit)
    const validOtp = ['1', '2', '3', '4', '5', '6'];
    for (int i = 0; i < 6; i++) {
      await tester.enterText(textFields.at(i), validOtp[i]);
    }
    // Allow async verify to finish and navigate to PermissionsScreen
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();

    // 8. Lands on PermissionsScreen
    expect(find.text('Permissions required'), findsOneWidget);
    expect(find.text('Camera access'), findsOneWidget);
    expect(find.text('Location access'), findsOneWidget);
    expect(find.text('Continue to Home'), findsOneWidget);

    // 9. Tap Continue to Home -> Lands on HomeScreen
    await tester.tap(find.text('Continue to Home'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Ramesh'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Today'), findsOneWidget);
    expect(find.text('History'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // 10. Switch tabs and check Widget Gallery
    await tester.tap(find.text('Today'));
    await tester.pumpAndSettle();
    expect(find.text('WORKED TODAY'), findsOneWidget);

    await tester.tap(find.text('History'));
    await tester.pumpAndSettle();
    expect(find.text('Present'), findsWidgets);

    await tester.tap(find.text('Home'));
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Widget Gallery'));
    await tester.pumpAndSettle();
    expect(find.text('Widget Gallery'), findsOneWidget);
  });
}
