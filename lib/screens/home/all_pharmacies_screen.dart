import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import 'home_screen.dart';
import '../pharmacy/pharmacy_detail_screen.dart';

class AllPharmaciesScreen extends StatefulWidget {
  final String? initialCategory;
  const AllPharmaciesScreen({super.key, this.initialCategory});

  @override
  State<AllPharmaciesScreen> createState() => _AllPharmaciesScreenState();
}

class _AllPharmaciesScreenState extends State<AllPharmaciesScreen> {
  List<Pharmacy> _pharmacies = [];
  bool _loading = true;
  String? _error;
  String? _search;
  String? _activeCategory;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _activeCategory = widget.initialCategory;
    _search = widget.initialCategory;
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

  void _selectCategory(String? category) {
    setState(() {
      _activeCategory = category;
      _search = category;
      if (category == null) _searchController.clear();
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('All Pharmacies'),
        titleTextStyle: const TextStyle(
            color: AppTheme.textDark,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            fontFamily: 'Poppins'),
      ),
      body: Column(
        children: [
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  const Icon(Icons.search, size: 20, color: Color(0xFF94A3B8)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: (_) => setState(() {}),
                      onSubmitted: (v) {
                        setState(() {
                          _search = v.isEmpty ? null : v;
                          _activeCategory = null;
                        });
                        _load();
                      },
                      decoration: const InputDecoration(
                        hintText: 'Search pharmacies or medicines...',
                        hintStyle:
                            TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 10),
                      ),
                      style: const TextStyle(fontSize: 14, fontFamily: 'Poppins'),
                      textInputAction: TextInputAction.search,
                    ),
                  ),
                  if (_searchController.text.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.clear,
                          size: 18, color: Color(0xFF94A3B8)),
                      onPressed: () {
                        _searchController.clear();
                        _selectCategory(null);
                      },
                    ),
                ],
              ),
            ),
          ),
          // Category chips
          _CategoryStrip(
            selected: _activeCategory,
            onSelect: _selectCategory,
          ),
          const SizedBox(height: 4),
          // List
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary))
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    fontSize: 13, color: Color(0xFFDC2626)),
                              ),
                              const SizedBox(height: 12),
                              OutlinedButton(
                                  onPressed: _load, child: const Text('Retry')),
                            ],
                          ),
                        ),
                      )
                    : _pharmacies.isEmpty
                        ? const _EmptyListState()
                        : RefreshIndicator(
                            onRefresh: _load,
                            color: AppTheme.primary,
                            child: ListView.separated(
                              padding:
                                  const EdgeInsets.fromLTRB(20, 8, 20, 100),
                              itemCount: _pharmacies.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, i) =>
                                  _PharmacyCard(pharmacy: _pharmacies[i]),
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _CategoryStrip extends StatelessWidget {
  final String? selected;
  final ValueChanged<String?> onSelect;
  const _CategoryStrip({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        children: [
          _chip('All', selected == null, () => onSelect(null)),
          ...kHomeCategories.map((c) => Padding(
                padding: const EdgeInsets.only(left: 8),
                child: _chip(c, selected == c, () => onSelect(c)),
              )),
        ],
      ),
    );
  }

  Widget _chip(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: active ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
              color: active ? AppTheme.primary : const Color(0xFFE5E7EB)),
        ),
        child: Text(label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: active ? AppTheme.dark : const Color(0xFF6B7280),
            )),
      ),
    );
  }
}

class _PharmacyCard extends StatelessWidget {
  final Pharmacy pharmacy;
  const _PharmacyCard({required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    final distance = pharmacy.distance != null
        ? '${pharmacy.distance!.toStringAsFixed(1)} km'
        : '';
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(
            builder: (_) => PharmacyDetailScreen(pharmacy: pharmacy)),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFEEF1F0)),
          boxShadow: const [
            BoxShadow(color: Color(0x0D0F172A), blurRadius: 8, offset: Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.local_pharmacy,
                  size: 26, color: AppTheme.primaryDark),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(pharmacy.name ?? 'Pharmacy',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textDark)),
                      ),
                      if (pharmacy.hasRating)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF4E5),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star,
                                  size: 11, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 3),
                              Text(
                                  '${pharmacy.rating!.toStringAsFixed(1)}',
                                  style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFFD97706))),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    pharmacy.locationLabel.isEmpty
                        ? 'Pharmacy'
                        : pharmacy.locationLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style:
                        const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (distance.isNotEmpty) ...[
                        const Icon(Icons.navigation,
                            size: 12, color: Color(0xFF6B7280)),
                        const SizedBox(width: 3),
                        Text(distance,
                            style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF6B7280))),
                        const SizedBox(width: 10),
                      ],
                      if (pharmacy.openLabel.isNotEmpty) ...[
                        const Icon(Icons.schedule,
                            size: 12, color: AppTheme.primaryDark),
                        const SizedBox(width: 3),
                        Text(pharmacy.openLabel,
                            style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryDark)),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, size: 20, color: Color(0xFFCBD5E1)),
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
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.local_pharmacy_outlined,
              size: 48, color: Color(0xFFD1D5DB)),
          SizedBox(height: 12),
          Text('No pharmacies found',
              style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
        ],
      ),
    );
  }
}
