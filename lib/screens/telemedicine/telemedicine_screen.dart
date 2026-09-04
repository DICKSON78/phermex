import 'package:flutter/material.dart';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';

/// Telemedicine flow: requests a video consultation with a pharmacy and joins
/// the Jitsi room. Supports starting a new consult or rejoining an active one.
class TelemedicineScreen extends StatefulWidget {
  final int? pharmacyId;
  final String? pharmacyName;

  const TelemedicineScreen({super.key, this.pharmacyId, this.pharmacyName});

  @override
  State<TelemedicineScreen> createState() => _TelemedicineScreenState();
}

class _TelemedicineScreenState extends State<TelemedicineScreen> {
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _session;
  final _jitsi = JitsiMeet();

  @override
  void initState() {
    super.initState();
    if (widget.pharmacyId != null) {
      _request();
    } else {
      _rejoin();
    }
  }

  Future<void> _request() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final session = await CustomerRepository.requestTelemedicine(widget.pharmacyId!);
      if (!mounted) return;
      setState(() {
        _session = session;
        _loading = false;
      });
      _join(session);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ApiService.friendlyError(e);
      });
    }
  }

  Future<void> _rejoin() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final session = await CustomerRepository.activeTelemedicine();
      if (!mounted) return;
      setState(() {
        _session = session;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ApiService.friendlyError(e);
      });
    }
  }

  Future<void> _join(Map<String, dynamic> session) async {
    final room = (session['room_code'] ?? '').toString();
    if (room.isEmpty) return;
    final server = (session['jitsi_server'] ?? 'https://meet.jit.si').toString();

    final options = JitsiMeetConferenceOptions(
      serverURL: server,
      room: room,
      userInfo: JitsiMeetUserInfo(
        displayName: _userName,
        email: ApiService.cachedUser?['email']?.toString(),
      ),
      featureFlags: const {
        'call-integration.enabled': false,
        'chat.enabled': true,
        'raise-hand.enabled': false,
        'toolbox.alwaysVisible': false,
      },
    );

    try {
      await _jitsi.join(options, JitsiMeetEventListener(conferenceTerminated: (_, __) {
      if (mounted) Navigator.of(context).pop();
    }));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not start video. ${ApiService.friendlyError(e)}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _cancel() async {
    if (_session == null) return;
    setState(() => _loading = true);
    try {
      await CustomerRepository.cancelTelemedicine(_session!['id']);
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: const Text('Video Consult'), backgroundColor: Colors.white),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _ErrorView(message: _error!, onRetry: _rejoin)
              : _session == null
                  ? const Center(child: Text('No active consultation'))
                  : _buildWaiting(context),
    );
  }

  Widget _buildWaiting(BuildContext context) {
    final session = _session!;
    final status = (session['status'] ?? 'requested').toString();
    final live = status == 'live';
    final pharmacyName = (session['pharmacy'] is Map
            ? session['pharmacy']['pharmacy_name']
            : widget.pharmacyName) ??
        'Pharmacy';

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.videocam, size: 44, color: AppTheme.primaryDark),
          ),
          const SizedBox(height: 20),
          Text(live ? 'Consultation Live' : 'Consultation Requested',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
          const SizedBox(height: 8),
          Text(
            live ? 'You are in a live consultation with $pharmacyName.' : 'Waiting for the pharmacist at $pharmacyName to join…',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () => _join(session),
              icon: Icon(live ? Icons.videocam : Icons.call, size: 20, color: Colors.white),
              label: Text(live ? 'Join Live Video' : 'Join / Rejoin Room',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _cancel,
            child: const Text('End Consultation',
                style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

String get _userName => ApiService.userName?.split(' ').first.isNotEmpty == true
        ? ApiService.userName!
        : 'Customer';

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_off_outlined, size: 48, color: Color(0xFFD1D5DB)),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}