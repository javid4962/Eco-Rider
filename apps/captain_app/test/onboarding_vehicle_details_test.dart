// EcoRide Captain Vehicle Details Widget Tests (EV-026)
// Validates 100% BEV enforcement, vehicle specifications, ownership, and step transition.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/app_localizations.dart';
import 'package:captain_app/features/onboarding/controllers/captain_onboarding_controller.dart';
import 'package:captain_app/features/onboarding/models/captain_onboarding_model.dart';
import 'package:captain_app/features/onboarding/screens/captain_vehicle_details_screen.dart';
import 'package:captain_app/features/onboarding/services/captain_onboarding_api_client.dart';

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
    home: Scaffold(body: child),
  );
}

void main() {
  group('Captain Vehicle Details Screen Tests', () {
    testWidgets('Displays 100% BEV-only mandatory banner and validates required fields for owned EV', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.vehicleDetails,
        initialDraft: CaptainDraftData(),
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainVehicleDetailsScreen(controller: controller)));
      await tester.pump();

      // Verify EV-Only branding
      expect(find.text('100% Battery Electric Vehicle (BEV) Only'), findsOneWidget);
      expect(find.text('Petroleum / CNG vehicles are strictly rejected server-side.'), findsOneWidget);

      // Attempt Save & Continue with empty vehicle fields
      await tester.tap(find.text('Save & Continue'));
      await tester.pump();

      // Verify validation errors
      expect(find.text('Green-plate vehicle registration number is required'), findsOneWidget);
      expect(find.text('Vehicle manufacturer / make is required'), findsOneWidget);
      expect(find.text('Vehicle model is required'), findsOneWidget);
      expect(controller.currentStep, equals(OnboardingStep.vehicleDetails));
    });

    testWidgets('Persists valid EV specs and transitions to documents checklist step', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.vehicleDetails,
        initialDraft: CaptainDraftData(),
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainVehicleDetailsScreen(controller: controller)));
      await tester.pump();

      // Switch category to 3W Auto
      await tester.tap(find.text('3W Auto'));
      await tester.pump();

      final textFields = find.byType(TextField);
      // Field 0: Make
      await tester.enterText(textFields.at(0), 'Piaggio');
      // Field 1: Model
      await tester.enterText(textFields.at(1), 'Ape E-City');
      // Field 2: Registration
      await tester.enterText(textFields.at(2), 'AP31EV5555');
      // Field 3: Battery Capacity (kWh)
      await tester.enterText(textFields.at(3), '7.5');
      // Field 4: Year
      await tester.enterText(textFields.at(4), '2024');

      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();

      // Tap Save & Continue
      await tester.tap(find.text('Save & Continue'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Verify draft state in controller
      expect(controller.draft.propulsionType, equals('BATTERY_ELECTRIC'));
      expect(controller.draft.vehicleCategory, equals('AUTO_RICKSHAW_3W'));
      expect(controller.draft.vehicleMake, equals('Piaggio'));
      expect(controller.draft.vehicleModel, equals('Ape E-City'));
      expect(controller.draft.vehicleRegistrationNumber, equals('AP31EV5555'));
      expect(controller.draft.batteryCapacityKwh, equals(7.5));

      // Successfully transitioned to documents step
      expect(controller.currentStep, equals(OnboardingStep.documents));
    });
  });
}
