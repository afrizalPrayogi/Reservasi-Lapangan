import 'package:get/get.dart';
import 'package:reservasi_futsal/app/routes/app_pages.dart';

class SplashController extends GetxController {
  void goToLogin() {
    Get.offAllNamed(Routes.LOGIN);
  }
}
