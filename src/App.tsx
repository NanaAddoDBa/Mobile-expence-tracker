import React, { useState, useEffect } from 'react';
import { Transaction, Budget, Alert, Category, ConnectedAccount, CategorizationRule, UserProfile, StatementDocument, UserSession, Goal, GoalContribution } from './types';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  INITIAL_ALERTS, 
  SIMULATION_PROFILES 
} from './data/mockData';
import MobileFrame from './components/MobileFrame';
import DashboardView from './components/DashboardView';
import AnalyticsPanel from './components/AnalyticsPanel';
import BudgetPlanner from './components/BudgetPlanner';
import TransactionForm from './components/TransactionForm';
import ProfilePanel from './components/ProfilePanel';
import LoginScreen from './components/LoginScreen';
import FinancialGoals from './components/FinancialGoals';
import { motion, AnimatePresence } from 'motion/react';
import { Home, LineChart, Target, PlusCircle, Bell, X, Compass, RefreshCw, CreditCard, User, LogOut, Layout, Smartphone, Monitor, Sun, Moon, PiggyBank } from 'lucide-react';

const INITIAL_ACCOUNTS: ConnectedAccount[] = [
  {
    id: 'card-1',
    name: 'Sapphire Preferred Credit Card',
    institution: 'Chase Bank',
    paymentMethod: 'Credit Card',
    balance: 4420.50,
    lastFour: '4295',
    status: 'connected',
    color: 'indigo'
  },
  {
    id: 'card-2',
    name: 'Cash Rewards Checking Account',
    institution: 'Bank of America',
    paymentMethod: 'Bank Transfer',
    balance: 12850.25,
    lastFour: '8812',
    status: 'connected',
    color: 'emerald'
  },
  {
    id: 'card-3',
    name: 'Titanium Premium Credit Card',
    institution: 'Apple Credit',
    paymentMethod: 'Credit Card',
    balance: 620.10,
    lastFour: '0952',
    status: 'connected',
    color: 'slate'
  }
];

const INITIAL_RULES: CategorizationRule[] = [
  { id: 'rule-1', keyword: 'Starbucks', category: 'Food & Dining' },
  { id: 'rule-2', keyword: 'Netflix', category: 'Entertainment' },
  { id: 'rule-3', keyword: 'Uber', category: 'Transport' },
  { id: 'rule-4', keyword: 'Amazon', category: 'Shopping' }
];

