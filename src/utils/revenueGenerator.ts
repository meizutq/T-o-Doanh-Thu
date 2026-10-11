import { Store, SalesRecord, ProjectionParams, IndustryType, INDUSTRIES } from '../types';

export interface GeneratedDataSummary {
  histYear: number;
  histTargetRevenue: number;
  histActualRevenue: number;
  histTargetExpense: number;
  histActualExpense: number;
  histActualProfit: number;
  histRecordCount: number;

  currentYear: number;
  currentTargetRevenue: number;
  currentActualRevenue: number;
  currentTargetExpense: number;
  currentActualExpense: number;
  currentActualProfit: number;
  currentRecordCount: number;

  totalRecordsCreated: number;
}

// Tax rate mapping based on Circular 40/2021/TT-BTC
export function getTaxRateForIndustry(industry: IndustryType): { rate: number; label: string } {
  switch (industry) {
    case 'tap_hoa':
    case 'bia_nuoc_giai_khat':
    case 'hang_nong_san':
    case 'vat_lieu_xay_dung':
      return { rate: 1.5, label: 'Phân phối, cung cấp hàng hóa (1.5%)' };
    case 'ca_phe':
    case 'nha_hang':
      return { rate: 4.5, label: 'Dịch vụ ăn uống (4.5%)' };
    case 'cay_canh':
    case 'giuong_tu_ban_ghe':
    case 'do_dung_em_be':
      return { rate: 1.5, label: 'Phân phối, cung cấp hàng hóa (1.5%)' };
    default:
      return { rate: 1.5, label: 'Bán buôn, bán lẻ hàng hóa (1.5%)' };
  }
}

// Cost ratio mapping (75% to 90% depending on industry)
export function getIndustryCostRatio(industry: IndustryType): { costRatio: number; costRatioPercent: number; marginPercent: number; description: string } {
  const info = INDUSTRIES[industry];
  if (info) {
    return {
      costRatio: info.costRatio,
      costRatioPercent: info.costRatioPercent,
      marginPercent: Math.round(info.benchmarkMargin * 100),
      description: info.costRatioDescription,
    };
  }
  return {
    costRatio: 0.82,
    costRatioPercent: 82,
    marginPercent: 18,
    description: '82% Doanh thu (Chi phí SXKD theo định mức ngành)',
  };
}

// Calculate default remaining days in current year (from today until Dec 31)
export function getDefaultRemainingDays(refDate: Date = new Date()): number {
  const currentYear = refDate.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
  const diffTime = endOfYear.getTime() - refDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(365, diffDays));
}

