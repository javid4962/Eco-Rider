// EcoRide Service Availability & Pricing Widget & Flow Tests (EV-037)
// Verifies dynamic category cards driven by API, disabled vehicle class blocking,
// zero-driver states, statutory operator notices, and regulatory cancellation terms.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/api/api_contracts.dart';
import 'package:rider_app/core/localization/app_localizations.dart';
import 'package:rider_app/core/localization/locale_controller.dart';
import 'package:rider_app/features/location_selection/controllers/location_selection_controller.dart';
import 'package:rider_app/features/location_selection/models/location_model.dart';
import 'package:rider_app/features/location_selection/screens/rider_map_home_screen.dart';
import 'package:rider_app/features/location_selection/services/rider_location_api_client.dart';

Widget createTestApp({
  required LocationSelectionController controller,
  required LocaleController localeController,
}) {
  return ListenableBuilder(
    listenable: localeController,
    builder: (context, _) {
      return MaterialApp(
        locale: localeController.locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          FallbackMaterialLocalizationsDelegate(),
          FallbackWidgetsLocalizationsDelegate(),
          FallbackCupertinoLocalizationsDelegate(),
        ],
        home: RiderMapHomeScreen(
          localeController: localeController,
          controller: controller,
        ),
      );
    },
  );
}

