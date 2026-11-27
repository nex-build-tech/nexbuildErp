import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:trueshift/features/home/presentation/home_screen.dart';

void main() {
  testWidgets('Phase 2: Home dashboard inside site, toggle outside, and locked punch',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: HomeScreen(),
        ),
      ),
    );

    // Initial load frame
    await tester.pumpAndSettle();

    // 1. Verify Greeting & Site Name
    expect(find.textContaining('Ramesh'), findsOneWidget);
    expect(find.text('Green Valley – Tower B'), findsOneWidget);
    expect(find.text('Inside site'), findsOneWidget);
    expect(find.textContaining('42 m from centre'), findsOneWidget);

    // 2. Verify Status Hero Card
    expect(find.text('CURRENT STATUS'), findsOneWidget);
    expect(find.text('Punched out'), findsOneWidget);
    expect(find.text('Last out 04:05 PM'), findsOneWidget);
    expect(find.text('WORKED TODAY'), findsOneWidget);
    expect(find.text('6h 18m'), findsOneWidget);

    // 3. Verify Enabled Punch Button
    expect(find.text('Punch In with selfie'), findsOneWidget);

    // 4. Verify Today's Sessions Preview
    expect(find.text("Today's sessions"), findsOneWidget);
    expect(find.text('09:02 AM → 01:10 PM'), findsOneWidget);
    expect(find.text('4h 08m'), findsOneWidget);
    expect(find.text('01:55 PM → 04:05 PM'), findsOneWidget);
    expect(find.text('2h 10m'), findsOneWidget);

    // 5. Test Debug Toggle: Switch to Outside Site
    await tester.tap(find.byTooltip('Simulate Outside Site Radius'));
    await tester.pumpAndSettle();

    // Verify Outside Site State
    expect(find.text('Outside site'), findsOneWidget);
    expect(find.textContaining("You're 340 m outside your site"), findsOneWidget);
    expect(find.textContaining('Move within 200 m of Green Valley – Tower B to punch in.'), findsOneWidget);

    // Verify Locked Punch Button
    expect(find.text('Punch In locked'), findsOneWidget);
    expect(find.text('Refresh location'), findsOneWidget);
    expect(find.text('Working at another location? Request approval'), findsOneWidget);

    // 6. Test Request Approval Bottom Sheet
    await tester.tap(find.text('Working at another location? Request approval'));
    await tester.pumpAndSettle();

    expect(find.text('Request location approval'), findsOneWidget);
    expect(find.text('Submit Request'), findsOneWidget);

    // Tap Submit Request
    await tester.tap(find.text('Submit Request'));
    await tester.pumpAndSettle();
    expect(find.text('Approval request submitted to Project Manager.'), findsOneWidget);

    // Close bottom sheet
    await tester.tap(find.text('Done'));
    await tester.pumpAndSettle();

    // 7. Toggle back to Inside Site
    await tester.tap(find.byTooltip('Simulate Inside Site Radius'));
    await tester.pumpAndSettle();

    expect(find.text('Inside site'), findsOneWidget);
    expect(find.text('Punch In with selfie'), findsOneWidget);

    // 8. Test Direct Punch Toggle
    await tester.tap(find.text('Punch In with selfie'));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();

    // Now Punched In!
    expect(find.text('Punched in'), findsOneWidget);
    expect(find.text('Punch Out with selfie'), findsOneWidget);
  });
}
