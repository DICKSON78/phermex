class User {
  final int id;
  final String? name;
  final String? email;
  final String? phone;
  final String? role;
  final String? userCode;

  User({
    required this.id,
    this.name,
    this.email,
    this.phone,
    this.role,
    this.userCode,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      role: json['role'],
      userCode: json['user_code'],
    );
  }
}

class Pharmacy {
  final int id;
  final String? name;
  final String? address;
  final String? district;
  final String? region;
  final String? ward;
  final String? street;
  final double? latitude;
  final double? longitude;
  final double? distance;
  final int? drugCount;
  final String? phone;
  final String? email;
  final String? licenseNumber;
  final String? status;
  final double? rating;
  final int? totalReviews;
  final String? description;
  final String? coverImage;
  final String? logo;
  final String? businessCategory;
  final List<String>? workingDays;
  final Map<String, dynamic>? workingHours;

  Pharmacy({
    required this.id,
    this.name,
    this.address,
    this.district,
    this.region,
    this.ward,
    this.street,
    this.latitude,
    this.longitude,
    this.distance,
    this.drugCount,
    this.phone,
    this.email,
    this.licenseNumber,
    this.status,
    this.rating,
    this.totalReviews,
    this.description,
    this.coverImage,
    this.logo,
    this.businessCategory,
    this.workingDays,
    this.workingHours,
  });

  String get locationLabel {
    final parts = [ward, district, region].where((p) => p != null && p.isNotEmpty).toList();
    return parts.isNotEmpty ? parts.join(', ') : (address ?? '');
  }

  /// True only when the pharmacy has real customer reviews on the platform.
  bool get hasRating => (totalReviews ?? 0) > 0 && (rating ?? 0) > 0;

  String get openLabel {
    final hours = workingHours;
    if (hours == null) return '';
    final open = hours['open'];
    final close = hours['close'];
    if (open == null || close == null) return '';
    return 'Open ${open} – ${close}';
  }

  factory Pharmacy.fromJson(Map<String, dynamic> json) {
    return Pharmacy(
      id: json['id'] ?? 0,
      name: json['pharmacy_name'],
      address: json['address'] ?? json['location'],
      district: json['district'],
      region: json['region'],
      ward: json['ward'],
      street: json['street'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      distance: (json['distance'] as num?)?.toDouble(),
      drugCount: json['drug_count'],
      phone: json['phone'],
      email: json['email'],
      licenseNumber: json['license_number'],
      status: json['status'],
      rating: (json['rating'] as num?)?.toDouble(),
      totalReviews: json['total_reviews'],
      description: json['description'],
      coverImage: json['cover_image'],
      logo: json['pharmacy_logo'],
      businessCategory: json['business_category'],
      workingDays: json['working_days'] is List
          ? (json['working_days'] as List).map((e) => e.toString()).toList()
          : null,
      workingHours: json['working_hours'] is Map
          ? Map<String, dynamic>.from(json['working_hours'] as Map)
          : null,
    );
  }
}

class DrugCategory {
  final int id;
  final String? name;
  final int? drugsCount;

  DrugCategory({required this.id, this.name, this.drugsCount});

  factory DrugCategory.fromJson(Map<String, dynamic> json) {
    return DrugCategory(
      id: json['id'] ?? 0,
      name: json['name'],
      drugsCount: json['drugs_count'],
    );
  }
}

class Drug {
  final int id;
  final String? name;
  final String? genericName;
  final String? manufacturer;
  final double? price;
  final double? buyingPrice;
  final int? quantity;
  final String? description;
  final String? categoryName;
  final String? image;
  final String? unit;

  Drug({
    required this.id,
    this.name,
    this.genericName,
    this.manufacturer,
    this.price,
    this.buyingPrice,
    this.quantity,
    this.description,
    this.categoryName,
    this.image,
    this.unit,
  });

