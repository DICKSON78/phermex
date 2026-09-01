import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../auth/login_screen.dart';
import '../notifications/notifications_screen.dart';
import '../prescriptions/prescriptions_screen.dart';
import '../support/support_screen.dart';
import 'address_book_screen.dart';

const String appVersion = '1.0.0';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _name;
  String? _phone;
  String? _email;
  String? _userCode;

  @override
  void initState() {
    super.initState();
    final user = ApiService.cachedUser;
    _name = user?['name'];
    _phone = user?['phone'];
    _email = user?['email'];
    _userCode = user?['user_code'];
    _refreshProfile();
  }

  Future<void> _refreshProfile() async {
    try {
      final user = await CustomerRepository.me();
      await ApiService.updateCachedUser(user);
      if (!mounted) return;
      _refreshFromCache();
    } catch (_) {}
  }

  void _refreshFromCache() {
    final user = ApiService.cachedUser;
    setState(() {
      _name = user?['name'];
      _phone = user?['phone'];
      _email = user?['email'];
      _userCode = user?['user_code'];
    });
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Log out'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Log out', style: TextStyle(color: Color(0xFFDC2626))),
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

  void _openEdit() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _EditProfileSheet(
        onSaved: () {
          _refreshFromCache();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final initial = _name != null && _name!.isNotEmpty ? _name![0].toUpperCase() : 'U';
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 32),
        children: [
          // User card
          Container(
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEEF1F0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(initial,
                      style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primaryDark)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(_name ?? 'Customer',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textDark)),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified,
                              size: 16, color: Color(0xFF1D9BF0)),
                        ],
                      ),
                      const SizedBox(height: 2),
                      const Text('Customer',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryDark)),
                      if (_email != null && _email!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(_email!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, color: Color(0xFF64748B))),
                      ],
                      if (_phone != null && _phone!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(_phone!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, color: Color(0xFF64748B))),
                      ],
                      if (_userCode != null && _userCode!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text('ID: $_userCode',
                              style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0CB843))),
                        ),
                      ],
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: _openEdit,
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.edit_outlined,
                        size: 18, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),

          // Menu section
          const _SectionTitle('Menu'),
          _MenuGroup([
            _MenuRow(
              icon: Icons.person_outline,
              label: 'Edit Profile',
              subtitle: 'Update your personal details',
              onTap: _openEdit,
            ),
            _MenuRow(
              icon: Icons.description_outlined,
              label: 'My Prescriptions',
              subtitle: 'Your uploaded prescriptions',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const PrescriptionsScreen()),
              ),
            ),
            _MenuRow(
              icon: Icons.notifications_none,
              label: 'Notifications',
              subtitle: 'Order updates & alerts',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              ),
            ),
            _MenuRow(
              icon: Icons.location_on_outlined,
              label: 'Saved Addresses',
              subtitle: 'Delivery addresses',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const AddressBookScreen()),
              ),
            ),
            _MenuRow(
              icon: Icons.support_agent,
              label: 'Support',
              subtitle: 'We usually reply within 24 hours',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SupportScreen()),
              ),
            ),
          ]),

          // Account action
          const _SectionTitle('Account'),
          _MenuGroup([
            _MenuRow(
              icon: Icons.logout,
              label: 'Log out',
              subtitle: 'Sign out of your account',
              destructive: true,
              onTap: _logout,
            ),
          ]),

          const SizedBox(height: 24),
          Center(
            child: Text('Helix v$appVersion',
                style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(title.toUpperCase(),
          style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Color(0xFF94A3B8),
              letterSpacing: 1)),
    );
  }
}

class _MenuGroup extends StatelessWidget {
  final List<Widget> rows;
  const _MenuGroup(this.rows);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Column(
        children: [
          for (int i = 0; i < rows.length; i++) ...[
            if (i > 0)
              Divider(height: 1, indent: 52, color: const Color(0xFFF1F5F9)),
            rows[i],
          ],
        ],
      ),
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
    final color = destructive ? const Color(0xFFDC2626) : AppTheme.primaryDark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.10),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label,
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: destructive
                                ? const Color(0xFFDC2626)
                                : AppTheme.textDark)),
                    if (subtitle.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(subtitle,
                          style: const TextStyle(
                              fontSize: 12, color: Color(0xFF64748B))),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right,
                  size: 22, color: Color(0xFFCBD5E1)),
            ],
          ),
        ),
      ),
    );
  }
}

class _EditProfileSheet extends StatefulWidget {
  final VoidCallback onSaved;
  const _EditProfileSheet({this.onSaved = _noop});

  static void _noop() {}

  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = ApiService.cachedUser;
    _nameController.text = user?['name'] ?? '';
    _phoneController.text = user?['phone'] ?? '';
    _emailController.text = user?['email'] ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      _showError('Name is required');
      return;
    }
    if (_passwordController.text.isNotEmpty &&
        _passwordController.text != _confirmController.text) {
      _showError('Passwords do not match');
      return;
    }
    setState(() => _saving = true);
    try {
      await CustomerRepository.updateProfile(
        name: name,
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        passwordConfirmation: _confirmController.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      widget.onSaved();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated successfully'),
          backgroundColor: AppTheme.dark,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      _showError(ApiService.friendlyError(e));
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: const Color(0xFFDC2626), behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: const Color(0xFFE5E7EB), borderRadius: BorderRadius.circular(4)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Edit Profile',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Full Name'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New Password (optional)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _confirmController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Confirm New Password'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                child: _saving
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
