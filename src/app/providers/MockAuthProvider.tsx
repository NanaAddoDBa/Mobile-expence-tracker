import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../../domain/profile/profile.types";
import { INITIAL_PROFILE } from "../../data/mockProfile";
import { authApi } from "../../services/api";

export interface MockAuthContextType {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  currentUser: UserProfile | null;
  completeOnboarding: () => void;
  login: (email: string, name?: string) => boolean;
  signup: (email: string, name: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
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

  const completeOnboarding = () => {
    setIsOnboarded(true);
  };

  const login = (email: string, name?: string): boolean => {
    if (!email) return false;
    const formattedEmail = email.trim();
    const cleanName = name?.trim() || formattedEmail.split("@")[0];

    setCurrentUser((prev) => {
      const updated = {
        ...(prev || INITIAL_PROFILE),
        email: formattedEmail,
        name: cleanName,
      } as UserProfile;
      return updated;
    });

    setIsAuthenticated(true);
    return true;
  };

  const signup = (email: string, name: string) => {
    const freshUser: UserProfile = {
      id: `usr-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim(),
      settings: {
        theme: "light",
        currency: "EUR",
        language: "en-IE",
        accessibility: {
          largerText: false,
          reduceMotion: false,
          highContrast: false,
          comfortableLayout: false,
        },
      },
      notifications: {
        enableAlerts: true,
        budgetThreshold: 80,
        recurringReminders: true,
        weeklySummaries: false,
      },
    };
    setCurrentUser(freshUser);
    setIsAuthenticated(true);
    setIsOnboarded(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateProfile = (profileData: Partial<UserProfile>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...profileData,
        settings: {
          ...prev.settings,
          ...profileData.settings,
        },
        notifications: {
          ...prev.notifications,
          ...profileData.notifications,
        },
      } as UserProfile;
    });
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
        logout,
        updateProfile,
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
