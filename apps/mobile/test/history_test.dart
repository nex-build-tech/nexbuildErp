import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:trueshift/features/history/presentation/history_screen.dart';
import 'package:trueshift/features/history/presentation/widgets/day_detail_screen.dart';
import 'package:trueshift/features/history/presentation/widgets/regularization_request_sheet.dart';

void main() {
  group('Phase 5: History Screen & Monthly Attendance Tests', () {
    testWidgets('Renders month navigator, summary tiles, calendar grid, and recent days',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // 1. Verify AppBar
      expect(find.text('History'), findsOneWidget);

      // 2. Verify 4 Summary Tiles
      expect(find.text('Present'), findsAtLeastNWidgets(1));
      expect(find.text('Late'), findsAtLeastNWidgets(1));
      expect(find.text('Half Day'), findsAtLeastNWidgets(1));
      expect(find.text('Absent'), findsAtLeastNWidgets(1));

      // 3. Verify Calendar Grid Weekday Headers
      expect(find.text('Sun'), findsOneWidget);
      expect(find.text('Mon'), findsOneWidget);
      expect(find.text('Tue'), findsOneWidget);
      expect(find.text('Wed'), findsOneWidget);
      expect(find.text('Thu'), findsOneWidget);
      expect(find.text('Fri'), findsOneWidget);
      expect(find.text('Sat'), findsOneWidget);

      // 4. Verify Calendar Legend
      expect(find.text('Weekly Off'), findsAtLeastNWidgets(1));

      // 5. Verify Recent Attendance Section
      expect(find.text('RECENT ATTENDANCE'), findsOneWidget);
      expect(find.textContaining('Tap any day to view complete shift details'), findsOneWidget);
    });

    testWidgets('Month navigator previous and next buttons with future block',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      final now = DateTime.now();
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      final currentMonthName = monthNames[now.month - 1];
      final prevMonthName = monthNames[(now.month - 2 + 12) % 12];

      expect(find.textContaining(currentMonthName), findsOneWidget);

      // Tap Previous Month button
      final prevBtn = find.byTooltip('Previous month');
      expect(prevBtn, findsOneWidget);
      await tester.tap(prevBtn);
      await tester.pumpAndSettle();

      // Verify navigated to previous month
      expect(find.textContaining(prevMonthName), findsOneWidget);

      // Next month button is now enabled
      final nextBtn = find.byTooltip('Next month');
      expect(nextBtn, findsOneWidget);
      await tester.tap(nextBtn);
      await tester.pumpAndSettle();

      // Navigated back to current month
      expect(find.textContaining(currentMonthName), findsOneWidget);
    });

    testWidgets('Tapping a calendar day opens DayDetailScreen and RegularizationRequestSheet',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap day 15 in the calendar grid
      final day15 = find.text('15');
      expect(day15, findsOneWidget);
      await tester.tap(day15);
      await tester.pumpAndSettle();

      // 1. Verify DayDetailScreen opened
      expect(find.byType(DayDetailScreen), findsOneWidget);
      expect(find.text('WORKED TODAY'), findsOneWidget);

      // 2. Open Regularization Request Sheet
      final regAction = find.byTooltip('Request Regularization');
      expect(regAction, findsOneWidget);
      await tester.tap(regAction);
      await tester.pumpAndSettle();

      // Verify Regularization Sheet is visible
      expect(find.byType(RegularizationRequestSheet), findsOneWidget);
      expect(find.text('Request Regularization'), findsOneWidget);
      expect(find.text('Reason for Regularization'), findsOneWidget);
      expect(find.text('Submit Regularization Request'), findsOneWidget);

      // Tap submit
      await tester.tap(find.text('Submit Regularization Request'));
      await tester.pump(const Duration(milliseconds: 700));
      await tester.pumpAndSettle();

      // Sheet dismissed
      expect(find.byType(RegularizationRequestSheet), findsNothing);
    });

    testWidgets('Tapping a recent day in the list opens DayDetailScreen',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: HistoryScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Scroll until RECENT ATTENDANCE is visible
      await tester.scrollUntilVisible(
        find.text('RECENT ATTENDANCE'),
        200,
        scrollable: find.byType(Scrollable).first,
      );

      // Find the first recent day item
      final recentItem = find.textContaining('session').first;
      await tester.tap(recentItem);
      await tester.pumpAndSettle();

      // Verify DayDetailScreen opened
      expect(find.byType(DayDetailScreen), findsOneWidget);
    });
  });
}
