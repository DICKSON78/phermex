import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../services/customer_repository.dart';
import '../../theme.dart';

class InsuranceScreen extends StatefulWidget {
  const InsuranceScreen({super.key});

  @override
  State<InsuranceScreen> createState() => _InsuranceScreenState();
}

class _InsuranceScreenState extends State<InsuranceScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _records = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final records = await CustomerRepository.myInsurance();
      setState(() { _records = records; _loading = false; });
    } catch (e) {
      setState(() { _error = ApiService.friendlyError(e); _loading = false; });
    }
  }

  Future<void> _remove(Map<String, dynamic> record) async {
    final id = record['id'];
    if (id == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove insurance?'),
        content: const Text('This will remove the insurance record from your profile.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Remove', style: TextStyle(color: Colors.redAccent))),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await CustomerRepository.removeInsurance(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Insurance record removed')));
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiService.friendlyError(e))));
      }
    }
  }

  Future<void> _add() async {
    final added = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const _AddInsuranceSheet()),
    );
    if (added == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Health Insurance'),
        backgroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _add,
            icon: const Icon(Icons.add_circle_outline, color: AppTheme.primary),
          ),
        ],
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
                  child: _records.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(24),
                          children: [
                            const SizedBox(height: 60),
                            const Icon(Icons.health_and_safety_outlined, size: 64, color: AppTheme.primary),
                            const SizedBox(height: 16),
                            const Text(
                              'No insurance policies yet',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Add your NHIF or private insurance policy so pharmacies can apply your coverage.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                            ),
                            const SizedBox(height: 24),
                            OutlinedButton.icon(
                              onPressed: _add,
                              icon: const Icon(Icons.add),
                              label: const Text('Add Insurance Policy'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.primary,
                                side: const BorderSide(color: AppTheme.primary),
                                minimumSize: const Size.fromHeight(48),
                              ),
                            ),
                          ],
                        )
                      : ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          children: [
                            const Text(
                              'Covered plans',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                            ),
                            const SizedBox(height: 12),
                            ..._records.map((r) => _InsuranceCard(
                                  record: r,
                                  onRemove: () => _remove(r),
                                )),
                            const SizedBox(height: 16),
                            OutlinedButton.icon(
                              onPressed: _add,
                              icon: const Icon(Icons.add),
                              label: const Text('Add another policy'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.primary,
                                side: const BorderSide(color: AppTheme.primary),
                                minimumSize: const Size.fromHeight(48),
                              ),
                            ),
                          ],
                        ),
                ),
    );
  }
}

class _InsuranceCard extends StatelessWidget {
  final Map<String, dynamic> record;
  final VoidCallback onRemove;

  const _InsuranceCard({required this.record, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final provider = (record['provider'] is Map ? record['provider'] : <String, dynamic>{});
    final pharmacy = (record['pharmacy'] is Map ? record['pharmacy'] : <String, dynamic>{});
    final providerName = provider['name']?.toString() ?? 'Insurance';
    final coverage = double.tryParse((record['coverage_percent'] ?? 0).toString()) ?? 0;
    final expiry = record['expiry_date']?.toString() ?? '';
    final isPrimary = record['is_primary'] == true;

    DateTime? expiryDate;
    if (expiry.isNotEmpty) expiryDate = DateTime.tryParse(expiry);
    final isExpired = expiryDate != null && expiryDate.isBefore(DateTime.now());

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.shield_outlined, color: AppTheme.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      providerName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textDark),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Policy ${record['policy_number']?.toString() ?? ''}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),
              if (isPrimary)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                  child: const Text('Primary', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                ),
              IconButton(
                onPressed: onRemove,
                icon: const Icon(Icons.delete_outline, size: 20, color: Colors.redAccent),
                tooltip: 'Remove',
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _InfoCell(label: 'Coverage', value: '${coverage.toStringAsFixed(0)}%'),
              ),
              if (pharmacy['pharmacy_name']?.toString().isNotEmpty == true)
                Expanded(
                  child: _InfoCell(label: 'Registered at', value: pharmacy['pharmacy_name'].toString()),
                ),
            ],
          ),
          if (expiryDate != null) ...[
            const SizedBox(height: 10),
            Text(
              isExpired ? 'Policy expired ${_fmtDate(expiryDate)}' : 'Valid until ${_fmtDate(expiryDate)}',
              style: TextStyle(fontSize: 12, color: isExpired ? Colors.redAccent : AppTheme.textMuted),
            ),
          ],
        ],
      ),
    );
  }

  String _fmtDate(DateTime d) => '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}

class _InfoCell extends StatelessWidget {
  final String label;
  final String value;

  const _InfoCell({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textDark)),
      ],
    );
  }
}

class _AddInsuranceSheet extends StatefulWidget {
  const _AddInsuranceSheet();

  @override
  State<_AddInsuranceSheet> createState() => _AddInsuranceSheetState();
}

