import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:reservasi_futsal/app/core/const/keys.dart';
import 'package:reservasi_futsal/app/data/model/user_model.dart';
import 'package:reservasi_futsal/app/data/repository/auth_repository.dart';

class ProfileController extends GetxController {
  final AuthRepository _authRepository = Get.find<AuthRepository>();
  final FlutterSecureStorage _storage = Get.find<FlutterSecureStorage>();

  final user = Rxn<User>();
  final isLoading = false.obs;
  final errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    loadUserProfile();
  }

  Future<void> loadUserProfile() async {
    try {
      isLoading.value = true;
      errorMessage.value = '';

      final userProfile = await _authRepository.getUserProfile();
      user.value = userProfile;
    } catch (e) {
      errorMessage.value = e.toString();
      print('Error loading user profile: $e');
      Get.snackbar(
        'Error',
        'Gagal memuat profil',
        snackPosition: SnackPosition.BOTTOM,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> logout() async {
    try {
      // Clear stored token
      await _storage.delete(key: Keys.token);

      // Navigate to login
      Get.offAllNamed('/login');
    } catch (e) {
      print('Error during logout: $e');
      Get.snackbar(
        'Error',
        'Gagal logout',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }
}
