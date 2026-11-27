import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:trueshift/app/theme/app_theme.dart';
import 'package:trueshift/features/history/presentation/history_screen.dart';
import 'package:trueshift/features/home/presentation/home_screen.dart';
import 'package:trueshift/features/home/presentation/widgets/boundary_proximity_banner.dart';
import 'package:trueshift/features/home/presentation/widgets/mock_location_alert.dart';
import 'package:trueshift/features/home/presentation/widgets/offline_notice_banner.dart';
import 'package:trueshift/features/profile/presentation/profile_screen.dart';
import 'package:trueshift/features/profile/presentation/widgets/battery_optimization_sheet.dart';
import 'package:trueshift/features/today/presentation/today_screen.dart';
import 'package:trueshift/l10n/app_localizations.dart';

Widget _buildTestApp({
  required Widget child,
  ProviderContainer? container,
  double? textScale,
}) {
  return UncontrolledProviderScope(
    container: container ?? ProviderContainer(),
    child: MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: const Locale('en'),
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
      home: Builder(
        builder: (context) {
          if (textScale != null) {
            return MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaler: TextScaler.linear(textScale),
              ),
              child: child,
            );
          }
          return child;
        },
      ),
    ),
  );
}

void main() {
  group('Phase 7: Polish, Review & Edge Cases Tests', () {
    testWidgets('Outdoor & Budget phone review: 360dp width + 1.3x text scale without overflows',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      // 1. Test HomeScreen at 360dp + 1.3x scale
      final homeContainer = ProviderContainer();
      addTearDown(homeContainer.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const HomeScreen(),
          container: homeContainer,
          textScale: 1.3,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
      expect(tester.takeException(), isNull);

      // 2. Test TodayScreen at 360dp + 1.3x scale
      final todayContainer = ProviderContainer();
      addTearDown(todayContainer.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const TodayScreen(),
          container: todayContainer,
          textScale: 1.3,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(TodayScreen), findsOneWidget);
      expect(tester.takeException(), isNull);

      // 3. Test HistoryScreen at 360dp + 1.3x scale
      final historyContainer = ProviderContainer();
      addTearDown(historyContainer.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const HistoryScreen(),
          container: historyContainer,
          textScale: 1.3,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(HistoryScreen), findsOneWidget);
      expect(tester.takeException(), isNull);

      // 4. Test ProfileScreen at 360dp + 1.3x scale
      final profileContainer = ProviderContainer();
      addTearDown(profileContainer.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const ProfileScreen(),
          container: profileContainer,
          textScale: 1.3,
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(ProfileScreen), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('Offline / low-network mode banner and pending sync indicator',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const HomeScreen(),
          container: container,
        ),
      );
      await tester.pumpAndSettle();

      // Initially offline banner is not shown
      expect(find.byType(OfflineNoticeBanner), findsNothing);

      // Scroll and toggle offline mode via debug bar
      final offlineBtn = find.text('Offline');
      await tester.scrollUntilVisible(offlineBtn, 200.0);
      await tester.tap(offlineBtn);
      await tester.pumpAndSettle();

      // Verify offline banner appears with message
      expect(find.byType(OfflineNoticeBanner), findsOneWidget);
      expect(find.text('Offline Mode'), findsOneWidget);
      expect(
        find.textContaining('Punches are stored locally'),
        findsOneWidget,
      );

      // Toggle back to online
      final onlineBtn = find.text('Online');
      await tester.scrollUntilVisible(onlineBtn, 200.0);
      await tester.tap(onlineBtn);
      await tester.pumpAndSettle();

      expect(find.byType(OfflineNoticeBanner), findsNothing);
    });

    testWidgets('Mock location detection warning locks punch button',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const HomeScreen(),
          container: container,
        ),
      );
      await tester.pumpAndSettle();

      // Initially mock location alert is not shown
      expect(find.byType(MockLocationAlert), findsNothing);
      expect(find.text('Mock Location Blocked'), findsNothing);

      // Scroll and tap Mock GPS toggle
      final mockGpsBtn = find.text('Mock GPS');
      await tester.scrollUntilVisible(mockGpsBtn, 200.0);
      await tester.tap(mockGpsBtn);
      await tester.pumpAndSettle();

      // Verify MockLocationAlert is rendered
      expect(find.byType(MockLocationAlert), findsOneWidget);
      expect(find.text('Mock Location Detected'), findsOneWidget);
      expect(
        find.textContaining('Fake GPS or developer mock location is active'),
        findsOneWidget,
      );

      // Verify PunchButton is locked with 'Mock Location Blocked'
      expect(find.text('Mock Location Blocked'), findsOneWidget);

      // Clean GPS removes the warning
      final cleanGpsBtn = find.text('Clean GPS');
      await tester.scrollUntilVisible(cleanGpsBtn, 200.0);
      await tester.tap(cleanGpsBtn);
      await tester.pumpAndSettle();

      expect(find.byType(MockLocationAlert), findsNothing);
      expect(find.text('Mock Location Blocked'), findsNothing);
    });

    testWidgets('Geofence boundary proximity displays hysteresis notice',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const HomeScreen(),
          container: container,
        ),
      );
      await tester.pumpAndSettle();

      // Initially at 42m distance, not near boundary
      expect(find.byType(BoundaryProximityBanner), findsNothing);

      // Trigger boundary proximity toggle
      final nearBoundaryBtn = find.text('Near Boundary');
      await tester.scrollUntilVisible(nearBoundaryBtn, 200.0);
      await tester.tap(nearBoundaryBtn);
      await tester.pumpAndSettle();

      // Verify boundary proximity banner appears
      expect(find.byType(BoundaryProximityBanner), findsOneWidget);
      expect(find.text('Near Site Boundary'), findsOneWidget);
      expect(find.textContaining('from center'), findsOneWidget);
    });

    testWidgets('Battery optimization guidance modal sheet opens from Profile settings',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(
        _buildTestApp(
          child: const ProfileScreen(),
          container: container,
        ),
      );
      await tester.pumpAndSettle();

      // Find Battery Optimization Guide tile and tap
      final batteryTile = find.text('Battery Optimization Guide');
      expect(batteryTile, findsOneWidget);
      await tester.scrollUntilVisible(batteryTile, 200.0);
      await tester.tap(batteryTile);
      await tester.pumpAndSettle();

      // Verify modal bottom sheet is displayed
      final sheet = find.byType(BatteryOptimizationSheet);
      expect(sheet, findsOneWidget);
      expect(find.text('Keep TrueShift Unrestricted'), findsOneWidget);
      expect(
        find.descendant(
          of: sheet,
          matching: find.textContaining('Samsung Galaxy'),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: sheet,
          matching: find.textContaining('Xiaomi / Redmi'),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: sheet,
          matching: find.textContaining('Vivo / Oppo'),
        ),
        findsOneWidget,
      );

      // Tap Understood button to dismiss
      await tester.tap(find.text('Understood'));
      await tester.pumpAndSettle();

      expect(find.byType(BatteryOptimizationSheet), findsNothing);
    });
  });
}
