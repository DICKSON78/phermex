import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'l10n/app_localizations.dart';
import 'services/api_service.dart';
import 'services/consult_session.dart';
import 'services/app_preferences.dart';
import 'services/offline_service.dart';
import 'services/push_service.dart';
import 'state/cart_state.dart';
import 'theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home_shell.dart';
import 'screens/notifications/notifications_screen.dart';
import 'screens/orders/orders_list_screen.dart';
import 'screens/telemedicine/video_consult_view.dart';
import 'screens/profile/settings_screen.dart' as profile;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Every screen keeps the My Prescriptions green status bar with white
  // content, including routes pushed without an AppBar of their own.
  SystemChrome.setSystemUIOverlayStyle(AppUi.statusBar);
  // The app is portrait-only: the layouts are built for a tall phone and a
  // landscape reflow leaves fixed-height sections clipped. Updown is allowed so
  // the app stays usable if the phone is mounted upside down.
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  // Real system notifications (orders, incoming consult calls) and the
  // scheduled-consult reminders, plus the background FCM handler.
  await PushService.initLocalNotifications();
  FirebaseMessaging.onBackgroundMessage(
      firebaseMessagingBackgroundHandler);
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
      // Cap OS font scaling so large system text cannot overflow the fixed
      // padding and sizing the layouts rely on.
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        return MediaQuery(
          data: mq.copyWith(
            textScaler:
                mq.textScaler.clamp(minScaleFactor: 0.85, maxScaleFactor: 1.25),
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
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
        '/notifications': (_) => const NotificationsScreen(),
        '/orders': (_) => const OrdersListScreen(),
        '/consult': (args) => ConsultRoute(args: args),
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
    } else {
      // Notifications must be configured before the user signs in, otherwise
      // the first incoming call would be dropped.
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

/// Builds the consult screen from a notification tap payload.
///
/// A call push carries the room details directly, so the patient lands straight
/// in the call view without having to find the appointment themselves.
class ConsultRoute extends StatelessWidget {
  final Object? args;
  const ConsultRoute({super.key, this.args});

  @override
  Widget build(BuildContext context) {
    final data =
        args is Map ? Map<String, dynamic>.from(args as Map) : <String, dynamic>{};
    final session = ConsultSession.from(data);
    final name = '${data['pharmacy_name'] ?? data['pharmacyName'] ?? ''}';
    return VideoConsultView(
      roomUrl: session.roomUrl,
      jitsiServer: session.jitsiServer,
      roomCode: session.roomCode,
      pharmacyName: name,
      isLive: session.isLive,
    );
  }
}
