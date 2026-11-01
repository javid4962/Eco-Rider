import {
  UserRole,
  JourneyType,
  UserStory,
  JourneyFlow,
  ScreenNode,
} from '@ecoride/contracts';

/**
 * 7 Key Platform Roles User Stories
 */
export const USER_STORIES: UserStory[] = [
  {
    id: 'US-RID-01',
    role: UserRole.RIDER,
    title: 'On-Demand EV Ride Discovery & Range-Assured Booking',
    narrative:
      'As a daily commuter in Visakhapatnam, I want to book an on-demand commercial EV (e-Bike, e-Auto, or e-Cab) with verified battery range, so that I have zero cancellation anxiety, transparent fare, and zero emissions.',
    acceptanceCriteria: [
      'Destination search enforces pilot zone boundaries (Visakhapatnam).',
      'Display estimated fare, trip distance, and remaining captain battery percentage.',
      'Reject dispatch if assigned captain battery SoC is under 20% or insufficient for route.',
      'Generate secure 4-digit start OTP displayed to rider upon captain arrival.',
    ],
  },
  {
    id: 'US-CAP-01',
    role: UserRole.CAPTAIN,
    title: 'Commercial EV Onboarding & Battery Telemetry Broadcasting',
    narrative:
      'As an EV driver partner, I want to register my commercial green-plate EV, verify my commercial driving badge, and broadcast my real-time battery SoC %, so that I only receive dispatch offers I can fulfill without getting stranded.',
    acceptanceCriteria: [
      'Upload commercial driving license and RTO EV green-plate registration.',
      'Client telemetry service broadcasts GPS location and battery SoC % every 5 seconds.',
      'Receive dispatch offers with a 15-second acceptance timer backed by a mutex lock.',
      'Verify rider OTP before starting trip meter and see immediate daily payout upon completion.',
    ],
  },
  {
    id: 'US-DIS-01',
    role: UserRole.DISPATCHER,
    title: 'Regional Fleet Heatmap & Battery Emergency Override',
    narrative:
      'As an operations dispatcher, I want a live map of active EV clusters, charging hubs, and pending ride requests, so that I can rebalance vehicles and manually reassign stranded passengers when a vehicle suffers battery breakdown.',
    acceptanceCriteria: [
      'View real-time PostGIS spatial clusters of available, busy, and charging EVs.',
      'Detect automated alerts when an en-route EV battery drops below critical threshold (10%).',
      'Manual one-click reassignment of stranded rider to nearest relief EV.',
    ],
  },
  {
    id: 'US-FLE-01',
    role: UserRole.FLEET_OWNER,
    title: 'Multi-Vehicle EV Roster & Aggregate Battery Health Dashboard',
    narrative:
      'As a commercial fleet owner operating 25 e-Autos, I want to manage my vehicle roster, assign vetted captains, and monitor battery degradation and daily revenue splits, so that my fleet operates at peak efficiency.',
    acceptanceCriteria: [
      'Add/remove vehicles and pair them with active vetted captains.',
      'View battery cycle count, State of Health (SoH %), and charging logs per vehicle.',
      'Download daily and weekly commission reconciliation statements.',
    ],
  },
  {
    id: 'US-FIN-01',
    role: UserRole.FINANCE,
    title: 'Immutable Ledger Audit & Automated SLA Delay Compensation',
    narrative:
      'As a finance manager, I want an immutable, idempotent ledger of all ride transactions and automated compensation payouts for SLA breaches, so that rider credits are issued accurately and financial books balance.',
    acceptanceCriteria: [
      'Maintain double-entry transaction ledgers for rider charges, platform fees, and captain payouts.',
      'Automatically trigger delay compensation credit when trip tardiness exceeds 10 minutes.',
      'Audit and disburse approved cancellation and failed payment refunds.',
    ],
  },
  {
    id: 'US-SAF-01',
    role: UserRole.SAFETY,
    title: '24/7 Incident Console & Live Police 112 Emergency Dispatch',
    narrative:
      'As a safety response officer, I want an instant audio-visual siren and live GPS telemetry when SOS is triggered, so that I can intervene immediately and dispatch AP Emergency Police 112 with trip data.',
    acceptanceCriteria: [
      'Receive instant high-priority alert within 1 second of rider or captain SOS button press.',
      'Access live audio stream, vehicle speed telemetry, and route deviation history.',
      'Dispatch automated emergency packet (lat/lon, vehicle plate, passenger contact) to AP Police 112.',
    ],
  },
  {
    id: 'US-INS-01',
    role: UserRole.INSTITUTION,
    title: 'Corporate & University Commuter Pass Subsidy Administration',
    narrative:
      'As a university or corporate transport administrator, I want to manage an institutional subsidy account, allocate monthly EV passes to registered members, and track CO2 emission savings, so that our organization fosters sustainable commuting.',
    acceptanceCriteria: [
      'Bulk provision monthly pass quotas to registered student/employee mobile numbers.',
      'Set time-of-day and corridor restrictions for subsidized rides.',
      'Export verifiable monthly ESG sustainability reports showing carbon offset kilograms.',
    ],
  },
];

