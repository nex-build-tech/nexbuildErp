// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hindi (`hi`).
class AppLocalizationsHi extends AppLocalizations {
  AppLocalizationsHi([String locale = 'hi']) : super(locale);

  @override
  String get appName => 'TrueShift';

  @override
  String get appTagline => 'सही घंटे. सही हाजिरी.';

  @override
  String get navHome => 'होम';

  @override
  String get navToday => 'आज';

  @override
  String get navHistory => 'इतिहास';

  @override
  String get navProfile => 'प्रोफ़ाइल';

  @override
  String get punchIn => 'पंच इन';

  @override
  String get punchOut => 'पंच आउट';

  @override
  String get punchInWithSelfie => 'सेल्फी के साथ पंच इन करें';

  @override
  String get punchOutWithSelfie => 'सेल्फी के साथ पंच आउट करें';

  @override
  String get punchedIn => 'पंच इन किया';

  @override
  String get punchedOut => 'पंच आउट किया';

  @override
  String get punchInLocked => 'पंच इन लॉक है';

  @override
  String get insideSite => 'साइट के अंदर';

  @override
  String get outsideSite => 'साइट के बाहर';

  @override
  String get refreshLocation => 'लोकेशन रीफ़्रेश करें';

  @override
  String get requestApproval => 'स्वीकृति का अनुरोध करें';

  @override
  String get viewAll => 'सभी देखें';

  @override
  String get todaysSessions => 'आज के सत्र';

  @override
  String get workedToday => 'आज का काम';

  @override
  String get currentStatus => 'वर्तमान स्थिति';

  @override
  String get lastOut => 'अंतिम आउट';

  @override
  String get lastIn => 'अंतिम इन';

  @override
  String get done => 'पूर्ण';

  @override
  String get selfieVerified => 'सेल्फी सत्यापित';

  @override
  String get livenessPassed => 'लाइव फोटो सफल';

  @override
  String get siteEmployee => 'साइट कर्मचारी';

  @override
  String get officeEmployee => 'कार्यालय कर्मचारी';

  @override
  String get present => 'उपस्थित';

  @override
  String get late => 'देरी';

  @override
  String get halfDay => 'आधा दिन';

  @override
  String get absent => 'अनुपस्थित';

  @override
  String get login => 'लॉग इन';

  @override
  String get loginSubtitle =>
      'साइट और ऑफिस टीम के लिए सेल्फी और लोकेशन आधारित हाजिरी।';

  @override
  String get mobileNumber => 'मोबाइल नंबर';

  @override
  String get enterMobileNumber => '१० अंकों का मोबाइल नंबर दर्ज करें';

  @override
  String get invalidMobileNumber =>
      'कृपया १० अंकों का वैध मोबाइल नंबर दर्ज करें';

  @override
  String get sendOtp => 'ओटीपी भेजें';

  @override
  String get verifyOtp => 'ओटीपी सत्यापित करें';

  @override
  String get enterOtpSentTo => 'एसएमएस द्वारा भेजा गया ओटीपी दर्ज करें';

  @override
  String resendOtpIn(Object seconds) {
    return 'ओटीपी फिर से भेजें ००:$seconds';
  }

  @override
  String get resendOtp => 'ओटीपी फिर से भेजें';

  @override
  String get invalidOtp => 'अमान्य ओटीपी। आगे बढ़ने के लिए 123456 दर्ज करें।';

  @override
  String get phoneRegistrationNotice =>
      'यह फोन आपके खाते से पंजीकृत किया जाएगा। फोन बदलने के लिए एडमिन से संपर्क करें।';

  @override
  String get permissionsTitle => 'अनुमतियां आवश्यक हैं';

  @override
  String get permissionsSubtitle =>
      'हाजिरी दर्ज करने के लिए कैमरा और लोकेशन अनुमति आवश्यक है।';

  @override
  String get cameraPermissionTitle => 'कैमरा अनुमति';

  @override
  String get cameraPermissionDesc =>
      'पंच इन और पंच आउट के दौरान लाइव सेल्फी लेने के लिए आवश्यक।';

  @override
  String get locationPermissionTitle => 'लोकेशन अनुमति';

  @override
  String get locationPermissionDesc =>
      'यह सत्यापित करने के लिए कि आप निर्धारित साइट के अंदर हैं।';

  @override
  String get locationPrivacyNotice =>
      'लोकेशन केवल पंच करने के समय जांची जाती है। हम आपको ट्रैक नहीं करते।';

  @override
  String get continueButton => 'जारी रखें';

  @override
  String get assignedLocations => 'निर्धारित कार्य स्थान';

  @override
  String get employmentDetails => 'रोजगार विवरण';

  @override
  String get shiftTiming => 'शिफ्ट समय';

  @override
  String get reportingManager => 'रिपोर्टिंग मैनेजर';

  @override
  String get registeredPhone => 'पंजीकृत फोन';

  @override
  String get deviceBinding => 'डिवाइस बाइंडिंग';

  @override
  String get appSettings => 'ऐप सेटिंग्स';

  @override
  String get appLanguage => 'भाषा';

  @override
  String get punchOutReminder => 'पंच-आउट रिमाइंडर';

  @override
  String get logout => 'लॉग आउट';

  @override
  String get logoutConfirmTitle => 'लॉग आउट करें?';

  @override
  String get logoutConfirmMessage =>
      'क्या आप वाकई लॉग आउट करना चाहते हैं? दोबारा लॉगिन करने के लिए आपके पंजीकृत मोबाइल नंबर की आवश्यकता होगी।';

  @override
  String get cancel => 'रद्द करें';

  @override
  String get primaryLocation => 'प्राथमिक';

  @override
  String get boundDevice => 'इस डिवाइस से जुड़ा हुआ (Samsung Galaxy M34)';

  @override
  String get offlineMode => 'ऑफ़लाइन मोड';

  @override
  String get offlineModeDesc =>
      'पंच स्थानीय रूप से संग्रहीत होंगे और नेटवर्क आने पर सिंक होंगे।';

  @override
  String get pendingSync => 'सिंक लंबित';

  @override
  String get mockLocationDetected => 'मॉक लोकेशन का पता चला';

  @override
  String get mockLocationDesc =>
      'फेक जीपीएस या मॉक लोकेशन ऐप सक्रिय है। पंच करने के लिए इसे बंद करें।';

  @override
  String get mockLocationBlocked => 'मॉक लोकेशन ब्लॉक किया गया';

  @override
  String get nearSiteBoundary => 'साइट सीमा के निकट';

  @override
  String get nearBoundaryDesc =>
      'आप जियोफेंस परिधि के पास हैं। पंच करने से पहले जीपीएस सटीकता सुनिश्चित करें।';

  @override
  String get batteryGuideTitle => 'बैटरी ऑप्टिमाइज़ेशन गाइड';

  @override
  String get batteryGuideSubtitle =>
      'जीपीएस स्लीप और बैकग्राउंड किल रोकने के लिए';

  @override
  String get batteryGuideHeading => 'TrueShift को अनरेस्ट्रिक्टेड रखें';

  @override
  String get understood => 'समझ गया';
}
