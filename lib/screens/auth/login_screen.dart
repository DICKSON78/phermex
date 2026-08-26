import 'package:flutter/material.dart';
import '../../services/customer_repository.dart';
import '../home_shell.dart';
import 'forgot_password_screen.dart';

const Color _green = Color(0xFF0FD452);
const Color _ink = Color(0xFF000F14);
const Color _bg = Color(0xFFF8F9FC);
const Color _gray600 = Color(0xFF4B5563);
const Color _gray500 = Color(0xFF6B7280);
const Color _gray400 = Color(0xFF9CA3AF);
const Color _border = Color(0xFFE5E7EB);

class _SvgPath {
  _SvgPath(this._tokens);
  final List<String> _tokens;
  int _i = 0;

  static Path parse(String d) {
    final re = RegExp(r'[a-zA-Z]|[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?');
    final tokens = <String>[];
    for (final m in re.allMatches(d)) {
      tokens.add(m.group(0)!);
    }
    return _SvgPath(tokens)._build();
  }

  double _num() {
    final n = double.tryParse(_tokens[_i]);
    _i++;
    return n ?? 0;
  }

  Path _build() {
    final path = Path();
    double x = 0, y = 0;
    double lastCtrlX = 0, lastCtrlY = 0;
    bool lastWasCubic = false;
    String cmd = '';

    while (_i < _tokens.length) {
      final tok = _tokens[_i];
      if (tok.length == 1 && tok.contains(RegExp('[a-zA-Z]'))) {
        cmd = tok;
        _i++;
        if (cmd == 'Z' || cmd == 'z') {
          path.close();
          lastWasCubic = false;
          continue;
        }
      }

      switch (cmd) {
        case 'M':
          x = _num(); y = _num(); path.moveTo(x, y); cmd = 'L'; lastWasCubic = false;
          break;
        case 'm':
          x += _num(); y += _num(); path.moveTo(x, y); cmd = 'l'; lastWasCubic = false;
          break;
        case 'L':
          x = _num(); y = _num(); path.lineTo(x, y); lastWasCubic = false;
          break;
        case 'l':
          x += _num(); y += _num(); path.lineTo(x, y); lastWasCubic = false;
          break;
        case 'H':
          x = _num(); path.lineTo(x, y); lastWasCubic = false;
          break;
        case 'h':
          x += _num(); path.lineTo(x, y); lastWasCubic = false;
          break;
        case 'V':
          y = _num(); path.lineTo(x, y); lastWasCubic = false;
          break;
        case 'v':
          y += _num(); path.lineTo(x, y); lastWasCubic = false;
          break;
        case 'C': {
          final x1 = _num(), y1 = _num(), x2 = _num(), y2 = _num(), x3 = _num(), y3 = _num();
          path.cubicTo(x1, y1, x2, y2, x3, y3);
          lastCtrlX = x2; lastCtrlY = y2; lastWasCubic = true; x = x3; y = y3;
          break;
        }
        case 'c': {
          final x1 = x + _num(), y1 = y + _num(), x2 = x + _num(), y2 = y + _num(), x3 = x + _num(), y3 = y + _num();
          path.cubicTo(x1, y1, x2, y2, x3, y3);
          lastCtrlX = x2; lastCtrlY = y2; lastWasCubic = true; x = x3; y = y3;
          break;
        }
        case 'S': {
          final x1 = lastWasCubic ? 2 * x - lastCtrlX : x;
          final y1 = lastWasCubic ? 2 * y - lastCtrlY : y;
          final x2 = _num(), y2 = _num(), x3 = _num(), y3 = _num();
          path.cubicTo(x1, y1, x2, y2, x3, y3);
          lastCtrlX = x2; lastCtrlY = y2; lastWasCubic = true; x = x3; y = y3;
          break;
        }
        case 's': {
          final x1 = lastWasCubic ? 2 * x - lastCtrlX : x;
          final y1 = lastWasCubic ? 2 * y - lastCtrlY : y;
          final x2 = x + _num(), y2 = y + _num(), x3 = x + _num(), y3 = y + _num();
          path.cubicTo(x1, y1, x2, y2, x3, y3);
          lastCtrlX = x2; lastCtrlY = y2; lastWasCubic = true; x = x3; y = y3;
          break;
        }
      }
    }
    return path;
  }
}

class _GoogleG extends StatelessWidget {
  final double size;
  const _GoogleG({required this.size});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: const _GoogleGPainter()),
    );
  }
}

class _GoogleGPainter extends CustomPainter {
  const _GoogleGPainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 48);
    _paintPath(canvas, const Color(0xFF4285F4),
        'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z');
    _paintPath(canvas, const Color(0xFF34A853),
        'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z');
    _paintPath(canvas, const Color(0xFFFBBC05),
        'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z');
    _paintPath(canvas, const Color(0xFFEA4335),
        'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z');
  }

  void _paintPath(Canvas canvas, Color color, String pathData) {
    final paint = Paint()..color = color;
    canvas.drawPath(_SvgPath.parse(pathData), paint);
  }

  @override
  bool shouldRepaint(covariant _GoogleGPainter oldDelegate) => false;
}

