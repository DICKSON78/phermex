import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../theme.dart';
import '../../utils/helpers.dart';

class DrugDetailScreen extends StatelessWidget {
  final Drug drug;
  final Pharmacy pharmacy;
  const DrugDetailScreen({super.key, required this.drug, required this.pharmacy});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: Text(drug.name ?? 'Drug Details')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Image
          if (drug.image != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(drug.image!, height: 200, fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(height: 200, color: const Color(0xFFF3F4F6),
                  child: const Icon(Icons.medication, size: 48, color: Color(0xFF9CA3AF))),
              ),
            ),
          if (drug.image == null)
            Container(height: 200, decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.medication, size: 48, color: Color(0xFF9CA3AF))),
          const SizedBox(height: 20),
          // Name + Generic
          Text(drug.name ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF111827))),
          if (drug.genericName != null && drug.genericName!.isNotEmpty)
            Padding(padding: const EdgeInsets.only(top: 4), child: Text(drug.genericName!, style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)))),
          const SizedBox(height: 16),
          // Price + Stock card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFEEF1F0))),
            child: Row(
              children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Price', style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                  Text(AppHelpers.formatTZS(drug.price), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                ])),
                Container(width: 1, height: 36, color: const Color(0xFFEEF1F0)),
                Expanded(child: Center(child: Column(children: [
                  const Text('Stock', style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                  Text('${drug.quantity ?? 0}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: (drug.quantity ?? 0) > 0 ? const Color(0xFF059669) : const Color(0xFFDC2626))),
                ]))),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Details
          _detail('Manufacturer', drug.manufacturer),
          _detail('Category', drug.categoryName),
          _detail('Unit', drug.unit),
          if (drug.description != null && drug.description!.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('Description', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
            const SizedBox(height: 6),
            Text(drug.description!, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), height: 1.5)),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _detail(String label, String? value) {
    if (value == null || value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        Text('$label: ', style: const TextStyle(fontSize: 13, color: Color(0xFF9CA3AF))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827)))),
      ]),
    );
  }
}
