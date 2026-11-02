// EcoRide Captain Personal Details Screen (EV-026)
// Captures driver KYC details, license numbers, emergency contacts, and operating city.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/captain_onboarding_controller.dart';
import '../widgets/ev_step_progress_bar.dart';

class CaptainPersonalDetailsScreen extends StatefulWidget {
  final CaptainOnboardingController controller;

  const CaptainPersonalDetailsScreen({
    super.key,
    required this.controller,
  });

  @override
  State<CaptainPersonalDetailsScreen> createState() => _CaptainPersonalDetailsScreenState();
}

class _CaptainPersonalDetailsScreenState extends State<CaptainPersonalDetailsScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _dobController;
  late final TextEditingController _dlNumberController;
  late final TextEditingController _dlExpiryController;
  late final TextEditingController _badgeController;
  late final TextEditingController _emergencyNameController;
  late final TextEditingController _emergencyPhoneController;

  static const Color electricGreen = Color(0xFF059669);
  static const Color surfaceNavy = Color(0xFF1C2541);

  final List<Map<String, String>> apCities = [
    {'value': 'visakhapatnam', 'label': 'Visakhapatnam'},
    {'value': 'vijayawada', 'label': 'Vijayawada'},
    {'value': 'tirupati', 'label': 'Tirupati'},
    {'value': 'amaravati', 'label': 'Amaravati'},
  ];

  @override
  void initState() {
    super.initState();
    final d = widget.controller.draft;
    _nameController = TextEditingController(text: d.fullName);
    _dobController = TextEditingController(text: d.dateOfBirth);
    _dlNumberController = TextEditingController(text: d.drivingLicenseNumber);
    _dlExpiryController = TextEditingController(text: d.drivingLicenseExpiry);
    _badgeController = TextEditingController(text: d.badgeNumber);
    _emergencyNameController = TextEditingController(text: d.emergencyContactName);
    _emergencyPhoneController = TextEditingController(text: d.emergencyContactPhone);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dobController.dispose();
    _dlNumberController.dispose();
    _dlExpiryController.dispose();
    _badgeController.dispose();
    _emergencyNameController.dispose();
    _emergencyPhoneController.dispose();
    super.dispose();
  }

  void _syncToController() {
    widget.controller.updatePersonalDetails(
      fullName: _nameController.text,
      dateOfBirth: _dobController.text,
      drivingLicenseNumber: _dlNumberController.text,
      drivingLicenseExpiry: _dlExpiryController.text,
      badgeNumber: _badgeController.text,
      emergencyContactName: _emergencyNameController.text,
      emergencyContactPhone: _emergencyPhoneController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context);
        final controller = widget.controller;

        return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          EvStepProgressBar(currentStep: controller.currentStep),
          const SizedBox(height: 20),

          Text(
            l10n.stepPersonal,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          const Text(
            'Enter your commercial driving license and identity details as per official government records.',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 20),

          // Error Notification
          if (controller.errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.redAccent.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      controller.errorMessage!,
                      style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Full Name
          _buildTextField(
            label: l10n.fullName,
            controller: _nameController,
            hint: 'Suresh Kumar',
            errorText: controller.fieldErrors['fullName'],
            onChanged: (val) => _syncToController(),
          ),
          const SizedBox(height: 14),

          // DOB & City in Row
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  label: l10n.dob,
                  controller: _dobController,
                  hint: '1992-05-15',
                  errorText: controller.fieldErrors['dateOfBirth'],
                  onChanged: (val) => _syncToController(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.selectCity,
                      style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: surfaceNavy,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: controller.draft.city,
                          isExpanded: true,
                          dropdownColor: surfaceNavy,
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                          items: apCities.map((c) {
                            return DropdownMenuItem<String>(
                              value: c['value'],
                              child: Text(c['label']!),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              widget.controller.updatePersonalDetails(city: val);
                            }
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Driving License Number
          _buildTextField(
            label: l10n.drivingLicenseNumber,
            controller: _dlNumberController,
            hint: 'AP31 20180004561',
            errorText: controller.fieldErrors['drivingLicenseNumber'],
            onChanged: (val) => _syncToController(),
          ),
          const SizedBox(height: 14),

          // Driving License Expiry & Commercial Badge
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  label: l10n.drivingLicenseExpiry,
                  controller: _dlExpiryController,
                  hint: '2030-05-14',
                  errorText: controller.fieldErrors['drivingLicenseExpiry'],
                  onChanged: (val) => _syncToController(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  label: l10n.badgeNumber,
                  controller: _badgeController,
                  hint: 'BDG-AP31-991',
                  onChanged: (val) => _syncToController(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Emergency Contact Name
          _buildTextField(
            label: l10n.emergencyContactName,
            controller: _emergencyNameController,
            hint: 'Lakshmi Kumar',
            errorText: controller.fieldErrors['emergencyContactName'],
            onChanged: (val) => _syncToController(),
          ),
          const SizedBox(height: 14),

          // Emergency Contact Phone
          _buildTextField(
            label: l10n.emergencyContactPhone,
            controller: _emergencyPhoneController,
            hint: '+919876543210',
            keyboardType: TextInputType.phone,
            errorText: controller.fieldErrors['emergencyContactPhone'],
            onChanged: (val) => _syncToController(),
          ),
          const SizedBox(height: 24),

          // Action Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: controller.isLoading
                  ? null
                  : () {
                      _syncToController();
                      controller.saveAndProceedPersonal();
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: electricGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: controller.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      l10n.saveAndContinue,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
      },
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    String? hint,
    String? errorText,
    TextInputType keyboardType = TextInputType.text,
    required ValueChanged<String> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white30, fontSize: 14),
            filled: true,
            fillColor: surfaceNavy,
            errorText: errorText,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: electricGreen, width: 1.5),
            ),
          ),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
