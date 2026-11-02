// EcoRide Captain Onboarding End-to-End Flow Integration Widget Test (EV-026)
// Simulates complete journey: Phone Login -> Personal Details -> Vehicle Details ->
// Documents -> Preview & Submit -> Application Status -> Admin Verification Readiness.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/app_localizations.dart';
import 'package:captain_app/core/localization/locale_controller.dart';
import 'package:captain_app/features/onboarding/captain_onboarding_flow.dart';
import 'package:captain_app/features/onboarding/controllers/captain_onboarding_controller.dart';
import 'package:captain_app/features/onboarding/models/captain_onboarding_model.dart';
import 'package:captain_app/features/onboarding/services/captain_onboarding_api_client.dart';

Widget createTestFlowApp({
  required CaptainOnboardingController controller,
  required LocaleController localeController,
}) {
  return MaterialApp(
    locale: const Locale('en'),
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: const [
      AppLocalizations.delegate,
      FallbackMaterialLocalizationsDelegate(),
      FallbackWidgetsLocalizationsDelegate(),
      FallbackCupertinoLocalizationsDelegate(),
    ],
    home: CaptainOnboardingFlow(
      controller: controller,
      localeController: localeController,
    ),
  );
}

void main() {
  testWidgets('Simulated captain onboarding completes entire journey and reaches admin without re-entering data', (tester) async {
    tester.view.physicalSize = const Size(800, 1600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final mockClient = MockCaptainOnboardingApiClient();
    final controller = CaptainOnboardingController(
      apiClient: mockClient,
      initialStep: OnboardingStep.phoneLogin,
      initialDraft: CaptainDraftData(),
      enableCooldownTimer: false,
    );

    final localeController = LocaleController(storageKey: 'test_e2e_flow_captain');

    await tester.pumpWidget(createTestFlowApp(
      controller: controller,
      localeController: localeController,
    ));
    await tester.pump();

    // -------------------------------------------------------------------------
    // STEP 0: Phone Authentication
    // -------------------------------------------------------------------------
    expect(find.text('EV Captain Onboarding'), findsOneWidget);
    expect(find.text('Send Verification Code'), findsOneWidget);

    final phoneField = find.byType(TextField).first;
    await tester.enterText(phoneField, '+919876543210');
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();

    await tester.tap(find.text('Send Verification Code'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(controller.isOtpSent, isTrue);

    final otpField = find.byType(TextField).last;
    await tester.enterText(otpField, '123456');
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();

    await tester.tap(find.text('Verify & Proceed'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // -------------------------------------------------------------------------
    // STEP 1: Personal Details (1/4)
    // -------------------------------------------------------------------------
    expect(controller.currentStep, equals(OnboardingStep.personalDetails));
    expect(find.text('EV Captain Onboarding • 1/4'), findsOneWidget);
    expect(find.text('Personal Details'), findsOneWidget);

    final personalFields = find.byType(TextField);
    await tester.enterText(personalFields.at(0), 'Ravi Varma');
    await tester.enterText(personalFields.at(1), '1990-08-20');
    await tester.enterText(personalFields.at(2), 'AP31 20190008888');
    await tester.enterText(personalFields.at(3), '2031-08-19');
    await tester.enterText(personalFields.at(4), 'BDG-AP31-2024-555');
    await tester.enterText(personalFields.at(5), 'Sita Varma');
    await tester.enterText(personalFields.at(6), '+919876543211');

    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();

    await tester.tap(find.text('Save & Continue'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // -------------------------------------------------------------------------
    // STEP 2: Vehicle Details (2/4)
    // -------------------------------------------------------------------------
    expect(controller.currentStep, equals(OnboardingStep.vehicleDetails));
    expect(find.text('EV Captain Onboarding • 2/4'), findsOneWidget);
    expect(find.text('100% Battery Electric Vehicle (BEV) Only'), findsOneWidget);

    final vehicleFields = find.byType(TextField);
    await tester.enterText(vehicleFields.at(0), 'Tata Motors');
    await tester.enterText(vehicleFields.at(1), 'Tigor EV');
    await tester.enterText(vehicleFields.at(2), 'AP31EV9999');
    await tester.enterText(vehicleFields.at(3), '26.0');
    await tester.enterText(vehicleFields.at(4), '2024');

    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();

    await tester.tap(find.text('Save & Continue'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // -------------------------------------------------------------------------
    // STEP 3: Documents Upload (3/4)
    // -------------------------------------------------------------------------
    expect(controller.currentStep, equals(OnboardingStep.documents));
    expect(find.text('EV Captain Onboarding • 3/4'), findsOneWidget);

    // Upload mandatory documents directly
    await controller.uploadDocument('DRIVING_LICENSE', filename: 'dl_front.jpg');
    await controller.uploadDocument('AADHAAR', filename: 'aadhaar_front.jpg');
    await controller.uploadDocument('PROFILE_PHOTO', filename: 'selfie.jpg');
    await controller.uploadDocument('VEHICLE_RC', filename: 'rc_card.jpg');
    await controller.uploadDocument('GREEN_PLATE_PERMIT', filename: 'green_permit.pdf');

    await tester.pump();

    await tester.tap(find.text('Save & Continue'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // -------------------------------------------------------------------------
    // STEP 4: Preview & Submit (4/4)
    // -------------------------------------------------------------------------
    expect(controller.currentStep, equals(OnboardingStep.previewSubmit));
    expect(find.text('EV Captain Onboarding • 4/4'), findsOneWidget);
    expect(find.text('Ravi Varma'), findsOneWidget);
    expect(find.text('AP31 20190008888'), findsOneWidget);
    expect(find.text('Tata Motors Tigor EV'), findsOneWidget);
    expect(find.text('AP31EV9999'), findsOneWidget);
    expect(find.text('26.0 kWh'), findsOneWidget);

    // Accept statutory EV declaration
    final declarationCheckbox = find.byType(Checkbox);
    await tester.tap(declarationCheckbox);
    await tester.pump();

    // Submit for operational review
    await tester.tap(find.text('Submit for Review'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    // -------------------------------------------------------------------------
    // STEP 5: Application Status Screen
    // -------------------------------------------------------------------------
    expect(controller.currentStep, equals(OnboardingStep.applicationStatus));
    expect(find.text('Application Status'), findsWidgets);
    expect(find.text('SUBMITTED (ATTEMPT #1)'), findsOneWidget);
    expect(find.textContaining('Visakhapatnam Fleet Ops is verifying your documents'), findsOneWidget);

    // Verify mock client recorded submission state for Fleet Ops
    expect(mockClient.currentDraft.status, equals('SUBMITTED'));
    expect(mockClient.currentDraft.submissionCount, equals(1));
    expect(mockClient.currentDraft.fullName, equals('Ravi Varma'));
    expect(mockClient.currentDraft.vehicleRegistrationNumber, equals('AP31EV9999'));
    expect(mockClient.reviewHistory.length, equals(1));
  });
}
