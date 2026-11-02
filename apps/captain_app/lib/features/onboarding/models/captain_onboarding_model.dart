// EcoRide Captain Onboarding Data Models (EV-026)
// Original EV-Only Electric Mobility Platform for Andhra Pradesh

enum OnboardingStep {
  phoneLogin,
  personalDetails,
  vehicleDetails,
  documents,
  previewSubmit,
  applicationStatus,
}

enum DocUploadStatus {
  idle,
  uploading,
  uploaded,
  interrupted,
  failed,
}

class DocumentUploadItem {
  final String docType;
  final String label;
  final bool isRequired;
  final String? docId;
  final String? filename;
  final DocUploadStatus status;
  final double progress;
  final String? errorMessage;

  const DocumentUploadItem({
    required this.docType,
    required this.label,
    this.isRequired = true,
    this.docId,
    this.filename,
    this.status = DocUploadStatus.idle,
    this.progress = 0.0,
    this.errorMessage,
  });

  DocumentUploadItem copyWith({
    String? docType,
    String? label,
    bool? isRequired,
    String? docId,
    String? filename,
    DocUploadStatus? status,
    double? progress,
    String? errorMessage,
  }) {
    return DocumentUploadItem(
      docType: docType ?? this.docType,
      label: label ?? this.label,
      isRequired: isRequired ?? this.isRequired,
      docId: docId ?? this.docId,
      filename: filename ?? this.filename,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class CaptainDraftData {
  // Application ID & Status
  String? id;
  String status; // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
  String driverRequirementsStatus;
  String vehicleRequirementsStatus;
  String? complianceStatus;
  int submissionCount;
  String? overallRejectionReason;
  String? driverRejectionReason;
  String? vehicleRejectionReason;
  DateTime? submittedAt;

  // Personal / Driver Details
  String fullName;
  String dateOfBirth; // YYYY-MM-DD
  String drivingLicenseNumber;
  String drivingLicenseExpiry; // YYYY-MM-DD
  String badgeNumber;
  String emergencyContactName;
  String emergencyContactPhone;
  String city;

  // Vehicle Details
  String vehicleOwnershipType; // OWNED, FLEET_ASSIGNED, LEASED
  String vehicleCategory; // CITY_COMMUTE_2W, AUTO_RICKSHAW_3W, SEDAN_4W, SUV_4W
  String propulsionType; // Strictly BATTERY_ELECTRIC
  String vehicleMake;
  String vehicleModel;
  int? vehicleYear;
  String vehicleRegistrationNumber;
  double? batteryCapacityKwh;

  // Document UUIDs
  String? drivingLicenseDocId;
  String? aadhaarDocId;
  String? panDocId;
  String? policeVerificationDocId;
  String? profilePhotoDocId;
  String? vehicleRcDocId;
  String? greenPlatePermitDocId;
  String? insuranceDocId;
  String? fitnessDocId;

  CaptainDraftData({
    this.id,
    this.status = 'DRAFT',
    this.driverRequirementsStatus = 'PENDING',
    this.vehicleRequirementsStatus = 'PENDING',
    this.complianceStatus,
    this.submissionCount = 0,
    this.overallRejectionReason,
    this.driverRejectionReason,
    this.vehicleRejectionReason,
    this.submittedAt,
    this.fullName = '',
    this.dateOfBirth = '',
    this.drivingLicenseNumber = '',
    this.drivingLicenseExpiry = '',
    this.badgeNumber = '',
    this.emergencyContactName = '',
    this.emergencyContactPhone = '',
    this.city = 'visakhapatnam',
    this.vehicleOwnershipType = 'OWNED',
    this.vehicleCategory = 'CITY_COMMUTE_2W',
    this.propulsionType = 'BATTERY_ELECTRIC',
    this.vehicleMake = '',
    this.vehicleModel = '',
    this.vehicleYear,
    this.vehicleRegistrationNumber = '',
    this.batteryCapacityKwh,
    this.drivingLicenseDocId,
    this.aadhaarDocId,
    this.panDocId,
    this.policeVerificationDocId,
    this.profilePhotoDocId,
    this.vehicleRcDocId,
    this.greenPlatePermitDocId,
    this.insuranceDocId,
    this.fitnessDocId,
  });

  Map<String, dynamic> toDraftJson() {
    return {
      'fullName': fullName,
      'dateOfBirth': dateOfBirth.isNotEmpty ? dateOfBirth : null,
      'drivingLicenseNumber': drivingLicenseNumber,
      'drivingLicenseExpiry': drivingLicenseExpiry.isNotEmpty ? drivingLicenseExpiry : null,
      'badgeNumber': badgeNumber.isNotEmpty ? badgeNumber : null,
      'emergencyContactName': emergencyContactName,
      'emergencyContactPhone': emergencyContactPhone,
      'city': city,
      'vehicleOwnershipType': vehicleOwnershipType,
      'vehicleCategory': vehicleCategory,
      'propulsionType': propulsionType,
      'vehicleMake': vehicleMake,
      'vehicleModel': vehicleModel,
      'vehicleYear': vehicleYear,
      'vehicleRegistrationNumber': vehicleRegistrationNumber,
      'batteryCapacityKwh': batteryCapacityKwh,
      if (drivingLicenseDocId != null) 'drivingLicenseDocId': drivingLicenseDocId,
      if (aadhaarDocId != null) 'aadhaarDocId': aadhaarDocId,
      if (panDocId != null) 'panDocId': panDocId,
      if (policeVerificationDocId != null) 'policeVerificationDocId': policeVerificationDocId,
      if (profilePhotoDocId != null) 'profilePhotoDocId': profilePhotoDocId,
      if (vehicleRcDocId != null) 'vehicleRcDocId': vehicleRcDocId,
      if (greenPlatePermitDocId != null) 'greenPlatePermitDocId': greenPlatePermitDocId,
      if (insuranceDocId != null) 'insuranceDocId': insuranceDocId,
      if (fitnessDocId != null) 'fitnessDocId': fitnessDocId,
    };
  }

  factory CaptainDraftData.fromJson(Map<String, dynamic> json) {
    return CaptainDraftData(
      id: json['id'] as String?,
      status: json['status'] as String? ?? 'DRAFT',
      driverRequirementsStatus: json['driverRequirementsStatus'] as String? ?? 'PENDING',
      vehicleRequirementsStatus: json['vehicleRequirementsStatus'] as String? ?? 'PENDING',
      complianceStatus: json['complianceStatus'] as String?,
      submissionCount: json['submissionCount'] as int? ?? 0,
      overallRejectionReason: json['overallRejectionReason'] as String?,
      driverRejectionReason: json['driverRejectionReason'] as String?,
      vehicleRejectionReason: json['vehicleRejectionReason'] as String?,
      submittedAt: json['submittedAt'] != null ? DateTime.tryParse(json['submittedAt'] as String) : null,
      fullName: json['fullName'] as String? ?? '',
      dateOfBirth: json['dateOfBirth'] as String? ?? '',
      drivingLicenseNumber: json['drivingLicenseNumber'] as String? ?? '',
      drivingLicenseExpiry: json['drivingLicenseExpiry'] as String? ?? '',
      badgeNumber: json['badgeNumber'] as String? ?? '',
      emergencyContactName: json['emergencyContactName'] as String? ?? '',
      emergencyContactPhone: json['emergencyContactPhone'] as String? ?? '',
      city: json['city'] as String? ?? 'visakhapatnam',
      vehicleOwnershipType: json['vehicleOwnershipType'] as String? ?? 'OWNED',
      vehicleCategory: json['vehicleCategory'] as String? ?? 'CITY_COMMUTE_2W',
      propulsionType: json['propulsionType'] as String? ?? 'BATTERY_ELECTRIC',
      vehicleMake: json['vehicleMake'] as String? ?? '',
      vehicleModel: json['vehicleModel'] as String? ?? '',
      vehicleYear: json['vehicleYear'] as int?,
      vehicleRegistrationNumber: json['vehicleRegistrationNumber'] as String? ?? '',
      batteryCapacityKwh: (json['batteryCapacityKwh'] as num?)?.toDouble(),
      drivingLicenseDocId: json['drivingLicenseDocId'] as String?,
      aadhaarDocId: json['aadhaarDocId'] as String?,
      panDocId: json['panDocId'] as String?,
      policeVerificationDocId: json['policeVerificationDocId'] as String?,
      profilePhotoDocId: json['profilePhotoDocId'] as String?,
      vehicleRcDocId: json['vehicleRcDocId'] as String?,
      greenPlatePermitDocId: json['greenPlatePermitDocId'] as String?,
      insuranceDocId: json['insuranceDocId'] as String?,
      fitnessDocId: json['fitnessDocId'] as String?,
    );
  }
}
