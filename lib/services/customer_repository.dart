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

  /// Returns all published pharmacies around Dar es Salaam (wide radius).
  static Future<List<Pharmacy>> allPharmacies({String? search}) async {
    return nearby(
      latitude: -6.7924,
      longitude: 39.2083,
      radiusKm: 100,
      search: search,
    );
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

  /// Returns a map with `reviews` (list) and `hasReviewed` (bool) + `myRating`.
  static Future<Map<String, dynamic>> pharmacyReviews(int pharmacyId) async {
    final res = await ApiService.get('/pharmacies/$pharmacyId/reviews');
    final data = _data(res);
    final raw = data is Map ? data['reviews'] : data;
    List<PharmacyReview> reviews = [];
    if (raw is List) {
      reviews = raw.map((r) => PharmacyReview.fromJson(r is Map ? Map<String, dynamic>.from(r) : {})).toList();
    }
    final my = data is Map ? data['my_review'] : null;
    return {
      'reviews': reviews,
      'hasReviewed': data is Map ? (data['has_reviewed'] ?? false) : false,
      'myRating': my is Map ? my['rating'] : null,
    };
  }

  static Future<void> submitPharmacyReview(int pharmacyId, {required int rating, String? review}) async {
    await ApiService.post('/pharmacies/$pharmacyId/reviews', {
      'rating': rating,
      if (review != null && review.isNotEmpty) 'review': review,
    });
  }

  static Future<List<BroadcastMessage>> broadcasts() async {
    final res = await ApiService.get('/broadcasts');
    final data = _data(res);
    if (data is List) return data.map((b) => BroadcastMessage.fromJson(b is Map ? Map<String, dynamic>.from(b) : {})).toList();
    if (data is Map && data['data'] is List) {
      return data['data'].map((b) => BroadcastMessage.fromJson(b is Map ? Map<String, dynamic>.from(b) : {})).toList();
    }
    return [];
  }

  /// Places an order and returns the raw response data (including Order fields
  /// plus any `payment` payload). Callers construct an [Order] via
  /// `Order.fromJson` and can read `data['payment']` for payment details.
  static Future<Map<String, dynamic>> placeOrder({
    required int pharmacyId,
    required List<CartItem> items,
    required String deliveryAddress,
    String? deliveryPhone,
    double? deliveryLatitude,
    double? deliveryLongitude,
    String? notes,
    String? paymentMethod,
    String? paymentPhone,
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
      if (paymentMethod != null && paymentMethod.isNotEmpty)
        'payment_method': paymentMethod,
      if (paymentPhone != null && paymentPhone.isNotEmpty)
        'payment_phone': paymentPhone,
    });
    final data = _data(res);
    return data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};
  }

  /// Polls the payment status for an order.
  /// Returns a Map with `status` (`unpaid`|`paid`) and `gateway_status`.
  static Future<Map<String, dynamic>> paymentStatus(int orderId) async {
    final res = await ApiService.get('/payments/$orderId/status');
    if (res is Map) {
      return {
        'status': res['status'] ?? 'unpaid',
        'gateway_status': res['gateway_status'],
      };
    }
    final data = _data(res);
    if (data is Map) {
      return {
        'status': data['status'] ?? 'unpaid',
        'gateway_status': data['gateway_status'],
      };
    }
    return {'status': 'unpaid', 'gateway_status': null};
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

  /// Requests a live video consultation with a pharmacy.
  /// Returns the telemedicine session (with room_code / room_url).
  static Future<Map<String, dynamic>> requestTelemedicine(int pharmacyId,
      {String? topic, String? patientNotes}) async {
    final res = await ApiService.post('/telemedicine/request', {
      'pharmacy_id': pharmacyId,
      if (topic != null) 'topic': topic,
      if (patientNotes != null) 'patient_notes': patientNotes,
    });
    return _data(res);
  }

  /// Books a scheduled video consultation (appointment) at a chosen time slot.
  static Future<Map<String, dynamic>> bookTelemedicine(int pharmacyId,
      {required String scheduledAt, String? topic, String? patientNotes}) async {
    final res = await ApiService.post('/telemedicine/book', {
      'pharmacy_id': pharmacyId,
      'scheduled_at': scheduledAt,
      if (topic != null) 'topic': topic,
      if (patientNotes != null) 'patient_notes': patientNotes,
    });
    return _data(res);
  }

  /// Fetches all of the customer's telemedicine appointments / history.
  static Future<List<Map<String, dynamic>>> telemedicineAppointments() async {
    final res = await ApiService.get('/telemedicine/appointments');
    final data = _data(res);
    if (data is List) return data.map((e) => Map<String, dynamic>.from(e)).toList();
    return [];
  }

  /// Fetches available appointment time slots for a pharmacy.
  static Future<List<Map<String, dynamic>>?> telemedicineSlots(int pharmacyId,
      {int days = 7}) async {
    final res = await ApiService.get('/telemedicine/schedule?pharmacy_id=$pharmacyId&days=$days');
    final data = _data(res);
    if (data is List) return data.map((e) => Map<String, dynamic>.from(e)).toList();
    return null;
  }

  /// Fetches the customer's active consultation (if any), otherwise null.
  static Future<Map<String, dynamic>?> activeTelemedicine() async {
    final res = await ApiService.get('/telemedicine/active');
    final data = _data(res);
    if (data is Map && data['room_code'] != null) {
      return Map<String, dynamic>.from(data);
    }
    return null;
  }

  static Future<void> cancelTelemedicine(int id) async {
    await ApiService.post('/telemedicine/$id/cancel');
  }
}
