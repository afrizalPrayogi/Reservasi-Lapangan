import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/splash_controller.dart';
import 'widgets/badminton_painter.dart';

class SplashView extends GetView<SplashController> {
  const SplashView({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize controller
    Get.find<SplashController>();

    return Scaffold(
      backgroundColor: const Color(0xFF0D1B3E), // Dark navy blue
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Badminton Illustration
              SizedBox(
                width: 250,
                height: 300,
                child: CustomPaint(painter: BadmintonPainter()),
              ),
              const SizedBox(height: 20),
              // App Title
              const Text(
                'GOR Tambora Jakarta Barat',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
