import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rider_app/core/localization/app_localizations.dart';
import 'package:rider_app/core/localization/locale_controller.dart';
import 'package:rider_app/main.dart';

void main() {
  group('Rider App Localization Tests (EV-021)', () {
    test('Default Telugu localization provides core strings in Telugu', () {
      final l10n = AppLocalizations(const Locale('te'));

      expect(l10n.appName, 'ఈకోరైడ్ రైడర్');
      expect(l10n.electricTag, '100% ఎలక్ట్రిక్');
      expect(l10n.whereTo, 'ఎక్కడికి వెళ్ళాలి?');
      expect(l10n.availableCategories, 'అందుబాటులో ఉన్న కేటగిరీలు (విడుదల A)');
      expect(l10n.cityCommuteTitle, 'నగర ప్రయాణం (ఈవీ బైక్ టాక్సీ)');
      expect(l10n.pickupLocation, 'పికప్ లొకేషన్');
      expect(l10n.dropoffLocation, 'డ్రాప్ లొకేషన్');
      expect(l10n.confirmRide, 'ఈవీ రైడ్ నిర్ధారించండి');
      expect(l10n.paymentMode, 'చెల్లింపు విధానం');
      expect(l10n.upiOrCash, 'UPI, కార్డ్ లేదా నగదు');
      expect(l10n.emergencySos, 'అత్యవసర SOS');
      expect(l10n.networkError, 'నెట్‌వర్క్ కనెక్షన్ లోపం. దయచేసి మొబైల్ డేటాను తనిఖీ చేయండి.');
    });

    test('English localization provides core strings and parameter interpolation', () {
      final l10n = AppLocalizations(const Locale('en'));

      expect(l10n.appName, 'EcoRide Rider');
      expect(l10n.electricTag, '100% ELECTRIC');
      expect(l10n.whereTo, 'Where to in AP?');
      expect(l10n.availableCategories, 'Available Categories (Release A)');
      expect(l10n.cityCommuteTitle, 'City Commute (EV Bike Taxi)');
      expect(l10n.captainAssigned('Ramesh'), 'EV Captain Ramesh is assigned and en route.');
      expect(l10n.fareEstimate('50'), 'Estimated Fare: ₹50');
      expect(l10n.emergencySos, 'Emergency SOS');
      expect(l10n.networkError, 'Network connection error. Please verify mobile data.');
    });

    test('Fallback mechanism returns English when Telugu translation is missing', () {
      final l10nTe = AppLocalizations(const Locale('te'));
      // A key not present in Telugu should gracefully fallback to English
      final result = l10nTe.translate('where_to');
      expect(result, isNotEmpty);

      // Unknown key falls back to key itself without exception
      final unknown = l10nTe.translate('non_existent_key_123');
      expect(unknown, 'non_existent_key_123');
    });

    test('LocaleController persists language selection', () {
      const testKey = 'test_rider_storage_persistence';
      final controller1 = LocaleController(storageKey: testKey);
      expect(controller1.languageCode, 'te'); // default

      // Switch to English
      controller1.setLocale(const Locale('en'));
      expect(controller1.languageCode, 'en');

      // New controller instance reads persisted language
      final controller2 = LocaleController(storageKey: testKey);
      expect(controller2.languageCode, 'en');

      // Toggle back to Telugu
      controller2.toggleLocale();
      expect(controller2.languageCode, 'te');

      final controller3 = LocaleController(storageKey: testKey);
      expect(controller3.languageCode, 'te');
    });

    testWidgets('Rider UI switches language dynamically and renders correctly', (tester) async {
      final controller = LocaleController(
        storageKey: 'test_widget_rider_toggle',
        initialLocale: const Locale('te'),
      );

      await tester.pumpWidget(EcoRideRiderApp(controller: controller));
      await tester.pumpAndSettle();

      // Verify Telugu UI elements
      expect(find.text('ఈకోరైడ్ రైడర్'), findsOneWidget);
      expect(find.text('100% ఎలక్ట్రిక్'), findsOneWidget);
      expect(find.text('ఎక్కడికి వెళ్ళాలి?'), findsOneWidget);
      expect(find.text('నగర ప్రయాణం (ఈవీ బైక్ టాక్సీ)'), findsOneWidget);

      // Toggle language via controller
      controller.setLocale(const Locale('en'));
      await tester.pumpAndSettle();

      // Verify English UI elements
      expect(find.text('EcoRide Rider'), findsOneWidget);
      expect(find.text('100% ELECTRIC'), findsOneWidget);
      expect(find.text('Where to in AP?'), findsOneWidget);
      expect(find.text('City Commute (EV Bike Taxi)'), findsOneWidget);
    });
  });
}

