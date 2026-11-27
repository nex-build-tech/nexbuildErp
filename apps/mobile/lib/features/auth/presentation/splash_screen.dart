import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Route to /login after 1.5s splash
    Future<void>.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        context.go('/login');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72.0,
                height: 72.0,
                decoration: const BoxDecoration(
                  color: AppColors.secondary,
                  borderRadius: AppSpacing.borderRadiusHeroCard,
                ),
                child: const Icon(
                  Icons.location_on_rounded,
                  size: 40.0,
                  color: AppColors.onSecondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'TrueShift',
                style: theme.textTheme.displaySmall?.copyWith(
                  color: AppColors.onPrimary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Real hours. Real shifts.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.primaryContainer,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
