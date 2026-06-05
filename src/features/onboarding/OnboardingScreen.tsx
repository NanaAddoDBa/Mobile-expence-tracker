import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  HelpCircle,
  Link2,
  PlusCircle,
  Receipt,
  ScanLine,
  ShieldCheck,
  Sliders,
  TrendingUp,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export type OnboardingFirstAction =
  | "add-expense"
  | "connect-account"
  | "scan-receipt"
  | "create-budget"
  | "load-sample-data"
  | "skip";

interface OnboardingScreenProps {
  onComplete: (action: OnboardingFirstAction) => void;
  userName: string;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, userName }) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Keep Spending Organized",
      description: "Track everyday expenses and see where your money is going.",
      icon: <TrendingUp className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />,
      bullets: [
        "Create budgets for the categories you care about",
        "Track food, transport, shopping, and other expenses",
        "Use mock data only",
      ],
    },
    {
      id: 2,
      title: "Mock Connected Accounts",
      description: "Connected accounts import sample expenses only.",
      icon: <ShieldCheck className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />,
      bullets: [
        "No real account connection",
        "No money movement",
        "No real account credentials required",
      ],
    },
    {
      id: 3,
      title: "Simple Planning Only",
      description: "This tracker helps you organize spending. It is not financial advice.",
      icon: <HelpCircle className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />,
      bullets: [
        "Shows simple budget reminders",
        "Does not provide investment, tax, or legal advice",
        "Keeps all demo data inside the app",
      ],
    },
  ];

  const firstActions: {
    id: OnboardingFirstAction;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "add-expense",
      title: "Add first expense",
      description: "Record a simple expense manually.",
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      id: "connect-account",
      title: "Connect mock account",
      description: "Use a read-only mock connection to import sample expenses.",
      icon: <Link2 className="w-5 h-5" />,
    },
    {
      id: "scan-receipt",
      title: "Scan receipt",
      description: "Upload or simulate a receipt and review the extracted details.",
      icon: <ScanLine className="w-5 h-5" />,
    },
    {
      id: "create-budget",
      title: "Create budget",
      description: "Set a monthly category budget and track spending.",
      icon: <Sliders className="w-5 h-5" />,
    },
    {
      id: "load-sample-data",
      title: "Load sample data",
      description: "Explore the app with realistic demo expenses, budgets, and goals.",
      icon: <Database className="w-5 h-5" />,
    },
  ];

  const actionStep = steps.length + 1;
  const isActionStep = step === actionStep;
  const current = steps[step - 1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className={`w-full ${isActionStep ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex gap-2 mb-6 px-1">
          {Array.from({ length: actionStep }, (_, index) => {
            const progressStep = index + 1;

            return (
              <div
                key={progressStep}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  progressStep <= step
                    ? "bg-indigo-600 dark:bg-indigo-500"
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              />
            );
          })}
        </div>

        <Card className="border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden p-8">
          <div className="flex flex-col items-center text-center">
            {isActionStep ? (
              <>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl mb-6">
                  <Receipt className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Choose your first step
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                  Start manually, scan a receipt, connect a read-only mock account, or load sample data to explore the app.
                </p>

                <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-left">
                  {firstActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => onComplete(action.id)}
                      className="group flex min-h-24 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                    >
                      <span className="mt-0.5 rounded-lg bg-white p-2 text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400">
                        {action.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          {action.title}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {action.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <p className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  This app uses mock data and mock services. It does not move money, connect to real banks, or control payments.
                </p>
              </>
            ) : (
              <>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl mb-6">
                  {current.icon}
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {step === 1 ? `Welcome, ${userName}` : current.title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                  {current.description}
                </p>

                <div className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl p-5 text-left mb-8">
                  <h4 className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3">
                    Key Notes
                  </h4>
                  <ul className="space-y-3">
                    {current.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-indigo-500 mr-2 font-bold">&bull;</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <div className="flex items-center justify-between w-full pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-2 px-3 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < steps.length ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex items-center text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 py-2.5 px-4 rounded-xl shadow-xs transition-colors"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              ) : step === steps.length ? (
                <button
                  onClick={() => setStep(actionStep)}
                  className="flex items-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-5 rounded-xl shadow-xs transition-colors"
                >
                  Choose first step <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              ) : (
                <Button variant="ghost" onClick={() => onComplete("skip")}>
                  Skip for now
                </Button>
              )}
            </div>
          </div>
        </Card>

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 mt-6 leading-normal px-4">
          This app uses mock data only. It does not access real accounts, process payments, or provide financial advice.
        </p>
      </div>
    </div>
  );
};
