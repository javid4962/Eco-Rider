// EcoRide Captain Onboarding Controller (EV-026)
// Coordinates form validation, interrupted upload retry, camera permission handling,
// backend draft sync, and status screen transitions.

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/captain_onboarding_model.dart';
import '../services/captain_onboarding_api_client.dart';

class CaptainOnboardingController extends ChangeNotifier {
  final CaptainOnboardingApiClient apiClient;
  final bool enableCooldownTimer;

  CaptainOnboardingController({
    CaptainOnboardingApiClient? apiClient,
    OnboardingStep initialStep = OnboardingStep.phoneLogin,
    CaptainDraftData? initialDraft,
    this.enableCooldownTimer = true,
  })  : apiClient = apiClient ?? MockCaptainOnboardingApiClient(),
        _currentStep = initialStep,
        _draft = initialDraft ?? CaptainDraftData() {
    _initDocuments();
  }

  // ---------------------------------------------------------------------------
  // State Properties
  // ---------------------------------------------------------------------------

  OnboardingStep _currentStep;
  OnboardingStep get currentStep => _currentStep;

  CaptainDraftData _draft;
  CaptainDraftData get draft => _draft;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isSlowNetwork = false;
  bool get isSlowNetwork => _isSlowNetwork;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _statusMessage;
  String? get statusMessage => _statusMessage;

  final Map<String, String> _fieldErrors = {};
  Map<String, String> get fieldErrors => Map.unmodifiable(_fieldErrors);

  // Phone Auth State
  String _phone = '';
  String get phone => _phone;

  String _otpCode = '';
  String get otpCode => _otpCode;

  bool _isOtpSent = false;
  bool get isOtpSent => _isOtpSent;

  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;

  int _cooldownSeconds = 0;
  int get cooldownSeconds => _cooldownSeconds;
  Timer? _cooldownTimer;

  // Camera & Permissions
  bool _cameraDenied = false;
  bool get cameraDenied => _cameraDenied;

  // Statutory Declaration (Preview Screen)
  bool _statutoryDeclarationAccepted = false;
  bool get statutoryDeclarationAccepted => _statutoryDeclarationAccepted;

  // Document Uploads Map
  final Map<String, DocumentUploadItem> _documents = {};
  Map<String, DocumentUploadItem> get documents => Map.unmodifiable(_documents);

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  void _initDocuments() {
    final defaultDocs = [
      const DocumentUploadItem(
        docType: 'DRIVING_LICENSE',
        label: 'Commercial Driving License',
        isRequired: true,
      ),
      const DocumentUploadItem(
        docType: 'AADHAAR',
        label: 'Aadhaar / Identity Proof',
        isRequired: true,
      ),
      const DocumentUploadItem(
        docType: 'PROFILE_PHOTO',
        label: 'Captain Profile Photo / Live Selfie',
        isRequired: true,
      ),
      const DocumentUploadItem(
        docType: 'VEHICLE_RC',
        label: 'Electric Vehicle RC',
        isRequired: true,
      ),
      const DocumentUploadItem(
        docType: 'GREEN_PLATE_PERMIT',
        label: 'AP Green-Plate Commercial Permit',
        isRequired: true,
      ),
      const DocumentUploadItem(
        docType: 'VEHICLE_INSURANCE',
        label: 'Commercial EV Insurance Certificate',
        isRequired: true,
      ),
      const DocumentUploadItem(
        docType: 'COMMERCIAL_FITNESS',
        label: 'Commercial Fitness Certificate',
        isRequired: false,
      ),
    ];

    for (final doc in defaultDocs) {
      _documents[doc.docType] = doc;
    }

    // Link any existing draft doc IDs
    _syncDraftDocIdsToItems();
  }

  void _syncDraftDocIdsToItems() {
    void link(String docType, String? docId) {
      if (docId != null && _documents.containsKey(docType)) {
        _documents[docType] = _documents[docType]!.copyWith(
          docId: docId,
          status: DocUploadStatus.uploaded,
          progress: 1.0,
        );
      }
    }

    link('DRIVING_LICENSE', _draft.drivingLicenseDocId);
    link('AADHAAR', _draft.aadhaarDocId);
    link('PAN', _draft.panDocId);
    link('PROFILE_PHOTO', _draft.profilePhotoDocId);
    link('POLICE_VERIFICATION', _draft.policeVerificationDocId);
    link('VEHICLE_RC', _draft.vehicleRcDocId);
    link('GREEN_PLATE_PERMIT', _draft.greenPlatePermitDocId);
    link('VEHICLE_INSURANCE', _draft.insuranceDocId);
    link('COMMERCIAL_FITNESS', _draft.fitnessDocId);
  }

