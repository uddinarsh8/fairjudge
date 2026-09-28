"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { apiRequest } from "@/lib/api";

// =====================================================
// USER ROLE
// =====================================================

export type UserRole =
  | "ORGANIZER"
  | "JUDGE"
  | "TEAM"
  | "MEMBER";

// =====================================================
// USER
// =====================================================

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

// =====================================================
// LOGIN RESPONSE
// =====================================================

type LoginResponse = {
  success: boolean;
  message?: string;
  token?: string;

  user?: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
};

// =====================================================
// REGISTER ROLE
// =====================================================

type RegisterRole =
  | "TEAM"
  | "MEMBER"
  | "JUDGE"
  | "ORGANIZER";

// =====================================================
// AUTH CONTEXT
// =====================================================

type AuthContextType = {
  user: User | null;
  token: string | null;

  /**
   * true while localStorage authentication
   * is being restored.
   */
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<User>;

  register: (
    name: string,
    email: string,
    password: string,
    role: RegisterRole
  ) => Promise<void>;

  logout: () => void;
};

// =====================================================
// CREATE CONTEXT
// =====================================================

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

// =====================================================
// STORAGE KEYS
// =====================================================

export const TOKEN_KEY = "fairjudge_token";
export const USER_KEY = "fairjudge_user";

// =====================================================
// NORMALIZE ROLE
// =====================================================

const normalizeRole = (
  role: unknown
): UserRole => {
  const normalized = String(role || "")
    .trim()
    .toUpperCase();

  switch (normalized) {
    case "ORGANIZER":
      return "ORGANIZER";

    case "JUDGE":
      return "JUDGE";

    case "TEAM":
      return "TEAM";

    case "MEMBER":
      return "MEMBER";

    default:
      throw new Error(
        `Invalid user role: ${role}`
      );
  }
};

// =====================================================
// NORMALIZE USER
// =====================================================

const normalizeUser = (
  rawUser: {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  }
): User => {
  const userId =
    rawUser.id || rawUser._id;

  if (!userId) {
    throw new Error(
      "User ID is missing."
    );
  }

  if (!rawUser.name) {
    throw new Error(
      "User name is missing."
    );
  }

  if (!rawUser.email) {
    throw new Error(
      "User email is missing."
    );
  }

  if (!rawUser.role) {
    throw new Error(
      "User role is missing."
    );
  }

  return {
    id: String(userId),

    name: String(
      rawUser.name
    ).trim(),

    email: String(
      rawUser.email
    )
      .trim()
      .toLowerCase(),

    role: normalizeRole(
      rawUser.role
    ),
  };
};

