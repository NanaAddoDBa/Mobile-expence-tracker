export type Category = 
  | 'Food & Dining' 
  | 'Transport' 
  | 'Utilities' 
  | 'Entertainment' 
  | 'Shopping' 
  | 'Income' 
  | 'Healthcare' 
  | 'Education'
  | 'Travel'
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  description: string;
  type: 'income' | 'expense';
  date: string; // ISO String or YYYY-MM-DD
  paymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer';
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringNextDate?: string; // YYYY-MM-DD
  recurringLastFired?: string; // YYYY-MM-DD
}

export interface Budget {
  category: Exclude<Category, 'Income'>;
  limit: number;
  spent: number;
  alertThreshold: number; // percentage (e.g. 80 for 80%)
}

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  category: Category;
  message: string;
  time: string;
  amount?: number;
  limit?: number;
  isRead: boolean;
}

export interface ConnectedAccount {
  id: string;
  name: string;
  institution: string;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'Bank Transfer';
  balance: number;
  lastFour: string;
  status: 'connected' | 'disconnected' | 'syncing';
  color: string; // Gradient color theme for visual cards
}

export interface CategorizationRule {
  id: string;
  keyword: string;
  category: Category;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string; // url or emoji/abbreviation indicator
  mfaEnabled: boolean;
  loginPin: string;
  themePreference: 'light' | 'dark';
  accessibilityFontScale: 'small' | 'medium' | 'large';
  accessibilityHighContrast: boolean;
  accessibilityKeyboardFocus: boolean;
  dataSharingConsent: boolean;
  cookieTrackingConsent: boolean;
  telemetryLogsEnabled: boolean;
}

export interface StatementDocument {
  id: string;
  name: string;
  date: string;
  size: string;
  category: 'Statement' | 'Tax' | 'Auth' | 'Receipt';
  downloadable: boolean;
}

export interface UserSession {
  id: string;
  deviceName: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  description: string;
  accountId?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string; // e.g., 'Emergency', 'Travel', 'Savings', 'Investment'
  color: 'emerald' | 'indigo' | 'rose' | 'violet' | 'amber' | 'cyan';
  createdAt: string; // YYYY-MM-DD
  contributions: GoalContribution[];
}

