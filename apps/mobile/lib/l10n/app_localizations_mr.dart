// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Marathi (`mr`).
class AppLocalizationsMr extends AppLocalizations {
  AppLocalizationsMr([String locale = 'mr']) : super(locale);

  @override
  String get appName => 'TrueShift';

  @override
  String get appTagline => 'खरे तास. खरी हजेरी.';

  @override
  String get navHome => 'मुख्य';

  @override
  String get navToday => 'आज';

  @override
  String get navHistory => 'इतिहास';

  @override
  String get navProfile => 'प्रोफाइल';

  @override
  String get punchIn => 'पंच इन';

  @override
  String get punchOut => 'पंच आउट';

  @override
  String get punchInWithSelfie => 'सेल्फीसह पंच इन करा';

  @override
  String get punchOutWithSelfie => 'सेल्फीसह पंच आउट करा';

  @override
  String get punchedIn => 'पंच इन केले';

  @override
  String get punchedOut => 'पंच आउट केले';

  @override
  String get punchInLocked => 'पंच इन लॉक आहे';

  @override
  String get insideSite => 'साइटच्या आत';

  @override
  String get outsideSite => 'साइटच्या बाहेर';

  @override
  String get refreshLocation => 'स्थान रीफ्रेश करा';

  @override
  String get requestApproval => 'मंजुरीसाठी विनंती करा';

  @override
  String get viewAll => 'सर्व पहा';

  @override
  String get todaysSessions => 'आजची सत्रे';

  @override
  String get workedToday => 'आजचे कामाचे तास';

  @override
  String get currentStatus => 'सध्याची स्थिती';

  @override
  String get lastOut => 'शेवटचे आउट';

  @override
  String get lastIn => 'शेवटचे इन';

  @override
  String get done => 'पूर्ण';

  @override
  String get selfieVerified => 'सेल्फी पडताळली';

  @override
  String get livenessPassed => 'थेट फोटो यशस्वी';

  @override
  String get siteEmployee => 'साइट कर्मचारी';

  @override
  String get officeEmployee => 'कार्यालय कर्मचारी';

  @override
  String get present => 'हजर';

  @override
  String get late => 'उशीर';

  @override
  String get halfDay => 'अर्धा दिवस';

  @override
  String get absent => 'गैरहजर';

  @override
  String get login => 'लॉगिन';

  @override
  String get loginSubtitle =>
      'साइट आणि कार्यालय कर्मचाऱ्यांसाठी सेल्फी आणि स्थान हजेरी.';

  @override
  String get mobileNumber => 'मोबाइल नंबर';

  @override
  String get enterMobileNumber => '१० अंकी मोबाइल नंबर टाका';

  @override
  String get invalidMobileNumber => 'कृपया वैध १० अंकी मोबाइल नंबर टाका';

  @override
  String get sendOtp => 'ओटीपी पाठवा';

  @override
  String get verifyOtp => 'ओटीपी तपासा';

  @override
  String get enterOtpSentTo => 'एसएमएस द्वारे पाठवलेला ओटीपी टाका';

  @override
  String resendOtpIn(Object seconds) {
    return 'ओटीपी पुन्हा पाठवा ००:$seconds';
  }

  @override
  String get resendOtp => 'ओटीपी पुन्हा पाठवा';

  @override
  String get invalidOtp => 'अवैध ओटीपी. पुढे जाण्यासाठी 123456 टाका.';

  @override
  String get phoneRegistrationNotice =>
      'हा फोन तुमच्या खात्याशी जोडला जाईल. फोन बदलण्यासाठी, तुमच्या ॲडमिनशी संपर्क साधा.';

  @override
  String get permissionsTitle => 'परवानग्या आवश्यक आहेत';

  @override
  String get permissionsSubtitle =>
      'हजेरी नोंदवण्यासाठी कॅमेरा आणि स्थानाची परवानगी आवश्यक आहे.';

  @override
  String get cameraPermissionTitle => 'कॅमेरा परवानगी';

  @override
  String get cameraPermissionDesc =>
      'पंच इन आणि पंच आउट करताना थेट सेल्फी घेण्यासाठी आवश्यक.';

  @override
  String get locationPermissionTitle => 'स्थान (जीपीएस) परवानगी';

  @override
  String get locationPermissionDesc =>
      'तुम्ही नियुक्त केलेल्या साइटच्या आत आहात हे तपासण्यासाठी आवश्यक.';

  @override
  String get locationPrivacyNotice =>
      'स्थान फक्त पंच करतानाच तपासले जाते. आम्ही तुम्हाला ट्रॅक करत नाही.';

  @override
  String get continueButton => 'पुढे जा';

  @override
  String get assignedLocations => 'नियुक्त कामाची स्थाने';

  @override
  String get employmentDetails => 'कामाचा तपशील';

  @override
  String get shiftTiming => 'शिफ्ट वेळ';

  @override
  String get reportingManager => 'रिपोर्टिंग मॅनेजर';

  @override
  String get registeredPhone => 'नोंदणीकृत फोन';

  @override
  String get deviceBinding => 'डिव्हाइस बंधन';

  @override
  String get appSettings => 'ॲप सेटिंग्ज';

  @override
  String get appLanguage => 'भाषा';

  @override
  String get punchOutReminder => 'पंच-आउट स्मरणपत्र';

  @override
  String get logout => 'लॉग आउट';

  @override
  String get logoutConfirmTitle => 'लॉग आउट करायचे?';

  @override
  String get logoutConfirmMessage =>
      'तुम्हाला खरंच लॉग आउट करायचे आहे का? पुन्हा लॉगिन करण्यासाठी तुमचा नोंदणीकृत मोबाइल नंबर लागेल.';

  @override
  String get cancel => 'रद्द करा';

  @override
  String get primaryLocation => 'प्राथमिक';

  @override
  String get boundDevice => 'या डिव्हाइसशी जोडलेले (Samsung Galaxy M34)';

  @override
  String get offlineMode => 'ऑफलाइन मोड';

  @override
  String get offlineModeDesc =>
      'पंच स्थानिक पातळीवर जतन केले जातील आणि नेटवर्क आल्यावर सिंक होतील.';

  @override
  String get pendingSync => 'सिंक प्रलंबित';

  @override
  String get mockLocationDetected => 'बनावट लोकेशन आढळले';

  @override
  String get mockLocationDesc =>
      'बनावट जीपीएस किंवा मॉक लोकेशन ॲप सक्रिय आहे. पंच करण्यासाठी ते बंद करा.';

  @override
  String get mockLocationBlocked => 'मॉक लोकेशन ब्लॉक केले';

  @override
  String get nearSiteBoundary => 'साइट सीमेजवळ';

  @override
  String get nearBoundaryDesc =>
      'तुम्ही जिओफेन्स सीमेजवळ आहात. पंच करण्यापूर्वी जीपीएस अचूकता तपासा.';

  @override
  String get batteryGuideTitle => 'बॅटरी ऑप्टिमायझेशन मार्गदर्शन';

  @override
  String get batteryGuideSubtitle =>
      'जीपीएस स्लीप आणि बॅकग्राउंड किल थांबवण्यासाठी';

  @override
  String get batteryGuideHeading => 'TrueShift अनियंत्रित ठेवा';

  @override
  String get understood => 'समजले';
}
