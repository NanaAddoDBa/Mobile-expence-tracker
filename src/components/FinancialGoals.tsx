import React, { useState, useMemo } from 'react';
import { Goal, GoalContribution, ConnectedAccount } from '../types';
import { 
  Target, 
  Plus, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  PiggyBank, 
  Info,
  CalendarDays,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FinancialGoalsProps {
  goals: Goal[];
  connectedAccounts: ConnectedAccount[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'contributions' | 'currentAmount'>) => void;
  onDeleteGoal: (id: string, refundAccountId?: string) => void;
  onAllocateFunds: (goalId: string, amount: number, accountId: string, description: string) => void;
  onWithdrawFunds: (goalId: string, amount: number, accountId: string, description: string) => void;
}

const COLOR_MAP = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-100 dark:border-emerald-800/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    glow: 'shadow-emerald-500/10'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-100 dark:border-indigo-800/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    bar: 'bg-indigo-505',
    glow: 'shadow-indigo-505/10'
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-100 dark:border-rose-800/40',
    text: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-505',
    glow: 'shadow-rose-505/10'
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-100 dark:border-violet-800/40',
    text: 'text-violet-600 dark:text-violet-400',
    bar: 'bg-violet-500',
    glow: 'shadow-violet-500/10'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-800/40',
    text: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    glow: 'shadow-amber-500/10'
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    border: 'border-cyan-100 dark:border-cyan-800/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    bar: 'bg-cyan-500',
    glow: 'shadow-cyan-500/10'
  }
};

