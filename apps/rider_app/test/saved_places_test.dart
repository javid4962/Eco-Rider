// EcoRide Saved Places Widget Tests (EV-033)
// Validates saved places chips (Home, Work, Favorites) and rapid location selection.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/localization/app_localizations.dart';
import 'package:rider_app/features/location_selection/controllers/location_selection_controller.dart';
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
  group('Saved Places Tests', () {
    testWidgets('Renders saved Home and Work chips and assigns destination on tap', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      await controller.initialize();

      await tester.pumpWidget(createTestApp(
        RiderMapHomeScreen(controller: controller),
      ));
      await tester.pumpAndSettle();

      // Verify saved places header and chips exist
      expect(find.text('Saved Places'), findsOneWidget);
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Work'), findsOneWidget);

      // Tap "Work" chip to set as destination
      await tester.tap(find.text('Work'));
      await tester.pumpAndSettle();

      // Verify destination location is set to Work
      expect(controller.destinationLocation, isNotNull);
      expect(controller.destinationLocation!.primaryName, 'Work');
      expect(controller.destinationLocation!.latitude, 17.7819);
      expect(controller.destinationLocation!.longitude, 83.3776);
      expect(controller.destinationLocation!.isManuallySelected, isTrue);
    });
  });
}
