import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';
import 'package:reservasi_futsal/app/app_controller.dart';
import 'package:reservasi_futsal/app/core/utils/dio_instance.dart';
import 'package:reservasi_futsal/app/data/repository/auth_repository.dart';
import 'package:reservasi_futsal/app/data/repository/booking_repository.dart';
import 'package:reservasi_futsal/app/data/repository/field_repository.dart';
import 'package:reservasi_futsal/app/data/repository/registrasi_repository.dart';
import 'package:reservasi_futsal/app/data/repository_impl/auth_repository_impl.dart';
import 'package:reservasi_futsal/app/data/repository_impl/booking_repository_impl.dart';
import 'package:reservasi_futsal/app/data/repository_impl/field_repository_impl.dart';
import 'package:reservasi_futsal/app/data/repository_impl/registrasi_repository_impl.dart';
import 'package:reservasi_futsal/app/modules/booking_history/controllers/booking_history_controller.dart';
import 'package:reservasi_futsal/app/modules/home/controllers/home_controller.dart';
import 'package:reservasi_futsal/app/modules/profile/controllers/profile_controller.dart';

class InitialBindings extends Bindings {
  @override
  void dependencies() {
    Get.put<Dio>(
      DioUtils.initDio(
        dotenv.env['BASE_URL'] ?? const String.fromEnvironment('BASE_URL'),
      ),
      permanent: true,
    );

    Get.put<FlutterSecureStorage>(
      const FlutterSecureStorage(
        aOptions: AndroidOptions(encryptedSharedPreferences: true),
        iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
      ),
      permanent: true,
    );

    // Initialize Auth Repository
    Get.put<AuthRepository>(
      AuthRepositoryImpl(
        client: Get.find<Dio>(),
        storage: Get.find<FlutterSecureStorage>(),
      ),
      permanent: true,
    );

    // Initialize Field Repository
    Get.put<FieldRepository>(
      FieldRepositoryImpl(client: Get.find<Dio>()),
      permanent: true,
    );

    // Initialize Booking Repository
    Get.put<BookingRepository>(
      BookingRepositoryImpl(
        client: Get.find<Dio>(),
        storage: Get.find<FlutterSecureStorage>(),
      ),
      permanent: true,
    );

    // Initialize Auth Controller
    Get.put<AuthController>(AuthController(), permanent: true);
    Get.put<HomeController>(HomeController(), permanent: true);
    Get.lazyPut(() => BookingHistoryController(), fenix: true);
    Get.lazyPut(() => ProfileController(), fenix: true);
  }
}
