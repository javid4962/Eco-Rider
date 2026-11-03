// EcoRide Rider Map Home Screen (EV-033)
// Connects rider map home to searchable locations, saved places, manual pickup pin,
// permission-denied fallback, explicit confirmation, and out-of-zone restriction notices.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/localization/language_switcher.dart';
import '../../../core/localization/locale_controller.dart';
import '../controllers/location_selection_controller.dart';
import '../models/location_model.dart';
import '../widgets/manual_pin_overlay.dart';
import '../widgets/permission_denied_banner.dart';
import '../widgets/pickup_drop_confirmation_card.dart';
import '../widgets/saved_places_chips.dart';
import '../widgets/service_availability_pricing_card.dart';
import '../widgets/unsupported_zone_sheet.dart';
import 'location_search_screen.dart';

class RiderMapHomeScreen extends StatefulWidget {
  final LocaleController? localeController;
  final LocationSelectionController controller;

  const RiderMapHomeScreen({
    super.key,
    this.localeController,
    required this.controller,
  });

  @override
  State<RiderMapHomeScreen> createState() => _RiderMapHomeScreenState();
}

class _RiderMapHomeScreenState extends State<RiderMapHomeScreen> {
  @override
  void initState() {
    super.initState();
    widget.controller.initialize();
  }

