import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:trueshift/data/models/day_summary.dart';
import 'package:trueshift/data/models/employee.dart';
import 'package:trueshift/features/home/providers/home_dashboard_provider.dart';
import 'package:trueshift/features/today/presentation/today_screen.dart';
import 'package:trueshift/features/today/providers/today_provider.dart';

void main() {
  group('Phase 4: Today Screen & Timeline Widget Tests', () {
    testWidgets('Renders Summary card, Sessions, Timeline items, and Map snippet with mock seed data',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: TodayScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Verify AppBar and Shift Info
      expect(find.text('Today'), findsOneWidget);
      expect(find.textContaining('Shift 09:00 AM – 06:00 PM'), findsOneWidget);

      // 2. Verify TodaySummaryCard contents
      expect(find.text('WORKED TODAY'), findsOneWidget);
      expect(find.text('6h 18m'), findsOneWidget);
      expect(find.text('TOTAL BREAK'), findsOneWidget);
      expect(find.text('45m'), findsOneWidget);
      expect(find.text('SESSIONS'), findsOneWidget);
      expect(find.text('2 sessions'), findsOneWidget);
      expect(find.textContaining('Shift progress'), findsOneWidget);
      expect(find.textContaining('Full day needs 8h'), findsOneWidget);
      expect(find.text('Half Day'), findsOneWidget);

      // 3. Verify Timeline Section Header & Counts
      expect(find.text('PUNCH LOG TIMELINE'), findsOneWidget);
      expect(find.text('4 punches'), findsOneWidget);

      // 4. Verify Session 1
      expect(find.text('SESSION 1'), findsOneWidget);
      expect(find.text('4h 08m'), findsOneWidget);
      expect(find.text('09:02 AM'), findsOneWidget);
      expect(find.text('01:10 PM'), findsOneWidget);
      expect(find.text('Note: Lunch break'), findsOneWidget);
      expect(find.textContaining('Green Valley – Tower B · 38 m'), findsOneWidget);

      // 5. Verify Break Interval Pill
      expect(find.text('45m break'), findsOneWidget);

      // 6. Verify Session 2
      expect(find.text('SESSION 2'), findsOneWidget);
      expect(find.text('2h 10m'), findsOneWidget);
      expect(find.text('01:55 PM'), findsOneWidget);
      expect(find.text('04:05 PM'), findsOneWidget);
      expect(find.text('Note: Material yard visit'), findsOneWidget);

      // 7. Test Selfie Preview Dialog
      final selfieThumbnails = find.byTooltip('View selfie details');
      expect(selfieThumbnails, findsAtLeastNWidgets(1));

      // Tap first selfie thumbnail
      await tester.tap(selfieThumbnails.first);
      await tester.pumpAndSettle();

      // Verify modal dialog appeared
      expect(find.text('Punch In Selfie'), findsOneWidget);
      expect(find.text('LIVE'), findsOneWidget);
      expect(find.text('Verified · 98.4%'), findsOneWidget);
      expect(find.text('98.4% (Passed)'), findsOneWidget);
      expect(find.text('Close'), findsOneWidget);

      // Close modal
      await tester.tap(find.text('Close'));
      await tester.pumpAndSettle();

      // Modal closed
      expect(find.text('Punch In Selfie'), findsNothing);

      // 8. Verify Map Snippet
      expect(find.text('PUNCH LOCATIONS'), findsOneWidget);
      expect(find.text('All in bounds'), findsOneWidget);
      expect(find.text('Site Centre'), findsOneWidget);

      // 9. Verify Regularization Reminder
      expect(find.text('Forgot to punch out?'), findsOneWidget);
    });

    testWidgets('Renders running session tag when punched in',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: TodayScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Punch In directly via homeDashboardProvider
      await container.read(homeDashboardProvider.notifier).togglePunchDirect();
      await tester.pumpAndSettle();

      // Verify Running state reflected on Today screen
      expect(find.text('Running'), findsAtLeastNWidgets(1));
      expect(find.text('SESSION 3'), findsOneWidget);
      expect(find.textContaining('Running ·'), findsOneWidget);
    });

    testWidgets('Renders empty state when 0 punches exist',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            todayProvider.overrideWith(() => _EmptyTodayNotifier()),
          ],
          child: const MaterialApp(
            home: TodayScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify empty state is displayed
      expect(find.text('No punches yet today.'), findsOneWidget);
      expect(
        find.text(
          'Punches recorded during your shift will appear in this chronological timeline.',
        ),
        findsOneWidget,
      );
      expect(find.text('0 sessions'), findsOneWidget);
    });
  });
}

class _EmptyTodayNotifier extends TodayNotifier {
  @override
  TodayState build() {
    const dummyEmp = Employee(
      id: 'emp_01',
      name: 'Ramesh Patil',
      code: 'EMP-01',
      role: 'Site Engineer',
      employeeType: EmployeeType.site,
      assignedLocationIds: ['loc_01'],
      shiftStart: '09:00 AM',
      shiftEnd: '06:00 PM',
      phone: '9876543210',
    );
    return TodayState(
      employee: dummyEmp,
      selectedDate: DateTime.now(),
      todayPunches: const [],
      todaySessions: const [],
      todaySummary: DaySummary(
        date: DateTime.now(),
        sessions: const [],
        totalWorked: Duration.zero,
        totalBreak: Duration.zero,
        status: DayStatus.absent,
      ),
      locations: const [],
      isPunchedIn: false,
      workedTodayLive: Duration.zero,
    );
  }
}
