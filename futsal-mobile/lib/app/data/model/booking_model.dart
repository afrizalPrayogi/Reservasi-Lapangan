class BookingStatus {
  final String label;
  final String color;

  BookingStatus({required this.label, required this.color});

  factory BookingStatus.fromJson(Map<String, dynamic> json) {
    return BookingStatus(
      label: (json['label'] ?? '').toString(),
      color: (json['color'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'label': label, 'color': color};
  }
}

class Booking {
  final String id;
  final String bookingNumber;
  final String fieldName;
  final String venueName;
  final BookingStatus status;
  final DateTime date;
  final DateTime startTime;
  final int durationHours;
  final BookingPayment? payment;

  Booking({
    required this.id,
    required this.bookingNumber,
    required this.fieldName,
    required this.venueName,
    required this.status,
    required this.date,
    required this.startTime,
    required this.durationHours,
    this.payment,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: (json['id'] ?? '').toString(),
      bookingNumber: (json['bookingNumber'] ?? '').toString(),
      fieldName: (json['fieldName'] ?? '').toString(),
      venueName: (json['venueName'] ?? '').toString(),
      status: json['status'] is Map
          ? BookingStatus.fromJson(Map<String, dynamic>.from(json['status']))
          : BookingStatus(label: '', color: ''),
      date:
          DateTime.tryParse((json['date'] ?? '').toString())?.toLocal() ??
          DateTime.now(),
      startTime:
          DateTime.tryParse((json['startTime'] ?? '').toString())?.toLocal() ??
          DateTime.now(),
      durationHours: json['durationHours'] is num
          ? (json['durationHours'] as num).toInt()
          : (int.tryParse((json['durationHours'] ?? '0').toString()) ?? 0),
      payment: json['payment'] is Map
          ? BookingPayment.fromJson(Map<String, dynamic>.from(json['payment']))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookingNumber': bookingNumber,
      'fieldName': fieldName,
      'venueName': venueName,
      'status': status.toJson(),
      'date': date.toIso8601String(),
      'startTime': startTime.toIso8601String(),
      'durationHours': durationHours,
      'payment': payment?.toJson(),
    };
  }
}

class BookingPayment {
  final String? proofUrl;
  final String? status;

  BookingPayment({
    required this.proofUrl,
    required this.status,
  });

  factory BookingPayment.fromJson(Map<String, dynamic> json) {
    return BookingPayment(
      proofUrl: (json['proofUrl'] ?? json['proof_url'])?.toString(),
      status: (json['status'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'proofUrl': proofUrl,
      'status': status,
    };
  }
}

class BookingMeta {
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  BookingMeta({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory BookingMeta.fromJson(Map<String, dynamic> json) {
    return BookingMeta(
      total: json['total'] is num
          ? (json['total'] as num).toInt()
          : (int.tryParse((json['total'] ?? '0').toString()) ?? 0),
      page: json['page'] is num
          ? (json['page'] as num).toInt()
          : (int.tryParse((json['page'] ?? '1').toString()) ?? 1),
      limit: json['limit'] is num
          ? (json['limit'] as num).toInt()
          : (int.tryParse((json['limit'] ?? '20').toString()) ?? 20),
      totalPages: json['totalPages'] is num
          ? (json['totalPages'] as num).toInt()
          : (int.tryParse((json['totalPages'] ?? '1').toString()) ?? 1),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total': total,
      'page': page,
      'limit': limit,
      'totalPages': totalPages,
    };
  }
}

class BookingResponse {
  final String message;
  final List<Booking> data;
  final BookingMeta meta;

  BookingResponse({
    required this.message,
    required this.data,
    required this.meta,
  });

  factory BookingResponse.fromJson(Map<String, dynamic> json) {
    final rawList = json['data'] as List? ?? [];
    final bookings = rawList
        .whereType<Map>()
        .map((e) => Booking.fromJson(Map<String, dynamic>.from(e)))
        .toList();

    return BookingResponse(
      message: (json['message'] ?? '').toString(),
      data: bookings,
      meta: json['meta'] is Map
          ? BookingMeta.fromJson(Map<String, dynamic>.from(json['meta']))
          : BookingMeta(total: 0, page: 1, limit: 20, totalPages: 1),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'data': data.map((booking) => booking.toJson()).toList(),
      'meta': meta.toJson(),
    };
  }
}
