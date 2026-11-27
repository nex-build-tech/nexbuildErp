import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_spacing.dart';

class LoadingSkeletonCard extends StatefulWidget {
  const LoadingSkeletonCard({
    super.key,
    this.height = 120.0,
    this.borderRadius,
  });

  final double height;
  final BorderRadius? borderRadius;

  @override
  State<LoadingSkeletonCard> createState() => _LoadingSkeletonCardState();
}

class _LoadingSkeletonCardState extends State<LoadingSkeletonCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: 0.35, end: 0.85).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: double.infinity,
          height: widget.height,
          decoration: BoxDecoration(
            color: AppColors.divider.withValues(alpha: _animation.value),
            borderRadius: widget.borderRadius ?? AppSpacing.borderRadiusCard,
            border: Border.all(
              color: AppColors.cardBorder,
              width: 1.0,
            ),
          ),
        );
      },
    );
  }
}
