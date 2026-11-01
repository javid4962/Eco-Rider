import 'package:flutter/material.dart';
import 'core/localization/app_localizations.dart';
import 'core/localization/language_switcher.dart';
import 'core/localization/locale_controller.dart';

void main() {
  runApp(const EcoRideRiderApp());
}

class EcoRideRiderApp extends StatefulWidget {
  final LocaleController? controller;

  const EcoRideRiderApp({super.key, this.controller});

  static const Color primaryElectric = Color(0xFF059669);
  static const Color voltageNavy = Color(0xFF0B132B);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  State<EcoRideRiderApp> createState() => _EcoRideRiderAppState();
}

class _EcoRideRiderAppState extends State<EcoRideRiderApp> {
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
          title: 'EcoRide Rider',
          locale: _controller.locale,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [AppLocalizations.delegate],
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            useMaterial3: true,
            scaffoldBackgroundColor: EcoRideRiderApp.voltageNavy,
            colorScheme: ColorScheme.fromSeed(
              seedColor: EcoRideRiderApp.primaryElectric,
              brightness: Brightness.dark,
              surface: EcoRideRiderApp.surfaceNavy,
            ),
          ),
          home: RiderHomeScreen(controller: _controller),
        );
      },
    );
  }
}

class RiderHomeScreen extends StatelessWidget {
  final LocaleController controller;

  const RiderHomeScreen({super.key, required this.controller});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appName),
        backgroundColor: const Color(0xFF0B132B),
        elevation: 0,
        actions: [
          LanguageSwitcherButton(controller: controller),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF059669),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              l10n.electricTag,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            l10n.pilotCorridor,
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        l10n.whereTo,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                l10n.availableCategories,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 8),
              ListTile(
                tileColor: const Color(0xFF1C2541),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                leading: const Icon(Icons.electric_scooter, color: Color(0xFF059669)),
                title: Text(l10n.cityCommuteTitle, style: const TextStyle(color: Colors.white)),
                subtitle: Text(l10n.cityCommuteSubtitle, style: const TextStyle(color: Colors.white60)),
                trailing: const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
