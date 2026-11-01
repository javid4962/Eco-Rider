/**
 * EcoRide Localized Content & Response Message Identifiers (EV-021)
 *
 * Defines standardized response message keys, supported locales ('te' | 'en' | 'hi'),
 * and bilingual localized dictionaries for Booking, Payment, Safety, Duty, and Errors.
 */

export type SupportedLocale = 'en' | 'te' | 'hi';

export enum ResponseMessageKey {
  // Booking & Commute Lifecycle
  BOOKING_CREATED = 'booking.created',
  BOOKING_MATCHING = 'booking.matching',
  BOOKING_CAPTAIN_ASSIGNED = 'booking.captainAssigned',
  BOOKING_CAPTAIN_ARRIVED = 'booking.captainArrived',
  BOOKING_TRIP_STARTED = 'booking.tripStarted',
  BOOKING_TRIP_COMPLETED = 'booking.tripCompleted',
  BOOKING_CANCELLED = 'booking.cancelled',
  BOOKING_ACTIVE_EXISTS = 'error.booking.activeRideExists',
  BOOKING_ZONE_RESTRICTED = 'error.booking.zoneRestricted',
  BOOKING_NO_DRIVERS = 'error.booking.noDriversAvailable',

  // Payment & Fare
  PAYMENT_ORDER_CREATED = 'payment.orderCreated',
  PAYMENT_SUCCESSFUL = 'payment.successful',
  PAYMENT_REFUND_PROCESSED = 'payment.refundProcessed',
  PAYMENT_UNSETTLED_DUES = 'error.payment.unsettledDues',
  PAYMENT_GATEWAY_ERROR = 'error.payment.gatewayError',

  // Safety & SOS
  SAFETY_SOS_TRIGGERED = 'safety.sosTriggered',
  SAFETY_TRIP_SHARED = 'safety.tripShared',
  SAFETY_SPEED_WARNING = 'safety.speedWarning',
  SAFETY_CAPTAIN_VERIFIED = 'safety.captainVerified',

  // Captain Duty & Telematics
  CAPTAIN_DUTY_ONLINE = 'captain.dutyOnline',
  CAPTAIN_DUTY_OFFLINE = 'captain.dutyOffline',
  CAPTAIN_BATTERY_LOW = 'error.captain.batteryLow',
  CAPTAIN_SHIFT_EXPIRED = 'captain.shiftExpired',

  // Common Errors & Authentication
  AUTH_INVALID_OTP = 'error.auth.invalidOtp',
  AUTH_SESSION_EXPIRED = 'error.auth.sessionExpired',
  PRIVACY_CONSENT_REQUIRED = 'error.privacy.consentRequired',
  SYSTEM_UNEXPECTED = 'error.system.unexpected',
}

export interface LocalizedMessageDto {
  messageKey: string;
  message: string;
  locale: SupportedLocale | string;
  params?: Record<string, string | number>;
}

export interface LocalizationDictionary {
  locale: SupportedLocale;
  messages: Record<string, string>;
}

/**
 * Authoritative Bilingual Message Dictionaries for Backend & Mobile Synchronisation
 */
