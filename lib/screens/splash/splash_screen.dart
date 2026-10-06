import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../services/app_preferences.dart';
import '../../services/push_service.dart';
import '../../theme.dart';
import '../auth/login_screen.dart';
import '../home_shell.dart';
import '../onboarding/onboarding_screen.dart';

/// Classic cold-start splash: the brand mark settles in over the sand
/// background while the local session and notifications are prepared, then the
/// app hands off to onboarding (first run), Home (signed in) or Login.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300),
  );
  late final Animation<double> _scale = CurvedAnimation(
    parent: _controller,
    curve: Curves.easeOutCubic,
  );

  @override
  void initState() {
    super.initState();
    _controller.forward();
    _prepare();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _prepare() async {
    await ApiService.loadSession();
    // Best-effort push registration. Runs before sign-in so a returning user
    // has their token set, but never blocks the first frame.
    await PushService.initPushNotifications();
    if (!mounted) return;
    await _controller.forward(from: 0);
    if (!mounted) return;
    continueToApp(context);
  }

  /// Picks the first screen after the splash (or after onboarding).
  static void continueToApp(BuildContext context) {
    final prefs = context.read<AppPreferences>();
    final Widget page = !prefs.onboardingDone
        ? const OnboardingScreen()
        : ApiService.isLoggedIn
            ? const HomeShell()
            : const LoginScreen();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => page),
    );
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.sand,
      body: FadeTransition(
        opacity: _scale,
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.92, end: 1).animate(_scale),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.asset(
                  'assets/images/helix_logo_new.png',
                  width: 170,
                  height: 170,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 22),
                Text(
                  L.t('appName'),
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.42,
                    color: AppColors.ink,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  L.t('splashTagline'),
                  style: const TextStyle(
                    fontSize: 12.5,
                    letterSpacing: 0.12,
                    color: AppColors.muted,
                    fontFamily: 'Poppins',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}