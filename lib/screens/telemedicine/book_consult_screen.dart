import 'package:flutter/material.dart';
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
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Choose Pharmacy'),
        backgroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _items.isEmpty
              ? Center(
                  child: const Text('Could not load pharmacies',
                      style: TextStyle(color: Color(0xFFDC2626))))
              : ListView(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: const Text(
                          'Select the pharmacy you want to consult with a video pharmacist.',
                          style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                    ),
                    ..._items.map((p) => _PharmacyRow(
                          pharmacy: p,
                          onCall: () => widget.onPick(p, true),
                          onBook: () => widget.onPick(p, false),
                        )),
                  ],
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFEEF1F0)),
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
                    child: const Icon(Icons.local_pharmacy, size: 20, color: AppTheme.primaryDark),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(pharmacy.name ?? 'Pharmacy',
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          _PickAction(icon: Icons.videocam, label: 'Call', onPressed: onCall),
          const SizedBox(width: 8),
          _PickAction(icon: Icons.calendar_today, label: 'Book', onPressed: onBook),
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
        width: 54,
        height: 54,
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: AppTheme.primary.withOpacity(0.12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: AppTheme.primaryDark),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.primaryDark)),
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
          throw Exception('Please choose a time slot.');
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
            pharmacyName: widget.pharmacyName ?? 'Pharmacy',
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
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: Text(widget.instant ? 'Start Live Call' : 'Book Appointment'),
        backgroundColor: Colors.white,
      ),
      body: widget.instant ? _buildInstant() : _buildBook(),
    );
  }

  Widget _buildInstant() {
    return ListView(
      children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: const Text('Start an instant video consultation with the pharmacist. They will be notified to join.',
              style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
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
              icon: const Icon(Icons.videocam, size: 20, color: Colors.white),
              label: Text(_busy ? 'Starting…' : 'Start Video Call',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBook() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Flexible(
          child: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: const Text('Pick an available time slot, add a note, then confirm.',
                    style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
              ),
              if (_loadingSlots) ...[
                const SizedBox(height: 20),
                const Center(child: CircularProgressIndicator()),
                const SizedBox(height: 20),
              ] else if (_error != null && _slots.isEmpty) ...[
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
                ),
              ] else if (_slots.isEmpty) ...[
                const Center(child: const Text('No available slots right now.\nTry again later.',
                    textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppTheme.textMuted))),
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
              child: Text(_busy ? 'Booking…' : 'Confirm Appointment',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
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
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textMuted)));
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
              color: isSelected ? AppTheme.primary.withOpacity(0.15) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: isSelected
                  ? Border.all(color: AppTheme.primary, width: 1.5)
                  : Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(_timeLabel(s),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                ),
                if (isSelected)
                  const Icon(Icons.check_circle, size: 18, color: AppTheme.primary),
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
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: notesController,
        maxLines: 2,
        decoration: InputDecoration(
          labelText: 'Note for the pharmacist (optional)',
          hintText: 'Symptoms, medicines needed, etc.',
          prefixIcon: const Icon(Icons.edit_note, size: 20, color: Color(0xFF9CA3AF)),
          filled: true,
          fillColor: Colors.grey.shade50,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppTheme.primary, width: 1.8),
          ),
        ),
      ),
    );
  }
}