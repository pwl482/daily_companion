import React, { useState } from 'react';
import { AppData, OneTimePayment, OneTimePaymentSplit, RecurringPayment, RecurringSubEntry, PaymentType, RecurrenceFrequency } from '../../types';
import { formatFrequencyLabel } from '../../utils/cronHelper';
import { formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import { Plus, Trash2, Calendar, DollarSign, Clock, ShoppingCart, RefreshCw, ChevronDown, ChevronUp, Layers, CheckCircle2 } from 'lucide-react';

interface FinanceInputTabProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
}

export const FinanceInputTab: React.FC<FinanceInputTabProps> = ({ data, onUpdateData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'one_time' | 'recurring'>('one_time');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // --- ONE-TIME PAYMENT STATE ---
  const [otpDate, setOtpDate] = useState<string>(getTodayDateString());
  const [otpMerchant, setOtpMerchant] = useState<string>('');
  const [otpNotes, setOtpNotes] = useState<string>('');
  const [otpSplits, setOtpSplits] = useState<OneTimePaymentSplit[]>([
    {
      id: 'split-1',
      primaryCategory: 'Groceries',
      subCategory: 'Default',
      amount: 0,
      notes: '',
    },
  ]);

  // --- RECURRING PAYMENT STATE ---
  const [recTitle, setRecTitle] = useState<string>('');
  const [recCategory, setRecCategory] = useState<string>('rent');
  const [recType, setRecType] = useState<PaymentType>('expense');
  const [recSubEntries, setRecSubEntries] = useState<RecurringSubEntry[]>([
    {
      id: 'sub-init-1',
      startDate: getTodayDateString(),
      endDate: null,
      frequency: 'monthly',
      dayOfMonth: 1,
      amount: 0,
      notes: 'Initial rate',
    },
  ]);

  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const addSplitLine = () => {
    setOtpSplits([
      ...otpSplits,
      {
        id: `split-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        primaryCategory: 'Groceries',
        subCategory: 'Vacation',
        amount: 0,
        notes: '',
      },
    ]);
  };

  const removeSplitLine = (index: number) => {
    if (otpSplits.length <= 1) return;
    setOtpSplits(otpSplits.filter((_, i) => i !== index));
  };

  const updateSplitLine = (index: number, field: keyof OneTimePaymentSplit, value: string | number) => {
    const updated = [...otpSplits];
    updated[index] = { ...updated[index], [field]: value };
    setOtpSplits(updated);
  };

  const totalOtpAmount = otpSplits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const handleSaveOneTimePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpMerchant.trim()) {
      alert('Please enter a merchant or description.');
      return;
    }
    if (totalOtpAmount <= 0) {
      alert('Please enter an amount greater than 0.');
      return;
    }

    const newPayment: OneTimePayment = {
      id: `otp-${Date.now()}`,
      date: otpDate,
      merchant: otpMerchant.trim(),
      notes: otpNotes.trim(),
      splits: otpSplits.map(s => ({
        ...s,
        amount: Number(s.amount) || 0,
        subCategory: s.subCategory.trim() || 'Default',
      })),
      createdAt: new Date().toISOString(),
    };

    onUpdateData({
      ...data,
      oneTimePayments: [newPayment, ...data.oneTimePayments],
    });

    setOtpMerchant('');
    setOtpNotes('');
    setOtpSplits([
      {
        id: `split-${Date.now()}`,
        primaryCategory: 'Groceries',
        subCategory: 'Default',
        amount: 0,
        notes: '',
      },
    ]);
    showToast('Payment recorded!');
  };

  const handleDeleteOneTime = (id: string) => {
    if (window.confirm('Delete this one-time payment?')) {
      onUpdateData({
        ...data,
        oneTimePayments: data.oneTimePayments.filter(p => p.id !== id),
      });
    }
  };

  const addRecSubEntry = () => {
    setRecSubEntries([
      ...recSubEntries,
      {
        id: `sub-${Date.now()}`,
        startDate: getTodayDateString(),
        endDate: null,
        frequency: 'monthly',
        dayOfMonth: 1,
        amount: 0,
        notes: 'Rate adjustment',
      },
    ]);
  };

  const removeRecSubEntry = (index: number) => {
    if (recSubEntries.length <= 1) return;
    setRecSubEntries(recSubEntries.filter((_, i) => i !== index));
  };

  const updateRecSubEntry = (index: number, field: keyof RecurringSubEntry, value: any) => {
    const updated = [...recSubEntries];
    updated[index] = { ...updated[index], [field]: value };
    setRecSubEntries(updated);
  };

  const handleSaveRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) {
      alert('Please enter a title.');
      return;
    }

    const validatedSubEntries = recSubEntries.map(sub => ({
      ...sub,
      amount: Number(sub.amount) || 0,
      endDate: sub.endDate ? sub.endDate : null,
    }));

    const newRecurring: RecurringPayment = {
      id: `rec-${Date.now()}`,
      title: recTitle.trim(),
      category: recCategory,
      type: recType,
      subEntries: validatedSubEntries,
      createdAt: new Date().toISOString(),
    };

    onUpdateData({
      ...data,
      recurringPayments: [newRecurring, ...data.recurringPayments],
    });

    setRecTitle('');
    setRecSubEntries([
      {
        id: `sub-${Date.now()}`,
        startDate: getTodayDateString(),
        endDate: null,
        frequency: 'monthly',
        dayOfMonth: 1,
        amount: 0,
        notes: 'Initial rate',
      },
    ]);
    showToast(`Saved recurring ${newRecurring.title}!`);
  };

  const handleDeleteRecurring = (id: string) => {
    if (window.confirm('Delete this recurring payment?')) {
      onUpdateData({
        ...data,
        recurringPayments: data.recurringPayments.filter(r => r.id !== id),
      });
    }
  };

  return (
    <div className="space-y-4 pb-12 text-slate-100">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow-xl animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Subtab Selector - Compact */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 max-w-sm mx-auto">
        <button
          onClick={() => setActiveSubTab('one_time')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'one_time'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>One-Time Expenses</span>
        </button>
        <button
          onClick={() => setActiveSubTab('recurring')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeSubTab === 'recurring'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Returning Flows</span>
        </button>
      </div>

      {/* --- FORM 1: ONE-TIME PAYMENT WITH SUBCATEGORY SPLIT --- */}
      {activeSubTab === 'one_time' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                Log Expense & Category Splits
              </h2>
              <div className="text-right">
                <span className="text-xs font-extrabold text-blue-400 font-mono">
                  ${totalOtpAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveOneTimePayment} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                    <input
                      type="date"
                      value={otpDate}
                      onChange={(e) => setOtpDate(e.target.value)}
                      required
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Merchant / Store
                  </label>
                  <input
                    type="text"
                    value={otpMerchant}
                    onChange={(e) => setOtpMerchant(e.target.value)}
                    placeholder="Trader Joe's, Cinema..."
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={otpNotes}
                    onChange={(e) => setOtpNotes(e.target.value)}
                    placeholder="Trip supplies..."
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Splits List - Mobile Compact Grid */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Splits ({otpSplits.length})
                  </span>
                  <button
                    type="button"
                    onClick={addSplitLine}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Split Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {otpSplits.map((split, idx) => (
                    <div
                      key={split.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Category */}
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Category
                          </label>
                          <select
                            value={split.primaryCategory}
                            onChange={(e) => updateSplitLine(idx, 'primaryCategory', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          >
                            <option value="Groceries">Groceries</option>
                            <option value="Sports">Sports</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Dining">Dining</option>
                            <option value="Mobility">Mobility</option>
                            <option value="Health">Health</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Tag/Subcategory */}
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Subcategory/Tag
                          </label>
                          <input
                            type="text"
                            list={`subcat-presets-${idx}`}
                            value={split.subCategory}
                            onChange={(e) => updateSplitLine(idx, 'subCategory', e.target.value)}
                            placeholder="Vacation, Default..."
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          />
                          <datalist id={`subcat-presets-${idx}`}>
                            <option value="Default" />
                            <option value="Vacation" />
                            <option value="Snacks" />
                            <option value="Equipment" />
                            <option value="Events" />
                            <option value="Movies" />
                            <option value="Climbing" />
                          </datalist>
                        </div>

                        {/* Amount */}
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Amount ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-3 h-3 text-slate-500 absolute left-1.5 top-1.5" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={split.amount || ''}
                              onChange={(e) => updateSplitLine(idx, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              required
                              className="w-full pl-5 pr-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                        </div>

                        {/* Details & Delete */}
                        <div className="flex items-end gap-1">
                          <div className="flex-1">
                            <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                              Line Details
                            </label>
                            <input
                              type="text"
                              value={split.notes || ''}
                              onChange={(e) => updateSplitLine(idx, 'notes', e.target.value)}
                              placeholder="Organic, pass..."
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300"
                            />
                          </div>
                          {otpSplits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSplitLine(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 mb-0.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save (${totalOtpAmount.toFixed(2)})</span>
                </button>
              </div>
            </form>
          </div>

          {/* Transactions List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
              Recorded Payments ({data.oneTimePayments.length})
            </h3>

            {data.oneTimePayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No one-time payments entered yet.</p>
            ) : (
              <div className="space-y-2">
                {data.oneTimePayments.map((payment) => {
                  const paymentTotal = payment.splits.reduce((sum, s) => sum + s.amount, 0);
                  return (
                    <div
                      key={payment.id}
                      className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg flex items-start justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{payment.merchant}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatDisplayDate(payment.date)}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-[11px] text-slate-400 truncate italic">{payment.notes}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {payment.splits.map((sp) => (
                            <span
                              key={sp.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                            >
                              <span>{sp.primaryCategory}</span>
                              <span className="text-slate-500 mx-0.5">:</span>
                              <span className="text-slate-400">{sp.subCategory}</span>
                              <strong className="text-white ml-1 font-mono">${sp.amount.toFixed(2)}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-white font-mono">
                          -${paymentTotal.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteOneTime(payment.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- FORM 2: RETURNING PAYMENTS WITH MULTI-PERIOD RATE HISTORY --- */}
      {activeSubTab === 'recurring' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md">
            <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-800">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              Configure Recurring Flow & Rate Periods
            </h2>

            <form onSubmit={handleSaveRecurring} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Contract Title
                  </label>
                  <input
                    type="text"
                    value={recTitle}
                    onChange={(e) => setRecTitle(e.target.value)}
                    placeholder="Rent, Salary, Power..."
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Flow Type
                  </label>
                  <div className="flex bg-slate-950 p-0.5 border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRecType('expense')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded transition ${
                        recType === 'expense'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      Expense (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecType('income')}
                      className={`flex-1 py-1 text-[11px] font-bold rounded transition ${
                        recType === 'income'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      Income (+)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="rent">Rent / Housing</option>
                    <option value="internet">Internet / Telecom</option>
                    <option value="power">Power / Electricity</option>
                    <option value="mobility">Mobility / Transit</option>
                    <option value="income">Income / Salary</option>
                    <option value="insurance">Insurance</option>
                    <option value="subscription">Subscription</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Rate History Periods */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Rate Periods ({recSubEntries.length})
                  </span>
                  <button
                    type="button"
                    onClick={addRecSubEntry}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Period</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {recSubEntries.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span>Period #{idx + 1}</span>
                        {recSubEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecSubEntry(idx)}
                            className="text-rose-400 text-[10px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={sub.startDate}
                            onChange={(e) => updateRecSubEntry(idx, 'startDate', e.target.value)}
                            required
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            End Date (Blank = Ongoing)
                          </label>
                          <input
                            type="date"
                            value={sub.endDate || ''}
                            onChange={(e) => updateRecSubEntry(idx, 'endDate', e.target.value || null)}
                            placeholder="Ongoing"
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Frequency
                          </label>
                          <select
                            value={sub.frequency}
                            onChange={(e) => updateRecSubEntry(idx, 'frequency', e.target.value as RecurrenceFrequency)}
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                            <option value="yearly">Yearly</option>
                            <option value="custom_cron">Cron</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Rate ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="w-3 h-3 text-slate-500 absolute left-1.5 top-1.5" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={sub.amount || ''}
                              onChange={(e) => updateRecSubEntry(idx, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              required
                              className="w-full pl-5 pr-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Frequency-specific row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sub.frequency === 'monthly' && (
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                              Day of Month (1-31)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={sub.dayOfMonth ?? 1}
                              onChange={(e) => updateRecSubEntry(idx, 'dayOfMonth', parseInt(e.target.value, 10))}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                        )}

                        {sub.frequency === 'weekly' && (
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                              Day of Week
                            </label>
                            <select
                              value={sub.dayOfWeek ?? 1}
                              onChange={(e) => updateRecSubEntry(idx, 'dayOfWeek', parseInt(e.target.value, 10))}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            >
                              <option value="1">Mon</option>
                              <option value="2">Tue</option>
                              <option value="3">Wed</option>
                              <option value="4">Thu</option>
                              <option value="5">Fri</option>
                              <option value="6">Sat</option>
                              <option value="0">Sun</option>
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">
                            Period Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={sub.notes || ''}
                            onChange={(e) => updateRecSubEntry(idx, 'notes', e.target.value)}
                            placeholder="Intro promo, renewal..."
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Recurring Flow</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Recurring Payments */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              Active Returning Flows ({data.recurringPayments.length})
            </h3>

            {data.recurringPayments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No returning contracts entered yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recurringPayments.map((item) => {
                  const isExpanded = expandedRecId === item.id;
                  const latestSub = item.subEntries[item.subEntries.length - 1];

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">{item.title}</span>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                item.type === 'income'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {item.type}
                            </span>
                          </div>
                          {latestSub && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ${latestSub.amount.toFixed(2)} •{' '}
                              {formatFrequencyLabel(latestSub.frequency, latestSub.dayOfMonth, latestSub.dayOfWeek, latestSub.cronExpr)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setExpandedRecId(isExpanded ? null : item.id)}
                            className="px-2 py-0.5 text-[11px] text-slate-300 hover:text-white bg-slate-800 rounded flex items-center gap-0.5"
                          >
                            <span>Periods ({item.subEntries.length})</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => handleDeleteRecurring(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Periods */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                          {item.subEntries.map((sub, sIdx) => (
                            <div
                              key={sub.id}
                              className="p-2 bg-slate-900 border border-slate-800 rounded text-[11px] flex items-center justify-between"
                            >
                              <span className="text-slate-300">
                                P{sIdx + 1}: {sub.startDate} → {sub.endDate || 'Ongoing'}
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                ${sub.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
