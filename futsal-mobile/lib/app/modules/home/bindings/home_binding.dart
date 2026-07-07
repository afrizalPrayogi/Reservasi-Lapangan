import 'package:get/get.dart';

import '../../booking_history/controllers/booking_history_controller.dart';
import '../../profile/controllers/profile_controller.dart';
import '../controllers/home_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(() => HomeController());

    // Tabs render these views directly (not via GetPage), so we must register
    // their controllers here.
    Get.lazyPut<BookingHistoryController>(
      () => BookingHistoryController(),
      fenix: true,
    );
    Get.lazyPut<ProfileController>(() => ProfileController(), fenix: true);
  }
}
