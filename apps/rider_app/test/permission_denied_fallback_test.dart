// EcoRide Permission Denied Fallback Widget Tests (EV-033)
// Validates that denied location access presents non-blocking fallback
// and unlocks manual pin placement & search without trapping the user.

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
  group('GPS Permission Denied Fallback Tests', () {
    testWidgets('Displays fallback banner when location permission is denied and provides manual actions', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(
        apiClient: mockClient,
        initialPermissionDenied: true,
      );
      await controller.initialize();

      await tester.pumpWidget(createTestApp(
        RiderMapHomeScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      // Verify Permission Denied Banner is displayed
      expect(find.text('Location Access Denied'), findsOneWidget);
      expect(
        find.textContaining('EcoRide requires your pickup location to dispatch an EV captain'),
        findsOneWidget,
      );

      // Verify fallback action buttons are rendered
      expect(find.text('Set Pin on Map'), findsWidgets);
      expect(find.text('Search Manually'), findsOneWidget);

      // Verify default fallback pickup was set to RTC Complex
      expect(controller.pickupLocation, isNotNull);
      expect(controller.pickupLocation!.primaryName, contains('RTC Complex'));

      // Tapping "Set Pin on Map" from banner activates manual pin mode
      await tester.tap(find.widgetWithText(OutlinedButton, 'Set Pin on Map'));
      await tester.pumpAndSettle();

      expect(controller.currentMode, LocationSelectionMode.manualPinPlacement);
      expect(find.text('Confirm Pickup Pin'), findsWidgets);
    });

    testWidgets('Dismissing banner clears permission denied banner', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(
        apiClient: mockClient,
        initialPermissionDenied: true,
      );
      await controller.initialize();

      await tester.pumpWidget(createTestApp(
        RiderMapHomeScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Location Access Denied'), findsOneWidget);

      // Find close button on banner and tap
      final closeButton = find.byIcon(Icons.close);
      expect(closeButton, findsOneWidget);
      await tester.tap(closeButton);
      await tester.pumpAndSettle();

      // Verify banner is dismissed
      expect(find.text('Location Access Denied'), findsNothing);
      expect(controller.isGpsPermissionDenied, isFalse);
    });
  });
}

