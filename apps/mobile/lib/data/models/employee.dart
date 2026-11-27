enum EmployeeType {
  site,
  office,
}

class Employee {
  const Employee({
    required this.id,
    required this.name,
    required this.code,
    required this.role,
    required this.employeeType,
    required this.assignedLocationIds,
    required this.shiftStart,
    required this.shiftEnd,
    required this.phone,
    this.reportingManager = 'Vikram Shinde (Project Manager)',
    this.deviceBound = true,
  });

  final String id;
  final String name;
  final String code;
  final String role;
  final EmployeeType employeeType;
  final List<String> assignedLocationIds;
  final String shiftStart;
  final String shiftEnd;
  final String phone;
  final String reportingManager;
  final bool deviceBound;

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'U';
  }

  Employee copyWith({
    String? id,
    String? name,
    String? code,
    String? role,
    EmployeeType? employeeType,
    List<String>? assignedLocationIds,
    String? shiftStart,
    String? shiftEnd,
    String? phone,
    String? reportingManager,
    bool? deviceBound,
  }) {
    return Employee(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      role: role ?? this.role,
      employeeType: employeeType ?? this.employeeType,
      assignedLocationIds: assignedLocationIds ?? this.assignedLocationIds,
      shiftStart: shiftStart ?? this.shiftStart,
      shiftEnd: shiftEnd ?? this.shiftEnd,
      phone: phone ?? this.phone,
      reportingManager: reportingManager ?? this.reportingManager,
      deviceBound: deviceBound ?? this.deviceBound,
    );
  }
}