export default function FinancialGoals({
  goals = [],
  connectedAccounts = [],
  onAddGoal,
  onDeleteGoal,
  onAllocateFunds,
  onWithdrawFunds
}: FinancialGoalsProps) {
  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Savings');
  const [color, setColor] = useState<'emerald' | 'indigo' | 'rose' | 'violet' | 'amber' | 'cyan'>('emerald');

  // Allocation Modal States
  const [activeAllocationGoal, setActiveAllocationGoal] = useState<Goal | null>(null);
  const [allocationMode, setAllocationMode] = useState<'allocate' | 'withdraw'>('allocate');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [allocationNote, setAllocationNote] = useState('');
  
  // Track open histories
  const [expandedHistoryGoalId, setExpandedHistoryGoalId] = useState<string | null>(null);

  // Overall counts and totals
  const totals = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const pct = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    return {
      totalTarget,
      totalCurrent,
      pct,
      count: goals.length
    };
  }, [goals]);

  // Handle Form Sabmit
  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(targetAmount);
    if (!goalName.trim() || isNaN(amountNum) || amountNum <= 0 || !targetDate) {
      return;
    }

    onAddGoal({
      name: goalName.trim(),
      targetAmount: amountNum,
      targetDate,
      category,
      color
    });

    // Reset Form
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setCategory('Savings');
    setColor('emerald');
    setShowAddForm(false);
  };

  // Prefill Goal Presets
  const applyPreset = (presetName: string, amount: number, monthsAhead: number, cat: string, col: typeof color) => {
    setGoalName(presetName);
    setTargetAmount(amount.toString());
    const date = new Date();
    date.setMonth(date.getMonth() + monthsAhead);
    setTargetDate(date.toISOString().split('T')[0]);
    setCategory(cat);
    setColor(col);
  };

  // Calculate dynamics of a goal (date countdown & required saves rate)
  const calculateGoalMetrics = (goal: Goal) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(goal.targetDate + 'T00:00:00');
    
    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const needed = Math.max(0, goal.targetAmount - goal.currentAmount);
    
    let requiredMonthly = 0;
    let requiredDaily = 0;

    if (diffDays > 0) {
      requiredDaily = needed / diffDays;
      requiredMonthly = requiredDaily * 30.437; // average days per month
    }

    return {
      daysRemaining: diffDays,
      monthsRemaining: diffDays > 0 ? parseFloat((diffDays / 30.4).toFixed(1)) : 0,
      needed,
      requiredMonthly,
      requiredDaily,
      completedPercentage: Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
    };
  };

  // Handle submit allocation
  const handleProcessAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAllocationGoal) return;

    const amountNum = parseFloat(allocationAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const targetAccount = connectedAccounts.find(a => a.id === selectedAccountId);
    if (!targetAccount && allocationMode === 'allocate') return;

    const note = allocationNote.trim() || (allocationMode === 'allocate' ? 'Assigned to goals bucket' : 'Released goals budget');

    if (allocationMode === 'allocate') {
      // Validate that account has sufficient balance
      if (targetAccount && targetAccount.balance < amountNum) {
        alert(`Insufficient balance in ${targetAccount.name}. Available is $${targetAccount.balance.toFixed(2)}.`);
        return;
      }
      onAllocateFunds(activeAllocationGoal.id, amountNum, selectedAccountId, note);
    } else {
      // Validate withdraw limit
      if (activeAllocationGoal.currentAmount < amountNum) {
        alert(`Cannot withdraw more than current allocated fund: $${activeAllocationGoal.currentAmount.toFixed(2)}.`);
        return;
      }
      onWithdrawFunds(activeAllocationGoal.id, amountNum, selectedAccountId, note);
    }

    // Reset modals
    setActiveAllocationGoal(null);
    setAllocationAmount('');
    setAllocationNote('');
    setSelectedAccountId('');
  };

  // Pre-fill standard checking / savings account automatically if available
  const triggerOpenAllocationModal = (goal: Goal, mode: 'allocate' | 'withdraw') => {
    setActiveAllocationGoal(goal);
    setAllocationMode(mode);
    
    // Choose the first account with money as default
    if (connectedAccounts.length > 0) {
      const bestDefault = connectedAccounts.find(a => a.paymentMethod === 'Bank Transfer' || a.balance > 0) || connectedAccounts[0];
      setSelectedAccountId(bestDefault.id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      
      {/* 1. Header Overview Metrics Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85 shadow-3xs relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-505/5 dark:bg-emerald-505/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <PiggyBank className="w-3.5 h-3.5 text-emerald-505 shrink-0" />
              Consolidated Smart Financial Goals
            </span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-105">🎯 Fund Allocation Engine</h3>
            <p className="text-xs text-slate-450 leading-relaxed font-semibold max-w-sm">
              Keep your money dedicated to your long-term goals without mixing up checking expenses.
            </p>
          </div>

          <button
            id="btn-add-goal-top"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-505 hover:bg-emerald-450 text-slate-955 text-xs font-black rounded-xl transition shadow-md shadow-emerald-500/10 active:scale-95 border-0 outline-none select-none shrink-0 cursor-pointer"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Close Drawer' : 'New Design Goal'}</span>
          </button>
        </div>

        {/* Totals grids summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800/60 relative z-10">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/30 dark:border-slate-850">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Dedicated Savings</span>
            <span className="text-lg font-black font-sans text-emerald-505 mt-1 block">
              ${totals.totalCurrent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/30 dark:border-slate-850">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Aggregated Targets Limit</span>
            <span className="text-lg font-black font-sans text-slate-700 dark:text-slate-205 mt-1 block">
              ${totals.totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/30 dark:border-slate-850 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overall Progression Index</span>
              <span className="text-[10px] font-black text-emerald-505 font-mono">{totals.pct.toFixed(0)}%</span>
            </div>
            
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-505 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totals.pct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Create Goal Form Drawer */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800/85 rounded-3xl p-5 shadow-3xs"
          >
            <form onSubmit={handleSubmitGoal} className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-105 dark:border-slate-850">
                <h4 className="text-xs font-bold text-slate-505 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <Sparkles className="w-4 h-4 text-emerald-505 shrink-0" /> Expand New Financial Target
                </h4>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('Custom Vacation ✈️', 3500, 6, 'Travel', 'indigo')}
                    className="text-[9px] px-2 py-1 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 text-slate-655 dark:text-slate-350 rounded-lg font-bold border border-slate-200/30"
                  >
                    Preset: Travel
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Emergency Cushion 🛡️', 8000, 12, 'Savings', 'emerald')}
                    className="text-[9px] px-2 py-1 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 text-slate-655 dark:text-slate-350 rounded-lg font-bold border border-slate-200/30"
                  >
                    Preset: Emergency
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Goal Target Name</label>
                  <input
                    type="text"
                    required
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="E.g. Vacation Fund, House Down Payment"
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-emerald-505"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Target Amount ($)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-emerald-505 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Target Date</label>
                    <input
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-emerald-505"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Category Tag</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-emerald-505"
                  >
                    <option value="Savings">Savings Bucket 💰</option>
                    <option value="Travel">Holiday & Travel ✈️</option>
                    <option value="Emergency">Emergency Safety Cushion 🛡️</option>
                    <option value="Investment">Asset Investments 📈</option>
                    <option value="Luxury">Luxury & Shopping 🛍️</option>
                    <option value="Other">Miscellaneous Goal 🚀</option>
                  </select>
                </div>

                {/* Theme Palette Circle selectors */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 block">Visual Aura Theme Color</label>
                  <div className="flex items-center gap-3 pt-1.5">
                    {(['emerald', 'indigo', 'rose', 'violet', 'amber', 'cyan'] as const).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setColor(col)}
                        className={`w-6 h-6 rounded-full transition relative ${COLOR_MAP[col].bar} border-2 ${
                          color === col ? 'border-slate-805 dark:border-slate-105 scale-110 shadow-md' : 'border-transparent opacity-85 hover:opacity-100'
                        }`}
                        title={col}
                      >
                        {color === col && (
                          <span className="absolute inset-0.5 rounded-full border border-white dark:border-slate-955 pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-105 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-350 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-505 hover:bg-emerald-450 text-slate-955 text-xs font-black rounded-xl transition shadow-md shadow-emerald-500/10"
                >
                  Create Goal Milestone
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Goal Cards Render Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.length > 0 ? (
          goals.map((goal) => {
            const metrics = calculateGoalMetrics(goal);
            const cm = COLOR_MAP[goal.color] || COLOR_MAP.emerald;
            const isHistoryOpen = expandedHistoryGoalId === goal.id;

            return (
              <motion.div
                layout
                key={goal.id}
                className={`bg-white dark:bg-slate-900 border ${cm.border} rounded-[24px] p-5 shadow-3xs flex flex-col justify-between hover:${cm.glow} transition-shadow duration-300 relative`}
              >
                {/* Decorative theme aura corner splash */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-10 bg-current ${cm.text}`} />

                <div className="space-y-4">
                  {/* Title Header with Category tag */}
                  <div className="flex justify-between items-start gap-2 relative z-10">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center px-1.5 py-0.3 rounded text-[8px] font-extrabold uppercase tracking-widest ${cm.bg} ${cm.text} border border-current/10`}>
                        {goal.category}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-105 mt-1.5 truncate leading-tight">
                        {goal.name}
                      </h4>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete this goal detail and release any allocated $${goal.currentAmount.toFixed(2)} back?`)) {
                          onDeleteGoal(goal.id, connectedAccounts[0]?.id);
                        }
                      }}
                      className="p-1 text-slate-350 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition shrink-0"
                      title="Erase Goals Blueprint"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fund values block */}
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Allocated Balance</span>
                      <span className="text-xl font-black font-sans text-slate-805 dark:text-slate-105">
                        ${goal.currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Target Milestone</span>
                      <span className="text-sm font-mono font-bold text-slate-550 dark:text-slate-400">
                        ${goal.targetAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Progressive Bar tracker */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                      <span>Progression Progress</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{metrics.completedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-205/10">
                      <div 
                        className={`h-full rounded-full ${cm.bar} transition-all duration-500`}
                        style={{ width: `${metrics.completedPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Target Dynamics detail section */}
                  <div className="bg-slate-50/60 dark:bg-slate-955 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-850/60 grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-slate-400" /> Countdown Target
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">
                        {goal.targetDate}
                      </span>
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 block">
                        {metrics.daysRemaining > 0 
                          ? `⏱️ ${metrics.daysRemaining} days left (${metrics.monthsRemaining} mo)` 
                          : metrics.daysRemaining === 0 
                            ? '🎉 Target day is Today!' 
                            : '⚠️ Passed Milestone date'}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-right">
                      <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3 h-3 text-emerald-505" /> Required Savings
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 block font-mono">
                        {metrics.needed > 0 
                          ? `$${metrics.requiredMonthly.toFixed(2)}/mo` 
                          : '$0.00 (Goal Achieved!)'}
                      </span>
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 block font-mono">
                        {metrics.needed > 0 ? `or $${metrics.requiredDaily.toFixed(2)}/day` : '🎉 Milestone completed!'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lower Buttons with History Toggle toggle list */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => triggerOpenAllocationModal(goal, 'allocate')}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-slate-955 text-xs font-black ${
                        metrics.needed === 0 ? 'bg-slate-205 pointer-events-none opacity-50' : 'bg-emerald-505 hover:bg-emerald-450 shadow-md shadow-emerald-500/10'
                      } transition`}
                      disabled={metrics.needed === 0}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Dedicated Inflow</span>
                    </button>

                    <button
                      onClick={() => triggerOpenAllocationModal(goal, 'withdraw')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 border border-slate-200 dark:border-slate-850 text-slate-655 dark:text-slate-350 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-bold rounded-xl transition`}
                    >
                      <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                      <span>Withdraw Cash</span>
                    </button>
                  </div>

                  {/* Ledger history contribution logs toggle */}
                  <div className="bg-slate-50/30 dark:bg-slate-955/40 border border-slate-200/20 dark:border-slate-850/50 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedHistoryGoalId(isHistoryOpen ? null : goal.id)}
                      className="w-full flex justify-between items-center px-3 py-2 text-[10px] font-bold text-slate-505 dark:text-slate-400 hover:text-slate-805 transition"
                    >
                      <span className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5" /> Direct Allocations Ledger ({goal.contributions.length})
                      </span>
                      <span className="text-slate-400 text-xs">{isHistoryOpen ? '▲' : '▼'}</span>
                    </button>

                    <AnimatePresence>
                      {isHistoryOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-3 pb-3 border-t border-slate-101 dark:border-slate-850 overflow-y-auto max-h-[140px]"
                        >
                          <div className="pt-2 space-y-2">
                            {goal.contributions.length > 0 ? (
                              goal.contributions.map((log) => (
                                <div 
                                  key={log.id}
                                  className="flex justify-between items-start text-[10px] border-b border-dashed border-slate-200/50 dark:border-slate-800 pb-1.5 last:border-0 last:pb-0"
                                >
                                  <div className="min-w-0 pr-2">
                                    <span className="block font-bold text-slate-700 dark:text-slate-350 truncate">
                                      {log.description}
                                    </span>
                                    <span className="block text-[8px] text-slate-400 font-medium">
                                      {log.date}
                                    </span>
                                  </div>
                                  <span className={`font-bold font-mono text-xs ${log.amount > 0 ? 'text-emerald-505' : 'text-rose-500'}`}>
                                    {log.amount > 0 ? '+' : ''}${log.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-2 font-semibold">
                                No direct funds synced yet. Press Dedicate Inflow to start!
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800/85 rounded-[32px] flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-505 rounded-full flex items-center justify-center animate-bounce">
              <Target className="w-7 h-7" />
            </div>

            <div className="max-w-xs space-y-1">
              <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200">No Target Milestones Formulated</h4>
              <p className="text-xs text-slate-450 dark:text-slate-500 leading-normal font-semibold">
                Set and allocate cash towards specific financial goals like a down payment or holiday fund!
              </p>
            </div>

            <button
              id="instantiate-mock-goals-button"
              onClick={() => {
                onAddGoal({ name: 'Vacation Trip 🏖️', targetAmount: 3000, targetDate: '2026-11-20', category: 'Travel', color: 'indigo' });
                onAddGoal({ name: 'Emergency Safety Shield 🛡️', targetAmount: 10000, targetDate: '2027-05-15', category: 'Savings', color: 'emerald' });
              }}
              className="mt-2 text-xs text-indigo-505 font-bold hover:underline"
            >
              + Instantiate Sandbox Presets Goal Cards
            </button>
          </div>
        )}
      </div>

      {/* 4. Funds Allocation & Withdraw Popup Overlays */}
      <AnimatePresence>
        {activeAllocationGoal && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-6 z-50 animate-fade-in font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    {allocationMode === 'allocate' ? '🔒 Goal Allocation' : '🔓 Goal Budget Release'}
                  </span>
                  <h3 className="text-xs font-black text-slate-805 dark:text-slate-200">
                    {activeAllocationGoal.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAllocationGoal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-950 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProcessAllocation} className="space-y-4 text-xs font-medium">
                {/* Available checking assets indicator */}
                <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-105 dark:border-slate-850 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Goal Current allocation</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs mt-0.5 block font-sans">
                      ${activeAllocationGoal.currentAmount.toLocaleString()} / ${activeAllocationGoal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-emerald-505 block uppercase">Needed yet</span>
                    <span className="font-bold text-emerald-505 text-xs mt-0.5 block font-mono">
                      ${Math.max(0, activeAllocationGoal.targetAmount - activeAllocationGoal.currentAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Amount to transfer field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
                    {allocationMode === 'allocate' ? 'Saves Allocation Amount ($)' : 'Cash Outflow Amount ($)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    autoFocus
                    value={allocationAmount}
                    onChange={(e) => setAllocationAmount(e.target.value)}
                    placeholder="E.g., 250"
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-105 font-mono focus:outline-none focus:border-emerald-505"
                  />
                </div>

                {/* Account choice dropdown selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
                    {allocationMode === 'allocate' ? 'Subtract/Fund Credit From' : 'Refund Cash Settlement To'}
                  </label>
                  <select
                    required
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-emerald-505"
                  >
                    <option value="" disabled>Select connected cash account</option>
                    {connectedAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (${acc.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })} left)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct description note */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">Audit note / log caption</label>
                  <input
                    type="text"
                    value={allocationNote}
                    onChange={(e) => setAllocationNote(e.target.value)}
                    placeholder={allocationMode === 'allocate' ? 'E.g., Dedicating side consulting payout' : 'E.g., Withdrawing cash for summer plane tickets'}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-205 focus:outline-none focus:border-emerald-505"
                  />
                </div>

                {/* Action submit buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setActiveAllocationGoal(null)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-350 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2 rounded-xl text-slate-955 text-xs font-black transition ${
                      allocationMode === 'allocate' 
                        ? 'bg-emerald-505 hover:bg-emerald-450 shadow-md shadow-emerald-500/10' 
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10'
                    }`}
                  >
                    {allocationMode === 'allocate' ? 'Confirm Inflow' : 'Confirm Cash Out'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
