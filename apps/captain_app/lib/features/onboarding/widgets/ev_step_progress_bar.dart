// EcoRide EV Step Progress Bar Widget (EV-026)
// Original EV-Only Electric Mobility Platform for Andhra Pradesh

import 'package:flutter/material.dart';
import '../models/captain_onboarding_model.dart';

class EvStepProgressBar extends StatelessWidget {
  final OnboardingStep currentStep;

  const EvStepProgressBar({
    super.key,
    required this.currentStep,
  });

  static const Color electricGreen = Color(0xFF059669);
  static const Color voltageNavy = Color(0xFF0B132B);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  Widget build(BuildContext context) {
    final steps = [
      {'step': OnboardingStep.personalDetails, 'label': 'Personal'},
      {'step': OnboardingStep.vehicleDetails, 'label': 'Vehicle'},
      {'step': OnboardingStep.documents, 'label': 'Docs'},
      {'step': OnboardingStep.previewSubmit, 'label': 'Review'},
    ];

    final currentIndex = _stepToIndex(currentStep);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: surfaceNavy,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          for (int i = 0; i < steps.length; i++) ...[
            Expanded(
              child: _buildStepItem(
                context,
                index: i + 1,
                label: steps[i]['label'] as String,
                isActive: i == currentIndex,
                isCompleted: i < currentIndex,
              ),
            ),
            if (i < steps.length - 1)
              Container(
                width: 16,
                height: 2,
                color: i < currentIndex ? electricGreen : Colors.white24,
              ),
          ],
        ],
      ),
    );
  }

  Widget _buildStepItem(
    BuildContext context, {
    required int index,
    required String label,
    required bool isActive,
    required bool isCompleted,
  }) {
    Color circleColor;
    Color textColor;
    Widget content;

    if (isCompleted) {
      circleColor = electricGreen;
      textColor = electricGreen;
      content = const Icon(Icons.check, size: 14, color: Colors.white);
    } else if (isActive) {
      circleColor = electricGreen;
      textColor = Colors.white;
      content = Text(
        '$index',
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
      );
    } else {
      circleColor = Colors.white24;
      textColor = Colors.white54;
      content = Text(
        '$index',
        style: const TextStyle(color: Colors.white70, fontSize: 12),
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: circleColor,
            border: Border.all(
              color: isActive ? Colors.white : Colors.transparent,
              width: 1.5,
            ),
          ),
          alignment: Alignment.center,
          child: content,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 11,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          ),
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  int _stepToIndex(OnboardingStep step) {
    switch (step) {
      case OnboardingStep.phoneLogin:
        return -1;
      case OnboardingStep.personalDetails:
        return 0;
      case OnboardingStep.vehicleDetails:
        return 1;
      case OnboardingStep.documents:
        return 2;
      case OnboardingStep.previewSubmit:
        return 3;
      case OnboardingStep.applicationStatus:
        return 4;
    }
  }
}

