import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
        content: Text(e.toString()),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passwordController.text != _confirmController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Passwords do not match'),
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
        content: Text(e.toString()),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(_step == 3 ? '' : 'Reset Password'),
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
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          Text(
            _step == 1 ? 'Forgot Password?' : 'Enter Reset Code',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.dark),
          ),
          const SizedBox(height: 8),
          Text(
            _step == 1
                ? "Enter your email or phone number and we'll send you a 6-digit reset code."
                : 'We sent a code to ${_maskedDestination ?? 'your email'}. Enter it below with your new password.',
            style: const TextStyle(fontSize: 13.5, color: _gray500, height: 1.5),
          ),
          const SizedBox(height: 28),
          if (_step == 1)
            TextFormField(
              controller: _identifierController,
              decoration: const InputDecoration(
                labelText: 'Email or phone',
                hintText: 'johndoe@example.com',
              ),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Please enter your email or phone' : null,
            )
          else ...[
            TextFormField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 20, letterSpacing: 10, fontWeight: FontWeight.w800),
              decoration: const InputDecoration(labelText: '6-digit code', hintText: '••••••'),
              validator: (v) => (v == null || v.trim().length != 6) ? 'Enter the 6-digit code' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _passwordController,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: 'New password',
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 20),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              validator: (v) => (v == null || v.length < 6) ? 'At least 6 characters' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _confirmController,
              obscureText: _obscure,
              decoration: const InputDecoration(labelText: 'Confirm new password'),
              validator: (v) => (v == null || v.isEmpty) ? 'Confirm your password' : null,
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
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.dark))
                  : Text(_step == 1 ? 'Send Reset Code' : 'Reset Password',
                      style: const TextStyle(color: AppTheme.dark, fontWeight: FontWeight.w700)),
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
                child: const Text('Wrong number or email? Go back',
                    style: TextStyle(fontSize: 12.5, color: _gray500)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSuccess() {
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
        const Text('Password Reset!',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.dark)),
        const SizedBox(height: 8),
        const Text('You can now sign in with your new password.',
            style: TextStyle(fontSize: 13.5, color: _gray500)),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Back to Sign In',
                style: TextStyle(color: AppTheme.dark, fontWeight: FontWeight.w700)),
          ),
        ),
      ],
    );
  }
}