  // ---------------------------------------------------------------------------
  // Phone Login Flow
  // ---------------------------------------------------------------------------

  void setPhone(String val) {
    _phone = val.trim();
    _fieldErrors.remove('phone');
    notifyListeners();
  }

  void setOtpCode(String val) {
    _otpCode = val.trim();
    _fieldErrors.remove('otpCode');
    notifyListeners();
  }

  bool validatePhone(String val) {
    // E.164 Indian format: +91 followed by 10 digits starting with 6-9
    final regex = RegExp(r'^\+91[6-9]\d{9}$');
    return regex.hasMatch(val);
  }

  Future<bool> sendOtp() async {
    _clearErrors();
    if (!validatePhone(_phone)) {
      _fieldErrors['phone'] = 'Enter valid Indian mobile number (+91 followed by 10 digits starting with 6-9)';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final res = await apiClient.sendOtp(_phone);
      _isOtpSent = true;
      _startCooldown(res['cooldownSeconds'] as int? ?? 30);
      _statusMessage = 'OTP sent successfully to $_phone';
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void _startCooldown(int seconds) {
    _cooldownSeconds = seconds;
    _cooldownTimer?.cancel();
    if (!enableCooldownTimer) return;
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_cooldownSeconds > 0) {
        _cooldownSeconds -= 1;
        notifyListeners();
      } else {
        timer.cancel();
      }
    });
  }

  void cancelCooldownTimer() {
    _cooldownTimer?.cancel();
    _cooldownTimer = null;
  }

  Future<bool> verifyOtp() async {
    _clearErrors();
    if (_otpCode.length < 4) {
      _fieldErrors['otpCode'] = 'Enter 6-digit verification code';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      await apiClient.verifyOtp(_phone, _otpCode);
      _isLoggedIn = true;

      // Load existing draft if any
      await loadExistingDraft();

      if (_draft.status == 'SUBMITTED' || _draft.status == 'UNDER_REVIEW' || _draft.status == 'APPROVED') {
        _currentStep = OnboardingStep.applicationStatus;
      } else {
        _currentStep = OnboardingStep.personalDetails;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _fieldErrors['otpCode'] = 'Invalid verification code';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Step 1: Personal Details
  // ---------------------------------------------------------------------------

  void updatePersonalDetails({
    String? fullName,
    String? dateOfBirth,
    String? drivingLicenseNumber,
    String? drivingLicenseExpiry,
    String? badgeNumber,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? city,
  }) {
    if (fullName != null) _draft.fullName = fullName.trim();
    if (dateOfBirth != null) _draft.dateOfBirth = dateOfBirth.trim();
    if (drivingLicenseNumber != null) _draft.drivingLicenseNumber = drivingLicenseNumber.toUpperCase().trim();
    if (drivingLicenseExpiry != null) _draft.drivingLicenseExpiry = drivingLicenseExpiry.trim();
    if (badgeNumber != null) _draft.badgeNumber = badgeNumber.trim();
    if (emergencyContactName != null) _draft.emergencyContactName = emergencyContactName.trim();
    if (emergencyContactPhone != null) _draft.emergencyContactPhone = emergencyContactPhone.trim();
    if (city != null) _draft.city = city.toLowerCase().trim();
    notifyListeners();
  }

  bool validatePersonalDetails() {
    _fieldErrors.clear();

    if (_draft.fullName.trim().isEmpty) {
      _fieldErrors['fullName'] = 'Full legal name is required';
    }
    if (_draft.drivingLicenseNumber.trim().isEmpty) {
      _fieldErrors['drivingLicenseNumber'] = 'Commercial driving license number is required';
    }
    if (_draft.emergencyContactName.trim().isEmpty) {
      _fieldErrors['emergencyContactName'] = 'Emergency contact name is required';
    }
    if (_draft.emergencyContactPhone.trim().isEmpty) {
      _fieldErrors['emergencyContactPhone'] = 'Emergency contact phone number is required';
    } else if (!validatePhone(_draft.emergencyContactPhone)) {
      _fieldErrors['emergencyContactPhone'] = 'Enter valid Indian emergency phone (+91 6-9xxxxxxxx)';
    }

    notifyListeners();
    return _fieldErrors.isEmpty;
  }

  Future<bool> saveAndProceedPersonal() async {
    if (!validatePersonalDetails()) return false;

    _isLoading = true;
    notifyListeners();

    try {
      await apiClient.updateDraft(_draft);
      _isLoading = false;
      _currentStep = OnboardingStep.vehicleDetails;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2: Vehicle Details
  // ---------------------------------------------------------------------------

  void updateVehicleDetails({
    String? ownershipType,
    String? category,
    String? propulsionType,
    String? make,
    String? model,
    int? year,
    String? registrationNumber,
    double? batteryCapacityKwh,
  }) {
    if (ownershipType != null) _draft.vehicleOwnershipType = ownershipType;
    if (category != null) _draft.vehicleCategory = category;
    if (propulsionType != null) _draft.propulsionType = propulsionType;
    if (make != null) _draft.vehicleMake = make.trim();
    if (model != null) _draft.vehicleModel = model.trim();
    if (year != null) _draft.vehicleYear = year;
    if (registrationNumber != null) _draft.vehicleRegistrationNumber = registrationNumber.toUpperCase().trim();
    if (batteryCapacityKwh != null) _draft.batteryCapacityKwh = batteryCapacityKwh;
    notifyListeners();
  }

  bool validateVehicleDetails() {
    _fieldErrors.clear();

    // Strict 100% BEV check
    if (_draft.propulsionType != 'BATTERY_ELECTRIC') {
      _fieldErrors['propulsionType'] = 'Only 100% Battery Electric Vehicles (BEV) are permitted on EcoRide';
    }

    if (_draft.vehicleOwnershipType == 'OWNED') {
      if (_draft.vehicleRegistrationNumber.trim().isEmpty) {
        _fieldErrors['vehicleRegistrationNumber'] = 'Green-plate vehicle registration number is required';
      }
      if (_draft.vehicleMake.trim().isEmpty) {
        _fieldErrors['vehicleMake'] = 'Vehicle manufacturer / make is required';
      }
      if (_draft.vehicleModel.trim().isEmpty) {
        _fieldErrors['vehicleModel'] = 'Vehicle model is required';
      }
      if (_draft.batteryCapacityKwh == null || _draft.batteryCapacityKwh! <= 0) {
        _fieldErrors['batteryCapacityKwh'] = 'Valid battery pack capacity in kWh is required';
      }
    }

    notifyListeners();
    return _fieldErrors.isEmpty;
  }

  Future<bool> saveAndProceedVehicle() async {
    if (!validateVehicleDetails()) return false;

    _isLoading = true;
    notifyListeners();

    try {
      await apiClient.updateDraft(_draft);
      _isLoading = false;
      _currentStep = OnboardingStep.documents;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Documents & Uploads
  // ---------------------------------------------------------------------------

  void setCameraDenied(bool denied) {
    _cameraDenied = denied;
    notifyListeners();
  }

  void resetCameraPermission() {
    _cameraDenied = false;
    notifyListeners();
  }

  Future<void> uploadDocument(
    String docType, {
    String filename = 'document.jpg',
    String contentBase64 = 'aW1hZ2UtZGF0YQ==',
    bool simulateInterruption = false,
    bool simulateSlowNetwork = false,
  }) async {
    if (!_documents.containsKey(docType)) return;

    final item = _documents[docType]!;
    _documents[docType] = item.copyWith(
      status: DocUploadStatus.uploading,
      progress: 0.3,
      errorMessage: null,
      filename: filename,
    );
    _isSlowNetwork = simulateSlowNetwork;
    notifyListeners();

    try {
      if (simulateSlowNetwork) {
        await Future.delayed(const Duration(milliseconds: 50));
        _documents[docType] = _documents[docType]!.copyWith(progress: 0.7);
        notifyListeners();
      }

      final res = await apiClient.uploadDocument(
        docType,
        filename,
        contentBase64,
        simulateInterruption: simulateInterruption,
        simulateSlowNetwork: simulateSlowNetwork,
      );

      final docId = res['id'] as String;

      _documents[docType] = _documents[docType]!.copyWith(
        docId: docId,
        status: DocUploadStatus.uploaded,
        progress: 1.0,
      );

      // Save to draft
      _applyDocIdToDraft(docType, docId);
      await apiClient.updateDraft(_draft);

      _isSlowNetwork = false;
      notifyListeners();
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '');
      final isInterrupted = msg.contains('INTERRUPTED');

      _documents[docType] = _documents[docType]!.copyWith(
        status: isInterrupted ? DocUploadStatus.interrupted : DocUploadStatus.failed,
        errorMessage: msg,
        progress: 0.0,
      );
      _isSlowNetwork = false;
      notifyListeners();
    }
  }

  void retryUpload(String docType) {
    uploadDocument(docType, simulateInterruption: false, simulateSlowNetwork: false);
  }

  void _applyDocIdToDraft(String docType, String docId) {
    switch (docType) {
      case 'DRIVING_LICENSE':
        _draft.drivingLicenseDocId = docId;
        break;
      case 'AADHAAR':
        _draft.aadhaarDocId = docId;
        break;
      case 'PAN':
        _draft.panDocId = docId;
        break;
      case 'PROFILE_PHOTO':
        _draft.profilePhotoDocId = docId;
        break;
      case 'POLICE_VERIFICATION':
        _draft.policeVerificationDocId = docId;
        break;
      case 'VEHICLE_RC':
        _draft.vehicleRcDocId = docId;
        break;
      case 'GREEN_PLATE_PERMIT':
        _draft.greenPlatePermitDocId = docId;
        break;
      case 'VEHICLE_INSURANCE':
        _draft.insuranceDocId = docId;
        break;
      case 'COMMERCIAL_FITNESS':
        _draft.fitnessDocId = docId;
        break;
    }
  }

  bool validateDocuments() {
    _fieldErrors.clear();

    if (_draft.drivingLicenseDocId == null) {
      _fieldErrors['DRIVING_LICENSE'] = 'Commercial driving license document is mandatory';
    }
    if (_draft.aadhaarDocId == null && _draft.panDocId == null) {
      _fieldErrors['AADHAAR'] = 'Identity proof (Aadhaar or PAN) is mandatory';
    }

    if (_draft.vehicleOwnershipType == 'OWNED') {
      if (_draft.vehicleRcDocId == null) {
        _fieldErrors['VEHICLE_RC'] = 'Vehicle RC document is mandatory for owned vehicles';
      }
      if (_draft.greenPlatePermitDocId == null) {
        _fieldErrors['GREEN_PLATE_PERMIT'] = 'AP Green-Plate Commercial Permit is mandatory';
      }
    }

    notifyListeners();
    return _fieldErrors.isEmpty;
  }

  bool saveAndProceedDocuments() {
    if (!validateDocuments()) return false;
    _currentStep = OnboardingStep.previewSubmit;
    notifyListeners();
    return true;
  }

  // ---------------------------------------------------------------------------
  // Step 4: Preview & Submit
  // ---------------------------------------------------------------------------

  void toggleDeclaration(bool val) {
    _statutoryDeclarationAccepted = val;
    notifyListeners();
  }

  Future<bool> submitApplication() async {
    _clearErrors();
    if (!_statutoryDeclarationAccepted) {
      _errorMessage = 'You must accept the statutory EV declaration before submitting.';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final updated = await apiClient.submitApplication(notes: 'Submitted from captain Flutter app');
      _draft = updated;
      _isLoading = false;
      _currentStep = OnboardingStep.applicationStatus;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5: Application Status & Edit Rejected Draft
  // ---------------------------------------------------------------------------

  Future<void> loadExistingDraft() async {
    try {
      final loaded = await apiClient.getDraft();
      _draft = loaded;
      _syncDraftDocIdsToItems();
      notifyListeners();
    } catch (e) {
      // Ignore initial draft load error if none exists
    }
  }

  void editDraftAfterRejection() {
    // Keep all existing draft data populated without re-entering!
    _currentStep = OnboardingStep.personalDetails;
    notifyListeners();
  }

  void editStepFromPreview(OnboardingStep step) {
    _currentStep = step;
    notifyListeners();
  }

  void goToStep(OnboardingStep step) {
    _currentStep = step;
    notifyListeners();
  }

  void _clearErrors() {
    _errorMessage = null;
    _statusMessage = null;
    _fieldErrors.clear();
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    super.dispose();
  }
}
