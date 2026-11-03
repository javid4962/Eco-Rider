// EcoRide Pickup & Dropoff Confirmation Tests (EV-033)
// Enforces explicit rider confirmation before quoting or booking.
// Demonstrates successful EV booking flow with manually selected locations in Visakhapatnam.

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
  group('Pickup & Dropoff Confirmation & Booking Tests', () {
    testWidgets('Requires explicit confirmation, verifies zone, calculates quote and completes booking', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(
        apiClient: mockClient,
        // Manually selected points in Visakhapatnam pilot corridor
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
          latitude: 17.7819,
          longitude: 83.3776,
          primaryName: 'Rushikonda IT SEZ',
          fullAddress: 'Hill No 2, IT Park, Rushikonda, Visakhapatnam, Andhra Pradesh',
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

      // 1. Verify Confirmation Card is visible with both locations
      expect(find.text('Confirm Ride Locations'), findsOneWidget);
      expect(find.text('RK Beach Road'), findsWidgets);
      expect(find.text('Rushikonda IT SEZ'), findsWidgets);
      expect(find.text('Confirm Locations & Get Fare'), findsOneWidget);

      // Verify that booking button is NOT visible yet (must confirm first)
      expect(find.text('Book Electric Ride'), findsNothing);

      // 2. Tap "Confirm Locations & Get Fare"
      await tester.tap(find.text('Confirm Locations & Get Fare'));
      await tester.pumpAndSettle();

      // 3. Verify Authoritative Quote is displayed
      expect(controller.currentMode, LocationSelectionMode.quoteReady);
      expect(controller.activeQuote, isNotNull);
      expect(controller.activeQuote!.fare.formattedInr, startsWith('₹'));
      expect(controller.pickupLocation!.isConfirmed, isTrue);
      expect(controller.destinationLocation!.isConfirmed, isTrue);

      // Verify fare and EV metrics
      expect(find.text('Total Fare'), findsOneWidget);
      expect(find.text(controller.activeQuote!.fare.formattedInr), findsOneWidget);
      expect(find.text('Book Electric Ride'), findsOneWidget);

      // 4. Tap "Book Electric Ride"
      await tester.tap(find.text('Book Electric Ride'));
      await tester.pumpAndSettle();

      // Verify Booking Success dialog
      expect(find.text('EV Ride Booked!'), findsOneWidget);
      expect(find.textContaining('Finding nearby electric captain in Visakhapatnam'), findsOneWidget);

      // Dismiss dialog
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();

      // Controller resets to idle after booking
      expect(controller.currentMode, LocationSelectionMode.idle);
      expect(controller.pickupLocation, isNull);
    });
  });
}
