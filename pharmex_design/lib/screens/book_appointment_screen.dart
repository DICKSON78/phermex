import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class BookAppointmentScreen extends StatefulWidget {
  final String pharmacyName;
  final ValueChanged<String>? onConfirm;

  const BookAppointmentScreen({
    super.key,
    required this.pharmacyName,
    this.onConfirm,
  });

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final _noteController = TextEditingController();
  String? _selectedSlot;

  // Replace with real availability from your backend.
  final _slots = const ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'];

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canConfirm = _selectedSlot != null;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: const Text('Book Appointment'),
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: const Text(
              'Pick an available time slot, add a note, then confirm.',
              style: TextStyle(fontSize: 12.5, color: AppColors.muted),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _slots.map((slot) {
                      final active = _selectedSlot == slot;
                      return ChoiceChip(
                        label: Text(slot),
                        selected: active,
                        onSelected: (_) => setState(() => _selectedSlot = slot),
                        selectedColor: AppColors.brand600,
                        backgroundColor: Colors.white,
                        labelStyle: TextStyle(
                          color: active ? Colors.white : AppColors.ink,
                          fontWeight: FontWeight.w700,
                          fontSize: 12.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: active ? AppColors.brand600 : AppColors.line),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.line),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: TextField(
                      controller: _noteController,
                      maxLines: 3,
                      style: const TextStyle(fontSize: 13),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.all(16),
                        prefixIcon: Icon(Icons.notes_rounded, color: AppColors.muted, size: 18),
                        hintText: 'Note for the pharmacist (optional)',
                        hintStyle: TextStyle(color: AppColors.muted, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: canConfirm
                    ? () => widget.onConfirm?.call(_noteController.text)
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brand600,
                  disabledBackgroundColor: const Color(0xFFC7D6CD),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Confirm Appointment',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
