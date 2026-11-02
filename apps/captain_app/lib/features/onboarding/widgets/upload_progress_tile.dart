// EcoRide Upload Progress Tile Widget (EV-026)
// Handles document upload states, progress animation, interrupted upload retry,
// slow network banner, and success confirmation.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../models/captain_onboarding_model.dart';

class UploadProgressTile extends StatelessWidget {
  final DocumentUploadItem item;
  final bool isSlowNetwork;
  final VoidCallback onUpload;
  final VoidCallback onTakePhoto;
  final VoidCallback onRetry;

  const UploadProgressTile({
    super.key,
    required this.item,
    this.isSlowNetwork = false,
    required this.onUpload,
    required this.onTakePhoto,
    required this.onRetry,
  });

  static const Color electricGreen = Color(0xFF059669);
  static const Color surfaceNavy = Color(0xFF1C2541);
  static const Color voltageNavy = Color(0xFF0B132B);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: surfaceNavy,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _borderColorForStatus(item.status),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Icon(
                      _iconForStatus(item.status),
                      color: _borderColorForStatus(item.status),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item.label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (item.isRequired)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Required',
                    style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white10,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Optional',
                    style: TextStyle(color: Colors.white54, fontSize: 10),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),

          // Body based on status
          if (item.status == DocUploadStatus.idle) ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onTakePhoto,
                    icon: const Icon(Icons.camera_alt, size: 16),
                    label: const Text('Take Photo', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: Colors.white24),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onUpload,
                    icon: const Icon(Icons.upload_file, size: 16),
                    label: const Text('Choose File', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: electricGreen,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ] else if (item.status == DocUploadStatus.uploading) ...[
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LinearProgressIndicator(
                  value: item.progress > 0 ? item.progress : null,
                  backgroundColor: Colors.white12,
                  valueColor: const AlwaysStoppedAnimation<Color>(electricGreen),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      l10n.uploadInProgress,
                      style: const TextStyle(color: Colors.white70, fontSize: 11),
                    ),
                    Text(
                      '${(item.progress * 100).toInt()}%',
                      style: const TextStyle(color: electricGreen, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ],
                ),
                if (isSlowNetwork) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.amberAccent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.network_check, size: 14, color: Colors.amberAccent),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            l10n.slowNetworkBanner,
                            style: const TextStyle(color: Colors.amberAccent, fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ] else if (item.status == DocUploadStatus.uploaded) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: electricGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.check_circle, color: electricGreen, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        l10n.uploadedVerified,
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: onUpload,
                    child: const Text('Change', style: TextStyle(color: Colors.white70, fontSize: 11)),
                  ),
                ],
              ),
            ),
          ] else if (item.status == DocUploadStatus.interrupted) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.amberAccent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.wifi_off, color: Colors.amberAccent, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          l10n.uploadInterrupted,
                          style: const TextStyle(color: Colors.amberAccent, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: Text(l10n.retryUpload),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amberAccent,
                        foregroundColor: Colors.black87,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else if (item.status == DocUploadStatus.failed) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.redAccent.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.redAccent, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          item.errorMessage ?? 'Upload failed',
                          style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: onRetry,
                      icon: const Icon(Icons.refresh, size: 16),
                      label: Text(l10n.retryUpload),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _borderColorForStatus(DocUploadStatus status) {
    switch (status) {
      case DocUploadStatus.uploaded:
        return electricGreen;
      case DocUploadStatus.uploading:
        return Colors.white24;
      case DocUploadStatus.interrupted:
        return Colors.amberAccent;
      case DocUploadStatus.failed:
        return Colors.redAccent;
      case DocUploadStatus.idle:
        return Colors.white12;
    }
  }

  IconData _iconForStatus(DocUploadStatus status) {
    switch (status) {
      case DocUploadStatus.uploaded:
        return Icons.verified_outlined;
      case DocUploadStatus.uploading:
        return Icons.cloud_upload_outlined;
      case DocUploadStatus.interrupted:
        return Icons.warning_amber_rounded;
      case DocUploadStatus.failed:
        return Icons.error_outline;
      case DocUploadStatus.idle:
        return Icons.description_outlined;
    }
  }
}

