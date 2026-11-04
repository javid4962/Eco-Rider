// EcoRide Rider Map Home Screen Integration Tests (EV-033)
// Validates end-to-end user interactions on map home: search, saved places,
// manual pin selection, explicit confirmation, and language switching.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/localization/app_localizations.dart';
import 'package:rider_app/core/localization/locale_controller.dart';
import 'package:rider_app/features/location_selection/controllers/location_selection_controller.dart';
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
  group('Rider Map Home Screen End-to-End Tests', () {
    testWidgets('Full manual booking flow: search pickup, pick destination from saved places, confirm and book', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      final localeController = LocaleController(
        storageKey: 'test_map_home_rider',
        initialLocale: const Locale('en'),
      );

      await tester.pumpWidget(createTestApp(
        controller: controller,
        localeController: localeController,
      ));
      await tester.pumpAndSettle();

      // 1. Initial State: App title, Pilot corridor, Search card
      expect(find.text('EcoRide Rider'), findsOneWidget);
      expect(find.text('100% ELECTRIC'), findsWidgets);
      expect(find.text('Visakhapatnam Pilot'), findsOneWidget);
      expect(find.text('Where to in AP?'), findsOneWidget);

      // 2. Select Pickup via Search
      await tester.tap(find.text('Tap to select pickup point'));
      await tester.pumpAndSettle();

      // In search screen: tap RK Beach Road
      expect(find.text('Search pickup location'), findsOneWidget);
      await tester.tap(find.text('RK Beach Road'));
      await tester.pumpAndSettle();

      // Returned to map home: pickup is now RK Beach Road
      expect(find.text('RK Beach Road'), findsWidgets);

      // 3. Select Destination via Saved Places Chip (Work)
      await tester.tap(find.text('Work'));
      await tester.pumpAndSettle();

      // Both locations are selected: Confirmation Card is visible
      expect(find.text('Confirm Ride Locations'), findsOneWidget);
      expect(find.text('Confirm Locations & Get Fare'), findsOneWidget);

      // 4. Confirm Locations & Get Fare
      await tester.tap(find.text('Confirm Locations & Get Fare'));
      await tester.pumpAndSettle();

      // Quote is ready
      expect(find.text('Total Fare'), findsOneWidget);
      expect(find.text('Book Electric Ride'), findsOneWidget);

      // 5. Test Language Switcher to Telugu
      localeController.setLocale(const Locale('te'));
      await tester.pumpAndSettle();

      expect(find.text('ఈకోరైడ్ రైడర్'), findsOneWidget);
      expect(find.text('రైడ్ స్థానాలను నిర్ధారించండి'), findsOneWidget);
      expect(find.text('ఈవీ రైడ్ బుక్ చేయండి'), findsOneWidget);

      // 6. Complete Booking
      await tester.tap(find.text('ఈవీ రైడ్ బుక్ చేయండి'));
      await tester.pumpAndSettle();

      expect(find.text('EV Ride Booked!'), findsOneWidget);
    });
  });
}
