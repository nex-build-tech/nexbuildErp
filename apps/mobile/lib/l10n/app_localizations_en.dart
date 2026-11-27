// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'TrueShift';

  @override
  String get appTagline => 'Real hours. Real shifts.';

  @override
  String get navHome => 'Home';

  @override
  String get navToday => 'Today';

  @override
  String get navHistory => 'History';

  @override
  String get navProfile => 'Profile';

  @override
  String get punchIn => 'Punch In';

  @override
  String get punchOut => 'Punch Out';

  @override
  String get punchInWithSelfie => 'Punch In with selfie';

  @override
  String get punchOutWithSelfie => 'Punch Out with selfie';

  @override
  String get punchedIn => 'Punched In';

  @override
  String get punchedOut => 'Punched Out';

  @override
  String get punchInLocked => 'Punch In locked';

  @override
  String get insideSite => 'Inside site';

  @override
  String get outsideSite => 'Outside site';

  @override
  String get refreshLocation => 'Refresh location';

  @override
  String get requestApproval => 'Request approval';

  @override
  String get viewAll => 'View all';

  @override
  String get todaysSessions => 'Today\'s sessions';

  @override
  String get workedToday => 'Worked today';

  @override
  String get currentStatus => 'Current status';

  @override
  String get lastOut => 'Last out';

  @override
  String get lastIn => 'Last in';

  @override
  String get done => 'Done';

  @override
  String get selfieVerified => 'Selfie verified';

  @override
  String get livenessPassed => 'Liveness check passed';

  @override
  String get siteEmployee => 'Site employee';

  @override
  String get officeEmployee => 'Office employee';

  @override
  String get present => 'Present';

  @override
  String get late => 'Late';

  @override
  String get halfDay => 'Half day';

  @override
  String get absent => 'Absent';

  @override
  String get login => 'Login';

  @override
  String get loginSubtitle =>
      'Selfie + site-location attendance for site and office teams.';

  @override
  String get mobileNumber => 'Mobile number';

  @override
  String get enterMobileNumber => 'Enter 10-digit mobile number';

  @override
  String get invalidMobileNumber =>
      'Please enter a valid 10-digit mobile number';

  @override
  String get sendOtp => 'Send OTP';

  @override
  String get verifyOtp => 'Verify OTP';

  @override
  String get enterOtpSentTo => 'Enter OTP sent by SMS';

  @override
  String resendOtpIn(Object seconds) {
    return 'Resend OTP in 00:$seconds';
  }

  @override
  String get resendOtp => 'Resend OTP';

  @override
  String get invalidOtp => 'Invalid OTP. Use 123456 to continue.';

  @override
  String get phoneRegistrationNotice =>
      'This phone will be registered to your account. To switch phones later, ask your admin.';

  @override
  String get permissionsTitle => 'Permissions required';

  @override
  String get permissionsSubtitle =>
      'TrueShift needs camera and location access to record verified attendance.';

  @override
  String get cameraPermissionTitle => 'Camera access';

  @override
  String get cameraPermissionDesc =>
      'Required for taking a live selfie during punch in and punch out.';

  @override
  String get locationPermissionTitle => 'Location access';

  @override
  String get locationPermissionDesc =>
      'Required to verify that you are inside your assigned site radius.';

  @override
  String get locationPrivacyNotice =>
      'Location is only captured at the exact moment of punching. We never track your background location.';

  @override
  String get continueButton => 'Continue';

  @override
  String get assignedLocations => 'Assigned Work Locations';

  @override
  String get employmentDetails => 'Employment Details';

  @override
  String get shiftTiming => 'Shift Timing';

  @override
  String get reportingManager => 'Reporting Manager';

  @override
  String get registeredPhone => 'Registered Phone';

  @override
  String get deviceBinding => 'Device Binding';

  @override
  String get appSettings => 'App Settings';

  @override
  String get appLanguage => 'Language';

  @override
  String get punchOutReminder => 'Punch-out Reminder';

  @override
  String get logout => 'Log Out';

  @override
  String get logoutConfirmTitle => 'Log out?';

  @override
  String get logoutConfirmMessage =>
      'Are you sure you want to log out? You will need your registered mobile number to log back in.';

  @override
  String get cancel => 'Cancel';

  @override
  String get primaryLocation => 'Primary';

  @override
  String get boundDevice => 'Bound to this device (Samsung Galaxy M34)';

  @override
  String get offlineMode => 'Offline Mode';

  @override
  String get offlineModeDesc =>
      'Punches are stored locally and will sync when network connects.';

  @override
  String get pendingSync => 'Pending Sync';

  @override
  String get mockLocationDetected => 'Mock Location Detected';

  @override
  String get mockLocationDesc =>
      'Fake GPS or developer mock location is active. Disable it to punch.';

  @override
  String get mockLocationBlocked => 'Mock Location Blocked';

  @override
  String get nearSiteBoundary => 'Near Site Boundary';

  @override
  String get nearBoundaryDesc =>
      'You are near the geofence perimeter. Ensure GPS accuracy before punching.';

  @override
  String get batteryGuideTitle => 'Battery Optimization Guide';

  @override
  String get batteryGuideSubtitle =>
      'Prevent GPS sleep and background kill on construction devices';

  @override
  String get batteryGuideHeading => 'Keep TrueShift Unrestricted';

  @override
  String get understood => 'Understood';
}
