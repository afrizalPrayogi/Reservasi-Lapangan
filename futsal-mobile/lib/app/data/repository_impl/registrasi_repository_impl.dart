import 'package:dio/dio.dart';
import 'package:reservasi_futsal/app/core/const/endpoint.dart';
import 'package:reservasi_futsal/app/data/repository/registrasi_repository.dart';

class RegistrasiRepositoryImpl extends RegistrasiRepository {
  final Dio client;

  RegistrasiRepositoryImpl({required this.client});

  @override
  Future<Map<String, dynamic>> register({
    required String email,
    required String name,
    required String password,
    required String phone,
  }) async {
    try {
      final response = await client.post(
        Endpoints.register, // user requested endpoint
        data: {
          'email': email,
          'name': name,
          'password': password,
          'phone': phone,
        },
      );

      // Normalize response
      if (response.statusCode == 200 || response.statusCode == 201) {
        return {'success': true, 'data': response.data};
      }

      return {'success': false, 'message': response.data};
    } on DioException catch (e) {
      if (e.response != null) {
        return {'success': false, 'message': e.response?.data};
      }
      return {'success': false, 'message': e.message};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
