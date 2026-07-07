import 'package:dio/dio.dart';
import 'package:reservasi_futsal/app/core/const/endpoint.dart';
import 'package:reservasi_futsal/app/data/model/field_model.dart';
import 'package:reservasi_futsal/app/data/repository/field_repository.dart';

class FieldRepositoryImpl implements FieldRepository {
  final Dio client;

  FieldRepositoryImpl({required this.client});

  @override
  Future<List<Field>> getFields() async {
    try {
      print('📡 FieldRepository: Calling GET ${Endpoints.mobileFields}');
      final response = await client.get(Endpoints.mobileFields);
      print('📡 FieldRepository: Response status ${response.statusCode}');
      print('📡 FieldRepository: Response data: ${response.data}');

      final data = response.data;
      if (data is! Map || data['data'] is! List) {
        throw const FormatException('Invalid /mobile/fields response shape');
      }

      final rawList = data['data'] as List;
      return rawList
          .whereType<Map>()
          .map((e) => Field.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      print('❌ FieldRepository DioException: ${e.message}');
      print('❌ FieldRepository DioException response: ${e.response?.data}');
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to fetch fields',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      print('❌ FieldRepository Error: $e');
      throw Exception('Unexpected error: $e');
    }
  }

  @override
  Future<Field> getFieldById(String id, {String? date}) async {
    try {
      final response = await client.get(
        '${Endpoints.mobileFields}/$id',
        queryParameters: date != null ? {'date': date} : null,
      );

      final data = response.data;
      if (data is! Map || data['data'] == null) {
        throw const FormatException('Invalid field detail response');
      }

      return Field.fromJson(Map<String, dynamic>.from(data['data']));
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to fetch field detail',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      throw Exception('Unexpected error: $e');
    }
  }
}
