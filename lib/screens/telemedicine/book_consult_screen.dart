import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import 'video_consult_view.dart';

/// Lets the user pick a pharmacy to consult with.
class PharmacyPickScreen extends StatefulWidget {
  final void Function(Pharmacy pharmacy, bool instant) onPick;
  const PharmacyPickScreen({required this.onPick});

  @override
  State<PharmacyPickScreen> createState() => PharmacyPickScreenState();
}

class PharmacyPickScreenState extends State<PharmacyPickScreen> {
  bool _loading = true;
  String? _error;
  List<Pharmacy> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await CustomerRepository.allPharmacies();
      if (!mounted) return;
      setState(() {
        _items = items;
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

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.sand,
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: Text(L.t('oh.choosePharmacy')),
        backgroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.brand600))
          : _error != null && _items.isEmpty
              ? Center(
                  child: Text(L.t('oh.couldNotLoadPharmacies'),
                      style: const TextStyle(color: Color(0xFFDC2626))))
              : ListView.separated(
                  padding: const EdgeInsets.all(24),
                  itemCount: _items.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, i) {
                    if (i == 0) {
                      return Text(L.t('oh.selectPharmacyHint'),
                          style: const TextStyle(fontSize: 12.5, color: AppColors.muted));
                    }
                    final p = _items[i - 1];
                    return _PharmacyRow(
                      pharmacy: p,
                      onCall: () => widget.onPick(p, true),
                      onBook: () => widget.onPick(p, false),
                    );
                  },
                ),
    );
  }
}

class _PharmacyRow extends StatelessWidget {
  final Pharmacy pharmacy;
  final VoidCallback onCall;
  final VoidCallback onBook;
  const _PharmacyRow({required this.pharmacy, required this.onCall, required this.onBook});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.mint50,
              border: Border.all(color: AppColors.line),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.local_pharmacy_rounded, color: AppColors.brand600, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(pharmacy.name ?? L.t('oh.pharmacy'),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
          ),
          _PickAction(icon: Icons.videocam_rounded, label: L.t('call'), onPressed: onCall),
          const SizedBox(width: 8),
          _PickAction(icon: Icons.calendar_month_rounded, label: L.t('oh.book'), onPressed: onBook),
        ],
      ),
    );
  }
}

class _PickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  const _PickAction({required this.icon, required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.mint50,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: AppColors.brand700),
            const SizedBox(width: 4),
            Text(label,
                style: const TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.brand700)),
          ],
        ),
      ),
    );
  }
}

/// Booking screen: instant live call OR pick an available time slot.
class BookConsultScreen extends StatefulWidget {
  final int pharmacyId;
  final String? pharmacyName;
  final bool instant;
  final VoidCallback onDone;
  const BookConsultScreen({
    super.key,
    required this.pharmacyId,
    this.pharmacyName,
    this.instant = false,
    required this.onDone,
  });

  @override
  State<BookConsultScreen> createState() => BookConsultScreenState();
}

class BookConsultScreenState extends State<BookConsultScreen> {
  bool _busy = false;
  bool _loadingSlots = false;
  String? _error;
  List<Map<String, dynamic>> _slots = [];
  int? _selectedIndex;

