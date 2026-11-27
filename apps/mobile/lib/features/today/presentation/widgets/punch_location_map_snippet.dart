import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/widgets/info_card.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../data/models/punch.dart';
import '../../../../data/models/work_location.dart';

class PunchLocationMapSnippet extends StatelessWidget {
  const PunchLocationMapSnippet({
    required this.punches,
    this.location,
    super.key,
  });

  final List<Punch> punches;
  final WorkLocation? location;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final siteName = location?.name ?? 'Site';
    final radius = location?.radiusMeters.round() ?? 200;

    return InfoCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(
            title: 'PUNCH LOCATIONS',
            subtitle: '$siteName ($radius m geofence)',
            trailing: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: 3.0,
              ),
              decoration: const BoxDecoration(
                color: AppColors.successContainer,
                borderRadius: AppSpacing.borderRadiusPill,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.check_circle_rounded,
                    size: 13.0,
                    color: AppColors.success,
                  ),
                  const SizedBox(width: 4.0),
                  Text(
                    'All in bounds',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: AppColors.success,
                      fontWeight: FontWeight.w700,
                      fontSize: 11.0,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          // Map Canvas Placeholder
          ClipRRect(
            borderRadius: AppSpacing.borderRadiusInput,
            child: Container(
              height: 140.0,
              width: double.infinity,
              color: const Color(0xFFEDF2F7),
              child: CustomPaint(
                painter: _MapSnippetPainter(
                  punchCount: punches.length,
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),

          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                children: [
                  Container(
                    width: 8.0,
                    height: 8.0,
                    decoration: const BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4.0),
                  Text(
                    'Punch In',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontSize: 11.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: AppSpacing.lg),
              Row(
                children: [
                  Container(
                    width: 8.0,
                    height: 8.0,
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4.0),
                  Text(
                    'Punch Out',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontSize: 11.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: AppSpacing.lg),
              Row(
                children: [
                  Container(
                    width: 8.0,
                    height: 8.0,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4.0),
                  Text(
                    'Site Centre',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontSize: 11.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MapSnippetPainter extends CustomPainter {
  const _MapSnippetPainter({required this.punchCount});

  final int punchCount;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.height * 0.38;

    // Background road / grid lines
    final gridPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1.0;

    for (double x = 0; x < size.width; x += 28.0) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), gridPaint);
    }
    for (double y = 0; y < size.height; y += 28.0) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Geofence circle fill
    final fillPaint = Paint()
      ..color = AppColors.success.withValues(alpha: 0.08)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius, fillPaint);

    // Geofence dashed border
    final borderPaint = Paint()
      ..color = AppColors.success.withValues(alpha: 0.6)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(center, radius, borderPaint);

    // Center site marker
    final siteCenterPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 5.0, siteCenterPaint);

    // Draw punch pins within radius
    final pinOffsets = [
      Offset(center.dx - 22, center.dy - 12), // In 1
      Offset(center.dx - 10, center.dy + 18), // Out 1
      Offset(center.dx + 26, center.dy - 8),  // In 2
      Offset(center.dx + 16, center.dy + 20), // Out 2
    ];

    for (int i = 0; i < punchCount && i < pinOffsets.length; i++) {
      final isPunchIn = i % 2 == 0;
      final color = isPunchIn ? AppColors.success : AppColors.error;

      // Pin halo
      final haloPaint = Paint()
        ..color = color.withValues(alpha: 0.2)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(pinOffsets[i], 8.0, haloPaint);

      // Pin dot
      final dotPaint = Paint()
        ..color = color
        ..style = PaintingStyle.fill;
      canvas.drawCircle(pinOffsets[i], 4.5, dotPaint);

      // Inner white dot
      final whitePaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      canvas.drawCircle(pinOffsets[i], 1.5, whitePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _MapSnippetPainter oldDelegate) {
    return oldDelegate.punchCount != punchCount;
  }
}
