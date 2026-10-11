import React, { useState, useEffect } from 'react';
import { Store, SalesRecord, INDUSTRIES, IndustryType } from '../types';
import { formatVND, formatNumberWithDots, parseNumberFromDots } from '../utils/sampleData';
import { Calendar, CircleDollarSign, TrendingDown, X, AlertCircle, Sparkles, Sliders } from 'lucide-react';

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatLocalDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getTodayDateString = (): string => {
  return formatLocalDate(new Date());
};

interface SalesRecordFormProps {
  stores: Store[];
  activeStoreId?: string;
  record?: SalesRecord; // If provided, we are editing
  onSubmit: (recordData: (Omit<SalesRecord, 'id' | 'profit'> & { id?: string }) | SalesRecord[]) => void;
  onCancel: () => void;
}

export default function SalesRecordForm({ stores, activeStoreId, record, onSubmit, onCancel }: SalesRecordFormProps) {
  // Input Modes: 'single' (nhập 1 ngày), 'range' (nhập khoảng ngày) hoặc 'month' (nhập theo tháng)
  const [inputMode, setInputMode] = useState<'single' | 'range' | 'month'>(record ? 'single' : 'single');
  
  // Basic State
  const [storeId, setStoreId] = useState(record?.storeId || activeStoreId || (stores[0]?.id || ''));
  const [date, setDate] = useState(record?.date || getTodayDateString());
  const [notes, setNotes] = useState(record?.notes || '');
  const [error, setError] = useState('');

  // Month-specific States
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  // Range-specific States
  const [rangeType, setRangeType] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<'3m' | '6m' | '12m'>('3m');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());
  const [rangeInputType, setRangeInputType] = useState<'revenue' | 'profit'>('revenue');
  const [totalRevenueStr, setTotalRevenueStr] = useState('');
  const [totalProfitStr, setTotalProfitStr] = useState('');

  // Calculation Mode for Single Day: 'margin' (Tỷ suất lợi nhuận %), 'profit' (Nhập lợi nhuận) hoặc 'manual' (Nhập tay chi phí)
  const [calcMode, setCalcMode] = useState<'margin' | 'profit' | 'manual'>('margin');
  const [marginPercentStr, setMarginPercentStr] = useState('20');
  const [revenueStr, setRevenueStr] = useState(record?.revenue ? formatNumberWithDots(record.revenue) : '');
  const [customProfitStr, setCustomProfitStr] = useState(record ? formatNumberWithDots(record.revenue - record.expense) : '');
  const [expenseStr, setExpenseStr] = useState(record?.expense ? formatNumberWithDots(record.expense) : '');

  const handleMoneyInputChange = (val: string, setter: (formatted: string) => void) => {
    let clean = val.replace(/\D/g, '');
    if (!clean) {
      setter('');
      return;
    }
    // Remove unwanted leading zeros e.g. '05' -> '5', '000' -> '0'
    clean = clean.replace(/^0+(?=\d)/, '');
    setter(clean === '0' ? '0' : formatNumberWithDots(clean));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    requestAnimationFrame(() => target.select());
  };

  const handleMarginPercentChange = (val: string) => {
    let v = val;
    if (v.length > 1 && v.startsWith('0')) {
      v = v.replace(/^0+/, '');
    }
    setMarginPercentStr(v);
  };

  const handleMarginPercentBlur = () => {
    const parsed = parseFloat(marginPercentStr);
    if (!marginPercentStr || isNaN(parsed) || parsed < 1) {
      setMarginPercentStr(benchmarkMargin.toString());
    } else if (parsed > 90) {
      setMarginPercentStr('90');
    } else {
      setMarginPercentStr(parsed.toString());
    }
  };

  // Set default margin based on the selected store's industry
  useEffect(() => {
    if (storeId) {
      const selectedStore = stores.find((s) => s.id === storeId);
      if (selectedStore) {
        const benchmark = INDUSTRIES[selectedStore.industry].benchmarkMargin * 100;
        setMarginPercentStr(benchmark.toString());
      }
    }
  }, [storeId, stores]);

  useEffect(() => {
    if (activeStoreId && !record) {
      setStoreId(activeStoreId);
    }
  }, [activeStoreId, record]);

  // Keep preset date ranges automatically synchronized
  useEffect(() => {
    if (inputMode === 'range' && rangeType === 'preset') {
      const end = new Date();
      const start = new Date();
      if (selectedPreset === '3m') {
        start.setMonth(start.getMonth() - 3);
      } else if (selectedPreset === '6m') {
        start.setMonth(start.getMonth() - 6);
      } else if (selectedPreset === '12m') {
        start.setMonth(start.getMonth() - 12);
      }
      setStartDate(formatLocalDate(start));
      setEndDate(formatLocalDate(end));
    }
  }, [inputMode, rangeType, selectedPreset]);

  // Derive target industry benchmark margin
  const selectedStore = stores.find((s) => s.id === storeId);
  const benchmarkMargin = selectedStore ? INDUSTRIES[selectedStore.industry].benchmarkMargin * 100 : 20;

  // Single mode live calculations
  const marginPercent = parseFloat(marginPercentStr) || 0;
  
  let revenue = 0;
  let expense = 0;
  let profit = 0;
  let computedMargin = 0;

  if (calcMode === 'margin') {
    revenue = parseFloat(parseNumberFromDots(revenueStr)) || 0;
    profit = Math.round(revenue * (marginPercent / 100));
    expense = Math.max(0, revenue - profit);
    computedMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  } else if (calcMode === 'profit') {
    profit = parseFloat(parseNumberFromDots(customProfitStr)) || 0;
    revenue = marginPercent > 0 ? Math.round(profit / (marginPercent / 100)) : 0;
    expense = Math.max(0, revenue - profit);
    computedMargin = marginPercent;
  } else {
    revenue = parseFloat(parseNumberFromDots(revenueStr)) || 0;
    expense = parseFloat(parseNumberFromDots(expenseStr)) || 0;
    profit = revenue - expense;
    computedMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  }

  // Range mode live calculations
  const rangeMarginPercent = parseFloat(marginPercentStr) || 0;
  const totalProfitInput = parseFloat(parseNumberFromDots(totalProfitStr)) || 0;
  
  let totalRevenue = 0;
  let rangeProfit = 0;
  let rangeExpense = 0;

  if (rangeInputType === 'revenue') {
    totalRevenue = parseFloat(parseNumberFromDots(totalRevenueStr)) || 0;
    rangeProfit = Math.round(totalRevenue * (rangeMarginPercent / 100));
    rangeExpense = Math.max(0, totalRevenue - rangeProfit);
  } else {
    rangeProfit = totalProfitInput;
    totalRevenue = rangeMarginPercent > 0 ? Math.round(rangeProfit / (rangeMarginPercent / 100)) : 0;
    rangeExpense = Math.max(0, totalRevenue - rangeProfit);
  }

  // Calculate range days count dynamically based on mode
  let daysCount = 0;
  if (inputMode === 'single') {
    daysCount = 1;
  } else if (inputMode === 'range') {
    const startObj = parseLocalDate(startDate);
    const endObj = parseLocalDate(endDate);
    startObj.setHours(0, 0, 0, 0);
    endObj.setHours(0, 0, 0, 0);
    daysCount = isNaN(startObj.getTime()) || isNaN(endObj.getTime()) || startObj > endObj
      ? 0
      : Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  } else if (inputMode === 'month') {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1; // 0-indexed
    daysCount = new Date(year, month + 1, 0).getDate(); // last day of month gives day count
  }

  const avgDailyRevenue = daysCount > 0 ? totalRevenue / daysCount : 0;

  // Date range list helper
  const getDatesInRange = (startStr: string, endStr: string): string[] => {
    const dates: string[] = [];
    const start = parseLocalDate(startStr);
    const end = parseLocalDate(endStr);
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    const current = new Date(start.getTime());
    let limit = 0;
    while (current <= end && limit < 366) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
      limit++;
    }
    return dates;
  };

  // Month days list helper
  const getDaysInMonth = (monthStr: string, yearStr: string): string[] => {
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const dates: string[] = [];
    for (let i = 1; i <= numDays; i++) {
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(i).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  const handleClearInputs = () => {
    setRevenueStr('');
    setCustomProfitStr('');
    setExpenseStr('');
    setNotes('');
    setTotalRevenueStr('');
    setTotalProfitStr('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeId) {
      setError('Vui lòng chọn một cửa hàng');
      return;
    }

    if (inputMode === 'single') {
      if (!date) {
        setError('Vui lòng chọn ngày tháng');
        return;
      }
      
      if (calcMode === 'profit') {
        const profitVal = parseFloat(parseNumberFromDots(customProfitStr)) || 0;
        if (customProfitStr === '' || isNaN(profitVal) || profitVal <= 0) {
          setError('Vui lòng nhập lợi nhuận mong muốn hợp lệ lớn hơn 0');
          return;
        }
      } else {
        if (revenueStr === '' || isNaN(revenue)) {
          setError('Vui lòng nhập doanh thu hợp lệ');
          return;
        }
        if (revenue < 0) {
          setError('Doanh thu không thể âm');
          return;
        }
      }

      if (calcMode === 'manual') {
        if (expenseStr === '' || isNaN(expense)) {
          setError('Vui lòng nhập chi phí hợp lệ');
          return;
        }
        if (expense < 0) {
          setError('Chi phí không thể âm');
          return;
        }
      }

      // Submit single record
      onSubmit({
        id: record?.id,
        storeId,
        date,
        revenue,
        expense,
        notes: notes.trim(),
      });
    } else {
      // Range mode or Month mode submit
      const dates = inputMode === 'month'
        ? getDaysInMonth(selectedMonth, selectedYear)
        : getDatesInRange(startDate, endDate);
      const N = dates.length;
      
      if (N === 0) {
        setError(inputMode === 'month' ? 'Không tìm thấy ngày hợp lệ cho tháng này' : 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
        return;
      }
      if (N > 366) {
        setError(inputMode === 'month' ? 'Số ngày vượt quá giới hạn' : 'Khoảng ngày tạo dữ liệu tự động tối đa là 366 ngày (1 năm)');
        return;
      }
      
      if (rangeInputType === 'profit') {
        if (totalProfitStr === '' || isNaN(totalProfitInput) || totalProfitInput <= 0) {
          setError('Vui lòng nhập tổng lợi nhuận mong muốn hợp lệ lớn hơn 0');
          return;
        }
      } else {
        if (totalRevenueStr === '' || isNaN(totalRevenue) || totalRevenue <= 0) {
          setError('Vui lòng nhập tổng doanh thu hợp lệ lớn hơn 0');
          return;
        }
      }
      
      if (isNaN(rangeMarginPercent) || rangeMarginPercent < -50 || rangeMarginPercent > 95) {
        setError('Tỷ suất lợi nhuận không hợp lệ (phạm vi từ -50% đến 95%)');
        return;
      }

      // Generate random daily records
      const rawWeights: number[] = [];
      for (let i = 0; i < N; i++) {
        const d = parseLocalDate(dates[i]);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // CN hoặc T7
        
        // Random standard fluctuation
        const baseWeight = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
        // Boost revenue on weekends (T6, T7, CN thường nhộn nhịp hơn)
        const weight = isWeekend ? baseWeight * 1.3 : baseWeight;
        rawWeights.push(weight);
      }

      const sumWeights = rawWeights.reduce((sum, w) => sum + w, 0);
      
      // Calculate daily revenues based on weights
      const dailyRevenues = rawWeights.map(w => {
        const share = (w / sumWeights) * totalRevenue;
        // Round to nearest 1,000 VND
        return Math.round(share / 1000) * 1000;
      });

      // Compensate for rounding differences on the largest day
      const currentSum = dailyRevenues.reduce((sum, r) => sum + r, 0);
      const diff = totalRevenue - currentSum;
      const maxIndex = dailyRevenues.indexOf(Math.max(...dailyRevenues));
      if (maxIndex !== -1) {
        dailyRevenues[maxIndex] += diff;
      }

      const targetMargin = rangeMarginPercent / 100;
      const recordsToSubmit: SalesRecord[] = [];

      for (let i = 0; i < N; i++) {
        const dayRev = dailyRevenues[i];
        
        // Let daily profit margin slightly fluctuate around the target (e.g. +/- 2%) to look real!
        const fluctuation = (Math.random() * 4 - 2) / 100; // -2% to +2%
        const dayMargin = Math.max(0.01, Math.min(0.95, targetMargin + fluctuation));
        
        const dayProfit = Math.round((dayRev * dayMargin) / 1000) * 1000;
        const dayExpense = Math.max(0, dayRev - dayProfit);

        // Fun notes to simulate human entries
        const notesPool = [
          'Giao dịch bình thường',
          'Khách mua sắm đều',
          'Thời tiết đẹp, doanh số tốt',
          'Hệ thống tự động ghi nhận',
          'Khách hàng ổn định',
          'Doanh số tăng trưởng đều',
          'Đã chốt sổ cuối ngày',
        ];
        const randomNote = notes.trim() || notesPool[Math.floor(Math.random() * notesPool.length)];

        recordsToSubmit.push({
          id: `rec-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          storeId,
          date: dates[i],
          revenue: dayRev,
          expense: dayExpense,
          profit: dayProfit,
          notes: randomNote,
        });
      }

      onSubmit(recordsToSubmit);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-xl max-w-lg w-full text-zinc-100">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-800 text-sky-400 rounded-xl">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-50 font-sans tracking-tight">
              {record ? 'Chỉnh sửa Số liệu' : 'Nhập doanh thu & báo cáo'}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {record ? 'Cập nhật lại số liệu cho một ngày cụ thể' : 'Tự động tính chi phí hoặc tạo ngẫu nhiên nhiều ngày'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-zinc-200 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode selectors if creating new record */}
      {!record && (
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 mb-5">
          <button
            type="button"
            onClick={() => setInputMode('single')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
              inputMode === 'single'
                ? 'bg-zinc-800 text-sky-400 border border-zinc-700/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Nhập một ngày
          </button>
          <button
            type="button"
            onClick={() => setInputMode('range')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
              inputMode === 'range'
                ? 'bg-zinc-800 text-sky-400 border border-zinc-700/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Khoảng ngày
          </button>
          <button
            type="button"
            onClick={() => setInputMode('month')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
              inputMode === 'month'
                ? 'bg-zinc-800 text-sky-400 border border-zinc-700/50 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Nhập theo tháng
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Store selector */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Chọn Cửa hàng <span className="text-red-400">*</span>
          </label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            disabled={!!record}
            className="w-full pl-3 pr-8 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs disabled:opacity-50"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-100">
                {s.name} ({INDUSTRIES[s.industry].name})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Date controls depending on mode */}
        {inputMode === 'single' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Ngày nhập liệu <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Ghi chú nhanh
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Cuối tuần đông khách..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs"
              />
            </div>
          </div>
        ) : inputMode === 'range' ? (
          <div className="space-y-4">
            {/* Range type selection */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 gap-1">
              <button
                type="button"
                onClick={() => setRangeType('preset')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  rangeType === 'preset'
                    ? 'bg-zinc-850 text-sky-400 border border-zinc-700/30 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Gần đây (Tự động)
              </button>
              <button
                type="button"
                onClick={() => setRangeType('custom')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  rangeType === 'custom'
                    ? 'bg-zinc-850 text-sky-400 border border-zinc-700/30 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                Tự chọn khoảng ngày
              </button>
            </div>

            {rangeType === 'preset' ? (
              <div className="space-y-3">
                {/* Visual Preset selection buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('3m');
                      setError('');
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selectedPreset === '3m'
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-bold shadow-md shadow-sky-500/5'
                        : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                    }`}
                  >
                    <span className="text-sm font-extrabold">3 Tháng</span>
                    <span className="text-[9px] font-medium text-zinc-500">Gần nhất</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('6m');
                      setError('');
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selectedPreset === '6m'
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-bold shadow-md shadow-sky-500/5'
                        : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                    }`}
                  >
                    <span className="text-sm font-extrabold">6 Tháng</span>
                    <span className="text-[9px] font-medium text-zinc-500">Gần nhất</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('12m');
                      setError('');
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selectedPreset === '12m'
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-400 font-bold shadow-md shadow-sky-500/5'
                        : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                    }`}
                  >
                    <span className="text-sm font-extrabold">12 Tháng</span>
                    <span className="text-[9px] font-medium text-zinc-500">Gần nhất</span>
                  </button>
                </div>

                {/* Auto Calculated Date Summary visual box */}
                <div className="bg-zinc-950/30 p-3 rounded-xl border border-zinc-850/80 space-y-1 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                    Khoảng thời gian tự động chốt:
                  </span>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-zinc-200 pt-0.5">
                    <span>{startDate.split('-').reverse().join('/')}</span>
                    <span className="text-zinc-600 font-normal">→</span>
                    <span>{endDate.split('-').reverse().join('/')}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Hệ thống tự động sinh dữ liệu thực tế cho <span className="text-sky-400 font-bold">{daysCount} ngày</span> liên tiếp.
                  </p>
                </div>
              </div>
            ) : (
              /* Custom Range Fields */
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Từ ngày <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500">
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Đến ngày <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500">
                      <Calendar className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Ghi chú chung cho giai đoạn
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Để trống hệ thống sẽ tự sinh nhật ký phong phú..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Chọn Tháng <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold"
                >
                  <option value="01">Tháng 1</option>
                  <option value="02">Tháng 2</option>
                  <option value="03">Tháng 3</option>
                  <option value="04">Tháng 4</option>
                  <option value="05">Tháng 5</option>
                  <option value="06">Tháng 6</option>
                  <option value="07">Tháng 7</option>
                  <option value="08">Tháng 8</option>
                  <option value="09">Tháng 9</option>
                  <option value="10">Tháng 10</option>
                  <option value="11">Tháng 11</option>
                  <option value="12">Tháng 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Chọn Năm <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold"
                >
                  <option value="2025">Năm 2025</option>
                  <option value="2026">Năm 2026</option>
                  <option value="2027">Năm 2027</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Ghi chú chung cho tháng
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Để trống hệ thống sẽ tự sinh nhật ký phong phú cho từng ngày..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs"
              />
            </div>
          </div>
        )}

        {/* 3. Expense calculation mode and inputs */}
        {inputMode === 'single' ? (
          <div className="space-y-4">
            {/* Calculation Toggle */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 gap-1 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setCalcMode('margin')}
                className={`flex-1 py-1.5 px-2 text-center text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                  calcMode === 'margin'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Doanh thu & Tỷ suất LN
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('profit')}
                className={`flex-1 py-1.5 px-2 text-center text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                  calcMode === 'profit'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Lợi nhuận & Tỷ suất LN
              </button>
              <button
                type="button"
                onClick={() => setCalcMode('manual')}
                className={`flex-1 py-1.5 px-2 text-center text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                  calcMode === 'manual'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Nhập chi phí thủ công
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calcMode === 'profit' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Lợi nhuận mục tiêu (VND) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customProfitStr}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleMoneyInputChange(e.target.value, setCustomProfitStr)}
                    placeholder="Ví dụ: 5.000.000"
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold font-mono"
                  />
                  {profit > 0 && (
                    <p className="mt-1 text-[10px] text-zinc-500 text-right font-mono">
                      ≈ {formatVND(profit)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Doanh thu (VND) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={revenueStr}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleMoneyInputChange(e.target.value, setRevenueStr)}
                    placeholder="Nhập số tiền bán được"
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold font-mono"
                  />
                  {revenue > 0 && (
                    <p className="mt-1 text-[10px] text-zinc-500 text-right font-mono">
                      ≈ {formatVND(revenue)}
                    </p>
                  )}
                </div>
              )}

              {calcMode === 'margin' || calcMode === 'profit' ? (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Tỷ suất Lợi nhuận (%)
                    </label>
                    <span className="text-xs text-sky-400 font-extrabold font-mono">
                      {marginPercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="90"
                      value={marginPercentStr}
                      onChange={(e) => setMarginPercentStr(e.target.value)}
                      className="flex-1 accent-sky-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="1"
                      max="90"
                      placeholder="20"
                      value={marginPercentStr}
                      onFocus={handleInputFocus}
                      onChange={(e) => handleMarginPercentChange(e.target.value)}
                      onBlur={handleMarginPercentBlur}
                      className="w-14 px-1.5 py-1 text-center bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs font-bold font-mono"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500 text-right">
                    Chuẩn ngành: <span className="text-zinc-400">{benchmarkMargin}%</span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Chi phí thực tế (VND) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expenseStr}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleMoneyInputChange(e.target.value, setExpenseStr)}
                    placeholder="Vốn nhập hàng, hoạt động..."
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold font-mono"
                  />
                  {expense > 0 && (
                    <p className="mt-1 text-[10px] text-zinc-500 text-right font-mono">
                      ≈ {formatVND(expense)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-xl text-[11px] text-sky-400 leading-relaxed flex gap-2">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Chế độ tự động: Chỉ cần nhập tổng doanh thu hoặc tổng lợi nhuận và tỷ suất lợi nhuận mong muốn. Hệ thống sẽ tự động phân bổ ngẫu nhiên doanh thu tự nhiên và tính toán chi phí phù hợp cho từng ngày.</span>
            </div>

            {/* Range Input Type Toggle */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 gap-1 w-full max-w-xs sm:max-w-md">
              <button
                type="button"
                onClick={() => setRangeInputType('revenue')}
                className={`flex-1 py-1.5 text-center text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                  rangeInputType === 'revenue'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Phát sinh theo Doanh thu
              </button>
              <button
                type="button"
                onClick={() => setRangeInputType('profit')}
                className={`flex-1 py-1.5 text-center text-[10px] uppercase tracking-wider font-extrabold rounded-lg transition-all cursor-pointer ${
                  rangeInputType === 'profit'
                    ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/30'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Phát sinh theo Lợi nhuận
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rangeInputType === 'profit' ? (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {inputMode === 'month' ? 'Tổng Lợi nhuận tháng (VND)' : 'Tổng Lợi nhuận giai đoạn (VND)'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalProfitStr}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleMoneyInputChange(e.target.value, setTotalProfitStr)}
                    placeholder={inputMode === 'month' ? "Ví dụ: 18.000.000" : "Ví dụ: 6.000.000"}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold font-mono"
                  />
                  {rangeProfit > 0 && (
                    <p className="mt-1 text-[10px] text-zinc-500 text-right font-mono">
                      ≈ {formatVND(rangeProfit)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    {inputMode === 'month' ? 'Tổng Doanh thu tháng (VND)' : 'Tổng Doanh thu giai đoạn (VND)'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalRevenueStr}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleMoneyInputChange(e.target.value, setTotalRevenueStr)}
                    placeholder={inputMode === 'month' ? "Ví dụ: 90.000.000" : "Ví dụ: 30.000.000"}
                    className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold font-mono"
                  />
                  {totalRevenue > 0 && (
                    <p className="mt-1 text-[10px] text-zinc-500 text-right font-mono">
                      ≈ {formatVND(totalRevenue)}
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Tỷ suất Lợi nhuận (%)
                  </label>
                  <span className="text-xs text-sky-400 font-extrabold font-mono">
                    {rangeMarginPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="90"
                    value={marginPercentStr}
                    onChange={(e) => setMarginPercentStr(e.target.value)}
                    className="flex-1 accent-sky-500 h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="20"
                    value={marginPercentStr}
                    onFocus={handleInputFocus}
                    onChange={(e) => handleMarginPercentChange(e.target.value)}
                    onBlur={handleMarginPercentBlur}
                    className="w-14 px-1.5 py-1 text-center bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs font-bold font-mono"
                  />
                </div>
                <p className="mt-1 text-[10px] text-zinc-500 text-right">
                  Chuẩn ngành: <span className="text-zinc-400">{benchmarkMargin}%</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Live Calculation & Simulation Previews */}
        {inputMode === 'single' ? (
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Kết quả tính toán sơ bộ ngày
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-zinc-500">Lợi nhuận gộp:</div>
                <div className={`text-sm font-extrabold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatVND(profit)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Tỷ suất lợi nhuận thực tế:</div>
                <div className={`text-sm font-extrabold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {computedMargin.toFixed(1)}%
                </div>
              </div>
            </div>
            {calcMode === 'margin' && revenue > 0 && (
              <p className="text-[10px] text-zinc-500 italic mt-1 pt-1.5 border-t border-zinc-900/50">
                * Chi phí đã tự động được tính là: <span className="text-zinc-400 font-mono font-semibold">{formatVND(expense)}</span>
              </p>
            )}
            {calcMode === 'profit' && profit > 0 && (
              <p className="text-[10px] text-zinc-500 italic mt-1 pt-1.5 border-t border-zinc-900/50">
                * Doanh thu được tạo tự động: <span className="text-sky-400 font-mono font-semibold">{formatVND(revenue)}</span> (Chi phí: <span className="text-zinc-400 font-mono font-semibold">{formatVND(expense)}</span>)
              </p>
            )}
            {profit < 0 && (
              <div className="text-[10px] text-red-400 flex items-center gap-1.5 mt-1 pt-1 border-t border-zinc-900/50">
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span>Cửa hàng đang lỗ trong ngày này.</span>
              </div>
            )}
          </div>
        ) : (
          daysCount > 0 && totalRevenue > 0 && (
            <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {inputMode === 'month' 
                  ? `Bản đồ mô phỏng tháng ${selectedMonth}/${selectedYear} (${daysCount} ngày)` 
                  : `Bản đồ dữ liệu mô phỏng (${daysCount} ngày)`}
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs">
                {rangeInputType === 'profit' && (
                  <>
                    <div className="text-zinc-500">Tổng doanh thu tương ứng:</div>
                    <div className="font-semibold text-sky-400 font-mono text-right font-extrabold">
                      ≈ {formatVND(totalRevenue)}
                    </div>
                  </>
                )}
                <div className="text-zinc-500">Mức TB ngày:</div>
                <div className="font-semibold text-zinc-300 font-mono text-right">
                  ≈ {formatVND(avgDailyRevenue)} / ngày
                </div>
                <div className="text-zinc-500">Tổng lợi nhuận:</div>
                <div className="font-semibold text-emerald-400 font-mono text-right font-bold">
                  ≈ {formatVND(rangeProfit)} ({rangeMarginPercent}% tỷ suất)
                </div>
                <div className="text-zinc-500">Tổng chi phí dự kiến:</div>
                <div className="font-semibold text-zinc-400 font-mono text-right">
                  ≈ {formatVND(rangeExpense)}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed italic border-t border-zinc-850 pt-2 mt-1">
                {rangeInputType === 'profit' 
                  ? `💡 Hệ thống tự động tạo Tổng doanh thu ${formatVND(totalRevenue)} từ Lợi nhuận mục tiêu và tỷ suất lợi nhuận ${rangeMarginPercent}%. Doanh thu được phân phối ngẫu nhiên thông minh theo từng ngày (tăng trưởng cuối tuần).`
                  : `💡 Hệ thống sẽ tự động phân phối doanh thu ngẫu nhiên thông minh quanh mức ${formatVND(avgDailyRevenue)} VND hàng ngày (với mức đỉnh cuối tuần thực tế), tự động suy diễn chi phí cho từng ngày từ tỷ suất ${rangeMarginPercent}%.`}
              </p>
            </div>
          )
        )}

        <div className="flex gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium text-xs transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleClearInputs}
            className="flex-1 py-2.5 border border-red-900/30 hover:bg-red-950/25 text-red-400 rounded-xl font-semibold text-xs transition-all cursor-pointer"
          >
            Xóa trắng
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-450 text-zinc-950 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-colors shadow-sm cursor-pointer"
          >
            {record ? 'Cập nhật' : inputMode === 'single' ? 'Ghi nhận' : 'Phát sinh dữ liệu'}
          </button>
        </div>
      </form>
    </div>
  );
}
