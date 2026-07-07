import 'package:get/get.dart';
import 'package:reservasi_futsal/app/data/repository/registrasi_repository.dart';

class RegistrasiController extends GetxController {
  final RegistrasiRepository repository;

  final email = ''.obs;
  final name = ''.obs;
  final password = ''.obs;
  final phone = ''.obs;

  final isLoading = false.obs;
  final isPasswordVisible = false.obs;

  RegistrasiController({required this.repository});

  void togglePasswordVisibility() {
    isPasswordVisible.value = !isPasswordVisible.value;
  }

  Future<Map<String, dynamic>> register() async {
    isLoading.value = true;
    try {
      final result = await repository.register(
        email: email.value,
        name: name.value,
        password: password.value,
        phone: phone.value,
      );
      return result;
    } finally {
      isLoading.value = false;
    }
  }
}
