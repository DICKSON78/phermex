import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/models.dart';
import '../../l10n/app_localizations.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../widgets/ad_story_bar.dart';
import '../pharmacy/pharmacy_detail_screen.dart';
import 'ad_reel_screen.dart';

const kAllPharmacyFilters = <String>[
  'All',
  'Pain Relief',
  'Antibiotics',
  'Vitamins',
  'Cough',
  'First Aid',
];

class AllPharmaciesScreen extends StatefulWidget {
  final String? initialCategory;
  const AllPharmaciesScreen({super.key, this.initialCategory});

  @override
  State<AllPharmaciesScreen> createState() => _AllPharmaciesScreenState();
}

class _AllPharmaciesScreenState extends State<AllPharmaciesScreen> {
  final _searchController = TextEditingController();
  List<Pharmacy> _pharmacies = [];
  bool _loading = true;
  String? _error;
  String? _search;
  int _filter = 0;

  @override
  void initState() {
    super.initState();
    final initial = widget.initialCategory;
    if (initial != null) {
      final idx = kAllPharmacyFilters.indexOf(initial);
      _filter = idx >= 0 ? idx : 0;
      _search = idx >= 0 ? initial : null;
    }
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      var lat = -6.7924;
      var lng = 39.2083;
      try {
        var enabled = await Geolocator.isLocationServiceEnabled();
        if (enabled) {
          var perm = await Geolocator.checkPermission();
          if (perm == LocationPermission.denied) {
            perm = await Geolocator.requestPermission();
          }
          if (perm == LocationPermission.whileInUse ||
              perm == LocationPermission.always) {
            final pos = await Geolocator.getCurrentPosition();
            lat = pos.latitude;
            lng = pos.longitude;
          }
        }
      } catch (_) {}
      final list = await CustomerRepository.nearby(
        latitude: lat,
        longitude: lng,
        radiusKm: 100,
        search: _search,
      );
      if (!mounted) return;
      setState(() {
        _pharmacies = list;
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openReel(int index) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const AdReelScreen(), fullscreenDialog: true),
    );
  }

  void _selectFilter(int i) {
    setState(() {
      _filter = i;
      final label = kAllPharmacyFilters[i];
      _search = i == 0 ? null : label;
      if (i == 0) _searchController.clear();
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.sand,
      appBar: AppBar(
        leading: const BackButton(color: AppColors.ink),
        title: Text(L.t('shop.allPharmacies')),
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
                children: [
                  const Icon(Icons.search, size: 16, color: AppColors.muted),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (v) {
                        setState(() {
                          _search = v.isEmpty ? null : v;
                          _filter = 0;
                        });
                        _load();
                      },
                      decoration: InputDecoration(
                        hintText: L.t('shop.searchPharmaciesOrMedicines'),
                        hintStyle: TextStyle(color: AppColors.muted, fontSize: 13),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                      style: const TextStyle(fontSize: 13, fontFamily: 'Poppins'),
                      textInputAction: TextInputAction.search,
                    ),
                  ),
                  if (_searchController.text.isNotEmpty)
                    GestureDetector(
                      onTap: () {
                        _searchController.clear();
                        _selectFilter(0);
                      },
                      child: const Icon(Icons.close_rounded, size: 16, color: AppColors.muted),
                    ),
                ],
              ),
            ),
          ),
          AdStoryReel(onTapStory: _openReel),
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(24, 4, 0, 16),
            child: SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(right: 24),
                itemCount: kAllPharmacyFilters.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final active = i == _filter;
                  return Center(
                    child: ChoiceChip(
                      label: Text(kAllPharmacyFilters[i]),
                      selected: active,
                      onSelected: (_) => _selectFilter(i),
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
                },
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.brand600))
                : _error != null && _pharmacies.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_error!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
                              const SizedBox(height: 12),
                              OutlinedButton(onPressed: _load, child: Text(L.t('shop.retry'))),
                            ],
                          ),
                        ),
                      )
                    : _pharmacies.isEmpty
                        ? const _EmptyListState()
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: AppColors.brand600,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(24),
                              itemCount: _pharmacies.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, i) =>
                                  _PharmacyRowCard(pharmacy: _pharmacies[i]),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _PharmacyRowCard extends StatelessWidget {
  final Pharmacy pharmacy;
  const _PharmacyRowCard({required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    final distance = pharmacy.distance != null
        ? '${pharmacy.distance!.toStringAsFixed(1)} km'
        : '';
    final hoursLabel = pharmacy.openLabel;
    final hasHours = hoursLabel.isNotEmpty;

    return InkWell(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => PharmacyDetailScreen(pharmacy: pharmacy)),
      ),
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
              child: const Icon(Icons.local_pharmacy_rounded, color: AppColors.brand600, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pharmacy.name ?? L.t('shop.pharmacy'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
                  Text(
                    pharmacy.locationLabel.isEmpty
                        ? (pharmacy.address?.isNotEmpty == true ? pharmacy.address! : L.t('shop.pharmacy'))
                        : pharmacy.locationLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.place, size: 11, color: AppColors.ink),
                      const SizedBox(width: 3),
                      Text(distance.isEmpty ? L.t('shop.nearby') : distance,
                          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.ink)),
                      if (hasHours) ...[
                        const SizedBox(width: 10),
                        Icon(Icons.access_time_filled_rounded,
                            size: 11, color: hasHours ? AppColors.brand600 : AppColors.muted),
                        const SizedBox(width: 3),
                        Text(hoursLabel,
                            style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: hasHours ? AppColors.brand600 : AppColors.muted)),
                      ],
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
  }
}

class _EmptyListState extends StatelessWidget {
  const _EmptyListState();

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_pharmacy_outlined, size: 48, color: AppColors.line),
          const SizedBox(height: 12),
          Text(L.t('shop.noPharmaciesFound'),
              style: const TextStyle(fontSize: 14, color: AppColors.muted)),
        ],
      ),
    );
  }
}