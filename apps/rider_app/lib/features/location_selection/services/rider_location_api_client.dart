// EcoRide Rider Location & Maps API Client (EV-033)
// Abstraction and concrete implementations for address search, reverse geocoding,
// zone eligibility checks, authoritative quotes, and saved places.

import 'dart:async';
import 'dart:convert';
import '../../../core/api/api_contracts.dart';
import '../models/location_model.dart';

/// Abstract API Client interface for location operations
abstract class RiderLocationApiClient {
  /// Fetches address suggestions based on query string
  Future<List<AddressSuggestionDto>> getAddressSuggestions(
    String query, {
    String? city,
  });

  /// Reverse geocodes coordinates to a human-readable street address & landmark
  Future<ReverseGeocodeDto> reverseGeocode(
    double latitude,
    double longitude,
  );

  /// Authoritatively validates location against PostGIS pilot zone boundaries
  Future<VerifyLocationResultDto> verifyLocation({
    required double latitude,
    required double longitude,
    required String city,
    required String serviceCategory,
  });

  /// Calculates authoritative quote with PostGIS geofence checks and integer paise
  Future<QuoteResponse> calculateAuthoritativeQuote(QuoteRequest request);

  /// Retrieves saved locations for a rider
  Future<List<SavedPlaceItem>> getSavedPlaces(String userId);
}

/// Standalone Mock API Client with verified Andhra Pradesh pilot landmarks
/// Used in unit tests, widget tests, and offline resilience simulations
class MockRiderLocationApiClient implements RiderLocationApiClient {
  bool simulateSlowNetwork;
  Duration networkDelay;
  bool shouldFailQuote;
  String? mockRejectionReason;

  MockRiderLocationApiClient({
    this.simulateSlowNetwork = false,
    this.networkDelay = const Duration(milliseconds: 50),
    this.shouldFailQuote = false,
    this.mockRejectionReason,
  });

  // Curated Andhra Pradesh Landmarks
  static const List<AddressSuggestionDto> mockSuggestions = [
    AddressSuggestionDto(
      id: 'ap-vzg-rk-beach',
      placeId: 'place-vzg-rk-beach',
      primaryText: 'RK Beach Road',
      secondaryText: 'Pandurangapuram, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'Ramakrishna Beach Road, Pandurangapuram, Visakhapatnam, Andhra Pradesh 530003',
      city: 'Visakhapatnam',
      district: 'Visakhapatnam',
      latitude: 17.7126,
      longitude: 83.3174,
    ),
    AddressSuggestionDto(
      id: 'ap-vzg-mvp-colony',
      placeId: 'place-vzg-mvp-colony',
      primaryText: 'MVP Colony Sector 1',
      secondaryText: 'MVP Colony, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'Sector 1, MVP Colony, Visakhapatnam, Andhra Pradesh 530017',
      city: 'Visakhapatnam',
      district: 'Visakhapatnam',
      latitude: 17.7412,
      longitude: 83.3325,
    ),
    AddressSuggestionDto(
      id: 'ap-vzg-rtc-complex',
      placeId: 'place-vzg-rtc-complex',
      primaryText: 'Dwaraka Bus Station (RTC Complex)',
      secondaryText: 'Dwaraka Nagar, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'RTC Complex, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016',
      city: 'Visakhapatnam',
      district: 'Visakhapatnam',
      latitude: 17.7231,
      longitude: 83.3013,
    ),
    AddressSuggestionDto(
      id: 'ap-vzg-rushikonda',
      placeId: 'place-vzg-rushikonda',
      primaryText: 'Rushikonda IT SEZ',
      secondaryText: 'Rushikonda, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'Hill No 2, IT Park, Rushikonda, Visakhapatnam, Andhra Pradesh 530045',
      city: 'Visakhapatnam',
      district: 'Visakhapatnam',
      latitude: 17.7819,
      longitude: 83.3776,
    ),
    AddressSuggestionDto(
      id: 'ap-vzg-gajuwaka',
      placeId: 'place-vzg-gajuwaka',
      primaryText: 'Gajuwaka Junction',
      secondaryText: 'Gajuwaka, Visakhapatnam, Andhra Pradesh',
      fullAddress: 'Main High School Road, Gajuwaka, Visakhapatnam, Andhra Pradesh 530026',
      city: 'Visakhapatnam',
      district: 'Visakhapatnam',
      latitude: 17.6908,
      longitude: 83.2104,
    ),
    // Out-of-zone location in Vijayawada (Not in Release A pilot)
    AddressSuggestionDto(
      id: 'ap-vja-benz-circle',
      placeId: 'place-vja-benz-circle',
      primaryText: 'Benz Circle',
      secondaryText: 'MG Road, Vijayawada, Andhra Pradesh',
      fullAddress: 'Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
      city: 'Vijayawada',
      district: 'Krishna',
      latitude: 16.4975,
      longitude: 80.6558,
    ),
    // Out-of-zone location outside Andhra Pradesh (Hyderabad)
    AddressSuggestionDto(
      id: 'ap-out-hyderabad',
      placeId: 'place-out-hyderabad',
      primaryText: 'Hitec City Metro',
      secondaryText: 'Madhapur, Hyderabad, Telangana',
      fullAddress: 'Hitec City Metro Station, Hyderabad, Telangana 500081',
      city: 'Hyderabad',
      district: 'Hyderabad',
      latitude: 17.4474,
      longitude: 78.3762,
    ),
  ];

