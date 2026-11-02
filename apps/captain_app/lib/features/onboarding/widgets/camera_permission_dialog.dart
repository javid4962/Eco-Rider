// EcoRide Camera Permission Dialog & Banner (EV-026)
// Handles denied camera permissions with graceful fallback to file picker or settings.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';

class CameraPermissionDialog extends StatelessWidget {
  final VoidCallback onPickFromGallery;
  final VoidCallback onDismiss;
  final VoidCallback? onOpenSettings;

  const CameraPermissionDialog({
    super.key,
    required this.onPickFromGallery,
    required this.onDismiss,
    this.onOpenSettings,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return AlertDialog(
      backgroundColor: const Color(0xFF1C2541),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          const Icon(Icons.no_photography, color: Colors.amberAccent, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              l10n.cameraDeniedTitle,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.cameraDeniedDesc,
            style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.amberAccent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.3)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline, color: Colors.amberAccent, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Tip: You can select a clear photo or PDF document directly from your device storage.',
                    style: TextStyle(color: Colors.amberAccent, fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: onDismiss,
          child: const Text('Cancel', style: TextStyle(color: Colors.white54)),
        ),
        ElevatedButton.icon(
          onPressed: () {
            onDismiss();
            onPickFromGallery();
          },
          icon: const Icon(Icons.folder_open, size: 16),
          label: Text(l10n.pickFromGallery),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF059669),
            foregroundColor: Colors.white,
          ),
        ),
      ],
    );
  }
}
