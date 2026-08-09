import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:reservasi_futsal/app/data/model/field_model.dart';
import 'package:reservasi_futsal/app/data/repository/field_repository.dart';

class FieldDetailController extends GetxController {
  final FieldRepository _fieldRepository = Get.find<FieldRepository>();

  Field? field;

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

  List<FieldOperationalHour> get _currentOperationalHours {
    final dayType = _selectedDayType;
    final currentField = field;
    final matching = currentField?.operationalHours
            .where((item) => item.dayType.toUpperCase() == dayType)
            .toList() ??
        [];
    if (matching.isNotEmpty) {
      return matching;
    }

    return [
      FieldOperationalHour(id: 'fallback-weekday', dayType: 'WEEKDAY', startHour: 6, endHour: 24),
      FieldOperationalHour(id: 'fallback-weekend', dayType: 'WEEKEND', startHour: 6, endHour: 24),
    ];
  }

  String get _selectedDayType {
    final date = selectedDate.value ?? DateTime.now();
    return date.weekday >= 6 ? 'WEEKEND' : 'WEEKDAY';
  }

  List<String> get times {
    final row = _currentOperationalHours.firstWhere(
      (item) => item.dayType.toUpperCase() == _selectedDayType,
    );
    final lastStart = row.endHour - durationHours.value;
    if (lastStart < row.startHour) {
      return [];
    }

    return List.generate(lastStart - row.startHour + 1, (index) {
      final hour = row.startHour + index;
      return hour.toString().padLeft(2, '0') + ':00';
    });
  }

  List<String> get galleryUrls {
    final currentField = field;
    if (currentField != null && currentField.imageUrls.length > 1) {
      return currentField.imageUrls.sublist(1);
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
    _ensureSelectedTimeIsValid();
  }

  void decrementDuration() {
    if (durationHours.value > 1) {
      durationHours.value--;
      _ensureSelectedTimeIsValid();
    }
  }

  void selectTime(String time) {
    final hour = int.tryParse(time.split(':')[0]) ?? -1;
    if (bookedHours.contains(hour)) {
      return; // Jam ini sudah dipesan, abaikan klik
    }
    selectedStartTime.value = time;
  }

  void _ensureSelectedTimeIsValid() {
    final availableTimes = times;
    if (availableTimes.isEmpty) {
      selectedStartTime.value = '';
      return;
    }

    if (!availableTimes.contains(selectedStartTime.value)) {
      selectedStartTime.value = availableTimes.firstWhere(
        (time) {
          final hour = int.tryParse(time.split(':')[0]) ?? -1;
          return !bookedHours.contains(hour);
        },
        orElse: () => availableTimes.first,
      );
    }
  }

  Future<void> fetchBookedHours() async {
    if (selectedDate.value == null || field == null) return;
    isLoadingDetail.value = true;
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate.value!);
      final updatedField = await _fieldRepository.getFieldById(field!.id, date: dateStr);
      bookedHours.value = updatedField.bookedHours;
      field = updatedField;

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
      _ensureSelectedTimeIsValid();
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