class _BrandHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  const _BrandHeader({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: _green.withValues(alpha: 0.25),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipOval(
            child: Image.asset('assets/images/logo_circle.png', fit: BoxFit.cover),
          ),
        ),
        const SizedBox(height: 18),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(color: _ink, fontSize: 27, fontWeight: FontWeight.w800, letterSpacing: 0.3),
        ),
        const SizedBox(height: 7),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(color: _gray500, fontSize: 14),
        ),
      ],
    );
  }
}

InputDecoration _fieldDecoration({
  required String hint,
  required IconData icon,
  Widget? suffix,
}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(fontSize: 14, color: _gray400),
    prefixIcon: Icon(icon, size: 20, color: _gray400),
    suffixIcon: suffix,
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 17),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: _border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: _border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: _green, width: 1.5),
    ),
  );
}

class _PrimaryButton extends StatelessWidget {
  final bool loading;
  final String label;
  final VoidCallback onPressed;
  const _PrimaryButton({required this.loading, required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 54,
      width: double.infinity,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: _green,
          foregroundColor: _ink,
          elevation: 0,
          disabledBackgroundColor: _green.withValues(alpha: 0.5),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, letterSpacing: 0.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        child: loading
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5, color: _ink))
            : Text(label),
      ),
    );
  }
}

class _GoogleButton extends StatelessWidget {
  final VoidCallback onPressed;
  const _GoogleButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 54,
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: _gray600,
          backgroundColor: Colors.white,
          side: const BorderSide(color: _border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const _GoogleG(size: 20),
            const SizedBox(width: 10),
            const Text('Continue with Google'),
          ],
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  final String text;
  const _Divider(this.text);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: _border)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(text, style: const TextStyle(fontSize: 12, color: _gray400, fontWeight: FontWeight.w600)),
        ),
        const Expanded(child: Divider(color: _border)),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner(this.message);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Text(message, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _loginCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _loginCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _googleSignIn() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Google sign-in coming soon. Use email/password for now.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await CustomerRepository.login(_loginCtrl.text.trim(), _passwordCtrl.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeShell()),
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _BrandHeader(
                    title: 'Pharmex',
                    subtitle: 'Sign in to your account',
                  ),
                  const SizedBox(height: 30),
                  if (_error != null) ...[
                    _ErrorBanner(_error!),
                    const SizedBox(height: 14),
                  ],
                  TextField(
                    controller: _loginCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: _fieldDecoration(hint: 'Email or phone number', icon: Icons.mail_outline),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _passwordCtrl,
                    obscureText: _obscure,
                    onSubmitted: (_) => _submit(),
                    decoration: _fieldDecoration(
                      hint: 'Password',
                      icon: Icons.lock_outline,
                      suffix: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 20, color: _gray400),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                        );
                      },
                      style: TextButton.styleFrom(foregroundColor: _green, padding: EdgeInsets.zero),
                      child: const Text('Forgot Password?', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _PrimaryButton(loading: _loading, label: 'SIGN IN', onPressed: _submit),
                  const SizedBox(height: 20),
                  const _Divider('OR'),
                  const SizedBox(height: 20),
                  _GoogleButton(onPressed: _googleSignIn),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Don't have an account?", style: TextStyle(color: _gray500, fontSize: 14)),
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const RegisterScreen()),
                          );
                        },
                        child: const Text('Sign Up', style: TextStyle(fontWeight: FontWeight.w700, color: _green, fontSize: 14)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  void _googleSignIn() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Google sign-in coming soon. Use email/password for now.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _submit() async {
    if (_passwordCtrl.text != _confirmCtrl.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await CustomerRepository.register(
        name: _nameCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        password: _passwordCtrl.text,
        passwordConfirmation: _confirmCtrl.text,
      );
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const HomeShell()),
        (route) => false,
      );
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _BrandHeader(
                    title: 'Create Account',
                    subtitle: 'Create your account to start ordering',
                  ),
                  const SizedBox(height: 30),
                  if (_error != null) ...[
                    _ErrorBanner(_error!),
                    const SizedBox(height: 14),
                  ],
                  TextField(
                    controller: _nameCtrl,
                    decoration: _fieldDecoration(hint: 'Full name', icon: Icons.person_outline),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: _fieldDecoration(hint: 'Email address', icon: Icons.mail_outline),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: _fieldDecoration(hint: 'Phone number', icon: Icons.phone_outlined),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _passwordCtrl,
                    obscureText: _obscure,
                    decoration: _fieldDecoration(
                      hint: 'Password (min 8 chars)',
                      icon: Icons.lock_outline,
                      suffix: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 20, color: _gray400),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _confirmCtrl,
                    obscureText: _obscure,
                    onSubmitted: (_) => _submit(),
                    decoration: _fieldDecoration(hint: 'Confirm password', icon: Icons.lock_outline),
                  ),
                  const SizedBox(height: 20),
                  _PrimaryButton(loading: _loading, label: 'CREATE ACCOUNT', onPressed: _submit),
                  const SizedBox(height: 20),
                  const _Divider('OR'),
                  const SizedBox(height: 20),
                  _GoogleButton(onPressed: _googleSignIn),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text("Already have an account?", style: TextStyle(color: _gray500, fontSize: 14)),
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w700, color: _green, fontSize: 14)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
