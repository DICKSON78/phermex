import 'package:flutter/material.dart';
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
    final address = _controller.text.trim();
    if (address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter an address'),
          backgroundColor: Color(0xFFDC2626),
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
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete address?'),
        content: Text(address),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFDC2626)),
            child: const Text('Delete'),
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
    return Scaffold(
      backgroundColor: AppTheme.bgLight,
      appBar: AppBar(title: const Text('Saved Addresses')),
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
                const Text('Add new address',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
                const SizedBox(height: 12),
                TextField(
                  controller: _controller,
                  maxLines: 2,
                  maxLength: 500,
                  decoration: const InputDecoration(
                    hintText: 'Street, landmark, house/unit...',
                    labelText: 'Delivery address *',
                    fillColor: Color(0xFFF9FAFB),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _addAddress,
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                    child: const Text('Save Address', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
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
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: Center(
                child: Text('No saved addresses yet',
                    style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
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
                            const Text('Default',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary)),
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
                            tooltip: 'Set as default',
                            onPressed: () => _setDefault(address),
                          ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, size: 20, color: Color(0xFFDC2626)),
                          tooltip: 'Delete',
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
