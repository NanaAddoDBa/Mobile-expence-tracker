import { Transaction, Budget, Alert, Category } from '../types';

export const INITIAL_CATEGORIES: { name: Category; color: string; icon: string }[] = [
  { name: 'Income', color: 'emerald', icon: 'TrendingUp' },
  { name: 'Food & Dining', color: 'orange', icon: 'Utensils' },
  { name: 'Transport', color: 'blue', icon: 'Car' },
  { name: 'Utilities', color: 'indigo', icon: 'Lightbulb' },
  { name: 'Entertainment', color: 'purple', icon: 'Film' },
  { name: 'Shopping', color: 'pink', icon: 'ShoppingBag' },
  { name: 'Healthcare', color: 'rose', icon: 'HeartPulse' },
  { name: 'Education', color: 'cyan', icon: 'GraduationCap' },
  { name: 'Travel', color: 'teal', icon: 'Plane' },
  { name: 'Other', color: 'slate', icon: 'CircleEllipsis' },
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Food & Dining', limit: 450, spent: 342.50, alertThreshold: 80 },
  { category: 'Transport', limit: 200, spent: 185.00, alertThreshold: 80 },
  { category: 'Utilities', limit: 180, spent: 145.00, alertThreshold: 85 },
  { category: 'Entertainment', limit: 250, spent: 265.00, alertThreshold: 80 }, // Alert triggered
  { category: 'Shopping', limit: 400, spent: 120.00, alertThreshold: 75 },
  { category: 'Healthcare', limit: 150, spent: 45.00, alertThreshold: 90 },
  { category: 'Education', limit: 100, spent: 0.00, alertThreshold: 80 },
  { category: 'Travel', limit: 300, spent: 0.00, alertThreshold: 80 },
  { category: 'Other', limit: 100, spent: 35.20, alertThreshold: 80 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    amount: 3200,
    category: 'Income',
    description: 'Monthly Salary - Google',
    type: 'income',
    date: '2026-05-01',
    paymentMethod: 'Bank Transfer',
    tags: ['salary', 'google', 'direct-deposit']
  },
  {
    id: 'tx-2',
    amount: 150,
    category: 'Income',
    description: 'UI Design Consulting Sidegig',
    type: 'income',
    date: '2026-05-18',
    paymentMethod: 'Bank Transfer',
    tags: ['freelance', 'consulting']
  },
  {
    id: 'tx-3',
    amount: 124.50,
    category: 'Food & Dining',
    description: 'Whole Foods Market Weekly Roast',
    type: 'expense',
    date: '2026-05-22',
    paymentMethod: 'Credit Card',
    tags: ['groceries', 'organic']
  },
  {
    id: 'tx-4',
    amount: 45.00,
    category: 'Transport',
    description: 'Uber Ride City Center',
    type: 'expense',
    date: '2026-05-23',
    paymentMethod: 'Credit Card',
    tags: ['commute', 'taxi']
  },
  {
    id: 'tx-5',
    amount: 85.00,
    category: 'Utilities',
    description: 'High-Speed Broadband Fiber internet',
    type: 'expense',
    date: '2026-05-15',
    paymentMethod: 'Debit Card',
    tags: ['internet', 'bills'],
    isRecurring: true,
    recurringFrequency: 'monthly',
    recurringNextDate: '2026-06-15'
  },
  {
    id: 'tx-sub-netflix',
    amount: 15.49,
    category: 'Entertainment',
    description: 'Netflix Premium Plan Subscription',
    type: 'expense',
    date: '2026-04-23',
    paymentMethod: 'Credit Card',
    tags: ['subscription', 'streaming'],
    isRecurring: true,
    recurringFrequency: 'monthly',
    recurringNextDate: '2026-05-23'
  },
  {
    id: 'tx-6',
    amount: 120.00,
    category: 'Entertainment',
    description: 'Live Indie Concert Tickets',
    type: 'expense',
    date: '2026-05-21',
    paymentMethod: 'Debit Card',
    tags: ['music', 'gig', 'weekend']
  },
  {
    id: 'tx-7',
    amount: 89.99,
    category: 'Shopping',
    description: 'Minimalist Mechanical Keyboard',
    type: 'expense',
    date: '2026-05-20',
    paymentMethod: 'Credit Card',
    tags: ['gear', 'workspace']
  },
  {
    id: 'tx-8',
    amount: 60.00,
    category: 'Utilities',
    description: 'Clean Water & Energy Utility',
    type: 'expense',
    date: '2026-05-12',
    paymentMethod: 'Bank Transfer',
    tags: ['bills']
  },
  {
    id: 'tx-9',
    amount: 42.00,
    category: 'Food & Dining',
    description: 'Gourmet Ramen with Friends',
    type: 'expense',
    date: '2026-05-23',
    paymentMethod: 'Cash',
    tags: ['dinner', 'dining-out']
  },
  {
    id: 'tx-10',
    amount: 30.00,
    category: 'Shopping',
    description: 'Premium Leather Notebook',
    type: 'expense',
    date: '2026-05-19',
    paymentMethod: 'Cash',
    tags: ['journal', 'stationery']
  },
  {
    id: 'tx-11',
    amount: 45.00,
    category: 'Healthcare',
    description: 'Prescription Pharmacy Medicines',
    type: 'expense',
    date: '2026-05-16',
    paymentMethod: 'Credit Card',
    tags: ['medical', 'pharmacy']
  },
  {
    id: 'tx-12',
    amount: 145.00,
    category: 'Entertainment',
    description: 'Subscription streaming bundle package',
    type: 'expense',
    date: '2026-04-28',
    paymentMethod: 'Credit Card',
    tags: ['annual', 'netflix', 'spotify']
  },
  {
    id: 'tx-13',
    amount: 140.00,
    category: 'Transport',
    description: 'Gasoline Station Premium Fuel',
    type: 'expense',
    date: '2026-05-11',
    paymentMethod: 'Debit Card',
    tags: ['car', 'travel']
  },
  {
    id: 'tx-14',
    amount: 176.00,
    category: 'Food & Dining',
    description: 'Michelin Star Lunch Business Meeting',
    type: 'expense',
    date: '2026-05-23',
    paymentMethod: 'Credit Card',
    tags: ['business', 'lunch']
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    type: 'danger',
    category: 'Entertainment',
    message: 'Your spending in Entertainment ($265.00) has exceeded your target budget limit of $250.00.',
    time: '2026-05-21T18:32:00Z',
    amount: 265.00,
    limit: 250,
    isRead: false
  },
  {
    id: 'alert-2',
    type: 'warning',
    category: 'Transport',
    message: 'Transport spending ($185.00) has broken past 92% of your monthly $200.00 cap.',
    time: '2026-05-23T11:15:00Z',
    amount: 185.00,
    limit: 200,
    isRead: false
  }
];

