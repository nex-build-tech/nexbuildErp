import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';

class FaceOvalGuidePainter extends CustomPainter {
  const FaceOvalGuidePainter({
    this.borderColor = AppColors.secondary,
    this.overlayColor = const Color(0xB3000000), // 70% black
  });

  final Color borderColor;
  final Color overlayColor;

  @override
  void paint(Canvas canvas, Size size) {
    final ovalWidth = size.width * 0.68;
    final ovalHeight = size.height * 0.58;

    final center = Offset(size.width / 2, size.height * 0.44);
    final ovalRect = Rect.fromCenter(
      center: center,
      width: ovalWidth,
      height: ovalHeight,
    );

    // 1. Draw Dimmed Mask outside the oval using Path.combine
    final screenPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height));
    final ovalPath = Path()..addOval(ovalRect);
    final maskPath = Path.combine(
      PathOperation.difference,
      screenPath,
      ovalPath,
    );

    final maskPaint = Paint()
      ..color = overlayColor
      ..style = PaintingStyle.fill;
    canvas.drawPath(maskPath, maskPaint);

    // 2. Draw Amber Oval Border
    final borderPaint = Paint()
      ..color = borderColor
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;
    canvas.drawOval(ovalRect, borderPaint);

    // 3. Draw Subtle Head & Shoulders Silhouette inside the oval
    _drawSilhouette(canvas, center, ovalWidth, ovalHeight);
  }

  void _drawSilhouette(
    Canvas canvas,
    Offset center,
    double ovalWidth,
    double ovalHeight,
  ) {
    final silhouettePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    // Head circle
    final headRadius = ovalWidth * 0.28;
    final headCenter = Offset(center.dx, center.dy - (ovalHeight * 0.1));
    canvas.drawCircle(headCenter, headRadius, silhouettePaint);

    // Shoulders curve
    final shouldersPath = Path();
    final shoulderStart = Offset(center.dx - (ovalWidth * 0.38), center.dy + (ovalHeight * 0.38));
    final shoulderEnd = Offset(center.dx + (ovalWidth * 0.38), center.dy + (ovalHeight * 0.38));
    final neckLeft = Offset(center.dx - (headRadius * 0.65), center.dy + (headRadius * 0.95));
    final neckRight = Offset(center.dx + (headRadius * 0.65), center.dy + (headRadius * 0.95));

    shouldersPath.moveTo(shoulderStart.dx, shoulderStart.dy);
    shouldersPath.quadraticBezierTo(
      center.dx - (headRadius * 0.8),
      center.dy + (headRadius * 0.8),
      neckLeft.dx,
      neckLeft.dy,
    );
    shouldersPath.lineTo(neckRight.dx, neckRight.dy);
    shouldersPath.quadraticBezierTo(
      center.dx + (headRadius * 0.8),
      center.dy + (headRadius * 0.8),
      shoulderEnd.dx,
      shoulderEnd.dy,
    );

    canvas.drawPath(shouldersPath, silhouettePaint);
  }

  @override
  bool shouldRepaint(covariant FaceOvalGuidePainter oldDelegate) {
    return oldDelegate.borderColor != borderColor ||
        oldDelegate.overlayColor != overlayColor;
  }
}