// Get default standard ProjectionParams customized per industry
export function getDefaultIndustryParameters(industry: IndustryType): ProjectionParams {
  const taxRate = getTaxRateForIndustry(industry).rate;
  const defaultRemainingDays = getDefaultRemainingDays();
  
  switch (industry) {
    case 'bia_nuoc_giai_khat':
      // WCR 2026 = Vốn tự có + Vốn khác + Vốn vay VCB bình quân
      return {
        histOwnCapital: 1000000000,
        histVcbLoan: 0,
        histOtherCapital: 2400000000,
        histTurnover: 2.0,
        histDepreciation: 120000000,
        histInterest: 269100000,
        histOtherExpense: 25000000,
        histTax: Math.round(6800000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 1000000000,
        projVcbLoan: 2000000000,
        projOtherCapital: 1000000000,
        projTurnover: 2.0,
        projDepreciation: 144000000,
        projOtherExpense: 30000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 45,
        apDays: 30,
        invDays: 65,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'giuong_tu_ban_ghe':
      return {
        histOwnCapital: 1500000000,
        histVcbLoan: 0,
        histOtherCapital: 3600000000,
        histTurnover: 2.0,
        histDepreciation: 180000000,
        histInterest: 320000000,
        histOtherExpense: 40000000,
        histTax: Math.round(10200000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 1500000000,
        projVcbLoan: 3000000000,
        projOtherCapital: 1500000000,
        projTurnover: 2.0,
        projDepreciation: 200000000,
        projOtherExpense: 50000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 45,
        apDays: 30,
        invDays: 65,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'vat_lieu_xay_dung':
      return {
        histOwnCapital: 1200000000,
        histVcbLoan: 0,
        histOtherCapital: 3050000000,
        histTurnover: 2.0,
        histDepreciation: 150000000,
        histInterest: 300000000,
        histOtherExpense: 35000000,
        histTax: Math.round(8500000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 1200000000,
        projVcbLoan: 2500000000,
        projOtherCapital: 1300000000,
        projTurnover: 2.0,
        projDepreciation: 160000000,
        projOtherExpense: 40000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 45,
        apDays: 30,
        invDays: 65,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'tap_hoa':
      return {
        histOwnCapital: 500000000,
        histVcbLoan: 0,
        histOtherCapital: 1200000000,
        histTurnover: 2.0,
        histDepreciation: 60000000,
        histInterest: 120000000,
        histOtherExpense: 15000000,
        histTax: Math.round(3400000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 500000000,
        projVcbLoan: 1000000000,
        projOtherCapital: 500000000,
        projTurnover: 2.0,
        projDepreciation: 72000000,
        projOtherExpense: 20000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 30,
        apDays: 20,
        invDays: 45,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'ca_phe':
      return {
        histOwnCapital: 300000000,
        histVcbLoan: 0,
        histOtherCapital: 550000000,
        histTurnover: 2.0,
        histDepreciation: 40000000,
        histInterest: 60000000,
        histOtherExpense: 15000000,
        histTax: Math.round(1700000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 300000000,
        projVcbLoan: 500000000,
        projOtherCapital: 200000000,
        projTurnover: 2.0,
        projDepreciation: 50000000,
        projOtherExpense: 20000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 15,
        apDays: 15,
        invDays: 30,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'nha_hang':
      return {
        histOwnCapital: 700000000,
        histVcbLoan: 0,
        histOtherCapital: 1425000000,
        histTurnover: 2.0,
        histDepreciation: 80000000,
        histInterest: 150000000,
        histOtherExpense: 25000000,
        histTax: Math.round(4250000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 700000000,
        projVcbLoan: 1200000000,
        projOtherCapital: 600000000,
        projTurnover: 2.0,
        projDepreciation: 95000000,
        projOtherExpense: 30000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 15,
        apDays: 20,
        invDays: 30,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'cay_canh':
      return {
        histOwnCapital: 500000000,
        histVcbLoan: 0,
        histOtherCapital: 775000000,
        histTurnover: 2.0,
        histDepreciation: 40000000,
        histInterest: 70000000,
        histOtherExpense: 15000000,
        histTax: Math.round(2550000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 500000000,
        projVcbLoan: 700000000,
        projOtherCapital: 300000000,
        projTurnover: 2.0,
        projDepreciation: 50000000,
        projOtherExpense: 20000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 30,
        apDays: 20,
        invDays: 60,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'hang_nong_san':
      return {
        histOwnCapital: 800000000,
        histVcbLoan: 0,
        histOtherCapital: 2175000000,
        histTurnover: 2.0,
        histDepreciation: 90000000,
        histInterest: 180000000,
        histOtherExpense: 20000000,
        histTax: Math.round(5950000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 800000000,
        projVcbLoan: 1800000000,
        projOtherCapital: 900000000,
        projTurnover: 2.0,
        projDepreciation: 110000000,
        projOtherExpense: 25000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 30,
        apDays: 25,
        invDays: 45,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    case 'do_dung_em_be':
      return {
        histOwnCapital: 600000000,
        histVcbLoan: 0,
        histOtherCapital: 1525000000,
        histTurnover: 2.0,
        histDepreciation: 70000000,
        histInterest: 140000000,
        histOtherExpense: 20000000,
        histTax: Math.round(4250000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 600000000,
        projVcbLoan: 1300000000,
        projOtherCapital: 600000000,
        projTurnover: 2.0,
        projDepreciation: 85000000,
        projOtherExpense: 25000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 30,
        apDays: 25,
        invDays: 50,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };

    default:
      return {
        histOwnCapital: 500000000,
        histVcbLoan: 0,
        histOtherCapital: 1200000000,
        histTurnover: 2.0,
        histDepreciation: 60000000,
        histInterest: 120000000,
        histOtherExpense: 15000000,
        histTax: Math.round(3400000000 * (taxRate / 100)),
        histLc: 0,
        histGuarantee: 0,

        projOwnCapital: 500000000,
        projVcbLoan: 1000000000,
        projOtherCapital: 500000000,
        projTurnover: 2.0,
        projDepreciation: 75000000,
        projOtherExpense: 20000000,
        vcbInterestRate: 9.0,
        projTaxRate: taxRate,
        projLc: 0,
        projGuarantee: 0,

        arDays: 30,
        apDays: 20,
        invDays: 45,
        reductionRate: 15.0,
        remainingDays: defaultRemainingDays,
      };
  }
}

// Calculate projection metrics from ProjectionParams
export function computeProjectionMetrics(
  store: Store,
  params: ProjectionParams,
  existingRecords: SalesRecord[] = []
) {
  const storeRecords = existingRecords.filter((r) => r.storeId === store.id);
  const costRatioInfo = getIndustryCostRatio(store.industry);
  const costRatio = costRatioInfo.costRatio; // 75% to 90% depending on industry
  const taxRate = getTaxRateForIndustry(store.industry).rate;

  // 1. Projected 2026 metrics
  const projOwn = params.projOwnCapital || 0;
  const projOther = params.projOtherCapital || 0;
  const projVcb = params.projVcbLoan || 0;
  
  // Số ngày còn lại trong năm (mặc định tính từ ngày hiện tại đến hết 31/12)
  const remainingDays = params.remainingDays !== undefined && params.remainingDays > 0 ? params.remainingDays : getDefaultRemainingDays();
  
  // Vốn vay VCB bình quân = (Vốn vay VCB × Số ngày còn lại trong năm) / 365 ngày
  const projVcbLoanAvg = Math.round((projVcb * remainingDays) / 365);

  // Nhu cầu vốn lưu động = Tổng vốn tự có + Vốn khác + Vốn vay VCB bình quân
  const projWCR = projOwn + projOther + projVcbLoanAvg;
  const projTurnover = params.projTurnover || 2.0;

  // Doanh thu dự phóng = Nhu cầu vốn lưu động × Vòng quay vốn
  const projRevenue = Math.round(projWCR * projTurnover);
  
  // Chi phí sản xuất kinh doanh bằng 75% đến 90% doanh thu tùy ngành hàng
  const projTotalExpense = Math.round(projRevenue * costRatio);
  const projInterest = Math.round(projVcbLoanAvg * ((params.vcbInterestRate || 9.0) / 100));
  const totalProjInterest = (params.histInterest || 0) + projInterest;
  const projExpense = Math.max(0, projTotalExpense - (params.projDepreciation || 0) - totalProjInterest - (params.projOtherExpense || 0));
  const projPbt = Math.max(0, projRevenue - projExpense - (params.projDepreciation || 0) - totalProjInterest - (params.projOtherExpense || 0));
  const projTax = Math.round(projRevenue * (taxRate / 100));
  const projPat = Math.max(0, projPbt - projTax);

  // 2. Historical 2025 metrics
  const histOwn = params.histOwnCapital || 0;
  const histOther = params.histOtherCapital || 0;
  const histVcb = params.histVcbLoan || 0;
  const histWCR = histOwn + histOther + histVcb;
  const histTurnover = params.histTurnover || 2.0;

  // Doanh thu 2025 tính theo Nhu cầu VLĐ 2025 × 2.0 (hoặc giảm theo reductionRate từ 2026 nếu histWCR = 0)
  let histRevenue: number;
  if (histWCR > 0) {
    histRevenue = Math.round(histWCR * histTurnover);
  } else {
    const reductionRate = params.reductionRate !== undefined ? params.reductionRate : 15.0;
    histRevenue = Math.round(projRevenue * (1 - reductionRate / 100));
  }

  const histTotalExpense = Math.round(histRevenue * costRatio);
  const histInterest = params.histInterest || 0;
  const histExpense = Math.max(0, histTotalExpense - (params.histDepreciation || 0) - histInterest - (params.histOtherExpense || 0));
  const histPbt = Math.max(0, histRevenue - histExpense - (params.histDepreciation || 0) - histInterest - (params.histOtherExpense || 0));
  const histTax = Math.round(histRevenue * (taxRate / 100));
  const histPat = Math.max(0, histPbt - histTax);

  return {
    costRatioInfo,
    remainingDays,
    projVcbLoanAvg,
    projWCR,
    projRevenue,
    hist: {
      revenue: histRevenue,
      totalExpense: histTotalExpense,
      expense: histExpense,
      pbt: histPbt,
      tax: histTax,
      pat: histPat,
      workingCapRequirement: histWCR,
      ownCapital: histOwn,
      otherCapital: histOther,
      vcbLoan: histVcb,
    },
    proj: {
      revenue: projRevenue,
      totalExpense: projTotalExpense,
      expense: projExpense,
      interest: totalProjInterest,
      pbt: projPbt,
      tax: projTax,
      pat: projPat,
      workingCapRequirement: projWCR,
      ownCapital: projOwn,
      otherCapital: projOther,
      vcbLoan: projVcb,
      vcbLoanAvg: projVcbLoanAvg,
      remainingDays,
    }
  };
}

// Get realistic monthly seasonality weight (12 months)
function getMonthlySeasonality(month: number, industry: IndustryType): number {
  // month: 1..12
  switch (industry) {
    case 'bia_nuoc_giai_khat':
    case 'tap_hoa':
    case 'hang_nong_san':
      // Peaks in Jan/Feb (Tet holiday: +25%), mid-summer June/July (+10%), and Dec (+20%)
      if (month === 1 || month === 2) return 1.25;
      if (month === 12) return 1.20;
      if (month === 6 || month === 7) return 1.10;
      if (month === 3 || month === 4) return 0.85;
      return 0.95;

    case 'ca_phe':
    case 'nha_hang':
      // High in Nov/Dec/Jan/Feb (festivities & cooler weather), summer weekends
      if (month === 1 || month === 2 || month === 12) return 1.20;
      if (month === 7 || month === 8) return 1.10;
      if (month === 9 || month === 10) return 0.90;
      return 0.95;

    case 'cay_canh':
      // Huge peak in Dec & Jan (Tet ornamental trees, bonsai, blossoms)
      if (month === 1 || month === 12) return 1.50;
      if (month === 2) return 1.20;
      if (month === 3 || month === 4) return 0.80;
      return 0.85;

    case 'vat_lieu_xay_dung':
      // Construction season: dry season Q1 & Q4 (Nov-May), slow in rainy season (July-Sept)
      if (month >= 3 && month <= 5) return 1.20;
      if (month === 11 || month === 12) return 1.25;
      if (month >= 7 && month <= 9) return 0.75;
      return 1.00;

    default:
      if (month === 1 || month === 12) return 1.15;
      if (month === 2) return 1.10;
      return 0.95;
  }
}

// Get realistic day of week factor
function getDayOfWeekFactor(dow: number, industry: IndustryType): number {
  // dow: 0=Sunday, 6=Saturday
  if (industry === 'ca_phe' || industry === 'nha_hang' || industry === 'cay_canh') {
    if (dow === 0 || dow === 6) return 1.35; // +35% on weekends
    if (dow === 5) return 1.15; // Friday night
    return 0.88;
  }
  if (industry === 'bia_nuoc_giai_khat' || industry === 'tap_hoa') {
    if (dow === 0 || dow === 6) return 1.20;
    if (dow === 5) return 1.10;
    return 0.92;
  }
  if (industry === 'vat_lieu_xay_dung') {
    if (dow === 0) return 0.70; // Sunday reduced construction delivery
    if (dow === 6) return 1.05;
    return 1.05;
  }
  if (dow === 0 || dow === 6) return 1.15;
  return 0.94;
}

// Pseudo-random deterministic noise based on day number to keep output stable yet organic
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export interface GenerateOptions {
  includeHistoricalYear?: boolean;
  includeCurrentYear?: boolean;
  historicalYear?: number;
  currentYear?: number;
  currentYearEndDate?: string; // Optional end date for current year, e.g. today
}

/**
 * Generate synthetic 12-month / 2-year sales records strictly matching the saved Projection Plan.
 * The historical year records SUM UP TO EXACTLY histMetrics.revenue and histMetrics.expense.
 */
export function generateRecordsFromProjection(
  store: Store,
  params: ProjectionParams,
  options: GenerateOptions = {}
): { records: SalesRecord[]; summary: GeneratedDataSummary } {
  const {
    includeHistoricalYear = true,
    includeCurrentYear = true,
    historicalYear = 2025,
    currentYear = 2026,
    currentYearEndDate,
  } = options;

  const metrics = computeProjectionMetrics(store, params);
  const targetHistRevenue = metrics.hist.revenue;
  const targetHistExpense = metrics.hist.expense; // Chi phí ngắn hạn phục vụ SXKD
  const targetProjRevenue = metrics.proj.revenue;
  const targetProjExpense = metrics.proj.expense;

  const generatedRecords: SalesRecord[] = [];

  // ==========================================
  // 1. GENERATE HISTORICAL YEAR (Năm cũ - e.g. 2025)
  // EXACT SUM EQUALS targetHistRevenue & targetHistExpense
  // ==========================================
  let histActualRev = 0;
  let histActualExp = 0;
  let histRecordCount = 0;

  if (includeHistoricalYear && targetHistRevenue > 0) {
    const isLeap = (historicalYear % 4 === 0 && historicalYear % 100 !== 0) || historicalYear % 400 === 0;
    const daysInYear = isLeap ? 366 : 365;

    // First pass: Calculate raw weights for all 365 days
    interface DayWeight {
      date: string;
      dayIndex: number;
      weight: number;
      expRatio: number;
    }

    const dayWeights: DayWeight[] = [];
    let totalWeight = 0;

    const startDate = new Date(historicalYear, 0, 1);
    for (let i = 0; i < daysInYear; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const month = d.getMonth() + 1;
      const dow = d.getDay();

      const mFactor = getMonthlySeasonality(month, store.industry);
      const dowFactor = getDayOfWeekFactor(dow, store.industry);
      const noise = (pseudoRandom(i * 17 + 101) - 0.5) * 0.18; // +/- 9%

      const w = Math.max(0.2, mFactor * dowFactor * (1 + noise));
      totalWeight += w;

      // Expense ratio for this day (fluctuates around the target cost ratio)
      const baseCostRatio = targetHistRevenue > 0 ? targetHistExpense / targetHistRevenue : 0.88;
      const expNoise = (pseudoRandom(i * 31 + 203) - 0.5) * 0.04; // +/- 2%
      const expRatio = Math.min(0.96, Math.max(0.60, baseCostRatio + expNoise));

      dayWeights.push({
        date: dateStr,
        dayIndex: i,
        weight: w,
        expRatio,
      });
    }

    // Second pass: Scale revenue to targetHistRevenue and round to nearest 1,000 VND
    interface DayAlloc {
      date: string;
      revenue: number;
      expense: number;
      notes: string;
    }

    const allocs: DayAlloc[] = [];
    let runningSumRev = 0;

    for (let i = 0; i < dayWeights.length; i++) {
      const dw = dayWeights[i];
      const exactPortion = (dw.weight / totalWeight) * targetHistRevenue;
      const roundedRev = Math.round(exactPortion / 1000) * 1000;
      runningSumRev += roundedRev;

      allocs.push({
        date: dw.date,
        revenue: roundedRev,
        expense: 0,
        notes: '',
      });
    }

    // Adjust revenue discrepancy to match EXACTLY targetHistRevenue
    let diffRev = targetHistRevenue - runningSumRev;
    if (diffRev !== 0) {
      // Distribute remainder in 1,000 VND steps over high-weight days
      const step = diffRev > 0 ? 1000 : -1000;
      let idx = 0;
      while (diffRev !== 0 && idx < allocs.length) {
        allocs[idx].revenue += step;
        diffRev -= step;
        idx = (idx + 1) % allocs.length;
      }
    }

    // Third pass: Scale expenses to targetHistExpense and round to nearest 1,000 VND
    let totalRawExp = 0;
    const rawExps: number[] = [];
    for (let i = 0; i < allocs.length; i++) {
      const rawE = allocs[i].revenue * dayWeights[i].expRatio;
      rawExps.push(rawE);
      totalRawExp += rawE;
    }

    let runningSumExp = 0;
    for (let i = 0; i < allocs.length; i++) {
      const exactExp = totalRawExp > 0 ? (rawExps[i] / totalRawExp) * targetHistExpense : 0;
      let roundedExp = Math.round(exactExp / 1000) * 1000;
      // Ensure daily profit > 0
      if (roundedExp >= allocs[i].revenue && allocs[i].revenue > 100000) {
        roundedExp = allocs[i].revenue - 50000;
      }
      allocs[i].expense = roundedExp;
      runningSumExp += roundedExp;
    }

    // Adjust expense discrepancy to match EXACTLY targetHistExpense
    let diffExp = targetHistExpense - runningSumExp;
    if (diffExp !== 0) {
      const step = diffExp > 0 ? 1000 : -1000;
      let idx = allocs.length - 1;
      while (diffExp !== 0 && idx >= 0) {
        const potentialExp = allocs[idx].expense + step;
        if (potentialExp < allocs[idx].revenue && potentialExp > 0) {
          allocs[idx].expense += step;
          diffExp -= step;
        }
        idx = (idx - 1 + allocs.length) % allocs.length;
      }
    }

    // Add note flags for realistic bookkeeping
    allocs.forEach((item, index) => {
      const d = new Date(item.date);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      let note = '';
      if (index === 0) {
        note = 'Khởi tạo số dư đầu kỳ năm tài chính ' + historicalYear;
      } else if (index % 45 === 0) {
        note = 'Nhập lô hàng sỉ lớn phục vụ kinh doanh';
      } else if (index % 30 === 0) {
        note = 'Quyết toán công nợ và tổng hợp doanh số';
      } else if (isWeekend && index % 7 === 0) {
        note = 'Cao điểm bán hàng cuối tuần';
      }

      const profit = item.revenue - item.expense;
      generatedRecords.push({
        id: `rec-hist-${store.id}-${historicalYear}-${index}`,
        storeId: store.id,
        date: item.date,
        revenue: item.revenue,
        expense: item.expense,
        profit,
        notes: note,
      });

      histActualRev += item.revenue;
      histActualExp += item.expense;
      histRecordCount++;
    });
  }

  // ==========================================
  // 2. GENERATE CURRENT YEAR (Năm hiện tại - e.g. 2026)
  // Matching targetProjRevenue pace for recent 12 months / Year-to-Date
  // ==========================================
  let currentActualRev = 0;
  let currentActualExp = 0;
  let currentRecordCount = 0;

  if (includeCurrentYear && targetProjRevenue > 0) {
    const today = new Date();
    const currY = currentYear;
    
    // Determine end date for current year generation (default up to current month / today, or at least 180 days)
    let endDate: Date;
    if (currentYearEndDate) {
      const [ey, em, ed] = currentYearEndDate.split('-').map(Number);
      endDate = new Date(ey, em - 1, ed);
    } else {
      if (today.getFullYear() === currY) {
        endDate = today;
      } else {
        // Full year or standard 6-month simulation
        endDate = new Date(currY, 5, 25);
      }
    }

    const startDate = new Date(currY, 0, 1);
    const dayDiff = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);

    const dailyTargetRev = targetProjRevenue / 365;
    const dailyTargetExp = targetProjExpense / 365;

    for (let i = 0; i < dayDiff; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const month = d.getMonth() + 1;
      const dow = d.getDay();

      const mFactor = getMonthlySeasonality(month, store.industry);
      const dowFactor = getDayOfWeekFactor(dow, store.industry);
      const noise = (pseudoRandom(i * 29 + 505) - 0.5) * 0.16; // +/- 8%

      const dailyMultiplier = Math.max(0.3, mFactor * dowFactor * (1 + noise));
      const dailyRev = Math.round((dailyTargetRev * dailyMultiplier) / 1000) * 1000;

      const expNoise = (pseudoRandom(i * 43 + 707) - 0.5) * 0.04;
      const baseCostRatio = targetProjRevenue > 0 ? targetProjExpense / targetProjRevenue : 0.88;
      const dailyExpRatio = Math.min(0.95, Math.max(0.65, baseCostRatio + expNoise));
      
      let dailyExp = Math.round((dailyRev * dailyExpRatio) / 1000) * 1000;
      if (dailyExp >= dailyRev && dailyRev > 50000) {
        dailyExp = dailyRev - 40000;
      }

      const profit = dailyRev - dailyExp;

      let note = '';
      if (i === 0) {
        note = `Khởi đầu niên độ kinh doanh ${currY}`;
      } else if (i % 25 === 0) {
        note = 'Thanh toán đơn hàng và nhập hàng định kỳ';
      } else if ((dow === 0 || dow === 6) && i % 8 === 0) {
        note = 'Doanh thu bán lẻ cuối tuần tăng trưởng';
      }

      generatedRecords.push({
        id: `rec-proj-${store.id}-${currY}-${i}`,
        storeId: store.id,
        date: dateStr,
        revenue: dailyRev,
        expense: dailyExp,
        profit,
        notes: note,
      });

      currentActualRev += dailyRev;
      currentActualExp += dailyExp;
      currentRecordCount++;
    }
  }

  const summary: GeneratedDataSummary = {
    histYear: historicalYear,
    histTargetRevenue: targetHistRevenue,
    histActualRevenue: histActualRev,
    histTargetExpense: targetHistExpense,
    histActualExpense: histActualExp,
    histActualProfit: histActualRev - histActualExp,
    histRecordCount,

    currentYear,
    currentTargetRevenue: targetProjRevenue,
    currentActualRevenue: currentActualRev,
    currentTargetExpense: targetProjExpense,
    currentActualExpense: currentActualExp,
    currentActualProfit: currentActualRev - currentActualExp,
    currentRecordCount,

    totalRecordsCreated: generatedRecords.length,
  };

  return { records: generatedRecords, summary };
}

/**
 * Calculate the past 12 complete calendar months based on current date minus 1 month.
 * E.g., if today is August 2026:
 * - End period: July 31, 2026 (2026-07-31)
 * - Start period: August 01, 2025 (2025-08-01)
 * Exactly 12 months: Aug 2025 to Jul 2026.
 */
export function getLast12MonthsRange(referenceDate: Date = new Date()) {
  const currentYear = referenceDate.getFullYear();
  const currentMonth0Indexed = referenceDate.getMonth(); // 0 = Jan, 7 = Aug
  
  // Last day of previous month
  const endDateObj = new Date(currentYear, currentMonth0Indexed, 0);
  
  // First day of 12 months prior (11 months back from the previous month)
  const startDateObj = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 11, 1);
  
  const yyyyStart = startDateObj.getFullYear();
  const mmStart = String(startDateObj.getMonth() + 1).padStart(2, '0');
  const ddStart = String(startDateObj.getDate()).padStart(2, '0');
  const startDate = `${yyyyStart}-${mmStart}-${ddStart}`;

  const yyyyEnd = endDateObj.getFullYear();
  const mmEnd = String(endDateObj.getMonth() + 1).padStart(2, '0');
  const ddEnd = String(endDateObj.getDate()).padStart(2, '0');
  const endDate = `${yyyyEnd}-${mmEnd}-${ddEnd}`;

  return {
    startDate,
    endDate,
    startDateObj,
    endDateObj,
    startDisplayMonth: `T${mmStart}/${yyyyStart}`,
    endDisplayMonth: `T${mmEnd}/${yyyyEnd}`,
    startDisplayFull: `${ddStart}/${mmStart}/${yyyyStart}`,
    endDisplayFull: `${ddEnd}/${mmEnd}/${yyyyEnd}`,
    startMonthName: `Tháng ${mmStart}/${yyyyStart}`,
    endMonthName: `Tháng ${mmEnd}/${yyyyEnd}`,
    label: `12 tháng gần nhất (T${mmStart}/${yyyyStart} - T${mmEnd}/${yyyyEnd})`,
    shortLabel: `12 tháng (T${mmStart} - T${mmEnd})`,
    periodDescription: `Từ ${ddStart}/${mmStart}/${yyyyStart} đến ${ddEnd}/${mmEnd}/${yyyyEnd} (12 tháng đầy đủ)`
  };
}
