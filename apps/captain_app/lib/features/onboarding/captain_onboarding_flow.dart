// EcoRide Captain Onboarding Orchestrator Flow (EV-026)
// Manages the complete onboarding journey from phone login to application status.

import 'package:flutter/material.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/localization/language_switcher.dart';
import '../../core/localization/locale_controller.dart';
import 'controllers/captain_onboarding_controller.dart';
import 'models/captain_onboarding_model.dart';
import 'screens/captain_application_status_screen.dart';
import 'screens/captain_documents_screen.dart';
import 'screens/captain_personal_details_screen.dart';
import 'screens/captain_phone_login_screen.dart';
import 'screens/captain_preview_submit_screen.dart';
import 'screens/captain_vehicle_details_screen.dart';

class CaptainOnboardingFlow extends StatefulWidget {
  final CaptainOnboardingController? controller;
  final LocaleController? localeController;
  final VoidCallback? onFinished;

  const CaptainOnboardingFlow({
    super.key,
    this.controller,
    this.localeController,
    this.onFinished,
  });

  @override
  State<CaptainOnboardingFlow> createState() => _CaptainOnboardingFlowState();
}

class _CaptainOnboardingFlowState extends State<CaptainOnboardingFlow> {
  late final CaptainOnboardingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? CaptainOnboardingController();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context);

        return Scaffold(
          backgroundColor: const Color(0xFF0B132B),
          appBar: AppBar(
            backgroundColor: const Color(0xFF0B132B),
            elevation: 0,
            title: Text(
              _titleForStep(_controller.currentStep, l10n),
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            leading: _controller.currentStep != OnboardingStep.phoneLogin &&
                    _controller.currentStep != OnboardingStep.applicationStatus
                ? IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => _handleBackNavigation(),
                  )
                : null,
            actions: [
              if (widget.localeController != null)
                LanguageSwitcherButton(controller: widget.localeController!),
            ],
          ),
          body: SafeArea(
            child: _buildCurrentScreen(),
          ),
        );
      },
    );
  }

  Widget _buildCurrentScreen() {
    switch (_controller.currentStep) {
      case OnboardingStep.phoneLogin:
        return CaptainPhoneLoginScreen(controller: _controller);
      case OnboardingStep.personalDetails:
        return CaptainPersonalDetailsScreen(controller: _controller);
      case OnboardingStep.vehicleDetails:
        return CaptainVehicleDetailsScreen(controller: _controller);
      case OnboardingStep.documents:
        return CaptainDocumentsScreen(controller: _controller);
      case OnboardingStep.previewSubmit:
        return CaptainPreviewSubmitScreen(controller: _controller);
      case OnboardingStep.applicationStatus:
        return CaptainApplicationStatusScreen(
          controller: _controller,
          onDutyDashboard: widget.onFinished,
        );
    }
  }

  void _handleBackNavigation() {
    switch (_controller.currentStep) {
      case OnboardingStep.personalDetails:
        _controller.goToStep(OnboardingStep.phoneLogin);
        break;
      case OnboardingStep.vehicleDetails:
        _controller.goToStep(OnboardingStep.personalDetails);
        break;
      case OnboardingStep.documents:
        _controller.goToStep(OnboardingStep.vehicleDetails);
        break;
      case OnboardingStep.previewSubmit:
        _controller.goToStep(OnboardingStep.documents);
        break;
      default:
        break;
    }
  }

  String _titleForStep(OnboardingStep step, AppLocalizations l10n) {
    switch (step) {
      case OnboardingStep.phoneLogin:
        return l10n.captainOnboardingTitle;
      case OnboardingStep.personalDetails:
        return '${l10n.captainOnboardingTitle} • 1/4';
      case OnboardingStep.vehicleDetails:
        return '${l10n.captainOnboardingTitle} • 2/4';
      case OnboardingStep.documents:
        return '${l10n.captainOnboardingTitle} • 3/4';
      case OnboardingStep.previewSubmit:
        return '${l10n.captainOnboardingTitle} • 4/4';
      case OnboardingStep.applicationStatus:
        return l10n.applicationStatusTitle;
    }
  }
}

