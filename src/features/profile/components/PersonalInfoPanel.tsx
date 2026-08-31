import React from "react";
import { CheckCircle, LogOut } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { UserProfile } from "../../../domain/profile/profile.types";

interface PersonalInfoPanelProps {
  currentUser: UserProfile | null;
  name: string;
  email: string;
  savingProfileSuccess: boolean;
  isServerBacked: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onProfileSave: (event: React.FormEvent) => void;
  onLogout: () => void;
}

export const PersonalInfoPanel: React.FC<PersonalInfoPanelProps> = ({
  currentUser,
  name,
  email,
  savingProfileSuccess,
  isServerBacked,
  onNameChange,
  onEmailChange,
  onProfileSave,
  onLogout,
}) => {
  const displayName = currentUser?.name || "Demo User";
  const displayEmail = currentUser?.email || "demo@example.com";
  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((part) => part[0]).join("").toUpperCase()
    : "DU";

  return (
    <Card className="p-6 h-fit">
      <div className="flex flex-col items-center text-center pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-xl flex items-center justify-center uppercase border border-indigo-100 dark:border-indigo-900/30">
          {initials}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 leading-tight">
          {displayName}
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-none">
          {displayEmail}
        </p>
        <div className="mt-3 flex gap-1.5 items-center justify-center">
          <Badge tone="success">Active</Badge>
          <Badge tone="neutral">{isServerBacked ? "Server Data" : "Mock Data"}</Badge>
        </div>
      </div>

      <form onSubmit={onProfileSave} className="space-y-4 py-4 leading-relaxed">
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
            Preferred Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            disabled={isServerBacked}
            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
            required
          />
          {isServerBacked && (
            <p className="mt-1 text-[10px] text-slate-400">
              Email changes require a separate verified account flow.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 text-xs font-semibold rounded-xl tracking-wide transition-colors cursor-pointer"
        >
          Save Profile
        </button>
      </form>

      {savingProfileSuccess && (
        <p className="text-[10px] text-emerald-500 font-bold text-center mt-1 flex items-center justify-center gap-1.5 leading-none">
          <CheckCircle className="w-3.5 h-3.5" /> Profile updated.
        </p>
      )}

      <button
        onClick={onLogout}
        className="w-full mt-2.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 text-xs font-semibold rounded-xl border border-rose-100 dark:border-rose-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" /> Sign Out
      </button>
    </Card>
  );
};