void main() {
  group('EV-037: Service Availability & Pricing UI Tests', () {
    testWidgets('Renders dynamic EV categories from API with fares, ETA, seats and captain counts', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      final localeController = LocaleController(
        storageKey: 'test_ev037_1',
        initialLocale: const Locale('en'),
      );

      await tester.pumpWidget(createTestApp(
        controller: controller,
        localeController: localeController,
      ));
      await tester.pumpAndSettle();

      // 1. Verify Header and 100% Electric branding
      expect(find.text('EV Service Availability & Pricing'), findsOneWidget);
      expect(find.text('100% ELECTRIC'), findsOneWidget);

      // 2. Verify Dynamic Categories (Driven by API, Not Hardcoded)
      // Enabled: EcoBike (City Commute, D+1) and EcoVan Shuttle (D+10)
      expect(find.text('EcoBike (City Commute)'), findsOneWidget);
      expect(find.text('D+1'), findsOneWidget);
      expect(find.text('₹78.00'), findsOneWidget);
      expect(find.text('~4 min ETA'), findsOneWidget);
      expect(find.text('3 captains nearby'), findsOneWidget);

      expect(find.text('EcoVan Shuttle'), findsOneWidget);
      expect(find.text('D+10'), findsOneWidget);
      expect(find.text('₹42.00'), findsOneWidget);
      expect(find.text('~8 min ETA'), findsOneWidget);
      expect(find.text('2 captains nearby'), findsOneWidget);

      // Disabled: EcoAuto (D+3) and EcoCab (D+4)
      expect(find.text('EcoAuto'), findsOneWidget);
      expect(find.text('D+3'), findsOneWidget);
      expect(find.text('EcoCab (Private 4W)'), findsOneWidget);
      expect(find.text('D+4'), findsOneWidget);
      expect(find.text('Not Authorized in Zone'), findsNWidgets(2));

      // 3. Verify Statutory Operator Notice (AP-STA GO-42 permit citation)
      expect(find.text('Statutory Operator Notice (AP-STA)'), findsOneWidget);
      expect(
        find.textContaining('STA-AP-2026-EV-PILOT-001'),
        findsOneWidget,
      );

      // 4. Verify Regulatory Cancellation Policy row
      expect(find.textContaining('Cancellation Policy: Free cancellation within 3 mins'), findsOneWidget);
    });

    testWidgets('Disabled vehicle class is unbookable and displays regulatory rejection reason', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      final localeController = LocaleController(
        storageKey: 'test_ev037_2',
        initialLocale: const Locale('en'),
      );

      await tester.pumpWidget(createTestApp(
        controller: controller,
        localeController: localeController,
      ));
      await tester.pumpAndSettle();

      // 1. On Map Home: Tap disabled EcoAuto category
      expect(find.text('EcoAuto'), findsOneWidget);
      await tester.tap(find.text('EcoAuto'));
      await tester.pumpAndSettle();

      // Controller should reflect EcoAuto as selected
      expect(controller.selectedCategory?.serviceCategory, 'AUTO_COMMUTE_3W');
      expect(controller.selectedCategory?.isBookable, isFalse);

      // 2. Select Pickup via Search
      await tester.tap(find.text('Tap to select pickup point'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('RK Beach Road'));
      await tester.pumpAndSettle();

      // 3. Select Destination via Saved Places Chip (Work)
      await tester.tap(find.text('Work'));
      await tester.pumpAndSettle();

      // Both locations are selected: Confirmation Card is visible with selected EcoAuto
      expect(find.text('Confirm Ride Locations'), findsOneWidget);
      expect(find.text('Confirm Locations & Get Fare'), findsOneWidget);
      expect(find.textContaining('EcoAuto (D+3)'), findsOneWidget);

      // 4. Tap "Confirm Locations & Get Fare"
      await tester.tap(find.text('Confirm Locations & Get Fare'));
      await tester.pumpAndSettle();

      // 5. Booking must be BLOCKED! Controller transitioned to unsupportedLocation
      expect(controller.currentMode, LocationSelectionMode.unsupportedLocation);
      expect(controller.activeQuote, isNull);

      // Rejection reason is displayed with statutory citation
      expect(
        find.textContaining('AP-STA-EV-AUTO-2026'),
        findsWidgets,
      );

      // Book Electric Ride button MUST NOT be present
      expect(find.text('Book Electric Ride'), findsNothing);
    });

    testWidgets('Zero-driver state displays "No Captains Online" and blocks booking', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient(simulateZeroDrivers: true);
      final controller = LocationSelectionController(apiClient: mockClient);
      final localeController = LocaleController(
        storageKey: 'test_ev037_3',
        initialLocale: const Locale('en'),
      );

      await tester.pumpWidget(createTestApp(
        controller: controller,
        localeController: localeController,
      ));
      await tester.pumpAndSettle();

      // Verify "No Captains Online" chips are shown for enabled categories
      expect(find.text('No Captains Online'), findsNWidgets(2));
      expect(find.text('No EV captains currently online in this zone.'), findsWidgets);

      // EcoBike is selected by default but unbookable due to 0 captains
      expect(controller.selectedCategory?.isBookable, isFalse);

      // Select Pickup via Search
      await tester.tap(find.text('Tap to select pickup point'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('RK Beach Road'));
      await tester.pumpAndSettle();

      // Select Destination via Saved Places Chip (Work)
      await tester.tap(find.text('Work'));
      await tester.pumpAndSettle();

      // Tap "Confirm Locations & Get Fare"
      await tester.tap(find.text('Confirm Locations & Get Fare'));
      await tester.pumpAndSettle();

      // Must be blocked because 0 captains are online
      expect(controller.currentMode, LocationSelectionMode.unsupportedLocation);
      expect(find.textContaining('No EV captains currently online'), findsWidgets);
      expect(find.text('Book Electric Ride'), findsNothing);
    });

    testWidgets('Cancellation policy modal displays regulatory terms and driver compensation details', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      final localeController = LocaleController(
        storageKey: 'test_ev037_4',
        initialLocale: const Locale('en'),
      );

      await tester.pumpWidget(createTestApp(
        controller: controller,
        localeController: localeController,
      ));
      await tester.pumpAndSettle();

      // Tap Cancellation Policy row
      await tester.tap(find.textContaining('Cancellation Policy: Free cancellation within 3 mins'));
      await tester.pumpAndSettle();

      // Verify Dialog contents
      expect(find.text('Cancellation Policy'), findsWidgets);
      expect(find.text('Free cancellation within 3 mins'), findsOneWidget);
      expect(find.text('Driver fee ₹15.00 after window'), findsOneWidget);
      expect(find.textContaining('directly protects EV captains'), findsOneWidget);

      // Dismiss dialog
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();
      expect(find.text('Driver fee ₹15.00 after window'), findsNothing);
    });

    testWidgets('Bilingual localization in Telugu displays accurate vernacular terminology', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      final localeController = LocaleController(
        storageKey: 'test_ev037_5',
        initialLocale: const Locale('te'),
      );

      await tester.pumpWidget(createTestApp(
        controller: controller,
        localeController: localeController,
      ));
      await tester.pumpAndSettle();

      // Verify Telugu translations
      expect(find.text('ఈవీ సేవ లభ్యత మరియు ధరలు'), findsOneWidget);
      expect(find.text('100% ఎలక్ట్రిక్'), findsOneWidget);
      expect(find.text('ఈ జోన్‌లో అనుమతించబడలేదు'), findsNWidgets(2));
      expect(find.text('చట్టబద్ధమైన ఆపరేటర్ నోటీసు (AP-STA)'), findsOneWidget);
      expect(find.textContaining('రద్దు విధానం: 3 నిమిషాల్లోపు ఉచిత రద్దు'), findsOneWidget);
    });
  });
}
