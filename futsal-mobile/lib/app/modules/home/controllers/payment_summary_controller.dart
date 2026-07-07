import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:reservasi_futsal/app/data/model/field_model.dart';
import 'package:reservasi_futsal/app/data/repository/booking_repository.dart';
import 'package:reservasi_futsal/app/modules/home/controllers/home_controller.dart';

class PaymentSummaryController extends GetxController {
  final BookingRepository _bookingRepository = Get.find<BookingRepository>();

  late Field field;
  late int durationHours;
  late String startTime;
  late String orderDate;

  final proofFile = Rxn<XFile>();
  final isLoading = false.obs;
  final isDpSelected = false.obs;

  double get totalPay => field.pricePerHour * durationHours;
  double get paymentAmount => isDpSelected.value ? totalPay * 0.5 : totalPay;

  void togglePaymentType(bool useDp) {
    isDpSelected.value = useDp;
  }

  void init({
    required Field field,
    required int durationHours,
    required String startTime,
    required String orderDate,
  }) {
    this.field = field;
    this.durationHours = durationHours;
    this.startTime = startTime;
    this.orderDate = orderDate;
  }

  String formatRupiah(num value) {
    final str = value.toInt().toString();
    final formatted = str.replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return 'Rp $formatted';
  }

  Future<void> pickProof() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      proofFile.value = picked;
    }
  }

  Future<void> copyAccountNumber(String accountNumber) async {
    await Clipboard.setData(ClipboardData(text: accountNumber));
    Get.snackbar(
      'Berhasil',
      'Nomor rekening berhasil disalin',
      snackPosition: SnackPosition.BOTTOM,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      backgroundColor: const Color(0xFF0D1B3E).withOpacity(0.92),
      colorText: Colors.white,
      duration: const Duration(seconds: 2),
    );
  }

  Future<void> confirmPayment() async {
    // Validate payment proof
    if (proofFile.value == null) {
      Get.snackbar(
        'Perhatian',
        'Silakan upload bukti pembayaran terlebih dahulu',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.orange,
        colorText: Colors.white,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      );
      return;
    }

    try {
      isLoading.value = true;

      final result = await _bookingRepository.createBooking(
        fieldId: field.id,
        startTime: startTime,
        durationHours: durationHours,
        paymentProofPath: proofFile.value!.path,
        paymentProofName: proofFile.value!.name,
        orderDate: orderDate,
        isDp: isDpSelected.value,
      );

      if (result['success'] == true) {
        // Show success dialog
        await Get.dialog(
          Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2ECC71).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle,
                      size: 50,
                      color: Color(0xFF2ECC71),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Booking Berhasil!',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0D1B3E),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    result['message'] ?? 'Booking Anda berhasil dibuat',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Get.back(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2ECC71),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Lihat Riwayat Booking',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          barrierDismissible: false,
        );

        // Navigate to home and switch to booking history tab
        Get.offAllNamed('/home');

        // Switch to booking history tab (index 1)
        final homeController = Get.find<HomeController>();
        homeController.selectedIndex.value = 1;
      } else {
        Get.snackbar(
          'Gagal',
          result['message'] ?? 'Gagal membuat booking',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        );
      }
    } catch (e) {
      print('Error confirming payment: $e');
      Get.snackbar(
        'Error',
        'Terjadi kesalahan: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      );
    } finally {
      isLoading.value = false;
    }
  }
}