// Helper to simulate incoming streaming expense notifications
export interface SimulatedSpendingProfile {
  description: string;
  category: Exclude<Category, 'Income'>;
  amountMin: number;
  amountMax: number;
  paymentMethod: 'Cash' | 'Credit Card' | 'Debit Card';
  options: string[];
}

export const SIMULATION_PROFILES: SimulatedSpendingProfile[] = [
  {
    description: 'Starbucks Specialty Matcha & Latte',
    category: 'Food & Dining',
    amountMin: 6.50,
    amountMax: 16.00,
    paymentMethod: 'Credit Card',
    options: ['morning ride', 'coffeebreak', 'brunch']
  },
  {
    description: 'Local Supermarket Quick Groceries',
    category: 'Food & Dining',
    amountMin: 18.20,
    amountMax: 65.00,
    paymentMethod: 'Debit Card',
    options: ['dinner prep', 'weekly groceries']
  },
  {
    description: 'Uber Commute Trip back home',
    category: 'Transport',
    amountMin: 12.00,
    amountMax: 35.00,
    paymentMethod: 'Credit Card',
    options: ['commute', 'lazy day']
  },
  {
    description: 'Steam Game Store Seasonal Indie Bundle',
    category: 'Entertainment',
    amountMin: 14.99,
    amountMax: 59.99,
    paymentMethod: 'Credit Card',
    options: ['gaming', 'sale']
  },
  {
    description: 'Apparel Store Minimalist T-Shirt',
    category: 'Shopping',
    amountMin: 25.00,
    amountMax: 90.00,
    paymentMethod: 'Credit Card',
    options: ['fashion', 'unboxing']
  },
  {
    description: 'Organic Pharmacy Vitamins & Greens',
    category: 'Healthcare',
    amountMin: 22.00,
    amountMax: 55.00,
    paymentMethod: 'Debit Card',
    options: ['wellness', 'recovery']
  }
];