// =====================================================
// AUTH PROVIDER
// =====================================================

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  /**
   * IMPORTANT:
   *
   * loading starts as TRUE.
   *
   * This prevents protected pages from
   * redirecting to /login before localStorage
   * authentication has been restored.
   */
  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // RESTORE AUTHENTICATION
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const restoreAuthentication = () => {
      try {
        // -----------------------------------------------
        // READ TOKEN
        // -----------------------------------------------

        const storedToken =
          localStorage.getItem(
            TOKEN_KEY
          );

        // -----------------------------------------------
        // READ USER
        // -----------------------------------------------

        const storedUser =
          localStorage.getItem(
            USER_KEY
          );

        console.log(
          "Auth restore:",
          {
            hasToken: Boolean(
              storedToken
            ),
            hasUser: Boolean(
              storedUser
            ),
          }
        );

        // -----------------------------------------------
        // NOTHING STORED
        // -----------------------------------------------

        if (
          !storedToken ||
          !storedUser
        ) {
          if (!mounted) return;

          setToken(null);
          setUser(null);

          return;
        }

        // -----------------------------------------------
        // PARSE USER
        // -----------------------------------------------

        let parsedUser: unknown;

        try {
          parsedUser =
            JSON.parse(storedUser);
        } catch {
          console.error(
            "Stored user JSON is invalid."
          );

          localStorage.removeItem(
            TOKEN_KEY
          );

          localStorage.removeItem(
            USER_KEY
          );

          if (!mounted) return;

          setToken(null);
          setUser(null);

          return;
        }

        // -----------------------------------------------
        // VALIDATE OBJECT
        // -----------------------------------------------

        if (
          !parsedUser ||
          typeof parsedUser !==
            "object"
        ) {
          console.error(
            "Stored user is invalid."
          );

          localStorage.removeItem(
            TOKEN_KEY
          );

          localStorage.removeItem(
            USER_KEY
          );

          if (!mounted) return;

          setToken(null);
          setUser(null);

          return;
        }

        // -----------------------------------------------
        // NORMALIZE USER
        // -----------------------------------------------

        const restoredUser =
          normalizeUser(
            parsedUser as {
              id?: string;
              _id?: string;
              name?: string;
              email?: string;
              role?: string;
            }
          );

        // -----------------------------------------------
        // RESTORE STATE
        // -----------------------------------------------

        if (!mounted) return;

        setToken(storedToken);
        setUser(restoredUser);

        console.log(
          "Authentication restored successfully:",
          restoredUser
        );
      } catch (error) {
        console.error(
          "Failed to restore authentication:",
          error
        );

        localStorage.removeItem(
          TOKEN_KEY
        );

        localStorage.removeItem(
          USER_KEY
        );

        if (!mounted) return;

        setToken(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    restoreAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  // ===================================================
  // LOGIN
  // ===================================================

  const login = async (
    email: string,
    password: string
  ): Promise<User> => {
    const cleanEmail =
      email.trim().toLowerCase();

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!cleanEmail) {
      throw new Error(
        "Email is required."
      );
    }

    if (!password) {
      throw new Error(
        "Password is required."
      );
    }

    // -----------------------------------------------
    // API REQUEST
    // -----------------------------------------------

    const response =
      (await apiRequest(
        "/auth/login",
        {
          method: "POST",

          body: {
            email: cleanEmail,
            password,
          },
        }
      )) as LoginResponse;

    // -----------------------------------------------
    // VALIDATE RESPONSE
    // -----------------------------------------------

    if (
      !response ||
      !response.token ||
      !response.user
    ) {
      throw new Error(
        response?.message ||
          "Invalid login response from server."
      );
    }

    // -----------------------------------------------
    // NORMALIZE USER
    // -----------------------------------------------

    const normalizedUser =
      normalizeUser(
        response.user
      );

    // -----------------------------------------------
    // SAVE TOKEN
    // -----------------------------------------------

    localStorage.setItem(
      TOKEN_KEY,
      response.token
    );

    // -----------------------------------------------
    // SAVE USER
    // -----------------------------------------------

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(
        normalizedUser
      )
    );

    // -----------------------------------------------
    // UPDATE STATE IMMEDIATELY
    // -----------------------------------------------

    setToken(response.token);
    setUser(normalizedUser);

    console.log(
      "Login successful:",
      normalizedUser
    );

    return normalizedUser;
  };

  // ===================================================
  // REGISTER
  // ===================================================

  const register = async (
    name: string,
    email: string,
    password: string,
    role: RegisterRole
  ): Promise<void> => {
    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!cleanName) {
      throw new Error(
        "Name is required."
      );
    }

    if (!cleanEmail) {
      throw new Error(
        "Email is required."
      );
    }

    if (!password) {
      throw new Error(
        "Password is required."
      );
    }

    // -----------------------------------------------
    // VALIDATE ROLE
    // -----------------------------------------------

    const allowedRoles: RegisterRole[] =
      [
        "TEAM",
        "MEMBER",
        "JUDGE",
        "ORGANIZER",
      ];

    if (
      !allowedRoles.includes(
        role
      )
    ) {
      throw new Error(
        `Invalid registration role: ${role}`
      );
    }

    // -----------------------------------------------
    // API REQUEST
    // -----------------------------------------------

    await apiRequest(
      "/auth/register",
      {
        method: "POST",

        body: {
          name: cleanName,
          email: cleanEmail,
          password,
          role,
        },
      }
    );
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {
    // -----------------------------------------------
    // REMOVE STORAGE
    // -----------------------------------------------

    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    // -----------------------------------------------
    // CLEAR STATE
    // -----------------------------------------------

    setToken(null);
    setUser(null);

    console.log(
      "User logged out successfully."
    );
  };

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// USE AUTH
// =====================================================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}