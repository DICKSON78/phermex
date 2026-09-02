import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../models/models.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';
import '../notifications/notifications_screen.dart';
import '../pharmacy/pharmacy_detail_screen.dart';
import '../orders/orders_list_screen.dart';
import '../orders/order_detail_screen.dart';
import '../orders/delivery_tracking_screen.dart';
import '../prescriptions/prescriptions_screen.dart';
import 'all_pharmacies_screen.dart';

// M-TAI / Vantage design language adapted to Pharmex.
// Light surface, white rounded cards with subtle shadow, tinted status pills,
// rounded icon tiles, section headers with counts.

class HomeScreen extends StatefulWidget {
  final int unreadNotifications;
  final int refreshTick;
  const HomeScreen({super.key, this.unreadNotifications = 0, this.refreshTick = 0});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Pharmacy> _pharmacies = [];
  List<Order> _recentOrders = [];
  bool _loading = true;
  String? _error;
  String? _search;
  final _searchController = TextEditingController();
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _userName = ApiService.userName ?? '';
    _load();
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshTick != oldWidget.refreshTick) _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() => _search = null);
    _load();
  }

  void _openCategory(String category) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => AllPharmaciesScreen(initialCategory: category),
      ),
    );
  }

  void _openAllPharmacies() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const AllPharmaciesScreen()),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    final name = _userName.isNotEmpty ? ' ${_userName.split(' ').first}' : '';
    if (h < 12) return 'Good morning$name';
    if (h < 17) return 'Good afternoon$name';
    return 'Good evening$name';
  }

  String get _avatarInitial {
    final first = _userName.trim().split(RegExp(r'\s+')).first;
    return first.isNotEmpty ? first[0].toUpperCase() : 'H';
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    var usedFallbackLocation = false;
    try {
      Position? pos;
      try {
        var enabled = await Geolocator.isLocationServiceEnabled();
        if (enabled) {
          var perm = await Geolocator.checkPermission();
          if (perm == LocationPermission.denied) {
            perm = await Geolocator.requestPermission();
          }
          if (perm == LocationPermission.whileInUse || perm == LocationPermission.always) {
            pos = await Geolocator.getCurrentPosition();
          }
        }
      } catch (_) {}
      usedFallbackLocation = pos == null;
      final lat = pos?.latitude ?? -6.7924;
      final lng = pos?.longitude ?? 39.2083;
      // Fetch pharmacies and recent orders independently so a failure in one
      // does not blank the other. Use a wide radius so pharmacies always show.
      List<Pharmacy> pharmacies = const [];
      List<Order> orders = const [];
      String? sectionError;
      try {
        pharmacies = await CustomerRepository.nearby(
            latitude: lat, longitude: lng, radiusKm: 100, search: _search);
      } catch (_) {
        sectionError = 'Could not load pharmacies. Pull to refresh.';
      }
      try {
        orders = await CustomerRepository.myOrders();
      } catch (_) {
        if (sectionError == null) sectionError = null;
      }
      if (!mounted) return;
      setState(() {
        _pharmacies = pharmacies;
        _recentOrders = orders.take(3).toList();
        _error = sectionError;
      });
      if (usedFallbackLocation) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Location unavailable — showing pharmacies in Dar es Salaam. Enable location for results near you.'),
          behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 4),
        ));
      }
    } catch (e) {
      if (mounted) setState(() => _error = ApiService.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Order? get _activeOrder {
    for (final o in _recentOrders) {
      final s = o.orderStatus;
      if (s != null && s != 'delivered' && s != 'cancelled' && s != 'completed') return o;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: Column(
        children: [
          _HomeHeader(
            topPadding: topInset + 8,
            greeting: _greeting(),
            name: _userName.trim().isNotEmpty ? _userName.trim() : 'Shopper',
            tagline: AppStrings.tagline,
            initial: _avatarInitial,
            unreadNotifications: widget.unreadNotifications,
            onNotifications: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
          ),

          _SearchBox(
            controller: _searchController,
            onSubmitted: (v) {
              setState(() => _search = v.isEmpty ? null : v);
              _load();
            },
            onClear: _clearSearch,
          ),

          _CategoryChips(
            onSelect: _openCategory,
          ),

          Expanded(
            child: RefreshIndicator(
              color: AppTheme.primary,
              onRefresh: _load,
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _QuickActions(
                    onOrderMedicine: _openAllPharmacies,
                    onUploadRx: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const PrescriptionsScreen()),
                    ),
                  ),

                  if (_activeOrder != null)
                    _ActiveOrderCard(
                      order: _activeOrder!,
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => DeliveryTrackingScreen(orderId: _activeOrder!.id),
                        ),
                      ),
                    ),

                  if (_recentOrders.isNotEmpty)
                    _SectionHeader(
                      title: 'Recent Orders',
                      actionLabel: 'See all',
                      onAction: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const OrdersListScreen()),
                      ),
                      child: Column(
                        children: _recentOrders
                            .map((o) => Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: GestureDetector(
                                    onTap: () => Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => OrderDetailScreen(orderId: o.id),
                                      ),
                                    ),
                                    child: _RecentOrderCard(order: o),
                                  ),
                                ))
                            .toList(),
                      ),
                    ),

                  _NearbySection(
                    nearbyKey: _nearbyKey,
                    pharmacies: _pharmacies,
                    loading: _loading,
                    error: _error,
                    onRetry: _load,
                    onViewAll: _openAllPharmacies,
                  ),

                  const SizedBox(height: 28),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  final GlobalKey _nearbyKey = GlobalKey();
}

