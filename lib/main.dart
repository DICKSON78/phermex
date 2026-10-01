import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'l10n/app_localizations.dart';
import 'services/api_service.dart';
import 'services/app_preferences.dart';
import 'services/offline_service.dart';
import 'services/push_service.dart';
import 'state/cart_state.dart';
import 'theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home_shell.dart';
import 'screens/profile/settings_screen.dart' as profile;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  OfflineService.init();
  final appPreferences = AppPreferences();
  await appPreferences.init();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: appPreferences),
        ChangeNotifierProvider(create: (_) => CartState()),
      ],
      child: const HelixApp(),
    ),
  );
}

class HelixApp extends StatelessWidget {
  const HelixApp({super.key});

  @override
  Widget build(BuildContext context) {
    final appPreferences = context.watch<AppPreferences>();
    AppLocalizations.currentLanguageCode = appPreferences.languageCode;
    return MaterialApp(
      title: 'Helix',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      navigatorKey: ApiService.navigatorKey,
      locale: appPreferences.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const SessionGate(),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const HomeShell(),
        '/settings': (_) => const profile.SettingsScreen(),
      },
    );
  }
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key});

  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    await ApiService.loadSession();
    if (ApiService.isLoggedIn) {
      // Best-effort FCM token registration; never blocks or crashes.
      await PushService.initPushNotifications();
    }
    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const Scaffold(
        backgroundColor: Color(0xFFF8F9FC),
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF0FD452)),
        ),
      );
    }
    return ApiService.isLoggedIn ? const HomeShell() : const LoginScreen();
  }
}
