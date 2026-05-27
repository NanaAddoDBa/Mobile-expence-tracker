import React, { useState, useMemo } from 'react';
import { Budget, Category, Alert, Transaction } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { ShieldAlert, ThumbsUp, Sparkles, Plus, AlertCircle, RefreshCw, Volume2, AppWindow, Play, Square, Settings, Scale } from 'lucide-react';

interface BudgetPlannerProps {
  budgets: Budget[];
  onUpdateLimit: (category: Exclude<Category, 'Income'>, newLimit: number) => void;
  onUpdateThreshold: (category: Exclude<Category, 'Income'>, newThreshold: number) => void;
  alerts: Alert[];
  onClearAlerts: () => void;
  categoriesList?: typeof INITIAL_CATEGORIES;
  transactions: Transaction[];
  onTriggerInstanceEarly: (id: string) => void;
  onCancelSubscription: (id: string) => void;
}

export default function BudgetPlanner({
  budgets,
  onUpdateLimit,
  onUpdateThreshold,
  alerts,
  onClearAlerts,
  categoriesList = INITIAL_CATEGORIES,
  transactions,
  onTriggerInstanceEarly,
  onCancelSubscription
}: BudgetPlannerProps) {
  const [editingCategory, setEditingCategory] = useState<Exclude<Category, 'Income'> | null>(null);
  const [editLimitVal, setEditLimitVal] = useState<string>('');
  const [editThresholdVal, setEditThresholdVal] = useState<number>(80);

  const recurringTxs = useMemo(() => {
    return transactions.filter(t => t.isRecurring);
  }, [transactions]);

  const startEdit = (b: Budget) => {
    setEditingCategory(b.category);
    setEditLimitVal(b.limit.toString());
    setEditThresholdVal(b.alertThreshold);
  };

  const saveEdit = () => {
    if (editingCategory) {
      const parsed = parseFloat(editLimitVal);
      if (!isNaN(parsed) && parsed > 0) {
        onUpdateLimit(editingCategory, parsed);
        onUpdateThreshold(editingCategory, editThresholdVal);
      }
      setEditingCategory(null);
    }
  };

  const getPercentageColor = (percent: number) => {
    if (percent >= 100) return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
    if (percent >= 80) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
    return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
  };

  const getProgressBg = (percent: number) => {
    if (percent >= 100) return 'bg-rose-500';
    if (percent >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
      
      {/* Warnings & Alerts Log Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85 shadow-3xs">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">⚠️ Spending Warnings & Alerts ({alerts.length})</h4>
          </div>
          {alerts.length > 0 && (
            <button
              id="clear-alerts-button"
              onClick={onClearAlerts}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition"
            >
              Dismiss All Alerts
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border text-xs relative flex items-start gap-2.5 ${
                  alert.type === 'danger'
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30 text-slate-800 dark:text-slate-350'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30 text-slate-800 dark:text-slate-350'
                }`}
              >
                <AlertCircle className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${
                  alert.type === 'danger' ? 'text-rose-500' : 'text-amber-500'
                }`} />
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-250 leading-relaxed">{alert.message}</p>
                  <p className="text-[9px] font-mono text-slate-450 dark:text-slate-500">
                    {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center text-emerald-500">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">🟢 All Budgets are Safe!</p>
                <p className="text-[10px] text-slate-400">You haven't spent too much in any category today. Nice job!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automated Subscriptions & Recurring Bills List */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200/55 dark:border-slate-800/85 shadow-3xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4.5 h-4.5 text-indigo-500 animate-spin" style={{ animationDuration: '10s' }} />
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">🔄 Automatic Bills & Subscriptions ({recurringTxs.length})</h4>
          </div>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-450 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/40">
            Repeating
          </span>
        </div>

        <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
          {recurringTxs.length > 0 ? (
            recurringTxs.map((tx) => {
              return (
                <div 
                  key={tx.id} 
                  className="p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/40 flex flex-col gap-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5 flex-wrap">
                        {tx.description}
                        <span className="text-[8px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.3 rounded border border-slate-200/30">
                          {tx.recurringFrequency}
                        </span>
                      </h5>
                      <span className="block text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-widest font-mono">
                        {tx.category} • {tx.paymentMethod}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                        ${tx.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 rounded-lg p-1.5 px-2.5 border border-slate-200/30 dark:border-slate-800/30 text-[9px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1 font-sans">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Next statement billing estimate: <b className="font-mono text-slate-700 dark:text-slate-350">{tx.recurringNextDate}</b>
                    </span>

                    <div className="flex gap-2 shrink-0">
                      <button
                        title="Simulate recording the next forecasted statement entry early into the analytic tracker log"
                        onClick={() => onTriggerInstanceEarly(tx.id)}
                        className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-450 dark:hover:text-emerald-350 bg-emerald-50 dark:bg-emerald-950/40 p-1 px-2 rounded-md border border-emerald-100 dark:border-emerald-900/20 shadow-3xs font-sans"
                      >
                        Simulate Feed Ingestion
                      </button>
                      <button
                        title="Exclude future billing schedule logs and hide from forecast lists"
                        onClick={() => onCancelSubscription(tx.id)}
                        className="text-[9px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-450 dark:hover:text-rose-350 bg-rose-50 dark:bg-rose-950/45 p-1 px-2 rounded-md border border-rose-100 dark:border-rose-900/20 shadow-3xs font-sans"
                      >
                        Exclude from Forecasts
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 flex flex-col items-center justify-center gap-1.5">
              <RefreshCw className="w-8 h-8 text-slate-300 stroke-1" />
              <div>
                <p className="text-xs font-bold text-slate-650 dark:text-slate-400 font-sans">No automatic bills yet</p>
                <p className="text-[10px] text-slate-450">If you add a transaction on the typing form and turn on 'Repeat this payment', it will show up here!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Allocations Slider Suite */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
          <Settings className="w-4 h-4 text-slate-400" /> 🛑 Change My Monthly Spend Settings
        </h4>

        <div className="space-y-3">
          {budgets.map((b) => {
            const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
            const isEditing = editingCategory === b.category;
            const catConfig = categoriesList.find(c => c.name === b.category);

            return (
              <div
                key={b.category}
                className="bg-white dark:bg-slate-900 p-4 rounded-[22px] border border-slate-200/50 dark:border-slate-850 shadow-3xs hover:border-slate-305 dark:hover:border-slate-750 transition duration-300"
              >
                {/* Header detail */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        catConfig?.color === 'orange' ? 'bg-orange-500' :
                        catConfig?.color === 'blue' ? 'bg-blue-500' :
                        catConfig?.color === 'indigo' ? 'bg-indigo-500' :
                        catConfig?.color === 'purple' ? 'bg-purple-500' :
                        catConfig?.color === 'pink' ? 'bg-pink-500' :
                        catConfig?.color === 'rose' ? 'bg-rose-500' :
                        catConfig?.color === 'cyan' ? 'bg-cyan-500' :
                        catConfig?.color === 'teal' ? 'bg-teal-500' : 'bg-slate-500'
                      }`} />
                      {b.category}
                    </h5>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Paid so far: <b className="font-mono text-slate-600 dark:text-slate-350">${b.spent.toFixed(2)}</b>
                    </p>
                  </div>

                  {!isEditing ? (
                    <div className="text-right font-sans">
                      <span className="block text-xs font-extrabold text-slate-900 dark:text-slate-200">${b.limit} Monthly Limit</span>
                      <button
                        id={`edit-budget-${b.category.toLowerCase().replace(/ & /g, '-')}`}
                        onClick={() => startEdit(b)}
                        className="text-[9px] font-bold text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        Change My Plan
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`save-budget-${b.category.toLowerCase().replace(/ & /g, '-')}`}
                      onClick={saveEdit}
                      className="text-xs font-extrabold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-950 px-2.5 py-1 rounded-lg"
                    >
                      Save New Plan
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Maximum limit to spend ($)</label>
                        <input
                          id={`input-limit-${b.category.toLowerCase().replace(/ & /g, '-')}`}
                          type="number"
                          value={editLimitVal}
                          onChange={(e) => setEditLimitVal(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-150 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Warning level (%)</label>
                        <select
                          id={`select-threshold-${b.category.toLowerCase().replace(/ & /g, '-')}`}
                          value={editThresholdVal}
                          onChange={(e) => setEditThresholdVal(parseInt(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-150 focus:outline-hidden"
                        >
                          <option value="50">50% Warning</option>
                          <option value="75">75% Warning</option>
                          <option value="80">80% Warning</option>
                          <option value="90">90% Warning</option>
                          <option value="100">100% (Strict Max)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard percentage visual scale slider indicator */
                  <div className="space-y-1.5 mt-2">
                    {/* Linear progress track bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(pct, 100)}%` }} 
                        className={`h-full rounded-full transition-all duration-300 ${getProgressBg(pct)}`} 
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-bold font-sans">
                      <span className={`px-1.5 py-0.2 rounded ${getPercentageColor(pct)}`}>
                        {pct.toFixed(0)}% spent already
                      </span>
                      <span className="text-slate-400">
                        Warning set at {b.alertThreshold}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
