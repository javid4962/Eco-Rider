// EcoRide Location Search Widget Tests (EV-033)
// Validates search autocompletion, query filtering, and selection of pickup/destination.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/localization/app_localizations.dart';
import 'package:rider_app/features/location_selection/controllers/location_selection_controller.dart';
import 'package:rider_app/features/location_selection/models/location_model.dart';
import 'package:rider_app/features/location_selection/screens/location_search_screen.dart';
import 'package:rider_app/features/location_selection/services/rider_location_api_client.dart';

Widget createSearchTestApp(Widget child) {
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
  group('Location Search Screen Tests', () {
    testWidgets('Renders search input and displays initial recent places in Visakhapatnam', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      await controller.initialize();

      await tester.pumpWidget(createSearchTestApp(
        LocationSearchScreen(
          controller: controller,
          target: LocationTarget.destination,
        ),
      ));
      await tester.pumpAndSettle();

      // Verify title and input presence
      expect(find.text('Search destination'), findsOneWidget);
      expect(find.text('Recent Places in Visakhapatnam'), findsOneWidget);
      expect(find.text('Set Pin on Map'), findsOneWidget);

      // Verify initial AP suggestions
      expect(find.text('RK Beach Road'), findsOneWidget);
      expect(find.text('MVP Colony Sector 1'), findsOneWidget);
    });

    testWidgets('Filters suggestions when typing query and selects destination', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      await controller.initialize();

      await tester.pumpWidget(createSearchTestApp(
        LocationSearchScreen(
          controller: controller,
          target: LocationTarget.destination,
        ),
      ));
      await tester.pumpAndSettle();

      // Enter search query "Rushikonda"
      final textField = find.byType(TextField);
      await tester.enterText(textField, 'Rushikonda');
      await tester.pumpAndSettle();

      // Verify filtered suggestions
      expect(find.text('Rushikonda IT SEZ'), findsOneWidget);
      expect(find.text('RK Beach Road'), findsNothing);

      // Tap suggestion to select
      await tester.tap(find.text('Rushikonda IT SEZ'));
      await tester.pumpAndSettle();

      // Verify destination is set in controller
      expect(controller.destinationLocation, isNotNull);
      expect(controller.destinationLocation!.primaryName, 'Rushikonda IT SEZ');
      expect(controller.destinationLocation!.isManuallySelected, isTrue);
    });

    testWidgets('Clearing search restores default suggestions', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockRiderLocationApiClient();
      final controller = LocationSelectionController(apiClient: mockClient);
      await controller.initialize();

      await tester.pumpWidget(createSearchTestApp(
        LocationSearchScreen(
          controller: controller,
          target: LocationTarget.pickup,
        ),
      ));
      await tester.pumpAndSettle();

      final textField = find.byType(TextField);
      await tester.enterText(textField, 'Gajuwaka');
      await tester.pumpAndSettle();

      expect(find.text('Gajuwaka Junction'), findsOneWidget);

      // Tap clear button
      final clearButton = find.byIcon(Icons.clear);
      expect(clearButton, findsOneWidget);
      await tester.tap(clearButton);
      await tester.pumpAndSettle();

      // Verify default list restored
      expect(find.text('RK Beach Road'), findsOneWidget);
    });
  });
}

