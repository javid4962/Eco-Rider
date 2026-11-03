// EcoRide Location Selection Controller (EV-033)
// State machine managing map home, autocompletion search, saved places,
// manual pin adjustment, permission-denied fallback, explicit confirmation,
// and unsupported zone restriction explanations.

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../core/api/api_contracts.dart';
import '../models/location_model.dart';
import '../services/rider_location_api_client.dart';

class LocationSelectionController extends ChangeNotifier {
  final RiderLocationApiClient apiClient;
  final String activeCity;
  final String activeServiceCategory;

  LocationSelectionMode _currentMode = LocationSelectionMode.idle;
  RiderLocationPoint? _pickupLocation;
  RiderLocationPoint? _destinationLocation;
  bool _isGpsPermissionDenied = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _unsupportedReason;
  VerifyLocationResultDto? _unsupportedZoneDetails;
  QuoteResponse? _activeQuote;
  List<AddressSuggestionDto> _suggestions = [];
  List<SavedPlaceItem> _savedPlaces = [];

  // Manual pin placement tracking
  LocationTarget _activePinTarget = LocationTarget.pickup;
  double _pinLatitude = 17.7231; // Visakhapatnam Central RTC Complex default
  double _pinLongitude = 83.3013;
  String _pinAddress = 'Dwaraka Bus Station (RTC Complex), Visakhapatnam';
  String? _pinLandmark = 'Near Complex Main Gate';

  static const RiderLocationPoint _fallbackDefaultPickup = RiderLocationPoint(
    latitude: 17.7231,
    longitude: 83.3013,
    fullAddress: 'Dwaraka Bus Station (RTC Complex), Dwaraka Nagar, Visakhapatnam',
    primaryName: 'RTC Complex (Manual Default)',
    city: 'Visakhapatnam',
    isManuallySelected: true,
    isConfirmed: false,
  );

  LocationSelectionController({
    required this.apiClient,
    this.activeCity = 'Visakhapatnam',
    this.activeServiceCategory = 'CITY_COMMUTE_2W',
    RiderLocationPoint? initialPickup,
    RiderLocationPoint? initialDestination,
    bool initialPermissionDenied = false,
  })  : _pickupLocation = initialPickup,
        _destinationLocation = initialDestination,
        _isGpsPermissionDenied = initialPermissionDenied {
    if (initialPermissionDenied && _pickupLocation == null) {
      _pickupLocation = _fallbackDefaultPickup;
    }
    if (_pickupLocation != null && _destinationLocation != null) {
      _currentMode = LocationSelectionMode.confirmingLocations;
    }
  }

  // Getters
  LocationSelectionMode get currentMode => _currentMode;
  RiderLocationPoint? get pickupLocation => _pickupLocation;
  RiderLocationPoint? get destinationLocation => _destinationLocation;
  bool get isGpsPermissionDenied => _isGpsPermissionDenied;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get unsupportedReason => _unsupportedReason;
  VerifyLocationResultDto? get unsupportedZoneDetails => _unsupportedZoneDetails;
  QuoteResponse? get activeQuote => _activeQuote;
  List<AddressSuggestionDto> get suggestions => List.unmodifiable(_suggestions);
  List<SavedPlaceItem> get savedPlaces => List.unmodifiable(_savedPlaces);

  LocationTarget get activePinTarget => _activePinTarget;
  double get pinLatitude => _pinLatitude;
  double get pinLongitude => _pinLongitude;
  String get pinAddress => _pinAddress;
  String? get pinLandmark => _pinLandmark;

  bool get hasBothLocations =>
      _pickupLocation != null && _destinationLocation != null;

  bool get areLocationsConfirmed =>
      _pickupLocation?.isConfirmed == true &&
      _destinationLocation?.isConfirmed == true;

  /// Initializes controller, loads saved places and default suggestions
  Future<void> initialize({String userId = 'user-rider-default'}) async {
    _isLoading = true;
    notifyListeners();

    try {
      _savedPlaces = await apiClient.getSavedPlaces(userId);
      _suggestions = await apiClient.getAddressSuggestions('', city: activeCity);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Could not load saved locations: $e';
      notifyListeners();
    }
  }

