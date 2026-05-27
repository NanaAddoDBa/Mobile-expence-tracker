import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { 
  Search, 
  ArrowUpDown, 
  Filter, 
  ChevronRight, 
  Calendar, 
  Bookmark, 
  FlameKindling, 
  Info,
  Activity,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Shield,
  Briefcase,
  PiggyBank,
  Percent,
  Coins,
  ArrowUpRight,
  Flame,
  Award
} from 'lucide-react';

interface AnalyticsPanelProps {
  transactions: Transaction[];
  categoriesList?: typeof INITIAL_CATEGORIES;
}

export default function AnalyticsPanel({ transactions, categoriesList = INITIAL_CATEGORIES }: AnalyticsPanelProps) {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [activeDonutSlice, setActiveDonutSlice] = useState<string | null>(null);

  // AI Investment Advisor & Wealth Engine States
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'advisor'>('analytics');
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [advisorGoalName, setAdvisorGoalName] = useState<string>('Retirement Fund');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('350');
  const [holdingDurationYears, setHoldingDurationYears] = useState<number>(10);


  // Group transaction amounts by category (for Expenses only)
  const expenseTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [expenseTransactions]);

  // Dynamic Surplus calculation:
  const financialSurplus = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    transactions.forEach(t => {
      if (t.type === 'income') incomeSum += t.amount;
      else expenseSum += t.amount;
    });
    const monthlySurplus = Math.max(0, incomeSum - expenseSum);
    return {
      incomeSum,
      expenseSum,
      monthlySurplus,
    };
  }, [transactions]);

  // Advisor compound return projection calculations
  const investmentCompound = useMemo(() => {
    const PMT = parseFloat(monthlyContribution) || 0;
    const years = Math.max(1, Math.min(50, holdingDurationYears));
    
    // Custom historical annual yields based on profile risk appetite selection
    const annualRate = riskProfile === 'conservative' ? 0.050 : riskProfile === 'balanced' ? 0.075 : 0.100;
    
    const r = annualRate / 12;
    const totalMonths = years * 12;
    
    let compoundValue = 0;
    let principalPaid = 0;
    
    for (let i = 0; i < totalMonths; i++) {
      principalPaid += PMT;
      compoundValue = (compoundValue + PMT) * (1 + r);
    }
    
    const interestEarned = Math.max(0, compoundValue - principalPaid);
    
    return {
      principalPaid,
      totalCompounded: compoundValue,
      interestEarned,
      annualRatePct: (annualRate * 100).toFixed(1)
    };
  }, [riskProfile, monthlyContribution, holdingDurationYears]);


  const categoryTotals = useMemo(() => {
    const totals: { [key in Category]?: number } = {};
    const counts: { [key in Category]?: number } = {};
    
    expenseTransactions.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
      counts[t.category] = (counts[t.category] || 0) + 1;
    });

    return Object.keys(totals).map(catName => {
      const name = catName as Category;
      const amount = totals[name] || 0;
      const count = counts[name] || 0;
      const config = categoriesList.find(c => c.name === name);
      return {
        name,
        amount,
        count,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: config?.color || 'slate',
        accentColorHex: 
          config?.color === 'orange' ? '#f97316' :
          config?.color === 'blue' ? '#3b82f6' :
          config?.color === 'indigo' ? '#6366f1' :
          config?.color === 'purple' ? '#a855f7' :
          config?.color === 'pink' ? '#ec4899' :
          config?.color === 'rose' ? '#f43f5e' :
          config?.color === 'cyan' ? '#06b6d4' :
          config?.color === 'teal' ? '#14b8a6' : '#64748b'
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [expenseTransactions, totalExpense, categoriesList]);

  // Calculations for temporal trends (last 7 days mapping up to 2026-05-24)
  const lastSevenDays = useMemo(() => {
    const days = [];
    const dateCursor = new Date('2026-05-24');
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(dateCursor);
      d.setDate(dateCursor.getDate() - i);
      const isoString = d.toISOString().split('T')[0];
      days.push({
        dateStr: isoString,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: 0
      });
    }

    // Populate day sums
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const itemDay = days.find(d => d.dateStr === t.date);
        if (itemDay) {
          itemDay.total += t.amount;
        }
      }
    });

    const maxAmt = Math.max(...days.map(d => d.total), 50);

    return days.map(d => ({
      ...d,
      heightPercentage: (d.total / maxAmt) * 100
    }));
  }, [transactions]);

  // Filtered and sorted transactions list for records browse
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    if (filterCategory !== 'All') {
      result = result.filter(t => t.category === filterCategory);
    }

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, filterCategory, searchText, sortBy]);

  // Build the SVG donut elements safely
  const donutSegments = useMemo(() => {
    let cumulativePercent = 0;
    const radius = 55;
    const strokeWidth = 14;
    const circ = 2 * Math.PI * radius; // ~345.57

    return categoryTotals.map((cat) => {
      const percent = cat.percentage;
      const strokeLength = (percent / 100) * circ;
      const strokeOffset = circ - strokeLength + (cumulativePercent / 100) * circ;
      
      const segmentData = {
        ...cat,
        strokeLength,
        strokeOffset: -strokeOffset, // SVG stroke dashoffset is often negative for clockwise
        circ
      };

      cumulativePercent += percent;
      return segmentData;
    });
  }, [categoryTotals]);

  // Average Transaction Spend Size
  const statsOverview = useMemo(() => {
    const expCount = expenseTransactions.length;
    return {
      avgSize: expCount > 0 ? (totalExpense / expCount).toFixed(2) : '0.00',
      activeCategories: categoryTotals.length,
      topSpender: categoryTotals[0]?.name || 'None'
    };
  }, [expenseTransactions, totalExpense, categoryTotals]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      
      {/* ===================== PREMIUM NAVIGATION TAB TOGGLE ===================== */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200/55 dark:border-slate-800/80 shadow-3xs select-none">
        <button
          id="btn-subtab-analytics"
          onClick={() => setActiveSubTab('analytics')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSubTab === 'analytics'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-3xs border border-slate-200/50 dark:border-slate-850/60'
              : 'text-slate-400 hover:text-slate-650 dark:text-slate-550 dark:hover:text-slate-350'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          Purchase Analytics
        </button>
        <button
          id="btn-subtab-advisor"
          onClick={() => setActiveSubTab('advisor')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSubTab === 'advisor'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-3xs border border-slate-200/50 dark:border-slate-850/60'
              : 'text-slate-400 hover:text-slate-650 dark:text-slate-550 dark:hover:text-slate-350'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          AI Investment Advisor
        </button>
      </div>

      {activeSubTab === 'analytics' ? (
        <>
          {/* Visual Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        
        {/* SVG Donut Interactive Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/60 dark:border-slate-800/85 shadow-3xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Expense Allocation</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Tap segments to view breakdown proportions.</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold">
              ${totalExpense.toFixed(2)} Vol
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* Donut SVG Engine */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              {totalExpense > 0 ? (
                <>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                    <circle 
                      cx="70" 
                      cy="70" 
                      r="55" 
                      fill="transparent" 
                      className="stroke-slate-50 dark:stroke-slate-900"
                      strokeWidth="14" 
                    />
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.name}
                        cx="70"
                        cy="70"
                        r="55"
                        fill="transparent"
                        stroke={seg.accentColorHex}
                        strokeWidth={activeDonutSlice === seg.name ? '18' : '14'}
                        strokeDasharray={seg.circ}
                        strokeDashoffset={seg.strokeOffset}
                        strokeLinecap="round"
                        onMouseEnter={() => setActiveDonutSlice(seg.name)}
                        onMouseLeave={() => setActiveDonutSlice(null)}
                        onClick={() => setActiveDonutSlice(activeDonutSlice === seg.name ? null : seg.name)}
                        className="cursor-pointer transition-all duration-300 hover:opacity-90"
                      />
                    ))}
                  </svg>
                  {/* Absolute Center Content */}
                  <div className="absolute flex flex-col items-center justify-center select-none text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {activeDonutSlice ? activeDonutSlice.slice(0, 11) : 'Total spent'}
                    </span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      ${activeDonutSlice 
                        ? (categoryTotals.find(c => c.name === activeDonutSlice)?.amount || 0).toFixed(2)
                        : totalExpense.toFixed(0)
                      }
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full mt-0.5">
                      {activeDonutSlice 
                        ? `${(categoryTotals.find(c => c.name === activeDonutSlice)?.percentage || 0).toFixed(1)}%`
                        : '100%'
                      }
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-xs text-slate-400 px-4">No active expenses recorded to diagram.</div>
              )}
            </div>

            {/* Categorized legend listing */}
            <div className="flex-1 space-y-2 w-full max-w-xs">
              {categoryTotals.slice(0, 4).map((cat) => (
                <div 
                  key={cat.name} 
                  onClick={() => setActiveDonutSlice(activeDonutSlice === cat.name ? null : cat.name)}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition ${
                    activeDonutSlice === cat.name ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200/50' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: cat.accentColorHex }} 
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px] sm:max-w-none">
                      {cat.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">${cat.amount.toFixed(2)}</span>
                    <span className="block text-[9px] font-mono text-slate-400">{cat.percentage.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
              {categoryTotals.length > 4 && (
                <div className="text-center text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  + {categoryTotals.length - 4} more spending streams
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Temporal Weekly Column chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/60 dark:border-slate-800/85 shadow-3xs">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Daily Spending Pulse</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4">Daily cash outflows over past 7 calendar days.</p>
          </div>

          <div className="flex items-end justify-between h-36 gap-2 pt-2 border-b border-slate-100 dark:border-slate-800/80 px-2">
            {lastSevenDays.map((day) => (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Floating tooltip hover effect */}
                <div className="absolute bottom-[105%] bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 text-[10px] font-bold py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-md z-20">
                  ${day.total.toFixed(2)}
                </div>

                {/* Vertical Bar gauge */}
                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-900 rounded-t-lg overflow-hidden h-full flex items-end">
                  <div 
                    style={{ height: `${day.heightPercentage}%` }}
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      day.total > 150 
                        ? 'bg-rose-500' 
                        : day.total > 50 
                        ? 'bg-indigo-500' 
                        : day.total > 0 
                        ? 'bg-emerald-500' 
                        : 'bg-transparent'
                    }`}
                  />
                </div>

                {/* Day notation label */}
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 pb-1.5 select-none">
                  {day.dayName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-[20px] border border-slate-100 dark:border-slate-850">
        <div className="text-center">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Average Purchase</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">${statsOverview.avgSize}</span>
        </div>
        <div className="text-center border-x border-slate-200/55 dark:border-slate-800/60">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sans">Places I Shop</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{statsOverview.activeCategories}</span>
        </div>
        <div className="text-center">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Biggest Spend Category</span>
          <span className="text-[11px] font-extrabold text-amber-500 truncate block mt-0.5 max-w-full px-1">{statsOverview.topSpender}</span>
        </div>
      </div>

      {/* Transaction Records Browser with Filters */}
      <div className="space-y-4">
        {/* Controls block */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4.5 h-4.5 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">🔎 Search for Purchases</h4>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Text Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="search-transactions-input"
                type="text"
                placeholder="Type name of any shop or purchase..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Sorting trigger dropdown */}
            <div className="flex gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <ArrowUpDown className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <select
                  id="sort-transactions-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full pl-8 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-300"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Horizontal scrollable category pill filtering */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              id="filter-category-all"
              onClick={() => setFilterCategory('All')}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg shrink-0 transition ${
                filterCategory === 'All'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              All Shops & Bills
            </button>
            {INITIAL_CATEGORIES.map((cat) => (
              <button
                id={`filter-category-${cat.name.toLowerCase().replace(/ & /g, '-')}`}
                key={cat.name}
                onClick={() => setFilterCategory(cat.name)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg shrink-0 transition ${
                  filterCategory === cat.name
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {processedTransactions.length > 0 ? (
            processedTransactions.map((tx) => {
              const info = categoriesList.find(c => c.name === tx.category);
              const isExpense = tx.type === 'expense';
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200/50 dark:border-slate-850 shadow-3xs hover:border-slate-300 dark:hover:border-slate-750 transition duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isExpense 
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450' 
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450'
                    }`}>
                      {tx.category.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{tx.description}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> {tx.date}
                        </span>
                        <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.2 rounded font-semibold">
                          {tx.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className={`text-xs font-mono font-bold ${
                      isExpense ? 'text-slate-800 dark:text-slate-200' : 'text-emerald-500'
                    }`}>
                      {isExpense ? '-' : '+'}${tx.amount.toFixed(2)}
                    </span>
                    {tx.tags && tx.tags.length > 0 && (
                      <span className="block text-[8px] text-slate-400 font-medium">
                        #{tx.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              Cannot find any purchases matching that search word. Try a different one!
            </div>
          )}
        </div>
      </div>
    </>
      ) : (
        /* ===================== NEW INVESTMENT AND ADVISORY SUITE ===================== */
        <div className="space-y-6">
          
          {/* Wealth Health Stats Summary bar */}
          <div className="bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-transparent border border-indigo-200/40 dark:border-indigo-900/40 p-5 rounded-[24px]">
            <div className="flex justify-between items-center pb-3 border-b border-indigo-200/20 dark:border-indigo-900/20">
              <div className="flex items-center gap-2 select-none">
                <Award className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-sans">Financial Advisor Status</h4>
                  <h5 className="text-xs font-black text-slate-850 dark:text-slate-100">Dynamic Bank-Linked Cash Analysis</h5>
                </div>
              </div>
              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                Stable Strategy Activated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3.5 select-none text-left">
              <div>
                <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider font-sans">30-Day Cash Surplus</span>
                <span className={`text-lg font-black tracking-tight font-sans ${financialSurplus.monthlySurplus > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  ${financialSurplus.monthlySurplus.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal font-sans">
                  Surplus rate: <b className="font-mono text-slate-600 dark:text-slate-350">
                    {financialSurplus.incomeSum > 0 ? ((financialSurplus.monthlySurplus / financialSurplus.incomeSum) * 100).toFixed(0) : '0'}%
                  </b> of connected income.
                </p>
              </div>

              <div>
                <span className="block text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">Cushion Recommendation</span>
                <span className="text-lg font-black text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-1 font-sans">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  3-6 Months Liquid
                </span>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  Target <b className="font-mono text-slate-605 dark:text-slate-350">${(financialSurplus.expenseSum * 3).toFixed(0)}</b> in a liquid sweep as secure cushion.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Risk Tolerance / Allocation Selector */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/60 dark:border-slate-800/80 space-y-4">
            <div className="space-y-0.5 select-none text-left">
              <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 font-sans">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Select Investment Risk Appetite
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal">Choose your level of comfort with market fluctuations. This adapts model asset recommendations & compounding projections.</p>
            </div>

            {/* Custom Interactive Profile Selector Switches */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'conservative', label: '🛡️ Conservative', rate: '5.0%', desc: 'Cash sweeps & short treasury bonds' },
                { key: 'balanced', label: '⚖️ Balanced', rate: '7.5%', desc: 'resilient index equity & debt mix' },
                { key: 'aggressive', label: '🚀 Aggressive', rate: '10.0%', desc: 'broad equities & tech growth' }
              ].map((p) => (
                <button
                  key={p.key}
                  id={`btn-risk-${p.key}`}
                  onClick={() => setRiskProfile(p.key as any)}
                  className={`p-2.5 rounded-xl border text-center flex flex-col justify-between transition-all duration-300 ${
                    riskProfile === p.key
                      ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-105 dark:border-slate-100 dark:text-slate-950 shadow-md scale-[1.03]'
                      : 'bg-slate-50 border-slate-200/60 dark:bg-slate-950 dark:border-slate-850 text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <span className="block text-[10px] font-black">{p.label}</span>
                  <span className={`block text-[8px] font-semibold mt-1 uppercase ${riskProfile === p.key ? 'text-emerald-300 dark:text-emerald-700' : 'text-emerald-500'}`}>
                    {p.rate} Target Yield
                  </span>
                </button>
              ))}
            </div>

            {/* Dynamic visual asset allocations matching selected profile */}
            <div className="space-y-3 pt-2 text-left">
              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider select-none font-sans">Model Allocation Portfolio:</span>
              
              <div className="space-y-2.5">
                {riskProfile === 'conservative' && (
                  <>
                    {[
                      { percent: 60, name: 'High-Yield Reserve Sweeps', yield: '4.85% APY', desc: 'Secure cash sweeps, bank backed.', col: 'bg-emerald-550' },
                      { percent: 30, name: 'Short-Term Sovereign Bonds', yield: '5.05% YTM', desc: 'Secure sovereign state treasury yields.', col: 'bg-indigo-500' },
                      { percent: 10, name: 'S&P 500 Equity Index Funds', yield: 'VOO ETF', desc: 'Direct safe proxy tracking the top 500 US enterprise brands.', col: 'bg-violet-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1 font-sans">
                        <div className="flex justify-between items-baseline text-[10px] font-extrabold text-slate-800 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 min-w-0 font-sans">
                            <span className={`w-2 h-2 rounded-full ${item.col} shrink-0`} />
                            {item.name} <span className="text-[8px] text-slate-405 font-mono font-normal">({item.yield})</span>
                          </span>
                          <span className="shrink-0">{item.percent}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div style={{ width: `${item.percent}%` }} className={`h-full ${item.col} rounded-full`} />
                        </div>
                        <p className="text-[8px] text-slate-400 truncate normal-case">{item.desc}</p>
                      </div>
                    ))}
                  </>
                )}

                {riskProfile === 'balanced' && (
                  <>
                    {[
                      { percent: 30, name: 'High-Yield Liquidity Sweeps', yield: '4.85% APY', col: 'bg-emerald-500' },
                      { percent: 20, name: 'Inflation-Buffered Sovereign Debt', yield: 'TIP / US Treasuries', col: 'bg-indigo-300' },
                      { percent: 45, name: 'Vanguard World Stock ETF Basket', yield: 'VT / VTI Equities', col: 'bg-indigo-650' },
                      { percent: 5, name: 'Enterprise Dividend Aristocrats', yield: 'SCHD Index Tracker', col: 'bg-pink-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1 font-sans">
                        <div className="flex justify-between items-baseline text-[10px] font-extrabold text-slate-800 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 min-w-0 font-sans">
                            <span className={`w-2 h-2 rounded-full ${item.col} shrink-0`} />
                            {item.name} <span className="text-[8px] text-slate-405 font-mono font-normal">({item.yield})</span>
                          </span>
                          <span className="shrink-0">{item.percent}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div style={{ width: `${item.percent}%` }} className={`h-full ${item.col} rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {riskProfile === 'aggressive' && (
                  <>
                    {[
                      { percent: 10, name: 'Cash Sweeps Reserve Cushion', yield: '4.85% APY', col: 'bg-emerald-500' },
                      { percent: 55, name: 'S&P 500 & Nasdaq 100 Indexes', yield: 'VOO / QQQ Equities', col: 'bg-indigo-600' },
                      { percent: 25, name: 'Vanguard FTSE World Stock Index', yield: 'VXUS ETF Tracker', col: 'bg-pink-500' },
                      { percent: 10, name: 'Future Thematic Technology Techs', yield: 'Clean Energy & AI sectors', col: 'bg-amber-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1 font-sans">
                        <div className="flex justify-between items-baseline text-[10px] font-extrabold text-slate-805 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 min-w-0 font-sans">
                            <span className={`w-2 h-2 rounded-full ${item.col} shrink-0`} />
                            {item.name} <span className="text-[8px] text-slate-400 font-mono font-normal">({item.yield})</span>
                          </span>
                          <span className="shrink-0">{item.percent}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                          <div style={{ width: `${item.percent}%` }} className={`h-full ${item.col} rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Goals compound calculator simulator */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-205/50 dark:border-slate-800/80 space-y-4">
            <h4 className="text-xs font-black uppercase text-[#E07A5F] dark:text-[#FFA6C9] tracking-wider flex items-center gap-1.5 select-none font-sans text-left">
              <PiggyBank className="w-4.5 h-4.5 text-indigo-505" />
              Interactive AI Long-Term Goal Compounder
            </h4>
            
            <p className="text-[10px] text-slate-400 leading-normal select-none text-left">
              Model your savings compound trajectory at average historical annual returns of <b>{investmentCompound.annualRatePct}% APY</b>:
            </p>

            {/* Input Suite */}
            <div className="grid grid-cols-2 gap-3.5 text-left font-sans">
              <div className="space-y-1 text-left">
                <label className="block text-[9px] uppercase font-bold text-slate-400 font-sans">Target Asset Goal</label>
                <input
                  type="text"
                  id="advisor-goal-input"
                  value={advisorGoalName}
                  onChange={(e) => setAdvisorGoalName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold leading-tight bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-400"
                  placeholder="e.g. Retirement Goal"
                />
              </div>

              <div className="space-y-1 text-left text-sans">
                <label className="block text-[9px] uppercase font-bold text-slate-405 font-sans">Monthly Contribution ($)</label>
                <input
                  type="number"
                  id="advisor-contrib-input"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(1, parseFloat(e.target.value) || 0).toString())}
                  className="w-full px-3 py-2 text-xs font-mono font-bold leading-tight bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-850 dark:text-slate-100 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Hold Duration slider */}
            <div className="space-y-2 pt-1 font-sans text-left select-none">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-850 dark:text-slate-205">
                <span className="uppercase tracking-wider">Duration to Compound</span>
                <span className="font-mono text-indigo-550 dark:text-indigo-400">{holdingDurationYears} Years</span>
              </div>
              <input
                type="range"
                id="advisor-duration-range"
                min="1"
                max="40"
                value={holdingDurationYears}
                onChange={(e) => setHoldingDurationYears(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Wealth Outcome display Card */}
            <div className="bg-slate-50 dark:bg-slate-955/60 p-4 rounded-xl border border-slate-200/50 dark:border-slate-850 select-none text-left">
              <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none font-sans">AI Projected Holding Yield ({advisorGoalName || 'Portfolio'})</span>
              
              <div className="flex items-baseline gap-2 mt-2 font-sans">
                <span className="text-xl font-black text-indigo-505 dark:text-indigo-400 tracking-tight">
                  ${investmentCompound.totalCompounded.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                  +{investmentCompound.annualRatePct}% Compound APY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-205/60 dark:border-slate-850/80 text-[10px] leading-relaxed">
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase">Standard Self Deposits</span>
                  <p className="font-mono text-slate-700 dark:text-slate-350 font-bold">${investmentCompound.principalPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-emerald-500 uppercase">Compound Savings Interest Growth</span>
                  <p className="font-mono text-emerald-500 dark:text-emerald-400 font-extrabold">+${investmentCompound.interestEarned.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>

            {/* Financial advisor info box */}
            <div className="flex gap-2 p-3 bg-indigo-500/5 text-slate-500 dark:text-slate-400 text-[10px] rounded-xl border border-indigo-500/15 leading-relaxed text-left font-sans select-none">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p>
                <b>AI Advisor Guideline:</b> Compounding is the most effective tool to grow capital in financial platforms. By allocating a dynamic portion of your safety surplus of <b>${financialSurplus.monthlySurplus.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b>, your assets could significantly expand over static holding.
              </p>
            </div>

          </div>

          {/* Secure product recommendations */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/50 dark:border-slate-805 space-y-3.5 select-none text-left">
            <div className="space-y-0.5 text-left">
              <h4 className="text-xs font-black uppercase text-slate-450 tracking-wider flex items-center gap-1.5 font-sans">
                <Percent className="w-4 h-4 text-slate-400" />
                Resilient Vanguard Stock Market Options
              </h4>
              <p className="text-[10px] text-slate-400">Actual financial products frequently recommended by wealth advisors for money management:</p>
            </div>

            <div className="space-y-2 text-[11px]">
              {[
                { name: 'Vanguard S&P 500 ETF (VOO)', type: 'Index Mutual ETF', return: '~10.2% Historic', desc: 'Secure passive proxy tracking the top 500 US companies. High liquidity, extremely low 0.03% expense ratio.' },
                { name: 'Schwab US Dividend Equity (SCHD)', type: 'Dividend Leader ETF', return: '~8.9% Historic', desc: 'Monitors stable dividend appreciation leaders. Provides secure recurring yields.' },
                { name: 'High-Yield Bank Cash Sweep Products', type: 'Fidelity Cash / Treasury Bills', return: '4.85% APY stable', desc: 'Zero market risk. Perfect for securing cash emergency cushion funds.' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-205/40 dark:border-slate-850 flex flex-col justify-between gap-1 text-left">
                  <div className="flex justify-between items-start font-sans">
                    <div>
                      <span className="block font-extrabold text-slate-800 dark:text-slate-250 truncate">{item.name}</span>
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-450 uppercase font-semibold px-1.5 py-0.2 rounded mt-0.5 inline-block">{item.type}</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 font-mono shrink-0">{item.return}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-450 leading-normal normal-case pt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

