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

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  static const int _otpLength = 6;
  final List<TextEditingController> _controllers = List.generate(
    _otpLength,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(
    _otpLength,
    (_) => FocusNode(),
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_focusNodes.isNotEmpty) {
        _focusNodes[0].requestFocus();
      }
    });
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    for (final fn in _focusNodes) {
      fn.dispose();
    }
    super.dispose();
  }

  String get _currentOtp => _controllers.map((c) => c.text).join();

  void _onDigitChanged(int index, String value) {
    ref.read(authProvider.notifier).resetError();

    if (value.length > 1) {
      // User pasted or typed multiple chars
      final digits = value.replaceAll(RegExp(r'\D'), '');
      for (int i = 0; i < _otpLength && i < digits.length; i++) {
        _controllers[i].text = digits[i];
      }
      final nextIndex = digits.length < _otpLength ? digits.length : _otpLength - 1;
      _focusNodes[nextIndex].requestFocus();
      if (_currentOtp.length == _otpLength) {
        _handleVerify();
      }
      return;
    }

    if (value.isNotEmpty) {
      if (index < _otpLength - 1) {
        _focusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index].unfocus();
        _handleVerify();
      }
    }
  }

  void _onKeyEvent(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _controllers[index - 1].clear();
      _focusNodes[index - 1].requestFocus();
    }
  }

  Future<void> _handleVerify() async {
    final otp = _currentOtp;
    final success = await ref.read(authProvider.notifier).verifyOtp(otp);
    if (success && mounted) {
      context.go('/permissions');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authProvider);
    final phone = authState.phoneNumber ?? '98765 43210';
    final formattedPhone = phone.length == 10
        ? '${phone.substring(0, 5)} ${phone.substring(5)}'
        : phone;

    final secondsStr = authState.otpCountdown.toString().padLeft(2, '0');

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back to login',
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            ref.read(authProvider.notifier).resetError();
            context.go('/login');
          },
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenHorizontal,
            vertical: AppSpacing.sm,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Container(
                width: 56.0,
                height: 56.0,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: AppSpacing.borderRadiusHeroCard,
                ),
                child: const Icon(
                  Icons.location_on_rounded,
                  size: 30.0,
                  color: AppColors.secondary,
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

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
              const SizedBox(height: AppSpacing.xl),

              // Sent to mobile indicator
              Row(
                children: [
                  Text(
                    'Mobile: +91 $formattedPhone',
                    style: AppTypography.tabular(
                      fontSize: 14.0,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  InkWell(
                    onTap: () => context.go('/login'),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.xs,
                        vertical: 2.0,
                      ),
                      child: Text(
                        'Change',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),

              // Enter OTP label
              Text(
                'Enter OTP sent by SMS',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: AppColors.text,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              // 6 OTP Boxes
              LayoutBuilder(
                builder: (context, constraints) {
                  const totalSpacing = AppSpacing.sm * (_otpLength - 1);
                  final boxWidth = ((constraints.maxWidth - totalSpacing) / _otpLength)
                      .clamp(40.0, 52.0);

                  return Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(_otpLength, (index) {
                      final hasError = authState.errorMessage != null;
                      final isFocused = _focusNodes[index].hasFocus;

                      return SizedBox(
                        width: boxWidth,
                        height: 58.0,
                        child: KeyboardListener(
                          focusNode: FocusNode(),
                          onKeyEvent: (event) => _onKeyEvent(index, event),
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: AppSpacing.borderRadiusInput,
                              border: Border.all(
                                color: hasError
                                    ? AppColors.error
                                    : (isFocused
                                        ? AppColors.primary
                                        : AppColors.cardBorder),
                                width: isFocused ? 1.8 : 1.2,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: TextField(
                              controller: _controllers[index],
                              focusNode: _focusNodes[index],
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              maxLength: 1,
                              style: AppTypography.tabular(
                                fontSize: 22.0,
                                fontWeight: FontWeight.w800,
                                color: AppColors.text,
                              ),
                              decoration: const InputDecoration(
                                counterText: '',
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.zero,
                              ),
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              onChanged: (val) => _onDigitChanged(index, val),
                            ),
                          ),
                        ),
                      );
                    }),
                  );
                },
              ),

              const SizedBox(height: AppSpacing.md),

              // Resend countdown or button
              if (authState.otpCountdown > 0)
                Text(
                  'Resend OTP in 00:$secondsStr',
                  style: AppTypography.tabular(
                    fontSize: 13.0,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMuted,
                  ),
                )
              else
                InkWell(
                  onTap: () {
                    ref.read(authProvider.notifier).resendOtp();
                  },
                  borderRadius: AppSpacing.borderRadiusChip,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4.0),
                    child: Text(
                      'Resend OTP',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),

              // Error display
              if (authState.errorMessage != null) ...[
                const SizedBox(height: AppSpacing.md),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: const BoxDecoration(
                    color: AppColors.errorContainer,
                    borderRadius: AppSpacing.borderRadiusChip,
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        size: 18.0,
                        color: AppColors.error,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          authState.errorMessage!,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: AppColors.onErrorContainer,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.xl),

              // Verify Button
              PrimaryButton(
                text: 'Verify OTP',
                isLoading: authState.isLoading,
                onPressed: _handleVerify,
              ),

              const SizedBox(height: AppSpacing.xxl),

              // Phone registration info card (matching screenshot 01)
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
