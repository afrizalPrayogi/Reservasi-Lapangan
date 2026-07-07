import 'package:get/get.dart';
import 'package:reservasi_futsal/app/data/model/field_model.dart';
import 'package:reservasi_futsal/app/data/repository/field_repository.dart';

class HomeController extends GetxController {
  final FieldRepository _fieldRepository = Get.find<FieldRepository>();

  final isLoading = false.obs;
  final featuredFields = <Field>[].obs;
  final allFields = <Field>[].obs;
  final selectedFilter = 'Semua'.obs;
  final selectedIndex = 0.obs;

  List<Field> get filteredAvailableFields {
    if (selectedFilter.value == 'Tersedia') {
      return allFields.where((f) => f.isAvailable).toList();
    }
    return allFields;
  }

  @override
  void onInit() {
    super.onInit();
    loadFields();
  }

  Future<void> loadFields() async {
    isLoading.value = true;
    try {
      print('🔄 HomeController: Fetching fields from API...');
      final fields = await _fieldRepository.getFields();
      print('✅ HomeController: Got ${fields.length} fields from API');
      allFields.assignAll(fields);
      featuredFields.assignAll(fields.take(3).toList());
    } catch (e) {
      print('❌ HomeController: Failed to fetch fields - $e');
      _loadDummyFields();
    } finally {
      isLoading.value = false;
    }
  }

  void _loadDummyFields() {
    featuredFields.value = [
      Field(
        id: '1',
        name: 'Lapangan Badminton A',
        imageUrl:
            'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=800',
        size: '13.4 x 6.1', // standard badminton doubles size in meters
        pricePerHour: 150000,
        isAvailable: true,
      ),
      Field(
        id: '2',
        name: 'Lapangan Badminton B',
        imageUrl:
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
        size: '13.4 x 6.1',
        pricePerHour: 120000,
        isAvailable: true,
      ),
      Field(
        id: '3',
        name: 'Lapangan Badminton C',
        imageUrl:
            'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800',
        size: '13.4 x 6.1',
        pricePerHour: 100000,
        isAvailable: false,
      ),
    ];

    allFields.value = [
      Field(
        id: '1',
        name: 'Lapangan Badminton - A',
        imageUrl:
            'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=400',
        size: '13.4 x 6.1',
        pricePerHour: 150000,
        isAvailable: true,
      ),
      Field(
        id: '2',
        name: 'Lapangan Badminton - B',
        imageUrl:
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400',
        size: '13.4 x 6.1',
        pricePerHour: 150000,
        isAvailable: false,
      ),
      Field(
        id: '3',
        name: 'Lapangan Badminton - C',
        imageUrl:
            'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=400',
        size: '13.4 x 5.18', // singles size
        pricePerHour: 100000,
        isAvailable: true,
      ),
    ];
  }

  String formatPrice(double price) {
    return 'Rp ${price.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')}/Jam';
  }
}
