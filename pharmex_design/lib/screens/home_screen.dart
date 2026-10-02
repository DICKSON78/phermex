import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/app_bottom_nav.dart';
import '../widgets/app_nav_drawer.dart';

class HomeScreen extends StatelessWidget {
  final String customerName;
  const HomeScreen({super.key, this.customerName = 'Test Customer'});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.sand,
      // Drop AppNavDrawer straight into `drawer:` — Scaffold wires up the
      // swipe-from-edge gesture automatically. Open it from a menu button
      // with `Scaffold.of(context).openDrawer()`.
      drawer: AppNavDrawer(
        name: customerName,
        email: 'customer@pharmex.com',
        customerId: 'CUS-TEST01',
        notificationCount: 3,
        activeIndex: 0,
        onSelect: (index) {
          // TODO: route to the tapped section, e.g. using index to switch
          // on My Orders / Telemedicine / My Prescriptions / etc.
        },
        onLogout: () {
          // TODO: sign the user out
        },
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _HeroHeader(customerName: customerName),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    const _DoctorBanner(),
                    const SizedBox(height: 20),
                    const Text('Shop by Category',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    const _CategoryRow(),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Nearby Pharmacies',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                        Row(
                          children: [
                            Text('View all',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.brand600)),
                            const Icon(Icons.chevron_right, size: 14, color: AppColors.brand600),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const _NearbyPharmacies(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: AppBottomNav(current: AppTab.home, onTap: (_) {}),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  final String customerName;
  const _HeroHeader({required this.customerName});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 22),
      decoration: const BoxDecoration(gradient: AppColors.darkHeaderGradient),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withOpacity(0.35)),
                      color: Colors.white.withOpacity(0.06),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      customerName.isNotEmpty ? customerName[0] : '?',
                      style: const TextStyle(
                          color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Good morning',
                          style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12.5)),
                      const SizedBox(height: 2),
                      Text(customerName,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 6),
                      SizedBox(
                        width: 220,
                        child: Text(
                          'Order medicines from trusted pharmacies near you',
                          style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 12.5),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  Builder(
                    builder: (context) => GestureDetector(
                      onTap: () => Scaffold.of(context).openDrawer(),
                      child: Container(
                        width: 40,
                        height: 40,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08), shape: BoxShape.circle),
                        child: const Icon(Icons.menu_rounded, color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.08), shape: BoxShape.circle),
                    child: const Icon(Icons.notifications_none_rounded, color: Colors.white, size: 18),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                const Icon(Icons.search, size: 18, color: AppColors.muted),
                const SizedBox(width: 10),
                Text('Search medicines or pharmacies',
                    style: TextStyle(color: AppColors.muted, fontSize: 13.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DoctorBanner extends StatelessWidget {
  const _DoctorBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: AppColors.doctorBannerGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Talk to a Doctor',
                    style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
                const SizedBox(height: 2),
                Text('Video consults, anytime',
                    style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 11)),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.brand800,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
                  ),
                  icon: const Icon(Icons.videocam_rounded, size: 14),
                  label: const Text('Start call now',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 26),
          ),
        ],
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow();

  static const _cats = [
    (Icons.healing_rounded, 'Pain\nRelief'),
    (Icons.medication_rounded, 'Antibiotics'),
    (Icons.shield_rounded, 'Vitamins'),
    (Icons.child_care_rounded, 'Cough &\nCold'),
    (Icons.medical_services_rounded, 'First Aid'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: _cats
          .map((c) => Column(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.mint50,
                      borderRadius: BorderRadius.circular(13),
                      border: Border.all(color: AppColors.line),
                    ),
                    child: Icon(c.$1, size: 20, color: AppColors.brand600),
                  ),
                  const SizedBox(height: 6),
                  SizedBox(
                    width: 56,
                    child: Text(
                      c.$2,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ))
          .toList(),
    );
  }
}

class _NearbyPharmacies extends StatelessWidget {
  const _NearbyPharmacies();

  static const _pharmacies = [
    ('Viwandani Health...', 'Viwandani, Dodoma', '0.3 km'),
    ('Makole Pharmacy', 'Makole, Dodoma MC', '0.7 km'),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _pharmacies
          .map((p) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.line),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 112,
                          decoration: const BoxDecoration(gradient: AppColors.pharmacyPhotoGradient),
                          child: Stack(
                            children: [
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  padding:
                                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.45),
                                      borderRadius: BorderRadius.circular(99)),
                                  child: Text(p.$3,
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700)),
                                ),
                              ),
                              Center(
                                child: Container(
                                  width: 44,
                                  height: 44,
                                  decoration: const BoxDecoration(
                                      color: Colors.white, shape: BoxShape.circle),
                                  child: const Icon(Icons.local_pharmacy_rounded,
                                      color: AppColors.brand700, size: 20),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(p.$1,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 10, color: AppColors.muted),
                                  const SizedBox(width: 3),
                                  Expanded(
                                    child: Text(p.$2,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 10.5, color: AppColors.muted)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ))
          .toList(),
    );
  }
}
