export interface AssignedSite {
  id: number;
  code: string;
  name: string;
  companyId?: number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  geofenceRadius?: number;
  status?: string;
}

export interface UserRole {
  id: number;
  code: string;
  name: string;
}

export interface User {
  id?: string | number;
  uuid: string;
  username: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string | null;
  role: UserRole | string;
  avatarUrl?: string | null;
  profileCompleted?: boolean;
  profileCompletedAt?: string | null;
  assignedSites?: AssignedSite[];
  permissions?: string[];
}

export interface TenantInfo {
  name: string;
  slug: string;
  plan: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}
