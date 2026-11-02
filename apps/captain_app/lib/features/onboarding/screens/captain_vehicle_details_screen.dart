// EcoRide Captain Vehicle Details Screen (EV-026)
// Enforces 100% Battery Electric Vehicles (BEV) only; captures EV specs and Green-Plate registration.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/captain_onboarding_controller.dart';
import '../models/captain_onboarding_model.dart';
import '../widgets/ev_step_progress_bar.dart';

class CaptainVehicleDetailsScreen extends StatefulWidget {
  final CaptainOnboardingController controller;

  const CaptainVehicleDetailsScreen({
    super.key,
    required this.controller,
  });

  @override
  State<CaptainVehicleDetailsScreen> createState() => _CaptainVehicleDetailsScreenState();
}

class _CaptainVehicleDetailsScreenState extends State<CaptainVehicleDetailsScreen> {
  late final TextEditingController _makeController;
  late final TextEditingController _modelController;
  late final TextEditingController _yearController;
  late final TextEditingController _regController;
  late final TextEditingController _batteryController;

  static const Color electricGreen = Color(0xFF059669);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  void initState() {
    super.initState();
    final d = widget.controller.draft;
    _makeController = TextEditingController(text: d.vehicleMake);
    _modelController = TextEditingController(text: d.vehicleModel);
    _yearController = TextEditingController(text: d.vehicleYear?.toString() ?? '2024');
    _regController = TextEditingController(text: d.vehicleRegistrationNumber);
    _batteryController = TextEditingController(text: d.batteryCapacityKwh?.toString() ?? '3.7');
  }

  @override
  void dispose() {
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _regController.dispose();
    _batteryController.dispose();
    super.dispose();
  }

  void _syncToController() {
    widget.controller.updateVehicleDetails(
      make: _makeController.text,
      model: _modelController.text,
      year: int.tryParse(_yearController.text),
      registrationNumber: _regController.text,
      batteryCapacityKwh: double.tryParse(_batteryController.text),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context);
        final controller = widget.controller;
        final draft = controller.draft;

        return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          EvStepProgressBar(currentStep: controller.currentStep),
          const SizedBox(height: 20),

          Text(
            l10n.stepVehicle,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          const Text(
            'EcoRide is an original EV-only platform. Only 100% Battery Electric Vehicles with AP Green Plates are permitted.',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 16),

          // 100% EV Mandatory Assurance Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: electricGreen.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: electricGreen.withValues(alpha: 0.4)),
            ),
            child: Row(
              children: [
                const Icon(Icons.bolt, color: electricGreen, size: 28),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.evOnlyAssurance,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l10n.nonEvWarning,
                        style: const TextStyle(color: Color(0xFFA7F3D0), fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Ownership Type Selection
          Text(
            l10n.vehicleOwnership,
            style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildOwnershipOption(
                label: l10n.vehicleOwnershipOwned,
                value: 'OWNED',
                isSelected: draft.vehicleOwnershipType == 'OWNED',
              ),
              const SizedBox(width: 8),
              _buildOwnershipOption(
                label: l10n.vehicleOwnershipFleet,
                value: 'FLEET_ASSIGNED',
                isSelected: draft.vehicleOwnershipType == 'FLEET_ASSIGNED',
              ),
              const SizedBox(width: 8),
              _buildOwnershipOption(
                label: l10n.vehicleOwnershipLeased,
                value: 'LEASED',
                isSelected: draft.vehicleOwnershipType == 'LEASED',
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Vehicle Category Selection
          Text(
            l10n.vehicleCategory,
            style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildCategoryOption(
                icon: Icons.two_wheeler,
                label: '2W EV',
                value: 'CITY_COMMUTE_2W',
                isSelected: draft.vehicleCategory == 'CITY_COMMUTE_2W',
              ),
              const SizedBox(width: 8),
              _buildCategoryOption(
                icon: Icons.electric_rickshaw,
                label: '3W Auto',
                value: 'AUTO_RICKSHAW_3W',
                isSelected: draft.vehicleCategory == 'AUTO_RICKSHAW_3W',
              ),
              const SizedBox(width: 8),
              _buildCategoryOption(
                icon: Icons.electric_car,
                label: '4W Cab',
                value: 'SEDAN_4W',
                isSelected: draft.vehicleCategory == 'SEDAN_4W',
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Make & Model
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  label: l10n.vehicleMake,
                  controller: _makeController,
                  hint: 'Ather Energy',
                  errorText: controller.fieldErrors['vehicleMake'],
                  onChanged: (val) => _syncToController(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  label: l10n.vehicleModel,
                  controller: _modelController,
                  hint: '450X Gen 3',
                  errorText: controller.fieldErrors['vehicleModel'],
                  onChanged: (val) => _syncToController(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Registration Plate
          _buildTextField(
            label: l10n.registrationNumber,
            controller: _regController,
            hint: 'AP31EV0001',
            errorText: controller.fieldErrors['vehicleRegistrationNumber'],
            onChanged: (val) => _syncToController(),
          ),
          const SizedBox(height: 14),

          // Battery Capacity (kWh) & Year
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  label: l10n.batteryCapacity,
                  controller: _batteryController,
                  hint: '3.7',
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  errorText: controller.fieldErrors['batteryCapacityKwh'],
                  onChanged: (val) => _syncToController(),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  label: l10n.vehicleYear,
                  controller: _yearController,
                  hint: '2024',
                  keyboardType: TextInputType.number,
                  onChanged: (val) => _syncToController(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Action Buttons
          Row(
            children: [
              OutlinedButton(
                onPressed: () => controller.goToStep(OnboardingStep.personalDetails),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white70,
                  side: const BorderSide(color: Colors.white24),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                child: Text(l10n.prevStep),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: controller.isLoading
                      ? null
                      : () {
                          _syncToController();
                          controller.saveAndProceedVehicle();
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: electricGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
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
        ],
      ),
    );
      },
    );
  }

  Widget _buildOwnershipOption({
    required String label,
    required String value,
    required bool isSelected,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          widget.controller.updateVehicleDetails(ownershipType: value);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? electricGreen.withValues(alpha: 0.2) : surfaceNavy,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? electricGreen : Colors.white12,
              width: 1.5,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? electricGreen : Colors.white70,
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryOption({
    required IconData icon,
    required String label,
    required String value,
    required bool isSelected,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          widget.controller.updateVehicleDetails(category: value);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? electricGreen.withValues(alpha: 0.2) : surfaceNavy,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? electricGreen : Colors.white12,
              width: 1.5,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? electricGreen : Colors.white70, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? electricGreen : Colors.white70,
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
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
