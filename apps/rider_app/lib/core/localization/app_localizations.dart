import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';

/// EcoRide Localized Content Infrastructure for Rider Mobile App (EV-021)
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
    'app_name': 'EcoRide Rider',
    'electric_tag': '100% ELECTRIC',
    'pilot_corridor': 'Visakhapatnam Pilot',

    // Core Booking
    'where_to': 'Where to in AP?',
    'available_categories': 'Available Categories (Release A)',
    'city_commute_title': 'City Commute (EV Bike Taxi)',
    'city_commute_subtitle': 'Clean Ride • Active in Pilot Zone',
    'pickup_location': 'Pickup Location',
    'dropoff_location': 'Dropoff Location',
    'confirm_ride': 'Confirm EV Ride',
    'finding_captain': 'Finding nearby electric captain in Visakhapatnam...',
    'captain_assigned': 'EV Captain {name} is assigned and en route.',
    'captain_arrived': 'Captain has arrived at pickup point.',
    'trip_started': 'Trip started. Enjoy zero-emission commute.',
    'trip_completed': 'Trip completed! Thank you for choosing clean EV.',
    'booking_cancelled': 'Ride cancelled.',

    // Core Payment
    'payment_mode': 'Payment Mode',
    'upi_or_cash': 'UPI, Card, or Cash',
    'total_fare': 'Total Fare',
    'fare_breakdown': 'Fare Breakdown',
    'pay_now': 'Pay Now',
    'payment_success': 'Payment received successfully.',
    'refund_processed': 'Refund processed to original payment method.',
    'fare_estimate': 'Estimated Fare: ₹{amount}',

    // Core Safety
    'emergency_sos': 'Emergency SOS',
    'share_trip': 'Share Live Trip',
    'safety_guidelines': 'EV Safety Guidelines',
    'sos_alert_sent': 'Emergency alert dispatched to safety response team.',
    'verified_ev_captain': 'Verified EV Captain & Green Plate Permit',
    'emergency_contacts': 'Trusted Emergency Contacts',

    // Core Error Messages
    'network_error': 'Network connection error. Please verify mobile data.',
    'active_ride_exists': 'You already have an active ride in progress.',
    'invalid_otp': 'Invalid verification code. Please check OTP.',
    'location_denied': 'Location access denied. Please enable GPS for pickup.',
    'no_drivers_nearby': 'All EV captains are currently busy. Retrying...',
    'general_error': 'An unexpected error occurred. Please try again.',

    // UI Controls
    'switch_language': 'Language / భాష',
    'language_english': 'English',
    'language_telugu': 'తెలుగు',
  };

  static const Map<String, String> _teStrings = {
    // App & Branding
    'app_name': 'ఈకోరైడ్ రైడర్',
    'electric_tag': '100% ఎలక్ట్రిక్',
    'pilot_corridor': 'విశాఖపట్నం పైలట్',

    // Core Booking
    'where_to': 'ఎక్కడికి వెళ్ళాలి?',
    'available_categories': 'అందుబాటులో ఉన్న కేటగిరీలు (విడుదల A)',
    'city_commute_title': 'నగర ప్రయాణం (ఈవీ బైక్ టాక్సీ)',
    'city_commute_subtitle': 'కాలుష్య రహిత ప్రయాణం • పైలట్ జోన్‌లో అందుబాటులో ఉంది',
    'pickup_location': 'పికప్ లొకేషన్',
    'dropoff_location': 'డ్రాప్ లొకేషన్',
    'confirm_ride': 'ఈవీ రైడ్ నిర్ధారించండి',
    'finding_captain': 'సమీపంలోని ఈవీ కెప్టెన్‌ను విశాఖపట్నంలో వెతుకుతున్నాము...',
    'captain_assigned': 'ఈవీ కెప్టెన్ {name} బయలుదేరారు.',
    'captain_arrived': 'కెప్టెన్ మీ పికప్ స్థలానికి చేరుకున్నారు.',
    'trip_started': 'ప్రయాణం ప్రారంభమైంది. జీరో-ఎమిషన్ రైడ్‌ను ఆస్వాదించండి.',
    'trip_completed': 'ప్రయాణం పూర్తయింది! గ్రీన్ ఈవీని ఎంచుకున్నందుకు ధన్యవాదాలు.',
    'booking_cancelled': 'రైడ్ రద్దు చేయబడింది.',

    // Core Payment
    'payment_mode': 'చెల్లింపు విధానం',
    'upi_or_cash': 'యూపీఐ, కార్డు లేదా నగదు',
    'total_fare': 'మొత్తం ఛార్జీ',
    'fare_breakdown': 'ఛార్జీ వివరాలు',
    'pay_now': 'ఇప్పుడే చెల్లించండి',
    'payment_success': 'చెల్లింపు విజయవంతంగా పూర్తయింది.',
    'refund_processed': 'రీఫండ్ మీ ఖాతాకు పంపబడింది.',
    'fare_estimate': 'అంచనా ఛార్జీ: ₹{amount}',

    // Core Safety
    'emergency_sos': 'అత్యవసర ఎస్ఓఎస్',
    'share_trip': 'లైవ్ ట్రిప్ షేర్ చేయండి',
    'safety_guidelines': 'ఈవీ భద్రతా మార్గదర్శకాలు',
    'sos_alert_sent': 'అత్యవసర హెచ్చరిక భద్రతా బృందానికి పంపబడింది.',
    'verified_ev_captain': 'ధృవీకరించబడిన ఈవీ కెప్టెన్ & గ్రీన్ ప్లేట్ పర్మిట్',
    'emergency_contacts': 'నమ్మకమైన అత్యవసర పరిచయాలు',

    // Core Error Messages
    'network_error': 'నెట్‌వర్క్ లోపం. దయచేసి మొబైల్ డేటాను తనిఖీ చేయండి.',
    'active_ride_exists': 'మీకు ఇప్పటికే యాక్టివ్ రైడ్ ఉంది.',
    'invalid_otp': 'తప్పు ఓటీపీ. దయచేసి ధృవీకరణ కోడ్‌ను సరిచూసుకోండి.',
    'location_denied': 'లొకేషన్ అనుమతి నిరాకరించబడింది. జీపీఎస్ ఆన్ చేయండి.',
    'no_drivers_nearby': 'ఈవీ కెప్టెన్లు అందరూ బిజీగా ఉన్నారు. కొద్దిసేపట్లో ప్రయత్నించండి.',
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
  String get whereTo => translate('where_to');
  String get availableCategories => translate('available_categories');
  String get cityCommuteTitle => translate('city_commute_title');
  String get cityCommuteSubtitle => translate('city_commute_subtitle');

  // Booking
  String get pickupLocation => translate('pickup_location');
  String get dropoffLocation => translate('dropoff_location');
  String get confirmRide => translate('confirm_ride');
  String get findingCaptain => translate('finding_captain');
  String captainAssigned(String name) => translate('captain_assigned', {'name': name});
  String get captainArrived => translate('captain_arrived');
  String get tripStarted => translate('trip_started');
  String get tripCompleted => translate('trip_completed');
  String get bookingCancelled => translate('booking_cancelled');

  // Payment
  String get paymentMode => translate('payment_mode');
  String get upiOrCash => translate('upi_or_cash');
  String get totalFare => translate('total_fare');
  String get fareBreakdown => translate('fare_breakdown');
  String get payNow => translate('pay_now');
  String get paymentSuccess => translate('payment_success');
  String get refundProcessed => translate('refund_processed');
  String fareEstimate(String amount) => translate('fare_estimate', {'amount': amount});

  // Safety
  String get emergencySos => translate('emergency_sos');
  String get shareTrip => translate('share_trip');
  String get safetyGuidelines => translate('safety_guidelines');
  String get sosAlertSent => translate('sos_alert_sent');
  String get verifiedEvCaptain => translate('verified_ev_captain');
  String get emergencyContacts => translate('emergency_contacts');

  // Error Messages
  String get networkError => translate('network_error');
  String get activeRideExists => translate('active_ride_exists');
  String get invalidOtp => translate('invalid_otp');
  String get locationDenied => translate('location_denied');
  String get noDriversNearby => translate('no_drivers_nearby');
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

