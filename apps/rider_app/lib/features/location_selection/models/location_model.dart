// EcoRide Rider Location Models (EV-033)
// Defines location targets, selection modes, verified points, and saved places.

import 'package:flutter/foundation.dart';

/// Target point being selected or edited
enum LocationTarget {
  pickup,
  destination,
}

/// Active interaction mode of the map home screen
enum LocationSelectionMode {
  /// Default home map state showing search entry and saved places
  idle,

  /// Interactive manual pin adjustment on the map
  manualPinPlacement,

  /// Explicit verification card showing confirmed pickup and dropoff points
  confirmingLocations,

  /// Authoritative quote received with integer paise fare and EV details
  quoteReady,

  /// Out of service boundary notice explaining why booking cannot proceed
  unsupportedLocation,
}

/// Represents a verified pickup or destination location
@immutable
class RiderLocationPoint {
  final double latitude;
  final double longitude;
  final String fullAddress;
  final String primaryName;
  final String city;
  final String? district;
  final bool isManuallySelected;
  final bool isConfirmed;

  const RiderLocationPoint({
    required this.latitude,
    required this.longitude,
    required this.fullAddress,
    required this.primaryName,
    required this.city,
    this.district,
    this.isManuallySelected = false,
    this.isConfirmed = false,
  });

  RiderLocationPoint copyWith({
    double? latitude,
    double? longitude,
    String? fullAddress,
    String? primaryName,
    String? city,
    String? district,
    bool? isManuallySelected,
    bool? isConfirmed,
  }) {
    return RiderLocationPoint(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      fullAddress: fullAddress ?? this.fullAddress,
      primaryName: primaryName ?? this.primaryName,
      city: city ?? this.city,
      district: district ?? this.district,
      isManuallySelected: isManuallySelected ?? this.isManuallySelected,
      isConfirmed: isConfirmed ?? this.isConfirmed,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RiderLocationPoint &&
          runtimeType == other.runtimeType &&
          latitude == other.latitude &&
          longitude == other.longitude &&
          fullAddress == other.fullAddress;

  @override
  int get hashCode => latitude.hashCode ^ longitude.hashCode ^ fullAddress.hashCode;

  @override
  String toString() =>
      'RiderLocationPoint(name: $primaryName, lat: $latitude, lng: $longitude, confirmed: $isConfirmed)';
}

/// Represents a rider saved location (e.g. Home, Work, Favorite)
@immutable
class SavedPlaceItem {
  final String id;
  final String label;
  final String addressLine;
  final String? landmark;
  final double latitude;
  final double longitude;
  final String addressType;

  const SavedPlaceItem({
    required this.id,
    required this.label,
    required this.addressLine,
    this.landmark,
    required this.latitude,
    required this.longitude,
    this.addressType = 'BOTH',
  });

  bool get isHome => label.toLowerCase() == 'home';
  bool get isWork => label.toLowerCase() == 'work';

  RiderLocationPoint toLocationPoint({
    required String city,
    bool isManuallySelected = true,
  }) {
    return RiderLocationPoint(
      latitude: latitude,
      longitude: longitude,
      fullAddress: landmark != null ? '$addressLine, Near $landmark' : addressLine,
      primaryName: label,
      city: city,
      isManuallySelected: isManuallySelected,
      isConfirmed: false,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SavedPlaceItem && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

