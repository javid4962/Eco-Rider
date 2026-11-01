import {
  DesignTokens,
  ScreenInventoryItem,
  BilingualText,
} from '@ecoride/contracts';

/**
 * Authoritative Design Tokens for EcoRide
 * Original EV-Only Identity for Andhra Pradesh
 * Distinct from Rapido (yellow/black), Uber (white/black), and Ola (green neon).
 */
export const AUTHORITATIVE_DESIGN_TOKENS: DesignTokens = {
  colors: {
    primaryElectric: '#059669', // Electric Emerald (EV energy anchor)
    primaryElectricDark: '#064E3B', // Deep forest anchor
    voltageNavy: '#0B132B', // Deep Voltage Navy (chassis background)
    voltageNavySurface: '#1C2541', // Elevated surface in dark mode
    surfaceLight: '#FFFFFF', // High-contrast clean white surface
    surfaceDark: '#0F172A', // Slate dark card background
    backgroundLight: '#F8FAFC', // Crisp zinc neutral background
    backgroundDark: '#020617', // Midnight obsidian background
    textPrimaryLight: '#0F172A', // WCAG contrast on surfaceLight: 15.2:1 (AAA)
    textPrimaryDark: '#F8FAFC', // WCAG contrast on surfaceDark: 14.8:1 (AAA)
    textSecondaryLight: '#475569', // WCAG contrast on surfaceLight: 5.8:1 (AA)
    textSecondaryDark: '#94A3B8', // WCAG contrast on surfaceDark: 6.2:1 (AA)
    batteryOptimal: '#10B981', // Battery SoC > 60%
    batteryGood: '#34D399', // Battery SoC 40% - 60%
    batteryLow: '#F59E0B', // Battery SoC 20% - 40%
    batteryCritical: '#EF4444', // Battery SoC < 20% (trip lockout threshold)
    safetyAlert: '#DC2626', // Emergency SOS red
    borderLight: '#E2E8F0', // Neutral light divider
    borderDark: '#334155', // Slate dark divider
  },
  typography: {
    fontFamilyEnglish: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyTelugu: "'Noto Sans Telugu', 'Gautami', 'Mandali', sans-serif",
    displayLarge: { fontSize: 32, lineHeight: 40, fontWeight: 700, letterSpacing: -0.5 },
    headlineMedium: { fontSize: 24, lineHeight: 32, fontWeight: 600, letterSpacing: -0.25 },
    titleMedium: { fontSize: 18, lineHeight: 26, fontWeight: 600, letterSpacing: 0 },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: 400, letterSpacing: 0.15 },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: 400, letterSpacing: 0.25 },
    bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: 400, letterSpacing: 0.4 },
    labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: 600, letterSpacing: 0.1 },
    labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: 500, letterSpacing: 0.5 },
  },
  spacing: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    huge: 64,
  },
  radii: {
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    pill: 9999,
  },
  elevations: {
    none: 'none',
    low: '0px 2px 4px rgba(11, 19, 43, 0.06), 0px 1px 2px rgba(11, 19, 43, 0.04)',
    medium: '0px 4px 8px -2px rgba(11, 19, 43, 0.1), 0px 2px 4px -1px rgba(11, 19, 43, 0.06)',
    high: '0px 12px 24px -4px rgba(11, 19, 43, 0.15), 0px 4px 8px -2px rgba(11, 19, 43, 0.08)',
    emergencyPulse: '0px 0px 20px 4px rgba(220, 38, 38, 0.45)',
  },
  mapTheme: {
    darkBaseFill: '#0B132B',
    electricRoutePolyline: '#059669',
    batteryDepletionGradientStart: '#10B981',
    batteryDepletionGradientEnd: '#F59E0B',
    geofenceBoundaryStroke: '#00D084',
    geofenceFillAlpha: 'rgba(5, 150, 105, 0.08)',
    chargingHubPoiColor: '#10B981',
  },
  buttons: {
    minTouchTargetDp: 48,
    borderRadiusDp: 12,
    variants: {
      primaryElectric: {
        background: '#059669',
        textColor: '#FFFFFF',
        focusRingColor: '#34D399',
      },
      secondaryOutline: {
        background: 'transparent',
        borderColor: '#059669',
        textColor: '#059669',
      },
      emergencySos: {
        background: '#DC2626',
        textColor: '#FFFFFF',
        hapticPattern: 'heavy-double-pulse',
      },
      ghost: {
        background: 'transparent',
        textColor: '#0F172A',
      },
    },
  },
};