/**
 * 5 State-Oriented Journeys
 * Every journey step includes:
 * - Success path (action, next state, next screen)
 * - Empty state (condition, display message, recovery action)
 * - Failure path (trigger, error state, fallback screen)
 * - Responsible actor
 * No screen is orphaned: every screen transitions to a registered next screen or terminal state.
 */
export const JOURNEY_FLOWS: JourneyFlow[] = [
  {
    type: JourneyType.PRIVATE_RIDE,
    title: 'Private EV On-Demand Ride Journey',
    description:
      'End-to-end lifecycle of an on-demand private electric ride from destination search to carbon-neutral receipt.',
    participatingRoles: [UserRole.RIDER, UserRole.CAPTAIN],
    initialState: 'LOCATION_SEARCH',
    initialScreenId: 'SCR_RIDER_SEARCH',
    terminalStates: ['TRIP_COMPLETED', 'RIDE_CANCELLED'],
    steps: [
      {
        stepId: 'PR-01',
        stateName: 'LOCATION_SEARCH',
        screenId: 'SCR_RIDER_SEARCH',
        responsibleActor: UserRole.RIDER,
        description: 'Rider enters destination and verifies pickup pin.',
        successPath: {
          action: 'Selects valid pickup and dropoff coordinates in Visakhapatnam',
          nextState: 'FARE_ESTIMATION',
          nextScreenId: 'SCR_RIDER_VEHICLE_SELECT',
        },
        emptyState: {
          condition: 'No search history or recent destinations found',
          displayMessage: 'Enter your destination or tap popular transit hubs in Vizag.',
          recoveryAction: 'Tap search bar or select preset railway/airport terminal',
        },
        failurePath: {
          trigger: 'Selected coordinates fall outside authorized pilot zone',
          errorState: 'ZONE_RESTRICTED',
          fallbackScreenId: 'SCR_RIDER_ZONE_RESTRICTED',
        },
      },
      {
        stepId: 'PR-02',
        stateName: 'FARE_ESTIMATION',
        screenId: 'SCR_RIDER_VEHICLE_SELECT',
        responsibleActor: UserRole.RIDER,
        description: 'Rider reviews vehicle categories (e-Bike, e-Auto, e-Cab) and confirms fare.',
        successPath: {
          action: 'Selects vehicle category and taps Book Electric Ride',
          nextState: 'DISPATCHING',
          nextScreenId: 'SCR_RIDER_MATCHING',
        },
        emptyState: {
          condition: 'No active EV captains within 5 km radar',
          displayMessage: 'All EV captains are currently charging or on trips nearby.',
          recoveryAction: 'Expand search radius or tap notify when captain is free',
        },
        failurePath: {
          trigger: 'Payment method authorization fails or battery feasibility check fails',
          errorState: 'DISPATCH_REJECTED',
          fallbackScreenId: 'SCR_RIDER_PAYMENT_ERROR',
        },
      },
      {
        stepId: 'PR-03',
        stateName: 'DISPATCHING',
        screenId: 'SCR_RIDER_MATCHING',
        responsibleActor: UserRole.CAPTAIN,
        description: 'System broadcasts ride offer to nearby captains; captain accepts with mutex lock.',
        successPath: {
          action: 'Captain accepts dispatch within 15-second window',
          nextState: 'EN_ROUTE_PICKUP',
          nextScreenId: 'SCR_RIDER_LIVE_TRACK',
        },
        emptyState: {
          condition: 'Offer sent, awaiting first available captain response',
          displayMessage: 'Connecting with nearby commercial green-plate EV captains...',
          recoveryAction: 'Keep radar active up to 45 seconds',
        },
        failurePath: {
          trigger: 'No captain accepts within 45 seconds or all reject',
          errorState: 'DISPATCH_TIMEOUT',
          fallbackScreenId: 'SCR_RIDER_NO_CAPTAINS_TIMEOUT',
        },
      },
      {
        stepId: 'PR-04',
        stateName: 'EN_ROUTE_PICKUP',
        screenId: 'SCR_RIDER_LIVE_TRACK',
        responsibleActor: UserRole.CAPTAIN,
        description: 'Captain navigates to passenger pickup location with live GPS updates.',
        successPath: {
          action: 'Captain vehicle enters 50m geofence of pickup coordinate',
          nextState: 'ARRIVED',
          nextScreenId: 'SCR_RIDER_OTP_DISPLAY',
        },
        emptyState: {
          condition: 'Captain GPS is updating along calculated shortest route',
          displayMessage: 'Captain is en route in e-Vehicle. ETA updating in real time.',
          recoveryAction: 'Call or message captain via in-app masked VoIP',
        },
        failurePath: {
          trigger: 'Rider cancels ride > 2 mins after acceptance or captain vehicle breakdowns',
          errorState: 'RIDE_CANCELLED',
          fallbackScreenId: 'SCR_RIDE_CANCELLED',
        },
      },
      {
        stepId: 'PR-05',
        stateName: 'ARRIVED',
        screenId: 'SCR_RIDER_OTP_DISPLAY',
        responsibleActor: UserRole.CAPTAIN,
        description: 'Captain arrives at pickup location and prompts for start OTP.',
        successPath: {
          action: 'Captain inputs and validates rider 4-digit start OTP',
          nextState: 'IN_TRANSIT',
          nextScreenId: 'SCR_RIDER_TRIP_PROGRESS',
        },
        emptyState: {
          condition: 'Captain waiting at pickup spot for rider boarding',
          displayMessage: 'Captain has arrived. Share your 4-digit OTP to start trip.',
          recoveryAction: 'Show large format OTP screen to captain',
        },
        failurePath: {
          trigger: 'Invalid OTP entered 3 times consecutively or rider no-show after 5 mins',
          errorState: 'OTP_FAILED',
          fallbackScreenId: 'SCR_CAPTAIN_OTP_ERROR',
        },
      },
      {
        stepId: 'PR-06',
        stateName: 'IN_TRANSIT',
        screenId: 'SCR_RIDER_TRIP_PROGRESS',
        responsibleActor: UserRole.CAPTAIN,
        description: 'Vehicle is travelling towards destination with active speed and battery tracking.',
        successPath: {
          action: 'Vehicle arrives at destination dropoff coordinate and captain ends trip',
          nextState: 'TRIP_COMPLETED',
          nextScreenId: 'SCR_RIDER_RATING_RECEIPT',
        },
        emptyState: {
          condition: 'Live navigation active, speed within city speed limits',
          displayMessage: 'Trip in progress. Zero tailpipe emission journey underway.',
          recoveryAction: 'View live route or trigger Emergency SOS if unsafe',
        },
        failurePath: {
          trigger: 'Critical route deviation or rider triggers Emergency SOS',
          errorState: 'EMERGENCY_TRIGGERED',
          fallbackScreenId: 'SCR_RIDER_SOS_BUTTON',
        },
      },
      {
        stepId: 'PR-07',
        stateName: 'TRIP_COMPLETED',
        screenId: 'SCR_RIDER_RATING_RECEIPT',
        responsibleActor: UserRole.RIDER,
        description: 'Rider reviews digital fare breakdown, carbon offset, and rates the captain.',
        successPath: {
          action: 'Rider submits rating and payment settles automatically',
          nextState: 'TRIP_COMPLETED',
          nextScreenId: 'SCR_RIDER_SEARCH',
        },
        emptyState: {
          condition: 'Rating prompt awaiting rider stars feedback',
          displayMessage: 'Trip completed successfully! You saved 1.4 kg of CO2 today.',
          recoveryAction: 'Rate captain from 1 to 5 stars or tap Skip',
        },
        failurePath: {
          trigger: 'Payment deduction fails at destination checkout',
          errorState: 'PAYMENT_PENDING',
          fallbackScreenId: 'SCR_RIDER_PAYMENT_ERROR',
        },
      },
    ],
  },
  {
    type: JourneyType.SHARED_SEAT,
    title: 'Scheduled Shared EV Commute Journey',
    description:
      'Scheduled seat reservation along high-density corridors with virtual stop boarding and concurrency lock.',
    participatingRoles: [UserRole.RIDER, UserRole.CAPTAIN, UserRole.DISPATCHER],
    initialState: 'CORRIDOR_BROWSE',
    initialScreenId: 'SCR_COMMUTE_CORRIDORS',
    terminalStates: ['SHARED_TRIP_COMPLETED', 'SHARED_BOOKING_CANCELLED'],
    steps: [
      {
        stepId: 'SS-01',
        stateName: 'CORRIDOR_BROWSE',
        screenId: 'SCR_COMMUTE_CORRIDORS',
        responsibleActor: UserRole.RIDER,
        description: 'Rider browses scheduled EV shuttle corridors and departure time slots.',
        successPath: {
          action: 'Selects corridor (e.g. Vizag - Anakapalle) and departure time slot',
          nextState: 'SEAT_SELECTION',
          nextScreenId: 'SCR_COMMUTE_SEAT_MAP',
        },
        emptyState: {
          condition: 'No upcoming scheduled shuttles on selected date',
          displayMessage: 'No scheduled EV shuttles running at this time slot.',
          recoveryAction: 'Browse alternative departure times or book private EV',
        },
        failurePath: {
          trigger: 'Corridor closed due to adverse weather or road maintenance',
          errorState: 'CORRIDOR_INACTIVE',
          fallbackScreenId: 'SCR_COMMUTE_CORRIDOR_CLOSED',
        },
      },
      {
        stepId: 'SS-02',
        stateName: 'SEAT_SELECTION',
        screenId: 'SCR_COMMUTE_SEAT_MAP',
        responsibleActor: UserRole.RIDER,
        description: 'Rider chooses specific seat on vehicle layout with concurrency lock.',
        successPath: {
          action: 'Selects available seat and acquires 5-minute database reservation lock',
          nextState: 'BOOKING_CONFIRMATION',
          nextScreenId: 'SCR_COMMUTE_TICKET_BOARDING_PASS',
        },
        emptyState: {
          condition: 'Seat layout loaded, awaiting seat selection',
          displayMessage: 'Select your preferred seat. Green is available, pink is female-priority.',
          recoveryAction: 'Tap available seat icon',
        },
        failurePath: {
          trigger: 'Seat booked simultaneously by another commuter (409 Conflict)',
          errorState: 'SEAT_UNAVAILABLE',
          fallbackScreenId: 'SCR_COMMUTE_SEAT_CONFLICT',
        },
      },
      {
        stepId: 'SS-03',
        stateName: 'BOOKING_CONFIRMATION',
        screenId: 'SCR_COMMUTE_TICKET_BOARDING_PASS',
        responsibleActor: UserRole.RIDER,
        description: 'Rider receives digital QR boarding pass with stop ETA.',
        successPath: {
          action: 'Boarding pass generated and added to upcoming trips',
          nextState: 'BOARDING_SCAN',
          nextScreenId: 'SCR_COMMUTE_QR_SCANNER',
        },
        emptyState: {
          condition: 'Waiting for scheduled departure time',
          displayMessage: 'Your seat is confirmed! Be at Virtual Stop A 5 minutes before departure.',
          recoveryAction: 'View walking directions to virtual pickup stop',
        },
        failurePath: {
          trigger: 'Commuter cancels booking 30 minutes before slot',
          errorState: 'SHARED_BOOKING_CANCELLED',
          fallbackScreenId: 'SCR_COMMUTE_CORRIDORS',
        },
      },
      {
        stepId: 'SS-04',
        stateName: 'BOARDING_SCAN',
        screenId: 'SCR_COMMUTE_QR_SCANNER',
        responsibleActor: UserRole.CAPTAIN,
        description: 'Captain scans rider QR code at virtual pickup stop.',
        successPath: {
          action: 'QR code verified against manifest; passenger boards',
          nextState: 'CORRIDOR_IN_TRANSIT',
          nextScreenId: 'SCR_COMMUTE_ROUTE_PROGRESS',
        },
        emptyState: {
          condition: 'Captain awaiting passenger arrival at virtual stop',
          displayMessage: 'Scanning passenger boarding passes for scheduled route...',
          recoveryAction: 'Scan passenger boarding pass with camera',
        },
        failurePath: {
          trigger: 'Passenger no-show 3 minutes past scheduled departure',
          errorState: 'PASSENGER_NO_SHOW',
          fallbackScreenId: 'SCR_COMMUTE_CORRIDORS',
        },
      },
      {
        stepId: 'SS-05',
        stateName: 'CORRIDOR_IN_TRANSIT',
        screenId: 'SCR_COMMUTE_ROUTE_PROGRESS',
        responsibleActor: UserRole.CAPTAIN,
        description: 'EV shuttle traverses corridor with scheduled alighting stops.',
        successPath: {
          action: 'Passenger reaches designated destination stop and alights',
          nextState: 'SHARED_TRIP_COMPLETED',
          nextScreenId: 'SCR_COMMUTE_RECEIPT',
        },
        emptyState: {
          condition: 'Vehicle moving along fixed corridor route',
          displayMessage: 'Next stop: Gajuwaka Junction in 6 minutes.',
          recoveryAction: 'View upcoming stops list or notify captain for stop',
        },
        failurePath: {
          trigger: 'Vehicle battery drops under 10% or technical breakdown',
          errorState: 'DISPATCH_RESCUE',
          fallbackScreenId: 'SCR_COMMUTE_CORRIDOR_CLOSED',
        },
      },
      {
        stepId: 'SS-06',
        stateName: 'SHARED_TRIP_COMPLETED',
        screenId: 'SCR_COMMUTE_RECEIPT',
        responsibleActor: UserRole.RIDER,
        description: 'Shared commute completed; green commuter points awarded.',
        successPath: {
          action: 'Rider views commute savings and returns to corridor dashboard',
          nextState: 'SHARED_TRIP_COMPLETED',
          nextScreenId: 'SCR_COMMUTE_CORRIDORS',
        },
        emptyState: {
          condition: 'Shared trip summary displayed',
          displayMessage: 'You saved ₹120 compared to private cab and offset 2.8 kg CO2.',
          recoveryAction: 'Book return commute or return to home',
        },
        failurePath: {
          trigger: 'Dispute filed regarding seat or delayed departure',
          errorState: 'DISPUTE_FILED',
          fallbackScreenId: 'SCR_RIDER_TRIP_DELAY_ALERT',
        },
      },
    ],
  },
  {
    type: JourneyType.PASS_REDEMPTION,
    title: 'Commuter Pass Purchase & Redemption Journey',
    description:
      'Lifecycle of purchasing, activating, and deducting prepaid EV ride entitlements.',
    participatingRoles: [UserRole.RIDER, UserRole.FINANCE, UserRole.INSTITUTION],
    initialState: 'PASS_CATALOG',
    initialScreenId: 'SCR_PASS_CATALOG',
    terminalStates: ['REDEMPTION_FULFILLED', 'PASS_EXPIRED'],
    steps: [
      {
        stepId: 'PR-PASS-01',
        stateName: 'PASS_CATALOG',
        screenId: 'SCR_PASS_CATALOG',
        responsibleActor: UserRole.RIDER,
        description: 'Rider reviews available weekly and monthly EV commuter passes.',
        successPath: {
          action: 'Purchases pass or redeems institutional corporate code',
          nextState: 'PASS_ACTIVE',
          nextScreenId: 'SCR_PASS_WALLET_DASHBOARD',
        },
        emptyState: {
          condition: 'No active pass in rider wallet',
          displayMessage: 'Save up to 40% on daily commute with an EcoRide Electric Pass.',
          recoveryAction: 'Explore Weekly 10-Ride or Monthly 30-Ride plans',
        },
        failurePath: {
          trigger: 'Payment gateway fails or corporate voucher invalid/exhausted',
          errorState: 'PURCHASE_FAILED',
          fallbackScreenId: 'SCR_PASS_QUOTA_EXHAUSTED',
        },
      },
      {
        stepId: 'PR-PASS-02',
        stateName: 'PASS_ACTIVE',
        screenId: 'SCR_PASS_WALLET_DASHBOARD',
        responsibleActor: UserRole.RIDER,
        description: 'Rider views remaining pass ride quota and validity window.',
        successPath: {
          action: 'Selects Apply Pass to Next Ride during checkout',
          nextState: 'PASS_APPLIED',
          nextScreenId: 'SCR_RIDER_CHECKOUT_WITH_PASS',
        },
        emptyState: {
          condition: 'Pass active, awaiting next ride booking',
          displayMessage: 'Pass Active: 26 of 30 rides remaining. Valid for 24 days.',
          recoveryAction: 'Tap Book Ride Using Pass',
        },
        failurePath: {
          trigger: 'Pass reaches expiration date or daily limit of 2 rides reached',
          errorState: 'PASS_EXPIRED',
          fallbackScreenId: 'SCR_PASS_LIMIT_REACHED',
        },
      },
      {
        stepId: 'PR-PASS-03',
        stateName: 'PASS_APPLIED',
        screenId: 'SCR_RIDER_CHECKOUT_WITH_PASS',
        responsibleActor: UserRole.RIDER,
        description: 'System verifies trip distance and subtracts 1 pass token from balance.',
        successPath: {
          action: 'Pass token deducted and ride fare discounted to ₹0 base rate',
          nextState: 'REDEMPTION_FULFILLED',
          nextScreenId: 'SCR_PASS_CONFIRMATION',
        },
        emptyState: {
          condition: 'Checkout calculations verifying pass entitlement',
          displayMessage: 'Applying EcoRide Commuter Pass token to this trip...',
          recoveryAction: 'Confirm trip booking with 1 token deduction',
        },
        failurePath: {
          trigger: 'Trip distance exceeds pass tier cap (e.g. >15 km requires top-up fee)',
          errorState: 'DISTANCE_CAP_EXCEEDED',
          fallbackScreenId: 'SCR_PASS_DISTANCE_TOPUP',
        },
      },
      {
        stepId: 'PR-PASS-04',
        stateName: 'REDEMPTION_FULFILLED',
        screenId: 'SCR_PASS_CONFIRMATION',
        responsibleActor: UserRole.FINANCE,
        description: 'Token redemption recorded in ledger and ride dispatched.',
        successPath: {
          action: 'Rider proceeds to live dispatch matching',
          nextState: 'REDEMPTION_FULFILLED',
          nextScreenId: 'SCR_RIDER_MATCHING',
        },
        emptyState: {
          condition: 'Redemption receipt displayed',
          displayMessage: 'Pass applied successfully! 1 token deducted from wallet.',
          recoveryAction: 'Track your dispatched EV ride',
        },
        failurePath: {
          trigger: 'Ledger lock concurrency error during token deduction',
          errorState: 'REDEMPTION_LOCK_FAILED',
          fallbackScreenId: 'SCR_PASS_WALLET_DASHBOARD',
        },
      },
    ],
  },
  {
    type: JourneyType.REFUND,
    title: 'On-Time Guarantee Breach & Refund Compensation Journey',
    description:
      'Automated SLA verification, delay credit issuance, and cancelled ride refund ledger.',
    participatingRoles: [UserRole.RIDER, UserRole.FINANCE, UserRole.SAFETY],
    initialState: 'SLA_AUDIT_TRIGGER',
    initialScreenId: 'SCR_RIDER_TRIP_DELAY_ALERT',
    terminalStates: ['REFUND_COMPLETED', 'REFUND_REJECTED'],
    steps: [
      {
        stepId: 'RF-01',
        stateName: 'SLA_AUDIT_TRIGGER',
        screenId: 'SCR_RIDER_TRIP_DELAY_ALERT',
        responsibleActor: UserRole.RIDER,
        description: 'Trip exceeds promised ETA by > 10 mins or cancelled due to platform fault.',
        successPath: {
          action: 'Automated SLA breach detected by telemetry auditor',
          nextState: 'CLAIM_EVALUATION',
          nextScreenId: 'SCR_FINANCE_REFUND_DESK',
        },
        emptyState: {
          condition: 'Monitoring trip progress against initial estimated arrival time',
          displayMessage: 'Calculating arrival time variance against on-time guarantee SLA...',
          recoveryAction: 'View real-time traffic delay metrics',
        },
        failurePath: {
          trigger: 'Delay caused by rider destination change or unverified claim',
          errorState: 'REFUND_INELIGIBLE',
          fallbackScreenId: 'SCR_REFUND_INELIGIBLE',
        },
      },
      {
        stepId: 'RF-02',
        stateName: 'CLAIM_EVALUATION',
        screenId: 'SCR_FINANCE_REFUND_DESK',
        responsibleActor: UserRole.FINANCE,
        description: 'Finance rules engine verifies telematics and assesses compensation amount.',
        successPath: {
          action: 'Rules engine approves 100% fare credit or pro-rata refund',
          nextState: 'DISBURSEMENT',
          nextScreenId: 'SCR_FINANCE_LEDGER_PROCESSING',
        },
        emptyState: {
          condition: 'Claim queued in automated audit pipeline',
          displayMessage: 'Verifying GPS speed records and captain delay telemetry...',
          recoveryAction: 'Automated verification runs in background within 60 seconds',
        },
        failurePath: {
          trigger: 'Duplicate claim or fraud detection rule triggered',
          errorState: 'REFUND_REJECTED',
          fallbackScreenId: 'SCR_REFUND_FRAUD_REJECTED',
        },
      },
      {
        stepId: 'RF-03',
        stateName: 'DISBURSEMENT',
        screenId: 'SCR_FINANCE_LEDGER_PROCESSING',
        responsibleActor: UserRole.FINANCE,
        description: 'Idempotent disbursement of ride credit voucher or bank refund.',
        successPath: {
          action: 'Funds credited to rider in-app wallet or original payment instrument',
          nextState: 'REFUND_COMPLETED',
          nextScreenId: 'SCR_RIDER_REFUND_SUCCESS',
        },
        emptyState: {
          condition: 'Disbursement webhook awaiting banking settlement confirmation',
          displayMessage: 'Issuing refund voucher to your EcoRide green wallet...',
          recoveryAction: 'Check wallet transaction log',
        },
        failurePath: {
          trigger: 'Banking gateway timeout or closed user account',
          errorState: 'PAYOUT_FAILED',
          fallbackScreenId: 'SCR_REFUND_BANK_RETRY',
        },
      },
      {
        stepId: 'RF-04',
        stateName: 'REFUND_COMPLETED',
        screenId: 'SCR_RIDER_REFUND_SUCCESS',
        responsibleActor: UserRole.RIDER,
        description: 'Rider receives notification and credit balance is available for next trip.',
        successPath: {
          action: 'Rider acknowledges refund and returns to home screen',
          nextState: 'REFUND_COMPLETED',
          nextScreenId: 'SCR_RIDER_SEARCH',
        },
        emptyState: {
          condition: 'Compensation voucher successfully deposited',
          displayMessage: '₹85 delay credit has been added to your EcoRide wallet.',
          recoveryAction: 'Use credit for next booking or transfer to bank',
        },
        failurePath: {
          trigger: 'Dispute escalation requested by passenger',
          errorState: 'DISPUTE_ESCALATED',
          fallbackScreenId: 'SCR_REFUND_INELIGIBLE',
        },
      },
    ],
  },
  {
    type: JourneyType.EMERGENCY,
    title: 'Emergency SOS & Police 112 Dispatch Journey',
    description:
      'High-priority security workflow from passenger/captain SOS trigger to AP Police 112 intervention.',
    participatingRoles: [UserRole.RIDER, UserRole.CAPTAIN, UserRole.SAFETY, UserRole.DISPATCHER],
    initialState: 'SOS_TRIGGERED',
    initialScreenId: 'SCR_RIDER_SOS_BUTTON',
    terminalStates: ['INCIDENT_RESOLVED', 'SOS_CANCELLED'],
    steps: [
      {
        stepId: 'EM-01',
        stateName: 'SOS_TRIGGERED',
        screenId: 'SCR_RIDER_SOS_BUTTON',
        responsibleActor: UserRole.RIDER,
        description: 'Rider or captain presses Emergency SOS button with 3-second haptic countdown.',
        successPath: {
          action: '3-second timer expires or user immediately confirms Emergency',
          nextState: 'CRITICAL_ALERT_ACTIVE',
          nextScreenId: 'SCR_SAFETY_CONSOLE_INCIDENT',
        },
        emptyState: {
          condition: 'Countdown active with cancel option',
          displayMessage: 'Emergency Alert sending to 24/7 Safety Desk in 3 seconds...',
          recoveryAction: 'Tap Cancel if pressed by mistake',
        },
        failurePath: {
          trigger: 'User cancels within 3-second countdown window',
          errorState: 'SOS_CANCELLED',
          fallbackScreenId: 'SCR_RIDER_TRIP_PROGRESS',
        },
      },
      {
        stepId: 'EM-02',
        stateName: 'CRITICAL_ALERT_ACTIVE',
        screenId: 'SCR_SAFETY_CONSOLE_INCIDENT',
        responsibleActor: UserRole.SAFETY,
        description: 'Safety operations center console flashes siren with live GPS and vehicle telemetry.',
        successPath: {
          action: 'Safety officer answers alert, verifies situation, and initiates escalation',
          nextState: 'INCIDENT_INTERVENTION',
          nextScreenId: 'SCR_SAFETY_DISPATCH_ESCALATION',
        },
        emptyState: {
          condition: 'Incoming critical alarm sounding on Safety Desk',
          displayMessage: 'CRITICAL SOS: Vehicle AP 31 TX 4920 (e-Auto). Live telemetry streaming.',
          recoveryAction: 'Safety officer claims incident and connects two-way audio',
        },
        failurePath: {
          trigger: 'Vehicle GPS lost or telemetry disconnected during emergency',
          errorState: 'TELEMETRY_LOST',
          fallbackScreenId: 'SCR_SAFETY_OFFLINE_PROBE_POLICE',
        },
      },
      {
        stepId: 'EM-03',
        stateName: 'INCIDENT_INTERVENTION',
        screenId: 'SCR_SAFETY_DISPATCH_ESCALATION',
        responsibleActor: UserRole.SAFETY,
        description: 'Safety team coordinates with AP Police 112 / 100 and dispatches nearest patrol.',
        successPath: {
          action: 'AP Police dispatch intercepts vehicle, passenger safety verified',
          nextState: 'INCIDENT_RESOLVED',
          nextScreenId: 'SCR_SAFETY_INCIDENT_REPORT',
        },
        emptyState: {
          condition: 'Live bridge open between Safety Desk, AP Police 112, and passenger',
          displayMessage: 'AP Police 112 Dispatched. Patrol Car 14 ETA: 4 minutes.',
          recoveryAction: 'Keep live GPS bridge open and monitor vehicle speed/battery',
        },
        failurePath: {
          trigger: 'Unable to reach local police unit; secondary escalation to city control room',
          errorState: 'SECONDARY_ESCALATION',
          fallbackScreenId: 'SCR_SAFETY_OFFLINE_PROBE_POLICE',
        },
      },
      {
        stepId: 'EM-04',
        stateName: 'INCIDENT_RESOLVED',
        screenId: 'SCR_SAFETY_INCIDENT_REPORT',
        responsibleActor: UserRole.SAFETY,
        description: 'Incident resolved safely; tamper-evident audit report filed.',
        successPath: {
          action: 'Safety officer marks incident resolved and trip is closed safely',
          nextState: 'INCIDENT_RESOLVED',
          nextScreenId: 'SCR_RIDER_SEARCH',
        },
        emptyState: {
          condition: 'Post-incident summary form',
          displayMessage: 'Incident successfully resolved with AP Police 112 assistance.',
          recoveryAction: 'File formal incident report and notify emergency contacts',
        },
        failurePath: {
          trigger: 'Pending legal investigation requires vehicle quarantine',
          errorState: 'VEHICLE_QUARANTINED',
          fallbackScreenId: 'SCR_SAFETY_INCIDENT_REPORT',
        },
      },
    ],
  },
];


