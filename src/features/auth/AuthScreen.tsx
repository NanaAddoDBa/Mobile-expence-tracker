import React, { useState } from "react";
import { Mail, Lock, User, Wallet } from "lucide-react";
import { Card } from "../../components/ui/Card";

interface AuthScreenProps {
  onLogin: (email: string, name?: string) => boolean;
  onSignup: (email: string, name: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("demo@example.com");
  const [name, setName] = useState("Demo User");
  const [password, setPassword] = useState("••••••••");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    if (isLogin) {
      const ok = onLogin(email, name);
      if (!ok) {
        setErrorMsg("Sign in failed. Please check your details.");
      }
    } else {
      if (!name) {
        setErrorMsg("Please enter your name");
        return;
      }
      onSignup(email, name);
    }
  };

  const handleGoogleMock = () => {
    onLogin("demo@example.com", "Demo User");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Brand Banner */}
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
              {isLogin ? "Welcome back" : "Create profile"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {isLogin ? "Sign in to manage expenses and budgets" : "Create a local profile"}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
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
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    placeholder="E.g., Demo User"
                  />
                </div>
              </div>
            )}

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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  placeholder="E.g., name@domain.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  placeholder="Password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors text-sm"
            >
              {isLogin ? "Sign In" : "Create Profile"}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Or continue with
            </span>
            <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
          </div>

          <button
            onClick={handleGoogleMock}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-sm transition-all"
          >
            {/* Minimalist Google Icon SVG */}
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.64 14.98 1 12 1 7.37 1 3.42 3.65 1.5 7.5l3.87 3a7.002 7.002 0 0 1 6.63-5.46z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.45c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-2 3.72-4.94 3.72-8.56z"
              />
              <path
                fill="#FBBC05"
                d="M5.37 14.5a6.97 6.97 0 0 1 0-5l-3.87-3A11.962 11.962 0 0 0 0 12c0 1.95.47 3.79 1.5 5.5l3.87-3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.84 0-7.08-2.6-8.24-6.1l-3.87 3C3.42 20.35 7.37 23 12 23z"
              />
            </svg>
            Use Demo Profile
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-2 border-t border-slate-50 dark:border-slate-800">
            {isLogin ? "No profile yet? " : "Already have a profile? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isLogin ? "Create account" : "Sign in instead"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};