  static const List<SavedPlaceItem> defaultSavedPlaces = [
    SavedPlaceItem(
      id: 'saved-home-001',
      label: 'Home',
      addressLine: 'Plot 42, Beach Road, MVP Colony',
      landmark: 'Near Tenneti Park',
      latitude: 17.7412,
      longitude: 83.3325,
      addressType: 'HOME',
    ),
    SavedPlaceItem(
      id: 'saved-work-002',
      label: 'Work',
      addressLine: 'Block C, IT SEZ Hill No 2',
      landmark: 'Rushikonda IT Park',
      latitude: 17.7819,
      longitude: 83.3776,
      addressType: 'WORK',
    ),
  ];

  @override
  Future<List<AddressSuggestionDto>> getAddressSuggestions(
    String query, {
    String? city,
  }) async {
    if (simulateSlowNetwork) {
      await Future.delayed(networkDelay);
    }

    final trimmed = query.trim().toLowerCase();
    if (trimmed.isEmpty) {
      return mockSuggestions.take(4).toList();
    }

    return mockSuggestions.where((s) {
      final matchesQuery = s.primaryText.toLowerCase().contains(trimmed) ||
          s.secondaryText.toLowerCase().contains(trimmed) ||
          s.fullAddress.toLowerCase().contains(trimmed);
      if (city != null && city.isNotEmpty) {
        return matchesQuery && s.city.toLowerCase() == city.toLowerCase();
      }
      return matchesQuery;
    }).toList();
  }

  @override
  Future<ReverseGeocodeDto> reverseGeocode(
    double latitude,
    double longitude,
  ) async {
    if (simulateSlowNetwork) {
      await Future.delayed(networkDelay);
    }

    // Check if coordinates match known landmarks within tolerance
    for (final s in mockSuggestions) {
      final dLat = (s.latitude - latitude).abs();
      final dLng = (s.longitude - longitude).abs();
      if (dLat < 0.01 && dLng < 0.01) {
        return ReverseGeocodeDto(
          fullAddress: s.fullAddress,
          primaryName: s.primaryText,
          city: s.city,
          district: s.district,
          state: 'Andhra Pradesh',
          latitude: latitude,
          longitude: longitude,
          isWithinAndhraPradesh: s.city.toLowerCase() != 'hyderabad',
        );
      }
    }

    // Check Andhra Pradesh territorial bounding box [12.5, 19.9]°N, [76.5, 84.8]°E
    final isWithinAp = latitude >= 12.5 &&
        latitude <= 19.9 &&
        longitude >= 76.5 &&
        longitude <= 84.8;

    return ReverseGeocodeDto(
      fullAddress: isWithinAp
          ? 'Pin at ${latitude.toStringAsFixed(4)}°N, ${longitude.toStringAsFixed(4)}°E, Visakhapatnam, Andhra Pradesh'
          : 'Pin at ${latitude.toStringAsFixed(4)}°N, ${longitude.toStringAsFixed(4)}°E, Outside Andhra Pradesh',
      primaryName: isWithinAp ? 'Custom Map Pin' : 'Out of Territory Point',
      city: isWithinAp ? 'Visakhapatnam' : 'Outside AP',
      state: isWithinAp ? 'Andhra Pradesh' : 'Other',
      latitude: latitude,
      longitude: longitude,
      isWithinAndhraPradesh: isWithinAp,
    );
  }

