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
  permissions?: string[];
}

export interface TenantInfo {
  name: string;
  slug: string;
  plan: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}
