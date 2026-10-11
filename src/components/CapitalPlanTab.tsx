import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Store, SalesRecord, ProjectionParams, INDUSTRIES } from '../types';
import { formatVND, formatNumberWithDots, parseNumberFromDots } from '../utils/sampleData';
import { Download, Calculator, Info, TrendingUp, Landmark, ShieldCheck, HelpCircle, Sparkles, Zap, CheckCircle2, FileSpreadsheet, RefreshCw, BarChart2 } from 'lucide-react';
import GenerateRevenueModal from './GenerateRevenueModal';
import { getTaxRateForIndustry, getIndustryCostRatio, getDefaultIndustryParameters, getDefaultRemainingDays } from '../utils/revenueGenerator';

// Component for monetary VND inputs with dot separators (Allows clearing completely & easy typing)
interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
}

function NumericInput({ value, onChange, className, placeholder = '0' }: NumericInputProps) {
  const [localVal, setLocalVal] = useState<string>(() => (value === 0 ? '' : formatNumberWithDots(value)));
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalVal(value === 0 ? '' : formatNumberWithDots(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setLocalVal('');
      onChange(0);
      return;
    }
    // Remove leading zeros: '05' -> '5', '000' -> '0'
    raw = raw.replace(/^0+(?=\d)/, '');
    const num = parseInt(raw, 10) || 0;
    setLocalVal(raw === '0' ? '0' : formatNumberWithDots(num));
    onChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    const target = e.currentTarget;
    requestAnimationFrame(() => target.select());
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!localVal || localVal.trim() === '') {
      setLocalVal('');
      onChange(0);
    } else {
      const clean = localVal.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
      const num = parseInt(clean, 10) || 0;
      setLocalVal(num === 0 ? '' : formatNumberWithDots(num));
      onChange(num);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

// Component for decimal inputs (VCB interest rate %, Reduction rate %, Turnover)
interface DecimalRateInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  fallbackValue?: number;
}

function DecimalRateInput({
  value,
  onChange,
  className,
  placeholder = '0',
  min,
  max,
  fallbackValue = 0,
}: DecimalRateInputProps) {
  const [localVal, setLocalVal] = useState<string>(() => (value === 0 || value === undefined || value === null ? '' : String(value)));
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalVal(value === 0 || value === undefined || value === null ? '' : String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Support Vietnamese comma as decimal separator
    val = val.replace(',', '.');

    // Allow empty string, intermediate signs, digits, and single dot
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      // Strip leading zeros if followed by non-decimal digit (e.g., '05' -> '5')
      if (/^0\d+/.test(val)) {
        val = val.replace(/^0+/, '');
      }
      setLocalVal(val);
      if (val === '' || val === '.' || val === '-') {
        onChange(0);
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          onChange(num);
        }
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    const target = e.currentTarget;
    requestAnimationFrame(() => target.select());
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!localVal || localVal.trim() === '' || isNaN(parseFloat(localVal))) {
      setLocalVal(fallbackValue === 0 ? '' : String(fallbackValue));
      onChange(fallbackValue);
    } else {
      let num = parseFloat(localVal);
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
      setLocalVal(num === 0 ? '' : String(num));
      onChange(num);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

// Component for integer day inputs (arDays, invDays, apDays, remainingDays)
interface IntegerDaysInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  fallbackValue?: number;
}

function IntegerDaysInput({
  value,
  onChange,
  className,
  placeholder = '0',
  min = 0,
  max = 365,
  fallbackValue = 0,
}: IntegerDaysInputProps) {
  const [localVal, setLocalVal] = useState<string>(() => (value === 0 ? '' : String(value)));
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalVal(value === 0 ? '' : String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setLocalVal('');
      onChange(0);
      return;
    }
    // Remove leading zeros: '05' -> '5', '00' -> '0'
    raw = raw.replace(/^0+(?=\d)/, '');
    const num = parseInt(raw, 10) || 0;
    setLocalVal(raw === '0' ? '0' : String(num));
    onChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    const target = e.currentTarget;
    requestAnimationFrame(() => target.select());
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!localVal || localVal.trim() === '') {
      const finalVal = fallbackValue;
      setLocalVal(finalVal === 0 ? '' : String(finalVal));
      onChange(finalVal);
    } else {
      let num = parseInt(localVal.replace(/\D/g, ''), 10);
      if (isNaN(num)) num = fallbackValue;
      if (min !== undefined && num < min) num = min;
      if (max !== undefined && num > max) num = max;
      setLocalVal(num === 0 ? '' : String(num));
      onChange(num);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

interface CapitalPlanTabProps {
  store: Store;
  records: SalesRecord[];
  onUpdateStore?: (storeId: string, updatedFields: Partial<Store>) => void;
  onBatchCreateRecords?: (records: SalesRecord[], isOverwrite?: boolean) => void;
}

export default function CapitalPlanTab({ store, records, onUpdateStore, onBatchCreateRecords }: CapitalPlanTabProps) {
  const [lookbackMonths, setLookbackMonths] = useState<3 | 6 | 12>(3);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // 1. Filter store records in the last days (depending on selected lookback)
  const storeRecords = useMemo(() => {
    return records
      .filter((r) => r.storeId === store.id)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort newest first
  }, [records, store.id]);

  const lastMonthsRecords = useMemo(() => {
    // Take records from the last days depending on lookback option
    const limit = lookbackMonths === 3 ? 90 : lookbackMonths === 6 ? 180 : 360;
    return storeRecords.slice(0, limit);
  }, [storeRecords, lookbackMonths]);

  // Calculate actual totals for the selected period
  const actualRevenue = useMemo(() => lastMonthsRecords.reduce((sum, r) => sum + r.revenue, 0), [lastMonthsRecords]);
  const actualExpense = useMemo(() => lastMonthsRecords.reduce((sum, r) => sum + r.expense, 0), [lastMonthsRecords]);
  const actualProfit = useMemo(() => lastMonthsRecords.reduce((sum, r) => sum + r.profit, 0), [lastMonthsRecords]);

  // Annualized baseline calculation
  const baselineResults = useMemo(() => {
    let daysCount = lookbackMonths === 3 ? 90 : lookbackMonths === 6 ? 180 : 360;
    if (lastMonthsRecords.length > 1) {
      const dates = lastMonthsRecords.map(r => new Date(r.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      daysCount = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
    } else if (lastMonthsRecords.length === 1) {
      daysCount = 1;
    }

    const totalRev = lastMonthsRecords.reduce((sum, r) => sum + r.revenue, 0);
    const totalExp = lastMonthsRecords.reduce((sum, r) => sum + r.expense, 0);

    // Default fallbacks if no records (matching typical store industries or the picture)
    let defaultRevenue = 7980000000;
    let defaultExpense = 7022400000;

    if (store.industry === 'giuong_tu_ban_ghe') {
      defaultRevenue = 12000000000;
      defaultExpense = 10200000000;
    } else if (store.industry === 'do_dung_em_be') {
      defaultRevenue = 3500000000;
      defaultExpense = 2730000000;
    } else if (store.industry === 'vat_lieu_xay_dung') {
      defaultRevenue = 9500000000;
      defaultExpense = 7980000000;
    } else if (store.industry === 'bia_nuoc_giai_khat') {
      defaultRevenue = 7980000000;
      defaultExpense = 7022400000;
    } else if (store.industry === 'ca_phe') {
      defaultRevenue = 1500000000;
      defaultExpense = 975000000;
    } else if (store.industry === 'nha_hang') {
      defaultRevenue = 4500000000;
      defaultExpense = 3600000000;
    } else if (store.industry === 'cay_canh') {
      defaultRevenue = 2000000000;
      defaultExpense = 1400000000;
    } else if (store.industry === 'tap_hoa') {
      defaultRevenue = 3200000000;
      defaultExpense = 2816000000;
    } else if (store.industry === 'hang_nong_san') {
      defaultRevenue = 5500000000;
      defaultExpense = 4840000000;
    }

    if (totalRev > 0) {
      const dailyRev = totalRev / daysCount;
      const dailyExp = totalExp / daysCount;
      return {
        revenue: Math.round(dailyRev * 360),
        expense: Math.round(dailyExp * 360),
        isCalculated: true,
        daysSpan: daysCount
      };
    }

    return {
      revenue: defaultRevenue,
      expense: defaultExpense,
      isCalculated: false,
      daysSpan: 0
    };
  }, [lastMonthsRecords, lookbackMonths, store.industry]);

  const costRatioInfo = useMemo(() => getIndustryCostRatio(store.industry), [store.industry]);

  const getInitialParams = (): ProjectionParams => {
    let savedLocal: Partial<ProjectionParams> | null = null;
    try {
      const item = localStorage.getItem(`projection_params_${store.id}`);
      if (item) savedLocal = JSON.parse(item);
    } catch (e) {
      console.warn('Failed reading local projection params', e);
    }

    const baseParams = store.projectionParams || savedLocal;
    const defaultParams = getDefaultIndustryParameters(store.industry);
    const taxRate = getTaxRateForIndustry(store.industry).rate;

    if (baseParams) {
      return {
        histOwnCapital: baseParams.histOwnCapital ?? defaultParams.histOwnCapital,
        histVcbLoan: baseParams.histVcbLoan ?? defaultParams.histVcbLoan,
        histOtherCapital: baseParams.histOtherCapital ?? defaultParams.histOtherCapital,
        histTurnover: baseParams.histTurnover ?? defaultParams.histTurnover ?? 2.0,
        histDepreciation: baseParams.histDepreciation ?? defaultParams.histDepreciation,
        histInterest: baseParams.histInterest ?? defaultParams.histInterest,
        histOtherExpense: baseParams.histOtherExpense ?? defaultParams.histOtherExpense,
        histTax: baseParams.histTax ?? defaultParams.histTax,
        histLc: baseParams.histLc ?? 0,
        histGuarantee: baseParams.histGuarantee ?? 0,

        projOwnCapital: baseParams.projOwnCapital ?? defaultParams.projOwnCapital,
        projVcbLoan: baseParams.projVcbLoan ?? defaultParams.projVcbLoan,
        projOtherCapital: baseParams.projOtherCapital ?? defaultParams.projOtherCapital,
        projTurnover: baseParams.projTurnover ?? defaultParams.projTurnover ?? 2.0,
        projDepreciation: baseParams.projDepreciation ?? defaultParams.projDepreciation,
        projOtherExpense: baseParams.projOtherExpense ?? defaultParams.projOtherExpense,
        vcbInterestRate: baseParams.vcbInterestRate ?? defaultParams.vcbInterestRate ?? 9.0,
        projTaxRate: baseParams.projTaxRate ?? taxRate,
        projLc: baseParams.projLc ?? 0,
        projGuarantee: baseParams.projGuarantee ?? 0,

        arDays: baseParams.arDays ?? defaultParams.arDays ?? 45,
        apDays: baseParams.apDays ?? defaultParams.apDays ?? 30,
        invDays: baseParams.invDays ?? defaultParams.invDays ?? 65,
        reductionRate: baseParams.reductionRate !== undefined ? baseParams.reductionRate : 15.0,
        remainingDays: baseParams.remainingDays ?? defaultParams.remainingDays ?? getDefaultRemainingDays(),
      };
    }

    return defaultParams;
  };

  const [activeParams, setActiveParams] = useState<ProjectionParams>(getInitialParams);
  const [draftParams, setDraftParams] = useState<ProjectionParams>(getInitialParams);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showAutoCalcToast, setShowAutoCalcToast] = useState(false);

  // Sync draft and active params on store switch or initial load
  React.useEffect(() => {
    const initial = getInitialParams();
    setActiveParams(initial);
    setDraftParams(initial);
  }, [store.id, store.industry]);

  // Handler for Auto-calculating standard parameters by industry
  const handleAutoCalculateByIndustry = () => {
    const standardParams = getDefaultIndustryParameters(store.industry);
    setDraftParams(standardParams);
    setActiveParams(standardParams);
    if (onUpdateStore) {
      onUpdateStore(store.id, { projectionParams: standardParams });
    }
    try {
      localStorage.setItem(`projection_params_${store.id}`, JSON.stringify(standardParams));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    setShowAutoCalcToast(true);
    setTimeout(() => setShowAutoCalcToast(false), 3500);
  };

  // Helper to persist draftParams changes locally when inputting
  const updateDraftParams = (updater: (prev: ProjectionParams) => ProjectionParams) => {
    setDraftParams((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(`projection_params_${store.id}`, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return next;
    });
  };

  // Debounce syncing draftParams to App / Firestore after user stops typing
  React.useEffect(() => {
    if (!onUpdateStore) return;
    const timer = setTimeout(() => {
      onUpdateStore(store.id, { projectionParams: draftParams });
    }, 1500);
    return () => clearTimeout(timer);
  }, [draftParams, store.id, onUpdateStore]);

  // 4. Calculations for 2025 (Historical Columns)
  const histMetrics = useMemo(() => {
    const ownCapital = activeParams.histOwnCapital || 0;
    const otherCapital = activeParams.histOtherCapital || 0;
    const vcbLoan = activeParams.histVcbLoan || 0;
    
    // Nhu cầu vốn lưu động 2025 = Vốn tự có + Vốn khác + Vay VCB
    const workingCapRequirement = ownCapital + otherCapital + vcbLoan;
    const histTurnover = activeParams.histTurnover || 2.0;

    let revenue: number;
    if (workingCapRequirement > 0) {
      // Doanh thu = Nhu cầu vốn lưu động × Vòng quay
      revenue = Math.round(workingCapRequirement * histTurnover);
    } else {
      const projRemainingDays = activeParams.remainingDays !== undefined && activeParams.remainingDays > 0 ? activeParams.remainingDays : getDefaultRemainingDays();
      const projVcbAvg = Math.round(((activeParams.projVcbLoan || 0) * projRemainingDays) / 365);
      const projWCR = (activeParams.projOwnCapital || 0) + (activeParams.projOtherCapital || 0) + projVcbAvg;
      const projTurnover = activeParams.projTurnover || 2.0;
      const projRev = Math.round(projWCR * projTurnover);
      const reductionRate = activeParams.reductionRate !== undefined ? activeParams.reductionRate : 15.0;
      revenue = Math.round(projRev * (1 - reductionRate / 100));
    }
    
    // Chi phí SXKD bằng 75% đến 90% Doanh thu tùy ngành
    const costRatio = costRatioInfo.costRatio;
    const totalExpense = Math.round(revenue * costRatio);
    
    // Khấu hao, Lãi vay, Chi phí khác
    const dep = activeParams.histDepreciation || 0;
    const int = activeParams.histInterest || 0;
    const otherExp = activeParams.histOtherExpense || 0;

    // Chi phí ngắn hạn phục vụ SXKD
    const expense = Math.max(0, totalExpense - dep - int - otherExp);
    
    const rawPbt = revenue - expense - dep - int - otherExp;
    const pbt = Math.max(0, rawPbt);
    
    // Thuế tính theo doanh thu theo Thông tư 40/2021/TT-BTC
    const taxRate = getTaxRateForIndustry(store.industry).rate;
    const tax = Math.round(revenue * (taxRate / 100));
    const pat = Math.max(0, pbt - tax);

    return {
      revenue,
      totalExpense,
      expense,
      pbt,
      pat,
      workingCapRequirement,
      otherCapital,
      ownCapital,
      vcbLoan,
      vcbLoanAvg: vcbLoan,
      remainingDays: 365,
      tax
    };
  }, [activeParams, store.industry, costRatioInfo]);

  // 5. Calculations for 2026 (Projection Columns)
  // Quy tắc người dùng:
  // - Vốn vay VCB bình quân = (Vốn vay VCB × Số ngày còn lại trong năm) / 365
  // - Nhu cầu VLĐ = Tổng vốn tự có + Vốn khác + Vốn vay VCB bình quân
  // - Doanh thu dự phóng = Nhu cầu VLĐ × Vòng quay vốn
  const projMetrics = useMemo(() => {
    const ownCapital = activeParams.projOwnCapital || 0;
    const otherCapital = activeParams.projOtherCapital || 0;
    const vcbLoan = activeParams.projVcbLoan || 0;
    const remainingDays = activeParams.remainingDays !== undefined && activeParams.remainingDays > 0 ? activeParams.remainingDays : getDefaultRemainingDays();
    
    // Vốn vay VCB bình quân
    const vcbLoanAvg = Math.round((vcbLoan * remainingDays) / 365);

    // Nhu cầu vốn lưu động = Vốn tự có + Vốn khác + Vốn vay VCB bình quân
    const workingCapRequirement = ownCapital + otherCapital + vcbLoanAvg;
    const projTurnover = activeParams.projTurnover || 2.0;

    // Doanh thu dự phóng = Nhu cầu vốn lưu động × Vòng quay vốn
    const revenue = Math.round(workingCapRequirement * projTurnover);

    // Chi phí SXKD bằng 75% đến 90% Doanh thu tùy ngành
    const costRatio = costRatioInfo.costRatio;
    const totalExpense = Math.round(revenue * costRatio);

    // Lãi vay tính trên dư nợ bình quân
    const newInterest = Math.round(vcbLoanAvg * ((activeParams.vcbInterestRate || 9.0) / 100));
    const totalInterest = (activeParams.histInterest || 0) + newInterest;
    const dep = activeParams.projDepreciation || 0;
    const otherExp = activeParams.projOtherExpense || 0;

    // Chi phí ngắn hạn phục vụ SXKD
    const expense = Math.max(0, totalExpense - dep - totalInterest - otherExp);

    const rawPbt = revenue - expense - dep - totalInterest - otherExp;
    const pbt = Math.max(0, rawPbt);
    
    // Thuế tính theo doanh thu
    const taxRate = getTaxRateForIndustry(store.industry).rate;
    const tax = Math.round(revenue * (taxRate / 100));
    const pat = Math.max(0, pbt - tax);

    return {
      workingCapRequirement,
      revenue,
      totalExpense,
      expense,
      interest: totalInterest,
      pbt,
      tax,
      pat,
      otherCapital,
      ownCapital,
      vcbLoan,
      vcbLoanAvg,
      remainingDays
    };
  }, [activeParams, store.industry, costRatioInfo]);

  // 6. Export to formatted Excel (.xlsx) function
  const exportToExcel = () => {
    const titleRow = [`PHƯƠNG ÁN SỬ DỤNG VỐN NGẮN HẠN & DỰ PHÓNG - ${store.name.toUpperCase()}`];
    const subTitleRow = [`Cửa hàng: ${store.name} | Đơn vị tính: Đồng (VNĐ)`];
    const emptyRow = [''];

    const headers = ['STT', 'Chỉ tiêu (Field Name)', 'Đã kết thúc niên độ 2025', 'Dự phóng niên độ 2026'];

    const dataRows = [
      [1, 'Doanh thu (Nhu cầu VLĐ x Vòng quay)', histMetrics.revenue, projMetrics.revenue],
      [2, 'Chi phí ngắn hạn phục vụ SXKD', histMetrics.expense, projMetrics.expense],
      [3, 'Chi phí khấu hao tài sản', activeParams.histDepreciation, activeParams.projDepreciation],
      [4, 'Chi phí lãi vay', activeParams.histInterest, projMetrics.interest],
      [5, 'Chi phí khác', activeParams.histOtherExpense, activeParams.projOtherExpense],
      [6, 'Lợi nhuận trước thuế', histMetrics.pbt, projMetrics.pbt],
      [7, 'Thuế phải nộp', histMetrics.tax, projMetrics.tax],
      [8, 'Lợi nhuận sau thuế', histMetrics.pat, projMetrics.pat],
      ['', '--- NHU CẦU VỐN LƯU ĐỘNG ---', '', ''],
      [9, 'Số ngày phải thu bình quân (ngày)', activeParams.arDays, activeParams.arDays],
      [10, 'Số ngày phải trả bình quân (ngày)', activeParams.apDays, activeParams.apDays],
      [11, 'Số ngày tồn kho bình quân (ngày)', activeParams.invDays, activeParams.invDays],
      [12, 'Thời gian 1 chu kỳ kinh doanh (ngày)', activeParams.arDays + activeParams.invDays, activeParams.arDays + activeParams.invDays],
      [13, 'Số vòng quay vốn lưu động trong năm', Number(activeParams.histTurnover.toFixed(2)), Number(activeParams.projTurnover.toFixed(2))],
      [14, 'Nhu cầu vốn lưu động (Tự có + Khác + Vay VCB BQ)', histMetrics.workingCapRequirement, projMetrics.workingCapRequirement],
      [15, 'Vốn tự có', histMetrics.ownCapital, projMetrics.ownCapital],
      [16, 'Vốn khác', histMetrics.otherCapital, projMetrics.otherCapital],
      [17, 'Vay VCB (Hạn mức đề nghị)', histMetrics.vcbLoan, projMetrics.vcbLoan],
      [18, 'Vốn vay VCB bình quân (Vay VCB x Ngày / 365)', histMetrics.vcbLoan, projMetrics.vcbLoanAvg],
      [19, 'Số ngày còn lại trong năm (ngày)', 365, projMetrics.remainingDays],
      ['', '--- NHU CẦU TÍN DỤNG ĐỐI VỚI TÀI TRỢ THƯƠNG MẠI ---', '', ''],
      [20, 'LC (Thư tín dụng)', activeParams.histLc, activeParams.projLc],
      [21, 'Bảo lãnh', activeParams.histGuarantee, activeParams.projGuarantee]
    ];

    const wsData = [
      titleRow,
      subTitleRow,
      emptyRow,
      headers,
      ...dataRows
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set clear column widths
    worksheet['!cols'] = [
      { wch: 8 },  // Column A: STT
      { wch: 48 }, // Column B: Chỉ tiêu
      { wch: 28 }, // Column C: 2025
      { wch: 28 }  // Column D: 2026
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Phương án vốn');

    const cleanName = store.name.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi, '').trim().replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `phuong_an_von_ngan_han_${cleanName || 'cuahang'}.xlsx`);
  };

  const draftHistMetrics = useMemo(() => {
    const ownCapital = draftParams.histOwnCapital || 0;
    const otherCapital = draftParams.histOtherCapital || 0;
    const vcbLoan = draftParams.histVcbLoan || 0;
    const workingCapRequirement = ownCapital + otherCapital + vcbLoan;
    return { workingCapRequirement, otherCapital, ownCapital, vcbLoan, vcbLoanAvg: vcbLoan };
  }, [draftParams]);

  const draftProjMetrics = useMemo(() => {
    const ownCapital = draftParams.projOwnCapital || 0;
    const otherCapital = draftParams.projOtherCapital || 0;
    const vcbLoan = draftParams.projVcbLoan || 0;
    const remainingDays = draftParams.remainingDays !== undefined && draftParams.remainingDays > 0 ? draftParams.remainingDays : getDefaultRemainingDays();
    const vcbLoanAvg = Math.round((vcbLoan * remainingDays) / 365);
    const workingCapRequirement = ownCapital + otherCapital + vcbLoanAvg;
    return { workingCapRequirement, otherCapital, ownCapital, vcbLoan, vcbLoanAvg, remainingDays };
  }, [draftParams]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Parameters Panel */}
      <div className="xl:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-sm font-bold text-zinc-100 truncate">Thông số dự phóng</h3>
              {store.projectionParams && (
                <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Đã lưu phương án dự phóng mới nhất">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  Đã lưu
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Nhập vốn tự có, vay VCB để tính toán dữ liệu</p>
          </div>
        </div>

        {/* Quick Industry Automation Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/30 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-300">Quy tắc tính tự động theo ngành</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {costRatioInfo.costRatioPercent}% Chi phí
            </span>
          </div>

          <div className="text-[11px] text-zinc-300 space-y-1.5 bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-850/80">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Ngành hàng:</span>
              <span className="font-semibold text-zinc-200">{INDUSTRIES[store.industry]?.name || store.industry}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Doanh thu dự phóng:</span>
              <span className="font-mono font-bold text-rose-300">Nhu cầu VLĐ × 2.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Tỷ lệ Chi phí SXKD:</span>
              <span className="font-mono font-bold text-amber-300">{costRatioInfo.costRatioPercent}% Doanh thu</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Thuế GTGT + TNCN:</span>
              <span className="font-mono font-bold text-emerald-400">{getTaxRateForIndustry(store.industry).rate}% Doanh thu</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoCalculateByIndustry}
            className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            title="Tự động điền và tính toán các chỉ tiêu theo quy chuẩn tối ưu của ngành hàng này"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tự động tính toán chuẩn ngành {INDUSTRIES[store.industry]?.name?.split(' ')[0] || ''}
          </button>

          {showAutoCalcToast && (
            <div className="text-center text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 py-1 px-2 rounded-lg animate-fade-in">
              ✓ Đã tự động tính toán phương án chuẩn cho ngành {INDUSTRIES[store.industry]?.name}!
            </div>
          )}
        </div>

        {/* Informational Callout for New Store with 0 records */}
        {storeRecords.length === 0 && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-300">Cửa hàng mới chưa có doanh thu</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Nhập các chỉ tiêu phương án vay vốn (Vốn tự có, Vay VCB, Vòng quay...) rồi bấm nút bên dưới để tự động tạo 12 tháng doanh thu khớp <strong>chính xác 100% phương án năm cũ và năm nay</strong>!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Tạo 12T Doanh thu từ Dự phóng
            </button>
          </div>
        )}

        {/* Informational baseline helper */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-1.5 border-b border-zinc-850 pb-2">
            <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Dữ liệu thực tế</span>
            </div>
            {/* Lookback selection buttons */}
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setLookbackMonths(3)}
                className={`px-2 py-0.5 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                  lookbackMonths === 3
                    ? 'bg-zinc-800 text-sky-400 border border-zinc-700/30 shadow-sm font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                3T
              </button>
              <button
                type="button"
                onClick={() => setLookbackMonths(6)}
                className={`px-2 py-0.5 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                  lookbackMonths === 6
                    ? 'bg-zinc-800 text-sky-400 border border-zinc-700/30 shadow-sm font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                6T
              </button>
              <button
                type="button"
                onClick={() => setLookbackMonths(12)}
                className={`px-2 py-0.5 text-center text-[10px] font-bold rounded transition-all cursor-pointer ${
                  lookbackMonths === 12
                    ? 'bg-zinc-800 text-sky-400 border border-zinc-700/30 shadow-sm font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                12T
              </button>
            </div>
          </div>
          <div className="text-[11px] text-zinc-400 space-y-1">
            {baselineResults.isCalculated ? (
              <>
                <p>
                  * Phát hiện <span className="text-zinc-100 font-bold">{lastMonthsRecords.length}</span> ngày nhập liệu trong khoảng <span className="text-zinc-100 font-bold">{baselineResults.daysSpan}</span> ngày gần nhất.
                </p>
                <div className="pt-1 grid grid-cols-3 gap-1 font-mono text-[10px]">
                  <div className="bg-zinc-900 p-1.5 rounded text-center">
                    <span className="block text-zinc-500">Doanh thu {lookbackMonths}T</span>
                    <span className="text-sky-400 font-semibold">{formatVND(actualRevenue)}</span>
                  </div>
                  <div className="bg-zinc-900 p-1.5 rounded text-center">
                    <span className="block text-zinc-500">Chi phí {lookbackMonths}T</span>
                    <span className="text-zinc-400 font-semibold">{formatVND(actualExpense)}</span>
                  </div>
                  <div className="bg-zinc-900 p-1.5 rounded text-center">
                    <span className="block text-zinc-500">Lợi nhuận {lookbackMonths}T</span>
                    <span className="text-emerald-400 font-semibold">{formatVND(actualProfit)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 italic pt-1 text-center">
                  Dữ liệu {lookbackMonths} tháng gần nhất được quy đổi sang 360 ngày làm mốc Dự phóng 2026. Dữ liệu năm 2025 tính giảm {draftParams.reductionRate}% từ doanh thu dự phóng.
                </p>
              </>
            ) : (
              <p className="italic text-zinc-500">
                Chưa có dữ liệu nhật ký doanh số thực tế {lookbackMonths} tháng gần nhất. Hệ thống đang áp dụng dữ liệu mặc định của ngành nghề <strong>{store.industry === 'giuong_tu_ban_ghe' ? 'Sản xuất đồ gỗ nội thất' : 'Bán lẻ'}</strong>.
              </p>
            )}
          </div>
        </div>

        {/* Inputs form */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Section 1: Working Capital Structure */}
          <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
              <span className="text-xs font-bold text-zinc-300">Cơ cấu Nguồn vốn lưu động</span>
              <span className="text-[9px] text-zinc-500 font-mono">Đơn vị: VND</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-400 mb-1">
              <div className="col-span-4">Chỉ tiêu</div>
              <div className="col-span-4 text-center">Lịch sử 2025</div>
              <div className="col-span-4 text-center text-rose-400">Dự phóng 2026</div>
            </div>
            
            {/* Vốn tự có */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">Vốn tự có</div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.histOwnCapital}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histOwnCapital: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.projOwnCapital}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projOwnCapital: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Vốn khác */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">Vốn khác</div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.histOtherCapital}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histOtherCapital: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.projOtherCapital}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projOtherCapital: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Vay VCB */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">
                <span>Vay VCB (Hạn mức)</span>
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.histVcbLoan}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histVcbLoan: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.projVcbLoan}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projVcbLoan: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Số ngày còn lại trong năm */}
            <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-zinc-850/60">
              <div className="col-span-4">
                <span className="text-[11px] font-medium text-zinc-300 block">Số ngày còn lại</span>
                <span className="text-[9px] text-zinc-500 block">Tính dư nợ BQ</span>
              </div>
              <div className="col-span-4 text-center">
                <span className="text-xs font-mono text-zinc-400">365 ngày</span>
              </div>
              <div className="col-span-4">
                <IntegerDaysInput
                  value={draftParams.remainingDays ?? getDefaultRemainingDays()}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, remainingDays: val }))}
                  min={1}
                  max={365}
                  fallbackValue={getDefaultRemainingDays()}
                  placeholder="180"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Quick Presets for Remaining Days */}
            <div className="flex items-center justify-end gap-1 flex-wrap pt-0.5">
              <button
                type="button"
                onClick={() => updateDraftParams(prev => ({ ...prev, remainingDays: getDefaultRemainingDays() }))}
                className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 cursor-pointer"
                title="Tính số ngày từ hôm nay đến 31/12"
              >
                Hôm nay ({getDefaultRemainingDays()}d)
              </button>
              {[30, 90, 180, 270, 365].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => updateDraftParams(prev => ({ ...prev, remainingDays: days }))}
                  className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer transition-all ${
                    (draftParams.remainingDays ?? getDefaultRemainingDays()) === days
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {/* Vốn vay VCB bình quân */}
            <div className="grid grid-cols-12 gap-2 items-center bg-zinc-900/40 p-1.5 rounded-lg border border-zinc-850/40">
              <div className="col-span-4">
                <span className="text-[11px] font-bold text-amber-400 block">Vay VCB bình quân</span>
                <span className="text-[8px] text-zinc-500 block leading-tight">(Vay x {draftProjMetrics.remainingDays}/365)</span>
              </div>
              <div className="col-span-4 text-center font-mono text-[11px] font-bold text-zinc-400">
                {draftHistMetrics.vcbLoan > 0 ? formatVND(draftHistMetrics.vcbLoan) : '-'}
              </div>
              <div className="col-span-4 text-center font-mono text-[11px] font-bold text-amber-400">
                {formatVND(draftProjMetrics.vcbLoanAvg)}
              </div>
            </div>

            {/* Tổng Nhu cầu VLĐ (= Tự có + Khác + Vay VCB BQ) */}
            <div className="pt-2 mt-1 border-t border-zinc-850/80 grid grid-cols-12 gap-2 items-center bg-zinc-900/60 p-2 rounded-lg">
              <div className="col-span-4">
                <span className="text-[11px] font-bold text-emerald-400 block">Nhu cầu VLĐ</span>
                <span className="text-[8px] text-zinc-500 block leading-tight">(= Tự có + Khác + Vay BQ)</span>
              </div>
              <div className="col-span-4 text-center font-mono text-[11px] font-bold text-zinc-200">
                {formatVND(draftHistMetrics.workingCapRequirement)}
              </div>
              <div className="col-span-4 text-center font-mono text-[11px] font-bold text-rose-400">
                {formatVND(draftProjMetrics.workingCapRequirement)}
              </div>
            </div>
          </div>

          {/* Section 2: Activity and Depreciation */}
          <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
              <span className="text-xs font-bold text-zinc-300">Vòng quay & Định phí</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-400 mb-1">
              <div className="col-span-4">Chỉ tiêu</div>
              <div className="col-span-4 text-center">Lịch sử 2025</div>
              <div className="col-span-4 text-center text-rose-400">Dự phóng 2026</div>
            </div>

            {/* Vòng quay vốn */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">Vòng quay vốn</div>
              <div className="col-span-4">
                <DecimalRateInput
                  value={draftParams.histTurnover}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histTurnover: val }))}
                  min={0.1}
                  max={50}
                  fallbackValue={2.0}
                  placeholder="2.0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <DecimalRateInput
                  value={draftParams.projTurnover}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projTurnover: val }))}
                  min={0.1}
                  max={50}
                  fallbackValue={2.0}
                  placeholder="2.0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Khấu hao */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">Khấu hao</div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.histDepreciation}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histDepreciation: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.projDepreciation}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projDepreciation: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Chi phí khác */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">CP Khác</div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.histOtherExpense}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histOtherExpense: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.projOtherExpense}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projOtherExpense: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Trade Finance (LC and Guarantee) - Defaults to 0 */}
          <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
              <span className="text-xs font-bold text-zinc-300">LC & Bảo lãnh (Mặc định 0)</span>
            </div>
            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-400 mb-1">
              <div className="col-span-4">Chỉ tiêu</div>
              <div className="col-span-4 text-center">Lịch sử 2025</div>
              <div className="col-span-4 text-center text-rose-400">Dự phóng 2026</div>
            </div>

            {/* LC */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">LC</div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.histLc}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histLc: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.projLc}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projLc: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Guarantee */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-xs font-medium text-zinc-300">Bảo lãnh</div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.histGuarantee}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histGuarantee: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="col-span-4">
                <NumericInput
                  value={draftParams.projGuarantee}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, projGuarantee: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-center text-xs font-mono text-rose-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Rates, Taxes & Cycle Days */}
          <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-1.5">
              <span className="text-xs font-bold text-zinc-300">Lãi suất, Thuế & Chu kỳ (Days)</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-medium text-zinc-400">Lãi suất VCB 2026 (%)</label>
                  <span className="text-[9px] font-mono text-emerald-400 font-semibold">{draftParams.vcbInterestRate}%</span>
                </div>
                <DecimalRateInput
                  value={draftParams.vcbInterestRate}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, vcbInterestRate: val }))}
                  fallbackValue={9.0}
                  min={0}
                  max={100}
                  placeholder="9.0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 text-xs"
                />
                {/* Quick preset chips for interest rate */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {[7.5, 8.0, 8.5, 9.0, 9.5, 10.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => updateDraftParams(prev => ({ ...prev, vcbInterestRate: rate }))}
                      className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer transition-all ${
                        draftParams.vcbInterestRate === rate
                          ? 'bg-emerald-500 text-zinc-950 font-bold'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-rose-400">Tỷ lệ giảm DT 2025 (%)</label>
                  <span className="text-[9px] font-mono text-rose-400 font-bold">-{draftParams.reductionRate !== undefined ? draftParams.reductionRate : 15.0}%</span>
                </div>
                <DecimalRateInput
                  value={draftParams.reductionRate !== undefined ? draftParams.reductionRate : 15.0}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, reductionRate: val }))}
                  fallbackValue={15.0}
                  min={0}
                  max={100}
                  placeholder="15.0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500 text-xs"
                />
                {/* Quick preset chips for reduction rate */}
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {[15.0, 16.0, 17.0, 18.0, 20.0].map((redRate) => (
                    <button
                      key={redRate}
                      type="button"
                      onClick={() => updateDraftParams(prev => ({ ...prev, reductionRate: redRate }))}
                      className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer transition-all ${
                        (draftParams.reductionRate !== undefined ? draftParams.reductionRate : 15.0) === redRate
                          ? 'bg-rose-500 text-white font-bold'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {redRate}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-zinc-400">CP Lãi vay 2025 (VND)</label>
                <NumericInput
                  value={draftParams.histInterest}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, histInterest: val }))}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 font-mono text-zinc-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-emerald-400">Thuế suất áp dụng (%/DT)</label>
                <div className="w-full bg-zinc-950/60 border border-zinc-850 rounded-lg p-1.5 font-mono text-xs font-bold text-emerald-400 flex items-center justify-center text-center h-8">
                  {getTaxRateForIndustry(store.industry).rate}%
                </div>
                <span className="text-[9px] text-zinc-500 block italic mt-0.5">Theo TT 40/2021/TT-BTC</span>
              </div>
            </div>

            {/* Cycle Days */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 block">Ngày Phải thu</span>
                <IntegerDaysInput
                  value={draftParams.arDays}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, arDays: val }))}
                  min={0}
                  max={365}
                  fallbackValue={15}
                  placeholder="15"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 font-mono text-[11px] text-zinc-300 text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 block">Ngày Tồn kho</span>
                <IntegerDaysInput
                  value={draftParams.invDays}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, invDays: val }))}
                  min={0}
                  max={365}
                  fallbackValue={30}
                  placeholder="30"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 font-mono text-[11px] text-zinc-300 text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 block">Ngày Phải trả</span>
                <IntegerDaysInput
                  value={draftParams.apDays}
                  onChange={(val) => updateDraftParams(prev => ({ ...prev, apDays: val }))}
                  min={0}
                  max={365}
                  fallbackValue={15}
                  placeholder="15"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1 font-mono text-[11px] text-zinc-300 text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action button "Dự phóng" */}
        <div className="pt-2 border-t border-zinc-800 space-y-2">
          {/* Primary Quick Button: Generate 12 Months from Projection */}
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-zinc-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Tạo 12 Tháng Doanh thu từ Dự phóng
          </button>

          <button
            onClick={() => {
              setIsCalculating(true);
              setTimeout(() => {
                setActiveParams(draftParams);
                if (onUpdateStore) {
                  onUpdateStore(store.id, { projectionParams: draftParams });
                }
                try {
                  localStorage.setItem(`projection_params_${store.id}`, JSON.stringify(draftParams));
                } catch (e) {
                  console.warn('LocalStorage save error:', e);
                }
                setIsCalculating(false);
                setShowSuccessToast(true);
                setTimeout(() => setShowSuccessToast(false), 3000);
              }, 400);
            }}
            disabled={isCalculating}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isCalculating
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : JSON.stringify(draftParams) !== JSON.stringify(activeParams)
                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/10'
                : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border border-zinc-700'
            }`}
          >
            <Calculator className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating
              ? 'Đang tính toán...'
              : JSON.stringify(draftParams) !== JSON.stringify(activeParams)
              ? 'Cập nhật Dự phóng (Có thay đổi)'
              : 'Chạy Dự phóng'}
          </button>
          
          {onUpdateStore && (
            <button
              onClick={() => {
                onUpdateStore(store.id, { projectionParams: draftParams });
                setActiveParams(draftParams);
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3500);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-200 hover:text-zinc-50 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Lưu phương án dự phóng mới nhất
            </button>
          )}
          
          {showSuccessToast && (
            <div className="mt-2 text-center text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 py-1.5 px-2 rounded-lg animate-fade-in">
              ✓ Đã cập nhật kết quả dự phóng & đồng bộ doanh thu!
            </div>
          )}

          {showSaveSuccess && (
            <div className="mt-2 text-center text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 py-1.5 px-2 rounded-lg animate-fade-in">
              ✓ Đã lưu phương án dự phóng mới nhất cho {store.name}!
            </div>
          )}
        </div>
      </div>

      {/* Spreadsheet Presentation Table */}
      <div className="xl:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
        {/* Header */}
        <div className="p-5 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900">
          <div>
            <h3 className="text-base font-bold text-zinc-50 tracking-tight">
              Phương án Sử dụng Vốn ngắn hạn & Dự phóng
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Phân tích cơ cấu nguồn vốn lưu động và dự phòng quy mô hoạt động kinh doanh cho {store.name}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Tự động tạo 12 tháng doanh thu cho năm cũ và năm nay"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tạo 12T Doanh thu
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-xs font-extrabold text-zinc-950 transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-sm shadow-emerald-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất File Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto p-2 sm:p-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
          <div className="block sm:hidden bg-zinc-950/80 border border-zinc-850 px-3 py-1.5 rounded-lg mb-2 text-[10px] text-emerald-400 font-extrabold text-right uppercase tracking-wider">
            ⇄ Vuốt ngang để xem 2025 & 2026
          </div>
          <table className="w-full text-left border-collapse text-xs md:text-sm min-w-[500px]">
            <thead>
              <tr className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-widest border-b border-zinc-850">
                <th className="p-3 font-semibold w-1/2">Chỉ tiêu (Field Name)</th>
                <th className="p-3 font-semibold text-right">Đã kết thúc niên độ 2025</th>
                <th className="p-3 font-semibold text-right text-emerald-400">Dự phóng niên độ 2026</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 font-mono text-zinc-300">
              {/* Doanh thu (Red indicator) */}
              <tr className="bg-rose-950/20 hover:bg-rose-950/35 transition-colors font-bold">
                <td className="p-3.5 text-rose-300 font-sans">Doanh thu</td>
                <td className="p-3.5 text-right text-rose-300">{formatVND(histMetrics.revenue)}</td>
                <td className="p-3.5 text-right text-rose-300">{formatVND(projMetrics.revenue)}</td>
              </tr>

              {/* Chi phí ngắn hạn (Red indicator) */}
              <tr className="bg-rose-950/10 hover:bg-rose-950/20 transition-colors font-bold">
                <td className="p-3.5 text-rose-400 font-sans">Chi phí ngắn hạn phục vụ SXKD</td>
                <td className="p-3.5 text-right text-rose-400">{formatVND(histMetrics.expense)}</td>
                <td className="p-3.5 text-right text-rose-400">{formatVND(projMetrics.expense)}</td>
              </tr>
              {/* Khấu hao */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-3 text-zinc-400 font-sans pl-6">Chi phí khấu hao tài sản</td>
                <td className="p-3 text-right">{formatVND(activeParams.histDepreciation)}</td>
                <td className="p-3 text-right text-zinc-100">{formatVND(activeParams.projDepreciation)}</td>
              </tr>

              {/* Lại vay */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-3 text-zinc-400 font-sans pl-6">Chi phí lãi vay</td>
                <td className="p-3 text-right">{formatVND(activeParams.histInterest)}</td>
                <td className="p-3 text-right text-amber-400">{formatVND(projMetrics.interest)}</td>
              </tr>

              {/* Khác */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-3 text-zinc-400 font-sans pl-6">Chi phí khác</td>
                <td className="p-3 text-right">{formatVND(activeParams.histOtherExpense)}</td>
                <td className="p-3 text-right text-zinc-100">{formatVND(activeParams.projOtherExpense)}</td>
              </tr>

              {/* LNTT (Red indicator) */}
              <tr className="bg-rose-950/20 hover:bg-rose-950/35 transition-colors font-bold text-zinc-200">
                <td className="p-3.5 text-rose-300 font-sans">Lợi nhuận trước thuế</td>
                <td className="p-3.5 text-right text-rose-300">{formatVND(histMetrics.pbt)}</td>
                <td className="p-3.5 text-right text-rose-300">{formatVND(projMetrics.pbt)}</td>
              </tr>

              {/* Thuế (Red indicator) */}
              <tr className="bg-rose-950/10 hover:bg-rose-950/25 transition-colors font-semibold">
                <td className="p-3 text-rose-400 font-sans">Thuế phải nộp</td>
                <td className="p-3 text-right text-rose-400">{formatVND(histMetrics.tax)}</td>
                <td className="p-3 text-right text-rose-400">{formatVND(projMetrics.tax)}</td>
              </tr>

              {/* LNST (Red indicator) */}
              <tr className="bg-rose-950/30 hover:bg-rose-950/45 transition-colors font-bold text-zinc-100">
                <td className="p-3.5 text-rose-200 font-sans">Lợi nhuận sau thuế</td>
                <td className="p-3.5 text-right text-rose-200">{formatVND(histMetrics.pat)}</td>
                <td className="p-3.5 text-right text-rose-200">{formatVND(projMetrics.pat)}</td>
              </tr>

              {/* Section Header: Working Capital */}
              <tr className="bg-zinc-950 font-bold border-t border-zinc-800 text-zinc-400">
                <td className="p-2.5 font-sans uppercase tracking-wider text-[10px]">NHU CẦU VỐN LƯU ĐỘNG</td>
                <td className="p-2.5"></td>
                <td className="p-2.5"></td>
              </tr>

              {/* AR Days */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-2.5 text-zinc-400 font-sans pl-6">Số ngày phải thu bình quân</td>
                <td className="p-2.5 text-right">{activeParams.arDays} ngày</td>
                <td className="p-2.5 text-right">{activeParams.arDays} ngày</td>
              </tr>

              {/* AP Days */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-2.5 text-zinc-400 font-sans pl-6">Số ngày phải trả bình quan</td>
                <td className="p-2.5 text-right">{activeParams.apDays} ngày</td>
                <td className="p-2.5 text-right">{activeParams.apDays} ngày</td>
              </tr>

              {/* Inventory Days */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-2.5 text-zinc-400 font-sans pl-6">Số ngày tồn kho bình quan</td>
                <td className="p-2.5 text-right">{activeParams.invDays} ngày</td>
                <td className="p-2.5 text-right">{activeParams.invDays} ngày</td>
              </tr>

              {/* Cycle Days */}
              <tr className="hover:bg-zinc-800/20 transition-colors font-semibold">
                <td className="p-2.5 text-zinc-400 font-sans pl-6">Thời gian 1 chu kỳ kinh doanh theo ngày</td>
                <td className="p-2.5 text-right text-zinc-200">{activeParams.arDays + activeParams.invDays} ngày</td>
                <td className="p-2.5 text-right text-zinc-200">{activeParams.arDays + activeParams.invDays} ngày</td>
              </tr>

              {/* Turnover (Red indicator) */}
              <tr className="bg-rose-950/20 hover:bg-rose-950/35 transition-colors font-bold text-zinc-100">
                <td className="p-3 text-rose-300 font-sans pl-6">Số vòng quay vốn lưu động trong năm</td>
                <td className="p-3 text-right text-rose-300">{activeParams.histTurnover.toFixed(1)}</td>
                <td className="p-3 text-right text-rose-300">{activeParams.projTurnover.toFixed(1)}</td>
              </tr>

              {/* WCR (Red indicator) */}
              <tr className="bg-rose-950/30 hover:bg-rose-950/40 transition-colors font-bold">
                <td className="p-3.5 text-rose-200 font-sans">
                  <div>Nhu cầu vốn lưu động</div>
                  <div className="text-[10px] text-rose-300/80 font-normal font-mono">(= Vốn tự có + Vốn khác + Vay VCB bình quân)</div>
                </td>
                <td className="p-3.5 text-right text-rose-200">{formatVND(histMetrics.workingCapRequirement)}</td>
                <td className="p-3.5 text-right text-rose-200">{formatVND(projMetrics.workingCapRequirement)}</td>
              </tr>

              {/* Own Capital (Red indicator) */}
              <tr className="bg-rose-950/10 hover:bg-rose-950/20 transition-colors font-bold">
                <td className="p-3 text-rose-400 font-sans pl-6">Vốn tự có</td>
                <td className="p-3 text-right text-rose-400">{formatVND(histMetrics.ownCapital)}</td>
                <td className="p-3 text-right text-rose-400">{formatVND(projMetrics.ownCapital)}</td>
              </tr>

              {/* Other Capital */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-3 text-zinc-400 font-sans pl-6">Vốn khác</td>
                <td className="p-3 text-right">{formatVND(histMetrics.otherCapital)}</td>
                <td className="p-3 text-right text-zinc-100">{formatVND(projMetrics.otherCapital)}</td>
              </tr>

              {/* VCB Loan (Red indicator) */}
              <tr className="bg-rose-950/25 hover:bg-rose-950/35 transition-colors font-bold text-zinc-100">
                <td className="p-3 text-rose-300 font-sans pl-6">
                  <div>Vay VCB (Hạn mức đề nghị)</div>
                </td>
                <td className="p-3 text-right text-rose-300">{histMetrics.vcbLoan > 0 ? formatVND(histMetrics.vcbLoan) : '-'}</td>
                <td className="p-3 text-right text-rose-300">{formatVND(projMetrics.vcbLoan)}</td>
              </tr>

              {/* VCB Loan Average (Calculated on remaining days) */}
              <tr className="bg-amber-950/20 hover:bg-amber-950/30 transition-colors font-bold text-amber-300">
                <td className="p-3 font-sans pl-6">
                  <div>Vốn vay VCB bình quân</div>
                  <div className="text-[10px] text-amber-400/80 font-normal font-mono">(= Vay VCB × {projMetrics.remainingDays} ngày / 365)</div>
                </td>
                <td className="p-3 text-right">{histMetrics.vcbLoan > 0 ? formatVND(histMetrics.vcbLoan) : '-'}</td>
                <td className="p-3 text-right text-amber-300">{formatVND(projMetrics.vcbLoanAvg)}</td>
              </tr>

              {/* Remaining Days in Year */}
              <tr className="hover:bg-zinc-800/20 transition-colors text-xs text-zinc-400">
                <td className="p-2.5 font-sans pl-6">Số ngày còn lại trong năm</td>
                <td className="p-2.5 text-right">365 ngày</td>
                <td className="p-2.5 text-right font-mono text-zinc-200">{projMetrics.remainingDays} ngày</td>
              </tr>

              {/* Section Header: Trade finance */}
              <tr className="bg-zinc-950 font-bold border-t border-zinc-800 text-zinc-400">
                <td className="p-2.5 font-sans uppercase tracking-wider text-[10px]">NHU CẦU TÍN DỤNG ĐỐI VỚI TÀI TRỢ THƯƠNG MẠI</td>
                <td className="p-2.5"></td>
                <td className="p-2.5"></td>
              </tr>

              {/* LC */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-3 text-zinc-400 font-sans pl-6">LC (Thư tín dụng)</td>
                <td className="p-3 text-right">{activeParams.histLc > 0 ? formatVND(activeParams.histLc) : '-'}</td>
                <td className="p-3 text-right text-zinc-100">{formatVND(activeParams.projLc)}</td>
              </tr>

              {/* Guarantee */}
              <tr className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-3 text-zinc-400 font-sans pl-6">Bảo lãnh</td>
                <td className="p-3 text-right">{activeParams.histGuarantee > 0 ? formatVND(activeParams.histGuarantee) : '-'}</td>
                <td className="p-3 text-right text-zinc-100">{formatVND(activeParams.projGuarantee)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Info footer */}
        <div className="p-4 border-t border-zinc-850 bg-zinc-950/40 text-[11px] text-zinc-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Hệ thống đảm bảo cân đối nguồn vốn: <strong>Nhu cầu vốn lưu động = Vốn tự có + Vốn khác + Vay VCB</strong>. Lợi nhuận và chi phí được tính toán tự động dựa trên quy mô thực tế và các chỉ tiêu phương án.
          </span>
        </div>
      </div>

      {/* Modal: Tự động tạo 12 tháng doanh thu từ Phương án Dự phóng */}
      {showGenerateModal && (
        <GenerateRevenueModal
          store={store}
          records={records}
          currentParams={draftParams}
          onClose={() => setShowGenerateModal(false)}
          onApplyRecords={(newRecs, isOverwrite) => {
            if (onBatchCreateRecords) {
              onBatchCreateRecords(newRecs, isOverwrite);
            }
            if (onUpdateStore) {
              onUpdateStore(store.id, { projectionParams: draftParams });
            }
            setActiveParams(draftParams);
            setShowSuccessToast(true);
            setTimeout(() => setShowSuccessToast(false), 4000);
          }}
        />
      )}
    </div>
  );
}