export default function App() {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('krypton_theme');
    if (saved) return saved === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [useBezel, setUseBezel] = useState<boolean>(() => {
    const saved = localStorage.getItem('krypton_use_bezel');
    return saved !== 'false';
  });

  const handleToggleBezel = (val: boolean) => {
    setUseBezel(val);
    localStorage.setItem('krypton_use_bezel', String(val));
  };

  const [activeTab, setActiveTab] = useState<number>(0);
  const [profileSubTab, setProfileSubTab] = useState<'profile' | 'app' | 'rules' | 'access' | 'security' | 'features'>('profile');
  const [isAutoEmulating, setIsAutoEmulating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ id: string; category: string; message: string; type: 'warning' | 'danger' | 'info' } | null>(null);

  // Authentication & Profile States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('krypton_logged_in') === 'true';
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Andy Bampoe",
    email: "Andybampoe.ad@gmail.com",
    phone: "+44 7911 123456",
    address: "10 Downing Street, London, SW1A 2AA, UK",
    avatar: "💼",
    mfaEnabled: true,
    loginPin: "1234",
    themePreference: "dark",
    accessibilityFontScale: "medium",
    accessibilityHighContrast: false,
    accessibilityKeyboardFocus: false,
    dataSharingConsent: true,
    cookieTrackingConsent: true,
    telemetryLogsEnabled: true
  });

  const [documents, setDocuments] = useState<StatementDocument[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);

  // Core Server Synchronized States
  const [transactions, setTransactions] = useState<Transaction[]>(() => INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(() => INITIAL_BUDGETS);
  const [alerts, setAlerts] = useState<Alert[]>(() => INITIAL_ALERTS);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(() => INITIAL_ACCOUNTS);
  const [categorizationRules, setCategorizationRules] = useState<CategorizationRule[]>(() => INITIAL_RULES);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [serverSettings, setServerSettings] = useState({
    currency: 'USD',
    serverSyncFrequency: 'realtime',
    plaidClientId: 'sandbox_client_id_4295x',
    plaidSecret: 'shh_sandbox_secret_99812a',
    trueLayerToken: 'sandbox-tl-usr_94a0d923fcda12',
    notificationsEnabled: true
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [isInitialized, setIsInitialized] = useState(false);

  // 1. Pull entire database state on startup
  useEffect(() => {
    async function loadState() {
      setSyncStatus('syncing');
      try {
        const res = await fetch('/api/db');
        if (res.ok) {
          const db = await res.json();
          if (db.transactions) setTransactions(db.transactions);
          if (db.budgets) setBudgets(db.budgets);
          if (db.alerts) setAlerts(db.alerts);
          if (db.connectedAccounts) setConnectedAccounts(db.connectedAccounts);
          if (db.categorizationRules) setCategorizationRules(db.categorizationRules);
          if (db.settings) setServerSettings(db.settings);
          if (db.profile) {
            setUserProfile(db.profile);
            if (db.profile.themePreference) {
              setIsDarkTheme(db.profile.themePreference === 'dark');
            }
          }
          if (db.documents) setDocuments(db.documents);
          if (db.sessions) setSessions(db.sessions);
          if (db.goals) setGoals(db.goals);
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.error('Server sync failed, falling back to offline defaults', err);
        setSyncStatus('error');
      } finally {
        setIsInitialized(true);
      }
    }
    loadState();
  }, []);

  // 2. Continuous Synchronization Mirror Loop
  useEffect(() => {
    if (!isInitialized) return;
    async function saveState() {
      setSyncStatus('syncing');
      try {
        const res = await fetch('/api/db/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions,
            budgets,
            alerts,
            connectedAccounts,
            categorizationRules,
            settings: serverSettings,
            profile: userProfile,
            documents,
            sessions,
            goals
          })
        });
        if (res.ok) {
          setSyncStatus('synced');
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        setSyncStatus('error');
      }
    }

    const t = setTimeout(saveState, 350);
    return () => clearTimeout(t);
  }, [transactions, budgets, alerts, connectedAccounts, categorizationRules, serverSettings, userProfile, documents, sessions, goals, isInitialized]);

  // Force sync trigger from Settings Panel
  const handleForceServerSync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const db = await res.json();
        if (db.transactions) setTransactions(db.transactions);
        if (db.budgets) setBudgets(db.budgets);
        if (db.alerts) setAlerts(db.alerts);
        if (db.connectedAccounts) setConnectedAccounts(db.connectedAccounts);
        if (db.categorizationRules) setCategorizationRules(db.categorizationRules);
        if (db.settings) setServerSettings(db.settings);
        if (db.profile) setUserProfile(db.profile);
        if (db.documents) setDocuments(db.documents);
        if (db.sessions) setSessions(db.sessions);
        if (db.goals) setGoals(db.goals);
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
        throw new Error();
      }
    } catch (err) {
      setSyncStatus('error');
      throw err;
    }
  };

  // Reset database trigger from Settings Panel
  const handleResetServerDb = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/db/reset', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        const db = result.data;
        if (db.transactions) setTransactions(db.transactions);
        if (db.budgets) setBudgets(db.budgets);
        if (db.alerts) setAlerts(db.alerts);
        if (db.connectedAccounts) setConnectedAccounts(db.connectedAccounts);
        if (db.categorizationRules) setCategorizationRules(db.categorizationRules);
        if (db.settings) setServerSettings(db.settings);
        if (db.profile) setUserProfile(db.profile);
        if (db.documents) setDocuments(db.documents);
        if (db.sessions) setSessions(db.sessions);
        if (db.goals) setGoals(db.goals);
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
        throw new Error();
      }
    } catch (err) {
      setSyncStatus('error');
      throw err;
    }
  };

  const handleSaveServerSettings = async (nextSettings: any) => {
    setServerSettings(nextSettings);
  };

  // Automated Billing Engine: Record scheduled daily/weekly/monthly/yearly recurring items on their set dates
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let nextTxs = [...transactions];
    let changed = false;
    let iterations = 0;
    const maxIterations = 50; // Safety guard

    const getNextDate = (dateStr: string, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      if (frequency === 'daily') d.setDate(d.getDate() + 1);
      else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
      else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    };

    while (iterations < maxIterations) {
      const dueIndex = nextTxs.findIndex(t => t.isRecurring && t.recurringNextDate && t.recurringNextDate <= todayStr);
      if (dueIndex === -1) break;

      const dueTx = nextTxs[dueIndex];
      const nextDueDate = dueTx.recurringNextDate!;
      const computedNextDate = getNextDate(nextDueDate, dueTx.recurringFrequency || 'monthly');

      // 1. Demote old transaction so it's a historical record, not the active recurrence anchor
      const updatedDueTx = {
        ...dueTx,
        isRecurring: false,
        recurringLastFired: nextDueDate
      };

      // 2. Generate the new corresponding transaction with the scheduled date
      const generatedTx: Transaction = {
        id: `tx-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amount: dueTx.amount,
        category: dueTx.category,
        description: dueTx.description,
        type: dueTx.type,
        date: nextDueDate,
        paymentMethod: dueTx.paymentMethod,
        tags: [...(dueTx.tags || []), 'auto-billed'],
        isRecurring: true, // Keep the chain active on the latest instance
        recurringFrequency: dueTx.recurringFrequency,
        recurringNextDate: computedNextDate
      };

      nextTxs[dueIndex] = updatedDueTx;
      nextTxs = [generatedTx, ...nextTxs];
      changed = true;
      iterations++;

      // Trigger automatic warning threshold checks if it's an expense
      if (dueTx.type === 'expense') {
        const b = budgets.find(budget => budget.category === dueTx.category);
        if (b) {
          evaluateAlertThresholds(b.category, dueTx.amount, b.spent, b.limit, b.alertThreshold);
        }
      }

      // Create a nice notification card in the system alerts log
      const alertId = `alert-rec-${Date.now()}-${iterations}`;
      const alertObj: Alert = {
        id: alertId,
        type: 'info',
        category: dueTx.category,
        message: `AUTO-RECURRING: Scheduled entry "${dueTx.description}" of $${dueTx.amount.toFixed(2)} has been recorded on ${nextDueDate}.`,
        time: new Date().toISOString(),
        isRead: false
      };
      setAlerts(prev => [alertObj, ...prev]);
    }

    if (changed) {
      setTransactions(nextTxs);
      refreshBudgetSpentValues(nextTxs);
    }
  }, [transactions, budgets]);

  useEffect(() => {
    localStorage.setItem('krypton_theme', isDarkTheme ? 'dark' : 'light');
    const root = window.document.documentElement;
    if (isDarkTheme) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkTheme]);

  // System-level theme preference listener using window.matchMedia
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Handle continuous auto-emulator feed
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoEmulating) {
      timer = setInterval(() => {
        triggerMockExpense();
      }, 6000); // Trigger a mock transaction every 6 seconds
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoEmulating, transactions, budgets]);

  // Recalculates spent category metrics when transactions list changes
  const refreshBudgetSpentValues = (txs: Transaction[]) => {
    setBudgets(prevBudgets => {
      return prevBudgets.map(b => {
        // sum expenses matching this specific category
        const total = txs
          .filter(t => t.type === 'expense' && t.category === b.category)
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          ...b,
          spent: total
        };
      });
    });
  };

  // Triggers alert logs if a recent expenditure crosses safety markers
  const evaluateAlertThresholds = (category: Exclude<Category, 'Income'>, addedAmount: number, currentSpent: number, limit: number, threshold: number) => {
    const newSpent = currentSpent + addedAmount;
    const oldPct = (currentSpent / limit) * 100;
    const newPct = (newSpent / limit) * 100;

    let alertObj: Omit<Alert, 'id'> | null = null;

    if (newPct >= 100 && oldPct < 100) {
      alertObj = {
        type: 'danger',
        category,
        message: `DEBT LIMIT BREACHED: ${category} spending ($${newSpent.toFixed(2)}) has broken past your monthly limit of $${limit.toFixed(0)}!`,
        time: new Date().toISOString(),
        amount: newSpent,
        limit,
        isRead: false
      };
    } else if (newPct >= threshold && oldPct < threshold) {
      alertObj = {
        type: 'warning',
        category,
        message: `BUFFER WARNING: ${category} spending is at ${newPct.toFixed(0)}% (${newSpent.toFixed(2)} spent), passing your safety buffer limit of ${threshold}%.`,
        time: new Date().toISOString(),
        amount: newSpent,
        limit,
        isRead: false
      };
    }

    if (alertObj) {
      const generatedId = `alert-${Date.now()}`;
      const finalAlert = { id: generatedId, ...alertObj } as Alert;
      setAlerts(prev => [finalAlert, ...prev]);

      // Trigger beautiful iOS-style physical popup toast instantly inside applet context
      setToastMessage({
        id: generatedId,
        category: alertObj.category,
        message: alertObj.message,
        type: alertObj.type
      });

      // Dismiss popup naturally in 5.5 seconds
      setTimeout(() => {
        setToastMessage(curr => curr?.id === generatedId ? null : curr);
      }, 5500);
    }
  };

  // Add real Transaction
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const id = `tx-${Date.now()}`;
    const transaction: Transaction = { id, ...newTx };

    // If it's an expense, pre-flight check Alert systems before pushing
    if (transaction.type === 'expense') {
      const b = budgets.find(budget => budget.category === transaction.category);
      if (b) {
        evaluateAlertThresholds(b.category, transaction.amount, b.spent, b.limit, b.alertThreshold);
      }
    }

    const nextTxs = [transaction, ...transactions];
    setTransactions(nextTxs);
    refreshBudgetSpentValues(nextTxs);
  };

  // Manually trigger recurring schedule early
  const handleTriggerInstanceEarly = (id: string) => {
    const txIndex = transactions.findIndex(t => t.id === id);
    if (txIndex === -1) return;
    const dueTx = transactions[txIndex];
    if (!dueTx.isRecurring || !dueTx.recurringNextDate) return;

    const nextDueDate = dueTx.recurringNextDate;
    
    // Calculate the subsequent due date
    const getNextDate = (dateStr: string, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      if (frequency === 'daily') d.setDate(d.getDate() + 1);
      else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
      else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    };
    const computedNextDate = getNextDate(nextDueDate, dueTx.recurringFrequency || 'monthly');

    // Create the new transaction
    const generatedTxId = `tx-rec-${Date.now()}`;
    const generatedTx: Transaction = {
      id: generatedTxId,
      amount: dueTx.amount,
      category: dueTx.category,
      description: dueTx.description,
      type: dueTx.type,
      date: nextDueDate, // Recorded on its scheduled target date
      paymentMethod: dueTx.paymentMethod,
      tags: [...(dueTx.tags || []), 'auto-billed', 'manual-trigger'],
      isRecurring: true, // becomes the new chain template
      recurringFrequency: dueTx.recurringFrequency,
      recurringNextDate: computedNextDate
    };

    // Update old one to no longer be recurring
    const updatedDueTx = {
      ...dueTx,
      isRecurring: false,
      recurringLastFired: nextDueDate
    };

    const nextTxs = transactions.map(t => t.id === id ? updatedDueTx : t);
    const finalTxs = [generatedTx, ...nextTxs];

    setTransactions(finalTxs);
    refreshBudgetSpentValues(finalTxs);

    // Toast and Alerts
    const alertId = `alert-manual-${Date.now()}`;
    const alertObj: Alert = {
      id: alertId,
      type: 'info',
      category: dueTx.category,
      message: `RECURRING RECORDED: "${dueTx.description}" of $${dueTx.amount.toFixed(2)} recorded for due date ${nextDueDate}.`,
      time: new Date().toISOString(),
      isRead: false
    };
    setAlerts(prev => [alertObj, ...prev]);

    setToastMessage({
      id: alertObj.id,
      category: dueTx.category,
      message: alertObj.message,
      type: 'info'
    });
  };

  // Turn off recurring billing schedule for a transaction
  const handleCancelSubscription = (id: string) => {
    const nextTxs = transactions.map(t => {
      if (t.id === id) {
        return {
          ...t,
          isRecurring: false
        };
      }
      return t;
    });
    setTransactions(nextTxs);
    
    // Quick user notification
    const alertId = `alert-cancel-${Date.now()}`;
    const alertObj: Alert = {
      id: alertId,
      type: 'info',
      category: 'Other',
      message: `FORECAST EXCLUDED: The scheduled recurring bill has been excluded from future budget projections.`,
      time: new Date().toISOString(),
      isRead: false
    };
    setAlerts(prev => [alertObj, ...prev]);

    setToastMessage({
      id: alertObj.id,
      category: 'Other',
      message: alertObj.message,
      type: 'info'
    });
  };

  // Delete Transaction Row
  const handleDeleteTransaction = (id: string) => {
    const nextTxs = transactions.filter(t => t.id !== id);
    setTransactions(nextTxs);
    refreshBudgetSpentValues(nextTxs);
  };

  // Modify Category Limit and Threshold triggers
  const handleUpdateLimit = (category: Exclude<Category, 'Income'>, newLimit: number) => {
    setBudgets(prev => 
      prev.map(b => b.category === category ? { ...b, limit: newLimit } : b)
    );
  };

  const handleUpdateThreshold = (category: Exclude<Category, 'Income'>, newThreshold: number) => {
    setBudgets(prev => 
      prev.map(b => b.category === category ? { ...b, alertThreshold: newThreshold } : b)
    );
  };

  // Flush dynamic alert notifications
  const handleClearAlerts = () => {
    setAlerts([]);
    setToastMessage(null);
  };

  // Connect external bank account
  const handleAddAccount = (acc: Omit<ConnectedAccount, 'id'>) => {
    const id = `card-${Date.now()}`;
    setConnectedAccounts(prev => [...prev, { id, ...acc }]);
  };

  // Disconnect card connection
  const handleDeleteAccount = (id: string) => {
    setConnectedAccounts(prev => prev.filter(c => c.id !== id));
  };

  // Add category route rule
  const handleAddRule = (rule: Omit<CategorizationRule, 'id'>) => {
    const id = `rule-${Date.now()}`;
    setConnectedAccounts(prev => {
      // Find matching card to simulate a minor charge check if they want
      return prev;
    });
    setCategorizationRules(prev => [...prev, { id, ...rule }]);
  };

  // Delete category rule Filter
  const handleDeleteRule = (id: string) => {
    setCategorizationRules(prev => prev.filter(r => r.id !== id));
  };

  // --- FINANCIAL GOALS HANDLERS ---
  const handleAddGoal = (newGoal: Omit<Goal, 'id' | 'createdAt' | 'contributions' | 'currentAmount'>) => {
    const goalId = `goal-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const created: Goal = {
      id: goalId,
      ...newGoal,
      currentAmount: 0,
      createdAt: todayStr,
      contributions: []
    };
    setGoals(prev => [...prev, created]);
    setToastMessage(`🎉 Goal milestones for "${newGoal.name}" has been activated!`);
    
    // Create systems warning or alert to record
    const alertId = `alert-srv-${Date.now()}`;
    setAlerts(prev => [
      {
        id: alertId,
        type: 'warning',
        category: 'Other',
        message: `SYSTEM-NOTIFICATION: Instantiated target goals "${newGoal.name}" with $${newGoal.targetAmount.toLocaleString()} target limit.`,
        time: new Date().toISOString(),
        isRead: false
      },
      ...prev
    ]);
  };

  const handleDeleteGoal = (id: string, refundAccountId?: string) => {
    const targetGoal = goals.find(g => g.id === id);
    if (!targetGoal) return;

    // Refund and return funds if goals had allocated money
    if (targetGoal.currentAmount > 0 && refundAccountId) {
      setConnectedAccounts(prev => prev.map(acc => {
        if (acc.id === refundAccountId) {
          return {
            ...acc,
            balance: parseFloat((acc.balance + targetGoal.currentAmount).toFixed(2))
          };
        }
        return acc;
      }));

      // Log matching transaction
      handleAddTransaction({
        amount: targetGoal.currentAmount,
        category: 'Other',
        description: `Refund: Closed Goal "${targetGoal.name}" Budget Refund`,
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        tags: ['goals-refund', 'savings-release']
      });
    }

    setGoals(prev => prev.filter(g => g.id !== id));
    setToastMessage(`🗑️ Removed goals bucket for "${targetGoal.name}".`);
  };

  const handleAllocateFunds = (goalId: string, amount: number, accountId: string, description: string) => {
    // 1. Subtract balance from account
    setConnectedAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          balance: parseFloat((acc.balance - amount).toFixed(2))
        };
      }
      return acc;
    }));

    const targetAccount = connectedAccounts.find(a => a.id === accountId);

    // 2. Add contribution and update goal currentAmount
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextAmount = g.currentAmount + amount;
        const newContribution: GoalContribution = {
          id: `c-${Date.now()}`,
          amount,
          date: new Date().toISOString().split('T')[0],
          description,
          accountId
        };
        return {
          ...g,
          currentAmount: parseFloat(nextAmount.toFixed(2)),
          contributions: [newContribution, ...g.contributions]
        };
      }
      return g;
    }));

    const targetGoal = goals.find(g => g.id === goalId);
    const goalLabel = targetGoal ? targetGoal.name : 'Goal';

    // 3. Document in central general ledger feed
    handleAddTransaction({
      amount,
      category: 'Other',
      description: `Funding Allocation: ${goalLabel} (${description})`,
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: targetAccount ? targetAccount.paymentMethod : 'Bank Transfer',
      tags: ['goals-allocation', 'savings-budget']
    });

    setToastMessage(`💰 Successfully allocated $${amount.toFixed(2)} toward "${goalLabel}"!`);
  };

  const handleWithdrawFunds = (goalId: string, amount: number, accountId: string, description: string) => {
    // 1. Refund/Add balance back to account
    setConnectedAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          balance: parseFloat((acc.balance + amount).toFixed(2))
        };
      }
      return acc;
    }));

    const targetAccount = connectedAccounts.find(a => a.id === accountId);

    // 2. Add negative contribution and decrease goal currentAmount
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const nextAmount = Math.max(0, g.currentAmount - amount);
        const newContribution: GoalContribution = {
          id: `c-${Date.now()}`,
          amount: -amount,
          date: new Date().toISOString().split('T')[0],
          description,
          accountId
        };
        return {
          ...g,
          currentAmount: parseFloat(nextAmount.toFixed(2)),
          contributions: [newContribution, ...g.contributions]
        };
      }
      return g;
    }));

    const targetGoal = goals.find(g => g.id === goalId);
    const goalLabel = targetGoal ? targetGoal.name : 'Goal';

    // 3. Document in central general ledger feed
    handleAddTransaction({
      amount,
      category: 'Other',
      description: `Withdraw Allocation: Released ${amount.toFixed(2)} from ${goalLabel} (${description})`,
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: targetAccount ? targetAccount.paymentMethod : 'Bank Transfer',
      tags: ['goals-withdrawal', 'savings-release']
    });

    setToastMessage(`🔓 Successfully withdrew $${amount.toFixed(2)} from "${goalLabel}" to cash.`);
  };

  // Process and ingest secure transaction webhooks in real-time
  const handleIngestTransaction = (newTx: Omit<Transaction, 'id'>) => {
    handleAddTransaction(newTx);

    // Adjust card account balances based on payment method matches (e.g. "Chase Bank", "Bank of America", "Apple Credit")
    setConnectedAccounts(prevAccounts => {
      return prevAccounts.map(acc => {
        if (newTx.description.includes(acc.institution)) {
          const change = newTx.amount;
          const isExpense = newTx.type === 'expense';
          const nextBalance = isExpense ? acc.balance - change : acc.balance + change;
          return {
            ...acc,
            balance: parseFloat(Math.max(0, nextBalance).toFixed(2))
          };
        }
        return acc;
      });
    });
  };

  // Sandbox: Simulates interactive random transaction charges
  const triggerMockExpense = () => {
    // Select random spending profile
    const profile = SIMULATION_PROFILES[Math.floor(Math.random() * SIMULATION_PROFILES.length)];
    const range = profile.amountMax - profile.amountMin;
    const amount = parseFloat((profile.amountMin + Math.random() * range).toFixed(2));
    
    // Choose random secondary label tag
    const tag = profile.options[Math.floor(Math.random() * profile.options.length)];

    // Record instant charge simulation
    handleAddTransaction({
      amount,
      category: profile.category,
      description: `${profile.description} (#${tag})`,
      type: 'expense',
      date: new Date().toISOString().split('T')[0], // 2026-05-24
      paymentMethod: profile.paymentMethod,
      tags: [tag, 'sandbox-event']
    });
  };

  if (!useBezel) {
    return (
      <div className={`min-h-screen flex ${isDarkTheme ? 'bg-slate-950 text-slate-150' : 'bg-slate-50 text-slate-900'} ${
        userProfile.accessibilityFontScale === 'large' ? 'accessibility-scale-large' : 
        userProfile.accessibilityFontScale === 'small' ? 'accessibility-scale-small' : ''
      } ${
        userProfile.accessibilityHighContrast ? 'accessibility-high-contrast' : ''
      } font-sans transition-colors duration-300`}>
        
        {/* ===================== DESKTOP SIDEBAR NAVIGATION ===================== */}
        <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40">
          <div className="flex flex-col overflow-y-auto flex-1 p-5 space-y-7 scrollbar-none">
            
            {/* App Branding */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-5">
              <span className="p-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                <Compass className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none text-slate-900 dark:text-white">Krypton</h1>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-405 mt-1 block">SpendTracker v1.5</span>
              </div>
            </div>

            {/* Profile Panel Banner details */}
            {isLoggedIn && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-center gap-3">
                <div className="text-2xl p-2 bg-indigo-500/10 dark:bg-indigo-950/20 rounded-xl select-none">
                  {userProfile.avatar || "💼"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-805 dark:text-slate-200 truncate">{userProfile.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8.5px] font-bold text-slate-450 dark:text-slate-450 uppercase tracking-widest">Live Sync Connected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar Navigation buttons */}
            <nav className="space-y-1">
              {[
                { id: 0, label: 'Ledger Hub', sub: 'Real-time pipeline', icon: Home },
                { id: 1, label: 'Analytics Reports', sub: 'Dynamic spending metrics', icon: LineChart },
                { id: 2, label: 'Smart Budgets & Alerts', sub: 'Limits & threshold warnings', icon: Target },
                { id: 5, label: 'Financial Goal Builder', sub: 'Allocation & milestones', icon: PiggyBank },
                { id: 3, label: 'Manual Direct Entry', sub: 'Log local inputs', icon: PlusCircle },
                { id: 4, label: 'Preferences & Access', sub: 'Secure passcode & rules', icon: User }
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 4) setProfileSubTab('profile');
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-left border transition-all duration-200 group ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/15 font-black'
                        : 'bg-transparent border-transparent text-slate-550 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-150 hover:bg-slate-100 dark:hover:bg-slate-950/50 font-semibold'
                    }`}
                  >
                    <IconComponent className={`w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    }`} />
                    <div className="min-w-0">
                      <span className="block text-xs uppercase tracking-normal leading-none font-extrabold">{item.label}</span>
                      <span className={`text-[8.5px] mt-0.5 block font-semibold leading-none ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>{item.sub}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Combined Mini Metrics view inside Sidebar */}
            {isLoggedIn && (
              <div className="pt-4 border-t border-slate-150 dark:border-slate-850 space-y-2.5">
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Ledger Metrics</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 text-center rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase">Cash Assets</span>
                    <span className="block text-[11px] font-black font-sans text-emerald-500 mt-0.5">
                      +${transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 text-center rounded-xl border border-slate-100 dark:border-slate-850">
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase">Liabilities</span>
                    <span className="block text-[11px] font-black font-sans text-amber-500 mt-0.5">
                      -${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Footer Operations */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-805 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
            {/* Theme & Display Bezels */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggleBezel(true)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-905 dark:hover:bg-slate-800 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-350 transition active:scale-95"
                title="Return to the Mobile Phone frame testing viewport"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mobile view</span>
              </button>
              
              <button
                onClick={() => setIsDarkTheme(!isDarkTheme)}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-105 hover:bg-slate-200 dark:bg-slate-905 dark:hover:bg-slate-800 rounded-xl text-[9px] font-bold text-slate-700 dark:text-slate-350 transition"
                title="Toggle visual theme"
              >
                {isDarkTheme ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{isDarkTheme ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>

            {isLoggedIn && (
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  localStorage.setItem('krypton_logged_in', 'false');
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-800 text-rose-500 dark:text-rose-400 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition hover:bg-rose-50 dark:hover:bg-rose-950/15"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Ledger</span>
              </button>
            )}
          </div>
        </aside>

        {/* ===================== DESKTOP MAIN PAGE PORTVIEW ===================== */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          
          {/* Header Bar */}
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-10 w-full">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {activeTab === 0 && "💸 Consolidated Spend Ledger Overview"}
                {activeTab === 1 && "📊 Dynamic Trend Analyzer Reports"}
                {activeTab === 2 && "🎯 Target Budgets & Security alerts"}
                {activeTab === 3 && "➕ Manual Charge Receipt Inflow"}
                {activeTab === 4 && "👤 Security Credentials & Appearance Settings"}
              </span>
            </div>

            {/* Network Connections Status overview */}
            <div className="flex items-center gap-3">
              {/* Synchronize state badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-950 text-[10px] font-bold text-slate-655 dark:text-slate-350 select-none border border-slate-200 dark:border-slate-850">
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>
                  {syncStatus === 'synced' ? 'Live Cloud Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Cached local state'}
                </span>
              </div>

              {/* Quick Simulator Swipe (convenient for testing extreme values) */}
              <button
                onClick={triggerMockExpense}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-xs flex items-center gap-1 active:scale-95"
                title="Generates dynamic transactions with warning alerts"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Simulate Swipe
              </button>
            </div>
          </header>

          {/* Toast alarms */}
          <AnimatePresence>
            {toastMessage && (
              <div className="fixed top-18 right-8 z-50 w-96 bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 transition animate-slide-in">
                <span className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  toastMessage.type === 'danger' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  <Bell className="w-4.5 h-4.5 animate-bounce" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-rose-455 tracking-wider uppercase leading-none">
                      {toastMessage.category.toUpperCase()} ALERT TRIGGERED
                    </span>
                    <span className="text-[9px] font-medium text-slate-500">Just Now</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 mt-1 leading-normal">
                    {toastMessage.message}
                  </p>
                </div>
                <button 
                  onClick={() => setToastMessage(null)} 
                  className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </AnimatePresence>

          {/* Main scrollable body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto h-full">
              {!isLoggedIn ? (
                <div className="max-w-md mx-auto py-16">
                  <LoginScreen 
                    savedPin={userProfile.loginPin} 
                    savedName={userProfile.name}
                    onLoginSuccess={(name, pin) => {
                      setIsLoggedIn(true);
                      localStorage.setItem('krypton_logged_in', 'true');
                      setUserProfile(prev => ({ ...prev, name }));
                    }}
                  />
                </div>
              ) : (
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="h-full flex flex-col"
                >
                  {activeTab === 0 && (
                    <DashboardView
                      transactions={transactions}
                      budgets={budgets}
                      alerts={alerts}
                      connectedAccounts={connectedAccounts}
                      onDeleteTransaction={handleDeleteTransaction}
                      onNavigateToTab={(idx, subTab) => {
                        setActiveTab(idx);
                        if (subTab) setProfileSubTab(subTab as any);
                      }}
                      onAddAccount={handleAddAccount}
                      onIngestTransaction={handleIngestTransaction}
                    />
                  )}

                  {activeTab === 1 && (
                    <AnalyticsPanel transactions={transactions} />
                  )}

                  {activeTab === 2 && (
                    <BudgetPlanner
                      budgets={budgets}
                      onUpdateLimit={handleUpdateLimit}
                      onUpdateThreshold={handleUpdateThreshold}
                      alerts={alerts}
                      onClearAlerts={handleClearAlerts}
                      transactions={transactions}
                      onTriggerInstanceEarly={handleTriggerInstanceEarly}
                      onCancelSubscription={handleCancelSubscription}
                    />
                  )}

                  {activeTab === 3 && (
                    <TransactionForm
                      onAddTransaction={handleAddTransaction}
                      onClose={() => setActiveTab(0)}
                    />
                  )}

                  {activeTab === 4 && (
                    <ProfilePanel
                      activeMenuTab={profileSubTab}
                      onActiveMenuTabChange={setProfileSubTab}
                      connectedAccounts={connectedAccounts}
                      categorizationRules={categorizationRules}
                      onAddAccount={handleAddAccount}
                      onDeleteAccount={handleDeleteAccount}
                      onAddRule={handleAddRule}
                      onDeleteRule={handleDeleteRule}
                      onIngestTransaction={handleIngestTransaction}
                      onForceServerSync={handleForceServerSync}
                      onResetServerDb={handleResetServerDb}
                      serverSettings={serverSettings}
                      onSaveServerSettings={handleSaveServerSettings}
                      syncStatus={syncStatus}
                      isAutoEmulating={isAutoEmulating}
                      onToggleAutoEmulation={() => setIsAutoEmulating(!isAutoEmulating)}
                      onTriggerRandomExpense={triggerMockExpense}
                      alerts={alerts}
                      onClearAlerts={handleClearAlerts}
                      userProfile={userProfile}
                      onUpdateUserProfile={(profile) => {
                        setUserProfile(profile);
                        if (profile.themePreference) {
                          setIsDarkTheme(profile.themePreference === 'dark');
                        }
                      }}
                      documents={documents}
                      onAddDocument={(doc) => setDocuments(prev => [doc, ...prev])}
                      onDeleteDocument={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
                      sessions={sessions}
                      onUpdateSessions={(nextSessions) => setSessions(nextSessions)}
                      onLogout={() => {
                        setIsLoggedIn(false);
                        localStorage.setItem('krypton_logged_in', 'false');
                      }}
                    />
                  )}

                  {activeTab === 5 && (
                    <FinancialGoals
                      goals={goals}
                      connectedAccounts={connectedAccounts}
                      onAddGoal={handleAddGoal}
                      onDeleteGoal={handleDeleteGoal}
                      onAllocateFunds={handleAllocateFunds}
                      onWithdrawFunds={handleWithdrawFunds}
                    />
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileFrame 
      isDarkTheme={isDarkTheme} 
      onThemeToggle={() => setIsDarkTheme(!isDarkTheme)}
      fontScale={userProfile.accessibilityFontScale}
      highContrast={userProfile.accessibilityHighContrast}
      keyboardFocus={userProfile.accessibilityKeyboardFocus}
      useBezel={useBezel}
      setUseBezel={handleToggleBezel}
    >
      {!isLoggedIn ? (
        <LoginScreen 
          savedPin={userProfile.loginPin} 
          savedName={userProfile.name}
          onLoginSuccess={(name, pin) => {
            setIsLoggedIn(true);
            localStorage.setItem('krypton_logged_in', 'true');
            setUserProfile(prev => ({
              ...prev,
              name
            }));
          }}
        />
      ) : (
        <>
          {/* Absolute iOS-style Push Notification Badge Toast */}
          {toastMessage && (
            <div className="absolute top-12 left-4 right-4 z-50 bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl flex items-start gap-2.5 transition duration-300 animate-slide-in">
              <span className={`p-1 rounded-lg shrink-0 mt-0.5 ${
                toastMessage.type === 'danger' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-505/10 text-emerald-450'
              }`}>
                <Bell className="w-4 h-4 animate-bounce" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">
                    {toastMessage.category.toUpperCase()} BREACH
                  </span>
                  <span className="text-[9px] font-medium text-slate-500">Just Now</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-250 mt-0.5 leading-relaxed">
                  {toastMessage.message}
                </p>
              </div>
              <button 
                id="dismiss-toast"
                onClick={() => setToastMessage(null)} 
                className="p-0.5 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Screen body viewer rendering standard tabs */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 0 && (
              <DashboardView
                transactions={transactions}
                budgets={budgets}
                alerts={alerts}
                connectedAccounts={connectedAccounts}
                onDeleteTransaction={handleDeleteTransaction}
                onNavigateToTab={(idx, subTab) => {
                  setActiveTab(idx);
                  if (subTab) {
                    setProfileSubTab(subTab as any);
                  }
                }}
                onAddAccount={handleAddAccount}
                onIngestTransaction={handleIngestTransaction}
              />
            )}

            {activeTab === 1 && (
              <AnalyticsPanel
                transactions={transactions}
              />
            )}

            {activeTab === 2 && (
              <BudgetPlanner
                budgets={budgets}
                onUpdateLimit={handleUpdateLimit}
                onUpdateThreshold={handleUpdateThreshold}
                alerts={alerts}
                onClearAlerts={handleClearAlerts}
                transactions={transactions}
                onTriggerInstanceEarly={handleTriggerInstanceEarly}
                onCancelSubscription={handleCancelSubscription}
              />
            )}

            {activeTab === 3 && (
              <TransactionForm
                onAddTransaction={handleAddTransaction}
                onClose={() => setActiveTab(0)}
              />
            )}

            {activeTab === 4 && (
              <ProfilePanel
                activeMenuTab={profileSubTab}
                onActiveMenuTabChange={setProfileSubTab}
                connectedAccounts={connectedAccounts}
                categorizationRules={categorizationRules}
                onAddAccount={handleAddAccount}
                onDeleteAccount={handleDeleteAccount}
                onAddRule={handleAddRule}
                onDeleteRule={handleDeleteRule}
                onIngestTransaction={handleIngestTransaction}
                onForceServerSync={handleForceServerSync}
                onResetServerDb={handleResetServerDb}
                serverSettings={serverSettings}
                onSaveServerSettings={handleSaveServerSettings}
                syncStatus={syncStatus}
                isAutoEmulating={isAutoEmulating}
                onToggleAutoEmulation={() => setIsAutoEmulating(!isAutoEmulating)}
                onTriggerRandomExpense={triggerMockExpense}
                alerts={alerts}
                onClearAlerts={handleClearAlerts}
                userProfile={userProfile}
                onUpdateUserProfile={(profile) => {
                  setUserProfile(profile);
                  if (profile.themePreference) {
                    setIsDarkTheme(profile.themePreference === 'dark');
                  }
                }}
                documents={documents}
                onAddDocument={(doc) => setDocuments(prev => [doc, ...prev])}
                onDeleteDocument={(id) => setDocuments(prev => prev.filter(d => d.id !== id))}
                sessions={sessions}
                onUpdateSessions={(nextSessions) => setSessions(nextSessions)}
                onLogout={() => {
                  setIsLoggedIn(false);
                  localStorage.setItem('krypton_logged_in', 'false');
                }}
              />
            )}

            {activeTab === 5 && (
              <FinancialGoals
                goals={goals}
                connectedAccounts={connectedAccounts}
                onAddGoal={handleAddGoal}
                onDeleteGoal={handleDeleteGoal}
                onAllocateFunds={handleAllocateFunds}
                onWithdrawFunds={handleWithdrawFunds}
              />
            )}
          </div>

          {/* Persistent Bottom Mobile Navigation Tab Bar */}
          <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-1 pb-2 px-4 shadow-sm z-30 shrink-0">
            <div className="flex justify-around items-center h-12 max-w-sm mx-auto">
              
              <button
                id="tab-button-home"
                onClick={() => setActiveTab(0)}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all ${
                  activeTab === 0 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-1 tracking-wide">Ledger</span>
              </button>

              <button
                id="tab-button-reports"
                onClick={() => setActiveTab(1)}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all ${
                  activeTab === 1 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                <LineChart className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-1 tracking-wide">Reports</span>
              </button>

              {/* Quick Center Add Button with custom floating effect */}
              <button
                id="tab-button-add-direct"
                onClick={() => setActiveTab(3)}
                className={`flex flex-col items-center justify-center w-11 h-11 rounded-full text-white tracking-wide transition-all shadow-md active:scale-95 ${
                  activeTab === 3 
                    ? 'bg-rose-500 ring-4 ring-rose-500/20' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                }`}
                title="Record immediate transaction outflow/inflow"
              >
                <PlusCircle className="w-5.5 h-5.5" />
              </button>

              <button
                id="tab-button-budgets"
                onClick={() => setActiveTab(2)}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all ${
                  activeTab === 2 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                <Target className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-1 tracking-wide">Budgets</span>
              </button>

              <button
                id="tab-button-goals"
                onClick={() => setActiveTab(5)}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all ${
                  activeTab === 5 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                <PiggyBank className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-1 tracking-wide">Goals</span>
              </button>

              <button
                id="tab-button-profile"
                onClick={() => setActiveTab(4)}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all ${
                  activeTab === 4 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-1 tracking-wide">My Profile</span>
              </button>
            </div>
          </div>
        </>
      )}
    </MobileFrame>
  );
}
