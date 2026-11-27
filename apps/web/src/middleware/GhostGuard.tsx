// Import Dependencies
import { Navigate, useOutlet } from "react-router";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { HOME_PATH, REDIRECT_URL_KEY } from "@/constants/app";

// ----------------------------------------------------------------------

export default function GhostGuard() {
  const outlet = useOutlet();
  const { isAuthenticated } = useAuthContext();

  const redirectParam = new URLSearchParams(window.location.search).get(
    REDIRECT_URL_KEY,
  );

  if (isAuthenticated) {
    if (
      redirectParam &&
      redirectParam !== "null" &&
      redirectParam !== "undefined" &&
      redirectParam.trim() !== ""
    ) {
      return <Navigate to={redirectParam} replace />;
    }
    return <Navigate to={HOME_PATH} replace />;
  }

  return <>{outlet}</>;
}
