import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/widgets/info_card.dart';
import '../../../core/widgets/primary_button.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final FocusNode _phoneFocusNode = FocusNode();

  @override
  void dispose() {
    _phoneController.dispose();
    _phoneFocusNode.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    final authNotifier = ref.read(authProvider.notifier);
    final success = await authNotifier.sendOtp(_phoneController.text);
    if (success && mounted) {
      context.go('/otp');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenHorizontal,
            vertical: AppSpacing.lg,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl),
              // App Logo
              Container(
                width: 64.0,
                height: 64.0,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: AppSpacing.borderRadiusHeroCard,
                ),
                child: const Icon(
                  Icons.location_on_rounded,
                  size: 34.0,
                  color: AppColors.secondary,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),

              // Title and Subtitle
              Text(
                'NexBuild Attendance',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'Selfie + site-location attendance for site and office teams.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),

              // Mobile number input label
              Text(
                'Mobile number',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: AppColors.text,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              // +91 Container Input
              Container(
                height: 56.0,
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: AppSpacing.borderRadiusInput,
                  border: Border.all(
                    color: authState.errorMessage != null
                        ? AppColors.error
                        : AppColors.cardBorder,
                    width: 1.2,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                      alignment: Alignment.center,
                      child: Text(
                        '+91',
                        style: AppTypography.tabular(
                          fontSize: 16.0,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                    ),
                    const VerticalDivider(
                      width: 1.0,
                      thickness: 1.0,
                      color: AppColors.divider,
                    ),
                    Expanded(
                      child: TextField(
                        controller: _phoneController,
                        focusNode: _phoneFocusNode,
                        keyboardType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(10),
                        ],
                        style: AppTypography.tabular(
                          fontSize: 16.0,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                        decoration: InputDecoration(
                          hintText: '98765 43210',
                          hintStyle: theme.textTheme.bodyMedium?.copyWith(
                            color: AppColors.textHint,
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                          ),
                        ),
                        onChanged: (_) {
                          if (authState.errorMessage != null) {
                            ref.read(authProvider.notifier).resetError();
                          }
                        },
                        onSubmitted: (_) => _handleSendOtp(),
                      ),
                    ),
                  ],
                ),
              ),

              // Error banner if any
              if (authState.errorMessage != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      size: 16.0,
                      color: AppColors.error,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Expanded(
                      child: Text(
                        authState.errorMessage!,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: AppColors.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: AppSpacing.xl),

              // Send OTP Button
              PrimaryButton(
                text: 'Send OTP',
                isLoading: authState.isLoading,
                onPressed: _handleSendOtp,
              ),

              const SizedBox(height: AppSpacing.xxl),

              // Phone registration info card
              InfoCard(
                backgroundColor: AppColors.surface,
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.phone_android_rounded,
                      size: 24.0,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Text(
                        'This phone will be registered to your account. To switch phones later, ask your admin.',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppColors.textMuted,
                          fontSize: 13.0,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
