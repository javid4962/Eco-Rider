// GENERATED CODE - DO NOT MODIFY BY HAND
// Generated from EcoRide OpenAPI & API Contracts specification
// Original EV-Only Mobility Platform for Andhra Pradesh

/// Standard EcoRide API Error Codes
enum ApiErrorCode {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  zoneRestricted,
  propulsionNonElectric,
  rateLimited,
  internalServerError,
  unknown;

  static ApiErrorCode fromString(String code) {
    switch (code) {
      case 'BAD_REQUEST':
        return ApiErrorCode.badRequest;
      case 'UNAUTHORIZED':
        return ApiErrorCode.unauthorized;
      case 'FORBIDDEN':
        return ApiErrorCode.forbidden;
      case 'NOT_FOUND':
        return ApiErrorCode.notFound;
      case 'CONFLICT':
        return ApiErrorCode.conflict;
      case 'UNPROCESSABLE_ENTITY':
        return ApiErrorCode.unprocessableEntity;
      case 'ZONE_RESTRICTED':
        return ApiErrorCode.zoneRestricted;
      case 'PROPULSION_NON_ELECTRIC':
        return ApiErrorCode.propulsionNonElectric;
      case 'RATE_LIMITED':
        return ApiErrorCode.rateLimited;
      case 'INTERNAL_SERVER_ERROR':
        return ApiErrorCode.internalServerError;
      default:
        return ApiErrorCode.unknown;
    }
  }

  String toApiCode() {
    switch (this) {
      case ApiErrorCode.badRequest:
        return 'BAD_REQUEST';
      case ApiErrorCode.unauthorized:
        return 'UNAUTHORIZED';
      case ApiErrorCode.forbidden:
        return 'FORBIDDEN';
      case ApiErrorCode.notFound:
        return 'NOT_FOUND';
      case ApiErrorCode.conflict:
        return 'CONFLICT';
      case ApiErrorCode.unprocessableEntity:
        return 'UNPROCESSABLE_ENTITY';
      case ApiErrorCode.zoneRestricted:
        return 'ZONE_RESTRICTED';
      case ApiErrorCode.propulsionNonElectric:
        return 'PROPULSION_NON_ELECTRIC';
      case ApiErrorCode.rateLimited:
        return 'RATE_LIMITED';
      case ApiErrorCode.internalServerError:
        return 'INTERNAL_SERVER_ERROR';
      case ApiErrorCode.unknown:
        return 'UNKNOWN';
    }
  }
}

/// Detailed validation constraint error item
class ApiErrorDetail {
  final String? field;
  final String message;
  final String? constraint;

  const ApiErrorDetail({
    this.field,
    required this.message,
    this.constraint,
  });

