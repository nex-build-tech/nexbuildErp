// Import Dependencies
import { Navigate, useLocation, useOutlet } from "react-router";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { GHOST_ENTRY_PATH, REDIRECT_URL_KEY } from "@/constants/app";

// ----------------------------------------------------------------------

export default function AuthGuard() {
  const outlet = useOutlet();
  const { isAuthenticated, user } = useAuthContext();

  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${GHOST_ENTRY_PATH}?${REDIRECT_URL_KEY}=${location.pathname}`}
        replace
      />
    );
  }

  if (user && user.profileCompleted === false && location.pathname !== "/profile-setup") {
    return (
      <Navigate
        to={`/profile-setup?${REDIRECT_URL_KEY}=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (user && user.profileCompleted !== false && location.pathname === "/profile-setup") {
    return <Navigate to="/" replace />;
  }

  return <>{outlet}</>;
}
