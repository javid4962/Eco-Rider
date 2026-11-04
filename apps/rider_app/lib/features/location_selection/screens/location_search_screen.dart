// EcoRide Location Search Screen (EV-033)
// Full-screen searchable location picker with autocompletion suggestions,
// saved places shortcuts, and "Set Pin on Map" option.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/location_selection_controller.dart';
import '../models/location_model.dart';
import '../widgets/saved_places_chips.dart';

class LocationSearchScreen extends StatefulWidget {
  final LocationSelectionController controller;
  final LocationTarget target;

  const LocationSearchScreen({
    super.key,
    required this.controller,
    required this.target,
  });

  @override
  State<LocationSearchScreen> createState() => _LocationSearchScreenState();
}

class _LocationSearchScreenState extends State<LocationSearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
      widget.controller.searchSuggestions('');
    });
  }

  void _onSearchChanged() {
    setState(() {});
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isPickup = widget.target == LocationTarget.pickup;

    return Scaffold(
      backgroundColor: const Color(0xFF0B132B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B132B),
        elevation: 0,
        title: Text(
          isPickup ? l10n.searchPickup : l10n.searchDestination,
          style: const TextStyle(color: Colors.white, fontSize: 18),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // 1. Search Text Field
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF1C2541),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isPickup ? const Color(0xFF059669) : const Color(0xFFEF4444),
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    isPickup ? Icons.my_location : Icons.location_on,
                    color: isPickup ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      focusNode: _focusNode,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: l10n.searchPlaceholder,
                        hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                        border: InputBorder.none,
                      ),
                      onChanged: (val) {
                        widget.controller.searchSuggestions(val);
                      },
                    ),
                  ),
                  if (_searchController.text.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.clear, color: Colors.white54, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        widget.controller.searchSuggestions('');
                      },
                    ),
                ],
              ),
            ),

            // 2. "Set Pin on Map" Action Tile
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: ListTile(
                tileColor: const Color(0xFF1C2541),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                leading: const Icon(Icons.pin_drop, color: Color(0xFF10B981)),
                title: Text(
                  l10n.selectOnMap,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                subtitle: Text(
                  l10n.adjustPinInstructions,
                  style: const TextStyle(color: Colors.white54, fontSize: 11),
                ),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                onTap: () {
                  Navigator.of(context).pop();
                  widget.controller.startManualPinPlacement(target: widget.target);
                },
              ),
            ),

            // 3. Saved Places Chips
            const SizedBox(height: 6),
            SavedPlacesChips(
              controller: widget.controller,
              target: widget.target,
            ),
            const SizedBox(height: 8),

            // 4. Autocompletion Suggestions Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Text(
                    _searchController.text.isEmpty
                        ? l10n.recentSearches
                        : l10n.suggestedPlaces,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  if (widget.controller.isLoading)
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF059669),
                      ),
                    ),
                ],
              ),
            ),

            // 5. Suggestions List
            Expanded(
              child: ListenableBuilder(
                listenable: widget.controller,
                builder: (context, _) {
                  final suggestions = widget.controller.suggestions;

                  if (suggestions.isEmpty && !widget.controller.isLoading) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search_off, color: Colors.white38, size: 48),
                            const SizedBox(height: 12),
                            Text(
                              l10n.noPlacesFound,
                              style: const TextStyle(color: Colors.white70, fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: suggestions.length,
                    separatorBuilder: (_, __) => const Divider(
                      color: Color(0xFF1C2541),
                      height: 1,
                    ),
                    itemBuilder: (context, index) {
                      final item = suggestions[index];
                      return ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1C2541),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.location_on_outlined,
                            color: Color(0xFF10B981),
                            size: 20,
                          ),
                        ),
                        title: Text(
                          item.primaryText,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        subtitle: Text(
                          item.secondaryText,
                          style: const TextStyle(color: Colors.white60, fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        onTap: () {
                          widget.controller.selectSuggestion(item, widget.target);
                          Navigator.of(context).pop();
                        },
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
