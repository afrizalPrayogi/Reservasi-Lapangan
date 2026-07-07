import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:reservasi_futsal/app/data/model/field_model.dart';
import 'package:reservasi_futsal/app/data/repository/field_repository.dart';

class FieldDetailController extends GetxController {
  final FieldRepository _fieldRepository = Get.find<FieldRepository>();

  late Field field;

  final durationHours = 1.obs;
  final selectedStartTime = '19:00'.obs;
  final selectedDate = Rxn<DateTime>();
  final bookedHours = <int>[].obs;
  final isLoadingDetail = false.obs;

  @override
  void onInit() {
    super.onInit();
    // Set default to tomorrow
    selectedDate.value = DateTime.now().add(const Duration(days: 1));
  }

  final List<String> times = List.generate(17, (index) {
    final hour = (8 + index) % 24;
    return hour.toString().padLeft(2, '0') + ':00';
  });

  List<String> get galleryUrls {
    if (field.imageUrls.length > 1) {
      return field.imageUrls.sublist(1);
    }
    return [];
  }

  void setField(Field f) {
    field = f;
    bookedHours.value = f.bookedHours;
    fetchBookedHours();
  }

  void incrementDuration() {
    durationHours.value++;
  }

  void decrementDuration() {
    if (durationHours.value > 1) {
      durationHours.value--;
    }
  }

  void selectTime(String time) {
    final hour = int.tryParse(time.split(':')[0]) ?? -1;
    if (bookedHours.contains(hour)) {
      return; // Jam ini sudah dipesan, abaikan klik
    }
    selectedStartTime.value = time;
  }

  Future<void> fetchBookedHours() async {
    if (selectedDate.value == null) return;
    isLoadingDetail.value = true;
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate.value!);
      final updatedField = await _fieldRepository.getFieldById(field.id, date: dateStr);
      bookedHours.value = updatedField.bookedHours;

      // Jika jam mulai saat ini sudah dibooking pada tanggal baru, pilih jam kosong pertama
      final currentSelectedHour = int.tryParse(selectedStartTime.value.split(':')[0]) ?? -1;
      if (bookedHours.contains(currentSelectedHour)) {
        String? firstAvailableTime;
        for (final t in times) {
          final h = int.tryParse(t.split(':')[0]) ?? -1;
          if (!bookedHours.contains(h)) {
            firstAvailableTime = t;
            break;
          }
        }
        selectedStartTime.value = firstAvailableTime ?? '';
      }
    } catch (e) {
      print('❌ Error fetching booked hours: $e');
    } finally {
      isLoadingDetail.value = false;
    }
  }

  Future<void> pickDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate:
          selectedDate.value ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF0D1B3E),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Color(0xFF0D1B3E),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      selectedDate.value = picked;
      fetchBookedHours();
    }
  }

  String formatDate(DateTime? date) {
    if (date == null) return 'Pilih Tanggal';
    return DateFormat('dd MMM yyyy').format(date);
  }

  String getIsoDate() {
    return selectedDate.value?.toIso8601String() ??
        DateTime.now().toIso8601String();
  }
}
