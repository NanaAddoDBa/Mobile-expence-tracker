import React, { useState } from "react";
import { Sliders, Sparkles, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useBudgets } from "../../app/providers/BudgetProvider";
import { useExpenses } from "../../app/providers/ExpenseProvider";
import { Card } from "../../components/ui/Card";
import { BudgetCard } from "../../components/budgets/BudgetCard";
import { BudgetFormModal } from "../../components/budgets/BudgetFormModal";
import { getCurrentMonthKey } from "../../lib/dateUtils";
import { BudgetFormSubmitPayload } from "./types/budgetForm.types";
import { useFeedback } from "../../app/providers/FeedbackProvider";
import { budgetCalculationService } from "./services/budgetCalculationService";
import { budgetRecommendationService } from "./services/budgetRecommendationService";

export const BudgetManagerView: React.FC = () => {
  const {
    budgets,
    addBudget,
    editBudget,
    deleteBudget,
  } = useBudgets();
  const { expenses } = useExpenses();
  const { showInfo } = useFeedback();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState("");
  const [editingLimit, setEditingLimit] = useState<number>(0);

  const currentYearMonth = getCurrentMonthKey();

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

  // Calculate standard usage parameters
  const budgetDetails = budgetCalculationService.getBudgetUsageForMonth(
    expenses,
    budgets,
    currentYearMonth
  );
  const budgetRecommendations = budgetRecommendationService.getRecommendations(
    expenses,
    budgets,
    currentYearMonth
  );

  // Unused categories
  const activeCategories = budgets.map((b) => b.category);
  const unbudgetedCategories = categoryOptions.filter((cat) => !activeCategories.includes(cat));

  const handleOpenAdd = () => {
    if (unbudgetedCategories.length === 0) {
      showInfo("All category budgets are already established.");
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
    });
    setIsAddOpen(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
            Budget Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Budgets are planning limits you create. Budget usage is based on expenses saved in this app.
          </p>
        </div>

        {unbudgetedCategories.length > 0 && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        )}
      </div>

      {/* RECOMMENDATIONS & GENERAL STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Envelopes Display */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetDetails.map((b) => {
              const matchingBudget = budgets.find((item) => item.category === b.category);
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
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No budgets yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add a budget to start tracking category spending.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-6 font-bold bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Add Budget
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

      {/* DIALOG OVERLAY - ADD BUDGET */}
      <BudgetFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        unbudgetedCategories={unbudgetedCategories}
        isEdit={false}
        title="Add Budget"
      />

      {/* DIALOG OVERLAY - ADJUST LIMIT */}
      <BudgetFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialCategory={editingCategory}
        initialLimitAmount={editingLimit}
        isEdit={true}
        title={`Edit Budget: ${editingCategory}`}
      />
    </div>
  );
};
