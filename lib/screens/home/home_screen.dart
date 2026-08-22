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
import '../prescriptions/prescriptions_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Pharmacy> _pharmacies = [];
  List<Order> _recentOrders = [];
  bool _loading = true;
  String? _error;
  String? _search;
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _userName = ApiService.userName ?? '';
    _load();
  }

  String _greeting() {
    final h = DateTime.now().hour;
    final name = _userName.isNotEmpty ? ' ${_userName.split(' ').first}' : '';
    if (h < 12) return 'Good Morning$name';
    if (h < 17) return 'Good Afternoon$name';
    return 'Good Evening$name';
  }

  Future<void> _load() async {
    setState(() => _loading = true);
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
      final lat = pos?.latitude ?? -6.7924;
      final lng = pos?.longitude ?? 39.2083;
      final results = await Future.wait<Object>([
        CustomerRepository.nearby(latitude: lat, longitude: lng, search: _search),
        CustomerRepository.myOrders(),
      ]);
      if (!mounted) return;
      setState(() {
        _pharmacies = (results[0] as List).cast<Pharmacy>();
        _recentOrders = (results[1] as List).cast<Order>().take(3).toList();
        _error = null;
      });
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
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
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            // Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_greeting(),
                              style: const TextStyle(
                                  fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
                          const SizedBox(height: 2),
                          const Text('Find Your Medicine',
                              style: TextStyle(
                                  fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                        ],
                      ),
                      GestureDetector(
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                        ),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF9FAFB),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.notifications_none, size: 18, color: Color(0xFF6B7280)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Search
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: TextField(
                      onSubmitted: (v) {
                        setState(() => _search = v.isEmpty ? null : v);
                        _load();
                      },
                      style: const TextStyle(fontSize: 14, fontFamily: 'Poppins'),
                      decoration: InputDecoration(
                        hintText: 'Search medicines or pharmacies...',
                        hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF9CA3AF)),
                        prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF9CA3AF)),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Quick actions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => Scrollable.ensureVisible(_nearbyKey.currentContext!),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(color: AppTheme.primary.withOpacity(0.2), blurRadius: 10),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.25),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.medication, size: 24, color: AppTheme.dark),
                            ),
                            const SizedBox(height: 12),
                            const Text('Order Medicine',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.dark)),
                            const SizedBox(height: 2),
                            const Text('Find & order drugs nearby',
                                style: TextStyle(fontSize: 10, color: Color(0x80000F14))),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const PrescriptionsScreen()),
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFEEF1F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3E8FF),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.upload_file, size: 24, color: Color(0xFFA855F7)),
                            ),
                            const SizedBox(height: 12),
                            const Text('Upload Rx',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                            const SizedBox(height: 2),
                            const Text('Submit prescription',
                                style: TextStyle(fontSize: 10, color: Color(0xFF9CA3AF))),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Active order banner
            if (_activeOrder != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: GestureDetector(
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: _activeOrder!.id)),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.dark,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.inventory_2_outlined, size: 16, color: AppTheme.dark),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Active Order',
                                  style: TextStyle(fontSize: 12, color: Color(0x99FFFFFF))),
                              Text('#${_activeOrder!.orderCode ?? _activeOrder!.id}',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                            ],
                          ),
                        ),
                        const Row(
                          children: [
                            Text('Track', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                            SizedBox(width: 4),
                            Icon(Icons.navigation, size: 12, color: AppTheme.primary),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Recent orders
            if (_recentOrders.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Recent Orders',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                        GestureDetector(
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const OrdersListScreen()),
                          ),
                          child: const Row(
                            children: [
                              Text('See all',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                              Icon(Icons.chevron_right, size: 14, color: AppTheme.primary),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ..._recentOrders.map((o) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: GestureDetector(
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: o.id)),
                            ),
                            child: _RecentOrderCard(order: o),
                          ),
                        )),
                  ],
                ),
              ),

            // Nearby pharmacies
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Nearby Pharmacies',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                      Text('${_pharmacies.length} found',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_loading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (_error != null)
                    _ErrorBox(message: _error!, onRetry: _load)
                  else if (_pharmacies.isEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFEEF1F0)),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.location_on_outlined, size: 24, color: Color(0xFFD1D5DB)),
                          SizedBox(height: 8),
                          Text('No pharmacies found nearby',
                              style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
                        ],
                      ),
                    )
                  else
                    ..._pharmacies.map((p) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _NearbyPharmacyCard(pharmacy: p),
                        )),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  final GlobalKey _nearbyKey = GlobalKey();
}

class _RecentOrderCard extends StatelessWidget {
  final Order order;
  const _RecentOrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final status = order.orderStatus ?? '';
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEF1F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.inventory_2_outlined, size: 16, color: AppTheme.primary),
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
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppHelpers.statusColor(status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(status.toUpperCase(),
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppHelpers.statusColor(status))),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('#${order.orderCode ?? order.id}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                    Text(AppHelpers.formatTZS(order.total),
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
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

class _NearbyPharmacyCard extends StatelessWidget {
  final Pharmacy pharmacy;
  const _NearbyPharmacyCard({required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    final distance = pharmacy.distance != null ? '${pharmacy.distance!.toStringAsFixed(1)} km' : '';
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => PharmacyDetailScreen(pharmacy: pharmacy)),
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFEEF1F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppTheme.primary.withOpacity(0.1), AppTheme.primary.withOpacity(0.05)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.local_pharmacy, size: 24, color: AppTheme.primary),
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
                            child: Text(pharmacy.name ?? 'Pharmacy',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text('OPEN',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF059669))),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        pharmacy.locationLabel.isEmpty ? 'Pharmacy' : pharmacy.locationLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (distance.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3F4F6),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.navigation, size: 8, color: Color(0xFF6B7280)),
                                  const SizedBox(width: 3),
                                  Text(distance,
                                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                          ],
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.star, size: 8, color: Color(0xFFFBBF24)),
                                SizedBox(width: 3),
                                Text('4.5',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFFD97706))),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => PharmacyDetailScreen(pharmacy: pharmacy)),
                    ),
                    child: Container(
                      height: 40,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('Order Now',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.dark)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
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
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Column(
        children: [
          Text(message, textAlign: TextAlign.center, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
