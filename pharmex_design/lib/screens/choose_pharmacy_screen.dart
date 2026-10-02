import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ChoosePharmacyScreen extends StatelessWidget {
  final List<String> pharmacies;
  final ValueChanged<String>? onCall;
  final ValueChanged<String>? onBook;

  const ChoosePharmacyScreen({
    super.key,
    this.pharmacies = const [
      'Mwalimu Pharmacy',
      'Kariakoo Pharmacy',
      'Sinza Pharmacy',
      'Mikocheni Health Center',
      'Oysterbay Medical',
      'Temeke Community Pharmacy',
      'Tabora Health Point',
    ],
    this.onCall,
    this.onBook,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: const Text('Choose Pharmacy'),
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: const Text(
              'Select the pharmacy you want to consult with a video pharmacist.',
              style: TextStyle(fontSize: 12.5, color: AppColors.muted),
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: pharmacies.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) {
                final name = pharmacies[i];
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
                        child: const Icon(Icons.local_pharmacy_rounded,
                            color: AppColors.brand600, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
                      ),
                      _MiniAction(
                        icon: Icons.videocam_rounded,
                        label: 'Call',
                        onTap: () => onCall?.call(name),
                      ),
                      const SizedBox(width: 8),
                      _MiniAction(
                        icon: Icons.calendar_month_rounded,
                        label: 'Book',
                        onTap: () => onBook?.call(name),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MiniAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(color: AppColors.mint50, borderRadius: BorderRadius.circular(12)),
        child: Row(
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
