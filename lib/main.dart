import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'services/push_service.dart';
import 'state/cart_state.dart';
import 'theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
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
    return MaterialApp(
      title: 'Helix',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      navigatorKey: ApiService.navigatorKey,
      home: const SessionGate(),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const HomeShell(),
      },
    );
  }
}

class _LaunchScreen extends StatelessWidget {
  final Animation<double> helixScale;
  final Animation<double> helixOpacity;
  final Animation<double> subtitleOpacity;
  const _LaunchScreen({
    required this.helixScale,
    required this.helixOpacity,
    required this.subtitleOpacity,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FadeTransition(
              opacity: helixOpacity,
              child: ScaleTransition(
                scale: helixScale,
                child: Column(
                  children: [
                    const Text(
                      'Helix',
                      style: TextStyle(
                        fontSize: 56,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0FD452),
                        fontFamily: 'Poppins',
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0FD452),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            FadeTransition(
              opacity: subtitleOpacity,
              child: const Text(
                'Medicine with Data',
                style: TextStyle(
                  fontSize: 15,
                  color: Color(0xFF6B7280),
                  fontFamily: 'Poppins',
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key});

  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> with TickerProviderStateMixin {
  bool _ready = false;
  bool _navigating = false;
  late final AnimationController _controller;
  late final Animation<double> _helixScale;
  late final Animation<double> _helixOpacity;
  late final Animation<double> _subtitleOpacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    );
    _helixScale = Tween<double>(begin: 0.75, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _helixOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _subtitleOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.35, 0.8, curve: Curves.easeOut)),
    );
    _load();
    _controller.forward().whenComplete(_navigate);
  }

  Future<void> _load() async {
    await ApiService.loadSession();
    if (ApiService.isLoggedIn) {
      // Best-effort FCM token registration; never blocks or crashes.
      await PushService.initPushNotifications();
    }
    setState(() => _ready = true);
  }

  void _navigate() {
    if (!mounted || _navigating) return;
    _navigating = true;
    if (ApiService.isLoggedIn) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeShell()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return _LaunchScreen(
        helixScale: _helixScale,
        helixOpacity: _helixOpacity,
        subtitleOpacity: _subtitleOpacity,
      );
    }
    return ApiService.isLoggedIn ? const HomeShell() : const LoginScreen();
  }
}
