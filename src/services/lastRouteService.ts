/**
 * Persists the last active route so the user can be returned to it after
 * unlocking the app (e.g. after the phone was turned off / app was locked).
 *
 * Screens that should NOT be restored (auth screens, transient screens) are
 * excluded via the EXCLUDED_ROUTES list.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import APP_CONFIG from "../config/appConfig";

export interface PersistedRoute {
  name: string;
  params?: Record<string, unknown>;
}

/** Routes that must never be restored after login */
const EXCLUDED_ROUTES = new Set([
  "Login",
  "Signup",
  "ForgotPassword",
  "Settings",
  "Export",
  "Import",
]);

const KEY = APP_CONFIG.STORAGE_KEYS.LAST_ACTIVE_ROUTE;

/**
 * In-memory cache of the route to restore after login.
 * Populated by `primeBeforeLogin()` synchronously during the login flow,
 * before `isAuthenticated` flips to true and navigation state changes start
 * firing — eliminating the AsyncStorage race condition.
 */
let _pendingRoute: PersistedRoute | null = null;

export const lastRouteService = {
  /**
   * Call this inside handleLogin, BEFORE dispatching setAuthenticated(true).
   * Reads the persisted route into memory so `consumePending()` returns it
   * instantly and deterministically when MainStack mounts.
   */
  async primeBeforeLogin(): Promise<void> {
    _pendingRoute = await lastRouteService.load();
  },

  /**
   * Returns and clears the in-memory pending route (one-shot).
   * Must be called from MainStack's useEffect after login.
   */
  consumePending(): PersistedRoute | null {
    const route = _pendingRoute;
    _pendingRoute = null;
    return route;
  },

  async save(route: PersistedRoute): Promise<void> {
    if (EXCLUDED_ROUTES.has(route.name)) return;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(route));
    } catch {
      // non-critical – silently ignore
    }
  },

  async load(): Promise<PersistedRoute | null> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedRoute;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // non-critical – silently ignore
    }
  },
};
