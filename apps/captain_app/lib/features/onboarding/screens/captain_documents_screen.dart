// EcoRide Captain Documents Screen (EV-026)
// Handles document checklist, camera permission denial, upload interruption & retry, and slow network indicators.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/captain_onboarding_controller.dart';
import '../models/captain_onboarding_model.dart';
import '../widgets/camera_permission_dialog.dart';
import '../widgets/ev_step_progress_bar.dart';
import '../widgets/upload_progress_tile.dart';

class CaptainDocumentsScreen extends StatelessWidget {
  final CaptainOnboardingController controller;

  const CaptainDocumentsScreen({
    super.key,
    required this.controller,
  });

  static const Color electricGreen = Color(0xFF059669);

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context);
        final docs = controller.documents;
        final isOwned = controller.draft.vehicleOwnershipType == 'OWNED';

        return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          EvStepProgressBar(currentStep: controller.currentStep),
          const SizedBox(height: 20),

          Text(
            l10n.stepDocuments,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          const Text(
            'Upload clear photos or scans of your statutory transport licenses and vehicle records.',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 16),

          // Camera Denied Banner (if flagged)
          if (controller.cameraDenied) ...[
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.amberAccent.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.no_photography, color: Colors.amberAccent, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.cameraDeniedTitle,
                          style: const TextStyle(color: Colors.amberAccent, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          l10n.cameraDeniedDesc,
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => controller.resetCameraPermission(),
                    child: const Text('Dismiss', style: TextStyle(color: Colors.amberAccent, fontSize: 11)),
                  ),
                ],
              ),
            ),
          ],

          // Field Errors / Missing Documents Alert
          if (controller.fieldErrors.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.redAccent.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
                      SizedBox(width: 8),
                      Text(
                        'Missing Mandatory Documents',
                        style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ...controller.fieldErrors.values.map(
                    (err) => Padding(
                      padding: const EdgeInsets.only(left: 26, top: 2),
                      child: Text(
                        '• $err',
                        style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Section 1: Driver KYC Documents
          const Text(
            '1. Driver KYC & Identity',
            style: TextStyle(color: electricGreen, fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 8),

          if (docs.containsKey('DRIVING_LICENSE'))
            UploadProgressTile(
              item: docs['DRIVING_LICENSE']!,
              isSlowNetwork: controller.isSlowNetwork,
              onUpload: () => controller.uploadDocument('DRIVING_LICENSE', filename: 'driving_license.jpg'),
              onTakePhoto: () => _handleCameraAction(context, 'DRIVING_LICENSE'),
              onRetry: () => controller.retryUpload('DRIVING_LICENSE'),
            ),

          if (docs.containsKey('AADHAAR'))
            UploadProgressTile(
              item: docs['AADHAAR']!,
              isSlowNetwork: controller.isSlowNetwork,
              onUpload: () => controller.uploadDocument('AADHAAR', filename: 'aadhaar_card.jpg'),
              onTakePhoto: () => _handleCameraAction(context, 'AADHAAR'),
              onRetry: () => controller.retryUpload('AADHAAR'),
            ),

          if (docs.containsKey('PROFILE_PHOTO'))
            UploadProgressTile(
              item: docs['PROFILE_PHOTO']!,
              isSlowNetwork: controller.isSlowNetwork,
              onUpload: () => controller.uploadDocument('PROFILE_PHOTO', filename: 'captain_selfie.jpg'),
              onTakePhoto: () => _handleCameraAction(context, 'PROFILE_PHOTO'),
              onRetry: () => controller.retryUpload('PROFILE_PHOTO'),
            ),

          const SizedBox(height: 20),

          // Section 2: Electric Vehicle Documents
          if (isOwned) ...[
            const Text(
              '2. Electric Vehicle Transport Permits',
              style: TextStyle(color: electricGreen, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 8),

            if (docs.containsKey('VEHICLE_RC'))
              UploadProgressTile(
                item: docs['VEHICLE_RC']!,
                isSlowNetwork: controller.isSlowNetwork,
                onUpload: () => controller.uploadDocument('VEHICLE_RC', filename: 'vehicle_rc.jpg'),
                onTakePhoto: () => _handleCameraAction(context, 'VEHICLE_RC'),
                onRetry: () => controller.retryUpload('VEHICLE_RC'),
              ),

            if (docs.containsKey('GREEN_PLATE_PERMIT'))
              UploadProgressTile(
                item: docs['GREEN_PLATE_PERMIT']!,
                isSlowNetwork: controller.isSlowNetwork,
                onUpload: () => controller.uploadDocument('GREEN_PLATE_PERMIT', filename: 'green_plate_permit.pdf'),
                onTakePhoto: () => _handleCameraAction(context, 'GREEN_PLATE_PERMIT'),
                onRetry: () => controller.retryUpload('GREEN_PLATE_PERMIT'),
              ),

            if (docs.containsKey('VEHICLE_INSURANCE'))
              UploadProgressTile(
                item: docs['VEHICLE_INSURANCE']!,
                isSlowNetwork: controller.isSlowNetwork,
                onUpload: () => controller.uploadDocument('VEHICLE_INSURANCE', filename: 'insurance_policy.pdf'),
                onTakePhoto: () => _handleCameraAction(context, 'VEHICLE_INSURANCE'),
                onRetry: () => controller.retryUpload('VEHICLE_INSURANCE'),
              ),

            if (docs.containsKey('COMMERCIAL_FITNESS'))
              UploadProgressTile(
                item: docs['COMMERCIAL_FITNESS']!,
                isSlowNetwork: controller.isSlowNetwork,
                onUpload: () => controller.uploadDocument('COMMERCIAL_FITNESS', filename: 'fitness_cert.pdf'),
                onTakePhoto: () => _handleCameraAction(context, 'COMMERCIAL_FITNESS'),
                onRetry: () => controller.retryUpload('COMMERCIAL_FITNESS'),
              ),
          ],

          const SizedBox(height: 24),

          // Action Navigation Buttons
          Row(
            children: [
              OutlinedButton(
                onPressed: () => controller.goToStep(OnboardingStep.vehicleDetails),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Colors.white24),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                child: Text(l10n.prevStep),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => controller.saveAndProceedDocuments(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: electricGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(
                    l10n.saveAndContinue,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
      },
    );
  }

  void _handleCameraAction(BuildContext context, String docType) {
    if (controller.cameraDenied) {
      showDialog(
        context: context,
        builder: (ctx) => CameraPermissionDialog(
          onDismiss: () => Navigator.of(ctx).pop(),
          onPickFromGallery: () {
            controller.uploadDocument(docType, filename: '${docType.toLowerCase()}_storage.jpg');
          },
        ),
      );
    } else {
      // Simulate taking camera photo
      controller.uploadDocument(docType, filename: '${docType.toLowerCase()}_camera.jpg');
    }
  }
}
