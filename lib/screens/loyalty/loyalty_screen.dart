import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  bool _loading = true;
  String? _error;
  List<_PharmacyLoyalty> _pharmacies = [];
  List<_LoyaltyTx> _transactions = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await CustomerRepository.myLoyalty();
      final pharmaciesRaw = res['pharmacies'];
      final txRaw = res['transactions'];
      setState(() {
        _pharmacies = (pharmaciesRaw is List ? pharmaciesRaw : []).map<_PharmacyLoyalty>((p) => _PharmacyLoyalty.fromJson(p)).toList();
        _transactions = (txRaw is List ? txRaw : []).map<_LoyaltyTx>((t) => _LoyaltyTx.fromJson(t)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = ApiService.friendlyError(e); _loading = false; });
    }
  }

  String _typeLabel(String? type) {
    switch (type) {
      case 'earn': return 'Earned';
      case 'redeem': return 'Redeemed';
      case 'adjust': return 'Adjusted';
      default: return 'Transaction';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Loyalty & Rewards'),
        backgroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, style: const TextStyle(color: Colors.redAccent), textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        TextButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    children: [
                      // How it works
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: AppTheme.primary, size: 22),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Earn 1 point for every 1,000 TSH spent. Points can be redeemed on your next purchase.',
                                style: TextStyle(color: AppTheme.primary, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Pharmacy balances
                      if (_pharmacies.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          child: Text('No loyalty points yet. Place your first order to start earning!', style: TextStyle(color: Colors.grey[500], fontSize: 14)),
                        )
                      else ...[
                        Text('My Points', style: TextStyle(color: Colors.grey[800], fontSize: 15, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        ..._pharmacies.map((p) => Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.stars_rounded, color: AppTheme.primary, size: 22),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.pharmacyName ?? 'Pharmacy', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text('Redeemable: ${(p.points * p.redeemTshPerPoint).toInt().toString()} TSH', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                                  ],
                                ),
                              ),
                              Text('${p.points}', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w800, fontSize: 22)),
                            ],
                          ),
                        )),
                      ],

                      const SizedBox(height: 16),

                      // Transaction history
                      if (_transactions.isNotEmpty) ...[
                        Text('Transaction History', style: TextStyle(color: Colors.grey[800], fontSize: 15, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                          ),
                          child: Column(
                            children: [
                              for (int i = 0; i < _transactions.length; i++) ...[
                                if (i > 0) const Divider(height: 1, indent: 16, endIndent: 16),
                                _TransactionRow(tx: _transactions[i], label: _typeLabel(_transactions[i].type)),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}

class _PharmacyLoyalty {
  final int? pharmacyId;
  final String? pharmacyName;
  final int points;
  final double redeemTshPerPoint;

  _PharmacyLoyalty({this.pharmacyId, this.pharmacyName, this.points = 0, this.redeemTshPerPoint = 20});

  factory _PharmacyLoyalty.fromJson(Map<String, dynamic> json) => _PharmacyLoyalty(
        pharmacyId: json['pharmacy_id'],
        pharmacyName: json['pharmacy_name'],
        points: json['points'] ?? 0,
        redeemTshPerPoint: (json['redeem_tsh_per_point'] ?? 20).toDouble(),
      );
}

class _LoyaltyTx {
  final int? id;
  final int points;
  final String? type;
  final String? description;
  final String? pharmacyName;
  final String? createdAt;

  _LoyaltyTx({this.id, this.points = 0, this.type, this.description, this.pharmacyName, this.createdAt});

  factory _LoyaltyTx.fromJson(Map<String, dynamic> json) => _LoyaltyTx(
        id: json['id'],
        points: json['points'] ?? 0,
        type: json['type']?.toString(),
        description: json['description']?.toString(),
        pharmacyName: json['pharmacy_name']?.toString(),
        createdAt: json['created_at']?.toString(),
      );
}

class _TransactionRow extends StatelessWidget {
  final _LoyaltyTx tx;
  final String label;

  const _TransactionRow({required this.tx, required this.label});

  @override
  Widget build(BuildContext context) {
    final isEarn = tx.points >= 0;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: isEarn ? const Color(0xFFECFDF5) : const Color(0xFFFEE2E2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isEarn ? Icons.add_circle_outline : Icons.remove_circle_outline,
              color: isEarn ? const Color(0xFF059669) : const Color(0xFFDC2626),
              size: 18,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.description ?? label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(
                  [label, if (tx.pharmacyName != null) tx.pharmacyName!, if (tx.createdAt != null) tx.createdAt!].join(' · '),
                  style: TextStyle(color: Colors.grey[500], fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            '${isEarn ? '+' : ''}${tx.points}',
            style: TextStyle(
              color: isEarn ? const Color(0xFF059669) : const Color(0xFFDC2626),
              fontWeight: FontWeight.w800,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}