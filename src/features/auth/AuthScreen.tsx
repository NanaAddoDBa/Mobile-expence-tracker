import React, { useState } from "react";
import { Lock, Mail, User, Wallet } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { GOOGLE_CLIENT_ID } from "../../services/api/apiMode";
import { authApi } from "../../services/api";
import { GoogleSignInButton } from "./GoogleSignInButton";

type AuthMode = "login" | "signup" | "forgot" | "reset";

interface AuthScreenProps {
  onLogin: (email: string, password: string, name?: string) => Promise<boolean>;
  onSignup: (
    email: string,
    name: string,
    password: string
  ) => Promise<boolean>;
  onGoogleLogin: (credential: string) => Promise<boolean>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onSignup,
  onGoogleLogin,
}) => {
  const [resetToken] = useState(
    () =>
      new URLSearchParams(window.location.search).get("passwordResetToken") || ""
  );
  const [mode, setMode] = useState<AuthMode>(resetToken ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (mode === "forgot") {
      if (!email) {
        setErrorMsg("Please enter a valid email address");
        return;
      }

      setIsSubmitting(true);
      try {
        await authApi.requestPasswordReset(email);
        setSuccessMsg(
          "If a password account exists for that address, a reset link has been sent."
        );
      } catch {
        setErrorMsg("Could not request a password reset. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === "reset") {
      if (password.length < 8) {
        setErrorMsg("Password must be at least 8 characters.");
        return;
      }
      if (password !== passwordConfirmation) {
        setErrorMsg("The passwords do not match.");
        return;
      }

      setIsSubmitting(true);
      try {
        await authApi.confirmPasswordReset(resetToken, password);
        const url = new URL(window.location.href);
        url.searchParams.delete("passwordResetToken");
        window.history.replaceState({}, "", url);
        setPassword("");
        setPasswordConfirmation("");
        setMode("login");
        setSuccessMsg("Password updated. You can sign in now.");
      } catch {
        setErrorMsg("This password reset link is invalid or has expired.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!email) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    if (mode === "login") {
      const ok = await onLogin(email, password, name);
      if (!ok) {
        setErrorMsg("Sign in failed. Please check your details.");
      }
    } else {
      if (!name) {
        setErrorMsg("Please enter your name");
        setIsSubmitting(false);
        return;
      }

      const ok = await onSignup(email, name, password);
      if (!ok) {
        setErrorMsg("Could not create your account. Please try again.");
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Expense Tracker
          </span>
        </div>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {mode === "login"
                ? "Welcome back"
                : mode === "signup"
                  ? "Create profile"
                  : mode === "forgot"
                    ? "Reset password"
                    : "Choose a new password"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {mode === "login"
                ? "Sign in to manage expenses and budgets"
                : mode === "signup"
                  ? "Create your expense tracker profile"
                  : mode === "forgot"
                    ? "We will email a short-lived recovery link"
                    : "This recovery link can only be used once"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 text-xs rounded-xl">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    placeholder="E.g., Demo User"
                  />
                </div>
              </div>
            )}

            {mode !== "reset" && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  placeholder="E.g., name@domain.com"
                />
              </div>
            </div>
            )}

            {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  placeholder="Password"
                />
              </div>
            </div>
            )}

            {mode === "reset" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={passwordConfirmation}
                    onChange={(event) =>
                      setPasswordConfirmation(event.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors text-sm"
            >
              {isSubmitting
                ? "Working..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Profile"
                    : mode === "forgot"
                      ? "Send Reset Link"
                      : "Update Password"}
            </button>
          </form>

          {GOOGLE_CLIENT_ID && (mode === "login" || mode === "signup") && (
            <>
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
              </div>

              <GoogleSignInButton
                clientId={GOOGLE_CLIENT_ID}
                text={mode === "login" ? "signin_with" : "signup_with"}
                onCredential={onGoogleLogin}
                onFailure={() => {
                  setErrorMsg(
                    "Google sign-in failed. Please try again or use email and password."
                  );
                }}
              />
            </>
          )}

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-2 border-t border-slate-50 dark:border-slate-800">
            {mode === "login"
              ? "No profile yet? "
              : mode === "signup"
                ? "Already have a profile? "
                : "Ready to sign in? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {mode === "login" ? "Create account" : "Sign in instead"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};
