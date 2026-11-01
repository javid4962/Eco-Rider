import 'package:flutter/material.dart';

/// Manages and persists active commuter language (Telugu vs English).
class LocaleController extends ChangeNotifier {
  static const String defaultLocaleCode = 'te'; // Telugu default for Andhra Pradesh
  static const String fallbackLocaleCode = 'en';

  static final Map<String, String> _storage = {};

  final String _storageKey;
  Locale _locale;

  LocaleController({String storageKey = 'ecoride_rider_locale', Locale? initialLocale})
      : _storageKey = storageKey,
        _locale = initialLocale ??
            Locale(_storage[storageKey] ?? defaultLocaleCode);

  Locale get locale => _locale;
  String get languageCode => _locale.languageCode;
  bool get isTelugu => _locale.languageCode == 'te';
  bool get isEnglish => _locale.languageCode == 'en';

  /// Update language and persist choice across widget rebuilds and app lifecycle
  void setLocale(Locale newLocale) {
    if (_locale.languageCode == newLocale.languageCode) return;
    _locale = newLocale;
    _storage[_storageKey] = newLocale.languageCode;
    notifyListeners();
  }

  /// Toggle between English and Telugu
  void toggleLocale() {
    if (isTelugu) {
      setLocale(const Locale('en'));
    } else {
      setLocale(const Locale('te'));
    }
  }
}

