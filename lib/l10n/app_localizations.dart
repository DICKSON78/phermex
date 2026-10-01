import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'strings_auth.dart';
import 'strings_core.dart';
import 'strings_misc.dart';
import 'strings_orders_health.dart';
import 'strings_shop.dart';

class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static AppLocalizations of(BuildContext context) =>
      Localizations.of<AppLocalizations>(context, AppLocalizations)!;

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static const List<Locale> supportedLocales = [Locale('en'), Locale('sw')];

  static const List<String> supportedLanguageCodes = ['en', 'sw'];

  static Map<String, String>? _en;
  static Map<String, String>? _sw;

  static String _currentLanguageCode = 'en';
  static String get currentLanguageCode => _currentLanguageCode;
  static set currentLanguageCode(String value) => _currentLanguageCode = value;

  static void _ensureLoaded() {
    if (_en != null) return;
    _en = {
      ...coreEnStrings,
      ...authEnStrings,
      ...shopEnStrings,
      ...ordersHealthEnStrings,
      ...miscEnStrings,
    };
    _sw = {
      ...coreSwStrings,
      ...authSwStrings,
      ...shopSwStrings,
      ...ordersHealthSwStrings,
      ...miscSwStrings,
    };
  }

  String get languageCode => locale.languageCode;

  bool get isSwahili => languageCode == 'sw';

  String t(String key) {
    _ensureLoaded();
    return (languageCode == 'sw' ? _sw : _en)![key] ?? _en![key] ?? key;
  }

  static String tr(String key) {
    _ensureLoaded();
    return (_currentLanguageCode == 'sw' ? _sw : _en)![key] ?? _en![key] ?? key;
  }
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      AppLocalizations.supportedLocales.any(
        (l) => l.languageCode == locale.languageCode,
      );

  @override
  Future<AppLocalizations> load(Locale locale) =>
      SynchronousFuture<AppLocalizations>(AppLocalizations(locale));

  @override
  bool shouldReload(covariant _AppLocalizationsDelegate old) => false;
}