class _AddInsuranceSheetState extends State<_AddInsuranceSheet> {
  final _formKey = GlobalKey<FormState>();
  final _policyNumber = TextEditingController();
  final _holderName = TextEditingController();
  String? _pharmacyId;
  String? _providerId;
  String _relationship = 'self';
  String? _expiryDate;
  double _coverage = 100;
  bool _saving = false;

  List<Map<String, dynamic>> _pharmacies = [];
  List<Map<String, dynamic>> _providers = [];
  bool _loadingData = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _policyNumber.dispose();
    _holderName.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() { _loadingData = true; });
    try {
      final pharmacies = await CustomerRepository.allPharmacies();
      final providers = await CustomerRepository.insuranceProviders();
      setState(() {
        _pharmacies = pharmacies.map((p) => {
          'id': p.id,
          'pharmacy_name': p.name ?? 'Pharmacy',
        }).toList();
        _providers = providers;
        _loadingData = false;
      });
    } catch (e) {
      setState(() { _loadingData = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiService.friendlyError(e))));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(
        title: const Text('Add Insurance Policy'),
        backgroundColor: Colors.white,
      ),
      body: _loadingData
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _label('Pharmacy *'),
                    DropdownButtonFormField<String>(
                      value: _pharmacyId,
                      isExpanded: true,
                      decoration: _decoration(),
                      items: _pharmacies.map((p) {
                        final name = p['pharmacy_name']?.toString() ?? p['name']?.toString() ?? 'Pharmacy';
                        return DropdownMenuItem(value: p['id'].toString(), child: Text(name, overflow: TextOverflow.ellipsis));
                      }).toList(),
                      onChanged: (v) => setState(() => _pharmacyId = v),
                      validator: (v) => v == null ? 'Select a pharmacy' : null,
                    ),
                    const SizedBox(height: 14),
                    _label('Insurance Provider *'),
                    DropdownButtonFormField<String>(
                      value: _providerId,
                      isExpanded: true,
                      decoration: _decoration(),
                      items: _providers.map((p) {
                        final name = p['name']?.toString() ?? 'Provider';
                        return DropdownMenuItem(
                          value: p['id'].toString(),
                          child: Text(name, overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (v) => setState(() => _providerId = v),
                      validator: (v) => v == null ? 'Select a provider' : null,
                    ),
                    const SizedBox(height: 14),
                    _label('Policy Number *'),
                    TextFormField(
                      controller: _policyNumber,
                      decoration: _decoration(hint: 'e.g. 0100-1234567'),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Policy number is required' : null,
                    ),
                    const SizedBox(height: 14),
                    _label('Holder Name'),
                    TextFormField(
                      controller: _holderName,
                      decoration: _decoration(hint: 'Policy holder name'),
                    ),
                    const SizedBox(height: 14),
                    _label('Relationship'),
                    DropdownButtonFormField<String>(
                      value: _relationship,
                      isExpanded: true,
                      decoration: _decoration(),
                      items: const [
                        DropdownMenuItem(value: 'self', child: Text('Self')),
                        DropdownMenuItem(value: 'spouse', child: Text('Spouse')),
                        DropdownMenuItem(value: 'child', child: Text('Child')),
                        DropdownMenuItem(value: 'dependent', child: Text('Dependent')),
                      ],
                      onChanged: (v) => setState(() => _relationship = v ?? 'self'),
                    ),
                    const SizedBox(height: 14),
                    _label('Coverage %'),
                    Text(
                      '${_coverage.toStringAsFixed(0)}% of your bill will be covered',
                      style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                    ),
                    Slider(
                      value: _coverage,
                      min: 0,
                      max: 100,
                      divisions: 20,
                      activeColor: AppTheme.primary,
                      onChanged: (v) => setState(() => _coverage = v),
                    ),
                    const SizedBox(height: 8),
                    _label('Expiry Date'),
                    OutlinedButton.icon(
                      onPressed: _pickExpiry,
                      icon: const Icon(Icons.calendar_today_outlined, size: 18),
                      label: Text(_expiryDate ?? 'Select expiry date'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.textDark,
                        alignment: Alignment.centerLeft,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 24),
                    OutlinedButton.icon(
                      onPressed: _saving ? null : _save,
                      icon: const Icon(Icons.check),
                      label: Text(_saving ? 'Saving…' : 'Save Policy'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.primary,
                        side: const BorderSide(color: AppTheme.primary),
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  InputDecoration _decoration({String? hint}) => InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.redAccent)),
      );

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textDark)),
      );

  Future<void> _pickExpiry() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 365)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365 * 10)),
    );
    if (picked != null) {
      setState(() => _expiryDate = '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}');
    }
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    try {
      await CustomerRepository.addInsurance({
        'pharmacy_id': int.tryParse(_pharmacyId ?? ''),
        'insurance_provider_id': int.tryParse(_providerId ?? ''),
        'policy_number': _policyNumber.text.trim(),
        'holder_name': _holderName.text.trim().isEmpty ? null : _holderName.text.trim(),
        'relationship': _relationship,
        'expiry_date': _expiryDate,
        'coverage_percent': _coverage,
        'is_primary': true,
      });
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiService.friendlyError(e))));
        setState(() => _saving = false);
      }
    }
  }
}