import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../auth/login_screen.dart';
import '../notifications/notifications_screen.dart';
import '../prescriptions/prescriptions_screen.dart';
import '../support/support_screen.dart';

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
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
            child: Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppTheme.primary, AppTheme.primaryDark],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  alignment: Alignment.center,
                  child: Text(initial,
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.dark)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_name ?? 'Customer',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                      if (_email != null)
                        Text(_email!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                      if (_phone != null)
                        Text(_phone!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (_userCode != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  const Icon(Icons.badge_outlined, size: 14, color: Color(0xFF9CA3AF)),
                  const SizedBox(width: 6),
                  Text('Customer ID: $_userCode',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // Menu
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFEEF1F0)),
              ),
              child: Column(
                children: [
                  _MenuTile(
                    icon: Icons.edit_outlined,
                    label: 'Edit Profile',
                    onTap: _openEdit,
                  ),
                  const Divider(height: 1, indent: 56),
                  _MenuTile(
                    icon: Icons.description_outlined,
                    label: 'My Prescriptions',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const PrescriptionsScreen()),
                    ),
                  ),
                  const Divider(height: 1, indent: 56),
                  _MenuTile(
                    icon: Icons.notifications_none,
                    label: 'Notifications',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                    ),
                  ),
                  const Divider(height: 1, indent: 56),
                  _MenuTile(
                    icon: Icons.support_agent,
                    label: 'Support',
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SupportScreen()),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Logout
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SizedBox(
              height: 48,
              child: OutlinedButton(
                onPressed: _logout,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFDC2626),
                  side: const BorderSide(color: Color(0xFFFECACA)),
                  backgroundColor: const Color(0xFFFEF2F2),
                ),
                child: const Text('Log out'),
              ),
            ),
          ),

          const SizedBox(height: 30),
          const Center(
            child: Text('Pharmex v1.0.0',
                style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MenuTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppTheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
            ),
            const Icon(Icons.chevron_right, size: 18, color: Color(0xFFD1D5DB)),
          ],
        ),
      ),
    );
  }
}

class _EditProfileSheet extends StatefulWidget {
  final VoidCallback onSaved;
  const _EditProfileSheet({required this.onSaved});

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
      _showError(e.toString());
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
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.dark),
                      )
                    : const Text('Save Changes', style: TextStyle(color: AppTheme.dark, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