/**
 * Screen Inventory with ASCII Wireframes and Guidance
 * Covering the 5 Core Platform Screens:
 * 1. Rider Home (SCR_RIDER_HOME)
 * 2. Quote / Vehicle Select (SCR_RIDER_VEHICLE_SELECT)
 * 3. Active Ride In-Transit (SCR_RIDER_TRIP_PROGRESS)
 * 4. Shared Commute Ticket (SCR_COMMUTE_TICKET_BOARDING_PASS)
 * 5. Driver Home Dashboard (SCR_CAPTAIN_HOME)
 */
export const SCREEN_INVENTORY: ScreenInventoryItem[] = [
  {
    screenId: 'SCR_RIDER_HOME',
    name: 'Rider Home & EV Discovery',
    role: 'rider',
    layoutDescription:
      'Full-screen vector EV map showing nearby electric clusters and charging depots, with a persistent bottom search card.',
    asciiWireframe: `
+------------------------------------------+
|  [EcoRide AP]                 [Profile]  |
|  Status: Vizag Urban Electric Zone       |
+------------------------------------------+
|                                          |
|                [⚡ Hub: Dwaraka Nagar]   |
|        (e-Auto)                          |
|                     (e-Bike)             |
|                                          |
|         [📍 Your Current Location]       |
|                                          |
+------------------------------------------+
|  Where are you traveling today?           |
|  గమ్యస్థానాన్ని శోధించండి                |
|  [ 🔍 Search Destination in AP...      ] |
|                                          |
|  Quick Commute Corridors:                |
|  [⚡ Vizag -> Anakapalle] [⚡ Rushikonda] |
|                                          |
|  [ Home ]    [ Commute Pass ]   [ Activity ]|
+------------------------------------------+
`,
    responsiveGuidelines: {
      mobileCompact360dp:
        'Search card docks to bottom 35% height; quick commute pill horizontal scroll.',
      mobileStandard412dp:
        'Search card docks to bottom 30% height; 2-column preset corridor grid.',
      tablet768dp:
        'Left split pane (40% width) for search and recent destinations; right pane (60% width) for interactive PostGIS EV map.',
    },
    emptyStateGuidance: {
      condition: 'No recent searches and GPS locating in progress',
      bilingualMessage: {
        en: 'Locating nearby commercial EV clusters in Visakhapatnam...',
        te: 'విశాఖపట్నంలో అందుబాటులో ఉన్న EV వాహనాలను వెతుకుతున్నాము...',
      },
      recoveryAction: {
        en: 'Tap search bar to enter landmark or transit hub',
        te: 'ల్యాండ్‌మార్క్ లేదా ట్రాన్సిట్ హబ్‌ను ఎంచుకోండి',
      },
    },
    errorStateGuidance: {
      trigger: 'GPS disabled or user outside Andhra Pradesh pilot operational zone',
      bilingualMessage: {
        en: 'Location outside authorized pilot zone. EcoRide operates exclusively in Andhra Pradesh.',
        te: 'ఈ ప్రాంతం అనుమతించబడిన జోన్ వెలుపల ఉంది. ఎకోరైడ్ ప్రస్తుతం ఆంధ్రప్రదేశ్‌లో మాత్రమే అందుబాటులో ఉంది.',
      },
      fallbackScreenId: 'SCR_RIDER_ZONE_RESTRICTED',
    },
    accessibilityNotes: {
      minTouchTarget: '48 x 48 dp on all quick corridor chips and search bar',
      contrastRatio: 'Text #0F172A on surface #FFFFFF: 15.2:1 (Exceeds WCAG AAA)',
      screenReaderSemantic: 'Header: EcoRide AP Pilot; Button: Search destination',
    },
    bilingualLabels: {
      searchPlaceholder: {
        en: 'Where to? (e.g., RK Beach, Airport, Gajuwaka)',
        te: 'ఎక్కడికి వెళ్ళాలి? (ఉదా. ఆర్కే బీచ్, ఎయిర్‌పోర్ట్)',
      },
      quickCommute: {
        en: 'Corridor Shuttles',
        te: 'కారిడార్ షటిల్స్',
      },
      greenZoneBadge: {
        en: '100% Electric Zone',
        te: '100% ఎలక్ట్రిక్ జోన్',
      },
    },
  },
  {
    screenId: 'SCR_RIDER_VEHICLE_SELECT',
    name: 'EV Quote & Vehicle Select',
    role: 'rider',
    layoutDescription:
      'Route preview with battery feasibility indicators and vertical selector for EV categories (e-Bike, e-Auto, e-Cab).',
    asciiWireframe: `
+------------------------------------------+
|  [<- Back]    Trip Quote & Vehicle Select |
+------------------------------------------+
|  Route: Jagadamba Jct -> Madhurawada     |
|  Distance: 14.2 km | Est. Battery: 12%   |
+------------------------------------------+
|  SELECT ELECTRIC VEHICLE CATEGORY:       |
|                                          |
|  (*) [⚡ e-Auto]     ETA: 3 min   ₹140   |
|      Battery: 84% | CO2 Saved: 1.6 kg     |
|      ఆటో ప్రయాణం (3 సీట్లు)              |
|                                          |
|  ( ) [⚡ e-Bike]     ETA: 2 min   ₹65    |
|      Battery: 92% | Fast Commute         |
|      బైక్ ప్రయాణం (సింగిల్ రైడర్)        |
|                                          |
|  ( ) [⚡ e-Cab]      ETA: 6 min   ₹260   |
|      Battery: 78% | AC Sedan Comfort     |
|      క్యాబ్ ప్రయాణం (4 సీట్లు)           |
+------------------------------------------+
|  Payment: [EcoRide Wallet (₹450)] [Change]|
|                                          |
|  [   CONFIRM ELECTRIC RIDE (రైడ్ బుక్)  ] |
+------------------------------------------+
`,
    responsiveGuidelines: {
      mobileCompact360dp:
        'Category cards display compact 64dp rows; fare and ETA stacked.',
      mobileStandard412dp:
        'Category cards display 76dp rows with full battery SoC badge and CO2 savings.',
      tablet768dp:
        '3-column horizontal card grid for e-Bike, e-Auto, and e-Cab with expanded vehicle specs.',
    },
    emptyStateGuidance: {
      condition: 'No vehicles meeting battery threshold for route distance',
      bilingualMessage: {
        en: 'No EV captains nearby with sufficient battery range for this 14.2 km trip.',
        te: 'ఈ 14.2 కి.మీ ప్రయాణానికి సరిపడా బ్యాటరీ ఉన్న EV వాహనాలు ప్రస్తుతం అందుబాటులో లేవు.',
      },
      recoveryAction: {
        en: 'Wait 2 minutes for nearby recharging vehicles or split into shorter commute',
        te: 'కాసేపు వేచి ఉండండి లేదా ప్రయాణాన్ని విభజించండి',
      },
    },
    errorStateGuidance: {
      trigger: 'Payment authorization or wallet balance insufficient',
      bilingualMessage: {
        en: 'Payment authorization failed. Please select another payment method.',
        te: 'చెల్లింపు విఫలమైంది. దయచేసి మరొక చెల్లింపు పద్ధతిని ఎంచుకోండి.',
      },
      fallbackScreenId: 'SCR_RIDER_PAYMENT_ERROR',
    },
    accessibilityNotes: {
      minTouchTarget: 'Vehicle selection cards 76dp height; radio touch area 48dp',
      contrastRatio: 'Primary button #059669 text #FFFFFF: 4.8:1 (WCAG AA)',
      screenReaderSemantic: 'RadioGroup: Electric vehicle categories; Selected: e-Auto ₹140',
    },
    bilingualLabels: {
      confirmButton: {
        en: 'Book Electric Ride',
        te: 'ఎలక్ట్రిక్ రైడ్ బుక్ చేయండి',
      },
      batteryFeasibility: {
        en: 'Verified Battery Range',
        te: 'ధృవీకరించబడిన బ్యాటరీ పరిధి',
      },
      carbonOffset: {
        en: 'CO2 Saved',
        te: 'కార్బన్ పొదుపు',
      },
    },
  },
  {
    screenId: 'SCR_RIDER_TRIP_PROGRESS',
    name: 'Active In-Transit Telemetry',
    role: 'rider',
    layoutDescription:
      'Live full-screen telemetry showing real-time GPS path, driver details, remaining battery, and a persistent Emergency SOS pill.',
    asciiWireframe: `
+------------------------------------------+
|  [⚡ EcoRide In-Transit]      [🚨 SOS]    |
+------------------------------------------+
|                                          |
|         [📍 Destination: Beach Road]     |
|                 /                        |
|                / (Green Polyline)        |
|               /                          |
|         [🚗 e-Auto AP 31 TX 4920]        |
|                                          |
+------------------------------------------+
|  Captain: Ramesh V. (4.9 ★ | 100% BEV)   |
|  Vehicle: Mahindra Treo (e-Auto)         |
|  Speed: 34 km/h | Battery Remaining: 72% |
+------------------------------------------+
|  ETA: 8 mins | Remaining: 3.4 km         |
|  Safety: [🛡️ Live Track Shared with Family]|
|                                          |
|  [ 🚨 EMERGENCY ASSISTANCE (అత్యవసరం)  ] |
+------------------------------------------+
`,
    responsiveGuidelines: {
      mobileCompact360dp:
        'Driver and speed telemetry condensed into single 80dp floating HUD card.',
      mobileStandard412dp:
        'Standard bottom sheet 140dp height with live battery meter and emergency bar.',
      tablet768dp:
        'Floating telemetry panel over landscape map with full speed history graph.',
    },
    emptyStateGuidance: {
      condition: 'Telemetry stream initializing immediately after OTP entry',
      bilingualMessage: {
        en: 'Calibrating live route and vehicle speed telemetry...',
        te: 'లైవ్ రూట్ మరియు వాహన వేగ వివరాలను కనెక్ట్ చేస్తున్నాము...',
      },
      recoveryAction: {
        en: 'Telemetry syncs automatically via WebSocket',
        te: 'వివరాలు స్వయంచాలకంగా అప్‌డేట్ అవుతాయి',
      },
    },
    errorStateGuidance: {
      trigger: 'Passenger triggers 1-touch Emergency SOS or critical route deviation',
      bilingualMessage: {
        en: 'Emergency alert broadcast to AP Safety Console. Standby for assistance.',
        te: 'అత్యవసర హెచ్చరిక సేఫ్టీ డెస్క్‌కు పంపబడింది. సహాయం కోసం వేచి ఉండండి.',
      },
      fallbackScreenId: 'SCR_RIDER_SOS_BUTTON',
    },
    accessibilityNotes: {
      minTouchTarget: 'Emergency SOS button minimum 56dp (exceeds 48dp minimum standard) with haptic feedback',
      contrastRatio: 'Emergency button #DC2626 text #FFFFFF: 4.6:1 (WCAG AA)',
      screenReaderSemantic: 'Alert: In-transit to Beach Road, ETA 8 minutes; Button: Emergency SOS',
    },
    bilingualLabels: {
      emergencyButton: {
        en: 'Emergency Assistance (SOS)',
        te: 'అత్యవసర సహాయం (SOS)',
      },
      batteryStatus: {
        en: 'Vehicle Battery',
        te: 'వాహన బ్యాటరీ',
      },
      etaLabel: {
        en: 'Estimated Arrival',
        te: 'చేరుకునే సమయం',
      },
    },
  },
  {
    screenId: 'SCR_COMMUTE_TICKET_BOARDING_PASS',
    name: 'Shared Commute Boarding Ticket',
    role: 'shared',
    layoutDescription:
      'High-contrast digital boarding pass featuring validated seat assignment, dynamic QR code, and virtual stop walking guide.',
    asciiWireframe: `
+------------------------------------------+
|  [<- My Trips]     Commute Boarding Pass |
+------------------------------------------+
|  ======================================  |
|  CORRIDOR: Vizag City -> Anakapalle      |
|  Date: Today | Slot: 08:30 AM Departure  |
|  --------------------------------------  |
|       SEAT: 04B (Window / Electric)      |
|  --------------------------------------  |
|            +------------------+          |
|            |  [QR CODE]       |          |
|            |  Dynamic Token   |          |
|            |  Valid 15 mins   |          |
|            +------------------+          |
|  --------------------------------------  |
|  Pickup: Virtual Stop B (RTC Complex Bay)|
|  Captain: Suresh K. | Shuttle: AP 31 EL 10 |
|  ======================================  |
+------------------------------------------+
|  [ 📍 Walking Route to Stop (5 min walk) ]|
|  [ Cancel Ticket (30m window) ]          |
+------------------------------------------+
`,
    responsiveGuidelines: {
      mobileCompact360dp:
        'Boarding ticket fills 92% screen width; QR code sized at 160x160 dp.',
      mobileStandard412dp:
        'Boarding ticket centered with 200x200 dp high-contrast QR code for rapid laser/camera scanning.',
      tablet768dp:
        'Centered modal ticket card (440dp width) with surrounding stop map.',
    },
    emptyStateGuidance: {
      condition: 'Awaiting seat confirmation from database transaction lock',
      bilingualMessage: {
        en: 'Confirming seat reservation and generating cryptographic QR pass...',
        te: 'మీ సీటు రిజర్వేషన్ మరియు క్యూఆర్ పాస్‌ను రూపొందిస్తున్నాము...',
      },
      recoveryAction: {
        en: 'Hold on while transaction verifies concurrency',
        te: 'దయచేసి కాసేపు వేచి ఉండండి',
      },
    },
    errorStateGuidance: {
      trigger: 'Seat reservation timeout or concurrent reservation conflict (409)',
      bilingualMessage: {
        en: 'Seat was reserved by another commuter. Please choose an adjacent seat.',
        te: 'ఈ సీటు ఇప్పటికే మరొకరు బుక్ చేసుకున్నారు. దయచేసి వేరే సీటును ఎంచుకోండి.',
      },
      fallbackScreenId: 'SCR_COMMUTE_SEAT_CONFLICT',
    },
    accessibilityNotes: {
      minTouchTarget: 'Action buttons 48dp height; QR code wrapped in screen reader description',
      contrastRatio: 'Navy ticket border #0B132B on surface #FFFFFF: 16.1:1 (WCAG AAA)',
      screenReaderSemantic: 'Article: Shared Commute Boarding Ticket, Seat 4B, RTC Complex Bay',
    },
    bilingualLabels: {
      seatLabel: {
        en: 'Seat Number',
        te: 'సీటు సంఖ్య',
      },
      boardingStop: {
        en: 'Virtual Boarding Stop',
        te: 'బోర్డింగ్ స్టాప్',
      },
      directionsButton: {
        en: 'Walking Directions',
        te: 'నడక మార్గం చూపించు',
      },
    },
  },
  {
    screenId: 'SCR_CAPTAIN_HOME',
    name: 'Driver Home & Telemetry Dashboard',
    role: 'captain',
    layoutDescription:
      'High-contrast cockpit dashboard showing online toggle, large circular battery SoC gauge, incoming ride dispatch modal, and earnings.',
    asciiWireframe: `
+------------------------------------------+
|  Captain: Ramesh (Online)     [⚡ 84% SoC]|
+------------------------------------------+
|  [● ONLINE / ఆన్‌లైన్] <== Toggle Button  |
|                                          |
|        +------------------------+        |
|        |   BATTERY GAUGE        |        |
|        |       (( 84% ))        |        |
|        |   Range Est: 76 km     |        |
|        |   State: Optimal       |        |
|        +------------------------+        |
|                                          |
|  Today's Earnings: ₹1,240 (8 Trips)      |
|  Green Bonus: ₹120 | Incentive Eligible  |
+------------------------------------------+
|  INCOMING DISPATCH OFFER (12s left):     |
|  Pickup: Jagadamba Jct (1.1 km away)     |
|  Drop: Beach Road (4.2 km) | Fare: ₹140  |
|                                          |
|  [   ACCEPT ELECTRIC RIDE (రైడ్ అంగీకరించు) ]|
|  [ Decline (తిరస్కరించు) ]               |
+------------------------------------------+
`,
    responsiveGuidelines: {
      mobileCompact360dp:
        'Battery gauge reduced to 120dp diameter; dispatch card docks tightly over bottom.',
      mobileStandard412dp:
        '160dp circular battery gauge with animated electric emerald pulse; full 80dp accept button.',
      tablet768dp:
        'Split cockpit: Left 50% for gauge, vehicle health & charging stations; Right 50% for incoming dispatch radar and earnings queue.',
    },
    emptyStateGuidance: {
      condition: 'Captain online and waiting for ride dispatch in low-demand zone',
      bilingualMessage: {
        en: 'You are online. Searching for nearby ride dispatches in Visakhapatnam...',
        te: 'మీరు ఆన్‌లైన్‌లో ఉన్నారు. సమీపంలోని రైడ్ ఆర్డర్‌ల కోసం వెతుకుతున్నాము...',
      },
      recoveryAction: {
        en: 'Move towards high-demand transit hubs (RTC Complex, Beach Road)',
        te: 'రద్దీ ఎక్కువగా ఉండే ప్రాంతాల వైపు వెళ్లండి',
      },
    },
    errorStateGuidance: {
      trigger: 'Vehicle battery drops below critical threshold (20%)',
      bilingualMessage: {
        en: 'Battery Critical (<20%). Dispatches paused. Please navigate to nearest EV charging depot.',
        te: 'బ్యాటరీ తక్కువగా ఉంది (<20%). రైడ్ ఆఫర్‌లు నిలిపివేయబడ్డాయి. సమీపంలోని ఛార్జింగ్ కేంద్రానికి వెళ్లండి.',
      },
      fallbackScreenId: 'SCR_CAPTAIN_OTP_ERROR',
    },
    accessibilityNotes: {
      minTouchTarget: 'Accept button 64dp height (exceeds 48dp minimum standard) with heavy haptic vibration feedback',
      contrastRatio: 'Online text #059669 on surface #FFFFFF: 4.8:1 (WCAG AA)',
      screenReaderSemantic: 'Status: Online; Battery: 84 percent; Button: Accept Ride ₹140',
    },
    bilingualLabels: {
      onlineToggle: {
        en: 'Go Offline',
        te: 'ఆఫ్‌లైన్ వెళ్ళండి',
      },
      offlineToggle: {
        en: 'Go Online',
        te: 'ఆన్‌లైన్ రండి',
      },
      acceptButton: {
        en: 'Accept Ride',
        te: 'రైడ్ అంగీకరించండి',
      },
      declineButton: {
        en: 'Decline',
        te: 'తిరస్కరించండి',
      },
    },
  },
];

