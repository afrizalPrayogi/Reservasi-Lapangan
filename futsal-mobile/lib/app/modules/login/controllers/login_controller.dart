import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:reservasi_futsal/app/app_controller.dart';

class LoginController extends GetxController {
  late final TextEditingController emailController;
  late final TextEditingController passwordController;

  final isPasswordVisible = false.obs;
  final isLoading = false.obs;

  late final AuthController _authController;

  @override
  void onInit() {
    super.onInit();
    emailController = TextEditingController();
    passwordController = TextEditingController();
    _authController = Get.find<AuthController>();
  }

  void togglePasswordVisibility() {
    isPasswordVisible.value = !isPasswordVisible.value;
  }

  void login() async {
    // Validasi input
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      Get.snackbar(
        'Error',
        'Email dan password harus diisi',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
        margin: const EdgeInsets.all(16),
      );
      return;
    }

    // Validasi format email
    if (!GetUtils.isEmail(emailController.text)) {
      Get.snackbar(
        'Error',
        'Format email tidak valid',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
        margin: const EdgeInsets.all(16),
      );
      return;
    }

    isLoading.value = true;

    try {
      // Simpan value sebelum controller disposed
      final email = emailController.text.trim();
      final password = passwordController.text;

      // Call AuthController login
      final result = await _authController.login(
        username: email,
        password: password,
      );

      // Check if controller still mounted before updating state
      if (!Get.isRegistered<LoginController>()) return;

      isLoading.value = false;

      if (result['success'] == true) {
        // Navigasi ke home setelah login sukses
        Get.offAllNamed('/home');
      } else {
        // Error snackbar
        Get.snackbar(
          'Gagal',
          result['message'] ?? 'Login gagal',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white,
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 3),
        );
      }
    } catch (e) {
      // Check if controller still mounted
      if (!Get.isRegistered<LoginController>()) return;

      isLoading.value = false;
      Get.snackbar(
        'Error',
        'Terjadi kesalahan: $e',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red,
        colorText: Colors.white,
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      );
    }
  }

  void forgotPassword() {
    Get.snackbar(
      'Info',
      'Fitur lupa password akan segera tersedia',
      snackPosition: SnackPosition.BOTTOM,
    );
  }

  void goToRegister() {
    Get.offAllNamed('/registrasi');
  }
}
