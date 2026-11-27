import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import 'request_approval_sheet.dart';

class OutsideSiteAlert extends StatelessWidget {
  const OutsideSiteAlert({
    required this.siteName,
    required this.distanceMeters,
    required this.radiusMeters,
    required this.onRefreshLocation,
    this.isRefreshing = false,
    super.key,
  });

  final String siteName;
  final int distanceMeters;
  final int radiusMeters;
  final VoidCallback onRefreshLocation;
  final bool isRefreshing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        // Red alert card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.errorContainer,
            borderRadius: AppSpacing.borderRadiusCard,
            border: Border.all(
              color: AppColors.error.withValues(alpha: 0.2),
              width: 1.0,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 2.0),
                child: Icon(
                  Icons.error_outline_rounded,
                  color: AppColors.error,
                  size: 22.0,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "You're $distanceMeters m outside your site",
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: AppColors.error,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2.0),
                    Text(
                      'Move within $radiusMeters m of $siteName to punch in.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.error.withValues(alpha: 0.85),
                        fontSize: 13.0,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Refresh location button
        SizedBox(
          height: 48.0,
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: isRefreshing ? null : onRefreshLocation,
            icon: isRefreshing
                ? const SizedBox(
                    width: 18.0,
                    height: 18.0,
                    child: CircularProgressIndicator(strokeWidth: 2.0),
                  )
                : const Icon(Icons.refresh_rounded, size: 20.0),
            label: Text(
              isRefreshing ? 'Refreshing location...' : 'Refresh location',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              side: const BorderSide(color: AppColors.primary, width: 1.2),
              shape: const RoundedRectangleBorder(
                borderRadius: AppSpacing.borderRadiusInput,
              ),
            ),
          ),
        ),

        const SizedBox(height: AppSpacing.md),

        // Request approval link
        InkWell(
          onTap: () {
            RequestApprovalSheet.show(
              context,
              currentSiteName: siteName,
              distanceMeters: distanceMeters,
            );
          },
          borderRadius: AppSpacing.borderRadiusChip,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xs,
            ),
            child: Text(
              'Working at another location? Request approval',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
