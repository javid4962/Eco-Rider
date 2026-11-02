// EcoRide Captain Preview & Status Screen Widget Tests (EV-026)
// Validates preview data summary, edit navigation without data loss, statutory declaration,
// and resubmission of rejected applications preserving existing draft.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/app_localizations.dart';
import 'package:captain_app/features/onboarding/controllers/captain_onboarding_controller.dart';
import 'package:captain_app/features/onboarding/models/captain_onboarding_model.dart';
import 'package:captain_app/features/onboarding/screens/captain_application_status_screen.dart';
import 'package:captain_app/features/onboarding/screens/captain_preview_submit_screen.dart';
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
  group('Captain Preview & Application Status Tests', () {
    testWidgets('Displays full summary, allows quick edit without losing data, and enforces statutory declaration', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final draft = CaptainDraftData(
        fullName: 'Suresh Kumar',
        dateOfBirth: '1992-05-15',
        drivingLicenseNumber: 'AP31 20180004561',
        drivingLicenseExpiry: '2030-05-14',
        emergencyContactName: 'Lakshmi Kumar',
        emergencyContactPhone: '+919876543210',
        city: 'visakhapatnam',
        vehicleMake: 'Ather Energy',
        vehicleModel: '450X Gen 3',
        vehicleYear: 2024,
        vehicleRegistrationNumber: 'AP31EV0001',
        batteryCapacityKwh: 3.7,
        drivingLicenseDocId: 'doc-dl-111',
        aadhaarDocId: 'doc-aadhaar-222',
        vehicleRcDocId: 'doc-rc-333',
        greenPlatePermitDocId: 'doc-permit-444',
      );

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.previewSubmit,
        initialDraft: draft,
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainPreviewSubmitScreen(controller: controller)));
      await tester.pump();

      // 1. Verify summary fields
      expect(find.text('Preview & Submit'), findsOneWidget);
      expect(find.text('Suresh Kumar'), findsOneWidget);
      expect(find.text('AP31 20180004561'), findsOneWidget);
      expect(find.text('Ather Energy 450X Gen 3'), findsOneWidget);
      expect(find.text('AP31EV0001'), findsOneWidget);
      expect(find.text('3.7 kWh'), findsOneWidget);

      // 2. Test edit shortcut to Personal Details
      final editButtons = find.text('Edit');
      expect(editButtons, findsNWidgets(3));

      await tester.tap(editButtons.first);
      await tester.pump();

      // Navigated directly back to Personal Details step with data intact
      expect(controller.currentStep, equals(OnboardingStep.personalDetails));
      expect(controller.draft.fullName, equals('Suresh Kumar'));

      // Return to preview
      controller.goToStep(OnboardingStep.previewSubmit);
      await tester.pump();

      // 3. Attempt Submit without accepting statutory declaration
      await tester.tap(find.text('Submit for Review'));
      await tester.pump();

      expect(find.textContaining('You must accept the statutory EV declaration'), findsOneWidget);
      expect(controller.draft.status, equals('DRAFT'));

      // 4. Toggle declaration checkbox and submit
      final checkbox = find.byType(Checkbox);
      await tester.tap(checkbox);
      await tester.pump();

      await tester.tap(find.text('Submit for Review'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Successfully transitioned to Application Status
      expect(controller.currentStep, equals(OnboardingStep.applicationStatus));
      expect(controller.draft.status, equals('SUBMITTED'));
    });

    testWidgets('Application status screen shows review details and allows editing rejected draft without re-entering data', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      // Create a REJECTED draft with existing data
      final rejectedDraft = CaptainDraftData(
        id: 'app-rej-01',
        status: 'REJECTED',
        submissionCount: 1,
        fullName: 'Suresh Kumar',
        drivingLicenseNumber: 'AP31 20180004561',
        emergencyContactName: 'Lakshmi Kumar',
        emergencyContactPhone: '+919876543210',
        vehicleMake: 'Ather Energy',
        vehicleModel: '450X',
        vehicleRegistrationNumber: 'AP31EV0001',
        overallRejectionReason: 'Driving license front photo is blurry. Please upload clear scan.',
      );

      final mockClient = MockCaptainOnboardingApiClient();
      mockClient.currentDraft = rejectedDraft;

      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.applicationStatus,
        initialDraft: rejectedDraft,
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainApplicationStatusScreen(controller: controller)));
      await tester.pump();

      // Verify rejected status UI
      expect(find.text('Application Status'), findsOneWidget);
      expect(find.text('ACTION REQUIRED'), findsOneWidget);
      expect(find.textContaining('Operator Note: Driving license front photo is blurry'), findsOneWidget);
      expect(find.text('Edit Draft & Resubmit'), findsWidgets);

      // Tap Edit Draft & Resubmit
      await tester.tap(find.text('Edit Draft & Resubmit').first);
      await tester.pump();

      // Navigated back to Personal Details step
      expect(controller.currentStep, equals(OnboardingStep.personalDetails));

      // CRITICAL ACCEPTANCE: All previously entered data remains populated!
      expect(controller.draft.fullName, equals('Suresh Kumar'));
      expect(controller.draft.drivingLicenseNumber, equals('AP31 20180004561'));
      expect(controller.draft.vehicleMake, equals('Ather Energy'));
      expect(controller.draft.vehicleRegistrationNumber, equals('AP31EV0001'));
    });
  });
}

