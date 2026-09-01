import React from "react";
import { useFeedback } from "../../app/providers/FeedbackProvider";
import { useAppNavigation } from "../../app/providers/AppNavigationProvider";
import { BudgetUsagePanel } from "./components/BudgetUsagePanel";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardSetupGuidancePanel } from "./components/DashboardSetupGuidancePanel";
import { DashboardSetupEmptyState } from "./components/DashboardSetupEmptyState";
import { ExpenseSummaryCards } from "./components/ExpenseSummaryCards";
import { CashFlowSummaryCards } from "../cash-flow/components/CashFlowSummaryCards";
import { useCashFlowSummary } from "../cash-flow/hooks/useCashFlowSummary";
import { getMonthDateRange } from "../../domain/cash-flow/cashFlow.types";
import { OverspendingAlertsPanel } from "./components/OverspendingAlertsPanel";
import { RecentExpensesPanel } from "./components/RecentExpensesPanel";
import { RecurringExpensesPanel } from "./components/RecurringExpensesPanel";
import { SavingsGoalsPanel } from "./components/SavingsGoalsPanel";
import { TopCategoriesPanel } from "./components/TopCategoriesPanel";
import { useDemoDataActions } from "../demo/hooks/useDemoDataActions";
import { useDashboardSummary } from "./hooks/useDashboardSummary";

export const DashboardView: React.FC = () => {
  const { setExpenseQuery, setActiveView, openProfileTab } = useAppNavigation();
  const { showSuccess } = useFeedback();
  const { loadSampleData } = useDemoDataActions();
  const summary = useDashboardSummary();
  const cashFlow = useCashFlowSummary(
    getMonthDateRange(summary.currentYearMonth),
  );

  const goToExpenses = () => setActiveView("expenses");
  const goToBudgets = () => setActiveView("budgets");
  const goToGoals = () => setActiveView("goals");
  const goToIncome = () => setActiveView("income");
  const handleGuidanceAction = (
    action: "add-expense" | "add-income" | "create-budget" | "import-expenses",
  ) => {
    if (action === "add-expense") {
      setActiveView("expenses");
      return;
    }

    if (action === "add-income") {
      setActiveView("income");
      return;
    }

    if (action === "create-budget") {
      setActiveView("budgets");
      return;
    }

    openProfileTab("accounts");
  };

  if (summary.isEmpty) {
    return (
      <DashboardSetupEmptyState
        onNavigate={setActiveView}
        onOpenConnectedAccounts={() => openProfileTab("accounts")}
        onLoadSampleData={() => {
          void loadSampleData();
          showSuccess("Starter sample data loaded.");
        }}
      />
    );
  }

  const handleSearch = (query: string) => {
    setExpenseQuery(query);
    setActiveView("expenses");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      <DashboardHeader
        currentMonthLabelFull={summary.currentMonthLabelFull}
        onSearch={handleSearch}
      />

      <DashboardSetupGuidancePanel
        guidance={summary.setupGuidance}
        onAction={handleGuidanceAction}
      />

      <CashFlowSummaryCards
        summary={cashFlow.summary}
        isLoading={cashFlow.isLoading}
        errorMessage={cashFlow.errorMessage}
        onViewIncome={goToIncome}
      />

      <ExpenseSummaryCards
        currentMonthName={summary.currentMonthName}
        currentMonthTotal={summary.currentMonthTotal}
        currentMonthExpensesCount={summary.currentMonthExpensesCount}
        overallRemaining={summary.overallRemaining}
        totalBudgetLimit={summary.totalBudgetLimit}
        totalBudgetSpent={summary.totalBudgetSpent}
        overallPercentage={summary.overallPercentage}
        onViewExpenses={goToExpenses}
        onViewBudgets={goToBudgets}
      />

      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6 self-stretch">
        <OverspendingAlertsPanel
          overspendingCategories={summary.overspendingCategories}
          nearLimitCategories={summary.nearLimitCategories}
        />
        <BudgetUsagePanel budgetRecommendations={summary.budgetRecommendations} />
      </div>

      <TopCategoriesPanel
        categoryRanking={summary.categoryRanking}
        totalBudgetSpent={summary.totalBudgetSpent}
      />

      <RecentExpensesPanel
        recentExpenses={summary.recentExpenses}
        onViewExpenses={goToExpenses}
      />

      <RecurringExpensesPanel forecasts={summary.forecasts} />

      <SavingsGoalsPanel
        goals={summary.visibleGoals}
        onViewGoals={goToGoals}
      />
    </div>
  );
};
