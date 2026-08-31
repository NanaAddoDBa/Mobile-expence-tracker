import { UserProfile } from "../../domain/profile/profile.types";
import { INITIAL_PROFILE } from "../../data/mockProfile";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import {
  AuthApi,
  AuthSession,
  GoogleAuthResult,
  MockAuthState,
} from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import { ApiRequestError, requestJson } from "./httpClient";

const AUTH_KEY = "exp_auth";
const ONBOARDED_KEY = "exp_onboarded";
const PROFILE_KEY = "exp_user_profile";

interface AuthUserResponse {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt?: string | null;
}

interface AuthUserPayload {
  data: {
    user: AuthUserResponse;
  };
}

interface GoogleAuthPayload extends AuthUserPayload {
  data: AuthUserPayload["data"] & {
    isNewUser: boolean;
  };
}

interface ProfilePayload {
  data: {
    profile: AuthUserResponse &
      Pick<UserProfile, "settings" | "notifications">;
  };
}

export const authApi: AuthApi = {
  getAuthState(): MockAuthState {
    return {
      isAuthenticated: localStorageAdapter.getItem(AUTH_KEY) === "true",
      isOnboarded: localStorageAdapter.getItem(ONBOARDED_KEY) === "true",
    };
  },

  setAuthState(state) {
    if (state.isAuthenticated !== undefined) {
      localStorageAdapter.setItem(AUTH_KEY, String(state.isAuthenticated));
    }

    if (state.isOnboarded !== undefined) {
      localStorageAdapter.setItem(ONBOARDED_KEY, String(state.isOnboarded));
    }
  },

  getUserProfile() {
    const saved = localStorageAdapter.getItem(PROFILE_KEY);
    if (!saved) return null;

    try {
      return JSON.parse(saved) as UserProfile;
    } catch (e) {
      logger.error("Failed to parse saved mock profile. Falling back to signed-out profile state.", {
        error: createAppError("STORAGE_ERROR", "Could not parse saved mock profile.", e),
        storageKey: PROFILE_KEY,
      });
      localStorageAdapter.removeItem(PROFILE_KEY);
      return null;
    }
  },

  saveUserProfile(profile) {
    localStorageAdapter.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  clearUserProfile() {
    localStorageAdapter.removeItem(PROFILE_KEY);
  },

  async getCurrentUser() {
    if (!USES_HTTP_API) {
      return this.getUserProfile();
    }

    try {
      const response = await requestJson<ProfilePayload>("/profile");
      return toUserProfile(response.data.profile);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        return null;
      }

      throw error;
    }
  },

  async login(email, password, name) {
    if (!USES_HTTP_API) {
      return toUserProfile({
        id: this.getUserProfile()?.id || `usr-${Math.random().toString(36).substring(2, 7)}`,
        email: email.trim(),
        name: name?.trim() || email.trim().split("@")[0],
      });
    }

    const response = await requestJson<AuthUserPayload>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    return (await this.getCurrentUser()) || toUserProfile(response.data.user);
  },

  async signup(email, name, password) {
    if (!USES_HTTP_API) {
      return toUserProfile({
        id: `usr-${Math.random().toString(36).substring(2, 7)}`,
        email: email.trim(),
        name: name.trim(),
      });
    }

    const response = await requestJson<AuthUserPayload>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        name,
        password,
      }),
    });

    return (await this.getCurrentUser()) || toUserProfile(response.data.user);
  },

  async authenticateWithGoogle(credential): Promise<GoogleAuthResult> {
    if (!USES_HTTP_API) {
      const existingProfile = this.getUserProfile();
      return {
        user:
          existingProfile ||
          toUserProfile({
            id: `usr-${Math.random().toString(36).substring(2, 7)}`,
            email: "demo@example.com",
            name: "Demo User",
          }),
        isNewUser: !existingProfile,
      };
    }

    const response = await requestJson<GoogleAuthPayload>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });

    return {
      user: (await this.getCurrentUser()) || toUserProfile(response.data.user),
      isNewUser: response.data.isNewUser,
    };
  },

  async updateProfile(profile) {
    if (!USES_HTTP_API) {
      const current = this.getUserProfile() || INITIAL_PROFILE;
      return {
        ...current,
        ...profile,
        email: profile.email || current.email,
        settings: {
          ...current.settings,
          ...profile.settings,
        },
        notifications: {
          ...current.notifications,
          ...profile.notifications,
        },
      };
    }

    let response: ProfilePayload | undefined;

    if (profile.name !== undefined) {
      response = await requestJson<ProfilePayload>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: profile.name }),
      });
    }

    if (profile.settings !== undefined || profile.notifications !== undefined) {
      response = await requestJson<ProfilePayload>("/profile/settings", {
        method: "PATCH",
        body: JSON.stringify({
          ...(profile.settings || {}),
          ...(profile.notifications === undefined
            ? {}
            : { notifications: profile.notifications }),
        }),
      });
    }

    if (!response) {
      response = await requestJson<ProfilePayload>("/profile");
    }

    return toUserProfile(response.data.profile);
  },

  async exportAccountData() {
    if (!USES_HTTP_API) {
      return {
        exportVersion: 1,
        generatedAt: new Date().toISOString(),
        data: {
          profile: this.getUserProfile(),
        },
      };
    }

    const response = await requestJson<{
      data: Record<string, unknown>;
    }>("/profile/export");
    return response.data;
  },

  async deleteAccount() {
    if (USES_HTTP_API) {
      await requestJson<{ data: { success: true } }>("/profile", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
    }

    this.clearUserProfile();
    this.setAuthState({ isAuthenticated: false, isOnboarded: false });
  },

  async requestPasswordReset(email) {
    if (!USES_HTTP_API) return;

    await requestJson<{ data: { success: true } }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async confirmPasswordReset(token, newPassword) {
    if (!USES_HTTP_API) return;

    await requestJson<{ data: { success: true } }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async requestEmailVerification() {
    if (!USES_HTTP_API) return false;

    const response = await requestJson<{ data: { delivered: boolean } }>(
      "/auth/email-verification/request",
      { method: "POST" }
    );
    return response.data.delivered;
  },

  async confirmEmailVerification(token) {
    if (!USES_HTTP_API) return;

    await requestJson<{ data: { success: true } }>(
      "/auth/email-verification/confirm",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      }
    );
  },

  async listSessions(): Promise<AuthSession[]> {
    if (!USES_HTTP_API) return [];

    const response = await requestJson<{ data: { sessions: AuthSession[] } }>(
      "/auth/sessions"
    );
    return response.data.sessions;
  },

  async revokeSession(sessionId) {
    if (!USES_HTTP_API) return;

    await requestJson<{ data: { success: true } }>(
      `/auth/sessions/${sessionId}`,
      { method: "DELETE" }
    );
  },

  async changePassword(currentPassword, newPassword) {
    if (!USES_HTTP_API) return;

    await requestJson<{ data: { success: true } }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async logoutAll() {
    if (!USES_HTTP_API) return;

    await requestJson<{ data: { success: true } }>("/auth/logout-all", {
      method: "POST",
    });
  },

  async logout() {
    if (USES_HTTP_API) {
      await requestJson<{ data: { success: true } }>("/auth/logout", {
        method: "POST",
      });
    }
  },
};

function toUserProfile(
  user: AuthUserResponse &
    Partial<Pick<UserProfile, "settings" | "notifications">>
): UserProfile {
  return {
    ...INITIAL_PROFILE,
    id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    emailVerifiedAt: user.emailVerifiedAt,
    settings: {
      ...INITIAL_PROFILE.settings,
      ...user.settings,
      accessibility: {
        ...INITIAL_PROFILE.settings.accessibility,
        ...user.settings?.accessibility,
      },
    },
    notifications: {
      ...INITIAL_PROFILE.notifications,
      ...user.notifications,
    },
  };
}