  /// Handles GPS permission denied or restricted scenario
  /// Never blocks the user in a loading trap; provides clear notice & fallback
  void handlePermissionDenied() {
    _isGpsPermissionDenied = true;
    _isLoading = false;

    // Set fallback pickup to default Visakhapatnam RTC complex
    _pickupLocation ??= const RiderLocationPoint(
      latitude: 17.7231,
      longitude: 83.3013,
      fullAddress: 'Dwaraka Bus Station (RTC Complex), Dwaraka Nagar, Visakhapatnam',
      primaryName: 'RTC Complex (Manual Default)',
      city: 'Visakhapatnam',
      isManuallySelected: true,
      isConfirmed: false,
    );

    notifyListeners();
  }

  /// Clears GPS permission denied state
  void clearPermissionDenied() {
    _isGpsPermissionDenied = false;
    notifyListeners();
  }

  /// Enters interactive manual pin placement mode on the map
  void startManualPinPlacement({LocationTarget target = LocationTarget.pickup}) {
    _activePinTarget = target;
    _currentMode = LocationSelectionMode.manualPinPlacement;

    final existing = target == LocationTarget.pickup
        ? _pickupLocation
        : _destinationLocation;

    if (existing != null) {
      _pinLatitude = existing.latitude;
      _pinLongitude = existing.longitude;
      _pinAddress = existing.fullAddress;
      _pinLandmark = existing.primaryName;
    } else {
      _pinLatitude = 17.7231;
      _pinLongitude = 83.3013;
      _pinAddress = 'RTC Complex, Dwaraka Nagar, Visakhapatnam';
      _pinLandmark = 'Dwaraka Bus Station';
    }

    notifyListeners();
  }

  /// Updates pin coordinates as user drags or repositions the map
  Future<void> updatePinCoordinates(double lat, double lng) async {
    _pinLatitude = lat;
    _pinLongitude = lng;
    notifyListeners();

    try {
      final res = await apiClient.reverseGeocode(lat, lng);
      _pinAddress = res.fullAddress;
      _pinLandmark = res.primaryName;
      notifyListeners();
    } catch (_) {
      _pinAddress = 'Pin at ${lat.toStringAsFixed(4)}°N, ${lng.toStringAsFixed(4)}°E';
      notifyListeners();
    }
  }

  /// Explicitly confirms manual pin position for pickup or destination
  void confirmPinLocation() {
    final confirmedPoint = RiderLocationPoint(
      latitude: _pinLatitude,
      longitude: _pinLongitude,
      fullAddress: _pinAddress,
      primaryName: _pinLandmark ?? 'Confirmed Pin',
      city: activeCity,
      isManuallySelected: true,
      isConfirmed: true,
    );

    if (_activePinTarget == LocationTarget.pickup) {
      _pickupLocation = confirmedPoint;
    } else {
      _destinationLocation = confirmedPoint;
    }

    if (hasBothLocations) {
      _currentMode = LocationSelectionMode.confirmingLocations;
    } else {
      _currentMode = LocationSelectionMode.idle;
    }

    notifyListeners();
  }

  /// Cancels pin placement mode without modifying existing points
  void cancelManualPinPlacement() {
    if (hasBothLocations) {
      _currentMode = LocationSelectionMode.confirmingLocations;
    } else {
      _currentMode = LocationSelectionMode.idle;
    }
    notifyListeners();
  }

  /// Performs autocompletion search
  Future<void> searchSuggestions(String query) async {
    _isLoading = true;
    notifyListeners();

    try {
      _suggestions = await apiClient.getAddressSuggestions(query, city: activeCity);
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Search error: $e';
      notifyListeners();
    }
  }

  /// Selects an address suggestion for pickup or destination
  void selectSuggestion(
    AddressSuggestionDto suggestion,
    LocationTarget target,
  ) {
    final point = RiderLocationPoint(
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      fullAddress: suggestion.fullAddress,
      primaryName: suggestion.primaryText,
      city: suggestion.city,
      district: suggestion.district,
      isManuallySelected: true,
      isConfirmed: false,
    );

    if (target == LocationTarget.pickup) {
      _pickupLocation = point;
    } else {
      _destinationLocation = point;
    }

    if (hasBothLocations) {
      _currentMode = LocationSelectionMode.confirmingLocations;
    } else {
      _currentMode = LocationSelectionMode.idle;
    }

    notifyListeners();
  }

