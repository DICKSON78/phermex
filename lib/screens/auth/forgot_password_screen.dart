import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _identifierController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  int _step = 1;
  bool _loading = false;
  bool _obscure = true;
  String? _maskedDestination;

  static const _gray500 = Color(0xFF6B7280);

  @override
  void dispose() {
    _identifierController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final res = await ApiService.post('/forgot-password', {
        'identifier': _identifierController.text.trim(),
      });
      final data = res is Map ? res['data'] : null;
      if (!mounted) return;
      setState(() {
        _step = 2;
        _loading = false;
        if (data is Map && data['sent_to'] != null) {
          _maskedDestination = data['sent_to'].toString();
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ApiService.friendlyError(e)),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passwordController.text != _confirmController.text) {
      final L = AppLocalizations.of(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(L.t('auth.passwordsMismatch')),
        backgroundColor: Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiService.post('/reset-password', {
        'identifier': _identifierController.text.trim(),
        'code': _codeController.text.trim(),
        'password': _passwordController.text,
        'password_confirmation': _confirmController.text,
      });
      if (!mounted) return;
      setState(() {
        _step = 3;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ApiService.friendlyError(e)),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(_step == 3 ? '' : L.t('auth.resetPassword')),
        backgroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: _step == 3 ? _buildSuccess() : _buildForm(),
        ),
      ),
    );
  }

  Widget _buildForm() {
    final L = AppLocalizations.of(context);
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          Text(
            _step == 1 ? L.t('auth.forgotPassword') : L.t('auth.enterResetCode'),
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.dark),
          ),
          const SizedBox(height: 8),
          Text(
            _step == 1
                ? L.t('auth.enterEmailOrPhone')
                : L.t('auth.codeSentTo')
                    .replaceFirst('%s', _maskedDestination ?? L.t('auth.yourEmail')),
            style: const TextStyle(fontSize: 13.5, color: _gray500, height: 1.5),
          ),
          const SizedBox(height: 28),
          if (_step == 1)
            TextFormField(
              controller: _identifierController,
              decoration: InputDecoration(
                labelText: L.t('auth.emailOrPhone'),
                hintText: 'johndoe@example.com',
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? L.t('auth.enterEmailOrPhone') : null,
            )
          else ...[
            TextFormField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 20, letterSpacing: 10, fontWeight: FontWeight.w800),
              decoration: InputDecoration(labelText: L.t('auth.sixDigitCode'), hintText: '••••••'),
              validator: (v) => (v == null || v.trim().length != 6) ? L.t('auth.enterSixDigitCode') : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _passwordController,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: L.t('auth.newPassword'),
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 20),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              validator: (v) => (v == null || v.length < 6) ? L.t('auth.atLeast6Chars') : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _confirmController,
              obscureText: _obscure,
              decoration: InputDecoration(labelText: L.t('auth.confirmNewPassword')),
              validator: (v) => (v == null || v.isEmpty) ? L.t('auth.confirmYourPassword') : null,
            ),
          ],
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _loading ? null : (_step == 1 ? _sendCode : _resetPassword),
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              child: _loading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_step == 1 ? L.t('auth.sendResetCode') : L.t('auth.resetPassword'),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 12),
          if (_step == 2)
            Center(
              child: TextButton(
                onPressed: _loading
                    ? null
                    : () => setState(() {
                          _step = 1;
                          _codeController.clear();
                        }),
                child: Text(L.t('auth.wrongNumberGoBack'),
                    style: TextStyle(fontSize: 12.5, color: _gray500)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSuccess() {
    final L = AppLocalizations.of(context);
    return Column(
      children: [
        const SizedBox(height: 60),
        Container(
          width: 88,
          height: 88,
          decoration: BoxDecoration(color: AppTheme.primary.withOpacity(.15), shape: BoxShape.circle),
          child: const Icon(Icons.check_circle_outline, size: 48, color: AppTheme.primary),
        ),
        const SizedBox(height: 24),
        Text(L.t('auth.passwordReset'),
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.dark)),
        const SizedBox(height: 8),
        Text(L.t('auth.passwordResetSuccess'),
            style: const TextStyle(fontSize: 13.5, color: _gray500)),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: Text(L.t('auth.backToSignIn'),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }
}
