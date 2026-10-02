import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../widgets/ad_story_bar.dart';
import 'ad_reel_screen.dart';

class PharmacyListItem {
  final String name;
  final String address;
  final String distance;
  final String hours;
  final bool open;

  const PharmacyListItem({
    required this.name,
    required this.address,
    required this.distance,
    required this.hours,
    this.open = true,
  });
}

class AllPharmaciesScreen extends StatefulWidget {
  final List<PharmacyListItem> pharmacies;
  final ValueChanged<PharmacyListItem>? onOpenPharmacy;

  const AllPharmaciesScreen({
    super.key,
    this.pharmacies = const [
      PharmacyListItem(
        name: 'Viwandani Health Pharmacy',
        address: 'Viwandani, Dodoma MC, Dodoma',
        distance: '0.2 km',
        hours: 'Open 08:00–20:00',
      ),
      PharmacyListItem(
        name: 'Makole Pharmacy',
        address: 'Makole, Dodoma MC, Dodoma',
        distance: '0.7 km',
        hours: 'Open 08:00–20:00',
      ),
      PharmacyListItem(
        name: 'Dodoma City Pharmacy',
        address: 'Madukani, Dodoma MC, Dodoma',
        distance: '1.8 km',
        hours: 'Open 08:00–20:00',
      ),
      PharmacyListItem(
        name: 'Miyuji Pharmacy Plus',
        address: 'Miyuji, Dodoma MC, Dodoma',
        distance: '1.8 km',
        hours: 'Open 08:00–20:00',
      ),
      PharmacyListItem(
        name: 'Nala Community Pharmacy',
        address: 'Nala, Dodoma MC, Dodoma',
        distance: '2.5 km',
        hours: 'Open 08:00–20:00',
      ),
      PharmacyListItem(
        name: 'Kikuyu Pharmacy',
        address: 'Kikuyu, Dodoma MC, Dodoma',
        distance: '3.2 km',
        hours: 'Open 08:00–20:00',
      ),
    ],
    this.onOpenPharmacy,
  });

  @override
  State<AllPharmaciesScreen> createState() => _AllPharmaciesScreenState();
}

class _AllPharmaciesScreenState extends State<AllPharmaciesScreen> {
  int _filter = 0;
  final _filters = const ['All', 'Pain Relief', 'Antibiotics', 'Vitamins'];

  void _openReel(int index) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const AdReelScreen(),
        fullscreenDialog: true,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: const Text('All Pharmacies'),
      ),
      body: Column(
        children: [
          AdStoryBar(onTapStory: _openReel),
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: AppColors.sand,
                border: Border.all(color: AppColors.line),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: const [
                  Icon(Icons.search, size: 16, color: AppColors.muted),
                  SizedBox(width: 10),
                  Text('Search pharmacies or medicines...',
                      style: TextStyle(color: AppColors.muted, fontSize: 13)),
                ],
              ),
            ),
          ),
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            child: Row(
              children: List.generate(_filters.length, (i) {
                final active = i == _filter;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(_filters[i]),
                    selected: active,
                    onSelected: (_) => setState(() => _filter = i),
                    selectedColor: AppColors.brand600,
                    backgroundColor: Colors.white,
                    labelStyle: TextStyle(
                      color: active ? Colors.white : AppColors.muted,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(99),
                      side: BorderSide(color: active ? AppColors.brand600 : AppColors.line),
                    ),
                  ),
                );
              }),
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(24),
              itemCount: widget.pharmacies.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) {
                final p = widget.pharmacies[i];
                return InkWell(
                  onTap: () => widget.onOpenPharmacy?.call(p),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.line),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.mint50,
                            border: Border.all(color: AppColors.line),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.local_pharmacy_rounded,
                              color: AppColors.brand600, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(p.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
                              Text(p.address,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.place, size: 11, color: AppColors.ink),
                                  const SizedBox(width: 3),
                                  Text(p.distance,
                                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600)),
                                  const SizedBox(width: 10),
                                  Icon(Icons.access_time_filled_rounded,
                                      size: 11, color: p.open ? AppColors.brand600 : AppColors.muted),
                                  const SizedBox(width: 3),
                                  Text(p.hours,
                                      style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w700,
                                          color: p.open ? AppColors.brand600 : AppColors.muted)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, size: 16, color: AppColors.muted),
                      ],
                    ),
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
