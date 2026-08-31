import {
  BankInstitution,
  ConnectedAccount,
  StartBankConnectionInput,
} from "../../domain/accounts/account.types";
import { Budget, CreateBudgetModel, UpdateBudgetModel } from "../../domain/budgets/budget.types";
import {
  CreateExpenseModel,
  Expense,
  UpdateExpenseModel,
} from "../../domain/expenses/expense.types";
import { CreateGoalModel, Goal, UpdateGoalModel } from "../../domain/goals/goal.types";
import { CashFlowQuery, CashFlowSummary } from "../../domain/cash-flow/cashFlow.types";
import {
  CreateIncomeModel,
  Income,
  UpdateIncomeModel,
} from "../../domain/incomes/income.types";
import { SystemNotification } from "../../domain/notifications/notification.types";
import { UserProfile } from "../../domain/profile/profile.types";
import { MockOcrResult } from "../../domain/receipts/receipt.types";
import { DemoDataSummary } from "../demo/demoDataService";

export type MockAuthState = {
  isAuthenticated: boolean;
  isOnboarded: boolean;
};

export interface ExpenseApi {
  listExpenses(): Promise<Expense[]>;
  createExpense(expense: CreateExpenseModel): Promise<Expense>;
  createImportedExpenses(expenses: CreateExpenseModel[]): Promise<Expense[]>;
  updateExpense(id: string, updates: UpdateExpenseModel): Promise<Expense[]>;
  deleteExpense(id: string): Promise<Expense[]>;
  replaceExpenses(expenses: Expense[]): Promise<Expense[]>;
}

export interface IncomeApi {
  listIncomes(): Promise<Income[]>;
  createIncome(income: CreateIncomeModel): Promise<Income>;
  updateIncome(id: string, updates: UpdateIncomeModel): Promise<Income[]>;
  deleteIncome(id: string): Promise<Income[]>;
  replaceIncomes(incomes: Income[]): Promise<Income[]>;
}

export interface CashFlowApi {
  getSummary(query?: CashFlowQuery): Promise<CashFlowSummary>;
}

export interface BudgetApi {
  listBudgets(): Promise<Budget[]>;
  createBudget(budget: CreateBudgetModel): Promise<Budget>;
  updateBudget(id: string, updates: UpdateBudgetModel): Promise<Budget[]>;
  deleteBudget(id: string): Promise<Budget[]>;
  replaceBudgets(budgets: Budget[]): Promise<Budget[]>;
}

export interface GoalApi {
  listGoals(): Promise<Goal[]>;
  createGoal(goal: CreateGoalModel): Promise<Goal>;
  updateGoal(id: string, updates: UpdateGoalModel): Promise<Goal[]>;
  deleteGoal(id: string): Promise<Goal[]>;
  replaceGoals(goals: Goal[]): Promise<Goal[]>;
}

export interface AccountApi {
  listConnectedAccounts(): Promise<ConnectedAccount[]>;
  listBankInstitutions(country?: string): Promise<BankInstitution[]>;
  startBankConnection(
    input?: StartBankConnectionInput
  ): Promise<{ linkUrl: string; account: ConnectedAccount }>;
  reconnectConnectedAccount(
    accountId: string
  ): Promise<{ linkUrl: string; account: ConnectedAccount }>;
  importConnectedAccount(accountId: string): Promise<{
    importBatchId: string;
    importedCount: number;
    importedExpenseCount: number;
    importedIncomeCount: number;
    pendingCount: number;
    skippedDuplicateCount: number;
    failedCount: number;
    message: string;
  }>;
  deleteConnectedAccount(accountId: string): Promise<void>;
  replaceConnectedAccounts(accounts: ConnectedAccount[]): Promise<ConnectedAccount[]>;
}

export interface NotificationApi {
  listNotifications(): Promise<SystemNotification[]>;
  replaceNotifications(notifications: SystemNotification[]): Promise<SystemNotification[]>;
  clearNotifications(): Promise<void>;
}

export interface ReceiptApi {
  listReceiptTemplates(): Promise<Omit<MockOcrResult, "date" | "confidence">[]>;
}

export interface AuthApi {
  getAuthState(): MockAuthState;
  setAuthState(state: Partial<MockAuthState>): void;
  getUserProfile(): UserProfile | null;
  saveUserProfile(profile: UserProfile): void;
  clearUserProfile(): void;
  getCurrentUser(): Promise<UserProfile | null>;
  login(email: string, password: string, name?: string): Promise<UserProfile | null>;
  signup(email: string, name: string, password: string): Promise<UserProfile>;
  logout(): Promise<void>;
}

export interface DemoApi {
  loadStarterDemoData(): Promise<DemoDataSummary>;
  resetDemoData(): Promise<DemoDataSummary>;
  clearDemoData(): Promise<void>;
  hasUserData(): Promise<boolean>;
}