  final _topicController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (!widget.instant) _loadSlots();
  }

  @override
  void dispose() {
    _topicController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadSlots() async {
    setState(() => _loadingSlots = true);
    try {
      final slots = await CustomerRepository.telemedicineSlots(widget.pharmacyId);
      if (!mounted) return;
      setState(() {
        _slots = slots ?? [];
        _loadingSlots = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingSlots = false;
        _error = ApiService.friendlyError(e);
      });
    }
  }

  Future<void> _start() async {
    final L = AppLocalizations.of(context);
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final topic = _topicController.text.trim().isEmpty ? null : _topicController.text.trim();
    final notes = _notesController.text.trim().isEmpty ? null : _notesController.text.trim();
    try {
      final Map<String, dynamic> data;
      if (!widget.instant && _selectedIndex != null && _selectedIndex! < _slots.length) {
        final scheduledAt = _slots[_selectedIndex!]['start']?.toString();
        if (scheduledAt == null || scheduledAt.isEmpty) {
          throw Exception(AppLocalizations.tr('oh.pleaseChooseSlot'));
        }
        data = await CustomerRepository.bookTelemedicine(widget.pharmacyId,
            scheduledAt: scheduledAt, topic: topic, patientNotes: notes);
      } else {
        data = await CustomerRepository.requestTelemedicine(widget.pharmacyId,
            topic: topic, patientNotes: notes);
      }
      if (!mounted) {
        widget.onDone();
        return;
      }
      setState(() => _busy = false);
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => VideoConsultView(
            roomUrl: (data['room_url'] ?? '').toString(),
            jitsiServer: (data['jitsi_server'] ?? 'https://meet.jit.si').toString(),
            roomCode: (data['room_code'] ?? '').toString(),
            pharmacyName: widget.pharmacyName ?? L.t('oh.pharmacy'),
            isLive: (data['status'] ?? '').toString() == 'live',
          ),
        ),
      );
      widget.onDone();
    } catch (e) {
      if (!mounted) {
        widget.onDone();
        return;
      }
      setState(() {
        _busy = false;
        _error = ApiService.friendlyError(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.sand,
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: Text(widget.instant ? L.t('oh.startLiveCall') : L.t('oh.bookAppointment')),
        backgroundColor: Colors.white,
      ),
      body: widget.instant ? _buildInstant() : _buildBook(),
    );
  }

  Widget _buildInstant() {
    final L = AppLocalizations.of(context);
    return ListView(
      children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: Text(L.t('oh.instantConsultHint'),
              style: const TextStyle(fontSize: 13, color: AppColors.muted)),
        ),
        _NoteInputs(notesController: _notesController),
        if (_error != null) Padding(
          padding: const EdgeInsets.all(16),
          child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _busy ? null : _start,
              icon: const Icon(Icons.videocam_rounded, size: 20, color: Colors.white),
              label: Text(_busy ? L.t('oh.starting') : L.t('oh.startVideoCall'),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand600),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBook() {
    final L = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Flexible(
          child: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Text(L.t('oh.pickSlotHint'),
                    style: const TextStyle(fontSize: 13, color: AppColors.muted)),
              ),
              if (_loadingSlots) ...[
                const SizedBox(height: 20),
                const Center(child: CircularProgressIndicator(color: AppColors.brand600)),
                const SizedBox(height: 20),
              ] else if (_error != null && _slots.isEmpty) ...[
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
                ),
              ] else if (_slots.isEmpty) ...[
                Center(child: Text(L.t('oh.noSlots'),
                    textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: AppColors.muted))),
              ] else ...[
                _SlotsList(slots: _slots, selectedIndex: _selectedIndex, onSelect: (i) => setState(() => _selectedIndex = i)),
                const SizedBox(height: 14),
                _NoteInputs(notesController: _notesController),
              ],
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _busy || _selectedIndex == null ? null : _start,
              child: Text(_busy ? L.t('oh.booking') : L.t('oh.confirmAppointment'),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.brand600),
            ),
          ),
        ),
      ],
    );
  }
}

class _SlotsList extends StatelessWidget {
  final List<Map<String, dynamic>> slots;
  final int? selectedIndex;
  final void Function(int) onSelect;
  const _SlotsList({required this.slots, required this.selectedIndex, required this.onSelect});

  String _groupLabel(Map<String, dynamic> s) => (s['date_label'] ?? '').toString();
  String _timeLabel(Map<String, dynamic> s) =>
      (s['time_label'] ?? s['start'] ?? '').toString();

  @override
  Widget build(BuildContext context) {
    String? lastGroup;
    final rows = <Widget>[];
    for (var i = 0; i < slots.length; i++) {
      final s = slots[i];
      final group = _groupLabel(s);
      if (lastGroup == null || group != lastGroup) {
        lastGroup = group;
        rows.add(Text('  $group',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.muted)));
        rows.add(const SizedBox(height: 6));
      }
      final isSelected = selectedIndex == i;
      rows.add(Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
        child: InkWell(
          onTap: () => onSelect(i),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.mint50 : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: isSelected
                  ? Border.all(color: AppColors.brand600, width: 1.5)
                  : Border.all(color: AppColors.line),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(_timeLabel(s),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle_rounded, size: 18, color: AppColors.brand600),
              ],
            ),
          ),
        ),
      ));
    }
    return ListView(children: rows);
  }
}

class _NoteInputs extends StatelessWidget {
  final TextEditingController notesController;
  const _NoteInputs({required this.notesController});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: notesController,
        maxLines: 2,
        decoration: InputDecoration(
          labelText: L.t('oh.noteForPharmacist'),
          hintText: L.t('oh.symptomsHint'),
          prefixIcon: const Icon(Icons.edit_note, size: 20, color: AppColors.muted),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.line),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.line),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.brand600, width: 1.8),
          ),
        ),
      ),
    );
  }
}