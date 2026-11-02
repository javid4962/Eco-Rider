import 'package:flutter/material.dart';
import 'core/localization/app_localizations.dart';
import 'core/localization/language_switcher.dart';
import 'core/localization/locale_controller.dart';
import 'features/onboarding/captain_application_status_card.dart';
import 'features/onboarding/captain_onboarding_flow.dart';

void main() {
  runApp(const EcoRideCaptainApp());
}

class EcoRideCaptainApp extends StatefulWidget {
  final LocaleController? controller;
  final Widget? home;

  const EcoRideCaptainApp({super.key, this.controller, this.home});

  static const Color primaryElectric = Color(0xFF059669);
  static const Color voltageNavy = Color(0xFF0B132B);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  State<EcoRideCaptainApp> createState() => _EcoRideCaptainAppState();
}

class _EcoRideCaptainAppState extends State<EcoRideCaptainApp> {
  late final LocaleController _controller;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? LocaleController();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        return MaterialApp(
          title: 'EcoRide Captain',
          locale: _controller.locale,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            FallbackMaterialLocalizationsDelegate(),
            FallbackWidgetsLocalizationsDelegate(),
            FallbackCupertinoLocalizationsDelegate(),
          ],
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            useMaterial3: true,
            scaffoldBackgroundColor: EcoRideCaptainApp.voltageNavy,
            colorScheme: ColorScheme.fromSeed(
              seedColor: EcoRideCaptainApp.primaryElectric,
              brightness: Brightness.dark,
              surface: EcoRideCaptainApp.surfaceNavy,
            ),
          ),
          home: widget.home ?? CaptainHomeScreen(controller: _controller),
        );
      },
    );
  }
}

class CaptainHomeScreen extends StatefulWidget {
  final LocaleController controller;

  const CaptainHomeScreen({super.key, required this.controller});

  @override
  State<CaptainHomeScreen> createState() => _CaptainHomeScreenState();
}

class _CaptainHomeScreenState extends State<CaptainHomeScreen> {
  bool isOnline = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appName),
        backgroundColor: const Color(0xFF0B132B),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.assignment_outlined, color: Colors.white),
            tooltip: l10n.captainOnboardingTitle,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (ctx) => CaptainOnboardingFlow(
                    localeController: widget.controller,
                    onFinished: () => Navigator.of(ctx).pop(),
                  ),
                ),
              );
            },
          ),
          LanguageSwitcherButton(controller: widget.controller),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                color: const Color(0xFF1C2541),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isOnline ? l10n.dutyActive : l10n.dutyOffline,
                            style: TextStyle(
                              color: isOnline ? const Color(0xFF10B981) : Colors.orangeAccent,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isOnline ? l10n.dutyActiveDesc : l10n.dutyOfflineDesc,
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                        ],
                      ),
                      Switch(
                        value: isOnline,
                        activeThumbColor: const Color(0xFF059669),
                        onChanged: (val) {
                          setState(() {
                            isOnline = val;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              CaptainApplicationStatusCard(
                status: isOnline ? CaptainAppStatus.approved : CaptainAppStatus.submitted,
                complianceStatus: isOnline ? CaptainComplianceStatus.verified : CaptainComplianceStatus.underReview,
                driverKycStatus: ReqVerificationStatus.approved,
                vehicleKycStatus: isOnline ? ReqVerificationStatus.approved : ReqVerificationStatus.pending,
                submissionAttempt: 1,
              ),
              const SizedBox(height: 16),
              Card(
                color: const Color(0xFF1C2541),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.battery_charging_full, color: Color(0xFF10B981)),
                          const SizedBox(width: 8),
                          Text(
                            l10n.evBatteryFeasibility,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        l10n.batterySocOptimal,
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l10n.batterySocMinWarning,
                        style: const TextStyle(color: Colors.white38, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                l10n.assignedPilotZone,
                style: const TextStyle(color: Colors.white54, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
