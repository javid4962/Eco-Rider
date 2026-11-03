// EcoRide Unsupported Zone Notice Widget Tests (EV-033)
// Validates that unsupported locations outside authorized pilot boundaries
// explain clearly why service is unavailable and prevent quote/booking.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/localization/app_localizations.dart';
import 'package:rider_app/features/location_selection/controllers/location_selection_controller.dart';
import 'package:rider_app/features/location_selection/models/location_model.dart';
import 'package:rider_app/features/location_selection/screens/rider_map_home_screen.dart';
import 'package:rider_app/features/location_selection/services/rider_location_api_client.dart';

Widget createTestApp(Widget child) {
  return MaterialApp(
    locale: const Locale('en'),
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: const [
      AppLocalizations.delegate,
      FallbackMaterialLocalizationsDelegate(),
      FallbackWidgetsLocalizationsDelegate(),
      FallbackCupertinoLocalizationsDelegate(),
    ],
    home: child,
  );
}

void main() {
  group('Unsupported Location & Pilot Boundary Enforcement Tests', () {
    testWidgets('Explains why service is unavailable when location is outside pilot zone and blocks booking', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      // Pickup in Visakhapatnam, but destination in Vijayawada (outside Release A pilot corridor)
      final controller = LocationSelectionController(
        apiClient: mockClient,
        initialPickup: const RiderLocationPoint(
          latitude: 17.7126,
          longitude: 83.3174,
          primaryName: 'RK Beach Road',
          fullAddress: 'Ramakrishna Beach Road, Visakhapatnam, Andhra Pradesh',
          city: 'Visakhapatnam',
          isManuallySelected: true,
          isConfirmed: false,
        ),
        initialDestination: const RiderLocationPoint(
          latitude: 16.4975,
          longitude: 80.6558,
          primaryName: 'Benz Circle',
          fullAddress: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh',
          city: 'Vijayawada',
          isManuallySelected: true,
          isConfirmed: false,
        ),
      );
      await controller.initialize();

      await tester.pumpWidget(createTestApp(
        RiderMapHomeScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      // Tap "Confirm Locations & Get Fare"
      final confirmBtn = find.text('Confirm Locations & Get Fare');
      expect(confirmBtn, findsOneWidget);
      await tester.tap(confirmBtn);
      await tester.pumpAndSettle();

      // Verify controller transitioned to unsupportedLocation mode
      expect(controller.currentMode, LocationSelectionMode.unsupportedLocation);
      expect(controller.activeQuote, isNull);

      // Verify Unsupported Zone Sheet is rendered with clear explanations
      expect(find.text('Service Unavailable in This Area'), findsOneWidget);
      expect(
        find.textContaining('EcoRide operates exclusively with 100% BEVs in authorized Andhra Pradesh pilot corridors'),
        findsOneWidget,
      );
      expect(find.textContaining('Reason:'), findsOneWidget);
      expect(find.textContaining('Visakhapatnam EV Pilot Corridor'), findsOneWidget);

      // Booking button MUST NOT be present
      expect(find.text('Book Electric Ride'), findsNothing);

      // Tap "Select Another Location"
      final changeLocationBtn = find.text('Select Another Location');
      expect(changeLocationBtn, findsOneWidget);
      await tester.tap(changeLocationBtn);
      await tester.pumpAndSettle();

      // Verify modal dismissed and search screen opened
      expect(find.text('Search pickup location'), findsOneWidget);
    });

    testWidgets('Explains why service is unavailable when pickup itself is outside Andhra Pradesh', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(
        apiClient: mockClient,
        // Pickup in Hyderabad (outside AP pilot)
        initialPickup: const RiderLocationPoint(
          latitude: 17.4474,
          longitude: 78.3762,
          primaryName: 'Hitec City',
          fullAddress: 'Hitec City Metro, Hyderabad, Telangana',
          city: 'Hyderabad',
          isManuallySelected: true,
          isConfirmed: false,
        ),
        initialDestination: const RiderLocationPoint(
          latitude: 17.7126,
          longitude: 83.3174,
          primaryName: 'RK Beach Road',
          fullAddress: 'Ramakrishna Beach Road, Visakhapatnam, Andhra Pradesh',
          city: 'Visakhapatnam',
          isManuallySelected: true,
          isConfirmed: false,
        ),
      );
      await controller.initialize();

      await tester.pumpWidget(createTestApp(
        RiderMapHomeScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Confirm Locations & Get Fare'));
      await tester.pumpAndSettle();

      expect(controller.currentMode, LocationSelectionMode.unsupportedLocation);
      expect(find.text('Service Unavailable in This Area'), findsOneWidget);
      expect(controller.unsupportedReason, contains('outside approved'));
    });
  });
}
