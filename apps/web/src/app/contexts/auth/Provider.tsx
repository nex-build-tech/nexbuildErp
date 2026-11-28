// Import Dependencies
import { useEffect, useReducer, ReactNode } from "react";

// Local Imports
import axios from "@/utils/axios";
import { isTokenValid, setSession } from "@/utils/jwt";
import { AuthProvider as AuthContext, AuthContextType } from "./context";
import { User } from "@/@types/user";
import { applyThemePalette } from "@/utils/themePalette";

// ----------------------------------------------------------------------

interface AuthAction {
  type:
    | "INITIALIZE"
    | "LOGIN_REQUEST"
    | "LOGIN_SUCCESS"
    | "LOGIN_ERROR"
    | "UPDATE_USER"
    | "LOGOUT";
  payload?: Partial<AuthContextType>;
}

// Initial state
const initialState: AuthContextType = {
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  errorMessage: null,
  user: null,
  tenant: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => null,
};

// Reducer handlers
const reducerHandlers: Record<
  AuthAction["type"],
  (state: AuthContextType, action: AuthAction) => AuthContextType
> = {
  INITIALIZE: (state, action) => ({
    ...state,
    isAuthenticated: action.payload?.isAuthenticated ?? false,
    isInitialized: true,
    user: action.payload?.user ?? null,
    tenant: action.payload?.tenant ?? null,
  }),

  LOGIN_REQUEST: (state) => ({
    ...state,
    isLoading: true,
    errorMessage: null,
  }),

  LOGIN_SUCCESS: (state, action) => ({
    ...state,
    isAuthenticated: true,
    isLoading: false,
    errorMessage: null,
    user: action.payload?.user ?? null,
    tenant: action.payload?.tenant ?? null,
  }),

  LOGIN_ERROR: (state, action) => ({
    ...state,
    errorMessage: action.payload?.errorMessage ?? "An error occurred",
    isLoading: false,
  }),

  UPDATE_USER: (state, action) => ({
    ...state,
    user: action.payload?.user ?? state.user,
    tenant: action.payload?.tenant ?? state.tenant,
  }),

  LOGOUT: (state) => ({
    ...state,
    isAuthenticated: false,
    user: null,
    tenant: null,
  }),
};

// Reducer function
const reducer = (
  state: AuthContextType,
  action: AuthAction,
): AuthContextType => {
  const handler = reducerHandlers[action.type];
  return handler ? handler(state, action) : state;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const init = async () => {
      try {
        const authToken = window.localStorage.getItem("authToken");

        if (authToken && isTokenValid(authToken)) {
          setSession(authToken);

          const response = await axios.get("/auth/me");
          const resData = response.data?.data || response.data;
          const user = resData?.user as User;
          const tenant = resData?.tenant;

          if (user) {
            user.name = user.fullName || user.username;
          }

          if (tenant?.primaryColor) {
            applyThemePalette(tenant.primaryColor);
          }

          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: true,
              user,
              tenant,
            },
          });
        } else {
          dispatch({
            type: "INITIALIZE",
            payload: {
              isAuthenticated: false,
              user: null,
              tenant: null,
            },
          });
        }
      } catch (err) {
        console.error(err);
        setSession(null);
        dispatch({
          type: "INITIALIZE",
          payload: {
            isAuthenticated: false,
            user: null,
            tenant: null,
          },
        });
      }
    };

    init();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    dispatch({ type: "LOGIN_REQUEST" });

    try {
      const response = await axios.post("/auth/login", credentials);
      const data = response.data?.data || response.data;
      const authToken = data?.accessToken || data?.authToken;
      const user = data?.user as User;
      const tenant = data?.tenant;

      if (!authToken || !user) {
        throw new Error("Invalid response from server");
      }

      user.name = user.fullName || user.username;
      setSession(authToken);

      if (tenant?.primaryColor) {
        applyThemePalette(tenant.primaryColor);
      }

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, tenant },
      });
    } catch (err) {
      dispatch({
        type: "LOGIN_ERROR",
        payload: {
          errorMessage: err instanceof Error ? err.message : "Login failed",
        },
      });
    }
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      setSession(null);
      dispatch({ type: "LOGOUT" });
      window.location.href = "/login";
    }
  };

  const refreshUser = async (): Promise<User | null> => {
    const response = await axios.get("/auth/me");
    const resData = response.data?.data || response.data;
    const user = resData?.user as User;
    const tenant = resData?.tenant;

    if (user) {
      user.name = user.fullName || user.username;
      dispatch({
        type: "UPDATE_USER",
        payload: { user, tenant },
      });
      return user;
    }

    return null;
  };

  if (!children) {
    return null;
  }

  return (
    <AuthContext
      value={{
        ...state,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext>
  );
}
