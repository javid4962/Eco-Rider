import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

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