export const LOCALIZED_MESSAGES: Record<SupportedLocale, Record<string, string>> = {
  en: {
    // Booking
    [ResponseMessageKey.BOOKING_CREATED]:
      'Ride request placed successfully. Matching nearby EV captain.',
    [ResponseMessageKey.BOOKING_MATCHING]: 'Finding your electric ride in Visakhapatnam corridor.',
    [ResponseMessageKey.BOOKING_CAPTAIN_ASSIGNED]: 'Your EV Captain {{name}} is on the way.',
    [ResponseMessageKey.BOOKING_CAPTAIN_ARRIVED]: 'Captain has arrived at your pickup location.',
    [ResponseMessageKey.BOOKING_TRIP_STARTED]:
      'Trip started. Enjoy your clean, zero-emission ride.',
    [ResponseMessageKey.BOOKING_TRIP_COMPLETED]:
      'Trip completed successfully. Thank you for riding green!',
    [ResponseMessageKey.BOOKING_CANCELLED]: 'Ride booking has been cancelled.',
    [ResponseMessageKey.BOOKING_ACTIVE_EXISTS]:
      'You already have an active ride in progress. Complete or cancel it first.',
    [ResponseMessageKey.BOOKING_ZONE_RESTRICTED]:
      'This zone is currently outside the active EV pilot corridor.',
    [ResponseMessageKey.BOOKING_NO_DRIVERS]:
      'All nearby EV captains are currently engaged. Please try again shortly.',

    // Payment
    [ResponseMessageKey.PAYMENT_ORDER_CREATED]: 'Payment order initiated for ₹{{amount}}.',
    [ResponseMessageKey.PAYMENT_SUCCESSFUL]: 'Payment of ₹{{amount}} received successfully.',
    [ResponseMessageKey.PAYMENT_REFUND_PROCESSED]:
      'Refund of ₹{{amount}} has been processed to original payment method.',
    [ResponseMessageKey.PAYMENT_UNSETTLED_DUES]:
      'Account has unsettled dues of ₹{{amount}}. Please settle before booking.',
    [ResponseMessageKey.PAYMENT_GATEWAY_ERROR]:
      'Payment provider is momentarily unavailable. Please use UPI or Cash.',

    // Safety
    [ResponseMessageKey.SAFETY_SOS_TRIGGERED]:
      'Emergency SOS triggered! Safety response team and emergency contacts alerted.',
    [ResponseMessageKey.SAFETY_TRIP_SHARED]:
      'Live trip tracking link shared with your trusted emergency contacts.',
    [ResponseMessageKey.SAFETY_SPEED_WARNING]:
      'Vehicle speed advisory: captain advised to maintain safe corridor limit.',
    [ResponseMessageKey.SAFETY_CAPTAIN_VERIFIED]:
      'Captain identity and 100% BEV vehicle permit verified.',

    // Captain
    [ResponseMessageKey.CAPTAIN_DUTY_ONLINE]:
      'Duty online. Ready to receive EV ride requests in your pilot zone.',
    [ResponseMessageKey.CAPTAIN_DUTY_OFFLINE]:
      'Duty offline. You will not receive ride dispatches.',
    [ResponseMessageKey.CAPTAIN_BATTERY_LOW]:
      'Battery SoC is below 20%. Please charge at nearby hub before going online.',
    [ResponseMessageKey.CAPTAIN_SHIFT_EXPIRED]:
      'Maximum duty shift duration reached. Please take mandated rest.',

    // Common & Errors
    [ResponseMessageKey.AUTH_INVALID_OTP]:
      'Invalid or expired OTP. Please enter the correct verification code.',
    [ResponseMessageKey.AUTH_SESSION_EXPIRED]:
      'Session has expired. Please log in again to continue.',
    [ResponseMessageKey.PRIVACY_CONSENT_REQUIRED]:
      'Mandatory terms and privacy policy acceptance required.',
    [ResponseMessageKey.SYSTEM_UNEXPECTED]:
      'An unexpected system error occurred. Please try again.',
  },

  te: {
    // Booking
    [ResponseMessageKey.BOOKING_CREATED]:
      'రైడ్ అభ్యర్థన విజయవంతంగా చేయబడింది. సమీపంలోని ఈవీ కెప్టెన్‌ను కలుపుతున్నాము.',
    [ResponseMessageKey.BOOKING_MATCHING]:
      'విశాఖపట్నం కారిడార్‌లో మీ ఎలక్ట్రిక్ రైడ్‌ను వెతుకుతున్నాము.',
    [ResponseMessageKey.BOOKING_CAPTAIN_ASSIGNED]: 'మీ ఈవీ కెప్టెన్ {{name}} బయలుదేరారు.',
    [ResponseMessageKey.BOOKING_CAPTAIN_ARRIVED]: 'కెప్టెన్ మీ పికప్ స్థలానికి చేరుకున్నారు.',
    [ResponseMessageKey.BOOKING_TRIP_STARTED]:
      'ప్రయాణం ప్రారంభమైంది. మీ జీరో-ఎమిషన్ రైడ్‌ను ఆస్వాదించండి.',
    [ResponseMessageKey.BOOKING_TRIP_COMPLETED]:
      'ప్రయాణం పూర్తయింది. గ్రీన్ రైడ్‌ను ఎంచుకున్నందుకు ధన్యవాదాలు!',
    [ResponseMessageKey.BOOKING_CANCELLED]: 'రైడ్ బుకింగ్ రద్దు చేయబడింది.',
    [ResponseMessageKey.BOOKING_ACTIVE_EXISTS]:
      'మీకు ఇప్పటికే యాక్టివ్ రైడ్ ఉంది. దయచేసి దాన్ని పూర్తి చేయండి లేదా రద్దు చేయండి.',
    [ResponseMessageKey.BOOKING_ZONE_RESTRICTED]:
      'ఈ ప్రాంతం ప్రస్తుతం యాక్టివ్ ఈవీ పైలట్ కారిడార్ వెలుపల ఉంది.',
    [ResponseMessageKey.BOOKING_NO_DRIVERS]:
      'సమీపంలోని ఈవీ కెప్టెన్లు అందరూ బిజీగా ఉన్నారు. దయచేసి కొద్దిసేపటి తర్వాత ప్రయత్నించండి.',

    // Payment
    [ResponseMessageKey.PAYMENT_ORDER_CREATED]:
      '₹{{amount}} కోసం చెల్లింపు ఆర్డర్ ప్రారంభించబడింది.',
    [ResponseMessageKey.PAYMENT_SUCCESSFUL]: '₹{{amount}} చెల్లింపు విజయవంతంగా పూర్తయింది.',
    [ResponseMessageKey.PAYMENT_REFUND_PROCESSED]: '₹{{amount}} రీఫండ్ మీ ఖాతాకు పంపబడింది.',
    [ResponseMessageKey.PAYMENT_UNSETTLED_DUES]:
      'మీ ఖాతాలో ₹{{amount}} బకాయిలు ఉన్నాయి. బుకింగ్ చేయడానికి ముందు దయచేసి చెల్లించండి.',
    [ResponseMessageKey.PAYMENT_GATEWAY_ERROR]:
      'చెల్లింపు గేట్‌వే అందుబాటులో లేదు. దయచేసి యూపీఐ లేదా నగదు ఉపయోగించండి.',

    // Safety
    [ResponseMessageKey.SAFETY_SOS_TRIGGERED]:
      'ఎమర్జెన్సీ ఎస్ఓఎస్ ప్రారంభించబడింది! భద్రతా బృందం మరియు కుటుంబ సభ్యులకు సమాచారం అందించబడింది.',
    [ResponseMessageKey.SAFETY_TRIP_SHARED]:
      'లైవ్ ట్రిప్ ట్రాకింగ్ లింక్ మీ అత్యవసర పరిచయాలతో భాగస్వామ్యం చేయబడింది.',
    [ResponseMessageKey.SAFETY_SPEED_WARNING]:
      'వాహన వేగ పరిమితి హెచ్చరిక: సురక్షిత వేగంలో నడపవలసిందిగా కెప్టెన్‌కు సూచించబడింది.',
    [ResponseMessageKey.SAFETY_CAPTAIN_VERIFIED]:
      'కెప్టెన్ ధృవీకరణ మరియు 100% ఎలక్ట్రిక్ వాహన పర్మిట్ ధృవీకరించబడింది.',

    // Captain
    [ResponseMessageKey.CAPTAIN_DUTY_ONLINE]:
      'డ్యూటీ ఆన్‌లైన్. మీ పైలట్ జోన్‌లో రైడ్ అభ్యర్థనలను స్వీకరించడానికి సిద్ధంగా ఉన్నారు.',
    [ResponseMessageKey.CAPTAIN_DUTY_OFFLINE]: 'డ్యూటీ ఆఫ్‌లైన్. మీకు రైడ్ డిస్పాచ్‌లు రావు.',
    [ResponseMessageKey.CAPTAIN_BATTERY_LOW]:
      'బ్యాటరీ 20% కంటే తక్కువగా ఉంది. ఆన్‌లైన్ వెళ్ళడానికి ముందు దయచేసి సమీప హబ్‌లో ఛార్జ్ చేయండి.',
    [ResponseMessageKey.CAPTAIN_SHIFT_EXPIRED]:
      'గరిష్ట డ్యూటీ సమయం ముగిసింది. దయచేసి తప్పనిసరి విశ్రాంతి తీసుకోండి.',

    // Common & Errors
    [ResponseMessageKey.AUTH_INVALID_OTP]:
      'తప్పు లేదా గడువు ముగిసిన ఓటీపీ. దయచేసి సరైన కోడ్‌ను నమోదు చేయండి.',
    [ResponseMessageKey.AUTH_SESSION_EXPIRED]:
      'సెషన్ గడువు ముగిసింది. దయచేసి మళ్ళీ లాగిన్ అవ్వండి.',
    [ResponseMessageKey.PRIVACY_CONSENT_REQUIRED]:
      'నిబంధనలు మరియు గోప్యతా విధానాన్ని అంగీకరించడం తప్పనిసరి.',
    [ResponseMessageKey.SYSTEM_UNEXPECTED]:
      'అనుకోని సిస్టమ్ లోపం సంభవించింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
  },

  hi: {
    // Fallback to Hindi where specified
    [ResponseMessageKey.BOOKING_CREATED]:
      'सवारी अनुरोध सफलतापूर्वक रखा गया। नजदीकी ईवी कैप्टन खोज रहे हैं।',
    [ResponseMessageKey.BOOKING_TRIP_COMPLETED]:
      'यात्रा सफलतापूर्वक पूरी हुई। हरित यात्रा चुनने के लिए धन्यवाद!',
    [ResponseMessageKey.SAFETY_SOS_TRIGGERED]:
      'आपातकालीन एसओएस सक्रिय! सुरक्षा टीम को सूचित कर दिया गया है।',
    [ResponseMessageKey.CAPTAIN_DUTY_ONLINE]:
      'ड्यूटी ऑनलाइन। आप सवारी अनुरोध स्वीकार करने के लिए तैयार हैं।',
    [ResponseMessageKey.CAPTAIN_DUTY_OFFLINE]: 'ड्यूटी ऑफलाइन।',
  },
};
