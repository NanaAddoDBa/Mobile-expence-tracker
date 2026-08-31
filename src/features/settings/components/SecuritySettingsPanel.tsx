import React, { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  LogOut,
  MailCheck,
  MailWarning,
  MonitorCheck,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { authApi, type AuthSession } from "../../../services/api";
import { USES_HTTP_API } from "../../../services/api/apiMode";

interface SecuritySettingsPanelProps {
  emailVerifiedAt?: string | null;
  onLogout: () => Promise<void>;
}

export const SecuritySettingsPanel: React.FC<
  SecuritySettingsPanelProps
> = ({ emailVerifiedAt, onLogout }) => {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!USES_HTTP_API) return;
    setLoading(true);
    try {
      setSessions(await authApi.listSessions());
    } catch {
      setStatus("Could not load active sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("");
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setStatus("Password updated. Other sessions were signed out.");
      await loadSessions();
    } catch {
      setStatus(
        "Password could not be changed. Check your current password and account sign-in method."
      );
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((current) =>
        current.filter((session) => session.id !== sessionId)
      );
      setStatus("Session signed out.");
    } catch {
      setStatus("That session could not be signed out.");
    }
  };

  const logoutEverywhere = async () => {
    try {
      await authApi.logoutAll();
      await onLogout();
    } catch {
      setStatus("Could not sign out all sessions.");
    }
  };

  const requestEmailVerification = async () => {
    setStatus("");
    try {
      const delivered = await authApi.requestEmailVerification();
      setStatus(
        delivered
          ? "Verification email sent."
          : "Your email is already verified, or email delivery is unavailable."
      );
    } catch {
      setStatus("Could not send a verification email.");
    }
  };

  if (!USES_HTTP_API) {
    return (
      <section className="space-y-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
            Security
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Account security controls are available when the server API is enabled.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
          Security
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          Manage your password and authenticated browser sessions.
        </p>
      </div>

      {status && (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {status}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-3">
          {emailVerifiedAt ? (
            <MailCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <MailWarning className="h-4 w-4 shrink-0 text-amber-500" />
          )}
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
              Email address
            </h5>
            <p className="mt-1 text-[11px] text-slate-400">
              {emailVerifiedAt
                ? `Verified ${new Date(emailVerifiedAt).toLocaleDateString()}`
                : "Verification is required for account recovery."}
            </p>
          </div>
        </div>
        {emailVerifiedAt ? (
          <Badge tone="success">Verified</Badge>
        ) : (
          <button
            type="button"
            onClick={() => void requestEmailVerification()}
            className="shrink-0 rounded-md border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20"
          >
            Send verification
          </button>
        )}
      </div>

      <form onSubmit={changePassword} className="space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-600" />
          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
            Change password
          </h5>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
        >
          <KeyRound className="h-3.5 w-3.5" /> Change password
        </button>
      </form>

      <div className="space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MonitorCheck className="h-4 w-4 text-sky-600" />
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
              Active sessions
            </h5>
          </div>
          <button
            type="button"
            onClick={() => void loadSessions()}
            title="Refresh sessions"
            aria-label="Refresh sessions"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-800 dark:border-slate-800">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex min-h-16 items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {session.userAgent || "Unknown browser"}
                  </p>
                  {session.current && <Badge tone="success">Current</Badge>}
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  {session.ipAddress || "IP unavailable"} | Signed in {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              {!session.current && (
                <button
                  type="button"
                  onClick={() => void revokeSession(session.id)}
                  title="Sign out session"
                  aria-label="Sign out session"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {!loading && sessions.length === 0 && (
            <p className="py-4 text-xs text-slate-400">No active sessions found.</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void logoutEverywhere()}
          className="inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/20"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out everywhere
        </button>
      </div>

      <div className="flex gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <div className="flex items-center gap-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
              Two-factor authentication
            </h5>
            <Badge tone="warning">Unavailable</Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Use Google sign-in for provider-managed account protection until app-level two-factor authentication is added.
          </p>
        </div>
      </div>
    </section>
  );
};
