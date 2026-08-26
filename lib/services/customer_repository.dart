import '../models/models.dart';
import 'api_service.dart';

class CustomerRepository {
  static dynamic _data(dynamic res) => res is Map ? res['data'] : res;

  static Future<void> login(String login, String password) async {
    final res = await ApiService.post('/login', {'login': login, 'password': password});
    final data = res['data'];
    if (data is Map && data['token'] != null && data['user'] is Map) {
      await ApiService.saveSession(data['token'].toString(), data['user']);
    } else {
      throw ApiException('Invalid login response');
    }
  }

  static Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String passwordConfirmation,
  }) async {
    final res = await ApiService.post('/register', {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
      'password_confirmation': passwordConfirmation,
    });
    final data = res['data'];
    if (data is Map && data['token'] != null && data['user'] is Map) {
      await ApiService.saveSession(data['token'].toString(), data['user']);
    } else {
      throw ApiException('Invalid register response');
    }
  }

  static Future<Map<String, dynamic>> me() async {
    final res = await ApiService.get('/me');
    return _data(res);
  }

  static Future<void> updateProfile({
    String? name,
    String? phone,
    String? email,
    String? password,
    String? passwordConfirmation,
  }) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (email != null) body['email'] = email;
    if (password != null && password.isNotEmpty) {
      body['password'] = password;
      body['password_confirmation'] = passwordConfirmation ?? password;
    }
    final res = await ApiService.put('/me', body);
    final user = _data(res);
    if (user is Map) {
      await ApiService.updateCachedUser(Map<String, dynamic>.from(user));
    }
  }

  static Future<List<Pharmacy>> nearby({
    required double latitude,
    required double longitude,
    double radiusKm = 50,
    String? search,
  }) async {
    final res = await ApiService.get(
      '/nearby?latitude=$latitude&longitude=$longitude&radius_km=$radiusKm'
      '${search != null ? '&search=${Uri.encodeQueryComponent(search)}' : ''}',
    );
    final data = _data(res);
    if (data is List) return data.map((p) => Pharmacy.fromJson(p)).toList();
    return [];
  }

  static Future<Pharmacy> pharmacyDetail(int id) async {
    final res = await ApiService.get('/pharmacies/$id');
    final data = _data(res);
    if (data is Map && data['pharmacy'] is Map) {
      return Pharmacy.fromJson(Map<String, dynamic>.from(data['pharmacy']));
    }
    return Pharmacy.fromJson(data is Map ? Map<String, dynamic>.from(data) : {});
  }

  static Future<List<Drug>> pharmacyDrugs(int pharmacyId, {String? search, int? categoryId}) async {
    final query = '?per_page=100'
        '${search != null ? '&search=${Uri.encodeQueryComponent(search)}' : ''}'
        '${categoryId != null ? '&category_id=$categoryId' : ''}';
    final res = await ApiService.get('/pharmacies/$pharmacyId/drugs$query');
    final data = _data(res);
    if (data is Map && data['data'] is List) {
      return (data['data'] as List).map((d) => Drug.fromJson(d)).toList();
    }
    if (data is List) return data.map((d) => Drug.fromJson(d)).toList();
    return [];
  }

  static Future<List<DrugCategory>> pharmacyCategories(int pharmacyId) async {
    final res = await ApiService.get('/pharmacies/$pharmacyId/categories');
    final data = _data(res);
    if (data is List) return data.map((c) => DrugCategory.fromJson(c)).toList();
    return [];
  }

  static Future<Order> placeOrder({
    required int pharmacyId,
    required List<CartItem> items,
    required String deliveryAddress,
    String? deliveryPhone,
    double? deliveryLatitude,
    double? deliveryLongitude,
    String? notes,
  }) async {
    final res = await ApiService.post('/orders', {
      'pharmacy_id': pharmacyId,
      'items': items
          .map((i) => {'drug_id': i.drug.id, 'quantity': i.quantity})
          .toList(),
      'delivery_address': deliveryAddress,
      if (deliveryPhone != null && deliveryPhone.isNotEmpty)
        'delivery_phone': deliveryPhone,
      if (deliveryLatitude != null) 'delivery_latitude': deliveryLatitude,
      if (deliveryLongitude != null) 'delivery_longitude': deliveryLongitude,
      'notes': notes,
    });
    final data = _data(res);
    return Order.fromJson(data is Map ? Map<String, dynamic>.from(data) : {});
  }

  static Future<List<Order>> myOrders() async {
    final res = await ApiService.get('/orders?per_page=50');
    final data = _data(res);
    if (data is Map && data['data'] is List) {
      return (data['data'] as List).map((o) => Order.fromJson(o)).toList();
    }
    if (data is List) return data.map((o) => Order.fromJson(o)).toList();
    return [];
  }

  static Future<Map<String, dynamic>> myOrdersPaginated({int page = 1, int perPage = 15}) async {
    final res = await ApiService.get('/orders?page=$page&per_page=$perPage');
    final data = _data(res);
    if (data is Map && data['data'] is List) {
      final orders = (data['data'] as List).map((o) => Order.fromJson(o)).toList();
      final lastPage = data['last_page'] ?? 1;
      final currentPage = data['current_page'] ?? page;
      return {'orders': orders, 'lastPage': lastPage, 'currentPage': currentPage};
    }
    if (data is List) {
      return {'orders': data.map((o) => Order.fromJson(o)).toList(), 'lastPage': 1, 'currentPage': 1};
    }
    return {'orders': <Order>[], 'lastPage': 1, 'currentPage': 1};
  }

  static Future<Order> orderDetail(int id) async {
    final res = await ApiService.get('/orders/$id');
    final data = _data(res);
    return Order.fromJson(data is Map ? Map<String, dynamic>.from(data) : {});
  }

  static Future<Order> cancelOrder(int id) async {
    final res = await ApiService.post('/orders/$id/cancel');
    final data = _data(res);
    return Order.fromJson(data is Map ? Map<String, dynamic>.from(data) : {});
  }

  static Future<void> uploadPrescription({
    required int pharmacyId,
    required String doctorName,
    String? hospitalName,
    String? notes,
    String? photo,
  }) async {
    await ApiService.post('/prescriptions', {
      'pharmacy_id': pharmacyId,
      'doctor_name': doctorName,
      if (hospitalName != null) 'hospital_name': hospitalName,
      if (notes != null) 'notes': notes,
      if (photo != null) 'photo': photo,
    });
  }

  static Future<List<Prescription>> myPrescriptions() async {
    final res = await ApiService.get('/prescriptions?per_page=50');
    final data = _data(res);
    if (data is Map && data['data'] is List) {
      return (data['data'] as List).map((p) => Prescription.fromJson(p)).toList();
    }
    if (data is List) return data.map((p) => Prescription.fromJson(p)).toList();
    return [];
  }

  static Future<List<AppNotification>> notifications() async {
    final res = await ApiService.get('/notifications?per_page=50');
    final data = _data(res);
    if (data is Map && data['data'] is List) {
      return (data['data'] as List).map((n) => AppNotification.fromJson(n)).toList();
    }
    if (data is List) return data.map((n) => AppNotification.fromJson(n)).toList();
    return [];
  }

  static Future<void> markNotificationRead(int id) async {
    await ApiService.put('/notifications/$id/read');
  }

  static Future<void> markAllNotificationsRead() async {
    await ApiService.put('/notifications/read-all');
  }

  static Future<List<ChatConversation>> conversations() async {
    final res = await ApiService.get('/chats');
    final data = _data(res);
    if (data is List) return data.map((c) => ChatConversation.fromJson(c)).toList();
    return [];
  }

  static Future<List<ChatMessage>> chatMessages(int pharmacyId) async {
    final res = await ApiService.get('/chats/$pharmacyId');
    final data = _data(res);
    final myUserId = ApiService.cachedUser?['id'];
    if (data is List) {
      return data.map((m) => ChatMessage.fromJson(m, myUserId: myUserId)).toList();
    }
    return [];
  }

  static Future<void> sendChat(int pharmacyId, String message) async {
    await ApiService.post('/chats/$pharmacyId', {'message': message});
  }

  static Future<String?> uploadFile(String filePath, {String folder = 'uploads'}) async {
    final res = await ApiService.uploadFile(filePath, folder: folder);
    final data = _data(res);
    if (data is Map && data['url'] != null) return data['url'].toString();
    return null;
  }

  static Future<void> markChatRead(int pharmacyId) async {
    await ApiService.put('/chats/$pharmacyId/read');
  }

  static Future<List<SupportTicket>> supportTickets() async {
    final res = await ApiService.get('/support');
    final data = _data(res);
    if (data is List) return data.map((t) => SupportTicket.fromJson(t)).toList();
    if (data is Map && data['data'] is List) {
      return data['data'].map((t) => SupportTicket.fromJson(t)).toList();
    }
    return [];
  }

  static Future<SupportTicket> createSupportTicket({
    required String subject,
    required String description,
    String? category,
    String priority = 'medium',
    int? pharmacyId,
  }) async {
    final res = await ApiService.post('/support', {
      'subject': subject,
      'description': description,
      if (category != null) 'category': category,
      'priority': priority,
      if (pharmacyId != null) 'pharmacy_id': pharmacyId,
    });
    final data = _data(res);
    return SupportTicket.fromJson(data is Map ? Map<String, dynamic>.from(data) : const {});
  }

  static Future<void> replySupportTicket(int id, String message) async {
    await ApiService.post('/support/$id/reply', {'message': message});
  }
}
