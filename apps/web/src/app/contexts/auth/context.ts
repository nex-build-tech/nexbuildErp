import { User } from "@/@types/user";
import { createSafeContext } from "@/utils/createSafeContext";

export interface TenantInfo {
  id?: number;
  name: string;
  slug: string;
  plan?: string;
  tagline?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  mfaEnabled?: boolean | null;
  modules?: Array<{ moduleCode: string; enabled: boolean }> | string[];
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  errorMessage: string | null;
  user: User | null;
  tenant: TenantInfo | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const [AuthProvider, useAuthContext] =
  createSafeContext<AuthContextType>(
    "useAuthContext must be used within AuthProvider",
  );
