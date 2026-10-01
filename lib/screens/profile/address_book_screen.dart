import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../services/address_book_service.dart';
import '../../theme.dart';

class AddressBookScreen extends StatefulWidget {
  const AddressBookScreen({super.key});

  @override
  State<AddressBookScreen> createState() => _AddressBookScreenState();
}

class _AddressBookScreenState extends State<AddressBookScreen> {
  List<String> _addresses = [];
  String? _defaultAddress;
  bool _loading = true;
  final _controller = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final addresses = await AddressBookService.getAddresses();
    final defaultAddress = await AddressBookService.getDefaultAddress();
    if (!mounted) return;
    setState(() {
      _addresses = addresses;
      _defaultAddress = defaultAddress;
      _loading = false;
    });
  }

  Future<void> _addAddress() async {
    final L = AppLocalizations.of(context);
    final address = _controller.text.trim();
    if (address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(L.t('oh.enterAddressError')),
          backgroundColor: const Color(0xFFDC2626),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    await AddressBookService.addAddress(address);
    _controller.clear();
    await _load();
  }

  Future<void> _delete(String address) async {
    final L = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(L.t('oh.deleteAddressQ')),
        content: Text(address),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(L.t('cancel'))),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFDC2626)),
            child: Text(L.t('oh.delete')),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await AddressBookService.removeAddress(address);
    await _load();
  }

  Future<void> _setDefault(String address) async {
    await AddressBookService.setDefaultAddress(address);
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final L = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: Text(L.t('savedAddresses'))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFEEF1F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(L.t('oh.addNewAddress'),
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                const SizedBox(height: 12),
                TextField(
                  controller: _controller,
                  maxLines: 2,
                  maxLength: 500,
                  decoration: InputDecoration(
                    hintText: L.t('oh.addressHint'),
                    labelText: '${L.t('oh.deliveryAddress')} *',
                    fillColor: const Color(0xFFF9FAFB),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _addAddress,
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                    child: Text(L.t('oh.saveAddress'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_addresses.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 40),
              child: Center(
                child: Text(L.t('oh.noSavedAddresses'),
                    style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
              ),
            )
          else
            ..._addresses.map((address) {
              final isDefault = address == _defaultAddress;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDefault ? AppTheme.primary : const Color(0xFFEEF1F0),
                    width: isDefault ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.location_on_outlined, size: 20, color: AppTheme.primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(address,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF111827))),
                          if (isDefault) ...[
                            const SizedBox(height: 4),
                            Text(L.t('oh.defaultTag'),
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                          ],
                        ],
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (!isDefault)
                          IconButton(
                            icon: const Icon(Icons.check_circle_outline, size: 20, color: Color(0xFF9CA3AF)),
                            tooltip: L.t('oh.setAsDefault'),
                            onPressed: () => _setDefault(address),
                          ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFFDC2626)),
                          tooltip: L.t('oh.delete'),
                          onPressed: () => _delete(address),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
