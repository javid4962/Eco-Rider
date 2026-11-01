import * as fs from 'fs';
import * as path from 'path';

export function generateFlutterClient(): void {
  const dartCode = `// GENERATED CODE - DO NOT MODIFY BY HAND
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
  String toString() => 'ApiErrorEnvelope(code: \${error.rawCode}, message: \${error.message}, correlationId: \$correlationId)';
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
    return '₹\${inRupees.toStringAsFixed(2)}';
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
`;

  const riderTargetPath = path.resolve(
    process.cwd(),
    'apps/rider_app/lib/core/api/api_contracts.dart',
  );
  const captainTargetPath = path.resolve(
    process.cwd(),
    'apps/captain_app/lib/core/api/api_contracts.dart',
  );

  fs.mkdirSync(path.dirname(riderTargetPath), { recursive: true });
  fs.mkdirSync(path.dirname(captainTargetPath), { recursive: true });

  fs.writeFileSync(riderTargetPath, dartCode, 'utf-8');
  fs.writeFileSync(captainTargetPath, dartCode, 'utf-8');

  console.log('Flutter API client contracts generated successfully at:');
  console.log(` - ${riderTargetPath}`);
  console.log(` - ${captainTargetPath}`);
}

generateFlutterClient();