  factory Drug.fromJson(Map<String, dynamic> json) {
    final cat = json['category'];
    return Drug(
      id: json['id'] ?? 0,
      name: json['name'],
      genericName: json['generic_name'],
      manufacturer: json['manufacturer'],
      price: (json['selling_price'] ?? json['price'] as num?)?.toDouble(),
      buyingPrice: (json['buying_price'] as num?)?.toDouble(),
      quantity: json['quantity'],
      description: json['description'],
      categoryName: cat is Map ? cat['name'] : null,
      image: json['image'],
      unit: json['unit'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'generic_name': genericName,
        'manufacturer': manufacturer,
        'selling_price': price,
        'buying_price': buyingPrice,
        'quantity': quantity,
        'description': description,
        if (categoryName != null) 'category': {'name': categoryName},
        'image': image,
        'unit': unit,
      };
}

class CartItem {
  final Drug drug;
  int quantity;

  CartItem({required this.drug, this.quantity = 1});

  double get total => (drug.price ?? 0) * quantity;
}

class OrderItem {
  final int id;
  final int? drugId;
  final String? drugName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  OrderItem({
    required this.id,
    this.drugId,
    this.drugName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    final drug = json['drug'];
    return OrderItem(
      id: json['id'] ?? 0,
      drugId: json['drug_id'],
      drugName: drug is Map ? drug['name'] : null,
      quantity: json['quantity'] ?? 0,
      unitPrice: (json['unit_price'] as num?)?.toDouble() ?? 0,
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0,
    );
  }
}

class Order {
  final int id;
  final String? orderCode;
  final String? orderStatus;
  final String? paymentStatus;
  final String? paymentMethod;
  final double subtotal;
  final double total;
  final String? notes;
  final String? createdAt;
  final int? pharmacyId;
  final String? pharmacyName;
  final String? deliveryStatus;
  final String? deliveryAddress;
  final String? deliveryPhone;
  final double? deliveryLatitude;
  final double? deliveryLongitude;
  final List<OrderItem> items;

  Order({
    required this.id,
    this.orderCode,
    this.orderStatus,
    this.paymentStatus,
    this.paymentMethod,
    required this.subtotal,
    required this.total,
    this.notes,
    this.createdAt,
    this.pharmacyId,
    this.pharmacyName,
    this.deliveryStatus,
    this.deliveryAddress,
    this.deliveryPhone,
    this.deliveryLatitude,
    this.deliveryLongitude,
    this.items = const [],
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final pharmacy = json['pharmacy'];
    final rawItems = json['items'];
    List<OrderItem> items = [];
    if (rawItems is List) {
      items = rawItems.map((i) => OrderItem.fromJson(i)).toList();
    }
    return Order(
      id: json['id'] ?? 0,
      orderCode: json['order_code'],
      orderStatus: json['order_status'],
      paymentStatus: json['payment_status'],
      paymentMethod: json['payment_method'],
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      notes: json['notes'],
      createdAt: json['created_at'],
      pharmacyId: pharmacy is Map ? pharmacy['id'] : null,
      pharmacyName: pharmacy is Map ? pharmacy['pharmacy_name'] : null,
      deliveryStatus: json['delivery_status'],
      deliveryAddress: json['delivery_address'],
      deliveryPhone: json['delivery_phone'],
      deliveryLatitude: (json['delivery_latitude'] as num?)?.toDouble(),
      deliveryLongitude: (json['delivery_longitude'] as num?)?.toDouble(),
      items: items,
    );
  }
}

class Prescription {
  final int id;
  final String? prescriptionCode;
  final String? doctorName;
  final String? hospitalName;
  final String? notes;
  final String? photo;
  final String? status;
  final String? createdAt;
  final String? pharmacyName;

  Prescription({
    required this.id,
    this.prescriptionCode,
    this.doctorName,
    this.hospitalName,
    this.notes,
    this.photo,
    this.status,
    this.createdAt,
    this.pharmacyName,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) {
    final pharmacy = json['pharmacy'];
    return Prescription(
      id: json['id'] ?? 0,
      prescriptionCode: json['prescription_code'],
      doctorName: json['doctor_name'],
      hospitalName: json['hospital_name'],
      notes: json['notes'],
      photo: json['photo'],
      status: json['status'],
      createdAt: json['created_at'],
      pharmacyName: pharmacy is Map ? pharmacy['pharmacy_name'] : null,
    );
  }
}

class AppNotification {
  final int id;
  final String? title;
  final String? message;
  final bool isRead;
  final String? createdAt;

  AppNotification({
    required this.id,
    this.title,
    this.message,
    this.isRead = false,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] ?? 0,
      title: json['title'],
      message: json['message'],
      isRead: json['is_read'] == true || json['is_read'] == 1,
      createdAt: json['created_at'],
    );
  }
}

class ChatConversation {
  final int pharmacyId;
  final String? pharmacyName;
  final String? lastMessage;
  final int unreadCount;
  final String? lastAt;

  ChatConversation({
    required this.pharmacyId,
    this.pharmacyName,
    this.lastMessage,
    this.unreadCount = 0,
    this.lastAt,
  });

  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    final pharmacy = json['pharmacy'];
    return ChatConversation(
      pharmacyId: json['pharmacy_id'] ?? (pharmacy is Map ? pharmacy['id'] : 0) ?? 0,
      pharmacyName: pharmacy is Map ? pharmacy['pharmacy_name'] : null,
      lastMessage: json['last_message'],
      unreadCount: json['unread_count'] ?? 0,
      lastAt: json['last_at'] ?? json['last_message_time'],
    );
  }
}

class ChatMessage {
  final int id;
  final String? message;
  final String? sender;
  final String? createdAt;
  final bool isMine;

  ChatMessage({
    required this.id,
    this.message,
    this.sender,
    this.createdAt,
    this.isMine = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json, {int? myUserId}) {
    final senderRaw = json['sender'];
    final senderName = senderRaw is Map ? senderRaw['name'] : null;
    final senderId = json['sender_id'] ?? (senderRaw is Map ? senderRaw['id'] : null);
    return ChatMessage(
      id: json['id'] ?? 0,
      message: json['message'],
      sender: senderName ?? json['sender_name'] ?? json['sender'],
      createdAt: json['created_at'],
      isMine: myUserId != null && senderId != null && myUserId == senderId,
    );
  }
}

class PharmacyReview {
  final int id;
  final int? rating;
  final String? review;
  final String? userName;
  final String? createdAt;
  final bool mine;

  PharmacyReview({
    required this.id,
    this.rating,
    this.review,
    this.userName,
    this.createdAt,
    this.mine = false,
  });

  factory PharmacyReview.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    return PharmacyReview(
      id: json['id'] ?? 0,
      rating: json['rating'],
      review: json['review'],
      userName: user is Map ? user['name'] : null,
      createdAt: json['created_at'],
      mine: json['mine'] == true || json['is_mine'] == true,
    );
  }
}

class BroadcastMessage {
  final int id;
  final String? title;
  final String? message;
  final String? audience;
  final String? createdAt;

  BroadcastMessage({
    required this.id,
    this.title,
    this.message,
    this.audience,
    this.createdAt,
  });

  factory BroadcastMessage.fromJson(Map<String, dynamic> json) {
    return BroadcastMessage(
      id: json['id'] ?? 0,
      title: json['title'],
      message: json['message'],
      audience: json['audience'],
      createdAt: json['created_at'],
    );
  }
}

class SupportTicket {
  final int id;
  final String? subject;
  final String? description;
  final String? status;
  final String? priority;
  final String? category;
  final String? createdAt;
  final String? pharmacyName;
  final List<TicketReply> replies;

  SupportTicket({
    required this.id,
    this.subject,
    this.description,
    this.status,
    this.priority,
    this.category,
    this.createdAt,
    this.pharmacyName,
    this.replies = const [],
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    final pharmacy = json['pharmacy'];
    final rawReplies = json['replies'];
    return SupportTicket(
      id: json['id'] ?? 0,
      subject: json['subject'],
      description: json['description'],
      status: json['status'],
      priority: json['priority'],
      category: json['category'],
      createdAt: json['created_at'],
      pharmacyName: pharmacy is Map ? pharmacy['pharmacy_name'] : null,
      replies: rawReplies is List
          ? rawReplies.map((r) => TicketReply.fromJson(r as Map<String, dynamic>)).toList()
          : const [],
    );
  }
}

class TicketReply {
  final int id;
  final String? message;
  final String? createdAt;
  final bool fromAdmin;

  TicketReply({
    required this.id,
    this.message,
    this.createdAt,
    this.fromAdmin = false,
  });

  factory TicketReply.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    final role = user is Map ? user['role'] : null;
    return TicketReply(
      id: json['id'] ?? 0,
      message: json['message'],
      createdAt: json['created_at'],
      fromAdmin: role == 'admin',
    );
  }
}
