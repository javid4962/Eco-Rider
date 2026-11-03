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

    // Location Search & Selection (EV-033)
    'search_pickup': 'Search pickup location',
    'search_destination': 'Search destination',
    'search_placeholder': 'Enter street, area, or landmark in AP...',
    'recent_searches': 'Recent Places in Visakhapatnam',
    'suggested_places': 'Suggested Locations',
    'no_places_found': 'No matching places found. Try a nearby landmark.',
    'select_on_map': 'Set Pin on Map',
    'choose_on_map': 'Choose on Map',
    'confirm_pickup_pin': 'Confirm Pickup Pin',
    'confirm_destination_pin': 'Confirm Destination Pin',
    'adjust_pin_instructions': 'Move the map or drag the pin to your exact pickup location.',
    'pin_location_set': 'Pin placed at {address}',

    // Saved Places (EV-033)
    'saved_places': 'Saved Places',
    'place_home': 'Home',
    'place_work': 'Work',
    'place_favorite': 'Favorite',
    'add_saved_place': 'Save Location',
    'saved_place_default_home': 'Beach Road, MVP Colony, Visakhapatnam',
    'saved_place_default_work': 'Rushikonda IT SEZ, Visakhapatnam',

    // Confirmation & Verification (EV-033)
    'confirm_locations_title': 'Confirm Ride Locations',
    'confirm_locations_subtitle': 'Please verify both pickup and dropoff points before continuing.',
    'pickup_point': 'Pickup Point',
    'dropoff_point': 'Dropoff Point',
    'confirm_and_proceed': 'Confirm Locations & Get Fare',
    'manual_pin_badge': 'Manually Confirmed Pin',
    'estimated_distance': 'Distance: {distance} km',
    'estimated_duration': 'Duration: ~{duration} min',
    'book_electric_ride': 'Book Electric Ride',

    // Permission Fallback (EV-033)
    'gps_permission_denied_title': 'Location Access Denied',
    'gps_permission_denied_desc': 'EcoRide requires your pickup location to dispatch an EV captain. Please select your pickup manually or pick on the map.',
    'pick_on_map_action': 'Set Pin on Map',
    'search_manually_action': 'Search Manually',
    'gps_unavailable_notice': 'GPS signal is weak or restricted. Using manual pin selection.',

    // Unsupported Locations / Pilot Boundaries (EV-033)
    'unsupported_location_title': 'Service Unavailable in This Area',
    'unsupported_location_desc': 'EcoRide operates exclusively with 100% BEVs in authorized Andhra Pradesh pilot corridors. The selected location is outside our active pilot boundary.',
    'active_pilot_notice': 'Currently serving: Visakhapatnam EV Pilot Corridor (AP-RTO-VZG-EV-ZONE-01)',
    'rejection_reason_label': 'Reason: {reason}',
    'change_location_action': 'Select Another Location',
    'notify_expansion_action': 'Notify Me on Expansion',

    // Service Availability & Pricing (EV-037)
    'operator_notice_title': 'Statutory Operator Notice (AP-STA)',
    'cancellation_terms_title': 'Cancellation Policy',
    'free_cancellation_window': 'Free cancellation within {mins} mins',
    'driver_compensation_fee': 'Driver fee {fee} after window',
    'zero_drivers_nearby': 'No Captains Online',
    'captains_nearby': '{count} captains nearby',
    'not_authorized_in_zone': 'Not Authorized in Zone',
    'category_unavailable': 'Category Unavailable',
    'seating_label': 'Seats: {config} ({count} pass)',
    'view_cancellation_policy': 'View Cancellation Terms',
    'pilot_pricing_notice': 'Estimated EV fare',
    'service_availability_title': 'EV Service Availability & Pricing',
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

    // Location Search & Selection (EV-033)
    'search_pickup': 'పికప్ స్థలాన్ని వెతకండి',
    'search_destination': 'గమ్యస్థానాన్ని వెతకండి',
    'search_placeholder': 'వీధి, ప్రాంతం లేదా మైలురాయి పేరు నమోదు చేయండి...',
    'recent_searches': 'విశాఖపట్నంలో ఇటీవల వెతికిన ప్రదేశాలు',
    'suggested_places': 'సూచించిన ప్రదేశాలు',
    'no_places_found': 'స్థలాలు ఏవీ కనుగొనబడలేదు. సమీప మైలురాయిని ప్రయత్నించండి.',
    'select_on_map': 'మ్యాప్‌లో పిన్ ఉంచండి',
    'choose_on_map': 'మ్యాప్‌లో ఎంచుకోండి',
    'confirm_pickup_pin': 'పికప్ పిన్ నిర్ధారించండి',
    'confirm_destination_pin': 'డ్రాప్ పిన్ నిర్ధారించండి',
    'adjust_pin_instructions': 'ఖచ్చితమైన పికప్ స్థలాన్ని ఎంచుకోవడానికి పిన్‌ను జరపండి.',
    'pin_location_set': '{address} వద్ద పిన్ ఉంచబడింది',

    // Saved Places (EV-033)
    'saved_places': 'సేవ్ చేసిన స్థలాలు',
    'place_home': 'ఇల్లు',
    'place_work': 'కార్యాలయం',
    'place_favorite': 'ఇష్టమైనవి',
    'add_saved_place': 'స్థలాన్ని సేవ్ చేయండి',
    'saved_place_default_home': 'బీచ్ రోడ్, ఎంవీపీ కాలనీ, విశాఖపట్నం',
    'saved_place_default_work': 'రుషికొండ ఐటీ సెజ్, విశాఖపట్నం',

    // Confirmation & Verification (EV-033)
    'confirm_locations_title': 'రైడ్ స్థానాలను నిర్ధారించండి',
    'confirm_locations_subtitle': 'కొనసాగే ముందు దయచేసి పికప్ మరియు డ్రాప్ స్థానాలను సరిచూసుకోండి.',
    'pickup_point': 'పికప్ స్థానం',
    'dropoff_point': 'డ్రాప్ స్థానం',
    'confirm_and_proceed': 'స్థానాలను నిర్ధారించి ఛార్జీ పొందండి',
    'manual_pin_badge': 'ఖచ్చితంగా నిర్ధారించిన పిన్',
    'estimated_distance': 'దూరం: {distance} కి.మీ.',
    'estimated_duration': 'సమయం: ~{duration} నిమిషాలు',
    'book_electric_ride': 'ఈవీ రైడ్ బుక్ చేయండి',

    // Permission Fallback (EV-033)
    'gps_permission_denied_title': 'లొకేషన్ అనుమతి నిరాకరించబడింది',
    'gps_permission_denied_desc': 'ఈవీ కెప్టెన్‌ను పంపడానికి మీ పికప్ స్థానం అవసరం. దయచేసి స్థానాన్ని వెతకండి లేదా మ్యాప్‌లో పిన్ ఎంచుకోండి.',
    'pick_on_map_action': 'మ్యాప్‌లో పిన్ ఉంచండి',
    'search_manually_action': 'మ్యానువల్‌గా వెతకండి',
    'gps_unavailable_notice': 'జీపీఎస్ సిగ్నల్ లేదు. మ్యానువల్ పిన్ ఎంపికను ఉపయోగిస్తున్నాము.',

    // Unsupported Locations / Pilot Boundaries (EV-033)
    'unsupported_location_title': 'ఈ ప్రాంతంలో సేవ అందుబాటులో లేదు',
    'unsupported_location_desc': 'ఈకోరైడ్ ప్రస్తుతం ఆంధ్రప్రదేశ్ ప్రభుత్వం అనుమతించిన విశాఖపట్నం పైలట్ జోన్‌లో మాత్రమే 100% ఈవీలను నడుపుతోంది.',
    'active_pilot_notice': 'ప్రస్తుతం సేవలందిస్తున్నది: విశాఖపట్నం ఈవీ పైలట్ కారిడార్ (AP-RTO-VZG-EV-ZONE-01)',
    'rejection_reason_label': 'కారణం: {reason}',
    'change_location_action': 'వేరే స్థానాన్ని ఎంచుకోండి',
    'notify_expansion_action': 'మా విస్తరణ గురించి తెలియజేయండి',

    // Service Availability & Pricing (EV-037)
    'operator_notice_title': 'చట్టబద్ధమైన ఆపరేటర్ నోటీసు (AP-STA)',
    'cancellation_terms_title': 'రద్దు విధానం',
    'free_cancellation_window': '{mins} నిమిషాల్లోపు ఉచిత రద్దు',
    'driver_compensation_fee': 'సమయం దాటిన తర్వాత డ్రైవర్ పరిహారం {fee}',
    'zero_drivers_nearby': 'ప్రస్తుతం కెప్టెన్లు అందుబాటులో లేరు',
    'captains_nearby': '{count} కెప్టెన్లు సమీపంలో ఉన్నారు',
    'not_authorized_in_zone': 'ఈ జోన్‌లో అనుమతించబడలేదు',
    'category_unavailable': 'కేటగిరీ అందుబాటులో లేదు',
    'seating_label': 'సీట్లు: {config} ({count} ప్రయాణికులు)',
    'view_cancellation_policy': 'రద్దు నిబంధనలను వీక్షించండి',
    'pilot_pricing_notice': 'అంచనా వేయబడిన ఈవీ ఛార్జీ',
    'service_availability_title': 'ఈవీ సేవ లభ్యత మరియు ధరలు',
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

  // Location Search & Selection Getters (EV-033)
  String get searchPickup => translate('search_pickup');
  String get searchDestination => translate('search_destination');
  String get searchPlaceholder => translate('search_placeholder');
  String get recentSearches => translate('recent_searches');
  String get suggestedPlaces => translate('suggested_places');
  String get noPlacesFound => translate('no_places_found');
  String get selectOnMap => translate('select_on_map');
  String get chooseOnMap => translate('choose_on_map');
  String get confirmPickupPin => translate('confirm_pickup_pin');
  String get confirmDestinationPin => translate('confirm_destination_pin');
  String get adjustPinInstructions => translate('adjust_pin_instructions');
  String pinLocationSet(String address) => translate('pin_location_set', {'address': address});

  // Saved Places Getters (EV-033)
  String get savedPlaces => translate('saved_places');
  String get placeHome => translate('place_home');
  String get placeWork => translate('place_work');
  String get placeFavorite => translate('place_favorite');
  String get addSavedPlace => translate('add_saved_place');
  String get savedPlaceDefaultHome => translate('saved_place_default_home');
  String get savedPlaceDefaultWork => translate('saved_place_default_work');

  // Confirmation & Route Details Getters (EV-033)
  String get confirmLocationsTitle => translate('confirm_locations_title');
  String get confirmLocationsSubtitle => translate('confirm_locations_subtitle');
  String get pickupPoint => translate('pickup_point');
  String get dropoffPoint => translate('dropoff_point');
  String get confirmAndProceed => translate('confirm_and_proceed');
  String get manualPinBadge => translate('manual_pin_badge');
  String estimatedDistance(String distance) => translate('estimated_distance', {'distance': distance});
  String estimatedDuration(String duration) => translate('estimated_duration', {'duration': duration});
  String get bookElectricRide => translate('book_electric_ride');

  // Permission Fallback Getters (EV-033)
  String get gpsPermissionDeniedTitle => translate('gps_permission_denied_title');
  String get gpsPermissionDeniedDesc => translate('gps_permission_denied_desc');
  String get pickOnMapAction => translate('pick_on_map_action');
  String get searchManuallyAction => translate('search_manually_action');
  String get gpsUnavailableNotice => translate('gps_unavailable_notice');

  // Unsupported Location Getters (EV-033)
  String get unsupportedLocationTitle => translate('unsupported_location_title');
  String get unsupportedLocationDesc => translate('unsupported_location_desc');
  String get activePilotNotice => translate('active_pilot_notice');
  String rejectionReasonLabel(String reason) => translate('rejection_reason_label', {'reason': reason});
  String get changeLocationAction => translate('change_location_action');
  String get notifyExpansionAction => translate('notify_expansion_action');

  // Service Availability & Pricing Getters (EV-037)
  String get operatorNoticeTitle => translate('operator_notice_title');
  String get cancellationTermsTitle => translate('cancellation_terms_title');
  String freeCancellationWindow(int mins) =>
      translate('free_cancellation_window', {'mins': mins.toString()});
  String driverCompensationFee(String fee) =>
      translate('driver_compensation_fee', {'fee': fee});
  String get zeroDriversNearby => translate('zero_drivers_nearby');
  String captainsNearby(int count) =>
      translate('captains_nearby', {'count': count.toString()});
  String get notAuthorizedInZone => translate('not_authorized_in_zone');
  String get categoryUnavailable => translate('category_unavailable');
  String seatingLabel(String config, int count) =>
      translate('seating_label', {'config': config, 'count': count.toString()});
  String get viewCancellationPolicy => translate('view_cancellation_policy');
  String get pilotPricingNotice => translate('pilot_pricing_notice');
  String get serviceAvailabilityTitle => translate('service_availability_title');
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

