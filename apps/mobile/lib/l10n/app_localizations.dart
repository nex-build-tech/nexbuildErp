import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_mr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
    Locale('mr'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'TrueShift'**
  String get appName;

  /// No description provided for @appTagline.
  ///
  /// In en, this message translates to:
  /// **'Real hours. Real shifts.'**
  String get appTagline;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get navToday;

  /// No description provided for @navHistory.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get navHistory;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @punchIn.
  ///
  /// In en, this message translates to:
  /// **'Punch In'**
  String get punchIn;

  /// No description provided for @punchOut.
  ///
  /// In en, this message translates to:
  /// **'Punch Out'**
  String get punchOut;

  /// No description provided for @punchInWithSelfie.
  ///
  /// In en, this message translates to:
  /// **'Punch In with selfie'**
  String get punchInWithSelfie;

  /// No description provided for @punchOutWithSelfie.
  ///
  /// In en, this message translates to:
  /// **'Punch Out with selfie'**
  String get punchOutWithSelfie;

  /// No description provided for @punchedIn.
  ///
  /// In en, this message translates to:
  /// **'Punched In'**
  String get punchedIn;

  /// No description provided for @punchedOut.
  ///
  /// In en, this message translates to:
  /// **'Punched Out'**
  String get punchedOut;

  /// No description provided for @punchInLocked.
  ///
  /// In en, this message translates to:
  /// **'Punch In locked'**
  String get punchInLocked;

  /// No description provided for @insideSite.
  ///
  /// In en, this message translates to:
  /// **'Inside site'**
  String get insideSite;

  /// No description provided for @outsideSite.
  ///
  /// In en, this message translates to:
  /// **'Outside site'**
  String get outsideSite;

  /// No description provided for @refreshLocation.
  ///
  /// In en, this message translates to:
  /// **'Refresh location'**
  String get refreshLocation;

  /// No description provided for @requestApproval.
  ///
  /// In en, this message translates to:
  /// **'Request approval'**
  String get requestApproval;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View all'**
  String get viewAll;

  /// No description provided for @todaysSessions.
  ///
  /// In en, this message translates to:
  /// **'Today\'s sessions'**
  String get todaysSessions;

  /// No description provided for @workedToday.
  ///
  /// In en, this message translates to:
  /// **'Worked today'**
  String get workedToday;

  /// No description provided for @currentStatus.
  ///
  /// In en, this message translates to:
  /// **'Current status'**
  String get currentStatus;

  /// No description provided for @lastOut.
  ///
  /// In en, this message translates to:
  /// **'Last out'**
  String get lastOut;

  /// No description provided for @lastIn.
  ///
  /// In en, this message translates to:
  /// **'Last in'**
  String get lastIn;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @selfieVerified.
  ///
  /// In en, this message translates to:
  /// **'Selfie verified'**
  String get selfieVerified;

  /// No description provided for @livenessPassed.
  ///
  /// In en, this message translates to:
  /// **'Liveness check passed'**
  String get livenessPassed;

  /// No description provided for @siteEmployee.
  ///
  /// In en, this message translates to:
  /// **'Site employee'**
  String get siteEmployee;

  /// No description provided for @officeEmployee.
  ///
  /// In en, this message translates to:
  /// **'Office employee'**
  String get officeEmployee;

  /// No description provided for @present.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get present;

  /// No description provided for @late.
  ///
  /// In en, this message translates to:
  /// **'Late'**
  String get late;

  /// No description provided for @halfDay.
  ///
  /// In en, this message translates to:
  /// **'Half day'**
  String get halfDay;

  /// No description provided for @absent.
  ///
  /// In en, this message translates to:
  /// **'Absent'**
  String get absent;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Selfie + site-location attendance for site and office teams.'**
  String get loginSubtitle;

  /// No description provided for @mobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Mobile number'**
  String get mobileNumber;

  /// No description provided for @enterMobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Enter 10-digit mobile number'**
  String get enterMobileNumber;

  /// No description provided for @invalidMobileNumber.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid 10-digit mobile number'**
  String get invalidMobileNumber;

  /// No description provided for @sendOtp.
  ///
  /// In en, this message translates to:
  /// **'Send OTP'**
  String get sendOtp;

  /// No description provided for @verifyOtp.
  ///
  /// In en, this message translates to:
  /// **'Verify OTP'**
  String get verifyOtp;

  /// No description provided for @enterOtpSentTo.
  ///
  /// In en, this message translates to:
  /// **'Enter OTP sent by SMS'**
  String get enterOtpSentTo;

  /// No description provided for @resendOtpIn.
  ///
  /// In en, this message translates to:
  /// **'Resend OTP in 00:{seconds}'**
  String resendOtpIn(Object seconds);

  /// No description provided for @resendOtp.
  ///
  /// In en, this message translates to:
  /// **'Resend OTP'**
  String get resendOtp;

  /// No description provided for @invalidOtp.
  ///
  /// In en, this message translates to:
  /// **'Invalid OTP. Use 123456 to continue.'**
  String get invalidOtp;

  /// No description provided for @phoneRegistrationNotice.
  ///
  /// In en, this message translates to:
  /// **'This phone will be registered to your account. To switch phones later, ask your admin.'**
  String get phoneRegistrationNotice;

  /// No description provided for @permissionsTitle.
  ///
  /// In en, this message translates to:
  /// **'Permissions required'**
  String get permissionsTitle;

  /// No description provided for @permissionsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'TrueShift needs camera and location access to record verified attendance.'**
  String get permissionsSubtitle;

  /// No description provided for @cameraPermissionTitle.
  ///
  /// In en, this message translates to:
  /// **'Camera access'**
  String get cameraPermissionTitle;

  /// No description provided for @cameraPermissionDesc.
  ///
  /// In en, this message translates to:
  /// **'Required for taking a live selfie during punch in and punch out.'**
  String get cameraPermissionDesc;

  /// No description provided for @locationPermissionTitle.
  ///
  /// In en, this message translates to:
  /// **'Location access'**
  String get locationPermissionTitle;

  /// No description provided for @locationPermissionDesc.
  ///
  /// In en, this message translates to:
  /// **'Required to verify that you are inside your assigned site radius.'**
  String get locationPermissionDesc;

  /// No description provided for @locationPrivacyNotice.
  ///
  /// In en, this message translates to:
  /// **'Location is only captured at the exact moment of punching. We never track your background location.'**
  String get locationPrivacyNotice;

  /// No description provided for @continueButton.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueButton;

  /// No description provided for @assignedLocations.
  ///
  /// In en, this message translates to:
  /// **'Assigned Work Locations'**
  String get assignedLocations;

  /// No description provided for @employmentDetails.
  ///
  /// In en, this message translates to:
  /// **'Employment Details'**
  String get employmentDetails;

  /// No description provided for @shiftTiming.
  ///
  /// In en, this message translates to:
  /// **'Shift Timing'**
  String get shiftTiming;

  /// No description provided for @reportingManager.
  ///
  /// In en, this message translates to:
  /// **'Reporting Manager'**
  String get reportingManager;

  /// No description provided for @registeredPhone.
  ///
  /// In en, this message translates to:
  /// **'Registered Phone'**
  String get registeredPhone;

  /// No description provided for @deviceBinding.
  ///
  /// In en, this message translates to:
  /// **'Device Binding'**
  String get deviceBinding;

  /// No description provided for @appSettings.
  ///
  /// In en, this message translates to:
  /// **'App Settings'**
  String get appSettings;

  /// No description provided for @appLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get appLanguage;

  /// No description provided for @punchOutReminder.
  ///
  /// In en, this message translates to:
  /// **'Punch-out Reminder'**
  String get punchOutReminder;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logout;

  /// No description provided for @logoutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Log out?'**
  String get logoutConfirmTitle;

  /// No description provided for @logoutConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to log out? You will need your registered mobile number to log back in.'**
  String get logoutConfirmMessage;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @primaryLocation.
  ///
  /// In en, this message translates to:
  /// **'Primary'**
  String get primaryLocation;

  /// No description provided for @boundDevice.
  ///
  /// In en, this message translates to:
  /// **'Bound to this device (Samsung Galaxy M34)'**
  String get boundDevice;

  /// No description provided for @offlineMode.
  ///
  /// In en, this message translates to:
  /// **'Offline Mode'**
  String get offlineMode;

  /// No description provided for @offlineModeDesc.
  ///
  /// In en, this message translates to:
  /// **'Punches are stored locally and will sync when network connects.'**
  String get offlineModeDesc;

  /// No description provided for @pendingSync.
  ///
  /// In en, this message translates to:
  /// **'Pending Sync'**
  String get pendingSync;

  /// No description provided for @mockLocationDetected.
  ///
  /// In en, this message translates to:
  /// **'Mock Location Detected'**
  String get mockLocationDetected;

  /// No description provided for @mockLocationDesc.
  ///
  /// In en, this message translates to:
  /// **'Fake GPS or developer mock location is active. Disable it to punch.'**
  String get mockLocationDesc;

  /// No description provided for @mockLocationBlocked.
  ///
  /// In en, this message translates to:
  /// **'Mock Location Blocked'**
  String get mockLocationBlocked;

  /// No description provided for @nearSiteBoundary.
  ///
  /// In en, this message translates to:
  /// **'Near Site Boundary'**
  String get nearSiteBoundary;

  /// No description provided for @nearBoundaryDesc.
  ///
  /// In en, this message translates to:
  /// **'You are near the geofence perimeter. Ensure GPS accuracy before punching.'**
  String get nearBoundaryDesc;

  /// No description provided for @batteryGuideTitle.
  ///
  /// In en, this message translates to:
  /// **'Battery Optimization Guide'**
  String get batteryGuideTitle;

  /// No description provided for @batteryGuideSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Prevent GPS sleep and background kill on construction devices'**
  String get batteryGuideSubtitle;

  /// No description provided for @batteryGuideHeading.
  ///
  /// In en, this message translates to:
  /// **'Keep TrueShift Unrestricted'**
  String get batteryGuideHeading;

  /// No description provided for @understood.
  ///
  /// In en, this message translates to:
  /// **'Understood'**
  String get understood;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'hi', 'mr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'mr':
      return AppLocalizationsMr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
