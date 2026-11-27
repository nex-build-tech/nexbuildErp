import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:trueshift/app/theme/app_theme.dart';
import 'package:trueshift/features/auth/providers/auth_provider.dart';
import 'package:trueshift/features/profile/presentation/profile_screen.dart';
import 'package:trueshift/features/profile/presentation/widgets/assigned_locations_card.dart';
import 'package:trueshift/features/profile/presentation/widgets/employment_info_card.dart';
import 'package:trueshift/features/profile/presentation/widgets/logout_dialog.dart';
import 'package:trueshift/features/profile/presentation/widgets/profile_header.dart';
import 'package:trueshift/features/profile/presentation/widgets/settings_card.dart';
import 'package:trueshift/features/profile/providers/profile_provider.dart';
import 'package:trueshift/l10n/app_localizations.dart';

Widget _createProfileTestApp({
  ProviderContainer? container,
  GoRouter? customRouter,
}) {
  final router = customRouter ??
      GoRouter(
        initialLocation: '/profile',
        routes: [
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/login',
            builder: (context, state) => const Scaffold(
              body: Center(child: Text('Login Screen')),
            ),
          ),
        ],
      );

  return UncontrolledProviderScope(
    container: container ?? ProviderContainer(),
    child: Consumer(
      builder: (context, ref, _) {
        final settings = ref.watch(settingsProvider);
        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          routerConfig: router,
          locale: settings.locale,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
        );
      },
    ),
  );
}

