import { StorageAdapter } from "./storage.types";

export function createMemoryStorageAdapter(initialValues: Record<string, string> = {}): StorageAdapter {
  const store = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return store.get(key) ?? null;
    },

    setItem(key, value) {
      store.set(key, value);
    },

    removeItem(key) {
      store.delete(key);
    },
  };
}
