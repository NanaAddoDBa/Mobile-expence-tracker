import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarFold,
  CalendarRange,
  CheckCircle2,
  Plus,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useBudgets } from "../../app/providers/BudgetProvider";
import { useExpenses } from "../../app/providers/ExpenseProvider";
import { Card } from "../../components/ui/Card";
import { BudgetCard } from "../../components/budgets/BudgetCard";
import { BudgetFormModal } from "../../components/budgets/BudgetFormModal";
import { ErrorState } from "../../components/feedback/ErrorState";
import { LoadingState } from "../../components/feedback/LoadingState";
import { BudgetPeriod } from "../../domain/budgets/budget.types";
import {
  getCurrentMonthKey,
  getCurrentYearKey,
  getIsoWeekKey,
  getIsoWeekLabel,
  getMonthLabel,
  getTodayDateString,
} from "../../lib/dateUtils";
import { BudgetFormSubmitPayload } from "./types/budgetForm.types";
import { useFeedback } from "../../app/providers/FeedbackProvider";
import { budgetCalculationService } from "./services/budgetCalculationService";
import { budgetRecommendationService } from "./services/budgetRecommendationService";

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  annual: "Annual",
};

export const BudgetManagerView: React.FC = () => {
  const {
    budgets,
    isLoading,
    errorMessage,
    addBudget,
    editBudget,
    deleteBudget,
    reloadBudgets,
  } = useBudgets();
  const { expenses } = useExpenses();
  const { showInfo } = useFeedback();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState("");
  const [editingLimit, setEditingLimit] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>("monthly");

  const currentDate = new Date();
  const today = getTodayDateString(currentDate);
  const currentWeek = getIsoWeekKey(currentDate);
  const currentYearMonth = getCurrentMonthKey(currentDate);
  const currentYear = getCurrentYearKey(currentDate);
  const periodKeys: Record<BudgetPeriod, string> = {
    daily: today,
    weekly: currentWeek,
    monthly: currentYearMonth,
    annual: currentYear,
  };
  const selectedPeriodKey = periodKeys[selectedPeriod];
  const periodLabels: Record<BudgetPeriod, string> = {
    daily: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(`${today}T00:00:00`)),
    weekly: getIsoWeekLabel(currentWeek),
    monthly: getMonthLabel(currentYearMonth),
    annual: currentYear,
  };
  const selectedPeriodLabel = periodLabels[selectedPeriod];
  const selectedPeriodTitle = PERIOD_LABELS[selectedPeriod];

  const categoryOptions = [
    "Food & Grocery",
    "Dining & Cafe",
    "Transport & Auto",
    "Housing & Utilities",
    "Entertainment & Leisure",
    "Shopping",
    "Healthcare",
    "Education & Kids",
    "Travel & Holiday",
    "Others",
  ];

  const activeBudgets = budgets.filter(
    (budget) => budget.period === selectedPeriod && budget.periodKey === selectedPeriodKey,
  );
  const budgetByCategory = new Map(
    activeBudgets.map((budget) => [budget.category, budget]),
  );
  const budgetDetails = budgetCalculationService.getBudgetUsageForPeriod(
    expenses,
    budgets,
    selectedPeriod,
    selectedPeriodKey,
  );
  const budgetRecommendations = budgetRecommendationService.getRecommendations(
    expenses,
    budgets,
    selectedPeriodKey,
    selectedPeriod,
  );

  const activeCategories = new Set(activeBudgets.map((budget) => budget.category));
  const unbudgetedCategories = categoryOptions.filter((category) => !activeCategories.has(category));

  const handleOpenAdd = () => {
    if (unbudgetedCategories.length === 0) {
      showInfo(`All ${selectedPeriod} category budgets are already established.`);
      return;
    }
    setIsAddOpen(true);
  };

  const handleOpenEdit = (id: string, cat: string, limit: number) => {
    setEditingBudgetId(id);
    setEditingCategory(cat);
    setEditingLimit(limit);
    setIsEditOpen(true);
  };

  const handleAddSubmit = (data: BudgetFormSubmitPayload) => {
    addBudget({
      category: data.category,
      limitAmount: data.limitAmount,
      period: selectedPeriod,
      periodKey: selectedPeriodKey,
    });
    setIsAddOpen(false);
  };

  const handlePeriodChange = (period: BudgetPeriod) => {
    setSelectedPeriod(period);
    setIsAddOpen(false);
    setIsEditOpen(false);
    setEditingBudgetId(null);
  };

  const handleEditSubmit = (data: BudgetFormSubmitPayload) => {
    if (editingBudgetId) {
      editBudget(editingBudgetId, {
        limitAmount: data.limitAmount,
      });
    }
    setIsEditOpen(false);
    setEditingBudgetId(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER INDEX */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
            Budget Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Budgets are planning limits you create. Budget usage is based on expenses saved in this app.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start lg:self-center">
          <div
            role="group"
            aria-label="Budget period"
            className="grid w-full grid-cols-2 items-center rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800 sm:w-auto sm:grid-cols-4"
          >
            <button
              type="button"
              aria-pressed={selectedPeriod === "daily"}
              onClick={() => handlePeriodChange("daily")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                selectedPeriod === "daily"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Daily
            </button>
            <button
              type="button"
              aria-pressed={selectedPeriod === "weekly"}
              onClick={() => handlePeriodChange("weekly")}
              className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                selectedPeriod === "weekly"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" /> Weekly
            </button>
            <button
              type="button"
              aria-pressed={selectedPeriod === "monthly"}
              onClick={() => handlePeriodChange("monthly")}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                selectedPeriod === "monthly"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Monthly
            </button>
            <button
              type="button"
              aria-pressed={selectedPeriod === "annual"}
              onClick={() => handlePeriodChange("annual")}
              className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors cursor-pointer ${
                selectedPeriod === "annual"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <CalendarFold className="h-3.5 w-3.5" /> Annual
            </button>
          </div>

          {unbudgetedCategories.length > 0 ? (
            <button
              onClick={handleOpenAdd}
              className="flex h-10 items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add {selectedPeriodTitle} Budget
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {selectedPeriodLabel}
      </p>

      {isLoading && <LoadingState label="Loading budgets..." />}

      {errorMessage && !isLoading && (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void reloadBudgets();
          }}
        />
      )}

      {!isLoading && !errorMessage && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Envelopes Display */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetDetails.map((b) => {
              const matchingBudget = budgetByCategory.get(b.category);
              if (!matchingBudget) return null;

              return (
                <BudgetCard
                  key={matchingBudget.id}
                  budgetDetail={b}
                  budgetId={matchingBudget.id}
                  onEditClick={handleOpenEdit}
                  onDeleteClick={deleteBudget}
                />
              );
            })}
          </div>

          {budgetDetails.length === 0 && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                No {selectedPeriod} budgets yet
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add a {selectedPeriod} budget to start tracking category spending.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-6 font-bold bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-lg cursor-pointer"
              >
                Add {selectedPeriodTitle} Budget
              </button>
            </div>
          )}
        </div>

        {/* Dynamic educational recommendations widget */}
        <div className="space-y-6">
          <Card className="bg-slate-50/50 dark:bg-slate-900 border border-indigo-50/50 dark:border-slate-800/80 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Spending Insights
              </h4>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Budget observations are based on expenses saved in this app.
            </p>

            <div className="space-y-3">
              {budgetRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                >
                  {rec}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 leading-none">
              Important Notes
            </h4>
            <div className="space-y-3 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              <div className="flex gap-2 text-rose-500">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span>Overspending alerts appear when a category goes over budget.</span>
              </div>
              <div className="flex gap-2 text-emerald-500">
                <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                <span>Budgets are planning limits you create. They do not block spending.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}

      {/* DIALOG OVERLAY - ADD BUDGET */}
      <BudgetFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        unbudgetedCategories={unbudgetedCategories}
        isEdit={false}
        title={`Add ${selectedPeriodTitle} Budget`}
      />

      {/* DIALOG OVERLAY - ADJUST LIMIT */}
      <BudgetFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialCategory={editingCategory}
        initialLimitAmount={editingLimit}
        isEdit={true}
        title={`Edit ${selectedPeriodTitle} Budget: ${editingCategory}`}
      />
    </div>
  );
};
