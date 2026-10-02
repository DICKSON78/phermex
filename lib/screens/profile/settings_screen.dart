import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../services/app_preferences.dart';
import '../../theme.dart';
import '../auth/login_screen.dart';
import '../auth/forgot_password_screen.dart';
import 'legal_document_screen.dart';

const String appVersion = '1.0.0';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Future<void> _changeLanguage() async {
    final L = AppLocalizations.of(context);
    final prefs = context.read<AppPreferences>();
    final code = await showDialog<String>(
      context: context,
      builder: (ctx) {
        final selected = prefs.languageCode;
        return AlertDialog(
          title: Text(
            L.t('selectLanguage'),
            style: const TextStyle(fontFamily: 'Poppins'),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _LanguageOption(
                label: L.t('english'),
                selected: selected == 'en',
                onTap: () => Navigator.pop(ctx, 'en'),
              ),
              _LanguageOption(
                label: L.t('swahili'),
                selected: selected == 'sw',
                onTap: () => Navigator.pop(ctx, 'sw'),
              ),
              const SizedBox(height: 4),
              Text(
                L.t('languageSyncedNote'),
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.muted,
                  fontFamily: 'Poppins',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                L.t('cancel'),
                style: const TextStyle(fontFamily: 'Poppins'),
              ),
            ),
          ],
        );
      },
    );
    if (code == null || !mounted) return;
    final synced = await prefs.setLanguage(code);
    if (!mounted) return;
    _showSaved(synced);
  }

  Future<void> _toggleNotification(String key, bool value) async {
    final synced = await context.read<AppPreferences>().setNotificationPref(
      key,
      value,
    );
    if (!mounted) return;
    _showSaved(synced);
  }

  Future<void> _logout() async {
    final L = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          L.t('logOut'),
          style: const TextStyle(fontFamily: 'Poppins'),
        ),
        content: Text(
          L.t('logoutConfirm'),
          style: const TextStyle(fontFamily: 'Poppins'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              L.t('cancel'),
              style: const TextStyle(fontFamily: 'Poppins'),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              L.t('logOut'),
              style: const TextStyle(
                color: Color(0xFFDC2626),
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ApiService.post('/logout', {});
    } catch (_) {}
    await ApiService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => route.isFirst,
    );
  }

  void _showSaved(bool syncedToServer) {
    final L = AppLocalizations.of(context);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            syncedToServer ? L.t('savedToAccount') : L.t('savedLocally'),
            style: const TextStyle(fontFamily: 'Poppins'),
          ),
          duration: const Duration(seconds: 2),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final prefs = context.watch<AppPreferences>();
    final name = (ApiService.userName ?? '').trim();
    final email = (ApiService.userEmail ?? '').trim();
    final notif = prefs.notificationPrefs;
    final pushEnabled = notif['push_enabled'] ?? true;

    return Scaffold(
      appBar: AppBar(
        title: Text(L.t('settings')),
        backgroundColor: Colors.white,
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Color(0xFF0F2A1E),
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 8),
          if (name.isNotEmpty || email.isNotEmpty) ...[
            _accountCard(name: name, email: email),
            const SizedBox(height: 20),
          ],

          _sectionLabel(L.t('preferences')),
          const SizedBox(height: 8),
          _settingCard(
            children: [
              _MenuRow(
                icon: Icons.language_outlined,
                label: L.t('language'),
                subtitle: prefs.languageCode == 'sw'
                    ? L.t('swahili')
                    : L.t('english'),
                onTap: _changeLanguage,
              ),
            ],
          ),

          const SizedBox(height: 20),
          _sectionLabel(L.t('notifications')),
          const SizedBox(height: 8),
          _settingCard(
            children: [
              _ToggleRow(
                icon: Icons.notifications_active_outlined,
                label: L.t('pushNotifications'),
                value: pushEnabled,
                enabled: true,
                onChanged: (v) => _toggleNotification('push_enabled', v),
              ),
              const _Divider(),
              _ToggleRow(
                icon: Icons.receipt_long_outlined,
                label: L.t('orderUpdates'),
                value: notif['order_updates'] ?? true,
                enabled: pushEnabled,
                onChanged: (v) => _toggleNotification('order_updates', v),
              ),
              const _Divider(),
              _ToggleRow(
                icon: Icons.percent_rounded,
                label: L.t('offersPromotions'),
                value: notif['offers_promotions'] ?? true,
                enabled: pushEnabled,
                onChanged: (v) => _toggleNotification('offers_promotions', v),
              ),
              const _Divider(),
              _ToggleRow(
                icon: Icons.favorite_outline_rounded,
                label: L.t('healthTips'),
                value: notif['health_tips'] ?? true,
                enabled: pushEnabled,
                onChanged: (v) => _toggleNotification('health_tips', v),
              ),
            ],
          ),

          const SizedBox(height: 20),
          _sectionLabel(L.t('account')),
          const SizedBox(height: 8),
          _settingCard(
            children: [
              _MenuRow(
                icon: Icons.lock_outline,
                label: L.t('changePassword'),
                subtitle: L.t('resetSignInPassword'),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ForgotPasswordScreen(),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          _sectionLabel(L.t('legal')),
          const SizedBox(height: 8),
          _settingCard(
            children: [
              _MenuRow(
                icon: Icons.privacy_tip_outlined,
                label: L.t('privacyPolicy'),
                subtitle: L.t('howWeUseData'),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const LegalDocumentScreen(
                      document: LegalDocument.privacy,
                    ),
                  ),
                ),
              ),
              const _Divider(),
              _MenuRow(
                icon: Icons.description_outlined,
                label: L.t('termsOfService'),
                subtitle: L.t('appUsageTerms'),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const LegalDocumentScreen(
                      document: LegalDocument.terms,
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          _sectionLabel(L.t('session')),
          const SizedBox(height: 8),
          _settingCard(
            children: [
              _MenuRow(
                icon: Icons.logout_rounded,
                label: L.t('logOut'),
                subtitle: L.t('signOutOfAccount'),
                destructive: true,
                onTap: _logout,
              ),
            ],
          ),

          const SizedBox(height: 24),
          Center(
            child: Text(
              'v$appVersion',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.muted,
                fontFamily: 'Poppins',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.muted,
        fontFamily: 'Poppins',
      ),
    );
  }

  Widget _accountCard({required String name, required String email}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.brand600,
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w800,
                fontFamily: 'Poppins',
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name.isNotEmpty ? name : 'Helix',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                    fontFamily: 'Poppins',
                  ),
                ),
                if (email.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: AppColors.muted,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _settingCard({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(children: children),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final bool destructive;
  final VoidCallback onTap;
  const _MenuRow({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
    this.destructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = destructive ? const Color(0xFFDC2626) : AppColors.brand700;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: destructive
                      ? const Color(0xFFFEF2F2)
                      : AppColors.mint50,
                  border: Border.all(
                    color: destructive
                        ? const Color(0xFFFECACA)
                        : AppColors.line,
                  ),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: destructive
                            ? const Color(0xFFDC2626)
                            : AppColors.ink,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.muted,
                        fontFamily: 'Poppins',
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, size: 16, color: AppColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool value;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  const _ToggleRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.enabled,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? () => onChanged(!value) : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.mint50,
                  border: Border.all(color: AppColors.line),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, size: 16, color: AppColors.brand700),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: enabled ? AppColors.ink : AppColors.muted,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
              Theme(
                data: Theme.of(context).copyWith(
                  switchTheme: SwitchThemeData(
                    thumbColor: WidgetStateProperty.resolveWith(
                      (states) => states.contains(WidgetState.selected)
                          ? Colors.white
                          : AppColors.muted,
                    ),
                    trackColor: WidgetStateProperty.resolveWith(
                      (states) => states.contains(WidgetState.selected)
                          ? AppColors.brand500
                          : AppColors.line,
                    ),
                  ),
                ),
                child: Switch(
                  value: value,
                  onChanged: enabled ? (v) => onChanged(v) : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      color: AppColors.line,
      margin: const EdgeInsets.symmetric(horizontal: 14),
    );
  }
}

class _LanguageOption extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _LanguageOption({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                  fontFamily: 'Poppins',
                ),
              ),
              const Spacer(),
              if (selected)
                const Icon(
                  Icons.check_circle,
                  color: AppColors.brand600,
                  size: 20,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
