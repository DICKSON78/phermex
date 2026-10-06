import 'package:flutter/material.dart';

import 'package:provider/provider.dart';

import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../services/app_preferences.dart';
import '../../theme.dart';
import '../auth/login_screen.dart';
import '../home_shell.dart';

/// First-run introduction shown once per device, before sign-in. It finishes
/// by asking the user to sign in, so a returning user skips it entirely.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _page = PageController();
  int _index = 0;

  @override
  void dispose() {
    _page.dispose();
    super.dispose();
  }

  void _go(int target) {
    if (target >= 3) {
      _finish();
      return;
    }
    _page.animateToPage(
      target,
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
    );
  }

  void _finish() async {
    await context.read<AppPreferences>().setOnboardingDone();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ApiService.isLoggedIn
            ? const HomeShell()
            : const LoginScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final slides = [
      _SlideData(
        icon: Icons.local_pharmacy_rounded,
        title: L.t('onboarding.title1'),
        body: L.t('onboarding.body1'),
      ),
      _SlideData(
        icon: Icons.medication_rounded,
        title: L.t('onboarding.title2'),
        body: L.t('onboarding.body2'),
      ),
      _SlideData(
        icon: Icons.account_balance_wallet_rounded,
        title: L.t('onboarding.title3'),
        body: L.t('onboarding.body3'),
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.sand,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(0, 12, 20, 0),
                child: TextButton(
                  onPressed: () => _finish(),
                  child: Text(
                    L.t('onboarding.skip'),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.muted,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: PageView.builder(
                controller: _page,
                itemCount: slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (_, i) => _SlideView(data: slides[i]),
              ),
            ),
            _Dots(count: slides.length, active: _index),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
              child: SizedBox(
                height: 54,
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    if (_index == slides.length - 1) {
                      _finish();
                    } else {
                      _go(_index + 1);
                    }
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    textStyle: const TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  child: Text(
                    _index == slides.length - 1
                        ? L.t('onboarding.getStarted')
                        : L.t('onboarding.next'),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _SlideData {
  final IconData icon;
  final String title;
  final String body;
  const _SlideData({required this.icon, required this.title, required this.body});
}

class _SlideView extends StatelessWidget {
  final _SlideData data;
  const _SlideView({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 148,
            height: 148,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.line, width: 1.5),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 34,
                  offset: Offset(0, 14),
                ),
              ],
            ),
            child: Icon(data.icon, size: 62, color: AppTheme.primary),
          ),
          const SizedBox(height: 36),
          Text(
            data.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 23,
              fontWeight: FontWeight.w800,
              color: AppColors.ink,
              fontFamily: 'Poppins',
              height: 1.25,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            data.body,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 15,
              color: AppColors.muted,
              fontFamily: 'Poppins',
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  final int count;
  final int active;
  const _Dots({required this.count, required this.active});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final on = i == active;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          margin: const EdgeInsets.symmetric(horizontal: 5),
          width: on ? 26 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: on ? AppTheme.primary : AppColors.line,
            borderRadius: BorderRadius.circular(4),
          ),
        );
      }),
    );
  }
}