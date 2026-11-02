// EcoRide Captain Phone Login Widget Tests (EV-026)
// Validates phone number format, OTP input, attempt limits, and step transitions.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/app_localizations.dart';
import 'package:captain_app/features/onboarding/controllers/captain_onboarding_controller.dart';
import 'package:captain_app/features/onboarding/models/captain_onboarding_model.dart';
import 'package:captain_app/features/onboarding/screens/captain_phone_login_screen.dart';
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
  group('Captain Phone Login & OTP Verification Tests', () {
    testWidgets('Validates Indian phone number format (+91 followed by 10 digits starting with 6-9)', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        enableCooldownTimer: false,
      );

      await tester.pumpWidget(createTestApp(CaptainPhoneLoginScreen(controller: controller)));
      await tester.pump();

      // Verify title and input presence
      expect(find.text('EcoRide Captain'), findsOneWidget);
      expect(find.text('100% ELECTRIC'), findsOneWidget);
      expect(find.text('Send Verification Code'), findsOneWidget);

      // 1. Enter invalid phone number (too short / wrong prefix)
      final phoneField = find.byType(TextField).first;
      await tester.enterText(phoneField, '12345');
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();

      // Tap Send Code
      await tester.tap(find.text('Send Verification Code'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Verify validation error
      expect(find.textContaining('Enter valid Indian mobile number'), findsOneWidget);
      expect(controller.isOtpSent, isFalse);

      // 2. Enter valid Indian mobile number (+919876543210)
      await tester.enterText(phoneField, '+919876543210');
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();

      await tester.tap(find.text('Send Verification Code'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Verify OTP screen is displayed
      expect(controller.isOtpSent, isTrue);
      expect(find.text('Enter 6-Digit OTP'), findsWidgets);
      expect(find.text('Verify & Proceed'), findsOneWidget);
    });

    testWidgets('Rejects invalid OTP code and verifies successful code', (tester) async {
      tester.view.physicalSize = const Size(800, 1200);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockClient = MockCaptainOnboardingApiClient();
      final controller = CaptainOnboardingController(
        apiClient: mockClient,
        initialDraft: CaptainDraftData(),
        enableCooldownTimer: false,
      );

      // Send OTP first
      controller.setPhone('+919876543210');
      await controller.sendOtp();

      await tester.pumpWidget(createTestApp(CaptainPhoneLoginScreen(controller: controller)));
      await tester.pump();

      // Verify OTP field is displayed
      expect(find.text('Enter 6-Digit OTP'), findsWidgets);

      // Enter incorrect OTP
      final otpField = find.byType(TextField).last;
      await tester.enterText(otpField, '999999');
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();

      await tester.tap(find.text('Verify & Proceed'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      // Verify failure error message
      expect(find.textContaining('INVALID_OTP'), findsOneWidget);
      expect(controller.isLoggedIn, isFalse);

      // Enter valid OTP (123456)
      await tester.enterText(otpField, '123456');
      FocusManager.instance.primaryFocus?.unfocus();
      await tester.pump();

      await tester.tap(find.text('Verify & Proceed'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));

      expect(controller.isLoggedIn, isTrue);
      expect(controller.currentStep, equals(OnboardingStep.personalDetails));
    });
  });
}
