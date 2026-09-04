import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import 'book_consult_screen.dart';
import 'video_consult_view.dart';

/// Telemedicine hub: pharmacist <-> patient communication.
/// Shows the patient's consultations (live, upcoming, past) and lets them pick a
/// pharmacy to either book a scheduled appointment or start an instant video call.
class TelemedicineScreen extends StatefulWidget {
  final int? pharmacyId;
  final String? pharmacyName;

  const TelemedicineScreen({super.key, this.pharmacyId, this.pharmacyName});

  @override
  State<TelemedicineScreen> createState() => _TelemedicineScreenState();
}

class _TelemedicineScreenState extends State<TelemedicineScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _records = [];

  Map<String, dynamic>? _active;
  List<Map<String, dynamic>> _upcoming = [];
  List<Map<String, dynamic>> _history = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final records = await CustomerRepository.telemedicineAppointments();
      if (!mounted) return;
      final live = records.where((r) => (r['status'] ?? '').toString() == 'live').toList();
      final upcoming = records
          .where((r) {
            final s = (r['status'] ?? '').toString();
            return s == 'requested' || s == 'scheduled';
          })
          .toList();
      final history = records.where((r) {
        final s = (r['status'] ?? '').toString();
        return s == 'ended' || s == 'cancelled' || s == 'missed';
      }).toList();
      setState(() {
        _records = records;
        _active = live.isNotEmpty ? Map<String, dynamic>.from(live.first) : null;
        _upcoming = upcoming;
        _history = history;
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

  String _pharmacyName(Map<String, dynamic> session) {
    if (session['pharmacy'] is Map && session['pharmacy']['pharmacy_name'] != null) {
      return session['pharmacy']['pharmacy_name'].toString();
    }
    if (session['patient_notes'] != null) return 'Pharmacy';
    return widget.pharmacyName ?? 'Pharmacy';
  }

  void _openConsult(Map<String, dynamic> session) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => VideoConsultView(
          roomUrl: (session['room_url'] ?? '').toString(),
          jitsiServer: (session['jitsi_server'] ?? 'https://meet.jit.si').toString(),
          roomCode: (session['room_code'] ?? '').toString(),
          pharmacyName: _pharmacyName(session),
          isLive: (session['status'] ?? '').toString() == 'live',
        ),
      ),
    );
  }

  void _book(bool instant) {
    if (widget.pharmacyId != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => BookConsultScreen(
            pharmacyId: widget.pharmacyId!,
            pharmacyName: widget.pharmacyName,
            instant: instant,
            onDone: _load,
          ),
        ),
      );
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PharmacyPickScreen(
          onPick: (pharmacy, instant) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => BookConsultScreen(
                  pharmacyId: pharmacy.id,
                  pharmacyName: pharmacy.name,
                  instant: instant,
                  onDone: _load,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Telemedicine'),
        backgroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _records.isEmpty
              ? _ErrorView(message: _error!, onRetry: _load)
              : _buildBody(),
    );
  }

  Widget _buildBody() {
    return ListView(
      children: [
        if (_active != null) ...[
          _LiveCard(
            session: _active!,
            pharmacyName: _pharmacyName(_active!),
            onJoin: () => _openConsult(_active!),
          ),
          const SizedBox(height: 22),
        ],

        _ActionsCard(
          onBook: () => _book(false),
          onCall: () => _book(true),
        ),
        const SizedBox(height: 22),

        if (_upcoming.isNotEmpty) ...[
          _SectionHeader(title: 'Upcoming Consultations'),
          const SizedBox(height: 10),
          ..._upcoming.map((r) => _AppointmentRow(
                record: r,
                pharmacyName: _pharmacyName(r),
                onTap: () => _openConsult(r),
              )),
          const SizedBox(height: 22),
        ],

        if (_history.isNotEmpty) ...[
          _SectionHeader(title: 'Consultation History'),
          const SizedBox(height: 10),
          ..._history.map((r) => _AppointmentRow(
                record: r,
                pharmacyName: _pharmacyName(r),
                onTap: null,
              )),
          const SizedBox(height: 22),
        ],

        if (_active == null && _upcoming.isEmpty && _history.isEmpty)
          _EmptyState(onBook: () => _book(false)),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Live / Action / Rows
// ---------------------------------------------------------------------------

class _LiveCard extends StatelessWidget {
  final Map<String, dynamic> session;
  final String pharmacyName;
  final VoidCallback onJoin;
  const _LiveCard({required this.session, required this.pharmacyName, required this.onJoin});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.primaryDark,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.videocam, size: 22, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: const Text('Live Consultation Now',
                      style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                ),
                const _Pill(label: 'LIVE', color: Colors.white, textColor: Colors.white),
              ],
            ),
            const SizedBox(height: 6),
            Text('With $pharmacyName',
                style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 12)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: onJoin,
                icon: const Icon(Icons.videocam, size: 18, color: Colors.white),
                label: const Text('Join Video Call',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionsCard extends StatelessWidget {
  final VoidCallback onBook;
  final VoidCallback onCall;
  const _ActionsCard({required this.onBook, required this.onCall});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _ActionButton(icon: Icons.calendar_today, label: 'Book Appointment', onTap: onBook),
          _ActionButton(icon: Icons.videocam, label: 'Start Live Call', onTap: onCall),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEEF1F0)),
            boxShadow: const [
              BoxShadow(color: Color(0x0D0F172A), blurRadius: 8, offset: Offset(0, 2)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, size: 22, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 10),
              Text(label,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: Text(title,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
    );
  }
}

class _AppointmentRow extends StatelessWidget {
  final Map<String, dynamic> record;
  final String pharmacyName;
  final VoidCallback? onTap;
  const _AppointmentRow({required this.record, required this.pharmacyName, this.onTap});

  IconData get _icon {
    switch ((record['status'] ?? '').toString()) {
      case 'live':
        return Icons.videocam;
      case 'scheduled':
      case 'requested':
        return Icons.schedule;
      default:
        return Icons.history;
    }
  }

  String get _statusLabel => (record['status'] ?? '').toString().toUpperCase();
  Color get _statusColor => AppTheme.primary;

  @override
  Widget build(BuildContext context) {
    final subtle = onTap == null;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFEEF1F0)),
            boxShadow: const [
              BoxShadow(color: Color(0x0D0F172A), blurRadius: 8, offset: Offset(0, 2)),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_icon, size: 17, color: AppTheme.primaryDark),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pharmacyName,
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                    const SizedBox(height: 5),
                    Text(_subtitle(record),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                  ],
                ),
              ),
              if (!subtle) ...[
                const SizedBox(width: 8),
                _Pill(label: _statusLabel, color: _statusColor, textColor: _statusColor),
              ] else
                _Pill(label: _statusLabel, color: Color(0xFF9CA3AF), textColor: Color(0xFF9CA3AF)),
            ],
          ),
        ),
      ),
    );
  }

  String _subtitle(Map<String, dynamic> r) {
    final s = _statusLabel;
    final topic = r['topic'] != null ? r['topic'].toString() : 'Pharmaceutical consultation';
    if (r['scheduled_at'] != null) {
      return '$s • ${r['scheduled_at'].toString()}';
    }
    return '$s • $topic';
  }
}

class _Pill extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;
  const _Pill({required this.label, required this.color, required this.textColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: textColor)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onBook;
  const _EmptyState({required this.onBook});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.videocam_off_outlined, size: 48, color: const Color(0xFFD1D5DB)),
          const SizedBox(height: 14),
          Text('No consultations yet',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
          const SizedBox(height: 6),
          Text('Book a video appointment or start a live call with a pharmacist.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: onBook,
            child: const Text('Book an Appointment',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
          ),
        ],
      ),
    );
  }
}

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
            Icon(Icons.videocam_off_outlined, size: 48, color: const Color(0xFFD1D5DB)),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}