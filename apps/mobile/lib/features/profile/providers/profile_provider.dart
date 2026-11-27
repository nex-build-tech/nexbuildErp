import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/employee.dart';
import '../../../data/models/work_location.dart';
import '../../../data/repositories/attendance_repository.dart';
import '../../home/providers/home_dashboard_provider.dart';

// --- Profile State & Provider ---

class ProfileState {
  const ProfileState({
    required this.employee,
    required this.locations,
    this.isLoading = false,
  });

  final Employee employee;
  final List<WorkLocation> locations;
  final bool isLoading;

  WorkLocation? get primaryLocation {
    try {
      return locations.firstWhere((l) => l.isPrimary);
    } catch (_) {
      return locations.isNotEmpty ? locations.first : null;
    }
  }

  ProfileState copyWith({
    Employee? employee,
    List<WorkLocation>? locations,
    bool? isLoading,
  }) {
    return ProfileState(
      employee: employee ?? this.employee,
      locations: locations ?? this.locations,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class ProfileNotifier extends Notifier<ProfileState> {
  late final AttendanceRepository _repository;

  @override
  ProfileState build() {
    _repository = ref.watch(attendanceRepositoryProvider);

    const dummyEmp = Employee(
      id: 'emp_0142',
      name: 'Ramesh Patil',
      code: 'EMP-0142',
      role: 'Site Engineer',
      employeeType: EmployeeType.site,
      assignedLocationIds: ['loc_01'],
      shiftStart: '09:00 AM',
      shiftEnd: '06:00 PM',
      phone: '9876543210',
      reportingManager: 'Vikram Shinde (Project Manager)',
    );

    const initialState = ProfileState(
      employee: dummyEmp,
      locations: [],
      isLoading: true,
    );

    Future.microtask(_init);

    return initialState;
  }

  Future<void> _init() async {
    state = state.copyWith(isLoading: true);
    final emp = await _repository.getCurrentEmployee();
    final locs = await _repository.getAssignedLocations();
    state = state.copyWith(
      employee: emp,
      locations: locs,
      isLoading: false,
    );
  }

  Future<void> refresh() async {
    await _init();
  }
}

final profileProvider = NotifierProvider<ProfileNotifier, ProfileState>(
  ProfileNotifier.new,
);

// --- Settings State & Provider (Language & Reminder) ---

class SettingsState {
  const SettingsState({
    this.locale = const Locale('en'),
    this.punchOutReminder = const TimeOfDay(hour: 17, minute: 45),
    this.isReminderEnabled = true,
  });

  final Locale locale;
  final TimeOfDay punchOutReminder;
  final bool isReminderEnabled;

  String get languageName => switch (locale.languageCode) {
        'mr' => 'मराठी',
        'hi' => 'हिंदी',
        _ => 'English',
      };

  SettingsState copyWith({
    Locale? locale,
    TimeOfDay? punchOutReminder,
    bool? isReminderEnabled,
  }) {
    return SettingsState(
      locale: locale ?? this.locale,
      punchOutReminder: punchOutReminder ?? this.punchOutReminder,
      isReminderEnabled: isReminderEnabled ?? this.isReminderEnabled,
    );
  }
}

class SettingsNotifier extends Notifier<SettingsState> {
  @override
  SettingsState build() => const SettingsState();

  void setLocale(Locale newLocale) {
    state = state.copyWith(locale: newLocale);
  }

  void setPunchOutReminder(TimeOfDay time) {
    state = state.copyWith(punchOutReminder: time);
  }

  void toggleReminder(bool enabled) {
    state = state.copyWith(isReminderEnabled: enabled);
  }
}

final settingsProvider = NotifierProvider<SettingsNotifier, SettingsState>(
  SettingsNotifier.new,
);
