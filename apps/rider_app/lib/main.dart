import 'package:flutter/material.dart';
import 'core/localization/app_localizations.dart';
import 'core/localization/locale_controller.dart';
import 'features/location_selection/controllers/location_selection_controller.dart';
import 'features/location_selection/screens/rider_map_home_screen.dart';
import 'features/location_selection/services/rider_location_api_client.dart';

void main() {
  runApp(const EcoRideRiderApp());
}

class EcoRideRiderApp extends StatefulWidget {
  final LocaleController? controller;
  final LocationSelectionController? locationController;

  const EcoRideRiderApp({
    super.key,
    this.controller,
    this.locationController,
  });

  static const Color primaryElectric = Color(0xFF059669);
  static const Color voltageNavy = Color(0xFF0B132B);
  static const Color surfaceNavy = Color(0xFF1C2541);

  @override
  State<EcoRideRiderApp> createState() => _EcoRideRiderAppState();
}

class _EcoRideRiderAppState extends State<EcoRideRiderApp> {
  late final LocaleController _controller;
  late final LocationSelectionController _locationController;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? LocaleController();
    _locationController = widget.locationController ??
        LocationSelectionController(
          apiClient: MockRiderLocationApiClient(),
        );
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
          localizationsDelegates: const [
            AppLocalizations.delegate,
            FallbackMaterialLocalizationsDelegate(),
            FallbackWidgetsLocalizationsDelegate(),
            FallbackCupertinoLocalizationsDelegate(),
          ],
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
          home: RiderMapHomeScreen(
            localeController: _controller,
            controller: _locationController,
          ),
        );
      },
    );
  }
}

/// Backward compatibility shim for RiderHomeScreen
class RiderHomeScreen extends StatelessWidget {
  final LocaleController controller;
  final LocationSelectionController? locationController;

  const RiderHomeScreen({
    super.key,
    required this.controller,
    this.locationController,
  });

  @override
  Widget build(BuildContext context) {
    return RiderMapHomeScreen(
      localeController: controller,
      controller: locationController ??
          LocationSelectionController(
            apiClient: MockRiderLocationApiClient(),
          ),
    );
  }
}
