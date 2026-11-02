// EcoRide Captain Documents Screen Widget Tests (EV-026)
// Validates document checklist, camera permission denial, upload interruption & retry, and slow network indicators.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/app_localizations.dart';
import 'package:captain_app/features/onboarding/controllers/captain_onboarding_controller.dart';
import 'package:captain_app/features/onboarding/models/captain_onboarding_model.dart';
import 'package:captain_app/features/onboarding/screens/captain_documents_screen.dart';
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
  group('Captain Documents Screen Tests', () {
    testWidgets('Enforces mandatory transport documents before proceeding to review', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.documents,
        initialDraft: CaptainDraftData(vehicleOwnershipType: 'OWNED'),
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainDocumentsScreen(controller: controller)));
      await tester.pump();

      expect(find.text('Documents'), findsOneWidget);

      // Attempt proceed without uploading documents
      await tester.tap(find.text('Save & Continue'));
      await tester.pump();

      // Verify missing document error alerts
      expect(find.text('Missing Mandatory Documents'), findsOneWidget);
      expect(find.text('• Commercial driving license document is mandatory'), findsOneWidget);
      expect(controller.currentStep, equals(OnboardingStep.documents));
    });

    testWidgets('Handles denied camera with dialog and fallback to file storage upload', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.documents,
        initialDraft: CaptainDraftData(),
        enableCooldownTimer: false,
      );

      // Flag camera permission as denied
      controller.setCameraDenied(true);

      await tester.pumpWidget(createTestApp(CaptainDocumentsScreen(controller: controller)));
      await tester.pump();

      // Verify camera denied banner is visible
      expect(find.text('Camera Access Denied'), findsWidgets);

      // Tap Take Photo for Driving License
      final takePhotoButton = find.text('Take Photo').first;
      await tester.tap(takePhotoButton);
      await tester.pump();

      // CameraPermissionDialog appears
      expect(find.text('Camera access was denied. Please allow camera in settings or pick a file.'), findsWidgets);
      expect(find.text('Pick File from Storage'), findsOneWidget);

      // Tap Pick File from Storage in dialog
      await tester.tap(find.text('Pick File from Storage'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Verify document was uploaded via file storage fallback
      expect(controller.documents['DRIVING_LICENSE']!.status, equals(DocUploadStatus.uploaded));
      expect(controller.draft.drivingLicenseDocId, isNotNull);
    });

    testWidgets('Handles interrupted upload with retry button and slow network indication', (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialStep: OnboardingStep.documents,
        initialDraft: CaptainDraftData(),
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainDocumentsScreen(controller: controller)));
      await tester.pump();

      // 1. Simulate interrupted upload for Driving License
      final interruptUpload = controller.uploadDocument('DRIVING_LICENSE', simulateInterruption: true);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));
      await interruptUpload;
      await tester.pump();

      // Verify interrupted UI
      expect(find.text('Upload interrupted. Tap to resume/retry.'), findsOneWidget);
      expect(find.text('Retry Upload'), findsOneWidget);
      expect(controller.documents['DRIVING_LICENSE']!.status, equals(DocUploadStatus.interrupted));

      // 2. Tap Retry Upload
      await tester.tap(find.text('Retry Upload'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Successfully recovered from interruption
      expect(controller.documents['DRIVING_LICENSE']!.status, equals(DocUploadStatus.uploaded));
      expect(find.text('Document Uploaded'), findsOneWidget);

      // 3. Test slow network upload banner
      final slowUpload = controller.uploadDocument(
        'AADHAAR',
        filename: 'aadhaar.jpg',
        simulateSlowNetwork: true,
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 20));

      // Verify slow network banner is displayed
      expect(controller.isSlowNetwork, isTrue);

      await tester.pump(const Duration(milliseconds: 150));
      await slowUpload;
      await tester.pump();

      expect(controller.documents['AADHAAR']!.status, equals(DocUploadStatus.uploaded));
      expect(controller.isSlowNetwork, isFalse);
    });
  });
}
