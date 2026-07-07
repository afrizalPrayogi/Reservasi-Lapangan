import 'dart:math' as math;
import 'package:flutter/material.dart';

class BadmintonPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;

    // Paints
    final racketStrokePaint = Paint()
      ..color = const Color(0xFFE63946) // Accent Red
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;

    final stringPaint = Paint()
      ..color = Colors.white.withOpacity(0.4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final shaftPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    final handlePaint = Paint()
      ..color = const Color(0xFFFFDBB4) // Light wood color for grip
      ..style = PaintingStyle.fill;

    final handleWrapPaint = Paint()
      ..color = const Color(0xFF1D3557) // Dark Navy grip wrap stripes
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final shuttleBasePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final shuttleFeatherPaint = Paint()
      ..color = Colors.white.withOpacity(0.85)
      ..style = PaintingStyle.fill;

    final shuttleStrokePaint = Paint()
      ..color = const Color(0xFF1D3557)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    // ----------------------------------------------------
    // DRAW BADMINTON RACKET
    // ----------------------------------------------------

    // Rotation transformation to draw racket at an elegant angle
    canvas.save();
    canvas.translate(centerX - 10, centerY - 15);
    canvas.rotate(-math.pi / 6); // 30 degrees counter-clockwise

    // 1. Racket Head (Oval)
    final headRect = Rect.fromCenter(center: const Offset(0, -60), width: 70, height: 90);
    canvas.drawOval(headRect, racketStrokePaint);

    // 2. Racket Strings (Grid)
    // Vertical strings
    for (double dx = -25; dx <= 25; dx += 8) {
      // Calculate length of vertical line inside the oval
      final halfH = 45 * math.sqrt(1 - (dx * dx) / (35 * 35));
      if (!halfH.isNaN) {
        canvas.drawLine(Offset(dx, -60 - halfH), Offset(dx, -60 + halfH), stringPaint);
      }
    }
    // Horizontal strings
    for (double dy = -35; dy <= 35; dy += 8) {
      // Calculate length of horizontal line inside the oval
      final halfW = 35 * math.sqrt(1 - (dy * dy) / (45 * 45));
      if (!halfW.isNaN) {
        canvas.drawLine(Offset(-halfW, -60 + dy), Offset(halfW, -60 + dy), stringPaint);
      }
    }

    // 3. T-Joint (Joint connecting head and shaft)
    final tJointPath = Path()
      ..moveTo(-5, -15)
      ..lineTo(5, -15)
      ..lineTo(0, -10)
      ..close();
    canvas.drawPath(tJointPath, Paint()..color = Colors.white);

    // 4. Shaft (Long thin pole)
    canvas.drawLine(const Offset(0, -15), const Offset(0, 80), shaftPaint);

    // 5. Handle (Grip)
    final gripRect = RRect.fromRectAndRadius(
      Rect.fromPoints(const Offset(-5, 80), const Offset(5, 130)),
      const Radius.circular(2),
    );
    canvas.drawRRect(gripRect, handlePaint);
    canvas.drawRRect(gripRect, Paint()..color = Colors.white.withOpacity(0.2)..style = PaintingStyle.stroke);

    // Grip Wrap lines
    for (double h = 88; h <= 128; h += 8) {
      canvas.drawLine(Offset(-5, h), Offset(5, h - 3), handleWrapPaint);
    }

    canvas.restore();

    // ----------------------------------------------------
    // DRAW SHUTTLECOCK (KOK)
    // ----------------------------------------------------
    canvas.save();
    // Position shuttlecock to the bottom right of the racket head
    canvas.translate(centerX + 40, centerY + 30);
    canvas.rotate(math.pi / 12); // tilted slightly

    // 1. Feathers (Cone shape extending upwards)
    final featherPath = Path()
      ..moveTo(0, 0) // Connecting point with cork
      ..lineTo(-18, -35) // Top left feather tip
      ..lineTo(18, -35) // Top right feather tip
      ..close();
    canvas.drawPath(featherPath, shuttleFeatherPaint);

    // Feather structural lines
    canvas.drawLine(const Offset(-8, -5), const Offset(-18, -35), shuttleStrokePaint);
    canvas.drawLine(const Offset(0, -5), const Offset(0, -35), shuttleStrokePaint);
    canvas.drawLine(const Offset(8, -5), const Offset(18, -35), shuttleStrokePaint);

    // Horizontal threads keeping feathers together
    canvas.drawArc(
      Rect.fromCenter(center: const Offset(0, -18), width: 22, height: 10),
      math.pi, math.pi * 2, false, shuttleStrokePaint
    );
    canvas.drawArc(
      Rect.fromCenter(center: const Offset(0, -28), width: 30, height: 10),
      math.pi, math.pi * 2, false, shuttleStrokePaint
    );

    // 2. Cork Base (Rounded bottom)
    final corkRect = Rect.fromCenter(center: const Offset(0, 2), width: 18, height: 16);
    canvas.drawArc(corkRect, 0, math.pi, false, shuttleBasePaint);
    canvas.drawArc(corkRect, 0, math.pi, false, shuttleStrokePaint);

    // Line dividing cork and feathers (blue tape on real shuttles)
    final tapePaint = Paint()
      ..color = const Color(0xFF1D3557) // Dark Blue tape
      ..style = PaintingStyle.fill;
    canvas.drawRect(Rect.fromLTRB(-9, -2, 9, 1), tapePaint);

    canvas.restore();

    // ----------------------------------------------------
    // GROUND & SHADOW EFFECTS
    // ----------------------------------------------------
    final shadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final shadowPath = Path()
      ..moveTo(centerX - 50, centerY + 130)
      ..quadraticBezierTo(centerX, centerY + 135, centerX + 50, centerY + 125);
    canvas.drawPath(shadowPath, shadowPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
