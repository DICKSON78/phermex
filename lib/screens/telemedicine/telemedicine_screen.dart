import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../l10n/app_localizations.dart';
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
  final int refreshTick;

  const TelemedicineScreen({super.key, this.pharmacyId, this.pharmacyName, this.refreshTick = 0});

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

  @override
  void didUpdateWidget(covariant TelemedicineScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshTick != oldWidget.refreshTick) _load();
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
    if (session['patient_notes'] != null) return AppLocalizations.tr('oh.pharmacy');
    return widget.pharmacyName ?? AppLocalizations.tr('oh.pharmacy');
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
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: Text(L.t('oh.telemedicine')),
        backgroundColor: Colors.white,
        systemOverlayStyle: const SystemUiOverlayStyle(
          statusBarColor: Color(0xFF0F2A1E),
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _records.isEmpty
              ? _ErrorView(message: _error!, onRetry: _load)
              : _buildBody(),
    );
  }

  Widget _buildBody() {
    final L = AppLocalizations.of(context);
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
          _SectionHeader(title: L.t('oh.upcomingConsultations')),
          const SizedBox(height: 10),
          ..._upcoming.map((r) => _AppointmentRow(
                record: r,
                pharmacyName: _pharmacyName(r),
                onTap: () => _openConsult(r),
              )),
          const SizedBox(height: 22),
        ],

        if (_history.isNotEmpty) ...[
          _SectionHeader(title: L.t('oh.consultationHistory')),
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
    final L = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.promo,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.videocam_rounded, color: Colors.white, size: 16),
                    const SizedBox(width: 8),
                    Text(L.t('oh.liveConsultationNow'),
                        style: const TextStyle(
                            color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.22),
                      borderRadius: BorderRadius.circular(99)),
                  child: const Text('LIVE',
                      style: TextStyle(
                          color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('${L.t('oh.withPharmacy')} $pharmacyName',
                style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 12.5)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: onJoin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.brand800,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.videocam_rounded, size: 16),
                label: Text(L.t('oh.joinVideoCall'),
                    style: const TextStyle(fontWeight: FontWeight.w700)),
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
    final L = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _ActionButton(
              icon: Icons.calendar_month_rounded,
              label: L.t('oh.bookAppointment'),
              onTap: onBook,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _ActionButton(
              icon: Icons.videocam_rounded,
              label: L.t('oh.startLiveCall'),
              onTap: onCall,
            ),
          ),
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.line),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.mint50,
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppColors.brand600, size: 19),
            ),
            const SizedBox(height: 12),
            Text(label,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.ink)),
          ],
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
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.ink)),
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
        return Icons.videocam_rounded;
      case 'scheduled':
      case 'requested':
        return Icons.schedule_rounded;
      default:
        return Icons.history_rounded;
    }
  }

  String _statusKey(String status) {
    switch (status) {
      case 'live':
        return 'oh.statusLive';
      case 'scheduled':
        return 'oh.statusScheduled';
      case 'requested':
        return 'oh.statusRequested';
      case 'ended':
        return 'oh.statusEnded';
      case 'missed':
        return 'oh.statusMissed';
      case 'cancelled':
        return 'oh.statusCancelled';
      default:
        return 'oh.statusScheduled';
    }
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final subtle = onTap == null;
    final status = (record['status'] ?? '').toString();
    final statusLabel = L.t(_statusKey(status));
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
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.mint50,
                  border: Border.all(color: AppColors.line),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_icon, size: 17, color: AppColors.brand700),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pharmacyName,
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                    const SizedBox(height: 5),
                    Text(_subtitle(L, statusLabel, record),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                  ],
                ),
              ),
              if (!subtle) ...[
                const SizedBox(width: 8),
                _Pill(label: statusLabel, color: AppColors.brand600, textColor: AppColors.brand700),
              ] else
                _Pill(label: statusLabel, color: AppColors.muted, textColor: AppColors.muted),
            ],
          ),
        ),
      ),
    );
  }

  String _subtitle(AppLocalizations L, String statusLabel, Map<String, dynamic> r) {
    final topic = r['topic'] != null ? r['topic'].toString() : L.t('oh.pharmaceuticalConsultation');
    if (r['scheduled_at'] != null) {
      return '$statusLabel • ${r['scheduled_at'].toString()}';
    }
    return '$statusLabel • $topic';
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
        borderRadius: BorderRadius.circular(99),
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
    final L = AppLocalizations.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.videocam_off_outlined, size: 48, color: AppColors.line),
          const SizedBox(height: 14),
          Text(L.t('oh.noConsultationsYet'),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 6),
          Text(L.t('oh.emptyConsultationsHint'),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: onBook,
            child: Text(L.t('oh.bookAnAppointment'),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand600),
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
    final L = AppLocalizations.of(context);
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
            OutlinedButton(onPressed: onRetry, child: Text(L.t('oh.retry'))),
          ],
        ),
      ),
    );
  }
}