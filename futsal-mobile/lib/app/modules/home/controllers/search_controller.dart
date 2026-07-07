import 'package:get/get.dart';
import 'package:reservasi_futsal/app/data/model/field_model.dart';
import 'package:reservasi_futsal/app/data/repository/field_repository.dart';

class SearchController extends GetxController {
  final FieldRepository _fieldRepository = Get.find<FieldRepository>();

  final query = ''.obs;
  final searchResults = <Field>[].obs;
  final allFields = <Field>[].obs;
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    _loadAllFields();

    // Reactively filter when query changes
    ever(query, (_) => _filterFields());
  }

  Future<void> _loadAllFields() async {
    isLoading.value = true;
    try {
      final fields = await _fieldRepository.getFields();
      allFields.assignAll(fields);
    } catch (_) {
      // Silent fail, allFields remains empty
    } finally {
      isLoading.value = false;
    }
  }

  void _filterFields() {
    final q = query.value.trim().toLowerCase();
    if (q.isEmpty) {
      searchResults.clear();
    } else {
      searchResults.assignAll(
        allFields.where((f) => f.name.toLowerCase().contains(q)).toList(),
      );
    }
  }

  void updateQuery(String value) {
    query.value = value;
  }
}
