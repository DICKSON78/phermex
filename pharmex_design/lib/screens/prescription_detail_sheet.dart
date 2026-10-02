import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'prescriptions_screen.dart';

class PrescriptionDetailSheet extends StatelessWidget {
  final Prescription prescription;
  const PrescriptionDetailSheet({super.key, required this.prescription});

  @override
  Widget build(BuildContext context) {
    final rx = prescription;
    return Container(
      padding: const EdgeInsets.fromLTRB(22, 14, 22, 26),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration:
                    BoxDecoration(color: AppColors.line, borderRadius: BorderRadius.circular(99)),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(rx.id,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration:
                      BoxDecoration(color: AppColors.amber50, borderRadius: BorderRadius.circular(99)),
                  child: Text(rx.status.toUpperCase(),
                      style: const TextStyle(
                          fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.amber600)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(rx.pharmacy, style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
            const SizedBox(height: 16),
            Container(
              height: 128,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.description_outlined, color: AppColors.muted, size: 26),
            ),
            const SizedBox(height: 16),
            _DetailRow(icon: Icons.local_pharmacy_rounded, label: 'Doctor', value: rx.doctor),
            const SizedBox(height: 12),
            _DetailRow(icon: Icons.local_hospital_rounded, label: 'Hospital', value: rx.hospital),
            const SizedBox(height: 12),
            _DetailRow(
                icon: Icons.calendar_month_rounded, label: 'Submitted', value: rx.submittedAt),
            const SizedBox(height: 16),
            const Text('Notes', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(rx.notes, style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.ink,
                  side: const BorderSide(color: AppColors.line),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Close', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: AppColors.mint50,
            border: Border.all(color: AppColors.line),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, size: 15, color: AppColors.brand600),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
            Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ],
        ),
      ],
    );
  }
}
