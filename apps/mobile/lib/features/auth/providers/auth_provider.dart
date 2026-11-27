import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthState {
  const AuthState({
    this.phoneNumber,
    this.isLoading = false,
    this.isOtpSent = false,
    this.otpCountdown = 30,
    this.errorMessage,
    this.isAuthenticated = false,
    this.hasCompletedPermissions = false,
  });

  final String? phoneNumber;
  final bool isLoading;
  final bool isOtpSent;
  final int otpCountdown;
  final String? errorMessage;
  final bool isAuthenticated;
  final bool hasCompletedPermissions;

  AuthState copyWith({
    String? phoneNumber,
    bool? isLoading,
    bool? isOtpSent,
    int? otpCountdown,
    String? errorMessage,
    bool clearError = false,
    bool? isAuthenticated,
    bool? hasCompletedPermissions,
  }) {
    return AuthState(
      phoneNumber: phoneNumber ?? this.phoneNumber,
      isLoading: isLoading ?? this.isLoading,
      isOtpSent: isOtpSent ?? this.isOtpSent,
      otpCountdown: otpCountdown ?? this.otpCountdown,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      hasCompletedPermissions:
          hasCompletedPermissions ?? this.hasCompletedPermissions,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  Timer? _countdownTimer;

  static const String validDemoOtp = '123456';

  @override
  AuthState build() {
    ref.onDispose(() {
      _countdownTimer?.cancel();
    });
    return const AuthState();
  }

  Future<bool> sendOtp(String rawPhone) async {
    final cleanPhone = rawPhone.replaceAll(RegExp(r'\s+'), '');
    if (cleanPhone.length != 10 || !RegExp(r'^[0-9]+$').hasMatch(cleanPhone)) {
      state = state.copyWith(
        errorMessage: 'Please enter a valid 10-digit mobile number',
      );
      return false;
    }

    state = state.copyWith(
      isLoading: true,
      clearError: true,
    );

    // Mock network latency
    await Future<void>.delayed(const Duration(milliseconds: 600));

    state = state.copyWith(
      isLoading: false,
      isOtpSent: true,
      phoneNumber: cleanPhone,
      otpCountdown: 30,
      clearError: true,
    );

    _startCountdown();
    return true;
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.otpCountdown > 1) {
        state = state.copyWith(otpCountdown: state.otpCountdown - 1);
      } else {
        timer.cancel();
        state = state.copyWith(otpCountdown: 0);
      }
    });
  }

  Future<bool> resendOtp() async {
    if (state.isLoading || state.otpCountdown > 0) return false;

    state = state.copyWith(isLoading: true, clearError: true);
    await Future<void>.delayed(const Duration(milliseconds: 400));
    state = state.copyWith(
      isLoading: false,
      otpCountdown: 30,
      clearError: true,
    );
    _startCountdown();
    return true;
  }

  Future<bool> verifyOtp(String enteredOtp) async {
    if (enteredOtp.length != 6) {
      state = state.copyWith(
        errorMessage: 'Please enter all 6 digits',
      );
      return false;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    await Future<void>.delayed(const Duration(milliseconds: 600));

    if (enteredOtp == validDemoOtp) {
      _countdownTimer?.cancel();
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        clearError: true,
      );
      return true;
    } else {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Invalid OTP. Use 123456 to continue.',
      );
      return false;
    }
  }

  void completePermissions() {
    state = state.copyWith(hasCompletedPermissions: true);
  }

  void resetError() {
    if (state.errorMessage != null) {
      state = state.copyWith(clearError: true);
    }
  }

  void authenticateForDemo() {
    _countdownTimer?.cancel();
    state = state.copyWith(
      isAuthenticated: true,
      hasCompletedPermissions: true,
      phoneNumber: '9876543210',
    );
  }

  void logout() {
    _countdownTimer?.cancel();
    state = const AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);