  factory ApiErrorDetail.fromJson(Map<String, dynamic> json) {
    return ApiErrorDetail(
      field: json['field'] as String?,
      message: json['message'] as String? ?? '',
      constraint: json['constraint'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    if (field != null) 'field': field,
    'message': message,
    if (constraint != null) 'constraint': constraint,
  };
}

/// Standardized Error Envelope Payload
class ApiErrorPayload {
  final ApiErrorCode code;
  final String rawCode;
  final String message;
  final List<ApiErrorDetail> details;

  const ApiErrorPayload({
    required this.code,
    required this.rawCode,
    required this.message,
    this.details = const [],
  });

  factory ApiErrorPayload.fromJson(Map<String, dynamic> json) {
    final rawCode = json['code'] as String? ?? 'UNKNOWN';
    final rawDetails = json['details'];
    List<ApiErrorDetail> detailsList = [];

    if (rawDetails is List) {
      detailsList = rawDetails.map((item) {
        if (item is Map<String, dynamic>) {
          return ApiErrorDetail.fromJson(item);
        } else {
          return ApiErrorDetail(message: item.toString());
        }
      }).toList();
    }

    return ApiErrorPayload(
      code: ApiErrorCode.fromString(rawCode),
      rawCode: rawCode,
      message: json['message'] as String? ?? 'An unexpected error occurred',
      details: detailsList,
    );
  }
}

/// Authoritative Top-Level Error Envelope
class ApiErrorEnvelope implements Exception {
  final bool success;
  final ApiErrorPayload error;
  final String correlationId;
  final DateTime timestamp;
  final String path;

  const ApiErrorEnvelope({
    this.success = false,
    required this.error,
    required this.correlationId,
    required this.timestamp,
    required this.path,
  });

  factory ApiErrorEnvelope.fromJson(Map<String, dynamic> json) {
    return ApiErrorEnvelope(
      success: json['success'] as bool? ?? false,
      error: ApiErrorPayload.fromJson(json['error'] as Map<String, dynamic>? ?? {}),
      correlationId: json['correlationId'] as String? ?? '',
      timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
      path: json['path'] as String? ?? '',
    );
  }

  @override
  String toString() => 'ApiErrorEnvelope(code: ${error.rawCode}, message: ${error.message}, correlationId: $correlationId)';
}

/// Money & Currency Conventions (Integer Paise)
class MoneyAmount {
  final int amountPaise;
  final String currency;

  const MoneyAmount({
    required this.amountPaise,
    this.currency = 'INR',
  });

  double get inRupees => amountPaise / 100.0;

  String get formattedInr {
    return '₹${inRupees.toStringAsFixed(2)}';
  }

  factory MoneyAmount.fromRupees(double rupees) {
    return MoneyAmount(amountPaise: (rupees * 100).round());
  }

  factory MoneyAmount.fromJson(Map<String, dynamic> json) {
    return MoneyAmount(
      amountPaise: json['amountPaise'] as int? ?? 0,
      currency: json['currency'] as String? ?? 'INR',
    );
  }

  Map<String, dynamic> toJson() => {
    'amountPaise': amountPaise,
    'currency': currency,
  };
}

/// Quote Request DTO for Ride Booking
class QuoteRequest {
  final String city;
  final String serviceCategory;
  final double pickupLatitude;
  final double pickupLongitude;
  final double dropoffLatitude;
  final double dropoffLongitude;

  const QuoteRequest({
    required this.city,
    required this.serviceCategory,
    required this.pickupLatitude,
    required this.pickupLongitude,
    required this.dropoffLatitude,
    required this.dropoffLongitude,
  });

  Map<String, dynamic> toJson() => {
    'city': city,
    'serviceCategory': serviceCategory,
    'pickupLatitude': pickupLatitude,
    'pickupLongitude': pickupLongitude,
    'dropoffLatitude': dropoffLatitude,
    'dropoffLongitude': dropoffLongitude,
  };
}

/// Quote Response DTO
class QuoteResponse {
  final String quoteId;
  final String city;
  final String serviceCategory;
  final int distanceMeters;
  final MoneyAmount fare;
  final int etaMinutes;
  final String propulsion;
  final DateTime expiresAt;

  const QuoteResponse({
    required this.quoteId,
    required this.city,
    required this.serviceCategory,
    required this.distanceMeters,
    required this.fare,
    required this.etaMinutes,
    required this.propulsion,
    required this.expiresAt,
  });

  factory QuoteResponse.fromJson(Map<String, dynamic> json) {
    return QuoteResponse(
      quoteId: json['quoteId'] as String? ?? '',
      city: json['city'] as String? ?? '',
      serviceCategory: json['serviceCategory'] as String? ?? '',
      distanceMeters: json['distanceMeters'] as int? ?? 0,
      fare: MoneyAmount.fromJson(json['fare'] as Map<String, dynamic>? ?? {}),
      etaMinutes: json['etaMinutes'] as int? ?? 0,
      propulsion: json['propulsion'] as String? ?? 'BATTERY_ELECTRIC',
      expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

/// EV Service Category Availability Item (EV-037)
class ServiceCategoryAvailabilityItem {
  final String serviceCategory;
  final String vehicleClass;
  final String displayName;
  final String description;
  final int seatingCapacity;
  final String seatingConfiguration;
  final String propulsion;
  final bool isEnabled;
  final bool isBookable;
  final int availableCaptainsCount;
  final int? estimatedFarePaise;
  final String? formattedFare;
  final int? estimatedEtaMinutes;
  final String? rejectionOrUnavailableReason;

  const ServiceCategoryAvailabilityItem({
    required this.serviceCategory,
    required this.vehicleClass,
    required this.displayName,
    required this.description,
    required this.seatingCapacity,
    required this.seatingConfiguration,
    this.propulsion = 'BATTERY_ELECTRIC',
    required this.isEnabled,
    required this.isBookable,
    required this.availableCaptainsCount,
    this.estimatedFarePaise,
    this.formattedFare,
    this.estimatedEtaMinutes,
    this.rejectionOrUnavailableReason,
  });

  factory ServiceCategoryAvailabilityItem.fromJson(Map<String, dynamic> json) {
    return ServiceCategoryAvailabilityItem(
      serviceCategory: json['serviceCategory'] as String? ?? '',
      vehicleClass: json['vehicleClass'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      description: json['description'] as String? ?? '',
      seatingCapacity: json['seatingCapacity'] as int? ?? 1,
      seatingConfiguration: json['seatingConfiguration'] as String? ?? 'D+1',
      propulsion: json['propulsion'] as String? ?? 'BATTERY_ELECTRIC',
      isEnabled: json['isEnabled'] as bool? ?? false,
      isBookable: json['isBookable'] as bool? ?? false,
      availableCaptainsCount: json['availableCaptainsCount'] as int? ?? 0,
      estimatedFarePaise: json['estimatedFarePaise'] as int?,
      formattedFare: json['formattedFare'] as String?,
      estimatedEtaMinutes: json['estimatedEtaMinutes'] as int?,
      rejectionOrUnavailableReason: json['rejectionOrUnavailableReason'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'serviceCategory': serviceCategory,
    'vehicleClass': vehicleClass,
    'displayName': displayName,
    'description': description,
    'seatingCapacity': seatingCapacity,
    'seatingConfiguration': seatingConfiguration,
    'propulsion': propulsion,
    'isEnabled': isEnabled,
    'isBookable': isBookable,
    'availableCaptainsCount': availableCaptainsCount,
    if (estimatedFarePaise != null) 'estimatedFarePaise': estimatedFarePaise,
    if (formattedFare != null) 'formattedFare': formattedFare,
    if (estimatedEtaMinutes != null) 'estimatedEtaMinutes': estimatedEtaMinutes,
    if (rejectionOrUnavailableReason != null)
      'rejectionOrUnavailableReason': rejectionOrUnavailableReason,
  };
}

/// Regulatory Cancellation Policy Terms (EV-037)
class CancellationTermsDto {
  final int freeCancellationMinutes;
  final int driverCompensationFeePaise;
  final String formattedCancellationFee;
  final String policySummary;

  const CancellationTermsDto({
    required this.freeCancellationMinutes,
    required this.driverCompensationFeePaise,
    required this.formattedCancellationFee,
    required this.policySummary,
  });

  factory CancellationTermsDto.fromJson(Map<String, dynamic> json) {
    return CancellationTermsDto(
      freeCancellationMinutes: json['freeCancellationMinutes'] as int? ?? 3,
      driverCompensationFeePaise: json['driverCompensationFeePaise'] as int? ?? 1500,
      formattedCancellationFee: json['formattedCancellationFee'] as String? ?? '₹15.00',
      policySummary: json['policySummary'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'freeCancellationMinutes': freeCancellationMinutes,
    'driverCompensationFeePaise': driverCompensationFeePaise,
    'formattedCancellationFee': formattedCancellationFee,
    'policySummary': policySummary,
  };
}

/// Service Availability & Pricing Response (EV-037)
class ServiceAvailabilityResponse {
  final String city;
  final String? zoneId;
  final String? zoneName;
  final String? zoneCode;
  final bool isInsideGeofence;
  final List<ServiceCategoryAvailabilityItem> categories;
  final String operatorNotice;
  final CancellationTermsDto cancellationTerms;
  final DateTime evaluatedAt;

  const ServiceAvailabilityResponse({
    required this.city,
    this.zoneId,
    this.zoneName,
    this.zoneCode,
    required this.isInsideGeofence,
    required this.categories,
    required this.operatorNotice,
    required this.cancellationTerms,
    required this.evaluatedAt,
  });

  factory ServiceAvailabilityResponse.fromJson(Map<String, dynamic> json) {
    return ServiceAvailabilityResponse(
      city: json['city'] as String? ?? '',
      zoneId: json['zoneId'] as String?,
      zoneName: json['zoneName'] as String?,
      zoneCode: json['zoneCode'] as String?,
      isInsideGeofence: json['isInsideGeofence'] as bool? ?? false,
      categories: (json['categories'] as List<dynamic>? ?? [])
          .map((c) => ServiceCategoryAvailabilityItem.fromJson(c as Map<String, dynamic>))
          .toList(),
      operatorNotice: json['operatorNotice'] as String? ?? '',
      cancellationTerms: CancellationTermsDto.fromJson(
        json['cancellationTerms'] as Map<String, dynamic>? ?? {},
      ),
      evaluatedAt: DateTime.tryParse(json['evaluatedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

/// Geographic Point coordinates
class GeoPointDto {
  final double latitude;
  final double longitude;

  const GeoPointDto({
    required this.latitude,
    required this.longitude,
  });

  factory GeoPointDto.fromJson(Map<String, dynamic> json) {
    return GeoPointDto(
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
  };
}

/// Address Suggestion for Search Autocompletion (EV-032 / EV-033)
class AddressSuggestionDto {
  final String id;
  final String placeId;
  final String primaryText;
  final String secondaryText;
  final String fullAddress;
  final String city;
  final String? district;
  final double latitude;
  final double longitude;

  const AddressSuggestionDto({
    required this.id,
    required this.placeId,
    required this.primaryText,
    required this.secondaryText,
    required this.fullAddress,
    required this.city,
    this.district,
    required this.latitude,
    required this.longitude,
  });

  factory AddressSuggestionDto.fromJson(Map<String, dynamic> json) {
    final coords = json['coordinates'] as Map<String, dynamic>?;
    return AddressSuggestionDto(
      id: json['id'] as String? ?? '',
      placeId: json['placeId'] as String? ?? '',
      primaryText: json['primaryText'] as String? ?? '',
      secondaryText: json['secondaryText'] as String? ?? '',
      fullAddress: json['fullAddress'] as String? ?? '',
      city: json['city'] as String? ?? '',
      district: json['district'] as String?,
      latitude: coords != null ? (coords['latitude'] as num).toDouble() : (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: coords != null ? (coords['longitude'] as num).toDouble() : (json['longitude'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Detailed Reverse Geocode Result for Manual Pin & Coordinates (EV-032 / EV-033)
class ReverseGeocodeDto {
  final String fullAddress;
  final String primaryName;
  final String city;
  final String? district;
  final String state;
  final String? postalCode;
  final double latitude;
  final double longitude;
  final bool isWithinAndhraPradesh;
  final bool isFallback;
  final String? warning;

  const ReverseGeocodeDto({
    required this.fullAddress,
    required this.primaryName,
    required this.city,
    this.district,
    required this.state,
    this.postalCode,
    required this.latitude,
    required this.longitude,
    required this.isWithinAndhraPradesh,
    this.isFallback = false,
    this.warning,
  });

  factory ReverseGeocodeDto.fromJson(Map<String, dynamic> json) {
    final coords = json['coordinates'] as Map<String, dynamic>?;
    return ReverseGeocodeDto(
      fullAddress: json['fullAddress'] as String? ?? '',
      primaryName: json['primaryName'] as String? ?? '',
      city: json['city'] as String? ?? '',
      district: json['district'] as String?,
      state: json['state'] as String? ?? 'Andhra Pradesh',
      postalCode: json['postalCode'] as String?,
      latitude: coords != null ? (coords['latitude'] as num).toDouble() : (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: coords != null ? (coords['longitude'] as num).toDouble() : (json['longitude'] as num?)?.toDouble() ?? 0.0,
      isWithinAndhraPradesh: json['isWithinAndhraPradesh'] as bool? ?? true,
      isFallback: json['isFallback'] as bool? ?? false,
      warning: json['warning'] as String?,
    );
  }
}

/// Verification result for Point-in-Polygon Geofence & Category switch (EV-031 / EV-033)
class VerifyLocationResultDto {
  final bool isAuthorized;
  final String? zoneId;
  final String? zoneCode;
  final String? zoneName;
  final String city;
  final String serviceCategory;
  final bool isInsideGeofence;
  final bool isPermitValid;
  final bool isCategoryEnabled;
  final String operationalStatus;
  final String? permitExpiresAt;
  final String? rejectionReason;
  final String evaluatedAt;

  const VerifyLocationResultDto({
    required this.isAuthorized,
    this.zoneId,
    this.zoneCode,
    this.zoneName,
    required this.city,
    required this.serviceCategory,
    required this.isInsideGeofence,
    required this.isPermitValid,
    required this.isCategoryEnabled,
    required this.operationalStatus,
    this.permitExpiresAt,
    this.rejectionReason,
    required this.evaluatedAt,
  });

  factory VerifyLocationResultDto.fromJson(Map<String, dynamic> json) {
    return VerifyLocationResultDto(
      isAuthorized: json['isAuthorized'] as bool? ?? false,
      zoneId: json['zoneId'] as String?,
      zoneCode: json['zoneCode'] as String?,
      zoneName: json['zoneName'] as String?,
      city: json['city'] as String? ?? '',
      serviceCategory: json['serviceCategory'] as String? ?? '',
      isInsideGeofence: json['isInsideGeofence'] as bool? ?? false,
      isPermitValid: json['isPermitValid'] as bool? ?? false,
      isCategoryEnabled: json['isCategoryEnabled'] as bool? ?? false,
      operationalStatus: json['operationalStatus'] as String? ?? 'DISABLED',
      permitExpiresAt: json['permitExpiresAt'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      evaluatedAt: json['evaluatedAt'] as String? ?? DateTime.now().toIso8601String(),
    );
  }
}

/// Saved Places DTO (Home, Work, Custom Favorite) (EV-019 / EV-033)
class SavedPlaceDto {
  final String id;
  final String userId;
  final String label;
  final String addressType;
  final String addressLine;
  final String? landmark;
  final double latitude;
  final double longitude;

  const SavedPlaceDto({
    required this.id,
    required this.userId,
    required this.label,
    required this.addressType,
    required this.addressLine,
    this.landmark,
    required this.latitude,
    required this.longitude,
  });

  factory SavedPlaceDto.fromJson(Map<String, dynamic> json) {
    return SavedPlaceDto(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      label: json['label'] as String? ?? '',
      addressType: json['addressType'] as String? ?? 'BOTH',
      addressLine: json['addressLine'] as String? ?? '',
      landmark: json['landmark'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'label': label,
    'addressType': addressType,
    'addressLine': addressLine,
    if (landmark != null) 'landmark': landmark,
    'latitude': latitude,
    'longitude': longitude,
  };
}
