// EcoRide Captain Preview & Submit Screen (EV-026)
// Summarizes entered onboarding data, supports fast section editing without data loss,
// captures statutory EV declaration, and executes application submission.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/captain_onboarding_controller.dart';
import '../models/captain_onboarding_model.dart';
import '../widgets/ev_step_progress_bar.dart';

class CaptainPreviewSubmitScreen extends StatelessWidget {
  final CaptainOnboardingController controller;

  const CaptainPreviewSubmitScreen({
    super.key,
    required this.controller,
  });

  static const Color electricGreen = Color(0xFF059669);
  static const Color surfaceNavy = Color(0xFF1C2541);
  static const Color voltageNavy = Color(0xFF0B132B);

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context);
        final draft = controller.draft;
        final docs = controller.documents;

        return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          EvStepProgressBar(currentStep: controller.currentStep),
          const SizedBox(height: 20),

          Text(
            l10n.stepPreview,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          const Text(
            'Review all submitted details before sending your application to Andhra Pradesh Fleet Operations.',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 20),

          // Error Notification
          if (controller.errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.redAccent.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      controller.errorMessage!,
                      style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // 1. Personal Details Card
          _buildReviewCard(
            title: '1. Personal & Driver Details',
            onEdit: () => controller.editStepFromPreview(OnboardingStep.personalDetails),
            rows: [
              {'label': 'Full Name', 'value': draft.fullName},
              {'label': 'Date of Birth', 'value': draft.dateOfBirth.isNotEmpty ? draft.dateOfBirth : 'N/A'},
              {'label': 'Operating City', 'value': draft.city.toUpperCase()},
              {'label': 'Commercial DL', 'value': draft.drivingLicenseNumber},
              {'label': 'DL Expiry', 'value': draft.drivingLicenseExpiry.isNotEmpty ? draft.drivingLicenseExpiry : 'N/A'},
              {'label': 'Badge Number', 'value': draft.badgeNumber.isNotEmpty ? draft.badgeNumber : 'N/A'},
              {'label': 'Emergency Contact', 'value': '${draft.emergencyContactName} (${draft.emergencyContactPhone})'},
            ],
          ),
          const SizedBox(height: 16),

          // 2. EV Vehicle Details Card
          _buildReviewCard(
            title: '2. 100% Electric Vehicle Details',
            onEdit: () => controller.editStepFromPreview(OnboardingStep.vehicleDetails),
            rows: [
              {'label': 'Propulsion', 'value': '100% BATTERY ELECTRIC (BEV)'},
              {'label': 'Ownership', 'value': draft.vehicleOwnershipType},
              {'label': 'Category', 'value': draft.vehicleCategory},
              {'label': 'Make & Model', 'value': '${draft.vehicleMake} ${draft.vehicleModel}'},
              {'label': 'Green Plate Reg', 'value': draft.vehicleRegistrationNumber},
              {'label': 'Battery Capacity', 'value': '${draft.batteryCapacityKwh ?? 0.0} kWh'},
              {'label': 'Year', 'value': draft.vehicleYear?.toString() ?? 'N/A'},
            ],
          ),
          const SizedBox(height: 16),

          // 3. Uploaded Documents Card
          _buildDocumentsReviewCard(
            title: '3. Uploaded KYC & Vehicle Permits',
            onEdit: () => controller.editStepFromPreview(OnboardingStep.documents),
            docs: docs,
          ),
          const SizedBox(height: 20),

          // Statutory EV Declaration Checkbox
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: surfaceNavy,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: controller.statutoryDeclarationAccepted ? electricGreen : Colors.white24,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Checkbox(
                  value: controller.statutoryDeclarationAccepted,
                  activeColor: electricGreen,
                  onChanged: (val) {
                    controller.toggleDeclaration(val ?? false);
                  },
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Text(
                      l10n.statutoryDeclaration,
                      style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.4),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Submit Action
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: controller.isLoading ? null : () => controller.submitApplication(),
              style: ElevatedButton.styleFrom(
                backgroundColor: electricGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: controller.isLoading
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        ),
                        SizedBox(width: 12),
                        Text('Submitting to fleet operations...', style: TextStyle(fontSize: 14)),
                      ],
                    )
                  : Text(
                      l10n.submitApplication,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
      },
    );
  }

  Widget _buildReviewCard({
    required String title,
    required VoidCallback onEdit,
    required List<Map<String, String>> rows,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: surfaceNavy,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit, size: 14, color: electricGreen),
                label: const Text('Edit', style: TextStyle(color: electricGreen, fontSize: 12)),
              ),
            ],
          ),
          const Divider(color: Colors.white12, height: 16),
          for (final row in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    row['label']!,
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  Text(
                    row['value']!,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 12),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDocumentsReviewCard({
    required String title,
    required VoidCallback onEdit,
    required Map<String, DocumentUploadItem> docs,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: surfaceNavy,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
              TextButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit, size: 14, color: electricGreen),
                label: const Text('Edit', style: TextStyle(color: electricGreen, fontSize: 12)),
              ),
            ],
          ),
          const Divider(color: Colors.white12, height: 16),
          for (final doc in docs.values)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Icon(
                    doc.docId != null ? Icons.check_circle : Icons.radio_button_unchecked,
                    color: doc.docId != null ? electricGreen : Colors.white24,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      doc.label,
                      style: TextStyle(
                        color: doc.docId != null ? Colors.white : Colors.white38,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  if (doc.docId != null)
                    const Text('Uploaded', style: TextStyle(color: electricGreen, fontSize: 11, fontWeight: FontWeight.bold))
                  else
                    const Text('Not uploaded', style: TextStyle(color: Colors.white38, fontSize: 11)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
