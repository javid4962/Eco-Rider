// EcoRide Unsupported Zone Notice (EV-033)
// Explains why booking is not available when user selects coordinates outside
// authorized Andhra Pradesh EV pilot geofences or disabled service categories.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/location_selection_controller.dart';
import '../models/location_model.dart';

class UnsupportedZoneSheet extends StatelessWidget {
  final LocationSelectionController controller;
  final VoidCallback onChangeLocation;

  const UnsupportedZoneSheet({
    super.key,
    required this.controller,
    required this.onChangeLocation,
  });

  @override
  Widget build(BuildContext context) {
    if (controller.currentMode != LocationSelectionMode.unsupportedLocation) {
      return const SizedBox.shrink();
    }

    final l10n = AppLocalizations.of(context);
    final reason = controller.unsupportedReason;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1520), // Dark warning surface
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF43F5E), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Colors.black45,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded, color: Color(0xFFF43F5E), size: 26),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  l10n.unsupportedLocationTitle,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            l10n.unsupportedLocationDesc,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          if (reason != null && reason.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF0B132B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Color(0xFFF43F5E), size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      l10n.rejectionReasonLabel(reason),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF064E3B).withOpacity(0.4),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFF059669).withOpacity(0.4)),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified, color: Color(0xFF10B981), size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    l10n.activePilotNotice,
                    style: const TextStyle(
                      color: Color(0xFFD1FAE5),
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('You will be notified when EcoRide expands to this corridor.'),
                        backgroundColor: Color(0xFF059669),
                      ),
                    );
                    controller.dismissUnsupportedNotice();
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF475569)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(
                    l10n.notifyExpansionAction,
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    controller.dismissUnsupportedNotice();
                    onChangeLocation();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(
                    l10n.changeLocationAction,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