// ---- Header ---------------------------------------------------------------
class _HomeHeader extends StatelessWidget {
  final String greeting;
  final String name;
  final String tagline;
  final String initial;
  final int unreadNotifications;
  final double topPadding;
  final VoidCallback onNotifications;

  const _HomeHeader({
    required this.greeting,
    required this.name,
    required this.tagline,
    required this.initial,
    required this.unreadNotifications,
    required this.topPadding,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.bgLight,
      padding: EdgeInsets.fromLTRB(20, topPadding, 20, 8),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppTheme.primaryDark,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(greeting,
                    style: const TextStyle(
                        fontSize: 12, color: AppTheme.textMuted, fontWeight: FontWeight.w500)),
                const SizedBox(height: 1),
                Text(name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
                const SizedBox(height: 1),
                Text(tagline,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onNotifications,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.notifications_none, size: 22, color: AppTheme.primaryDark),
                  if (unreadNotifications > 0)
                    Positioned(
                      right: 2,
                      top: 2,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Color(0xFFDC2626),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Search ---------------------------------------------------------------
class _SearchBox extends StatefulWidget {
  final TextEditingController controller;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onClear;
  const _SearchBox({
    required this.controller,
    required this.onSubmitted,
    required this.onClear,
  });

  @override
  State<_SearchBox> createState() => _SearchBoxState();
}

class _SearchBoxState extends State<_SearchBox> {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
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
                controller: widget.controller,
                onChanged: (_) => setState(() {}),
                onSubmitted: widget.onSubmitted,
                decoration: const InputDecoration(
                  hintText: 'Search medicines or pharmacies...',
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
            if (widget.controller.text.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.clear, size: 18, color: Color(0xFF94A3B8)),
                onPressed: widget.onClear,
              ),
          ],
        ),
      ),
    );
  }
}

// ---- Category chips (replaces trust row) ----------------------------------
const kHomeCategories = <String>[
  'Pain Relief',
  'Antibiotics',
  'Vitamins',
  'Cough & Cold',
  'First Aid',
  'Skin Care',
  'Baby Care',
  'Digestive Health',
];

const kCategoryIcons = <String, IconData>{
  'Pain Relief': Icons.healing_outlined,
  'Antibiotics': Icons.medication_outlined,
  'Vitamins': Icons.health_and_safety_outlined,
  'Cough & Cold': Icons.face_outlined,
  'First Aid': Icons.medical_services_outlined,
  'Skin Care': Icons.spa_outlined,
  'Baby Care': Icons.child_care_outlined,
  'Digestive Health': Icons.lunch_dining_outlined,
};

