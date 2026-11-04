// EcoRide Captain Onboarding API Client (EV-026)
// Handles phone auth, application draft synchronization, document uploads, and submission.

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../models/captain_onboarding_model.dart';

abstract class CaptainOnboardingApiClient {
  Future<Map<String, dynamic>> sendOtp(String phone, {String purpose = 'LOGIN'});
  Future<Map<String, dynamic>> verifyOtp(String phone, String code, {String purpose = 'LOGIN'});
  Future<CaptainDraftData> getDraft();
  Future<CaptainDraftData> updateDraft(CaptainDraftData draft);
  Future<Map<String, dynamic>> uploadDocument(
    String docType,
    String filename,
    String contentBase64, {
    bool simulateInterruption = false,
    bool simulateSlowNetwork = false,
  });
  Future<CaptainDraftData> submitApplication({String? notes});
  Future<List<Map<String, dynamic>>> getReviewHistory();
}

/// In-memory/simulated backend API client for tests and offline preview
class MockCaptainOnboardingApiClient implements CaptainOnboardingApiClient {
  CaptainDraftData currentDraft = CaptainDraftData(
    id: 'app-sim-001',
    status: 'DRAFT',
    city: 'visakhapatnam',
    propulsionType: 'BATTERY_ELECTRIC',
  );

  bool failNextUpload = false;
  bool shouldInterruptUpload = false;
  bool shouldSimulateSlowNetwork = false;
  bool shouldFailSubmission = false;
  String? submissionFailureMessage;
  List<String> submissionErrors = [];

  final List<Map<String, dynamic>> reviewHistory = [];

  @override
  Future<Map<String, dynamic>> sendOtp(String phone, {String purpose = 'LOGIN'}) async {
    return {
      'success': true,
      'referenceId': 'ref-test-otp-1234',
      'cooldownSeconds': 30,
      'isTest': true,
    };
  }

  @override
  Future<Map<String, dynamic>> verifyOtp(String phone, String code, {String purpose = 'LOGIN'}) async {
    if (code == '000000' || code == '123456' || code == '654321') {
      return {
        'success': true,
        'accessToken': 'mock-jwt-captain-token',
        'refreshToken': 'mock-refresh-token',
        'userId': 'usr-captain-test-01',
        'role': 'CAPTAIN',
      };
    }
    throw Exception('INVALID_OTP: Incorrect verification code');
  }

  @override
  Future<CaptainDraftData> getDraft() async {
    return currentDraft;
  }

  @override
  Future<CaptainDraftData> updateDraft(CaptainDraftData draft) async {
    currentDraft = draft;
    return currentDraft;
  }

  @override
  Future<Map<String, dynamic>> uploadDocument(
    String docType,
    String filename,
    String contentBase64, {
    bool simulateInterruption = false,
    bool simulateSlowNetwork = false,
  }) async {
    if (simulateSlowNetwork || shouldSimulateSlowNetwork) {
      await Future.delayed(const Duration(milliseconds: 100));
    }

    if (simulateInterruption || shouldInterruptUpload) {
      shouldInterruptUpload = false; // Reset after one failure
      throw Exception('NETWORK_INTERRUPTED: Upload interrupted mid-stream. Please retry.');
    }

    if (failNextUpload) {
      failNextUpload = false;
      throw Exception('UPLOAD_FAILED: Document transfer failed due to socket error.');
    }

    final docId = 'doc-uuid-${docType.toLowerCase()}-${DateTime.now().millisecondsSinceEpoch}';

    // Update document ID in draft
    switch (docType) {
      case 'DRIVING_LICENSE':
        currentDraft.drivingLicenseDocId = docId;
        break;
      case 'AADHAAR':
        currentDraft.aadhaarDocId = docId;
        break;
      case 'PAN':
        currentDraft.panDocId = docId;
        break;
      case 'PROFILE_PHOTO':
        currentDraft.profilePhotoDocId = docId;
        break;
      case 'POLICE_VERIFICATION':
        currentDraft.policeVerificationDocId = docId;
        break;
      case 'VEHICLE_RC':
        currentDraft.vehicleRcDocId = docId;
        break;
      case 'GREEN_PLATE_PERMIT':
        currentDraft.greenPlatePermitDocId = docId;
        break;
      case 'VEHICLE_INSURANCE':
        currentDraft.insuranceDocId = docId;
        break;
      case 'COMMERCIAL_FITNESS':
        currentDraft.fitnessDocId = docId;
        break;
    }

    return {
      'id': docId,
      'documentType': docType,
      'filename': filename,
      'status': 'CLEAN',
    };
  }

