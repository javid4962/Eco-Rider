// EcoRide Manual Pin Overlay Widget (EV-033)
// Provides an interactive center map pin, fine-tuning nudge controls,
// reverse-geocoded address card, and explicit confirmation action.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/location_selection_controller.dart';
import '../models/location_model.dart';

class ManualPinOverlay extends StatelessWidget {
  final LocationSelectionController controller;

  const ManualPinOverlay({
    super.key,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    if (controller.currentMode != LocationSelectionMode.manualPinPlacement) {
      return const SizedBox.shrink();
    }

    final l10n = AppLocalizations.of(context);
    final isPickup = controller.activePinTarget == LocationTarget.pickup;
    final pinColor = isPickup ? const Color(0xFF059669) : const Color(0xFFEF4444);

    return Stack(
      children: [
        // 1. Center Map Pin with target reticle
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0B132B).withOpacity(0.85),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: pinColor, width: 1.5),
                ),
                child: Text(
                  isPickup ? l10n.pickupLocation : l10n.dropoffLocation,
                  style: TextStyle(
                    color: pinColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Icon(
                Icons.location_pin,
                size: 48,
                color: pinColor,
              ),
              Container(
                width: 12,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.black45,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Offset pin so tip points exactly at center
              const SizedBox(height: 24),
            ],
          ),
        ),

        // 2. Fine Adjustment Nudge Controls (N/S/E/W)
        Positioned(
          right: 16,
          top: 120,
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1C2541),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Column(
              children: [
                IconButton(
                  tooltip: 'Nudge North',
                  icon: const Icon(Icons.arrow_upward, color: Colors.white70, size: 20),
                  onPressed: () {
                    controller.updatePinCoordinates(
                      controller.pinLatitude + 0.001,
                      controller.pinLongitude,
                    );
                  },
                ),
                Row(
                  children: [
                    IconButton(
                      tooltip: 'Nudge West',
                      icon: const Icon(Icons.arrow_back, color: Colors.white70, size: 20),
                      onPressed: () {
                        controller.updatePinCoordinates(
                          controller.pinLatitude,
                          controller.pinLongitude - 0.001,
                        );
                      },
                    ),
                    IconButton(
                      tooltip: 'Nudge East',
                      icon: const Icon(Icons.arrow_forward, color: Colors.white70, size: 20),
                      onPressed: () {
                        controller.updatePinCoordinates(
                          controller.pinLatitude,
                          controller.pinLongitude + 0.001,
                        );
                      },
                    ),
                  ],
                ),
                IconButton(
                  tooltip: 'Nudge South',
                  icon: const Icon(Icons.arrow_downward, color: Colors.white70, size: 20),
                  onPressed: () {
                    controller.updatePinCoordinates(
                      controller.pinLatitude - 0.001,
                      controller.pinLongitude,
                    );
                  },
                ),
              ],
            ),
          ),
        ),

        // 3. Floating Bottom Address & Confirmation Card
        Positioned(
          left: 16,
          right: 16,
          bottom: 24,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1C2541),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: pinColor.withOpacity(0.6), width: 1.5),
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: pinColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isPickup ? l10n.confirmPickupPin : l10n.confirmDestinationPin,
                        style: TextStyle(
                          color: pinColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF334155),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        l10n.manualPinBadge,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  controller.pinLandmark ?? (isPickup ? l10n.pickupLocation : l10n.dropoffLocation),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  controller.pinAddress,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: controller.cancelManualPinPlacement,
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFF475569)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'Cancel',
                          style: TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: controller.confirmPinLocation,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: pinColor,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: Text(
                          isPickup ? l10n.confirmPickupPin : l10n.confirmDestinationPin,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

