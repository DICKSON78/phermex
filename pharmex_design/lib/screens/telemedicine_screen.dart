import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/app_bottom_nav.dart';

class TelemedicineScreen extends StatelessWidget {
  final String? livePharmacy;
  const TelemedicineScreen({super.key, this.livePharmacy = 'Sinza Pharmacy'});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Telemedicine')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (livePharmacy != null) ...[
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppColors.doctorBannerGradient,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.videocam_rounded, color: Colors.white, size: 16),
                            SizedBox(width: 8),
                            Text('Live Consultation Now',
                                style: TextStyle(
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
                    Text('With $livePharmacy',
                        style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 12.5)),
                    const SizedBox(height: 16),
                    Container(
                      height: 48,
                      decoration:
                          BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.calendar_month_rounded,
                    label: 'Book Appointment',
                    onTap: () {},
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.videocam_rounded,
                    label: 'Start Live Call',
                    onTap: () {},
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: AppBottomNav(current: AppTab.call, onTap: (_) {}),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionCard({required this.icon, required this.label, required this.onTap});

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
            Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
