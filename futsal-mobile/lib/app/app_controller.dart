import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:reservasi_futsal/app/core/const/keys.dart';
import 'package:reservasi_futsal/app/data/model/user_model.dart';
import 'package:reservasi_futsal/app/data/repository/auth_repository.dart';
import 'package:reservasi_futsal/app/modules/home/controllers/home_controller.dart';

class AuthController extends GetxController {
  final _authRepository = Get.find<AuthRepository>();
  final _secureStorage = Get.find<FlutterSecureStorage>();

  User? userAccount;

  @override
  void onReady() {
    super.onReady();
    _checkTokenAndNavigate();
  }

  Future<void> _checkTokenAndNavigate() async {
    await Future.delayed(const Duration(seconds: 1));

    final token = await _secureStorage.read(key: Keys.token);

    if (token != null) {
      final isValid = await _authRepository.validateToken(token);
      if (isValid) {
        print('Token valid, lanjut ke home');

        // Load user data dari storage
        final userId = await _secureStorage.read(key: Keys.id) ?? '';
        final userName = await _secureStorage.read(key: Keys.name) ?? '';
        final userEmail = await _secureStorage.read(key: Keys.email) ?? '';

        print("User ID dari storage: $userId");

        userAccount = User(
          accessToken: token,
          id: userId,
          name: userName,
          email: userEmail,
        );

        Get.offAllNamed('/home');
        return;
      } else {
        print('Token tidak valid, hapus storage dan redirect ke login');
        await _clearStorage();
      }
    }

    Get.offAllNamed('/login');
  }

  /// Simpan token dan data user ke secure storage
  Future<void> _setStorage() async {
    try {
      if (userAccount != null) {
        await _secureStorage.write(
          key: Keys.token,
          value: userAccount!.accessToken,
        );
        await _secureStorage.write(key: Keys.id, value: userAccount!.id);
        await _secureStorage.write(key: Keys.name, value: userAccount!.name);
        await _secureStorage.write(
          key: Keys.email,
          value: userAccount!.email ?? '',
        );

        // Debug: Print stored values
        print('Data berhasil disimpan ke secure storage:');
        print('Token: ${userAccount!.accessToken}');
        print('ID: ${userAccount!.id}');
        print('Name: ${userAccount!.name}');
        print('Email: ${userAccount!.email}');
      }
    } catch (e) {
      print('Error saat menyimpan data ke secure storage: $e');
      rethrow;
    }
  }

  /// Hapus semua data user dari secure storage
  Future<void> _clearStorage() async {
    try {
      await _secureStorage.deleteAll();
      userAccount = null;
      print('Semua data user berhasil dihapus dari storage.');
    } catch (e) {
      print('Error saat menghapus data dari secure storage: $e');
      rethrow;
    }
  }

  /// Fungsi login menggunakan email dan password
  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    try {
      // Step 1: Login ke API
      userAccount = await _authRepository.login(
        email: username,
        password: password,
      );

      if (userAccount == null) {
        throw Exception('User account is null');
      }

      print('Login berhasil, data user:');
      print('- ID: ${userAccount!.id}');
      print('- Name: ${userAccount!.name}');
      print('- Email: ${userAccount!.email}');
      print('- Token: ${userAccount!.accessToken}');

      // Step 2: Simpan data user ke secure storage
      await _setStorage();

      // Return success - navigasi akan dihandle oleh caller
      return {'success': true, 'message': 'Login berhasil.'};
    } on DioException catch (e) {
      String errorMessage = 'Login gagal. Silakan coba lagi.';
      if (e.response?.data != null) {
        final responseMessage = e.response?.data['message'];
        if (responseMessage != null) {
          if (responseMessage.toString().toLowerCase().contains('email')) {
            errorMessage = 'Email tidak ditemukan.';
          } else if (responseMessage.toString().toLowerCase().contains(
            'password',
          )) {
            errorMessage = 'Password salah.';
          } else if (responseMessage.toString().toLowerCase().contains(
            'nisn',
          )) {
            errorMessage = 'NISN tidak ditemukan.';
          } else {
            errorMessage = responseMessage.toString();
          }
        }
      }
      print('Login gagal: ${e.response?.data}');
      return {'success': false, 'message': errorMessage};
    } catch (e) {
      print('Login gagal: $e');
      return {
        'success': false,
        'message': 'Terjadi kesalahan. Silakan coba lagi.',
      };
    }
  }

  /// Fungsi logout
  Future<Map<String, dynamic>> logout() async {
    try {
      // Step 1: Hapus data user dari storage
      await _clearStorage();

      // Step 2: Hapus controller
      Get.delete<HomeController>(force: true);

      // Step 3: Navigasi ke halaman Login
      Get.offAllNamed('/login');

      return {'success': true, 'message': 'Logout berhasil.'};
    } catch (e) {
      print('Logout gagal: $e');
      return {'success': false, 'message': 'Logout gagal. Silakan coba lagi.'};
    }
  }

  /// Get user profile from storage or API
  Future<User?> getUserProfile() async {
    try {
      if (userAccount != null) {
        return userAccount;
      }

      // Load dari storage jika belum ada
      final token = await _secureStorage.read(key: Keys.token);
      if (token != null) {
        final userId = await _secureStorage.read(key: Keys.id) ?? '';
        final userName = await _secureStorage.read(key: Keys.name) ?? '';
        final userEmail = await _secureStorage.read(key: Keys.email) ?? '';

        userAccount = User(
          accessToken: token,
          id: userId,
          name: userName,
          email: userEmail,
        );

        return userAccount;
      }

      return null;
    } catch (e) {
      print('Error get user profile: $e');
      return null;
    }
  }
}
