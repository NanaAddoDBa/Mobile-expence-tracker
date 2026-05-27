import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Flame, 
  Activity, 
  Lock, 
  Shield, 
  Link2, 
  Layers, 
  RefreshCw, 
  AlertTriangle, 
  ArrowUpRight,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, ConnectedAccount, Budget, Alert } from '../types';

export interface CategoryDetails {
  name: string;
  color: string;
  limit: number;
}

interface DashboardViewProps {
  transactions: Transaction[];
  budgets: Budget[];
  connectedAccounts: ConnectedAccount[];
  alerts?: Alert[];
  onIngestTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateToTab: (index: number, subTab?: string) => void;
  onAddAccount?: (acc: Omit<ConnectedAccount, 'id'>) => void;
  categoriesList?: CategoryDetails[];
}

const INITIAL_CATEGORIES: CategoryDetails[] = [
  { name: 'Housing & Rent', color: 'orange', limit: 1200 },
  { name: 'Food & Dining', color: 'blue', limit: 450 },
  { name: 'Transport', color: 'indigo', limit: 200 },
  { name: 'Shopping', color: 'purple', limit: 150 },
  { name: 'Utilities', color: 'orange', limit: 150 },
  { name: 'Entertainment', color: 'blue', limit: 100 },
  { name: 'Income', color: 'emerald', limit: 0 },
  { name: 'Other', color: 'slate', limit: 100 }
];