class _CategoryChips extends StatelessWidget {
  final ValueChanged<String> onSelect;
  const _CategoryChips({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Text('Shop by Category',
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
        ),
        SizedBox(
          height: 96,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            children: kHomeCategories.map((name) {
              return Padding(
                padding: const EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () => onSelect(name),
                  child: SizedBox(
                    width: 64,
                    child: Column(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(kCategoryIcons[name] ?? Icons.category_outlined,
                              size: 24, color: AppTheme.primaryDark),
                        ),
                        const SizedBox(height: 6),
                        Text(name,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 10,
                                color: AppTheme.textMuted,
                                fontWeight: FontWeight.w500,
                                height: 1.1)),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

// ---- Quick actions --------------------------------------------------------
class _QuickActions extends StatelessWidget {
  final VoidCallback onOrderMedicine;
  final VoidCallback onUploadRx;
  const _QuickActions({required this.onOrderMedicine, required this.onUploadRx});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: onOrderMedicine,
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.primary, AppTheme.primaryDark],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                        color: AppTheme.primary.withOpacity(0.25),
                        blurRadius: 12,
                        offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.22),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child:
                          const Icon(Icons.medication, size: 22, color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    const Text('Order Medicine',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                    const SizedBox(height: 2),
                    const Text('Find & order drugs nearby',
                        style: TextStyle(fontSize: 10, color: Colors.white70)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: onUploadRx,
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFEEF1F0)),
                  boxShadow: const [
                    BoxShadow(
                        color: Color(0x0D0F172A), blurRadius: 8, offset: Offset(0, 2)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.upload_file,
                          size: 22, color: AppTheme.primaryDark),
                    ),
                    const SizedBox(height: 12),
                    const Text('Upload Rx',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textDark)),
                    const SizedBox(height: 2),
                    const Text('Submit prescription',
                        style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Section header wrapper ----------------------------------------------
class _SectionHeader extends StatelessWidget {
  final String title;
  final String actionLabel;
  final VoidCallback onAction;
  final Widget child;
  const _SectionHeader({
    required this.title,
    required this.actionLabel,
    required this.onAction,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              GestureDetector(
                onTap: onAction,
                child: const Row(
                  children: [
                    Text('See all',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryDark)),
                    Icon(Icons.chevron_right, size: 14, color: AppTheme.primaryDark),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

// ---- Active order card ----------------------------------------------------
class _ActiveOrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;
  const _ActiveOrderCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppTheme.primary, width: 1.2),
            boxShadow: const [
              BoxShadow(color: Color(0x0D0F172A), blurRadius: 10, offset: Offset(0, 3)),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.inventory_2_outlined,
                    size: 20, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Active Order',
                        style: TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                    Text('#${order.orderCode ?? order.id}',
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827))),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  children: [
                    Text('Track',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                    SizedBox(width: 4),
                    Icon(Icons.navigation, size: 13, color: Colors.white),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---- Recent order card ----------------------------------------------------
class _RecentOrderCard extends StatelessWidget {
  final Order order;
  const _RecentOrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final status = order.orderStatus ?? '';
    final statusColor = AppHelpers.statusColor(status);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
        boxShadow: const [
          BoxShadow(color: Color(0x0D0F172A), blurRadius: 8, offset: Offset(0, 2)),
        ],
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
            child: const Icon(Icons.inventory_2_outlined,
                size: 17, color: AppTheme.primaryDark),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(order.pharmacyName ?? 'Pharmacy',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textDark)),
                    ),
                    const SizedBox(width: 8),
                    _Pill(
                      label: AppHelpers.statusLabel(status).toUpperCase(),
                      color: statusColor,
                      textColor: statusColor,
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('#${order.orderCode ?? order.id}',
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF94A3B8))),
                    Text(AppHelpers.formatTZS(order.total),
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textDark)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ---- Nearby pharmacies section -------------------------------------------
class _NearbySection extends StatelessWidget {
  final GlobalKey nearbyKey;
  final List<Pharmacy> pharmacies;
  final bool loading;
  final String? error;
  final VoidCallback onRetry;
  final VoidCallback onViewAll;
  const _NearbySection({
    required this.nearbyKey,
    required this.pharmacies,
    required this.loading,
    required this.error,
    required this.onRetry,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      key: nearbyKey,
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Nearby Pharmacies',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textDark)),
              GestureDetector(
                onTap: onViewAll,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('View all',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primaryDark)),
                      SizedBox(width: 4),
                      Icon(Icons.chevron_right,
                          size: 14, color: AppTheme.primaryDark),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            )
          else if (error != null) ...[
            _ErrorBox(message: error!, onRetry: onRetry),
            const SizedBox(height: 12),
          ] else if (pharmacies.isEmpty)
            _EmptyBox(
              icon: Icons.location_on_outlined,
              message: 'No pharmacies found nearby',
            )
          else
            ...pharmacies
                .map((p) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _NearbyPharmacyCard(pharmacy: p),
                    ))
                .toList(),
        ],
      ),
    );
  }
}

class _NearbyPharmacyCard extends StatelessWidget {
  final Pharmacy pharmacy;
  const _NearbyPharmacyCard({required this.pharmacy});

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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: const [
              BoxShadow(
                  color: Color(0x12000000), blurRadius: 10, offset: Offset(0, 3)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cover image / placeholder
              SizedBox(
                height: 110,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    pharmacy.coverImage != null &&
                            pharmacy.coverImage!.isNotEmpty
                        ? Image.network(
                            pharmacy.coverImage!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _coverFallback(),
                          )
                        : _coverFallback(),
                    // Dark gradient overlay for legibility
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Color(0x66000000)],
                        ),
                      ),
                    ),
                    Positioned(
                      left: 14,
                      bottom: 12,
                      child: Row(
                        children: [
                          Container(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primary,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.local_pharmacy,
                                    size: 13, color: Colors.white),
                                SizedBox(width: 4),
                                Text('Pharmacy',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (pharmacy.hasRating)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.45),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star,
                                      size: 13, color: Color(0xFFFBBF24)),
                                  const SizedBox(width: 3),
                                  Text(
                                      '${pharmacy.rating!.toStringAsFixed(1)}',
                                      style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white)),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (distance.isNotEmpty)
                      Positioned(
                        top: 10,
                        right: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(999),
                            boxShadow: const [
                              BoxShadow(
                                  color: Color(0x22000000),
                                  blurRadius: 4,
                                  offset: Offset(0, 1)),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.navigation,
                                  size: 12, color: AppTheme.primaryDark),
                              const SizedBox(width: 3),
                              Text(distance,
                                  style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.textDark)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(pharmacy.name ?? 'Pharmacy',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textDark)),
                        ),
                        if (pharmacy.hasRating)
                          Text('${pharmacy.totalReviews} reviews',
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: Color(0xFF94A3B8),
                                  fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.place_outlined,
                            size: 13, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            pharmacy.locationLabel.isEmpty
                                ? 'Pharmacy'
                                : pharmacy.locationLabel,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, color: Color(0xFF94A3B8)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (pharmacy.openLabel.isNotEmpty) ...[
                      Row(
                        children: [
                          const Icon(Icons.schedule,
                              size: 13, color: AppTheme.primaryDark),
                          const SizedBox(width: 4),
                          Text(pharmacy.openLabel,
                              style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primaryDark)),
                        ],
                      ),
                      const SizedBox(height: 10),
                    ],
                    GestureDetector(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) =>
                                PharmacyDetailScreen(pharmacy: pharmacy)),
                      ),
                      child: Container(
                        height: 44,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text('Order Now',
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _coverFallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.primary, AppTheme.primaryDark],
        ),
      ),
      child: const Center(
        child: Icon(Icons.local_pharmacy, size: 42, color: Colors.white70),
      ),
    );
  }
}

// ---- Pill (tinted badge, M-TAI Badge) -------------------------------------
class _Pill extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;
  final IconData? icon;
  const _Pill({
    required this.label,
    required this.color,
    required this.textColor,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 10, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(label,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: textColor,
                  fontFamily: 'Poppins')),
        ],
      ),
    );
  }
}

// ---- Empty box ------------------------------------------------------------
class _EmptyBox extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyBox({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 26, color: const Color(0xFFD1D5DB)),
          const SizedBox(height: 8),
          Text(message,
              style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
        ],
      ),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorBox({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        children: [
          Text(message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
