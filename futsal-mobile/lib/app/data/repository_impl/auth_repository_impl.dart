import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:reservasi_futsal/app/core/const/endpoint.dart';
import 'package:reservasi_futsal/app/core/const/keys.dart';
import 'package:reservasi_futsal/app/data/model/user_model.dart';
import 'package:reservasi_futsal/app/data/repository/auth_repository.dart';

class AuthRepositoryImpl extends AuthRepository {
  final Dio client;
  final FlutterSecureStorage storage;

  AuthRepositoryImpl({required this.client, required this.storage});

  @override
  Future<User> login({required String email, required String password}) async {
    try {
      final response = await client.post(
        Endpoints.login,
        data: {'email': email, 'password': password},
      );
      print("hasil dari login : $response");
      if (response.statusCode == 200) {
        final userData =
            response.data['data']; // Ambil data di dalam objek data
        return User.fromJson(userData);
      } else {
        // Handle non-200 responses
        throw Exception(
          'Login failed with status code: ${response.statusCode}',
        );
      }
    } on DioException catch (dioError) {
      // Handle Dio errors separately for more detailed network-related errors
      if (dioError.response != null) {
        // Server responded with an error status code
        throw Exception(
          dioError.response?.data['message'] ?? 'Unknown server error',
        );
      } else {
        // No response from the server or other network errors
        throw Exception('Network error: ${dioError.message}');
      }
    } catch (e) {
      // Handle any other type of exceptions
      throw Exception('Unexpected error: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> register({
    required String nip,
    required String fullName,
    required String email,
    required String password,
    required int roleCode, // Tambahkan parameter role
  }) async {
    try {
      final response = await client.post(
        Endpoints.register,
        data: {
          'nip': nip,
          'nama': fullName,
          'email': email,
          'password': password,
          'roleCode': roleCode, // Tambahkan field role
        },
      );

      if (response.statusCode == 201) {
        return {'success': true, 'message': response.data['data']};
      } else {
        return {'success': false, 'message': response.data['data']};
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Register new account failed, please try again. $e',
      };
    }
  }

  @override
  Future<bool> validateToken(String token) async {
    try {
      final response = await client.get(
        Endpoints.profile, // Ganti dengan endpoint profile
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      return response.statusCode == 200;
    } on DioError catch (e) {
      // Jika unauthorized / token expired
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        return false;
      }
      rethrow;
    } catch (e) {
      return false;
    }
  }

  @override
  Future<List<User>> getAllUsers() async {
    try {
      final token = await storage.read(key: Keys.token);
      final response = await client.get(
        Endpoints.getAllUsers,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      ); // contoh: '/auth/users'

      final List<dynamic> data = response.data['data'];
      return data.map((json) => User.fromJson(json)).toList();
    } catch (e) {
      throw Exception("Failed to load users: $e");
    }
  }

  @override
  Future<User> getUserProfile() async {
    try {
      final token = await storage.read(key: Keys.token);
      print('📡 AuthRepository: Calling GET ${Endpoints.profile}');

      final response = await client.get(
        Endpoints.profile,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      print('📡 AuthRepository: Response status ${response.statusCode}');
      print('📡 AuthRepository: Response data: ${response.data}');

      if (response.statusCode == 200) {
        final userData = response.data['data'];
        return User.fromJson(userData);
      } else {
        throw Exception('Failed to get profile: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('❌ AuthRepository DioException: ${e.message}');
      print('❌ AuthRepository DioException response: ${e.response?.data}');

      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to get user profile',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      print('❌ AuthRepository Error: $e');
      throw Exception('Unexpected error: $e');
    }
  }
}
