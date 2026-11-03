// EcoRide Permission Denied Fallback Banner (EV-033)
// Displayed when device location access is denied or unavailable.
// Enables seamless manual search and map pin selection without trapping the user.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/location_selection_controller.dart';
import '../models/location_model.dart';

class PermissionDeniedBanner extends StatelessWidget {
  final LocationSelectionController controller;
  final VoidCallback onSearchManually;

  const PermissionDeniedBanner({
    super.key,
    required this.controller,
    required this.onSearchManually,
  });

  @override
  Widget build(BuildContext context) {
    if (!controller.isGpsPermissionDenied) {
      return const SizedBox.shrink();
    }

    final l10n = AppLocalizations.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF2D1F1D), // Subtle amber-red dark background
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF59E0B), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 6,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.location_off,
                color: Color(0xFFF59E0B),
                size: 24,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.gpsPermissionDeniedTitle,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l10n.gpsPermissionDeniedDesc,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: controller.clearPermissionDenied,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    controller.startManualPinPlacement(target: LocationTarget.pickup);
                  },
                  icon: const Icon(Icons.pin_drop, size: 16, color: Color(0xFF10B981)),
                  label: Text(
                    l10n.pickOnMapAction,
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF10B981)),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onSearchManually,
                  icon: const Icon(Icons.search, size: 16, color: Colors.white),
                  label: Text(
                    l10n.searchManuallyAction,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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

