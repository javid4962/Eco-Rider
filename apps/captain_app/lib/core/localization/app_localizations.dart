import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

/// EcoRide Localized Content Infrastructure for Captain Mobile App (EV-021)
/// Supports Telugu ('te') and English ('en') with automatic fallback for missing translations.
class AppLocalizations {
  final Locale locale;

  AppLocalizations(this.locale);

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('te'));
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [
    Locale('te'), // Telugu (Default for Andhra Pradesh)
    Locale('en'), // English (Universal Fallback)
  ];

  // ---------------------------------------------------------------------------
  // String Dictionaries
  // ---------------------------------------------------------------------------

  static const Map<String, String> _enStrings = {
    // App & Branding
    'app_name': 'EcoRide Captain',
    'electric_tag': '100% ELECTRIC',
    'pilot_corridor': 'Visakhapatnam Corridor',

    // Captain Duty & Telematics
    'duty_active': 'DUTY ACTIVE',
    'duty_offline': 'DUTY OFFLINE',
    'duty_active_desc': 'Online • Ready for EV dispatches',
    'duty_offline_desc': 'Offline • Dispatches paused',
    'ev_battery_feasibility': 'EV Battery Feasibility',
    'battery_soc_optimal': 'Battery SoC: 85% • Optimal Range (~68 km)',
    'battery_soc_min_warning': 'Minimum 20% required for dispatch matching.',
    'assigned_pilot_zone': 'Assigned Pilot Zone: Visakhapatnam Corridor',
    'go_online': 'Go Online',
    'go_offline': 'Go Offline',

    // Booking & Dispatch
    'new_dispatch_request': 'New EV Ride Request Nearby',
    'accept_ride': 'Accept Ride',
    'reject_ride': 'Decline',
    'pickup_passenger': 'Pickup Commuter',
    'start_trip': 'Start EV Ride',
    'enter_start_otp': 'Enter 4-digit Ride Start OTP',
    'complete_trip': 'Complete Ride',
    'trip_completed_success': 'Ride completed successfully. Earnings credited.',

    // Payment & Earnings
    'fare_earnings': 'Trip Earnings: ₹{amount}',
    'cash_collected': 'Cash Collected: ₹{amount}',
    'digital_payment_confirmed': 'Online payment confirmed via UPI.',
    'payout_scheduled': 'Payout scheduled to your registered bank account.',

    // Safety & SOS
    'emergency_sos': 'Captain Emergency SOS',
    'safety_support': '24/7 Safety Dispatch Desk',
    'roadside_ev_assistance': 'EV Roadside & Battery Assistance',
    'sos_dispatched': 'Emergency signal transmitted. Safety team contacting you.',

    // Error Messages
    'network_error': 'Network connection lost. Please check telemetry signal.',
    'battery_too_low': 'Battery SoC below 20%. Please recharge at hub.',
    'shift_limit_reached': 'Maximum duty hours reached. Rest mandated.',
    'invalid_otp': 'Incorrect Ride OTP entered. Please verify with passenger.',
    'general_error': 'An unexpected error occurred. Please try again.',

    // UI Controls
    'switch_language': 'Language / భాష',
    'language_english': 'English',
    'language_telugu': 'తెలుగు',

    // Onboarding & Registration (EV-026)
    'captain_onboarding_title': 'EV Captain Onboarding',
    'step_phone_login': 'Login',
    'step_personal': 'Personal Details',
    'step_vehicle': 'EV Details',
    'step_documents': 'Documents',
    'step_preview': 'Preview & Submit',
    'phone_number_label': 'Mobile Number (+91)',
    'phone_hint': '+91 9876543210',
    'send_otp': 'Send Verification Code',
    'otp_label': 'Enter 6-Digit OTP',
    'verify_otp': 'Verify & Proceed',
    'resend_otp': 'Resend OTP',
    'resend_in_seconds': 'Resend code in {seconds}s',
    'full_name': 'Full Legal Name',
    'dob': 'Date of Birth (YYYY-MM-DD)',
    'driving_license_number': 'Driving License Number',
    'driving_license_expiry': 'Driving License Expiry Date',
    'badge_number': 'Commercial Badge Number (Optional)',
    'emergency_contact_name': 'Emergency Contact Person Name',
    'emergency_contact_phone': 'Emergency Contact Phone (+91)',
    'select_city': 'Select AP Operating City',
    'vehicle_ownership': 'Vehicle Ownership',
    'vehicle_ownership_owned': 'Owned EV',
    'vehicle_ownership_fleet': 'Fleet Partner EV',
    'vehicle_ownership_leased': 'Leased EV',
    'vehicle_category': 'Vehicle Category',
    'category_2w': '2W Commercial EV',
    'category_3w': '3W Electric Auto',
    'category_4w': '4W Electric Cab',
    'ev_only_assurance': '100% Battery Electric Vehicle (BEV) Only',
    'non_ev_warning': 'Petroleum / CNG vehicles are strictly rejected server-side.',
    'vehicle_make': 'Vehicle Make / Manufacturer',
    'vehicle_model': 'Vehicle Model',
    'vehicle_year': 'Manufacturing Year',
    'registration_number': 'AP Green-Plate Registration (e.g. AP31EV1234)',
    'battery_capacity': 'Battery Pack Capacity (kWh)',
    'upload_document': 'Upload File / Take Photo',
    'upload_in_progress': 'Uploading...',
    'upload_interrupted': 'Upload interrupted. Tap to resume/retry.',
    'retry_upload': 'Retry Upload',
    'camera_denied_title': 'Camera Access Denied',
    'camera_denied_desc': 'Camera access was denied. Please allow camera in settings or pick a file.',
    'pick_from_gallery': 'Pick File from Storage',
    'slow_network_banner': 'Uploading over slow connection... please wait.',
    'uploaded_verified': 'Document Uploaded',
    'statutory_declaration': 'I certify that this vehicle is 100% Battery Electric and all uploaded details are genuine under AP transport regulations.',
    'submit_application': 'Submit for Review',
    'submitting_application': 'Submitting to fleet operations...',
    'edit_section': 'Edit',
    'save_and_continue': 'Save & Continue',
    'application_status_title': 'Application Status',
    'application_submitted_msg': 'Your EV captain application is under review by AP Fleet Ops.',
    'application_rejected_msg': 'Application needs correction. Edit draft and resubmit.',
    'edit_draft_resubmit': 'Edit Draft & Resubmit',
    'prev_step': 'Back',
    'next_step': 'Next',
  };

  static const Map<String, String> _teStrings = {
    // App & Branding
    'app_name': 'ఈకోరైడ్ కెప్టెన్',
    'electric_tag': '100% ఎలక్ట్రిక్',
    'pilot_corridor': 'విశాఖపట్నం కారిడార్',

    // Captain Duty & Telematics
    'duty_active': 'డ్యూటీలో ఉన్నారు',
    'duty_offline': 'డ్యూటీ ఆఫ్ లో ఉంది',
    'duty_active_desc': 'ఆన్‌లైన్ • ఈవీ రైడ్స్ కోసం సిద్ధంగా ఉన్నారు',
    'duty_offline_desc': 'ఆఫ్‌లైన్ • డిస్పాచ్‌లు నిలిపివేయబడ్డాయి',
    'ev_battery_feasibility': 'ఈవీ బ్యాటరీ లభ్యత',
    'battery_soc_optimal': 'బ్యాటరీ: 85% • పరిధి (~68 కిమీ)',
    'battery_soc_min_warning': 'డిస్పాచ్ కోసం కనీసం 20% ఛార్జ్ అవసరం.',
    'assigned_pilot_zone': 'కేటాయించిన పైలట్ జోన్: విశాఖపట్నం కారిడార్',
    'go_online': 'డ్యూటీ ప్రారంభించండి',
    'go_offline': 'డ్యూటీ ఆపండి',

    // Booking & Dispatch
    'new_dispatch_request': 'కొత్త ఈవీ రైడ్ అభ్యర్థన వచ్చింది',
    'accept_ride': 'రైడ్ అంగీకరించండి',
    'reject_ride': 'తిరస్కరించండి',
    'pickup_passenger': 'ప్రయాణికుడిని పికప్ చేయండి',
    'start_trip': 'రైడ్ ప్రారంభించండి',
    'enter_start_otp': '4 అంకెల రైడ్ స్టార్ట్ ఓటీపీ నమోదు చేయండి',
    'complete_trip': 'రైడ్ పూర్తి చేయండి',
    'trip_completed_success': 'రైడ్ విజయవంతంగా పూర్తయింది. ఆదాయం చేర్చబడింది.',

    // Payment & Earnings
    'fare_earnings': 'రైడ్ ఆదాయం: ₹{amount}',
    'cash_collected': 'నగదు స్వీకరించబడింది: ₹{amount}',
    'digital_payment_confirmed': 'యూపీఐ ద్వారా ఆన్‌లైన్ చెల్లింపు పూర్తయింది.',
    'payout_scheduled': 'మీ బ్యాంకు ఖాతాకు చెల్లింపు షెడ్యూల్ చేయబడింది.',

    // Safety & SOS
    'emergency_sos': 'కెప్టెన్ అత్యవసర ఎస్ఓఎస్',
    'safety_support': '24/7 భద్రతా హెల్ప్‌డెస్క్',
    'roadside_ev_assistance': 'ఈవీ రోడ్‌సైడ్ మరియు బ్యాటరీ సహాయం',
    'sos_dispatched': 'అత్యవసర సిగ్నల్ పంపబడింది. భద్రతా బృందం మిమ్మల్ని సంప్రదిస్తుంది.',

    // Error Messages
    'network_error': 'నెట్‌వర్క్ సిగ్నల్ కోల్పోయింది. దయచేసి తనిఖీ చేయండి.',
    'battery_too_low': 'బ్యాటరీ 20% కంటే తక్కువగా ఉంది. దయచేసి హబ్‌లో ఛార్జ్ చేయండి.',
    'shift_limit_reached': 'గరిష్ట డ్యూటీ సమయం ముగిసింది. దయచేసి విశ్రాంతి తీసుకోండి.',
    'invalid_otp': 'తప్పు రైడ్ ఓటీపీ నమోదు చేయబడింది. ప్రయాణికుడితో సరిచూసుకోండి.',
    'general_error': 'లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',

    // UI Controls
    'switch_language': 'భాష / Language',
    'language_english': 'English',
    'language_telugu': 'తెలుగు',

    // Onboarding & Registration (EV-026)
    'captain_onboarding_title': 'ఈవీ కెప్టెన్ నమోదు',
    'step_phone_login': 'లాగిన్',
    'step_personal': 'వ్యక్తిగత వివరాలు',
    'step_vehicle': 'ఈవీ వివరాలు',
    'step_documents': 'పత్రాలు',
    'step_preview': 'సమీక్ష & సమర్పణ',
    'phone_number_label': 'మొబైల్ సంఖ్య (+91)',
    'phone_hint': '+91 9876543210',
    'send_otp': 'ధృవీకరణ కోడ్ పంపండి',
    'otp_label': '6 అంకెల ఓటీపీని నమోదు చేయండి',
    'verify_otp': 'ధృవీకరించి కొనసాగించండి',
    'resend_otp': 'మళ్ళీ పంపండి',
    'resend_in_seconds': '{seconds} సెకన్లలో మళ్ళీ పంపండి',
    'full_name': 'పూర్తి పేరు (లైసెన్స్ ప్రకారం)',
    'dob': 'పుట్టిన తేదీ (YYYY-MM-DD)',
    'driving_license_number': 'డ్రైవింగ్ లైసెన్స్ సంఖ్య',
    'driving_license_expiry': 'లైసెన్స్ గడువు తేదీ',
    'badge_number': 'రవాణా బ్యాడ్జ్ సంఖ్య (ఐచ్ఛికం)',
    'emergency_contact_name': 'అత్యవసర సంప్రదింపు వ్యక్తి పేరు',
    'emergency_contact_phone': 'అత్యవసర సంప్రదింపు ఫోన్ (+91)',
    'select_city': 'ఆపరేటింగ్ నగరం ఎంచుకోండి',
    'vehicle_ownership': 'వాహన యాజమాన్యం',
    'vehicle_ownership_owned': 'స్వంత ఈవీ',
    'vehicle_ownership_fleet': 'ఫ్లీట్ భాగస్వామి ఈవీ',
    'vehicle_ownership_leased': 'లీజుకు తీసుకున్న ఈవీ',
    'vehicle_category': 'వాహన వర్గం',
    'category_2w': '2W వాణిజ్య ఈవీ',
    'category_3w': '3W ఎలక్ట్రిక్ ఆటో',
    'category_4w': '4W ఎలక్ట్రిక్ క్యాబ్',
    'ev_only_assurance': '100% బ్యాటరీ ఎలక్ట్రిక్ వాహనం (ఈవీ) మాత్రమే',
    'non_ev_warning': 'పెట్రోల్/డీజిల్ వాహనాలు ఖచ్చితంగా అనుమతించబడవు.',
    'vehicle_make': 'తయారీదారు / బ్రాండ్',
    'vehicle_model': 'వాహనం మోడల్',
    'vehicle_year': 'తయారీ సంవత్సరం',
    'registration_number': 'ఏపీ గ్రీన్ ప్లేట్ సంఖ్య (ఉదా: AP31EV1234)',
    'battery_capacity': 'బ్యాటరీ సామర్థ్యం (kWh)',
    'upload_document': 'పత్రం అప్‌లోడ్ / ఫోటో తీయండి',
    'upload_in_progress': 'అప్‌లోడ్ అవుతోంది...',
    'upload_interrupted': 'అప్‌లోడ్ నిలిచిపోయింది. మళ్ళీ ప్రయత్నించండి.',
    'retry_upload': 'మళ్ళీ అప్‌లోడ్ చేయండి',
    'camera_denied_title': 'కెమెరా అనుమతి నిరాకరించబడింది',
    'camera_denied_desc': 'పత్రాల కోసం కెమెరా అనుమతి అవసరం. దయచేసి సెట్టింగ్స్‌లో అనుమతించండి.',
    'pick_from_gallery': 'స్టోరేజ్ నుండి ఎంచుకోండి',
    'slow_network_banner': 'నెట్‌వర్క్ నెమ్మదిగా ఉంది... దయచేసి వేచి ఉండండి.',
    'uploaded_verified': 'పత్రం అప్‌లోడ్ చేయబడింది',
    'statutory_declaration': 'ఈ వాహనం 100% ఎలక్ట్రిక్ అని మరియు సమర్పించిన వివరాలు నిజమని ధృవీకరిస్తున్నాను.',
    'submit_application': 'సమీక్ష కోసం సమర్పించండి',
    'submitting_application': 'దరఖాస్తు సమర్పించబడుతోంది...',
    'edit_section': 'సవరించండి',
    'save_and_continue': 'సేవ్ చేసి కొనసాగించండి',
    'application_status_title': 'దరఖాస్తు స్థితి',
    'application_submitted_msg': 'మీ ఈవీ కెప్టెన్ దరఖాస్తు సమీక్షలో ఉంది.',
    'application_rejected_msg': 'సవరణలు అవసరం. డ్రాఫ్ట్ సరిచేసి మళ్ళీ సమర్పించండి.',
    'edit_draft_resubmit': 'డ్రాఫ్ట్ సవరించి మళ్ళీ సమర్పించండి',
    'prev_step': 'వెనుకకు',
    'next_step': 'తరువాత',
  };

  /// Translate a string key into active language with automatic fallback to English.
  String translate(String key, [Map<String, String>? params]) {
    String? translation;

    if (locale.languageCode == 'te') {
      translation = _teStrings[key];
    } else {
      translation = _enStrings[key];
    }

    // Fallback: If missing in Telugu, fall back to English
    translation ??= _enStrings[key];

    // Final fallback: If missing in English as well, return key identifier
    translation ??= key;

    // Parameter interpolation: {param}
    if (params != null && params.isNotEmpty) {
      params.forEach((paramKey, paramValue) {
        translation = translation!.replaceAll('{$paramKey}', paramValue);
      });
    }

    return translation!;
  }

  // ---------------------------------------------------------------------------
  // Strongly-Typed Getters for Screen Widgets (Zero Hardcoding)
  // ---------------------------------------------------------------------------

  String get appName => translate('app_name');
  String get electricTag => translate('electric_tag');
  String get pilotCorridor => translate('pilot_corridor');

  // Duty & Telematics
  String get dutyActive => translate('duty_active');
  String get dutyOffline => translate('duty_offline');
  String get dutyActiveDesc => translate('duty_active_desc');
  String get dutyOfflineDesc => translate('duty_offline_desc');
  String get evBatteryFeasibility => translate('ev_battery_feasibility');
  String get batterySocOptimal => translate('battery_soc_optimal');
  String get batterySocMinWarning => translate('battery_soc_min_warning');
  String get assignedPilotZone => translate('assigned_pilot_zone');
  String get goOnline => translate('go_online');
  String get goOffline => translate('go_offline');

  // Dispatch & Ride
  String get newDispatchRequest => translate('new_dispatch_request');
  String get acceptRide => translate('accept_ride');
  String get rejectRide => translate('reject_ride');
  String get pickupPassenger => translate('pickup_passenger');
  String get startTrip => translate('start_trip');
  String get enterStartOtp => translate('enter_start_otp');
  String get completeTrip => translate('complete_trip');
  String get tripCompletedSuccess => translate('trip_completed_success');

  // Payment
  String fareEarnings(String amount) => translate('fare_earnings', {'amount': amount});
  String cashCollected(String amount) => translate('cash_collected', {'amount': amount});
  String get digitalPaymentConfirmed => translate('digital_payment_confirmed');
  String get payoutScheduled => translate('payout_scheduled');

  // Safety
  String get emergencySos => translate('emergency_sos');
  String get safetySupport => translate('safety_support');
  String get roadsideEvAssistance => translate('roadside_ev_assistance');
  String get sosDispatched => translate('sos_dispatched');

  // Errors
  String get networkError => translate('network_error');
  String get batteryTooLow => translate('battery_too_low');
  String get shiftLimitReached => translate('shift_limit_reached');
  String get invalidOtp => translate('invalid_otp');
  String get generalError => translate('general_error');

  // UI
  String get switchLanguage => translate('switch_language');
  String get languageEnglish => translate('language_english');
  String get languageTelugu => translate('language_telugu');

  // Onboarding Getters (EV-026)
  String get captainOnboardingTitle => translate('captain_onboarding_title');
  String get stepPhoneLogin => translate('step_phone_login');
  String get stepPersonal => translate('step_personal');
  String get stepVehicle => translate('step_vehicle');
  String get stepDocuments => translate('step_documents');
  String get stepPreview => translate('step_preview');
  String get phoneNumberLabel => translate('phone_number_label');
  String get phoneHint => translate('phone_hint');
  String get sendOtp => translate('send_otp');
  String get otpLabel => translate('otp_label');
  String get verifyOtp => translate('verify_otp');
  String get resendOtp => translate('resend_otp');
  String resendInSeconds(int seconds) => translate('resend_in_seconds', {'seconds': seconds.toString()});
  String get fullName => translate('full_name');
  String get dob => translate('dob');
  String get drivingLicenseNumber => translate('driving_license_number');
  String get drivingLicenseExpiry => translate('driving_license_expiry');
  String get badgeNumber => translate('badge_number');
  String get emergencyContactName => translate('emergency_contact_name');
  String get emergencyContactPhone => translate('emergency_contact_phone');
  String get selectCity => translate('select_city');
  String get vehicleOwnership => translate('vehicle_ownership');
  String get vehicleOwnershipOwned => translate('vehicle_ownership_owned');
  String get vehicleOwnershipFleet => translate('vehicle_ownership_fleet');
  String get vehicleOwnershipLeased => translate('vehicle_ownership_leased');
  String get vehicleCategory => translate('vehicle_category');
  String get category2w => translate('category_2w');
  String get category3w => translate('category_3w');
  String get category4w => translate('category_4w');
  String get evOnlyAssurance => translate('ev_only_assurance');
  String get nonEvWarning => translate('non_ev_warning');
  String get vehicleMake => translate('vehicle_make');
  String get vehicleModel => translate('vehicle_model');
  String get vehicleYear => translate('vehicle_year');
  String get registrationNumber => translate('registration_number');
  String get batteryCapacity => translate('battery_capacity');
  String get uploadDocument => translate('upload_document');
  String get uploadInProgress => translate('upload_in_progress');
  String get uploadInterrupted => translate('upload_interrupted');
  String get retryUpload => translate('retry_upload');
  String get cameraDeniedTitle => translate('camera_denied_title');
  String get cameraDeniedDesc => translate('camera_denied_desc');
  String get pickFromGallery => translate('pick_from_gallery');
  String get slowNetworkBanner => translate('slow_network_banner');
  String get uploadedVerified => translate('uploaded_verified');
  String get statutoryDeclaration => translate('statutory_declaration');
  String get submitApplication => translate('submit_application');
  String get submittingApplication => translate('submitting_application');
  String get editSection => translate('edit_section');
  String get saveAndContinue => translate('save_and_continue');
  String get applicationStatusTitle => translate('application_status_title');
  String get applicationSubmittedMsg => translate('application_submitted_msg');
  String get applicationRejectedMsg => translate('application_rejected_msg');
  String get editDraftResubmit => translate('edit_draft_resubmit');
  String get prevStep => translate('prev_step');
  String get nextStep => translate('next_step');
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'te'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(AppLocalizations(locale));
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

class FallbackMaterialLocalizationsDelegate
    extends LocalizationsDelegate<MaterialLocalizations> {
  const FallbackMaterialLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<MaterialLocalizations> load(Locale locale) {
    return DefaultMaterialLocalizations.load(locale);
  }

  @override
  bool shouldReload(FallbackMaterialLocalizationsDelegate old) => false;
}

class FallbackWidgetsLocalizationsDelegate
    extends LocalizationsDelegate<WidgetsLocalizations> {
  const FallbackWidgetsLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<WidgetsLocalizations> load(Locale locale) {
    return DefaultWidgetsLocalizations.load(locale);
  }

  @override
  bool shouldReload(FallbackWidgetsLocalizationsDelegate old) => false;
}

class FallbackCupertinoLocalizationsDelegate
    extends LocalizationsDelegate<CupertinoLocalizations> {
  const FallbackCupertinoLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => true;

  @override
  Future<CupertinoLocalizations> load(Locale locale) {
    return DefaultCupertinoLocalizations.load(locale);
  }

  @override
  bool shouldReload(FallbackCupertinoLocalizationsDelegate old) => false;
}