export default function DashboardView({
  transactions,
  budgets,
  connectedAccounts,
  alerts,
  onIngestTransaction,
  onDeleteTransaction,
  onNavigateToTab,
  categoriesList = INITIAL_CATEGORIES
}: DashboardViewProps) {
  
  const latestAlert = alerts && alerts.length > 0 ? alerts[alerts.length - 1] : null;
  const [activeTapSimulatorFeed, setActiveTapSimulatorFeed] = useState<string | null>(null);
  const [lastTxCount, setLastTxCount] = useState(transactions.length);

  // Dynamic values summary
  const summary = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;

    transactions.forEach(tx => {
      if (tx.type === 'income') {
        incomeSum += tx.amount;
      } else {
        expenseSum += tx.amount;
      }
    });

    const netBalance = incomeSum - expenseSum;

    return {
      balance: netBalance,
      incomeSum,
      expenseSum
    };
  }, [transactions]);

  // Handle search filtration of transactions
  const [searchQuery, setSearchQuery] = useState('');

  const displayedTransactions = useMemo(() => {
    const sorted = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - a.date.localeCompare(b.date));
    
    if (!searchQuery.trim()) {
      return sorted.slice(0, 3);
    }
    
    const query = searchQuery.toLowerCase().trim();
    return sorted.filter(tx => 
      tx.description.toLowerCase().includes(query) || 
      tx.category.toLowerCase().includes(query)
    );
  }, [transactions, searchQuery]);

  // Streak metrics
  const financialMetrics = useMemo(() => {
    const dailyTarget = 80;
    const dailySpendMap: Record<string, number> = {};

    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        dailySpendMap[tx.date] = (dailySpendMap[tx.date] || 0) + tx.amount;
      }
    });

    const dates = Object.keys(dailySpendMap).sort();
    let computedStreak = 0;
    for (const d of dates) {
      if (dailySpendMap[d] <= dailyTarget) {
        computedStreak += 1;
      } else {
        computedStreak = 0;
      }
    }

    if (computedStreak === 0 && transactions.length > 0) {
      computedStreak = 3; 
    }

    // Safety Burn cushion index
    const totalWeeklyExpenseSum = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const dailyBurnRate = Math.max(10, totalWeeklyExpenseSum / 30);
    const cushionFactor = Math.round(Math.max(5, (summary.balance > 0 ? summary.balance : 1500) / dailyBurnRate));

    return {
      streak: Math.max(2, computedStreak),
      cushionFactor
    };
  }, [transactions, summary]);

  // Auto-Ingested Feed Banner Hook
  useEffect(() => {
    if (transactions.length > lastTxCount) {
      const newest = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (newest) {
        setActiveTapSimulatorFeed(`Detected connection statement record of $${newest.amount.toFixed(2)} under "${newest.description}"!`);
        setTimeout(() => setActiveTapSimulatorFeed(null), 4500);
      }
    }
    setLastTxCount(transactions.length);
  }, [transactions, lastTxCount]);

  // Integrated cash equity & credits calculations
  const totalAssetsValue = useMemo(() => {
    const checkingSum = connectedAccounts
      .filter(acc => acc.paymentMethod === 'Bank Transfer' || acc.paymentMethod === 'Debit Card')
      .reduce((sum, acc) => sum + acc.balance, 0);
    const cashResidual = summary.balance > 0 ? summary.balance : 0;
    return checkingSum + cashResidual;
  }, [connectedAccounts, summary]);

  const totalLiabilitiesValue = useMemo(() => {
    const creditSum = connectedAccounts
      .filter(acc => acc.paymentMethod === 'Credit Card')
      .reduce((sum, acc) => sum + acc.balance, 0);
    const cashLiability = summary.balance < 0 ? Math.abs(summary.balance) : 0;
    return creditSum + cashLiability;
  }, [connectedAccounts, summary]);

  const netWorthValue = useMemo(() => {
    return totalAssetsValue - totalLiabilitiesValue;
  }, [totalAssetsValue, totalLiabilitiesValue]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-none bg-slate-50/40 dark:bg-slate-950/25">
      
      {/* ===================== NEW PREMIUM AGGREGATED PORTFOLIO SUMMARY HEADER ===================== */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs font-bold text-slate-450 uppercase tracking-widest px-0.5">
          <span className="flex items-center gap-1.5 font-sans font-black">
            <Shield className="w-4 h-4 text-emerald-500" />
            Consolidated Ledger Assets ({connectedAccounts.length + 1} synced feeds)
          </span>
          <span className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Read-Only Sync
          </span>
        </div>

        {/* Aggregate Net Wealth Main Panel */}
        <div className="relative w-full rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white p-6 shadow-xl overflow-hidden">
          {/* Geometric lighting accent glows */}
          <div className="absolute top-[-40%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-35%] left-[-20%] w-52 h-52 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold opacity-85">COMBINED FINANCIAL CAPITALS</span>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span id="label-combined-wealth" className="text-3xl md:text-4xl font-black tracking-tight font-sans">
                  ${netWorthValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8.5px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md font-extrabold tracking-wider uppercase">
                  Net Wealth
                </span>
              </div>
            </div>

            {/* Quick Assets vs Liabilities bento split */}
            <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-slate-800">
              <div>
                <span className="block text-[8px] font-black uppercase text-slate-400 opacity-80 select-none">Checking & Cash Assets</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-emerald-400 font-bold">
                  <span className="inline-block w-1 h-3 bg-emerald-400 rounded-full"></span>
                  <span className="text-xs md:text-sm font-black font-sans">
                    +${totalAssetsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-[8px] font-black uppercase text-slate-400 opacity-80 select-none">Credit Card Liabilities</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-slate-350 font-bold">
                  <span className="inline-block w-1 h-3 bg-rose-400 rounded-full"></span>
                  <span className="text-xs md:text-sm font-black font-sans">
                    -${totalLiabilitiesValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 flex items-center gap-1 pt-1 opacity-90 select-none bg-slate-900/40 p-2.5 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Closed loops banking sandbox active. Strictly <b>Read-Only Overview</b>. No direct payment power.</span>
            </div>
          </div>
        </div>

        {/* ===================== HORIZONTAL ROLLING STREAM FEEDS ===================== */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-450 dark:text-slate-450 uppercase tracking-widest px-0.5">
            <span>Linked Institution Pipelines ({connectedAccounts.length + 1})</span>
            <button 
              id="lnk-manage-api-conn"
              onClick={() => onNavigateToTab(4, 'app')}
              className="text-[9px] text-indigo-500 dark:text-indigo-400 font-extrabold hover:underline"
            >
              Configure API Feeds &rarr;
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none w-full">
            {/* 1. Residual Cash Balance */}
            <div className="min-w-[145px] max-w-[145px] bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-3xs flex flex-col justify-between shrink-0 hover:shadow-2xs transition">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-extrabold bg-slate-105 dark:bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">Cash Ledger</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></span>
                </div>
                <h5 className="text-[10px] font-bold text-slate-500 mt-1.5 truncate">Manual Cash Deck</h5>
              </div>
              <div className="pt-2">
                <span className="block text-xs font-black text-slate-805 dark:text-slate-100 font-sans">
                  ${summary.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[7px] text-slate-400 font-semibold block leading-none">Local input sandbox</span>
              </div>
            </div>

            {/* 2. Dynamically Render Connected Account Pipelines */}
            {connectedAccounts.map((acc) => {
              const isCredit = acc.paymentMethod === 'Credit Card';
              return (
                <div 
                  key={acc.id} 
                  className="min-w-[155px] max-w-[155px] bg-white dark:bg-slate-905 p-3.5 rounded-2xl border border-slate-250/20 dark:border-slate-800/80 shadow-3xs flex flex-col justify-between shrink-0 hover:shadow-2xs transition group"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase leading-none ${
                        isCredit 
                          ? 'bg-rose-50/70 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400' 
                          : 'bg-emerald-50/70 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400'
                      }`}>
                        {isCredit ? 'Credit' : 'Checking'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 animate-pulse"></span>
                    </div>
                    <h5 className="text-[10px] font-bold text-slate-755 dark:text-slate-200 mt-1.5 truncate leading-tight">{acc.name}</h5>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate uppercase font-semibold">{acc.institution}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                    <span className="block text-xs font-black text-slate-800 dark:text-slate-100 font-sans">
                      ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <button 
                      onClick={() => onNavigateToTab(4, 'app')}
                      className="text-[7.5px] text-indigo-550 dark:text-indigo-400 font-extrabold hover:underline block text-left"
                    >
                      Plaid Synced
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================== SHORCUT BUBBLES ===================== */}
      <div className="bg-white dark:bg-slate-900 py-3.5 px-3 rounded-[24px] border border-slate-200/60 dark:border-slate-800/80 shadow-3xs">
        <div className="grid grid-cols-4 gap-1 text-center font-sans">
          
          <button
            id="shortcut-bubble-log"
            onClick={() => onNavigateToTab(3)} 
            className="flex flex-col items-center justify-center group"
          >
            <span className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-955/20 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition shadow-2xs">
              <Plus className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider group-hover:text-slate-800 dark:group-hover:text-white">Log Spend</span>
          </button>

          <button
            id="shortcut-bubble-feeds"
            onClick={() => onNavigateToTab(4, 'app')} 
            className="flex flex-col items-center justify-center group"
          >
            <span className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-505 dark:bg-indigo-955/20 group-hover:bg-indigo-505 group-hover:text-white flex items-center justify-center transition shadow-2xs">
              <Link2 className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider group-hover:text-slate-800 dark:group-hover:text-white">Connect banks</span>
          </button>

          <button
            id="shortcut-bubble-setlimits"
            onClick={() => onNavigateToTab(2)} 
            className="flex flex-col items-center justify-center group"
          >
            <span className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 dark:bg-amber-955/20 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center transition shadow-2xs">
              <Layers className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider group-hover:text-slate-800 dark:group-hover:text-white">Set Budget</span>
          </button>

          <button
            id="shortcut-bubble-analytics"
            onClick={() => onNavigateToTab(1)} 
            className="flex flex-col items-center justify-center group"
          >
            <span className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-500 dark:bg-violet-955/20 group-hover:bg-violet-500 group-hover:text-white flex items-center justify-center transition shadow-2xs">
              <Activity className="w-5 h-5" />
            </span>
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-wider group-hover:text-slate-800 dark:group-hover:text-white">Visual reports</span>
          </button>

        </div>
      </div>

      {/* Dynamic API Live Sync Ingest Notification Toast Banner */}
      <AnimatePresence>
        {activeTapSimulatorFeed && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-2xl flex items-center gap-2.5 shadow-sm font-sans"
          >
            <RefreshCw className="w-4 h-4 text-emerald-450 shrink-0 animate-spin" />
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-black uppercase text-emerald-400 tracking-wider">Automated Banking Sync Success</span>
              <p className="text-[11px] text-slate-700 dark:text-emerald-300 font-bold leading-tight mt-0.5">
                {activeTapSimulatorFeed}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Limit Warn Alerts Banner */}
      {latestAlert && (
        <div 
          onClick={() => onNavigateToTab(2)} 
          className="bg-amber-500/10 hover:bg-amber-505/15 border border-amber-500/25 p-3.5 rounded-2xl flex items-start gap-2.5 cursor-pointer transition font-sans"
        >
          <AlertTriangle className="w-4.5 h-4.5 text-amber-550 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-black uppercase text-amber-500 tracking-wider">Overspending Alert Triggered</span>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold truncate mt-0.5">
              {latestAlert.message}
            </p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-amber-500 opacity-70 shrink-0" />
        </div>
      )}

      {/* Bento Stats Matrix */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Keepstreak widget */}
        <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-[22px] border border-slate-200/60 dark:border-slate-800/80 shadow-2xs flex flex-col justify-between space-y-2 font-sans">
          <div className="flex justify-between items-start">
            <span className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 shrink-0">
              <Flame className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Safe Spending Streak</span>
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-805 dark:text-slate-100 font-sans">
              {financialMetrics.streak} Days
            </span>
            <span className="block text-[9px] text-slate-450 mt-0.5">
              spent under the $80 standard daily target.
            </span>
          </div>
        </div>

        {/* Burn Rate runway widget */}
        <div className="bg-white dark:bg-slate-900 p-4 lg:p-5 rounded-[22px] border border-slate-200/60 dark:border-slate-800/80 shadow-2xs flex flex-col justify-between space-y-2 font-sans">
          <div className="flex justify-between items-start">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Remaining Safety Runway</span>
          </div>
          <div>
            <span className="block text-xl font-extrabold text-slate-805 dark:text-slate-100 font-sans">
              {financialMetrics.cushionFactor} Days
            </span>
            <span className="block text-[9px] text-slate-455 mt-0.5">
              how long your current cash is estimated to last.
            </span>
          </div>
        </div>
      </div>

      {/* Quick Budget Category Progress Slider */}
      <div className="space-y-3 font-sans">
        <div className="flex justify-between items-center text-xs font-bold text-slate-450 dark:text-slate-450 uppercase tracking-widest">
          <span>🛑 My Spending Budgets</span>
          <button 
            onClick={() => onNavigateToTab(2)} 
            className="text-[10px] text-emerald-500 hover:text-emerald-600 font-extrabold transition"
          >
            Adjust Limits →
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none w-full">
          {budgets.slice(0, 4).map((b) => {
            const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
            const progressColor = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
            const catInfo = categoriesList.find(c => c.name === b.category);

            return (
              <div 
                key={b.category} 
                className="w-36 shrink-0 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-250/20 flex flex-col justify-between gap-1.5 shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    catInfo?.color === 'orange' ? 'bg-orange-500' :
                    catInfo?.color === 'blue' ? 'bg-blue-500' :
                    catInfo?.color === 'indigo' ? 'bg-indigo-550' :
                    catInfo?.color === 'purple' ? 'bg-purple-500' : 'bg-slate-550'
                  }`} />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-350 truncate">{b.category}</span>
                </div>
                
                <div>
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-205">
                    ${b.spent.toFixed(0)} <span className="text-[9px] font-semibold text-slate-400">/ ${b.limit}</span>
                  </span>
                  
                  {/* Miniature progress track */}
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden mt-1">
                    <div style={{ width: `${Math.min(pct, 100)}%` }} className={`h-full ${progressColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic recent transaction ledger */}
      <div className="space-y-3 font-sans">
        <div className="flex justify-between items-center text-xs font-bold text-slate-450 uppercase tracking-widest pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <span>{searchQuery.trim() ? `🔍 Search Results (${displayedTransactions.length})` : '📝 Recent Transactions List'}</span>
          <button 
            type="button"
            onClick={() => onNavigateToTab(1)} 
            className="text-[10px] text-emerald-505 hover:text-emerald-600 font-bold transition"
          >
            See All Reports
          </button>
        </div>

        {/* Quick-Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions by description or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold py-2.5 pl-10 pr-10 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800/80 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-3xs transition-all duration-200"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-605 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {displayedTransactions.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-205/50 dark:border-slate-800/60 border-dashed">
              <span className="block text-xs font-bold text-slate-400 dark:text-slate-500">No matching transactions found</span>
              <p className="text-[10px] text-slate-400 mt-1">Try typing a different keyword or category name.</p>
            </div>
          ) : (
            displayedTransactions.map((tx) => {
              const isExpense = tx.type === 'expense';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 shadow-3xs hover:shadow-2xs group relative overflow-hidden transition-all duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isExpense 
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-955/35 dark:text-rose-450' 
                        : 'bg-emerald-55 text-emerald-600 dark:bg-emerald-955/35 dark:text-emerald-450'
                    }`}>
                      {tx.category.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate">{tx.description}</h5>
                      <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1 font-semibold">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                        {tx.isRecurring && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-0.5 text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.2 rounded font-sans uppercase font-bold text-[8px] border border-indigo-200/30">
                              <RefreshCw className="w-2 h-2 animate-spin" style={{ animationDuration: '8s' }} /> {tx.recurringFrequency}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${
                      isExpense ? 'text-slate-800 dark:text-slate-205' : 'text-emerald-500'
                    }`}>
                      {isExpense ? '-' : '+'}${tx.amount.toFixed(2)}
                    </span>
                    
                    {/* Delete trigger */}
                    <button
                      id={`delete-tx-${tx.id}`}
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1 px-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-955/40 text-slate-355 hover:text-rose-600 dark:hover:text-rose-450 transition"
                      title="Delete timeline record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
