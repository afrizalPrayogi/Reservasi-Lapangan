import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:reservasi_futsal/app/routes/app_pages.dart';

import '../controllers/registrasi_controller.dart';

class RegistrasiView extends GetView<RegistrasiController> {
  const RegistrasiView({super.key});

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenHeight < 600;

    // Responsive font sizes
    final titleFontSize = isSmallScreen ? 24.0 : 32.0;
    final subtitleFontSize = isSmallScreen ? 13.0 : 15.0;
    final labelFontSize = isSmallScreen ? 12.0 : 14.0;

    // Responsive spacing
    final topSpacing = isSmallScreen ? 20.0 : 40.0;
    final logoSize = isSmallScreen ? 70.0 : 100.0;
    final logoIconSize = isSmallScreen ? 35.0 : 50.0;
    final formPadding = isSmallScreen ? 20.0 : 28.0;
    final fieldSpacing = isSmallScreen ? 16.0 : 20.0;
    final horizontalPadding = screenWidth > 600 ? 48.0 : 24.0;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0D1B3E), Color(0xFF1A2F5A), Color(0xFF2E4A7C)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight:
                    screenHeight -
                    MediaQuery.of(context).padding.top -
                    MediaQuery.of(context).padding.bottom,
              ),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
                child: Column(
                  children: [
                    SizedBox(height: topSpacing),
                    // Logo/Icon
                    Container(
                      width: logoSize,
                      height: logoSize,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.sports_soccer,
                        size: logoIconSize,
                        color: const Color(0xFF0D1B3E),
                      ),
                    ),
                    SizedBox(height: isSmallScreen ? 16 : 24),
                    // Title
                    Text(
                      'Daftar Akun',
                      style: TextStyle(
                        fontSize: titleFontSize,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: isSmallScreen ? 4 : 8),
                    Text(
                      'Buat akun baru untuk melanjutkan',
                      style: TextStyle(
                        fontSize: subtitleFontSize,
                        color: Colors.white70,
                        fontWeight: FontWeight.w300,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: isSmallScreen ? 24 : 40),
                    // Form Card
                    Container(
                      padding: EdgeInsets.all(formPadding),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.15),
                            blurRadius: 30,
                            offset: const Offset(0, 15),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Name Field
                          Text(
                            'Nama Lengkap',
                            style: TextStyle(
                              fontSize: labelFontSize,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0D1B3E),
                            ),
                          ),
                          SizedBox(height: isSmallScreen ? 4 : 8),
                          TextField(
                            onChanged: (v) => controller.name.value = v,
                            decoration: InputDecoration(
                              hintText: 'Masukkan nama lengkap',
                              hintStyle: TextStyle(
                                color: Colors.grey[400],
                                fontSize: labelFontSize,
                              ),
                              prefixIcon: const Icon(
                                Icons.person_outline,
                                color: Color(0xFF0D1B3E),
                                size: 22,
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF5F7FA),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: Color(0xFF0D1B3E),
                                  width: 2,
                                ),
                              ),
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: isSmallScreen ? 12 : 16,
                              ),
                            ),
                          ),
                          SizedBox(height: fieldSpacing),
                          // Email Field
                          Text(
                            'Email',
                            style: TextStyle(
                              fontSize: labelFontSize,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0D1B3E),
                            ),
                          ),
                          SizedBox(height: isSmallScreen ? 4 : 8),
                          TextField(
                            onChanged: (v) => controller.email.value = v,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              hintText: 'user@gmail.com',
                              hintStyle: TextStyle(
                                color: Colors.grey[400],
                                fontSize: labelFontSize,
                              ),
                              prefixIcon: const Icon(
                                Icons.email_outlined,
                                color: Color(0xFF0D1B3E),
                                size: 22,
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF5F7FA),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: Color(0xFF0D1B3E),
                                  width: 2,
                                ),
                              ),
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: isSmallScreen ? 12 : 16,
                              ),
                            ),
                          ),
                          SizedBox(height: fieldSpacing),
                          // Phone Field
                          Text(
                            'Nomor Telepon',
                            style: TextStyle(
                              fontSize: labelFontSize,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0D1B3E),
                            ),
                          ),
                          SizedBox(height: isSmallScreen ? 4 : 8),
                          TextField(
                            onChanged: (v) => controller.phone.value = v,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              hintText: '08xxxxxxxxxx',
                              hintStyle: TextStyle(
                                color: Colors.grey[400],
                                fontSize: labelFontSize,
                              ),
                              prefixIcon: const Icon(
                                Icons.phone_outlined,
                                color: Color(0xFF0D1B3E),
                                size: 22,
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF5F7FA),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: Color(0xFF0D1B3E),
                                  width: 2,
                                ),
                              ),
                              contentPadding: EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: isSmallScreen ? 12 : 16,
                              ),
                            ),
                          ),
                          SizedBox(height: fieldSpacing),
                          // Password Field
                          Text(
                            'Password',
                            style: TextStyle(
                              fontSize: labelFontSize,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF0D1B3E),
                            ),
                          ),
                          SizedBox(height: isSmallScreen ? 4 : 8),
                          Obx(
                            () => TextField(
                              onChanged: (v) => controller.password.value = v,
                              obscureText: !controller.isPasswordVisible.value,
                              decoration: InputDecoration(
                                hintText: '••••••••',
                                hintStyle: TextStyle(
                                  color: Colors.grey[400],
                                  fontSize: labelFontSize,
                                ),
                                prefixIcon: const Icon(
                                  Icons.lock_outline,
                                  color: Color(0xFF0D1B3E),
                                  size: 22,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    controller.isPasswordVisible.value
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    color: Colors.grey,
                                    size: 22,
                                  ),
                                  onPressed:
                                      controller.togglePasswordVisibility,
                                ),
                                filled: true,
                                fillColor: const Color(0xFFF5F7FA),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide.none,
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                    color: Color(0xFF0D1B3E),
                                    width: 2,
                                  ),
                                ),
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: isSmallScreen ? 12 : 16,
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: isSmallScreen ? 20 : 32),
                          // Register Button
                          Obx(
                            () => SizedBox(
                              width: double.infinity,
                              height: isSmallScreen ? 48 : 54,
                              child: ElevatedButton(
                                onPressed: controller.isLoading.value
                                    ? null
                                    : () async {
                                        // Validasi input
                                        if (controller.name.value.isEmpty) {
                                          Get.snackbar(
                                            'Error',
                                            'Nama tidak boleh kosong',
                                            backgroundColor: Colors.red,
                                            colorText: Colors.white,
                                          );
                                          return;
                                        }
                                        if (controller.email.value.isEmpty) {
                                          Get.snackbar(
                                            'Error',
                                            'Email tidak boleh kosong',
                                            backgroundColor: Colors.red,
                                            colorText: Colors.white,
                                          );
                                          return;
                                        }
                                        if (controller.phone.value.isEmpty) {
                                          Get.snackbar(
                                            'Error',
                                            'Nomor telepon tidak boleh kosong',
                                            backgroundColor: Colors.red,
                                            colorText: Colors.white,
                                          );
                                          return;
                                        }
                                        if (controller.password.value.isEmpty) {
                                          Get.snackbar(
                                            'Error',
                                            'Password tidak boleh kosong',
                                            backgroundColor: Colors.red,
                                            colorText: Colors.white,
                                          );
                                          return;
                                        }

                                        final res = await controller.register();
                                        if (res['success'] == true) {
                                          Get.snackbar(
                                            'Berhasil',
                                            'Registrasi berhasil! Silakan login',
                                            backgroundColor: Colors.green,
                                            colorText: Colors.white,
                                            duration: const Duration(
                                              seconds: 2,
                                            ),
                                          );
                                          // Navigasi ke halaman login
                                          await Future.delayed(
                                            const Duration(seconds: 1),
                                          );
                                          Get.offAllNamed(Routes.LOGIN);
                                        } else {
                                          final message = res['message'];
                                          String errorMsg = 'Registrasi gagal';

                                          // Parse error message jika ada
                                          if (message is Map) {
                                            errorMsg =
                                                message['message'] ??
                                                message.toString();
                                          } else if (message is String) {
                                            errorMsg = message;
                                          }

                                          Get.snackbar(
                                            'Error',
                                            errorMsg,
                                            backgroundColor: Colors.red,
                                            colorText: Colors.white,
                                            duration: const Duration(
                                              seconds: 3,
                                            ),
                                          );
                                        }
                                      },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0D1B3E),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 0,
                                  shadowColor: const Color(
                                    0xFF0D1B3E,
                                  ).withOpacity(0.3),
                                ),
                                child: controller.isLoading.value
                                    ? const SizedBox(
                                        width: 24,
                                        height: 24,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2.5,
                                        ),
                                      )
                                    : Text(
                                        'Daftar',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: isSmallScreen ? 14 : 16,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: isSmallScreen ? 16 : 30),
                    // Login Link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Sudah punya akun? ',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: isSmallScreen ? 12 : 14,
                          ),
                        ),
                        TextButton(
                          onPressed: () => Get.offAllNamed(Routes.LOGIN),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            minimumSize: const Size(0, 0),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: Text(
                            'Masuk Sekarang',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: isSmallScreen ? 12 : 14,
                              fontWeight: FontWeight.bold,
                              decoration: TextDecoration.underline,
                              decorationColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: isSmallScreen ? 20 : 40),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
