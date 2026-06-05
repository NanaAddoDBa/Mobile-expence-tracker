import React from "react";

export const ProfileFooterNote: React.FC = () => {
  return (
    <div className="text-center bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/80 rounded-2xl p-5 mt-6 text-[10px] text-slate-400 leading-normal max-w-4xl mx-auto">
      <h5 className="font-semibold uppercase tracking-wider mb-2 text-slate-500">Important Notes</h5>
      This app is for mock expense tracking and budget planning only. It does not move money, process payments, provide advice, or show real account balances.
    </div>
  );
};
