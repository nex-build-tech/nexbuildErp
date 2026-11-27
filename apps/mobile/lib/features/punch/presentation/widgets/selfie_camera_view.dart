import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../services/camera_service.dart';
import 'face_oval_guide_painter.dart';

class SelfieCameraView extends StatefulWidget {
  const SelfieCameraView({
    required this.cameraService,
    super.key,
  });

  final CameraService cameraService;

  @override
  State<SelfieCameraView> createState() => _SelfieCameraViewState();
}

class _SelfieCameraViewState extends State<SelfieCameraView> {
  @override
  void initState() {
    super.initState();
    if (!widget.cameraService.isInitialized) {
      widget.cameraService.initialize().then((_) {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ClipRRect(
      borderRadius: AppSpacing.borderRadiusHeroCard,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Camera Viewfinder Background Placeholder
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF0F172A),
                  Color(0xFF1E293B),
                  Color(0xFF0F172A),
                ],
              ),
            ),
          ),

          // Subtle Grid / Viewfinder lines
          CustomPaint(
            painter: _ViewfinderGridPainter(),
          ),

          // 2. Dimmed Mask & Amber Oval Guide
          const CustomPaint(
            painter: FaceOvalGuidePainter(),
          ),

          // 3. Top Hint: "Keep your face inside the oval"
          Positioned(
            top: 24.0,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: 6.0,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  borderRadius: AppSpacing.borderRadiusPill,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.2),
                    width: 1.0,
                  ),
                ),
                child: Text(
                  'Keep your face inside the oval',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),

          // 4. Bottom Hint: "Blink once to confirm it's live" (amber pill, dark text)
          Positioned(
            bottom: 40.0,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.sm,
                ),
                decoration: BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: AppSpacing.borderRadiusPill,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.secondary.withValues(alpha: 0.4),
                      blurRadius: 8.0,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.remove_red_eye_outlined,
                      size: 16.0,
                      color: AppColors.onSecondary,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      "Blink once to confirm it's live",
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: AppColors.onSecondary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ViewfinderGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..strokeWidth = 1.0;

    const gridSize = 40.0;
    for (double x = 0; x < size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
