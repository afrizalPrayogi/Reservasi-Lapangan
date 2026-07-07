import 'package:get/get.dart';

import '../controllers/registrasi_controller.dart';
import 'package:reservasi_futsal/app/data/repository/registrasi_repository.dart';

import 'package:reservasi_futsal/app/data/repository_impl/registrasi_repository_impl.dart';
import 'package:dio/dio.dart';

class RegistrasiBinding extends Bindings {
  @override
  void dependencies() {
    // Register repository implementation using the global Dio instance
    Get.lazyPut<RegistrasiRepository>(
      () => RegistrasiRepositoryImpl(client: Get.find<Dio>()),
    );

    Get.lazyPut<RegistrasiController>(
      () => RegistrasiController(repository: Get.find<RegistrasiRepository>()),
    );
  }
}