  void _openSearch(LocationTarget target) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => LocationSearchScreen(
          controller: widget.controller,
          target: target,
        ),
      ),
    );
  }

  void _onBookRide() {
    final quote = widget.controller.activeQuote;
    if (quote == null) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1C2541),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: const [
            Icon(Icons.check_circle, color: Color(0xFF059669), size: 28),
            SizedBox(width: 8),
            Text('EV Ride Booked!', style: TextStyle(color: Colors.white, fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quote ID: ${quote.quoteId}',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 6),
            Text(
              'Estimated Fare: ${quote.fare.formattedInr}',
              style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              'Propulsion: ${quote.propulsion}',
              style: const TextStyle(color: Colors.white60, fontSize: 12),
            ),
            const SizedBox(height: 8),
            const Text(
              'Finding nearby electric captain in Visakhapatnam EV corridor...',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              widget.controller.resetAll();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
            ),
            child: const Text('OK', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final mode = widget.controller.currentMode;
        final isManualPinMode = mode == LocationSelectionMode.manualPinPlacement;

        return Scaffold(
          backgroundColor: const Color(0xFF0B132B),
          appBar: isManualPinMode
              ? null
              : AppBar(
                  backgroundColor: const Color(0xFF0B132B),
                  elevation: 0,
                  title: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.bolt, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            l10n.appName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            l10n.pilotCorridor,
                            style: const TextStyle(color: Colors.white60, fontSize: 11),
                          ),
                        ],
                      ),
                    ],
                  ),
                  actions: [
                    if (widget.localeController != null)
                      LanguageSwitcherButton(controller: widget.localeController!),
                    if (widget.controller.hasBothLocations)
                      IconButton(
                        tooltip: 'Reset',
                        icon: const Icon(Icons.refresh, color: Colors.white70),
                        onPressed: widget.controller.resetAll,
                      ),
                  ],
                ),
          body: Stack(
            children: [
              // 1. Simulated Interactive Map Canvas
              _buildSimulatedMap(context),

              // 2. Normal View (Top Search, Saved Places, Banners)
              if (!isManualPinMode)
                SafeArea(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // GPS Permission Denied Banner (if triggered)
                        PermissionDeniedBanner(
                          controller: widget.controller,
                          onSearchManually: () => _openSearch(LocationTarget.pickup),
                        ),

                        // Search Card (Where to / Pickup & Drop summary)
                        _buildSearchCard(context, l10n),

                        // Saved Places Chips & Service Availability on Map Home (EV-037)
                        if (!widget.controller.hasBothLocations) ...[
                          const SizedBox(height: 6),
                          SavedPlacesChips(
                            controller: widget.controller,
                            target: LocationTarget.destination,
                          ),
                          const SizedBox(height: 6),
                          ServiceAvailabilityPricingCard(
                            controller: widget.controller,
                            onSearchDestination: () => _openSearch(LocationTarget.destination),
                          ),
                        ],

                        // Unsupported Zone Sheet (if out of bounds)
                        UnsupportedZoneSheet(
                          controller: widget.controller,
                          onChangeLocation: () => _openSearch(LocationTarget.pickup),
                        ),

                        // Confirmation & Authoritative Fare Card
                        PickupDropConfirmationCard(
                          controller: widget.controller,
                          onBookRide: _onBookRide,
                        ),
                      ],
                    ),
                  ),
                ),

              // 3. Manual Pin Overlay (When in Pin Mode)
              if (isManualPinMode)
                ManualPinOverlay(controller: widget.controller),
            ],
          ),
        );
      },
    );
  }

  /// Builds the simulated EV corridor map background
  Widget _buildSimulatedMap(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: const Color(0xFF0D1B2A),
      child: CustomPaint(
        painter: _SimulatedMapPainter(
          pickupLocation: widget.controller.pickupLocation,
          destinationLocation: widget.controller.destinationLocation,
        ),
      ),
    );
  }

  /// Floating Location Search Card
  Widget _buildSearchCard(BuildContext context, AppLocalizations l10n) {
    final pickup = widget.controller.pickupLocation;
    final dropoff = widget.controller.destinationLocation;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1C2541),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF334155), width: 1.2),
        boxShadow: const [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 8,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
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
              const Spacer(),
              TextButton.icon(
                onPressed: () {
                  widget.controller.startManualPinPlacement(
                    target: pickup == null ? LocationTarget.pickup : LocationTarget.destination,
                  );
                },
                icon: const Icon(Icons.pin_drop, size: 14, color: Color(0xFF10B981)),
                label: Text(
                  l10n.selectOnMap,
                  style: const TextStyle(color: Color(0xFF10B981), fontSize: 12),
                ),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Pickup Input Tile
          InkWell(
            onTap: () => _openSearch(LocationTarget.pickup),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF0B132B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: pickup != null ? const Color(0xFF059669) : const Color(0xFF334155),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.my_location, color: Color(0xFF10B981), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.pickupLocation,
                          style: const TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          pickup?.primaryName ?? 'Tap to select pickup point',
                          style: TextStyle(
                            color: pickup != null ? Colors.white : Colors.white54,
                            fontSize: 13,
                            fontWeight: pickup != null ? FontWeight.bold : FontWeight.normal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (pickup != null)
                    IconButton(
                      icon: const Icon(Icons.clear, color: Colors.white54, size: 16),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: widget.controller.clearPickup,
                    )
                  else
                    const Icon(Icons.search, color: Colors.white38, size: 18),
                ],
              ),
            ),
          ),

          const SizedBox(height: 8),

          // Destination Input Tile
          InkWell(
            onTap: () => _openSearch(LocationTarget.destination),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF0B132B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: dropoff != null ? const Color(0xFFEF4444) : const Color(0xFF334155),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on, color: Color(0xFFEF4444), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.dropoffLocation,
                          style: const TextStyle(color: Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          dropoff?.primaryName ?? l10n.whereTo,
                          style: TextStyle(
                            color: dropoff != null ? Colors.white : Colors.white54,
                            fontSize: 13,
                            fontWeight: dropoff != null ? FontWeight.bold : FontWeight.normal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  if (dropoff != null)
                    IconButton(
                      icon: const Icon(Icons.clear, color: Colors.white54, size: 16),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: widget.controller.clearDestination,
                    )
                  else
                    const Icon(Icons.search, color: Colors.white38, size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Simulated Map Canvas Painter displaying roads, EV charging hubs, and geofence boundary
class _SimulatedMapPainter extends CustomPainter {
  final RiderLocationPoint? pickupLocation;
  final RiderLocationPoint? destinationLocation;

  _SimulatedMapPainter({
    this.pickupLocation,
    this.destinationLocation,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final roadPaint = Paint()
      ..color = const Color(0xFF1E293B)
      ..strokeWidth = 6.0
      ..style = PaintingStyle.stroke;

    final highwayPaint = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = 10.0
      ..style = PaintingStyle.stroke;

    final geofencePaint = Paint()
      ..color = const Color(0xFF059669).withOpacity(0.3)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    // Draw main pilot corridor highway (Beach Road - Dwaraka Nagar - Rushikonda)
    final highwayPath = Path()
      ..moveTo(0, size.height * 0.75)
      ..cubicTo(
        size.width * 0.35,
        size.height * 0.65,
        size.width * 0.65,
        size.height * 0.40,
        size.width,
        size.height * 0.25,
      );
    canvas.drawPath(highwayPath, highwayPaint);

    // Cross roads
    canvas.drawLine(
      Offset(size.width * 0.2, 0),
      Offset(size.width * 0.2, size.height),
      roadPaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.5, 0),
      Offset(size.width * 0.5, size.height),
      roadPaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.8, 0),
      Offset(size.width * 0.8, size.height),
      roadPaint,
    );
    canvas.drawLine(
      Offset(0, size.height * 0.45),
      Offset(size.width, size.height * 0.45),
      roadPaint,
    );

    // Pilot Geofence Zone Boundary
    final geofenceRect = Rect.fromCenter(
      center: Offset(size.width * 0.5, size.height * 0.5),
      width: size.width * 0.85,
      height: size.height * 0.75,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(geofenceRect, const Radius.circular(20)),
      geofencePaint,
    );

    // EV Charging Depot Markers (Visakhapatnam hubs)
    final hubPaint = Paint()..color = const Color(0xFF059669);
    final hubOffsets = [
      Offset(size.width * 0.3, size.height * 0.6),
      Offset(size.width * 0.55, size.height * 0.45),
      Offset(size.width * 0.75, size.height * 0.3),
    ];
    for (final offset in hubOffsets) {
      canvas.drawCircle(offset, 4.0, hubPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _SimulatedMapPainter oldDelegate) {
    return oldDelegate.pickupLocation != pickupLocation ||
        oldDelegate.destinationLocation != destinationLocation;
  }
}
