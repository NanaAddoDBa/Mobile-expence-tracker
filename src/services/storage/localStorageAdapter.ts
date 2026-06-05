import { StorageAdapter } from "./storage.types";

const getBrowserStorage = (): Storage | null => {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
};

export const localStorageAdapter: StorageAdapter = {
  getItem(key) {
    return getBrowserStorage()?.getItem(key) ?? null;
  },

  setItem(key, value) {
    getBrowserStorage()?.setItem(key, value);
  },

  removeItem(key) {
    getBrowserStorage()?.removeItem(key);
  },
};
