import React from "react";
import { useAppNavigation } from "../../app/providers/AppNavigationProvider";
import { useConnectedAccounts } from "../../app/providers/AccountConnectionProvider";
import { useExpenses } from "../../app/providers/ExpenseProvider";
import { CATEGORY_OPTIONS, PAYMENT_METHODS } from "../../domain/expenses/expense.constants";
import { useExpenseActions } from "./hooks/useExpenseActions";
import { useExpenseFilters } from "./hooks/useExpenseFilters";
import { ExpenseFilterToolbar } from "./components/ExpenseFilterToolbar";
import { ExpenseFormModal } from "./components/ExpenseFormModal";
import { ExpenseHeader } from "./components/ExpenseHeader";
import { ExpenseTable } from "./components/ExpenseTable";

export const ExpenseLedgerView: React.FC = () => {
  const {
    expenses,
    addExpense,
    editExpense,
    deleteExpense,
  } = useExpenses();
  const {
    accounts,
  } = useConnectedAccounts();
  const {
    expenseQuery,
    setExpenseQuery,
  } = useAppNavigation();

  const expenseFilters = useExpenseFilters(expenses, {
    query: expenseQuery,
    setQuery: setExpenseQuery,
  });

  const expenseActions = useExpenseActions({
    addExpense,
    editExpense,
  });

  const connectedAccountWithoutImports = accounts.some(
    (account) => account.isConnected && (account.importedExpenseCount || 0) === 0
  );
  const emptyState = expenseFilters.hasActiveFilters && expenses.length > 0
    ? {
        title: "No expenses match your filters",
        description: "Try changing your search, category, payment type, month, or recurrence filters.",
      }
    : connectedAccountWithoutImports
      ? {
          title: "No imported expenses yet",
          description: "Import expenses from your connected mock account.",
        }
      : {
          title: "No expenses yet",
          description: "Add your first expense, scan a receipt, or connect a mock account.",
        };

  return (
    <div className="space-y-6">
      <ExpenseHeader onAddExpense={expenseActions.openAddExpense} />

      <ExpenseFilterToolbar
        expenseQuery={expenseQuery}
        setExpenseQuery={expenseFilters.setQuery}
        selectedCategory={expenseFilters.filters.category}
        setSelectedCategory={expenseFilters.setCategory}
        selectedPaymentMethod={expenseFilters.filters.paymentMethod}
        setSelectedPaymentMethod={expenseFilters.setPaymentMethod}
        selectedMonth={expenseFilters.filters.month}
        setSelectedMonth={expenseFilters.setMonth}
        selectedRecurrence={expenseFilters.filters.recurrence}
        setSelectedRecurrence={expenseFilters.setRecurrence}
        handleClearFilters={expenseFilters.resetFilters}
        hasActiveFilters={expenseFilters.hasActiveFilters}
        categoryOptions={CATEGORY_OPTIONS}
        paymentMethods={PAYMENT_METHODS}
      />

      <ExpenseTable
        filteredExpenses={expenseFilters.filteredExpenses}
        emptyStateTitle={emptyState.title}
        emptyStateDescription={emptyState.description}
        onEditClick={expenseActions.openEditExpense}
        onDeleteClick={deleteExpense}
      />

      <ExpenseFormModal
        isOpen={expenseActions.isAddOpen}
        onClose={expenseActions.closeAddExpense}
        onSubmit={expenseActions.submitNewExpense}
        accounts={accounts}
        categoryOptions={CATEGORY_OPTIONS}
        paymentMethods={PAYMENT_METHODS}
        title="Add Expense"
      />

      <ExpenseFormModal
        isOpen={expenseActions.isEditOpen}
        onClose={expenseActions.closeEditExpense}
        onSubmit={expenseActions.submitEditedExpense}
        initialData={expenseActions.editingExpense ?? undefined}
        accounts={accounts}
        categoryOptions={CATEGORY_OPTIONS}
        paymentMethods={PAYMENT_METHODS}
        title="Edit Expense"
      />
    </div>
  );
};
