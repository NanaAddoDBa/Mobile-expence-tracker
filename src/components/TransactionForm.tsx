import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { Plus, Check, Calendar, CreditCard, Tag, DollarSign, X, RefreshCw, Sparkles, Camera } from 'lucide-react';
import ReceiptScanner from './ReceiptScanner';

interface TransactionFormProps {
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onClose?: () => void;
  categoriesList?: typeof INITIAL_CATEGORIES;
}

export default function TransactionForm({ onAddTransaction, onClose, categoriesList = INITIAL_CATEGORIES }: TransactionFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Food & Dining');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer'>('Credit Card');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [showScanner, setShowScanner] = useState(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);

  const handleScanComplete = (data: {
    vendorName: string;
    totalAmount: number;
    transactionDate: string;
    category: string;
  }) => {
    if (data.vendorName) setDescription(data.vendorName);
    if (data.totalAmount) setAmount(data.totalAmount.toString());
    if (data.transactionDate) setDate(data.transactionDate);
    if (data.category) {
      setType('expense');
      setCategory(data.category as any);
    }
    
    setScanSuccessMsg(`Extracted: ${data.vendorName} ($${data.totalAmount.toFixed(2)})`);
    setShowScanner(false);

    setTimeout(() => {
      setScanSuccessMsg(null);
    }, 4500);
  };

  // Ensure default categories match selection types
  React.useEffect(() => {
    if (type === 'income') {
      setCategory('Income');
    } else {
      setCategory('Food & Dining');
    }
  }, [type]);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleQuickAddAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [key: string]: string } = {};

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      nextErrors.amount = 'Please input a valid amount greater than zero.';
    }
    if (!description.trim()) {
      nextErrors.description = 'Provide a merchant or details description.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Call callback and reset
    let recurringNextDate: string | undefined = undefined;
    if (isRecurring) {
      const getNextDate = (dateStr: string, freq: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        if (freq === 'daily') d.setDate(d.getDate() + 1);
        else if (freq === 'weekly') d.setDate(d.getDate() + 7);
        else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
        else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
      };
      recurringNextDate = getNextDate(date, recurringFrequency);
    }

    onAddTransaction({
      amount: numAmount,
      category,
      description: description.trim(),
      type,
      date,
      paymentMethod,
      tags: tags.length > 0 ? tags : undefined,
      isRecurring: isRecurring || undefined,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      recurringNextDate,
    });

    // Reset fields
    setAmount('');
    setDescription('');
    setTags([]);
    setErrors({});
    if (onClose) onClose();
  };

  // Helper colors
  const getCatColor = (cat: Category) => {
    const matched = categoriesList.find(c => c.name === cat);
    if (!matched) return 'slate';
    return matched.color;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-905 rounded-3xl overflow-y-auto">
      {/* Form Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">✍️ Add a New Bill or Money Received</h3>
        {onClose && (
          <button 
            id="close-tx-form"
            onClick={onClose} 
            className="p-1 px-2.5 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            Go Back
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1 select-none font-sans">
        {scanSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-450 text-xs rounded-xl flex items-center justify-between font-bold border border-emerald-500/15">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-bounce shrink-0" />
              {scanSuccessMsg}
            </span>
            <button type="button" onClick={() => setScanSuccessMsg(null)}>
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        )}

        {showScanner ? (
          <ReceiptScanner 
            onScanComplete={handleScanComplete} 
            onClose={() => setShowScanner(false)} 
          />
        ) : (
          <button
            id="open-receipt-scanner-btn"
            type="button"
            onClick={() => setShowScanner(true)}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 dark:bg-slate-105 dark:hover:bg-white text-white dark:text-slate-900 rounded-2xl text-xs font-black transition-all shadow-md shadow-indigo-500/10 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-520" />
            <span>Scan & Pre-fill via Receipt Photo</span>
          </button>
        )}

        {/* Toggle Type */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100/70 dark:bg-slate-850 p-1 rounded-xl">
          <button
            id="tx-type-expense"
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            💸 Money Spent
          </button>
          <button
            id="tx-type-income"
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            💰 Money Received
          </button>
        </div>

        {/* Amount Section */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Amount of Money ($)
          </label>
          <div className="relative font-sans">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className={`w-5 h-5 ${type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`} />
            </div>
            <input
              id="tx-amount-input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
              }}
              className={`w-full pl-9 pr-4 py-3 font-mono text-2xl font-bold bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-hidden focus:ring-2 ${
                errors.amount 
                  ? 'border-rose-450 ring-rose-200/50' 
                  : 'border-slate-200 dark:border-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-slate-100 dark:focus:ring-slate-800/80'
              } text-slate-850 dark:text-slate-100 transition-all`}
            />
          </div>
          {errors.amount && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.amount}</p>}

          {/* Quick Pad increments */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {[5, 10, 20, 50, 100].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800 rounded-lg transition shrink-0"
              >
                +{val}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount('')}
              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-[11px] font-semibold text-rose-500 border border-rose-200/20 rounded-lg transition shrink-0"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Merchant Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Name of Shop or Description
          </label>
          <input
            id="tx-desc-input"
            type="text"
            placeholder="e.g. Bakery, Local Pharmacy, Monthly Pension..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
            }}
            className={`w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-hidden focus:ring-2 ${
              errors.description
                ? 'border-rose-450 ring-rose-200/55'
                : 'border-slate-200 dark:border-slate-800 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-slate-100 dark:focus:ring-slate-800/80'
            } text-slate-800 dark:text-slate-100 transition-all`}
          />
          {errors.description && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.description}</p>}
        </div>

        {/* Category Selector Grid */}
        {type === 'expense' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Where to categorize this payment?
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {categoriesList
                .filter(cat => cat.name !== 'Income')
                .map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      id={`cat-select-${cat.name.toLowerCase().replace(/ & /g, '-')}`}
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs font-semibold select-none transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-white dark:text-slate-900 shadow-xs'
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        cat.color === 'orange' ? 'bg-orange-500' :
                        cat.color === 'blue' ? 'bg-blue-500' :
                        cat.color === 'indigo' ? 'bg-indigo-500' :
                        cat.color === 'purple' ? 'bg-purple-500' :
                        cat.color === 'pink' ? 'bg-pink-500' :
                        cat.color === 'rose' ? 'bg-rose-500' :
                        cat.color === 'cyan' ? 'bg-cyan-500' :
                        cat.color === 'teal' ? 'bg-teal-500' : 'bg-slate-500'
                      }`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Date and Payment Details side-by-side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date
            </label>
            <input
              id="tx-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Payment Mode
            </label>
            <select
              id="tx-payment-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Recurring Schedules Section */}
        <div className="bg-slate-50/55 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-indigo-500 ${isRecurring ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <div>
                <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200">🔄 Repeat this payment</span>
                <span className="block text-[10px] text-slate-450 dark:text-slate-400">Turn on if this bill happens every month or week</span>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id="tx-recurring-toggle-checkbox"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 shrink-0 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {isRecurring && (
            <div className="space-y-3 pt-2.5 border-t border-slate-150 dark:border-slate-800/60 transition-all">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">How often does it repeat?</label>
                <select
                  id="tx-recurring-frequency-select"
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-hidden"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekly">Every Week (Subscription)</option>
                  <option value="monthly">Every Month (Rent/Bills)</option>
                  <option value="yearly">Every Year</option>
                </select>
              </div>

              <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/15">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-normal">
                  <span className="font-bold">✨ Bill Active:</span> Next payment will record automatically on <b className="font-mono">{(() => {
                    const getNextDate = (dateStr: string, freq: 'daily' | 'weekly' | 'monthly' | 'yearly'): string => {
                      const d = new Date(dateStr + 'T00:00:00');
                      if (isNaN(d.getTime())) return dateStr;
                      if (freq === 'daily') d.setDate(d.getDate() + 1);
                      else if (freq === 'weekly') d.setDate(d.getDate() + 7);
                      else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
                      else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
                      return d.toISOString().split('T')[0];
                    };
                    return getNextDate(date, recurringFrequency);
                  })()}</b>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tags system */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> 🏷️ Optional Label/Tags
          </label>
          <div className="flex gap-2">
            <input
              id="tx-tag-input"
              type="text"
              placeholder="e.g. bread, pharmacy, milk..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(e);
                }
              }}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden text-slate-800 dark:text-slate-100"
            />
            <button
              id="add-tag-button"
              type="button"
              onClick={handleAddTag}
              className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-330 rounded-xl text-xs font-bold transition"
            >
              Attach
            </button>
          </div>

          {/* Tags Pills List */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 py-0.5 pl-2 pr-1.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(i)}
                    className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit action */}
        <button
          id="tx-submit-button"
          type="submit"
          className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-650 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 flex justify-center items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Finished - Save Now!
        </button>
      </form>
    </div>
  );
}
