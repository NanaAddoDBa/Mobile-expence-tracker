import { UserProfile } from "../../domain/profile/profile.types";
import { INITIAL_PROFILE } from "../../data/mockProfile";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { AuthApi, MockAuthState } from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import { ApiRequestError, requestJson } from "./httpClient";

const AUTH_KEY = "exp_auth";
const ONBOARDED_KEY = "exp_onboarded";
const PROFILE_KEY = "exp_user_profile";

interface AuthUserResponse {
  id: string;
  email: string;
  name: string | null;
}

interface AuthUserPayload {
  data: {
    user: AuthUserResponse;
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
      const response = await requestJson<AuthUserPayload>("/auth/me");
      return toUserProfile(response.data.user);
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

    return toUserProfile(response.data.user);
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

    return toUserProfile(response.data.user);
  },

  async logout() {
    if (USES_HTTP_API) {
      await requestJson<{ data: { success: true } }>("/auth/logout", {
        method: "POST",
      });
    }
  },
};

function toUserProfile(user: AuthUserResponse): UserProfile {
  return {
    ...INITIAL_PROFILE,
    id: user.id,
    email: user.email,
    name: user.name || user.email.split("@")[0],
    settings: {
      ...INITIAL_PROFILE.settings,
    },
    notifications: {
      ...INITIAL_PROFILE.notifications,
    },
  };
}