  @override
  Future<VerifyLocationResultDto> verifyLocation({
    required double latitude,
    required double longitude,
    required String city,
    required String serviceCategory,
  }) async {
    if (simulateSlowNetwork) {
      await Future.delayed(networkDelay);
    }

    if (mockRejectionReason != null) {
      return VerifyLocationResultDto(
        isAuthorized: false,
        city: city,
        serviceCategory: serviceCategory,
        isInsideGeofence: false,
        isPermitValid: false,
        isCategoryEnabled: false,
        operationalStatus: 'DISABLED',
        rejectionReason: mockRejectionReason,
        evaluatedAt: DateTime.now().toIso8601String(),
      );
    }

    // Hard Pilot Scope: Visakhapatnam Urban District Pilot Corridor
    final isVisakhapatnam = city.trim().toLowerCase() == 'visakhapatnam';
    final isInsideVizagBounds = latitude >= 17.55 &&
        latitude <= 17.90 &&
        longitude >= 83.10 &&
        longitude <= 83.45;

    if (!isVisakhapatnam || !isInsideVizagBounds) {
      return VerifyLocationResultDto(
        isAuthorized: false,
        zoneId: null,
        zoneCode: null,
        zoneName: null,
        city: city,
        serviceCategory: serviceCategory,
        isInsideGeofence: false,
        isPermitValid: false,
        isCategoryEnabled: false,
        operationalStatus: 'PILOT_RESTRICTED',
        rejectionReason: isVisakhapatnam
            ? "Location is outside approved Visakhapatnam EV pilot zone geofence (AP-RTO-VZG-EV-ZONE-01)."
            : "City '$city' is not yet operational. EcoRide currently operates exclusively in Visakhapatnam.",
        evaluatedAt: DateTime.now().toIso8601String(),
      );
    }

    return VerifyLocationResultDto(
      isAuthorized: true,
      zoneId: '90111111-1111-4000-8000-000000000001',
      zoneCode: 'AP-RTO-VZG-EV-ZONE-01',
      zoneName: 'Visakhapatnam Central EV Pilot Corridor',
      city: 'visakhapatnam',
      serviceCategory: serviceCategory,
      isInsideGeofence: true,
      isPermitValid: true,
      isCategoryEnabled: true,
      operationalStatus: 'ACTIVE',
      evaluatedAt: DateTime.now().toIso8601String(),
    );
  }

  @override
  Future<QuoteResponse> calculateAuthoritativeQuote(QuoteRequest request) async {
    if (simulateSlowNetwork) {
      await Future.delayed(networkDelay);
    }

    if (shouldFailQuote) {
      throw const ApiErrorPayload(
        code: ApiErrorCode.zoneRestricted,
        rawCode: 'ZONE_RESTRICTED',
        message: 'Location is not authorized in service zones for Visakhapatnam.',
      );
    }

    final verification = await verifyLocation(
      latitude: request.pickupLatitude,
      longitude: request.pickupLongitude,
      city: request.city,
      serviceCategory: request.serviceCategory,
    );

    if (!verification.isAuthorized) {
      throw ApiErrorPayload(
        code: ApiErrorCode.zoneRestricted,
        rawCode: 'ZONE_RESTRICTED',
        message: verification.rejectionReason ??
            'Selected location is outside authorized service boundaries.',
      );
    }

    // Spherical distance estimation (Haversine)
    final dLat = (request.dropoffLatitude - request.pickupLatitude) * 111000;
    final dLng = (request.dropoffLongitude - request.pickupLongitude) * 105000;
    final distanceMeters = (dLat * dLat + dLng * dLng > 0)
        ? (500 + (dLat.abs() + dLng.abs())).round()
        : 3500;

    final distanceKm = distanceMeters / 1000.0;
    // Base 2500 paise (₹25) + 800 paise/km
    final farePaise = 2500 + (distanceKm * 800).round();
    final etaMinutes = (distanceKm * 2.5).clamp(4.0, 45.0).round();

    return QuoteResponse(
      quoteId: 'quote-mock-${DateTime.now().millisecondsSinceEpoch}',
      city: request.city.toLowerCase(),
      serviceCategory: request.serviceCategory,
      distanceMeters: distanceMeters,
      fare: MoneyAmount(amountPaise: farePaise),
      etaMinutes: etaMinutes,
      propulsion: 'BATTERY_ELECTRIC',
      expiresAt: DateTime.now().add(const Duration(minutes: 10)),
    );
  }

  @override
  Future<List<SavedPlaceItem>> getSavedPlaces(String userId) async {
    if (simulateSlowNetwork) {
      await Future.delayed(networkDelay);
    }
    return defaultSavedPlaces;
  }
}

