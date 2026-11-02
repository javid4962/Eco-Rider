// EcoRide Captain Application Status Screen (EV-026)
// Displays verification progress, independent driver & vehicle statuses, rejection feedback,
// and one-click resumption into draft editing without data re-entry.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../captain_application_status_card.dart';
import '../controllers/captain_onboarding_controller.dart';

class CaptainApplicationStatusScreen extends StatelessWidget {
  final CaptainOnboardingController controller;
  final VoidCallback? onDutyDashboard;

  const CaptainApplicationStatusScreen({
    super.key,
    required this.controller,
    this.onDutyDashboard,
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

        final appStatus = _mapAppStatus(draft.status);
        final driverReqStatus = _mapReqStatus(draft.driverRequirementsStatus);
        final vehicleReqStatus = _mapReqStatus(draft.vehicleRequirementsStatus);
        final complianceStatus = _mapComplianceStatus(draft.complianceStatus);

        return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
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
                      l10n.applicationStatusTitle,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh, color: electricGreen, size: 20),
                      tooltip: 'Refresh Status',
                      onPressed: () => controller.loadExistingDraft(),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  appStatus == CaptainAppStatus.approved
                      ? 'Congratulations! Your EV captain application is fully approved.'
                      : appStatus == CaptainAppStatus.rejected
                          ? l10n.applicationRejectedMsg
                          : l10n.applicationSubmittedMsg,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Central Status Card
          CaptainApplicationStatusCard(
            status: appStatus,
            driverKycStatus: driverReqStatus,
            vehicleKycStatus: vehicleReqStatus,
            complianceStatus: complianceStatus,
            submissionAttempt: draft.submissionCount > 0 ? draft.submissionCount : 1,
            rejectionReason: draft.overallRejectionReason ?? draft.driverRejectionReason ?? draft.vehicleRejectionReason,
            onEditDraft: () => controller.editDraftAfterRejection(),
          ),
          const SizedBox(height: 16),

          // Action Button based on status
          if (appStatus == CaptainAppStatus.approved) ...[
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: onDutyDashboard,
                icon: const Icon(Icons.power_settings_new, size: 18),
                label: const Text('Go to Duty Dashboard', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: electricGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ] else if (appStatus == CaptainAppStatus.rejected) ...[
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () => controller.editDraftAfterRejection(),
                icon: const Icon(Icons.edit_note, size: 20),
                label: Text(l10n.editDraftResubmit, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: electricGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: surfaceNavy,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white12),
              ),
              child: const Row(
                children: [
                  Icon(Icons.hourglass_bottom, color: Colors.amberAccent, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Visakhapatnam Fleet Ops is verifying your documents. You will receive an SMS upon decision.',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
      },
    );
  }

  CaptainAppStatus _mapAppStatus(String st) {
    switch (st.toUpperCase()) {
      case 'APPROVED':
        return CaptainAppStatus.approved;
      case 'REJECTED':
        return CaptainAppStatus.rejected;
      case 'SUBMITTED':
        return CaptainAppStatus.submitted;
      case 'UNDER_REVIEW':
        return CaptainAppStatus.underReview;
      default:
        return CaptainAppStatus.draft;
    }
  }

  ReqVerificationStatus _mapReqStatus(String st) {
    switch (st.toUpperCase()) {
      case 'APPROVED':
        return ReqVerificationStatus.approved;
      case 'REJECTED':
        return ReqVerificationStatus.rejected;
      default:
        return ReqVerificationStatus.pending;
    }
  }

  CaptainComplianceStatus? _mapComplianceStatus(String? st) {
    if (st == null) return null;
    switch (st.toUpperCase()) {
      case 'VERIFIED':
        return CaptainComplianceStatus.verified;
      case 'SUSPENDED':
        return CaptainComplianceStatus.suspended;
      case 'EXPIRED':
        return CaptainComplianceStatus.expired;
      case 'UNDER_REVIEW':
        return CaptainComplianceStatus.underReview;
      case 'REJECTED':
        return CaptainComplianceStatus.rejected;
      default:
        return CaptainComplianceStatus.pending;
    }
  }
}
