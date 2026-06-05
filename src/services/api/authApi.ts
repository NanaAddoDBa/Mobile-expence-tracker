import { UserProfile } from "../../domain/profile/profile.types";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { AuthApi, MockAuthState } from "./api.types";

const AUTH_KEY = "exp_auth";
const ONBOARDED_KEY = "exp_onboarded";
const PROFILE_KEY = "exp_user_profile";

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
};