  /// Selects a saved place (Home, Work, etc.) for pickup or destination
  void selectSavedPlace(
    SavedPlaceItem place,
    LocationTarget target,
  ) {
    final point = place.toLocationPoint(
      city: activeCity,
      isManuallySelected: true,
    );

    if (target == LocationTarget.pickup) {
      _pickupLocation = point;
    } else {
      _destinationLocation = point;
    }

    if (hasBothLocations) {
      _currentMode = LocationSelectionMode.confirmingLocations;
    } else {
      _currentMode = LocationSelectionMode.idle;
    }

    notifyListeners();
  }

  /// Clears pickup point
  void clearPickup() {
    _pickupLocation = null;
    _activeQuote = null;
    _currentMode = LocationSelectionMode.idle;
    notifyListeners();
  }

  /// Clears destination point
  void clearDestination() {
    _destinationLocation = null;
    _activeQuote = null;
    _currentMode = LocationSelectionMode.idle;
    notifyListeners();
  }

  /// Explicit verification and authoritative quote calculation
  /// Does NOT silently trust GPS; enforces server-side PostGIS geofence checks
  Future<void> confirmLocationsAndCalculateQuote() async {
    if (!hasBothLocations) {
      _errorMessage = 'Both pickup and destination locations are required.';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    _unsupportedReason = null;
    _unsupportedZoneDetails = null;
    notifyListeners();

    try {
      // 1. Authoritative geofence check on pickup
      final verification = await apiClient.verifyLocation(
        latitude: _pickupLocation!.latitude,
        longitude: _pickupLocation!.longitude,
        city: activeCity,
        serviceCategory: activeServiceCategory,
      );

      if (!verification.isAuthorized) {
        _isLoading = false;
        _unsupportedReason = verification.rejectionReason ??
            'Selected pickup location is outside authorized service boundaries.';
        _unsupportedZoneDetails = verification;
        _currentMode = LocationSelectionMode.unsupportedLocation;
        notifyListeners();
        return;
      }

      // 2. Authoritative geofence check on destination
      final destVerification = await apiClient.verifyLocation(
        latitude: _destinationLocation!.latitude,
        longitude: _destinationLocation!.longitude,
        city: activeCity,
        serviceCategory: activeServiceCategory,
      );

      if (!destVerification.isAuthorized) {
        _isLoading = false;
        _unsupportedReason = destVerification.rejectionReason ??
            'Selected destination is outside authorized service boundaries.';
        _unsupportedZoneDetails = destVerification;
        _currentMode = LocationSelectionMode.unsupportedLocation;
        notifyListeners();
        return;
      }

      // 3. Mark both points as explicitly confirmed
      _pickupLocation = _pickupLocation!.copyWith(isConfirmed: true);
      _destinationLocation = _destinationLocation!.copyWith(isConfirmed: true);

      // 4. Request authoritative quote
      final quoteReq = QuoteRequest(
        city: activeCity,
        serviceCategory: activeServiceCategory,
        pickupLatitude: _pickupLocation!.latitude,
        pickupLongitude: _pickupLocation!.longitude,
        dropoffLatitude: _destinationLocation!.latitude,
        dropoffLongitude: _destinationLocation!.longitude,
      );

      _activeQuote = await apiClient.calculateAuthoritativeQuote(quoteReq);
      _isLoading = false;
      _currentMode = LocationSelectionMode.quoteReady;
      notifyListeners();
    } on ApiErrorPayload catch (e) {
      _isLoading = false;
      if (e.code == ApiErrorCode.zoneRestricted) {
        _unsupportedReason = e.message;
        _currentMode = LocationSelectionMode.unsupportedLocation;
      } else {
        _errorMessage = e.message;
      }
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Failed to calculate EV fare quote: $e';
      notifyListeners();
    }
  }

  /// Dismisses unsupported location modal and allows user to pick another location
  void dismissUnsupportedNotice() {
    _unsupportedReason = null;
    _unsupportedZoneDetails = null;
    _currentMode = hasBothLocations
        ? LocationSelectionMode.confirmingLocations
        : LocationSelectionMode.idle;
    notifyListeners();
  }

  /// Resets all selections back to initial state
  void resetAll() {
    _currentMode = LocationSelectionMode.idle;
    _pickupLocation = null;
    _destinationLocation = null;
    _activeQuote = null;
    _errorMessage = null;
    _unsupportedReason = null;
    _unsupportedZoneDetails = null;
    notifyListeners();
  }
}
