// EcoRide Pickup & Dropoff Confirmation Card (EV-033)
// Enforces explicit rider verification of pickup and dropoff points instead of trusting raw GPS.
// Displays route metrics, EV fare breakdown, and booking initiation.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/location_selection_controller.dart';
import '../models/location_model.dart';

class PickupDropConfirmationCard extends StatelessWidget {
  final LocationSelectionController controller;
  final VoidCallback? onBookRide;

  const PickupDropConfirmationCard({
    super.key,
    required this.controller,
    this.onBookRide,
  });

  @override
  Widget build(BuildContext context) {
    final mode = controller.currentMode;
    final hasBoth = controller.hasBothLocations;

    if (!hasBoth ||
        (mode != LocationSelectionMode.confirmingLocations &&
            mode != LocationSelectionMode.quoteReady)) {
      return const SizedBox.shrink();
    }

    final l10n = AppLocalizations.of(context);
    final pickup = controller.pickupLocation!;
    final dropoff = controller.destinationLocation!;
    final quote = controller.activeQuote;
    final isQuoteReady = mode == LocationSelectionMode.quoteReady && quote != null;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2541),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isQuoteReady ? const Color(0xFF059669) : const Color(0xFF334155),
          width: 1.5,
        ),
        boxShadow: const [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header: Confirmation Notice & Electric Badge
          Row(
            children: [
              Text(
                l10n.confirmLocationsTitle,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF059669),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  l10n.electricTag,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            l10n.confirmLocationsSubtitle,
            style: const TextStyle(
              color: Colors.white60,
              fontSize: 12,
            ),
          ),
          const Divider(color: Color(0xFF334155), height: 20),

          // 1. Pickup Location Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(Icons.my_location, color: Color(0xFF10B981), size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.pickupPoint,
                      style: const TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      pickup.primaryName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      pickup.fullAddress,
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit_location_alt, color: Colors.white54, size: 18),
                tooltip: 'Edit Pickup Pin',
                onPressed: () {
                  controller.startManualPinPlacement(target: LocationTarget.pickup);
                },
              ),
            ],
          ),

          const SizedBox(height: 12),

          // 2. Dropoff Location Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(Icons.location_on, color: Color(0xFFEF4444), size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.dropoffPoint,
                      style: const TextStyle(
                        color: Color(0xFFEF4444),
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      dropoff.primaryName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      dropoff.fullAddress,
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit_location_alt, color: Colors.white54, size: 18),
                tooltip: 'Edit Dropoff Pin',
                onPressed: () {
                  controller.startManualPinPlacement(target: LocationTarget.destination);
                },
              ),
            ],
          ),

          // 3. Authoritative Quote Metrics (if ready)
          if (isQuoteReady) ...[
            const Divider(color: Color(0xFF334155), height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0B132B),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF059669).withOpacity(0.4)),
              ),
              child: Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.totalFare,
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        quote.fare.formattedInr,
                        style: const TextStyle(
                          color: Color(0xFF10B981),
                          fontWeight: FontWeight.bold,
                          fontSize: 20,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        l10n.estimatedDistance((quote.distanceMeters / 1000.0).toStringAsFixed(1)),
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l10n.estimatedDuration(quote.etaMinutes.toString()),
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // 4. Primary Confirmation or Booking Button
          SizedBox(
            width: double.infinity,
            child: controller.isLoading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: CircularProgressIndicator(color: Color(0xFF059669)),
                    ),
                  )
                : isQuoteReady
                    ? ElevatedButton.icon(
                        onPressed: onBookRide,
                        icon: const Icon(Icons.bolt, color: Colors.white),
                        label: Text(
                          l10n.bookElectricRide,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      )
                    : ElevatedButton(
                        onPressed: controller.confirmLocationsAndCalculateQuote,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          l10n.confirmAndProceed,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

