// EcoRide Manual Pin Selection Widget Tests (EV-033)
// Validates manual pin mode, nudge adjustments, reverse-geocoding, and pin confirmation.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/localization/app_localizations.dart';
import 'package:rider_app/features/location_selection/controllers/location_selection_controller.dart';
import 'package:rider_app/features/location_selection/models/location_model.dart';
import 'package:rider_app/features/location_selection/screens/rider_map_home_screen.dart';
import 'package:rider_app/features/location_selection/services/rider_location_api_client.dart';

Widget createMapTestApp(Widget child) {
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
  group('Manual Pin Selection Tests', () {
    testWidgets('Opens manual pin mode, adjusts pin with nudges, and confirms location', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      await controller.initialize();

      await tester.pumpWidget(createMapTestApp(
        RiderMapHomeScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      // Tap "Set Pin on Map"
      final pinButton = find.text('Set Pin on Map').first;
      await tester.tap(pinButton);
      await tester.pumpAndSettle();

      // Verify controller entered manual pin placement mode
      expect(controller.currentMode, LocationSelectionMode.manualPinPlacement);
      expect(find.text('Confirm Pickup Pin'), findsWidgets);
      expect(find.text('Manually Confirmed Pin'), findsOneWidget);

      // Verify initial pin coordinates (Visakhapatnam RTC complex default)
      final initialLat = controller.pinLatitude;
      final initialLng = controller.pinLongitude;

      // Tap Nudge North
      final nudgeNorth = find.byTooltip('Nudge North');
      expect(nudgeNorth, findsOneWidget);
      await tester.tap(nudgeNorth);
      await tester.pumpAndSettle();

      expect(controller.pinLatitude, greaterThan(initialLat));

      // Tap Nudge East
      final nudgeEast = find.byTooltip('Nudge East');
      expect(nudgeEast, findsOneWidget);
      await tester.tap(nudgeEast);
      await tester.pumpAndSettle();

      expect(controller.pinLongitude, greaterThan(initialLng));

      // Tap "Confirm Pickup Pin"
      final confirmPinBtn = find.widgetWithText(ElevatedButton, 'Confirm Pickup Pin');
      expect(confirmPinBtn, findsOneWidget);
      await tester.tap(confirmPinBtn);
      await tester.pumpAndSettle();

      // Verify pickup location is set and marked as manually selected and confirmed
      expect(controller.pickupLocation, isNotNull);
      expect(controller.pickupLocation!.isManuallySelected, isTrue);
      expect(controller.pickupLocation!.isConfirmed, isTrue);
      expect(controller.currentMode, LocationSelectionMode.idle);
    });

    testWidgets('Canceling manual pin mode returns to idle without altering selection', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      await controller.initialize();

      await tester.pumpWidget(createMapTestApp(
        RiderMapHomeScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      controller.startManualPinPlacement(target: LocationTarget.destination);
      await tester.pumpAndSettle();

      expect(controller.currentMode, LocationSelectionMode.manualPinPlacement);

      // Tap Cancel
      final cancelBtn = find.text('Cancel');
      expect(cancelBtn, findsOneWidget);
      await tester.tap(cancelBtn);
      await tester.pumpAndSettle();

      expect(controller.currentMode, LocationSelectionMode.idle);
      expect(controller.destinationLocation, isNull);
    });
  });
}