void main() {
  group('Phase 6: Profile & Settings Tests', () {
    testWidgets('Renders complete employee profile, header, locations, and info card',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_createProfileTestApp(container: container));
      await tester.pumpAndSettle();

      // 1. Verify Profile Header
      expect(find.byType(ProfileHeader), findsOneWidget);
      expect(find.text('Ramesh Patil'), findsOneWidget);
      expect(find.text('RP'), findsOneWidget);
      expect(find.text('Site Engineer · EMP-0142'), findsOneWidget);
      expect(find.text('Site employee'), findsOneWidget);

      // 2. Verify Assigned Locations Section & Card
      expect(find.byType(AssignedLocationsCard), findsOneWidget);
      expect(find.text('Assigned Work Locations'), findsOneWidget);
      expect(find.text('Green Valley – Tower B'), findsOneWidget);
      expect(find.text('Construction site'), findsAtLeastNWidgets(1));
      expect(find.text('200m radius'), findsAtLeastNWidgets(1));
      expect(find.text('Primary'), findsOneWidget);

      // 3. Verify Employment Details Section & Card
      expect(find.byType(EmploymentInfoCard), findsOneWidget);
      expect(find.text('Employment Details'), findsOneWidget);
      expect(find.text('Shift Timing'), findsOneWidget);
      expect(find.text('09:00 AM – 06:00 PM'), findsOneWidget);
      expect(find.text('Reporting Manager'), findsOneWidget);
      expect(find.text('Vikram Shinde (Project Manager)'), findsOneWidget);
      expect(find.text('Registered Phone'), findsOneWidget);
      expect(find.text('+91 9876543210'), findsOneWidget);
      expect(find.text('Device Binding'), findsOneWidget);
      expect(
        find.text('Bound to this device (Samsung Galaxy M34)'),
        findsOneWidget,
      );

      // 4. Verify Settings & Logout Button
      expect(find.byType(SettingsCard), findsOneWidget);
      expect(find.text('App Settings'), findsOneWidget);
      expect(find.text('Language'), findsOneWidget);
      expect(find.text('Punch-out Reminder'), findsOneWidget);
      expect(find.text('TrueShift v1.0.0 (Build 1) · Production'), findsOneWidget);
      expect(find.text('Log Out'), findsOneWidget);
    });

    testWidgets('Live language switcher toggles between English, Marathi, and Hindi dynamically',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_createProfileTestApp(container: container));
      await tester.pumpAndSettle();

      // Initial: English
      expect(find.text('Assigned Work Locations'), findsOneWidget);
      expect(find.text('Employment Details'), findsOneWidget);
      expect(find.text('Site employee'), findsOneWidget);

      // Switch to Marathi ('मराठी')
      await tester.tap(find.text('मराठी'));
      await tester.pumpAndSettle();

      expect(container.read(settingsProvider).locale.languageCode, 'mr');
      expect(find.text('नियुक्त कामाची स्थाने'), findsOneWidget);
      expect(find.text('कामाचा तपशील'), findsOneWidget);
      expect(find.text('साइट कर्मचारी'), findsOneWidget);
      expect(find.text('प्राथमिक'), findsOneWidget);

      // Switch to Hindi ('हिंदी')
      await tester.tap(find.text('हिंदी'));
      await tester.pumpAndSettle();

      expect(container.read(settingsProvider).locale.languageCode, 'hi');
      expect(find.text('निर्धारित कार्य स्थान'), findsOneWidget);
      expect(find.text('रोजगार विवरण'), findsOneWidget);
      expect(find.text('साइट कर्मचारी'), findsOneWidget);
      expect(find.text('प्राथमिक'), findsOneWidget);

      // Switch back to English
      await tester.tap(find.text('English'));
      await tester.pumpAndSettle();

      expect(container.read(settingsProvider).locale.languageCode, 'en');
      expect(find.text('Assigned Work Locations'), findsOneWidget);
      expect(find.text('Employment Details'), findsOneWidget);
      expect(find.text('Site employee'), findsOneWidget);
    });

    testWidgets('Punch-out reminder displays and updates properly via settings provider',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.pumpWidget(_createProfileTestApp(container: container));
      await tester.pumpAndSettle();

      // Default reminder is 17:45 (5:45 PM)
      expect(find.textContaining('5:45'), findsOneWidget);

      // Update reminder via provider
      container.read(settingsProvider.notifier).setPunchOutReminder(
            const TimeOfDay(hour: 18, minute: 15),
          );
      await tester.pumpAndSettle();

      expect(find.textContaining('6:15'), findsOneWidget);
    });

    testWidgets('Logout button opens confirmation dialog and confirming routes to /login',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Set user as authenticated initially
      container.read(authProvider.notifier).authenticateForDemo();
      expect(container.read(authProvider).isAuthenticated, isTrue);

      await tester.pumpWidget(_createProfileTestApp(container: container));
      await tester.pumpAndSettle();

      // Scroll to bottom and tap Log Out button
      final logoutBtnFinder = find.widgetWithText(OutlinedButton, 'Log Out');
      expect(logoutBtnFinder, findsOneWidget);
      await tester.ensureVisible(logoutBtnFinder);
      await tester.tap(logoutBtnFinder);
      await tester.pumpAndSettle();

      // Verify dialog is shown
      expect(find.byType(LogoutDialog), findsOneWidget);
      expect(find.text('Log out?'), findsOneWidget);
      expect(
        find.textContaining('Are you sure you want to log out?'),
        findsOneWidget,
      );

      // Tap Cancel in dialog
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      // Verify dialog is dismissed and user is still authenticated
      expect(find.byType(LogoutDialog), findsNothing);
      expect(container.read(authProvider).isAuthenticated, isTrue);

      // Tap Log Out again
      await tester.tap(logoutBtnFinder);
      await tester.pumpAndSettle();

      // Confirm Logout inside dialog (FilledButton with 'Log Out')
      final confirmBtn = find.descendant(
        of: find.byType(LogoutDialog),
        matching: find.text('Log Out'),
      );
      expect(confirmBtn, findsOneWidget);
      await tester.tap(confirmBtn);
      await tester.pumpAndSettle();

      // Verify user logged out and navigated to Login Screen
      expect(container.read(authProvider).isAuthenticated, isFalse);
      expect(find.text('Login Screen'), findsOneWidget);
    });
  });
}
