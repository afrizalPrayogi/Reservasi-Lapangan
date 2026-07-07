import 'package:reservasi_futsal/app/data/model/user_model.dart';

abstract class AuthRepository {
  Future<User> login({required String email, required String password});

  Future<Map<String, dynamic>> register({
    required String nip,
    required String fullName,
    required String email,
    required String password,
    required int roleCode,
  });

  Future<List<User>> getAllUsers(); // << Tambahkan ini

  Future<bool> validateToken(String token); // 👈 untuk validasi token

  Future<User> getUserProfile(); // Get current user profile
}