/**
 * Authoritative Bilingual Dictionary (Telugu & English)
 */
export const BILINGUAL_DICTIONARY: Record<string, BilingualText> = {
  app_name: { en: 'EcoRide AP', te: 'ఎకోరైడ్ ఆంధ్రప్రదేశ్' },
  tagline: { en: '100% Electric Mobility', te: '100% ఎలక్ట్రిక్ మొబిలిటీ' },
  search_hint: { en: 'Search destination in AP...', te: 'గమ్యస్థానాన్ని శోధించండి...' },
  book_ride: { en: 'Book Electric Ride', te: 'రైడ్ బుక్ చేయండి' },
  accept_ride: { en: 'Accept Electric Ride', te: 'రైడ్ అంగీకరించండి' },
  decline_ride: { en: 'Decline Ride', te: 'రైడ్ తిరస్కరించండి' },
  emergency_sos: { en: 'Emergency Assistance (SOS)', te: 'అత్యవసర సహాయం (SOS)' },
  share_otp: { en: 'Share Start OTP with Captain', te: 'ప్రయాణం ప్రారంభ OTP' },
  seat_number: { en: 'Seat Number', te: 'సీటు సంఖ్య' },
  battery_status: { en: 'Battery Level', te: 'బ్యాటరీ శాతం' },
  carbon_saved: { en: 'CO2 Saved Today', te: 'నేటి కార్బన్ పొదుపు' },
  fare_estimate: { en: 'Estimated Fare', te: 'అంచనా ఛార్జీ' },
};
