import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/app_bottom_nav.dart';
import 'prescription_detail_sheet.dart';

class Prescription {
  final String id;
  final String pharmacy;
  final String doctor;
  final String hospital;
  final String submittedAt;
  final String status; // Pending / Approved / Rejected
  final String notes;

  const Prescription({
    required this.id,
    required this.pharmacy,
    required this.doctor,
    required this.hospital,
    required this.submittedAt,
    required this.status,
    required this.notes,
  });
}

class PrescriptionsScreen extends StatelessWidget {
  final List<Prescription> prescriptions;
  final VoidCallback? onUpload;

  const PrescriptionsScreen({
    super.key,
    this.prescriptions = const [
      Prescription(
        id: '#RX-TD5LT-1788335856',
        pharmacy: 'Mwalimu Pharmacy',
        doctor: 'Dr. Dickson Steven',
        hospital: '—',
        submittedAt: 'Sep 2, 2026 · 10:57 AM',
        status: 'Pending',
        notes: 'Naumwa jino',
      ),
    ],
    this.onUpload,
  });

  Color _statusBg(String status) =>
      status == 'Pending' ? AppColors.amber50 : AppColors.mint50;
  Color _statusFg(String status) =>
      status == 'Pending' ? AppColors.amber600 : AppColors.brand700;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Prescriptions')),
      body: Stack(
        children: [
          ListView.separated(
            padding: const EdgeInsets.all(24),
            itemCount: prescriptions.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final rx = prescriptions[i];
              return InkWell(
                onTap: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => PrescriptionDetailSheet(prescription: rx),
                ),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: AppColors.line),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.violet50,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.description_rounded,
                            color: AppColors.violet600, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(rx.id,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 2),
                            Text(rx.pharmacy,
                                style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                            Text(rx.doctor,
                                style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 2),
                            Text(rx.submittedAt,
                                style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                            color: _statusBg(rx.status), borderRadius: BorderRadius.circular(99)),
                        child: Text(rx.status.toUpperCase(),
                            style: TextStyle(
                                fontSize: 10, fontWeight: FontWeight.w700, color: _statusFg(rx.status))),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          Positioned(
            right: 24,
            bottom: 24,
            child: FloatingActionButton(
              onPressed: onUpload,
              backgroundColor: AppColors.brand600,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              child: const Icon(Icons.upload_file_rounded, color: Colors.white),
            ),
          ),
        ],
      ),
      bottomNavigationBar: AppBottomNav(current: AppTab.rx, onTap: (_) {}),
    );
  }
}
