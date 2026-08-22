import 'package:flutter_test/flutter_test.dart';
import 'package:pharmex_customer_app/utils/helpers.dart';

void main() {
  test('formatTZS formats large numbers with thousand separators', () {
    expect(AppHelpers.formatTZS(15000), 'TZS 15,000');
    expect(AppHelpers.formatTZS(0), 'TZS 0');
    expect(AppHelpers.formatTZS(1234567.5), 'TZS 1,234,568');
  });

  test('statusLabel humanizes order statuses', () {
    expect(AppHelpers.statusLabel('pending'), 'Pending');
    expect(AppHelpers.statusLabel('delivered'), 'Delivered');
    expect(AppHelpers.statusLabel(''), '');
  });
}
