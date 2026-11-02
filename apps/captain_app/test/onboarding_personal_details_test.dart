// EcoRide Captain Personal Details Widget Tests (EV-026)
// Validates personal KYC fields, mandatory validation, and draft persistence.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/app_localizations.dart';
import 'package:captain_app/features/onboarding/controllers/captain_onboarding_controller.dart';
import 'package:captain_app/features/onboarding/models/captain_onboarding_model.dart';
import 'package:captain_app/features/onboarding/screens/captain_personal_details_screen.dart';
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
  group('Captain Personal Details Screen Tests', () {
    testWidgets('Enforces mandatory required fields on personal details step', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.personalDetails,
        initialDraft: CaptainDraftData(),
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainPersonalDetailsScreen(controller: controller)));
      await tester.pump();

      // Verify headers
      expect(find.text('Personal Details'), findsOneWidget);
      expect(find.text('Save & Continue'), findsOneWidget);

      // Tap Save & Continue without filling mandatory fields
      await tester.tap(find.text('Save & Continue'));
      await tester.pump();

      // Verify validation error messages
      expect(find.text('Full legal name is required'), findsOneWidget);
      expect(find.text('Commercial driving license number is required'), findsOneWidget);
      expect(find.text('Emergency contact name is required'), findsOneWidget);
      expect(find.text('Emergency contact phone number is required'), findsOneWidget);
      expect(controller.currentStep, equals(OnboardingStep.personalDetails));
    });

    testWidgets('Persists valid driver KYC details and proceeds to vehicle details step', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.personalDetails,
        initialDraft: CaptainDraftData(),
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainPersonalDetailsScreen(controller: controller)));
      await tester.pump();

      // Enter valid driver data
      final textFields = find.byType(TextField);
      // Field 0: Full Name
      await tester.enterText(textFields.at(0), 'Suresh Kumar');
      // Field 1: DOB
      await tester.enterText(textFields.at(1), '1992-05-15');
      // Field 2: DL Number
      await tester.enterText(textFields.at(2), 'AP31 20180004561');
      // Field 3: DL Expiry
      await tester.enterText(textFields.at(3), '2030-05-14');
      // Field 4: Badge Number
      await tester.enterText(textFields.at(4), 'BDG-AP31-991');
      // Field 5: Emergency Contact Name
      await tester.enterText(textFields.at(5), 'Lakshmi Kumar');
      // Field 6: Emergency Contact Phone
      await tester.enterText(textFields.at(6), '+919876543210');

      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();

      // Tap Save & Continue
      await tester.tap(find.text('Save & Continue'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Verify draft values saved in controller
      expect(controller.draft.fullName, equals('Suresh Kumar'));
      expect(controller.draft.drivingLicenseNumber, equals('AP31 20180004561'));
      expect(controller.draft.emergencyContactName, equals('Lakshmi Kumar'));
      expect(controller.draft.emergencyContactPhone, equals('+919876543210'));

      // Successfully transitioned to vehicle details step
      expect(controller.currentStep, equals(OnboardingStep.vehicleDetails));
    });
  });
}
