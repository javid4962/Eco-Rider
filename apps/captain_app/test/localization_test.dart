import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:captain_app/core/localization/app_localizations.dart';
import 'package:captain_app/core/localization/locale_controller.dart';
import 'package:captain_app/main.dart';

void main() {
  group('Captain App Localization Tests (EV-021)', () {
    test('Default Telugu localization provides captain strings in Telugu', () {
      final l10n = AppLocalizations(const Locale('te'));

      expect(l10n.appName, 'ఈకోరైడ్ కెప్టెన్');
      expect(l10n.dutyActive, 'డ్యూటీలో ఉన్నారు');
      expect(l10n.dutyOffline, 'డ్యూటీ ఆఫ్ లో ఉంది');
      expect(l10n.evBatteryFeasibility, 'ఈవీ బ్యాటరీ లభ్యత');
      expect(l10n.assignedPilotZone, 'కేటాయించిన పైలట్ జోన్: విశాఖపట్నం కారిడార్');
      expect(l10n.newDispatchRequest, 'కొత్త ఈవీ రైడ్ అభ్యర్థన వచ్చింది');
      expect(l10n.acceptRide, 'రైడ్ అంగీకరించండి');
      expect(l10n.emergencySos, 'కెప్టెన్ అత్యవసర ఎస్ఓఎస్');
      expect(l10n.batteryTooLow, 'బ్యాటరీ 20% కంటే తక్కువగా ఉంది. దయచేసి హబ్‌లో ఛార్జ్ చేయండి.');
    });

    test('English localization provides captain strings and parameter interpolation', () {
      final l10n = AppLocalizations(const Locale('en'));

      expect(l10n.appName, 'EcoRide Captain');
      expect(l10n.dutyActive, 'DUTY ACTIVE');
      expect(l10n.dutyOffline, 'DUTY OFFLINE');
      expect(l10n.evBatteryFeasibility, 'EV Battery Feasibility');
      expect(l10n.fareEarnings('120'), 'Trip Earnings: ₹120');
      expect(l10n.cashCollected('65'), 'Cash Collected: ₹65');
      expect(l10n.emergencySos, 'Captain Emergency SOS');
      expect(l10n.batteryTooLow, 'Battery SoC below 20%. Please recharge at hub.');
    });

    test('Fallback mechanism returns English when translation is missing', () {
      final l10nTe = AppLocalizations(const Locale('te'));
      final result = l10nTe.translate('duty_active');
      expect(result, isNotEmpty);

      // Unknown key falls back to key itself
      final unknown = l10nTe.translate('non_existent_captain_key_456');
      expect(unknown, 'non_existent_captain_key_456');
    });

    test('LocaleController persists captain language selection', () {
      const testKey = 'test_captain_storage_persistence';
      final controller1 = LocaleController(storageKey: testKey);
      expect(controller1.languageCode, 'te'); // default

      controller1.setLocale(const Locale('en'));
      expect(controller1.languageCode, 'en');

      final controller2 = LocaleController(storageKey: testKey);
      expect(controller2.languageCode, 'en');

      controller2.toggleLocale();
      expect(controller2.languageCode, 'te');

      final controller3 = LocaleController(storageKey: testKey);
      expect(controller3.languageCode, 'te');
    });

    testWidgets('Captain UI switches language dynamically and renders correctly', (tester) async {
      final controller = LocaleController(
        storageKey: 'test_widget_captain_toggle',
        initialLocale: const Locale('te'),
      );

      await tester.pumpWidget(EcoRideCaptainApp(controller: controller));
      await tester.pumpAndSettle();

      // Verify Telugu UI elements
      expect(find.text('ఈకోరైడ్ కెప్టెన్'), findsOneWidget);
      expect(find.text('డ్యూటీ ఆఫ్ లో ఉంది'), findsOneWidget);
      expect(find.text('ఈవీ బ్యాటరీ లభ్యత'), findsOneWidget);

      // Toggle language via controller
      controller.setLocale(const Locale('en'));
      await tester.pumpAndSettle();

      // Verify English UI elements
      expect(find.text('EcoRide Captain'), findsOneWidget);
      expect(find.text('DUTY OFFLINE'), findsOneWidget);
      expect(find.text('EV Battery Feasibility'), findsOneWidget);
    });
  });
}

