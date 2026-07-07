import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:reservasi_futsal/app/core/const/endpoint.dart';
import 'package:reservasi_futsal/app/core/const/keys.dart';
import 'package:reservasi_futsal/app/data/model/booking_model.dart';
import 'package:reservasi_futsal/app/data/repository/booking_repository.dart';

class BookingRepositoryImpl implements BookingRepository {
  final Dio client;
  final FlutterSecureStorage storage;

  BookingRepositoryImpl({required this.client, required this.storage});

  @override
  Future<BookingResponse> getMyBookings({int page = 1, int limit = 20}) async {
    try {
      final token = await storage.read(key: Keys.token);
      print('📡 BookingRepository: Calling GET ${Endpoints.myBookings}');
      print('📡 BookingRepository: Query params - page: $page, limit: $limit');

      final response = await client.get(
        Endpoints.myBookings,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
        queryParameters: {'page': page, 'limit': limit},
      );

      print('📡 BookingRepository: Response status ${response.statusCode}');
      print('📡 BookingRepository: Response data: ${response.data}');

      final data = response.data;
      if (data is! Map) {
        throw const FormatException('Invalid booking response shape');
      }

      return BookingResponse.fromJson(Map<String, dynamic>.from(data));
    } on DioException catch (e) {
      print('❌ BookingRepository DioException: ${e.message}');
      print('❌ BookingRepository DioException response: ${e.response?.data}');

      if (e.response != null) {
        throw Exception(
          e.response?.data['message'] ?? 'Failed to fetch booking history',
        );
      } else {
        throw Exception('Network error: ${e.message}');
      }
    } catch (e) {
      print('❌ BookingRepository Error: $e');
      throw Exception('Unexpected error: $e');
    }
  }

  @override
  Future<Map<String, dynamic>> createBooking({
    required String fieldId,
    required String startTime,
    required int durationHours,
    required String paymentProofPath,
    String? paymentProofName,
    required String orderDate,
    bool isDp = false,
  }) async {
    try {
      final token = await storage.read(key: Keys.token);
      print('📡 BookingRepository: Calling POST ${Endpoints.bookings}');
      print(
        '📡 BookingRepository: fieldId: $fieldId, startTime: $startTime, durationHours: $durationHours, orderDate: $orderDate, isDp: $isDp',
      );

      final filename = paymentProofName ?? paymentProofPath.split('/').last;
      final ext = filename.split('.').last.toLowerCase();
      MediaType? contentType;
      if (ext == 'png') {
        contentType = MediaType('image', 'png');
      } else if (ext == 'jpg' || ext == 'jpeg') {
        contentType = MediaType('image', 'jpeg');
      } else if (ext == 'webp') {
        contentType = MediaType('image', 'webp');
      }

      MultipartFile file;
      if (kIsWeb) {
        final bytes = await XFile(paymentProofPath).readAsBytes();
        file = MultipartFile.fromBytes(
          bytes,
          filename: filename,
          contentType: contentType,
        );
      } else {
        file = await MultipartFile.fromFile(
          paymentProofPath,
          filename: filename,
          contentType: contentType,
        );
      }

      // Create FormData for multipart request
      final formData = FormData.fromMap({
        'fieldId': fieldId,
        'startTime': startTime,
        'durationHours': durationHours,
        'orderDate': orderDate,
        'paymentProof': file,
        'isDp': isDp ? 'true' : 'false',
      });

      final response = await client.post(
        Endpoints.bookings,
        data: formData,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      print('📡 BookingRepository: Response status ${response.statusCode}');
      print('📡 BookingRepository: Response data: ${response.data}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Booking berhasil dibuat',
          'data': response.data['data'],
        };
      } else {
        return {
          'success': false,
          'message': response.data['message'] ?? 'Gagal membuat booking',
        };
      }
    } on DioException catch (e) {
      print('❌ BookingRepository DioException: ${e.message}');
      print('❌ BookingRepository DioException response: ${e.response?.data}');

      if (e.response != null) {
        return {
          'success': false,
          'message': e.response?.data['message'] ?? 'Failed to create booking',
        };
      } else {
        return {'success': false, 'message': 'Network error: ${e.message}'};
      }
    } catch (e) {
      print('❌ BookingRepository Error: $e');
      return {'success': false, 'message': 'Unexpected error: $e'};
    }
  }
}
