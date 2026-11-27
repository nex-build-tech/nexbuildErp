import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../core/widgets/section_header.dart';
import '../providers/profile_provider.dart';
import 'widgets/assigned_locations_card.dart';
import 'widgets/employment_info_card.dart';
import 'widgets/logout_dialog.dart';
import 'widgets/profile_header.dart';
import 'widgets/settings_card.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final profile = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          l10n?.navProfile ?? 'Profile',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(profileProvider.notifier).refresh(),
          child: ListView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenHorizontal,
              vertical: AppSpacing.md,
            ),
            children: [
              ProfileHeader(employee: profile.employee),
              const SizedBox(height: AppSpacing.lg),
              SectionHeader(
                title: l10n?.assignedLocations ?? 'Assigned Work Locations',
              ),
              const SizedBox(height: AppSpacing.xs),
              AssignedLocationsCard(locations: profile.locations),
              const SizedBox(height: AppSpacing.lg),
              SectionHeader(
                title: l10n?.employmentDetails ?? 'Employment Details',
              ),
              const SizedBox(height: AppSpacing.xs),
              EmploymentInfoCard(employee: profile.employee),
              const SizedBox(height: AppSpacing.lg),
              SectionHeader(
                title: l10n?.appSettings ?? 'App Settings',
              ),
              const SizedBox(height: AppSpacing.xs),
              const SettingsCard(),
              const SizedBox(height: AppSpacing.xl),
              SizedBox(
                width: double.infinity,
                height: AppSpacing.primaryButtonHeight,
                child: OutlinedButton.icon(
                  onPressed: () {
                    showDialog<void>(
                      context: context,
                      builder: (ctx) => const LogoutDialog(),
                    );
                  },
                  icon: const Icon(
                    Icons.logout_rounded,
                    size: 18.0,
                    color: AppColors.error,
                  ),
                  label: Text(
                    l10n?.logout ?? 'Log Out',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(
                      color: AppColors.error,
                      width: 1.2,
                    ),
                    shape: const RoundedRectangleBorder(
                      borderRadius: AppSpacing.borderRadiusInput,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
            ],
          ),
        ),
      ),
    );
  }
}