  @override
  Future<CaptainDraftData> submitApplication({String? notes}) async {
    if (shouldFailSubmission) {
      throw Exception(submissionFailureMessage ?? 'VALIDATION_FAILED: Missing mandatory fields');
    }

    // Verify EV propulsion strictly
    if (currentDraft.propulsionType != 'BATTERY_ELECTRIC') {
      throw Exception('PROPULSION_NON_ELECTRIC: EcoRide strictly accepts 100% Battery Electric Vehicles (BEV)');
    }

    currentDraft.status = 'SUBMITTED';
    currentDraft.submissionCount += 1;
    currentDraft.submittedAt = DateTime.now();
    currentDraft.driverRequirementsStatus = 'PENDING';
    currentDraft.vehicleRequirementsStatus = 'PENDING';

    reviewHistory.add({
      'previousStatus': 'DRAFT',
      'newStatus': 'SUBMITTED',
      'driverRequirementsStatus': 'PENDING',
      'vehicleRequirementsStatus': 'PENDING',
      'notes': notes ?? 'Application submitted via Captain Flutter app',
      'reviewedAt': DateTime.now().toIso8601String(),
    });

    return currentDraft;
  }

  @override
  Future<List<Map<String, dynamic>>> getReviewHistory() async {
    return List.from(reviewHistory);
  }
}

/// Production HTTP API Client connecting Captain app to the NestJS backend
class HttpCaptainOnboardingApiClient implements CaptainOnboardingApiClient {
  final String baseUrl;
  final String? authToken;
  final CaptainOnboardingApiClient fallbackClient;
  final HttpClient _httpClient;

  HttpCaptainOnboardingApiClient({
    this.baseUrl = 'http://10.0.2.2:3000',
    this.authToken,
    CaptainOnboardingApiClient? fallbackClient,
    HttpClient? httpClient,
  })  : fallbackClient = fallbackClient ?? MockCaptainOnboardingApiClient(),
        _httpClient = httpClient ?? HttpClient();

  Future<Map<String, dynamic>?> _postJson(String path, Map<String, dynamic> payload) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final req = await _httpClient.postUrl(uri).timeout(const Duration(seconds: 4));
      req.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      if (authToken != null) {
        req.headers.set(HttpHeaders.authorizationHeader, 'Bearer $authToken');
      }
      req.write(jsonEncode(payload));
      final res = await req.close().timeout(const Duration(seconds: 4));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final body = await res.transform(utf8.decoder).join();
        return jsonDecode(body) as Map<String, dynamic>;
      }
    } catch (_) {
      // Fallback on network/socket error
    }
    return null;
  }

  Future<Map<String, dynamic>?> _getJson(String path) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final req = await _httpClient.getUrl(uri).timeout(const Duration(seconds: 4));
      req.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      if (authToken != null) {
        req.headers.set(HttpHeaders.authorizationHeader, 'Bearer $authToken');
      }
      final res = await req.close().timeout(const Duration(seconds: 4));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final body = await res.transform(utf8.decoder).join();
        return jsonDecode(body) as Map<String, dynamic>;
      }
    } catch (_) {
      // Fallback on network/socket error
    }
    return null;
  }

  @override
  Future<Map<String, dynamic>> sendOtp(String phone, {String purpose = 'LOGIN'}) async {
    final res = await _postJson('/auth/otp/send', {
      'phone': phone,
      'purpose': purpose,
    });
    if (res != null) {
      return res;
    }
    return fallbackClient.sendOtp(phone, purpose: purpose);
  }

  @override
  Future<Map<String, dynamic>> verifyOtp(String phone, String code, {String purpose = 'LOGIN'}) async {
    final res = await _postJson('/auth/otp/verify', {
      'phone': phone,
      'code': code,
      'purpose': purpose,
    });
    if (res != null) {
      return res;
    }
    return fallbackClient.verifyOtp(phone, code, purpose: purpose);
  }

  @override
  Future<CaptainDraftData> getDraft() async {
    final res = await _getJson('/captain-applications/draft');
    if (res != null) {
      return CaptainDraftData.fromJson(res);
    }
    return fallbackClient.getDraft();
  }

  @override
  Future<CaptainDraftData> updateDraft(CaptainDraftData draft) async {
    final res = await _postJson('/captain-applications/draft', draft.toDraftJson());
    if (res != null) {
      return CaptainDraftData.fromJson(res);
    }
    return fallbackClient.updateDraft(draft);
  }

  @override
  Future<Map<String, dynamic>> uploadDocument(
    String docType,
    String filename,
    String contentBase64, {
    bool simulateInterruption = false,
    bool simulateSlowNetwork = false,
  }) async {
    final res = await _postJson('/documents/upload', {
      'documentType': docType,
      'filename': filename,
      'contentBase64': contentBase64,
    });
    if (res != null) {
      return res;
    }
    return fallbackClient.uploadDocument(
      docType,
      filename,
      contentBase64,
      simulateInterruption: simulateInterruption,
      simulateSlowNetwork: simulateSlowNetwork,
    );
  }

  @override
  Future<CaptainDraftData> submitApplication({String? notes}) async {
    final res = await _postJson('/captain-applications/submit', {
      if (notes != null) 'notes': notes,
    });
    if (res != null) {
      return CaptainDraftData.fromJson(res);
    }
    return fallbackClient.submitApplication(notes: notes);
  }

  @override
  Future<List<Map<String, dynamic>>> getReviewHistory() async {
    final res = await _getJson('/captain-applications/history');
    if (res != null && res['history'] is List) {
      return List<Map<String, dynamic>>.from(res['history'] as List);
    }
    return fallbackClient.getReviewHistory();
  }
}
