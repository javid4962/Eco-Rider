// EcoRide Captain Phone Login & OTP Screen (EV-026)
// Handles +91 phone validation, mock/synthetic OTP verification, cooldown, and error displays.

import 'package:flutter/material.dart';
import '../../../core/localization/app_localizations.dart';
import '../controllers/captain_onboarding_controller.dart';

class CaptainPhoneLoginScreen extends StatefulWidget {
  final CaptainOnboardingController controller;

  const CaptainPhoneLoginScreen({
    super.key,
    required this.controller,
  });

  @override
  State<CaptainPhoneLoginScreen> createState() => _CaptainPhoneLoginScreenState();
}

class _CaptainPhoneLoginScreenState extends State<CaptainPhoneLoginScreen> {
  late final TextEditingController _phoneController;
  late final TextEditingController _otpController;

  static const Color electricGreen = Color(0xFF059669);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController(text: widget.controller.phone);
    _otpController = TextEditingController(text: widget.controller.otpCode);
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context);
        final controller = widget.controller;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Branding Header
              Center(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: electricGreen.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.electric_bolt,
                        size: 48,
                        color: electricGreen,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      l10n.appName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: electricGreen.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: electricGreen.withValues(alpha: 0.4)),
                      ),
                      child: Text(
                        l10n.electricTag,
                        style: const TextStyle(
                          color: electricGreen,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Instruction Text
              Text(
                controller.isOtpSent ? l10n.otpLabel : l10n.stepPhoneLogin,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                controller.isOtpSent
                    ? 'Enter the 6-digit verification code sent to ${controller.phone}'
                    : 'Enter your registered Indian mobile number to log in or register as an EV Captain.',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
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

              // Status Notification
              if (controller.statusMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: electricGreen.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: electricGreen.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle_outline, color: electricGreen, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          controller.statusMessage!,
                          style: const TextStyle(color: Color(0xFFA7F3D0), fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Phone Input Field
              Text(
                l10n.phoneNumberLabel,
                style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                enabled: !controller.isOtpSent && !controller.isLoading,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: InputDecoration(
                  hintText: '+919876543210',
                  hintStyle: const TextStyle(color: Colors.white30),
                  prefixIcon: const Icon(Icons.phone_android, color: electricGreen, size: 20),
                  filled: true,
                  fillColor: surfaceNavy,
                  errorText: controller.fieldErrors['phone'],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: electricGreen, width: 1.5),
                  ),
                ),
                onChanged: (val) => controller.setPhone(val),
              ),
              const SizedBox(height: 16),

              // OTP Input (Shown only when OTP sent)
              if (controller.isOtpSent) ...[
                Text(
                  l10n.otpLabel,
                  style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  style: const TextStyle(color: Colors.white, fontSize: 20, letterSpacing: 8, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: '123456',
                    counterText: '',
                    hintStyle: const TextStyle(color: Colors.white30, letterSpacing: 8),
                    prefixIcon: const Icon(Icons.lock_outline, color: electricGreen, size: 20),
                    filled: true,
                    fillColor: surfaceNavy,
                    errorText: controller.fieldErrors['otpCode'],
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: electricGreen, width: 1.5),
                    ),
                  ),
                  onChanged: (val) => controller.setOtpCode(val),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (controller.cooldownSeconds > 0)
                      Text(
                        l10n.resendInSeconds(controller.cooldownSeconds),
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                      )
                    else
                      TextButton(
                        onPressed: controller.isLoading ? null : () => controller.sendOtp(),
                        child: Text(
                          l10n.resendOtp,
                          style: const TextStyle(color: electricGreen, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    TextButton(
                      onPressed: controller.isLoading
                          ? null
                          : () {
                              controller.setPhone('');
                              controller.setOtpCode('');
                              // Re-render
                              setState(() {
                                _phoneController.clear();
                                _otpController.clear();
                              });
                            },
                      child: const Text('Change Number', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Action Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: controller.isLoading
                      ? null
                      : () {
                          if (controller.isOtpSent) {
                            controller.verifyOtp();
                          } else {
                            controller.sendOtp();
                          }
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
                          controller.isOtpSent ? l10n.verifyOtp : l10n.sendOtp,
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
}
