import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../auth/providers/auth_provider.dart';

class LogoutDialog extends ConsumerWidget {
  const LogoutDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return AlertDialog(
      shape: const RoundedRectangleBorder(
        borderRadius: AppSpacing.borderRadiusCard,
      ),
      backgroundColor: AppColors.surface,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.xs),
            decoration: BoxDecoration(
              color: theme.colorScheme.errorContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.logout_rounded,
              size: 20.0,
              color: theme.colorScheme.error,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              l10n?.logoutConfirmTitle ?? 'Log out?',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      content: Text(
        l10n?.logoutConfirmMessage ??
            'Are you sure you want to log out? You will need your registered mobile number to log back in.',
        style: theme.textTheme.bodyMedium?.copyWith(
          color: AppColors.textMuted,
        ),
      ),
      actionsPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            l10n?.cancel ?? 'Cancel',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
            ),
          ),
        ),
        FilledButton(
          onPressed: () {
            Navigator.of(context).pop();
            ref.read(authProvider.notifier).logout();
            context.go('/login');
          },
          style: FilledButton.styleFrom(
            backgroundColor: theme.colorScheme.error,
            foregroundColor: theme.colorScheme.onError,
            shape: const RoundedRectangleBorder(
              borderRadius: AppSpacing.borderRadiusInput,
            ),
          ),
          child: Text(
            l10n?.logout ?? 'Log Out',
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onError,
            ),
          ),
        ),
      ],
    );
  }
}