/**
 * Authoritative Screen Registry mapping all user interface states.
 * Proves graph connectivity: every screen has an active incoming path and an active recovery/outgoing route.
 */
export const SCREEN_REGISTRY: ScreenNode[] = [
  // Primary Private Ride Screens
  { screenId: 'SCR_RIDER_SEARCH', displayName: 'Rider Destination Search & Map', role: UserRole.RIDER },
  { screenId: 'SCR_RIDER_VEHICLE_SELECT', displayName: 'EV Category & Fare Selection', role: UserRole.RIDER },
  { screenId: 'SCR_RIDER_MATCHING', displayName: 'Captain Matching Radar', role: UserRole.RIDER },
  { screenId: 'SCR_RIDER_LIVE_TRACK', displayName: 'Live EV Captain Navigation Tracking', role: UserRole.RIDER },
  { screenId: 'SCR_RIDER_OTP_DISPLAY', displayName: 'Rider 4-Digit Start OTP Display', role: UserRole.RIDER },
  { screenId: 'SCR_RIDER_TRIP_PROGRESS', displayName: 'Trip Live In-Transit Telemetry', role: UserRole.RIDER },
  { screenId: 'SCR_RIDER_RATING_RECEIPT', displayName: 'Trip Carbon Savings & Rating Receipt', role: UserRole.RIDER },

  // Fallback / Recovery Screens for Private Ride
  { screenId: 'SCR_RIDER_ZONE_RESTRICTED', displayName: 'Out-of-Zone Pilot Boundary Modal', role: UserRole.RIDER, recoveryScreenId: 'SCR_RIDER_SEARCH' },
  { screenId: 'SCR_RIDER_PAYMENT_ERROR', displayName: 'Payment Method Error & Retry Screen', role: UserRole.RIDER, recoveryScreenId: 'SCR_RIDER_VEHICLE_SELECT' },
  { screenId: 'SCR_RIDER_NO_CAPTAINS_TIMEOUT', displayName: 'No Captain Available Timeout Modal', role: UserRole.RIDER, recoveryScreenId: 'SCR_RIDER_SEARCH' },
  { screenId: 'SCR_RIDE_CANCELLED', displayName: 'Ride Cancellation Summary', role: UserRole.RIDER, recoveryScreenId: 'SCR_RIDER_SEARCH' },
  { screenId: 'SCR_CAPTAIN_OTP_ERROR', displayName: 'Invalid OTP Retry Screen', role: UserRole.CAPTAIN, recoveryScreenId: 'SCR_RIDER_OTP_DISPLAY' },
  { screenId: 'SCR_RIDER_SOS_BUTTON', displayName: 'One-Touch Emergency SOS Countdown', role: UserRole.RIDER, recoveryScreenId: 'SCR_RIDER_TRIP_PROGRESS' },

  // Shared Seat Commute Screens
  { screenId: 'SCR_COMMUTE_CORRIDORS', displayName: 'Corridor Route & Slot Browser', role: UserRole.RIDER },
  { screenId: 'SCR_COMMUTE_SEAT_MAP', displayName: 'Interactive Vehicle Seat Map', role: UserRole.RIDER },
  { screenId: 'SCR_COMMUTE_TICKET_BOARDING_PASS', displayName: 'Digital QR Boarding Pass', role: UserRole.RIDER },
  { screenId: 'SCR_COMMUTE_QR_SCANNER', displayName: 'Captain Passenger QR Scanner', role: UserRole.CAPTAIN },
  { screenId: 'SCR_COMMUTE_ROUTE_PROGRESS', displayName: 'Corridor Multi-Stop Progress Map', role: UserRole.CAPTAIN },
  { screenId: 'SCR_COMMUTE_RECEIPT', displayName: 'Shared Commute Receipt & Savings', role: UserRole.RIDER },
  { screenId: 'SCR_COMMUTE_CORRIDOR_CLOSED', displayName: 'Corridor Inactive Alert', role: UserRole.RIDER, recoveryScreenId: 'SCR_COMMUTE_CORRIDORS' },
  { screenId: 'SCR_COMMUTE_SEAT_CONFLICT', displayName: 'Seat Conflict (Already Reserved) Alert', role: UserRole.RIDER, recoveryScreenId: 'SCR_COMMUTE_SEAT_MAP' },

  // Pass Redemption Screens
  { screenId: 'SCR_PASS_CATALOG', displayName: 'Commuter Pass Catalog & Pricing', role: UserRole.RIDER },
  { screenId: 'SCR_PASS_WALLET_DASHBOARD', displayName: 'Pass Wallet & Token Balance', role: UserRole.RIDER },
  { screenId: 'SCR_RIDER_CHECKOUT_WITH_PASS', displayName: 'Checkout with Token Deduction', role: UserRole.RIDER },
  { screenId: 'SCR_PASS_CONFIRMATION', displayName: 'Pass Redemption Confirmation', role: UserRole.RIDER },
  { screenId: 'SCR_PASS_QUOTA_EXHAUSTED', displayName: 'Pass Quota Exhausted Notice', role: UserRole.RIDER, recoveryScreenId: 'SCR_PASS_CATALOG' },
  { screenId: 'SCR_PASS_LIMIT_REACHED', displayName: 'Daily Ride Limit Reached Modal', role: UserRole.RIDER, recoveryScreenId: 'SCR_PASS_WALLET_DASHBOARD' },
  { screenId: 'SCR_PASS_DISTANCE_TOPUP', displayName: 'Distance Cap Top-Up Screen', role: UserRole.RIDER, recoveryScreenId: 'SCR_RIDER_CHECKOUT_WITH_PASS' },

  // Refund & SLA Delay Screens
  { screenId: 'SCR_RIDER_TRIP_DELAY_ALERT', displayName: 'Trip Delay Notification & SLA Claim', role: UserRole.RIDER },
  { screenId: 'SCR_FINANCE_REFUND_DESK', displayName: 'Automated Refund Evaluation Console', role: UserRole.FINANCE },
  { screenId: 'SCR_FINANCE_LEDGER_PROCESSING', displayName: 'Idempotent Ledger Disbursement Processor', role: UserRole.FINANCE },
  { screenId: 'SCR_RIDER_REFUND_SUCCESS', displayName: 'Refund & Delay Credit Deposited Screen', role: UserRole.RIDER },
  { screenId: 'SCR_REFUND_INELIGIBLE', displayName: 'Refund Ineligibility Notice', role: UserRole.RIDER, recoveryScreenId: 'SCR_RIDER_SEARCH' },
  { screenId: 'SCR_REFUND_FRAUD_REJECTED', displayName: 'Duplicate Claim Rejection Modal', role: UserRole.FINANCE, recoveryScreenId: 'SCR_FINANCE_REFUND_DESK' },
  { screenId: 'SCR_REFUND_BANK_RETRY', displayName: 'Banking Gateway Retry Console', role: UserRole.FINANCE, recoveryScreenId: 'SCR_FINANCE_LEDGER_PROCESSING' },

  // Emergency SOS Screens
  { screenId: 'SCR_SAFETY_CONSOLE_INCIDENT', displayName: '24/7 Safety Desk Live Incident Console', role: UserRole.SAFETY },
  { screenId: 'SCR_SAFETY_DISPATCH_ESCALATION', displayName: 'AP Police 112 Dispatch Escalation Bridge', role: UserRole.SAFETY },
  { screenId: 'SCR_SAFETY_INCIDENT_REPORT', displayName: 'Comprehensive Incident Resolution Report', role: UserRole.SAFETY },
  { screenId: 'SCR_SAFETY_OFFLINE_PROBE_POLICE', displayName: 'Offline Telemetry Emergency Protocol', role: UserRole.SAFETY, recoveryScreenId: 'SCR_SAFETY_DISPATCH_ESCALATION' },
];
