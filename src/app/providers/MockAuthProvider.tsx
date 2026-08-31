import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../../domain/profile/profile.types";
import { authApi } from "../../services/api";
import { USES_HTTP_API } from "../../services/api/apiMode";

export interface MockAuthContextType {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  currentUser: UserProfile | null;
  completeOnboarding: () => void;
  login: (email: string, password: string, name?: string) => Promise<boolean>;
  signup: (email: string, name: string, password: string) => Promise<boolean>;
  authenticateWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialAuthState = authApi.getAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return initialAuthState.isAuthenticated;
  });
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return initialAuthState.isOnboarded;
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authApi.getUserProfile());

  useEffect(() => {
    authApi.setAuthState({ isAuthenticated });
  }, [isAuthenticated]);

  useEffect(() => {
    authApi.setAuthState({ isOnboarded });
  }, [isOnboarded]);

  useEffect(() => {
    if (currentUser) {
      authApi.saveUserProfile(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!USES_HTTP_API) {
      return;
    }

    let isMounted = true;

    void authApi
      .getCurrentUser()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!USES_HTTP_API || typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const token = url.searchParams.get("emailVerificationToken");
    if (!token) return;

    void authApi
      .confirmEmailVerification(token)
      .then(() => authApi.getCurrentUser())
      .then((user) => {
        if (user) setCurrentUser(user);
      })
      .finally(() => {
        url.searchParams.delete("emailVerificationToken");
        window.history.replaceState({}, "", url);
      });
  }, []);

  const completeOnboarding = () => {
    setIsOnboarded(true);
  };

  const login = async (
    email: string,
    password: string,
    name?: string
  ): Promise<boolean> => {
    if (!email || !password) return false;

    try {
      const user = await authApi.login(email, password, name);

      if (!user) {
        return false;
      }

      setCurrentUser(user);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (
    email: string,
    name: string,
    password: string
  ): Promise<boolean> => {
    if (!email || !name || !password) return false;

    try {
      const freshUser = await authApi.signup(email, name, password);
      setCurrentUser(freshUser);
      setIsAuthenticated(true);
      setIsOnboarded(false);
      return true;
    } catch {
      return false;
    }
  };

  const authenticateWithGoogle = async (
    credential: string
  ): Promise<boolean> => {
    if (!credential) return false;

    try {
      const result = await authApi.authenticateWithGoogle(credential);
      setCurrentUser(result.user);
      setIsAuthenticated(true);

      if (result.isNewUser) {
        setIsOnboarded(false);
      }

      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local sign-out should still continue if the network call fails.
    }

    setIsAuthenticated(false);
    if (USES_HTTP_API) {
      setCurrentUser(null);
      authApi.clearUserProfile();
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    const updatedProfile = await authApi.updateProfile(profileData);
    setCurrentUser(updatedProfile);
  };

  const deleteAccount = async () => {
    await authApi.deleteAccount();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsOnboarded(false);
  };

  return (
    <MockAuthContext.Provider
      value={{
        isAuthenticated,
        isOnboarded,
        currentUser,
        completeOnboarding,
        login,
        signup,
        authenticateWithGoogle,
        logout,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
};
