import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';

class GeofenceMapPlaceholder extends StatelessWidget {
  const GeofenceMapPlaceholder({
    super.key,
    this.isInside = true,
    this.radiusMeters = 200,
    this.distanceMeters = 42,
    this.height = 190.0,
  });

  final bool isInside;
  final int radiusMeters;
  final int distanceMeters;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFFEFF5FB),
        borderRadius: AppSpacing.borderRadiusCard,
        border: Border.all(color: AppColors.cardBorder, width: 1.0),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          CustomPaint(
            size: Size.infinite,
            painter: _GeofencePainter(
              isInside: isInside,
              radiusMeters: radiusMeters,
              distanceMeters: distanceMeters,
            ),
          ),
          if (isInside)
            Positioned(
              top: AppSpacing.md,
              right: AppSpacing.md,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.sm + 2,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: AppSpacing.borderRadiusPill,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Text(
                  'Radius $radiusMeters m',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                ),
              ),
            ),
          if (!isInside)
            Positioned(
              bottom: AppSpacing.md,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'Site radius $radiusMeters m',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _GeofencePainter extends CustomPainter {
  const _GeofencePainter({
    required this.isInside,
    required this.radiusMeters,
    required this.distanceMeters,
  });

  final bool isInside;
  final int radiusMeters;
  final int distanceMeters;

  @override
  void paint(Canvas canvas, Size size) {
    _drawGrid(canvas, size);

    // Site center coordinate
    final siteCenter = isInside
        ? Offset(size.width * 0.48, size.height * 0.48)
        : Offset(size.width * 0.35, size.height * 0.50);

    final circleRadius = isInside ? size.height * 0.36 : size.height * 0.35;

    // Draw geofence circle fill and dashed boundary
    final fillPaint = Paint()
      ..color = const Color(0xFFD6E4F5).withValues(alpha: 0.35)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(siteCenter, circleRadius, fillPaint);

    _drawDashedCircle(canvas, siteCenter, circleRadius, AppColors.primary);

    // Center site marker (navy rounded square)
    _drawSiteMarker(canvas, siteCenter);

    // User position marker
    if (isInside) {
      // Inside: offset slightly from center
      final userPos = Offset(siteCenter.dx + 26.0, siteCenter.dy + 16.0);
      _drawInsideUserMarker(canvas, userPos);
    } else {
      // Outside: user is further out to the right
      final userPos = Offset(size.width * 0.76, size.height * 0.28);

      // Point on the circle boundary towards the user
      final angle = math.atan2(userPos.dy - siteCenter.dy, userPos.dx - siteCenter.dx);
      final circleEdgePoint = Offset(
        siteCenter.dx + circleRadius * math.cos(angle),
        siteCenter.dy + circleRadius * math.sin(angle),
      );

      // Red dashed connection line
      _drawDashedLine(canvas, circleEdgePoint, userPos, AppColors.error);

      // Red user marker and "You" badge
      _drawOutsideUserMarker(canvas, userPos);
    }
  }

  void _drawGrid(Canvas canvas, Size size) {
    final gridPaint = Paint()
      ..color = const Color(0xFFDEE8F4)
      ..strokeWidth = 1.0;

    const gridSize = 24.0;
    for (double x = 0; x < size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }
  }

  void _drawDashedCircle(Canvas canvas, Offset center, double radius, Color color) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.8)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    const dashWidth = 6.0;
    const dashSpace = 4.0;
    final circumference = 2 * math.pi * radius;
    final count = (circumference / (dashWidth + dashSpace)).floor();
    final step = (2 * math.pi) / count;

    for (int i = 0; i < count; i++) {
      final startAngle = i * step;
      final sweepAngle = (dashWidth / circumference) * 2 * math.pi;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        paint,
      );
    }
  }

  void _drawSiteMarker(Canvas canvas, Offset center) {
    const size = 18.0;
    final rect = Rect.fromCenter(center: center, width: size, height: size);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(5.0));

    // Outer shadow / glow
    final glowPaint = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.15)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 14.0, glowPaint);

    final sitePaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;
    canvas.drawRRect(rrect, sitePaint);
  }

  void _drawInsideUserMarker(Canvas canvas, Offset center) {
    // Outer halo
    final haloPaint = Paint()
      ..color = AppColors.success.withValues(alpha: 0.25)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 14.0, haloPaint);

    // White ring
    final ringPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 9.0, ringPaint);

    // Green user marker
    const size = 14.0;
    final rect = Rect.fromCenter(center: center, width: size, height: size);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(4.0));
    final userPaint = Paint()
      ..color = AppColors.success
      ..style = PaintingStyle.fill;
    canvas.drawRRect(rrect, userPaint);
  }

  void _drawOutsideUserMarker(Canvas canvas, Offset center) {
    // Outer halo
    final haloPaint = Paint()
      ..color = AppColors.error.withValues(alpha: 0.2)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 16.0, haloPaint);

    // White ring
    final ringPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 11.0, ringPaint);

    // Red user marker
    const size = 16.0;
    final rect = Rect.fromCenter(center: center, width: size, height: size);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(5.0));
    final userPaint = Paint()
      ..color = AppColors.error
      ..style = PaintingStyle.fill;
    canvas.drawRRect(rrect, userPaint);

    // "You" pill label below user marker
    const textSpan = TextSpan(
      text: 'You',
      style: TextStyle(
        color: AppColors.error,
        fontSize: 10.0,
        fontWeight: FontWeight.w700,
      ),
    );
    final textPainter = TextPainter(
      text: textSpan,
      textDirection: TextDirection.ltr,
    )..layout();

    const pillPaddingH = 6.0;
    const pillPaddingV = 2.0;
    final pillRect = Rect.fromCenter(
      center: Offset(center.dx, center.dy + 18.0),
      width: textPainter.width + (pillPaddingH * 2),
      height: textPainter.height + (pillPaddingV * 2),
    );
    final pillRRect = RRect.fromRectAndRadius(pillRect, const Radius.circular(10.0));

    final pillPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawRRect(pillRRect, pillPaint);

    textPainter.paint(
      canvas,
      Offset(
        pillRect.left + pillPaddingH,
        pillRect.top + pillPaddingV,
      ),
    );
  }

  void _drawDashedLine(Canvas canvas, Offset p1, Offset p2, Color color) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    const dashWidth = 5.0;
    const dashSpace = 4.0;
    final dx = p2.dx - p1.dx;
    final dy = p2.dy - p1.dy;
    final distance = math.sqrt(dx * dx + dy * dy);
    final unitX = dx / distance;
    final unitY = dy / distance;

    double currentDist = 0.0;
    while (currentDist < distance) {
      final start = Offset(p1.dx + unitX * currentDist, p1.dy + unitY * currentDist);
      final nextDist = math.min(currentDist + dashWidth, distance);
      final end = Offset(p1.dx + unitX * nextDist, p1.dy + unitY * nextDist);
      canvas.drawLine(start, end, paint);
      currentDist += dashWidth + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant _GeofencePainter oldDelegate) {
    return oldDelegate.isInside != isInside ||
        oldDelegate.radiusMeters != radiusMeters ||
        oldDelegate.distanceMeters != distanceMeters;
  }
}
