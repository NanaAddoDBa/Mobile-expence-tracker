import React from "react";
import { CircleDollarSign, Database, Link2, PlusCircle, ScanLine, ShieldCheck, Sliders } from "lucide-react";
import { ActiveView } from "../../../app/providers/AppNavigationProvider";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";

interface DashboardSetupEmptyStateProps {
  onNavigate: (view: ActiveView) => void;
  onOpenConnectedAccounts: () => void;
  onLoadSampleData: () => void;
}

const actions: {
  label: string;
  description: string;
  targetView: ActiveView;
  icon: React.ReactNode;
}[] = [
  {
    label: "Add first expense",
    description: "Record a simple expense manually.",
    targetView: "expenses",
    icon: <PlusCircle className="w-5 h-5" />,
  },
  {
    label: "Add first income",
    description: "Record salary or another inflow.",
    targetView: "income",
    icon: <CircleDollarSign className="w-5 h-5" />,
  },
  {
    label: "Connect bank account",
    description: "Connect a bank to import transactions.",
    targetView: "profile",
    icon: <Link2 className="w-5 h-5" />,
  },
  {
    label: "Scan receipt",
    description: "Upload or simulate a receipt and review the details.",
    targetView: "receipts",
    icon: <ScanLine className="w-5 h-5" />,
  },
  {
    label: "Create budget",
    description: "Set daily, weekly, monthly, or annual category budgets.",
    targetView: "budgets",
    icon: <Sliders className="w-5 h-5" />,
  },
];

export const DashboardSetupEmptyState: React.FC<DashboardSetupEmptyStateProps> = ({
  onNavigate,
  onOpenConnectedAccounts,
  onLoadSampleData,
}) => {
  const setupActions = [
    ...actions.map((action) => ({
      label: action.label,
      description: action.description,
      icon: action.icon,
      onSelect: action.targetView === "profile"
        ? onOpenConnectedAccounts
        : () => onNavigate(action.targetView),
    })),
    {
      label: "Load sample data",
      description: "Add demo income, expenses, budgets, and goals to explore the app.",
      icon: <Database className="w-5 h-5" />,
      onSelect: onLoadSampleData,
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <Card className="md:col-span-12 border border-slate-100 dark:border-slate-800 shadow-xs p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
              Set up your money tracker
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Start clean, add your own data, or load sample data to explore the app.
            </p>
            <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              Bank access is read-only. The app tracks transactions but cannot move money or make payments.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-2xl">
            {setupActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onSelect}
                className="group flex min-h-24 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
              >
                <span className="mt-0.5 rounded-lg bg-white p-2 text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400">
                  {action.icon}
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    {action.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {action.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button variant="ghost" onClick={() => onNavigate("dashboard")}>
            Stay on overview
          </Button>
        </div>
      </Card>
    </section>
  );
};
