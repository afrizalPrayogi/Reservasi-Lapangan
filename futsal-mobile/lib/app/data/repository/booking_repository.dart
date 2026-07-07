import 'package:reservasi_futsal/app/data/model/booking_model.dart';

abstract class BookingRepository {
  Future<BookingResponse> getMyBookings({int page = 1, int limit = 20});

  Future<Map<String, dynamic>> createBooking({
    required String fieldId,
    required String startTime,
    required int durationHours,
    required String paymentProofPath,
    String? paymentProofName,
    required String orderDate,
    bool isDp = false,
  });
}
