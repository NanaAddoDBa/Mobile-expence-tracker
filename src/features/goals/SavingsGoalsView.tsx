import React, { useState } from "react";
import { useGoals } from "../../app/providers/GoalProvider";
import { Card } from "../../components/ui/Card";
import { PiggyBank, Plus, ShieldAlert } from "lucide-react";
import { SavingsTrajectoryChart } from "./SavingsTrajectoryChart";
import { GoalCard } from "../../components/goals/GoalCard";
import { GoalFormModal } from "../../components/goals/GoalFormModal";
import { DepositFormModal } from "../../components/goals/DepositFormModal";
import { ErrorState } from "../../components/feedback/ErrorState";
import { LoadingState } from "../../components/feedback/LoadingState";
import { getTodayDateString } from "../../lib/dateUtils";
import { GoalFormSubmitPayload, GoalSavingsSubmitPayload } from "./types/goalForm.types";

export const SavingsGoalsView: React.FC = () => {
  const {
    goals,
    isLoading,
    errorMessage,
    addGoal,
    editGoal,
    deleteGoal,
    reloadGoals,
  } = useGoals();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Helper calculating months remaining in full integer values dynamically relative to today
  const calculatePlanningMetrics = (targetDate: string, target: number, current: number) => {
    const ref = new Date(getTodayDateString());
    const tgt = new Date(targetDate);
    
    let months = (tgt.getFullYear() - ref.getFullYear()) * 12 + (tgt.getMonth() - ref.getMonth());
    if (months <= 0) months = 1;

    const remainingAmount = Math.max(0, target - current);
    const suggestedMonthly = remainingAmount / months;

    return {
      monthsRemaining: months,
      suggestedMonthly,
      remainingAmount,
    };
  };

  const handleOpenAdd = () => {
    setIsAddOpen(true);
  };

  const handleAddSubmit = (data: GoalFormSubmitPayload) => {
    addGoal(data);
    setIsAddOpen(false);
  };

  const handleOpenDeposit = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsDepositOpen(true);
  };

  const handleDepositSubmit = (adjustVal: GoalSavingsSubmitPayload) => {
    if (!selectedGoalId) return;

    const matching = goals.find((g) => g.id === selectedGoalId);
    if (matching) {
      const nextVal = Math.min(matching.targetAmount, matching.currentAmount + adjustVal);
      editGoal(selectedGoalId, {
        currentAmount: +nextVal.toFixed(2),
      });
    }

    setIsDepositOpen(false);
    setSelectedGoalId(null);
  };

  const handleOpenEdit = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsEditOpen(true);
  };

  const handleEditSubmit = (data: GoalFormSubmitPayload) => {
    if (!selectedGoalId) return;

    editGoal(selectedGoalId, data);
    setIsEditOpen(false);
    setSelectedGoalId(null);
  };

  const editingGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <div className="space-y-6">
      {/* HEADER INDEX */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
            Savings Goals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set savings goals and track your progress.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-center animate-fade-in"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {isLoading && <LoadingState label="Loading goals..." />}

      {errorMessage && !isLoading && (
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void reloadGoals();
          }}
        />
      )}

      {!isLoading && !errorMessage && (
      <>
      {/* Trajectory Simulation Curve */}
      <SavingsTrajectoryChart goals={goals} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive goals blocks */}
        <div className="lg:col-span-2 space-y-4">
          {goals.map((g) => {
            const perc = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const metrics = calculatePlanningMetrics(g.targetDate, g.targetAmount, g.currentAmount);

            return (
              <GoalCard
                key={g.id}
                goal={g}
                metrics={metrics}
                percentage={perc}
                onDepositOpen={handleOpenDeposit}
                onEditOpen={handleOpenEdit}
                onDeleteClick={deleteGoal}
              />
            );
          })}

          {goals.length === 0 && (
            <div className="text-center py-24 bg-white dark:bg-slate-900 border border-slate-100 rounded-2xl">
              <PiggyBank className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="font-semibold text-slate-800 text-sm">No savings goals yet</h4>
              <button
                onClick={handleOpenAdd}
                className="mt-6 font-semibold bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Add Goal
              </button>
            </div>
          )}
        </div>

        {/* Side guidelines */}
        <div className="space-y-6">
          <Card className="p-5 bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 leading-none">
              Important Notes
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Savings goals are for planning only. Add Savings records money you say you have set aside.
            </p>
            <div className="flex gap-2 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold leading-normal">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              <span>The app does not move money into a real account, transfer funds, or provide investment services.</span>
            </div>
          </Card>
        </div>
      </div>
      </>
      )}

      {/* DIALOG: DEFINING SAVINGS ENVELOPE */}
      <GoalFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        title="Create Savings Goal"
      />

      {/* DIALOG: ALLOCATION DEPOSIT */}
      <DepositFormModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSubmit={handleDepositSubmit}
        title="Add Savings"
      />

      {/* DIALOG: EDIT SAVINGS GOAL */}
      <GoalFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={editingGoal}
        title="Edit Savings Goal"
      />
    </div>
  );
};
