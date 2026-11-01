import 'package:flutter/material.dart';

enum CaptainAppStatus {
  draft,
  submitted,
  underReview,
  approved,
  rejected,
}

enum ReqVerificationStatus {
  pending,
  approved,
  rejected,
}

/// Represents the captain onboarding application state in the captain Flutter app.
class CaptainApplicationStatusCard extends StatelessWidget {
  final CaptainAppStatus status;
  final ReqVerificationStatus driverKycStatus;
  final ReqVerificationStatus vehicleKycStatus;
  final int submissionAttempt;
  final String? rejectionReason;
  final VoidCallback? onEditDraft;

  const CaptainApplicationStatusCard({
    super.key,
    required this.status,
    required this.driverKycStatus,
    required this.vehicleKycStatus,
    this.submissionAttempt = 1,
    this.rejectionReason,
    this.onEditDraft,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFF1C2541),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: _borderColorForStatus(status),
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      _iconForStatus(status),
                      color: _borderColorForStatus(status),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'EV Captain Verification',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _borderColorForStatus(status).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    _statusLabel(status),
                    style: TextStyle(
                      color: _borderColorForStatus(status),
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildRequirementBadge(
                    'Driver KYC',
                    driverKycStatus,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildRequirementBadge(
                    'EV Green Plate',
                    vehicleKycStatus,
                  ),
                ),
              ],
            ),
            if (rejectionReason != null && rejectionReason!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
                ),
                child: Text(
                  'Operator Note: $rejectionReason',
                  style: const TextStyle(
                    color: Color(0xFFFCA5A5),
                    fontSize: 12,
                  ),
                ),
              ),
            ],
            if (status == CaptainAppStatus.rejected) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onEditDraft,
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Edit Draft & Resubmit'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRequirementBadge(String label, ReqVerificationStatus reqStatus) {
    Color color;
    String text;
    switch (reqStatus) {
      case ReqVerificationStatus.approved:
        color = const Color(0xFF10B981);
        text = 'Verified';
        break;
      case ReqVerificationStatus.rejected:
        color = Colors.redAccent;
        text = 'Rejected';
        break;
      case ReqVerificationStatus.pending:
        color = Colors.orangeAccent;
        text = 'Pending';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF0B132B),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
          const SizedBox(height: 2),
          Text(
            text,
            style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Color _borderColorForStatus(CaptainAppStatus st) {
    switch (st) {
      case CaptainAppStatus.approved:
        return const Color(0xFF10B981);
      case CaptainAppStatus.rejected:
        return Colors.redAccent;
      case CaptainAppStatus.submitted:
        return const Color(0xFF38BDF8);
      case CaptainAppStatus.underReview:
        return Colors.orangeAccent;
      case CaptainAppStatus.draft:
        return Colors.grey;
    }
  }

  IconData _iconForStatus(CaptainAppStatus st) {
    switch (st) {
      case CaptainAppStatus.approved:
        return Icons.verified;
      case CaptainAppStatus.rejected:
        return Icons.cancel_outlined;
      case CaptainAppStatus.submitted:
        return Icons.hourglass_top;
      case CaptainAppStatus.underReview:
        return Icons.rule;
      case CaptainAppStatus.draft:
        return Icons.edit_note;
    }
  }

  String _statusLabel(CaptainAppStatus st) {
    switch (st) {
      case CaptainAppStatus.approved:
        return 'APPROVED';
      case CaptainAppStatus.rejected:
        return 'ACTION REQUIRED';
      case CaptainAppStatus.submitted:
        return 'SUBMITTED (ATTEMPT #$submissionAttempt)';
      case CaptainAppStatus.underReview:
        return 'UNDER REVIEW';
      case CaptainAppStatus.draft:
        return 'DRAFT';
    }
  }
}
