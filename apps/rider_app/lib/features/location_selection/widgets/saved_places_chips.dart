// EcoRide Saved Places Chips (EV-033)
// Quick selection chips for Home, Work, and Favorites with single-tap assignment.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/location_selection_controller.dart';
import '../models/location_model.dart';

class SavedPlacesChips extends StatelessWidget {
  final LocationSelectionController controller;
  final LocationTarget target;

  const SavedPlacesChips({
    super.key,
    required this.controller,
    this.target = LocationTarget.destination,
  });

  IconData _iconForPlace(SavedPlaceItem place) {
    if (place.isHome) return Icons.home;
    if (place.isWork) return Icons.work;
    return Icons.star;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final places = controller.savedPlaces;

    if (places.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
          child: Text(
            l10n.savedPlaces,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        SizedBox(
          height: 44,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            scrollDirection: Axis.horizontal,
            itemCount: places.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final place = places[index];
              return ActionChip(
                backgroundColor: const Color(0xFF1C2541),
                side: const BorderSide(color: Color(0xFF334155), width: 1),
                avatar: Icon(
                  _iconForPlace(place),
                  size: 16,
                  color: const Color(0xFF10B981),
                ),
                label: Text(
                  place.label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                onPressed: () {
                  controller.selectSavedPlace(place, target);
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

