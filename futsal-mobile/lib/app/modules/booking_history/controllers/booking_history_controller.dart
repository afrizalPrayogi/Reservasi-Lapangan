import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:reservasi_futsal/app/data/model/booking_model.dart';
import 'package:reservasi_futsal/app/data/repository/booking_repository.dart';

class BookingHistoryController extends GetxController {
  final BookingRepository _bookingRepository = Get.find<BookingRepository>();

  final isLoading = false.obs;
  final bookingHistory = <Booking>[].obs;
  final errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadBookingHistory();
  }

  Future<void> loadBookingHistory() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final response = await _bookingRepository.getMyBookings();
      bookingHistory.value = response.data;
    } catch (e) {
      errorMessage.value = e.toString();
      print('Error loading booking history: $e');
      Get.snackbar(
        'Error',
        'Gagal memuat riwayat booking',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  String formatDate(DateTime date) {
    return DateFormat('dd-MMM-yyyy').format(date);
  }

  String formatTime(DateTime time) {
    return DateFormat('HH:mm').format(time);
  }
}
