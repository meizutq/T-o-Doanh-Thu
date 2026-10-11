import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Store, SalesRecord, INDUSTRIES } from '../types';
import { formatVND } from '../utils/sampleData';
import { getLast12MonthsRange } from '../utils/revenueGenerator';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  Mail,
  Send,
  Loader2,
  CheckCircle,
  Sparkles,
  MapPin,
  Store as StoreIcon,
  ShieldAlert,
  ChevronRight,
  Calendar,
  ChevronLeft,
  Clock,
  Check,
  Type,
  Palette,
  Printer,
  SlidersHorizontal,
  UserCheck,
  Layers,
  FileText
} from 'lucide-react';
import { CONTRACT_FONTS, ContractFontOption } from '../utils/contractFonts';

export interface ReportThemeOption {
  id: string;
  name: string;
  badge: string;
  headerBgStart: string;
  headerBgEnd: string;
  accentColor: string;
  tableHeaderBg: string;
  cardBorderColor: string;
  activeRowBg: string;
  previewColor: string;
}

export const REPORT_THEMES: ReportThemeOption[] = [
  {
    id: 'navy',
    name: 'Xanh Biển Hiện Đại',
    badge: 'Mặc Định',
    headerBgStart: '#0f172a',
    headerBgEnd: '#1e293b',
    accentColor: '#38bdf8',
    tableHeaderBg: '#1e293b',
    cardBorderColor: '#cbd5e1',
    activeRowBg: '#f8fafc',
    previewColor: '#0284c7'
  },
  {
    id: 'monochrome',
    name: 'Đen Trắng Công Chứng',
    badge: 'Tiết Kiệm Mực',
    headerBgStart: '#18181b',
    headerBgEnd: '#27272a',
    accentColor: '#f4f4f5',
    tableHeaderBg: '#27272a',
    cardBorderColor: '#a1a1aa',
    activeRowBg: '#f4f4f5',
    previewColor: '#3f3f46'
  },
  {
    id: 'emerald',
    name: 'Xanh Lá Tài Chính',
    badge: 'Tăng Trưởng',
    headerBgStart: '#064e3b',
    headerBgEnd: '#0f766e',
    accentColor: '#34d399',
    tableHeaderBg: '#064e3b',
    cardBorderColor: '#6ee7b7',
    activeRowBg: '#f0fdf4',
    previewColor: '#059669'
  },
  {
    id: 'burgundy',
    name: 'Đỏ Rượu Sang Trọng',
    badge: 'Trang Trọng',
    headerBgStart: '#4c0519',
    headerBgEnd: '#831843',
    accentColor: '#fb7185',
    tableHeaderBg: '#4c0519',
    cardBorderColor: '#fda4af',
    activeRowBg: '#fff1f2',
    previewColor: '#e11d48'
  },
  {
    id: 'amber',
    name: 'Hổ Phách / Vàng Đồng',
    badge: 'Cà Phê & Nhà Hàng',
    headerBgStart: '#451a03',
    headerBgEnd: '#78350f',
    accentColor: '#fbbf24',
    tableHeaderBg: '#451a03',
    cardBorderColor: '#fcd34d',
    activeRowBg: '#fffbeb',
    previewColor: '#d97706'
  }
];

interface ReportPdfModalProps {
  store: Store;
  records: SalesRecord[];
  onClose: () => void;
}

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

const getMonday = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const getWeekInfo = (dateStr: string) => {
  const date = parseLocalDate(dateStr);
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);

  return {
    weekNum,
    year: monday.getFullYear(),
    startDate: formatLocalDate(monday),
    endDate: formatLocalDate(sunday),
    startDisplay: `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}/${monday.getFullYear()}`,
    endDisplay: `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`
  };
};

export default function ReportPdfModal({ store, records, onClose }: ReportPdfModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Customizable report options
  const [customStoreName, setCustomStoreName] = useState(store.name);
  const [customAddress, setCustomAddress] = useState(store.address);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailError, setEmailError] = useState('');

  // Font customization
  const [selectedFontId, setSelectedFontId] = useState<string>(() => {
    return localStorage.getItem('report_pdf_font_id') || 'be-vietnam-pro';
  });
  const currentFont = useMemo(() => {
    return CONTRACT_FONTS.find(f => f.id === selectedFontId) || CONTRACT_FONTS[0];
  }, [selectedFontId]);

  // Color Theme customization
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => {
    return localStorage.getItem('report_pdf_theme_id') || 'navy';
  });
  const currentTheme = useMemo(() => {
    return REPORT_THEMES.find(t => t.id === selectedThemeId) || REPORT_THEMES[0];
  }, [selectedThemeId]);

  // Density / Layout scaling
  const [tableDensity, setTableDensity] = useState<'compact' | 'normal' | 'spacious'>(() => {
    return (localStorage.getItem('report_pdf_density') as 'compact' | 'normal' | 'spacious') || 'normal';
  });

  // Report Title & Header Customization
  const [reportTitle, setReportTitle] = useState('BÁO CÁO DOANH THU & HIỆU QUẢ HOẠT ĐỘNG');

  // KPI Summary Cards
  const [showKpiCards, setShowKpiCards] = useState(true);

  // Signatures customization
  const [showSignatures, setShowSignatures] = useState(true);
  const [signatureStyle, setSignatureStyle] = useState<'single' | 'double'>('single');
  const [signerTitle, setSignerTitle] = useState('CHỦ NHÀ HÀNG / CHỦ HỘ KINH DOANH');
  const [signerName, setSignerName] = useState('');
  const [creatorTitle, setCreatorTitle] = useState('NGƯỜI LẬP BIỂU / KẾ TOÁN');
  const [creatorName, setCreatorName] = useState('');

  // Custom Footer note
  const [customFooterNote, setCustomFooterNote] = useState('');

  // Active sub-tab in configuration panel
  const [activeConfigTab, setActiveConfigTab] = useState<'font_theme' | 'data_columns' | 'signature_info'>('font_theme');

  // Helper font generator for Canvas
  const cFont = (weightOrStyle: string, size: number) => {
    const scale = tableDensity === 'compact' ? 0.92 : tableDensity === 'spacious' ? 1.08 : 1.0;
    const finalSize = Math.max(10, Math.round(size * scale));
    const prefix = weightOrStyle ? `${weightOrStyle} ` : '';
    return `${prefix}${finalSize}px ${currentFont.fontFamily}`;
  };

  const handleSelectFont = (fontId: string) => {
    setSelectedFontId(fontId);
    try {
      localStorage.setItem('report_pdf_font_id', fontId);
    } catch {}
    if (document.fonts) {
      document.fonts.ready.then(() => {
        const canvas = canvasRef.current;
        if (canvas) drawReportToCanvas(canvas, previewPage);
      });
    }
  };

  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    try {
      localStorage.setItem('report_pdf_theme_id', themeId);
    } catch {}
  };

  const handleSelectDensity = (density: 'compact' | 'normal' | 'spacious') => {
    setTableDensity(density);
    try {
      localStorage.setItem('report_pdf_density', density);
    } catch {}
  };
  
  // PDF columns visibility options
  const [showRevenue, setShowRevenue] = useState(true);
  const [showExpense, setShowExpense] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  const [showMargin, setShowMargin] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  
  // Base store records
  const storeRecords = React.useMemo(() => {
    return records.filter((r) => r.storeId === store.id);
  }, [records, store.id]);

  // Find min/max dates for defaults
  const { minDate, maxDate } = React.useMemo(() => {
    if (storeRecords.length === 0) return { minDate: '', maxDate: '' };
    const datesOnly = storeRecords.map(r => r.date).sort();
    return {
      minDate: datesOnly[0],
      maxDate: datesOnly[datesOnly.length - 1]
    };
  }, [storeRecords]);

  // Date filtering state
  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(maxDate);

  // Available weeks computed from storeRecords
  const availableWeeks = React.useMemo(() => {
    if (storeRecords.length === 0) return [];
    const weekMap = new Map<string, {
      key: string;
      weekNum: number;
      year: number;
      startDate: string;
      endDate: string;
      startDisplay: string;
      endDisplay: string;
      recordCount: number;
    }>();

    const sorted = [...storeRecords].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach(r => {
      const info = getWeekInfo(r.date);
      const key = `${info.startDate}_${info.endDate}`;
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          key,
          weekNum: info.weekNum,
          year: info.year,
          startDate: info.startDate,
          endDate: info.endDate,
          startDisplay: info.startDisplay,
          endDisplay: info.endDisplay,
          recordCount: 1
        });
      } else {
        weekMap.get(key)!.recordCount += 1;
      }
    });

    return Array.from(weekMap.values()).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [storeRecords]);

  // Selected week filter key ('custom', 'all', '12_months', or week key)
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>('custom');

  // 12 months range calculated from current date minus 1 month
  const last12Months = useMemo(() => getLast12MonthsRange(new Date()), []);

  const is12MonthsActive = useMemo(() => {
    return (startDate === last12Months.startDate && endDate === last12Months.endDate) || selectedWeekKey === '12_months';
  }, [startDate, endDate, last12Months.startDate, last12Months.endDate, selectedWeekKey]);

  const handleSelectWeek = (key: string) => {
    setSelectedWeekKey(key);
    if (key === 'all') {
      setStartDate(minDate);
      setEndDate(maxDate);
    } else if (key === '12_months') {
      setStartDate(last12Months.startDate);
      setEndDate(last12Months.endDate);
    } else {
      const found = availableWeeks.find(w => w.key === key);
      if (found) {
        setStartDate(found.startDate);
        setEndDate(found.endDate);
      }
    }
  };

  const handleSelect12Months = () => {
    setSelectedWeekKey('12_months');
    setStartDate(last12Months.startDate);
    setEndDate(last12Months.endDate);
  };

  const handleSelectRelativeWeek = (offsetWeeks: number) => {
    const refDate = maxDate ? parseLocalDate(maxDate) : new Date();
    const monday = getMonday(refDate);
    monday.setDate(monday.getDate() + offsetWeeks * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const sDate = formatLocalDate(monday);
    const eDate = formatLocalDate(sunday);

    setStartDate(sDate);
    setEndDate(eDate);

    const key = `${sDate}_${eDate}`;
    const found = availableWeeks.find(w => w.key === key);
    setSelectedWeekKey(found ? found.key : 'custom');
  };

  // Sync state if base dates change
  useEffect(() => {
    if (minDate && !startDate) setStartDate(minDate);
    if (maxDate && !endDate) setEndDate(maxDate);
  }, [minDate, maxDate]);

  // UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailStep, setEmailStep] = useState<'idle' | 'sending' | 'success'>('idle');
  const [sendingStatus, setSendingStatus] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  
  // Option to aggregate/group records by week to save print pages
  const [isWeeklyGrouped, setIsWeeklyGrouped] = useState<boolean>(false);
  
  const industryInfo = INDUSTRIES[store.industry];

  // Dynamic filter based on selected dates
  const filteredRecords = React.useMemo(() => {
    return storeRecords
      .filter((r) => {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [storeRecords, startDate, endDate]);

  // Group records weekly if enabled
  const groupedWeeklyRecords = React.useMemo(() => {
    if (!isWeeklyGrouped) return [];
    const map = new Map<string, {
      key: string;
      weekNum: number;
      year: number;
      startDate: string;
      endDate: string;
      startDisplay: string;
      endDisplay: string;
      dateDisplay: string;
      revenue: number;
      expense: number;
      profit: number;
      daysCount: number;
      notes: string;
    }>();

    filteredRecords.forEach(r => {
      const info = getWeekInfo(r.date);
      const key = `${info.startDate}_${info.endDate}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          weekNum: info.weekNum,
          year: info.year,
          startDate: info.startDate,
          endDate: info.endDate,
          startDisplay: info.startDisplay,
          endDisplay: info.endDisplay,
          dateDisplay: `Tuần ${info.weekNum}/${info.year} (${info.startDisplay} - ${info.endDisplay})`,
          revenue: r.revenue,
          expense: r.expense,
          profit: r.profit,
          daysCount: 1,
          notes: r.notes ? r.notes : ''
        });
      } else {
        const item = map.get(key)!;
        item.revenue += r.revenue;
        item.expense += r.expense;
        item.profit += r.profit;
        item.daysCount += 1;
        if (r.notes && !item.notes.includes(r.notes)) {
          item.notes = item.notes ? `${item.notes}; ${r.notes}` : r.notes;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [filteredRecords, isWeeklyGrouped]);

  const reportRecords = React.useMemo(() => {
    if (isWeeklyGrouped) {
      return groupedWeeklyRecords.map(w => ({
        date: w.dateDisplay,
        rawDate: w.startDate,
        revenue: w.revenue,
        expense: w.expense,
        profit: w.profit,
        notes: w.notes || `${w.daysCount} ngày ghi nhận`
      }));
    } else {
      return filteredRecords.map(r => ({
        date: r.date,
        rawDate: r.date,
        revenue: r.revenue,
        expense: r.expense,
        profit: r.profit,
        notes: r.notes || ''
      }));
    }
  }, [isWeeklyGrouped, groupedWeeklyRecords, filteredRecords]);

  const pageCapacity = useMemo(() => {
    if (tableDensity === 'compact') {
      return {
        p1: showKpiCards ? 21 : 26,
        p1SinglePageMax: showKpiCards ? 18 : 22,
        subsequent: 27,
        finalPageMax: 21,
        rowH: 40
      };
    } else if (tableDensity === 'spacious') {
      return {
        p1: showKpiCards ? 15 : 18,
        p1SinglePageMax: showKpiCards ? 13 : 16,
        subsequent: 20,
        finalPageMax: 16,
        rowH: 52
      };
    } else {
      // normal
      return {
        p1: showKpiCards ? 18 : 22,
        p1SinglePageMax: showKpiCards ? 15 : 19,
        subsequent: 23,
        finalPageMax: 18,
        rowH: 46
      };
    }
  }, [tableDensity, showKpiCards]);

  const totalPages = React.useMemo(() => {
    const N = reportRecords.length;
    if (N === 0) return 1;
    if (N <= pageCapacity.p1SinglePageMax) return 1;
    const remaining = N - pageCapacity.p1;
    if (remaining <= 0) return 1;
    return 1 + Math.ceil(remaining / pageCapacity.subsequent);
  }, [reportRecords.length, pageCapacity]);

  // Adjust previewPage if it exceeds totalPages
  useEffect(() => {
    if (previewPage > totalPages) {
      setPreviewPage(Math.max(1, totalPages));
    }
  }, [totalPages, previewPage]);

  // Compute stats
  const stats = React.useMemo(() => {
    const count = filteredRecords.length;
    const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.revenue, 0);
    const totalExpense = filteredRecords.reduce((sum, r) => sum + r.expense, 0);
    const totalProfit = filteredRecords.reduce((sum, r) => sum + r.profit, 0);
    const avgRevenue = count > 0 ? totalRevenue / count : 0;
    const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
    return { count, totalRevenue, totalExpense, totalProfit, avgRevenue, profitMargin };
  }, [filteredRecords]);

  // Commentary reasoning
  const commentary = React.useMemo(() => {
    if (stats.count === 0) {
      return {
        type: 'info',
        title: 'CHƯA CÓ SỐ LIỆU PHÂN TÍCH DOANH THU',
        text: 'Vui lòng hoàn tất nhập số liệu chi tiết các ngày kinh doanh trước khi xuất bản báo cáo tóm lược doanh thu chính thức.',
        color: '#0284c7', // sky
        bgColor: '#f0f9ff',
        borderColor: '#bae6fd'
      };
    }
    
    const avgRevText = formatVND(stats.avgRevenue);
    let advice = 'Đề xuất tối ưu hóa các kênh truyền thông, triển khai chương trình giờ vàng và chăm sóc khách hàng thân thiết để tiếp tục gia tăng doanh thu.';
    if (store.industry === 'ca_phe') {
      advice = 'Ngành Cà phê có thể thúc đẩy doanh thu bằng cách bổ sung combo đồ uống kèm bánh ngọt, cập nhật menu đặc trưng theo mùa và nâng cao tốc độ phục vụ giờ cao điểm.';
    } else if (store.industry === 'bia_nuoc_giai_khat') {
      advice = 'Ngành Bia & Nước ngọt nên tập trung gia tăng doanh số bằng các chương trình ưu đãi sỉ theo nhóm (mua thùng), giao hàng nhanh chóng tận nơi miễn phí và liên kết các cơ sở ăn uống lân cận.';
    } else if (store.industry === 'hang_nong_san') {
      advice = 'Ngành Hàng nông sản nên đầu tư bao bì đóng gói bảo quản nông sản sạch đạt tiêu chuẩn an toàn, thiết lập các mối liên kết thu mua trực tiếp tận nhà vườn và phát triển kênh phân phối sỉ rộng rãi.';
    } else if (store.industry === 'nha_hang') {
      advice = 'Ngành Nhà hàng nên tập trung gia tăng giá trị đơn hàng trung bình qua các gợi ý món ăn kèm (upselling), thiết kế set menu đặc biệt và nâng cao trải nghiệm ẩm thực.';
    } else if (store.industry === 'cay_canh') {
      advice = 'Ngành Cây cảnh nên gia tăng doanh thu bằng cách cung cấp các gói cho thuê cây văn phòng định kỳ, nâng cao dịch vụ tư vấn phong thủy và thiết kế tiểu cảnh ban công, sân vườn trọn gói.';
    } else if (store.industry === 'giuong_tu_ban_ghe') {
      advice = 'Ngành Sản xuất Giường, Tủ, Bàn, Ghế nên gia tăng doanh số bằng các dịch vụ thiết kế 3D nội thất căn hộ miễn phí khi đặt mua trọn gói, đa dạng hóa các phân khúc chất liệu gỗ công nghiệp chống ẩm MDF và gỗ tự nhiên cao cấp, đồng thời đẩy mạnh kênh quảng bá trực tuyến giới thiệu quy trình chế tác tinh xảo.';
    } else if (store.industry === 'do_dung_em_be') {
      advice = 'Ngành Đồ dùng & Sinh hoạt em bé nên chú trọng các mặt hàng an toàn, nguồn gốc rõ ràng, liên kết các combo sơ sinh/đầy tháng và chăm sóc khách hàng thân thiết mẹ & bé để gia tăng giá trị đơn hàng.';
    } else if (store.industry === 'vat_lieu_xay_dung') {
      advice = 'Ngành Mua bán Vật liệu xây dựng nên đẩy mạnh liên kết với các chủ thầu công trình, tối ưu chi phí vận chuyển bốc xếp hàng cồng kềnh và đàm phán chiết khấu nhập lượng lớn từ các nhà máy sản xuất (sắt thép, xi măng, gạch men) để gia tăng biên lợi nhuận.';
    }

    return {
      type: 'normal',
      title: 'TÓM TẮT DIỄN BIẾN HOẠT ĐỘNG DOANH THU',
      text: `Tổng doanh thu ghi nhận đạt ${formatVND(stats.totalRevenue)} qua ${stats.count} ngày kinh doanh (trung bình đạt ${avgRevText}/ngày). ${advice}`,
      color: '#0284c7', // sky
      bgColor: '#f0f9ff',
      borderColor: '#bae6fd'
    };
  }, [stats, industryInfo, store.industry]);

  // Draw the beautifully decorated PDF canvas
  const drawReportToCanvas = (canvas: HTMLCanvasElement, pageNum: number = 1) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Extract Month/Year from endDate or current date
    let displayMonth = '';
    let displayYear = '';
    if (endDate) {
      const parts = endDate.split('-');
      if (parts.length >= 2) {
        displayMonth = parts[1];
        displayYear = parts[0];
      }
    }
    if (!displayMonth || !displayYear) {
      const now = new Date();
      displayMonth = String(now.getMonth() + 1).padStart(2, '0');
      displayYear = String(now.getFullYear());
    }

    // Get current date for signature date stamp and fallback period display
    const now = new Date();
    const currentDay = String(now.getDate()).padStart(2, '0');
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentYear = String(now.getFullYear());
    const currentDateFormatted = `${currentDay}/${currentMonth}/${currentYear}`;

    // A4 Standard aspect ratio: 1200 x 1700
    canvas.width = 1200;
    canvas.height = 1700;

    // Fill background with elegant pristine white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw double luxury border around paper
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    ctx.strokeStyle = currentTheme.cardBorderColor || '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(25, 25, canvas.width - 50, canvas.height - 50);

    const headerWidth = canvas.width - 80; // 1120
    const headerX = 40;

    if (pageNum === 1) {
      // 2. HEADER BANNER BLOCK (Custom Gradient Theme)
      const headerY = 40;
      const headerHeight = 160;

      // Draw header background gradient
      const gradient = ctx.createLinearGradient(headerX, headerY, headerX + headerWidth, headerY);
      gradient.addColorStop(0, currentTheme.headerBgStart);
      gradient.addColorStop(0.6, currentTheme.headerBgEnd);
      gradient.addColorStop(1, currentTheme.headerBgStart);
      ctx.fillStyle = gradient;
      
      // Rounded header block
      const radius = 16;
      ctx.beginPath();
      ctx.moveTo(headerX + radius, headerY);
      ctx.lineTo(headerX + headerWidth - radius, headerY);
      ctx.quadraticCurveTo(headerX + headerWidth, headerY, headerX + headerWidth, headerY + radius);
      ctx.lineTo(headerX + headerWidth, headerY + headerHeight - radius);
      ctx.quadraticCurveTo(headerX + headerWidth, headerY + headerHeight, headerX + headerWidth - radius, headerY + headerHeight);
      ctx.lineTo(headerX + radius, headerY + headerHeight);
      ctx.quadraticCurveTo(headerX, headerY + headerHeight, headerX, headerY + headerHeight - radius);
      ctx.lineTo(headerX, headerY + radius);
      ctx.quadraticCurveTo(headerX, headerY, headerX + radius, headerY);
      ctx.closePath();
      ctx.fill();

      // Geometric subtle background lines inside header
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(headerX + headerWidth - 100, headerY + 80, 50 + i * 25, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Header Content
      ctx.textAlign = 'left';
      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = cFont('bold', 20);
      const displayTitle = reportTitle.trim() ? reportTitle.trim().toUpperCase() : 'BÁO CÁO DOANH THU & HIỆU QUẢ HOẠT ĐỘNG';
      ctx.fillText(displayTitle, headerX + 40, headerY + 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = cFont('bold', 34);
      ctx.fillText(customStoreName.toUpperCase(), headerX + 40, headerY + 95);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = cFont('', 16);
      ctx.fillText(`Địa chỉ: ${customAddress}`, headerX + 40, headerY + 124);

      // Selected period
      const formattedStart = startDate ? startDate.split('-').reverse().join('/') : 'Khởi đầu';
      const formattedEnd = endDate ? endDate.split('-').reverse().join('/') : currentDateFormatted;

      let periodText = `Thời kỳ báo cáo: Từ ${formattedStart} đến ${formattedEnd}`;
      if (is12MonthsActive) {
        periodText = isWeeklyGrouped
          ? `Thời kỳ báo cáo: 12 THÁNG GẦN NHẤT - CỘNG GỘP TUẦN (${last12Months.startMonthName} - ${last12Months.endMonthName})`
          : `Thời kỳ báo cáo: 12 THÁNG GẦN NHẤT (${last12Months.startMonthName} - ${last12Months.endMonthName})`;
      } else if (isWeeklyGrouped) {
        periodText = `Thời kỳ báo cáo: BÁO CÁO CỘNG GỘP THEO TUẦN (Từ ${formattedStart} đến ${formattedEnd})`;
      } else {
        const matchingWeek = availableWeeks.find(w => w.startDate === startDate && w.endDate === endDate);
        if (matchingWeek) {
          periodText = `Thời kỳ báo cáo: BÁO CÁO TUẦN ${matchingWeek.weekNum}/${matchingWeek.year} (Từ ${formattedStart} đến ${formattedEnd})`;
        } else if (startDate && endDate) {
          const dStart = parseLocalDate(startDate);
          const dEnd = parseLocalDate(endDate);
          const diffDays = Math.round((dEnd.getTime() - dStart.getTime()) / (1000 * 3600 * 24)) + 1;
          if (diffDays === 7) {
            periodText = `Thời kỳ báo cáo: BÁO CÁO THEO TUẦN (Từ ${formattedStart} đến ${formattedEnd})`;
          }
        }
      }

      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = cFont('bold', 15);
      ctx.fillText(periodText, headerX + 40, headerY + 146);

      // 3. KPI METRIC CARDS (y = 222 to 330)
      if (showKpiCards) {
        const cardY = 222;
        const cardH = 108;
        const cardW = 356;
        const cardGap = 26;
        const startCardX = 40;

        const metricsData = [
          {
            title: 'TỔNG DOANH THU',
            value: formatVND(stats.totalRevenue),
            subtext: `Dòng tiền tích lũy thời kỳ`,
            valColor: '#0f172a'
          },
          {
            title: 'DOANH THU TRUNG BÌNH',
            value: formatVND(stats.avgRevenue),
            subtext: `Bình quân mỗi ngày ghi nhận`,
            valColor: '#0284c7'
          },
          {
            title: isWeeklyGrouped ? 'SỐ TUẦN THỐNG KÊ' : 'SỐ NGÀY GHI NHẬN',
            value: isWeeklyGrouped ? `${reportRecords.length} Tuần` : `${stats.count} Ngày`,
            subtext: isWeeklyGrouped ? `${stats.count} ngày kinh doanh cộng gộp` : `Số ngày thống kê hoạt động`,
            valColor: '#10b981'
          }
        ];

        metricsData.forEach((metric, index) => {
          const cx = startCardX + index * (cardW + cardGap);
          
          // Draw card background
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = currentTheme.cardBorderColor || '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(cx, cardY, cardW, cardH, 12) : ctx.rect(cx, cardY, cardW, cardH);
          ctx.fill();
          ctx.stroke();

          // Card title
          ctx.textAlign = 'left';
          ctx.fillStyle = '#475569';
          ctx.font = cFont('bold', 14);
          ctx.fillText(metric.title, cx + 24, cardY + 28);

          // Card value
          ctx.fillStyle = metric.valColor;
          ctx.font = cFont('bold', 28);
          ctx.fillText(metric.value, cx + 24, cardY + 62);

          // Card subtext
          ctx.fillStyle = '#64748b';
          ctx.font = cFont('', 13);
          ctx.fillText(metric.subtext, cx + 24, cardY + 90);
        });
      }

    } else {
      // Small elegant header banner for subsequent pages
      const headerY = 40;
      const headerHeight = 65;

      const gradient = ctx.createLinearGradient(headerX, headerY, headerX + headerWidth, headerY);
      gradient.addColorStop(0, currentTheme.headerBgStart);
      gradient.addColorStop(1, currentTheme.headerBgEnd);
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(headerX, headerY, headerWidth, headerHeight, 8) : ctx.rect(headerX, headerY, headerWidth, headerHeight);
      ctx.fill();

      ctx.fillStyle = currentTheme.accentColor;
      ctx.font = cFont('bold', 15);
      ctx.textAlign = 'left';
      const displayTitle = reportTitle.trim() ? reportTitle.trim().toUpperCase() : 'BÁO CÁO DOANH THU & HIỆU QUẢ HOẠT ĐỘNG';
      ctx.fillText(`${displayTitle} (TIẾP THEO)`, headerX + 20, headerY + 26);

      ctx.fillStyle = '#ffffff';
      ctx.font = cFont('bold', 18);
      ctx.fillText(`${customStoreName.toUpperCase()} — Trang ${pageNum} / ${totalPages}`, headerX + 20, headerY + 50);
    }

    // 5. DETAILED REPORT TABLE
    const tableY = pageNum === 1 ? (showKpiCards ? 350 : 225) : 120;
    const tableHeaderH = 52;
    const tableW = canvas.width - 80; // 1120
    const tableX = 40;

    // Table Header Background (Themed)
    ctx.fillStyle = currentTheme.tableHeaderBg;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(tableX, tableY, tableW, tableHeaderH, 8) : ctx.rect(tableX, tableY, tableW, tableHeaderH);
    ctx.fill();

    // Define columns dynamically
    interface ColDefinition {
      id: string;
      title: string;
      align: 'left' | 'right' | 'center';
      width: number;
    }

    const dateColWidth = isWeeklyGrouped ? 260 : 140;
    const cols: ColDefinition[] = [
      { id: 'stt', title: 'STT', align: 'left', width: 65 },
      { id: 'date', title: isWeeklyGrouped ? 'TUẦN BÁO CÁO' : 'NGÀY NHẬP', align: 'left', width: dateColWidth },
    ];

    const availableWidth = tableW - (65 + dateColWidth);
    
    // Proportional weights
    const weights: Record<string, number> = {
      revenue: 1.5,
      expense: 1.5,
      profit: 1.5,
      margin: 1.1,
      notes: 3.5
    };
    
    let activeWeight = 0;
    if (showRevenue) activeWeight += weights.revenue;
    if (showExpense) activeWeight += weights.expense;
    if (showProfit) activeWeight += weights.profit;
    if (showMargin) activeWeight += weights.margin;
    if (showNotes) activeWeight += weights.notes;
    
    if (activeWeight > 0) {
      if (showRevenue) {
        cols.push({ id: 'revenue', title: 'DOANH THU (VND)', align: 'right', width: Math.round((weights.revenue / activeWeight) * availableWidth) });
      }
      if (showExpense) {
        cols.push({ id: 'expense', title: 'CHI PHÍ (VND)', align: 'right', width: Math.round((weights.expense / activeWeight) * availableWidth) });
      }
      if (showProfit) {
        cols.push({ id: 'profit', title: 'LỢI NHUẬN (VND)', align: 'right', width: Math.round((weights.profit / activeWeight) * availableWidth) });
      }
      if (showMargin) {
        cols.push({ id: 'margin', title: 'TỶ SUẤT LN', align: 'center', width: Math.round((weights.margin / activeWeight) * availableWidth) });
      }
      if (showNotes) {
        cols.push({ id: 'notes', title: 'GHI CHÚ / CHI TIẾT HOẠT ĐỘNG', align: 'left', width: Math.round((weights.notes / activeWeight) * availableWidth) });
      }
    } else {
      cols[1].width += availableWidth;
    }

    let currentX = tableX;
    const colsWithX = cols.map(col => {
      const startX = currentX;
      currentX += col.width;
      return { ...col, startX };
    });

    // Helper to truncate text inside canvas context
    const truncateText = (text: string, maxWidth: number) => {
      const ellipsis = '...';
      if (ctx.measureText(text).width <= maxWidth) return text;
      let low = 0;
      let high = text.length;
      let best = '';
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const testText = text.substring(0, mid) + ellipsis;
        if (ctx.measureText(testText).width <= maxWidth) {
          best = testText;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return best;
    };

    // Draw headers
    ctx.fillStyle = '#ffffff';
    ctx.font = cFont('bold', 16);
    colsWithX.forEach(col => {
      ctx.textAlign = col.align;
      if (col.align === 'left') {
        ctx.fillText(col.title, col.startX + 20, tableY + 32);
      } else if (col.align === 'right') {
        ctx.fillText(col.title, col.startX + col.width - 20, tableY + 32);
      } else {
        ctx.fillText(col.title, col.startX + col.width / 2, tableY + 32);
      }
    });

    const rowH = pageCapacity.rowH;
    let displayRecords: typeof reportRecords = [];
    let startIdx = 0;
    if (pageNum === 1) {
      const limit = totalPages === 1 ? pageCapacity.p1SinglePageMax : pageCapacity.p1;
      displayRecords = reportRecords.slice(0, limit);
    } else {
      startIdx = pageCapacity.p1 + (pageNum - 2) * pageCapacity.subsequent;
      const limit = pageNum === totalPages ? pageCapacity.finalPageMax : pageCapacity.subsequent;
      displayRecords = reportRecords.slice(startIdx, startIdx + limit);
    }

    displayRecords.forEach((rec, idx) => {
      const ry = tableY + tableHeaderH + idx * rowH;

      // Zebra striping background
      ctx.fillStyle = idx % 2 === 1 ? currentTheme.activeRowBg : '#ffffff';
      ctx.fillRect(tableX, ry, tableW, rowH);

      // Light row divider
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX, ry + rowH);
      ctx.lineTo(tableX + tableW, ry + rowH);
      ctx.stroke();

      // Render cells dynamically
      colsWithX.forEach(col => {
        ctx.textAlign = col.align;
        
        if (col.id === 'stt') {
          ctx.fillStyle = '#475569';
          ctx.font = cFont('bold', 14);
          ctx.fillText((startIdx + idx + 1).toString(), col.startX + 20, ry + 28);
        } else if (col.id === 'date') {
          let formattedDate = rec.date;
          if (!isWeeklyGrouped && rec.date.includes('-')) {
            const dateParts = rec.date.split('-');
            if (dateParts.length === 3) {
              formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
            }
          }
          ctx.fillStyle = '#0f172a';
          ctx.font = cFont('bold', 14);
          ctx.fillText(formattedDate, col.startX + 20, ry + 28);
        } else if (col.id === 'revenue') {
          ctx.fillStyle = '#0f172a';
          ctx.font = cFont('bold', 16);
          ctx.fillText(formatVND(rec.revenue).replace('₫', '').trim(), col.startX + col.width - 20, ry + 28);
        } else if (col.id === 'expense') {
          ctx.fillStyle = '#475569';
          ctx.font = cFont('', 15);
          ctx.fillText(formatVND(rec.expense).replace('₫', '').trim(), col.startX + col.width - 20, ry + 28);
        } else if (col.id === 'profit') {
          const profitColor = rec.profit >= 0 ? '#059669' : '#dc2626';
          ctx.fillStyle = profitColor;
          ctx.font = cFont('bold', 16);
          ctx.fillText(formatVND(rec.profit).replace('₫', '').trim(), col.startX + col.width - 20, ry + 28);
        } else if (col.id === 'margin') {
          const marginVal = rec.revenue > 0 ? (rec.profit / rec.revenue) * 100 : 0;
          const marginPillBg = marginVal >= industryInfo.benchmarkMargin * 100 ? '#ecfdf5' : marginVal > 0 ? '#fffbeb' : '#fef2f2';
          const marginPillText = marginVal >= industryInfo.benchmarkMargin * 100 ? '#059669' : marginVal > 0 ? '#b45309' : '#dc2626';
          
          const px = col.startX + col.width / 2;
          const py = ry + 9;
          const pw = 72;
          const ph = 26;

          ctx.fillStyle = marginPillBg;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(px - pw / 2, py, pw, ph, 12) : ctx.rect(px - pw / 2, py, pw, ph);
          ctx.fill();

          ctx.fillStyle = marginPillText;
          ctx.font = cFont('bold', 13);
          ctx.fillText(`${marginVal.toFixed(1)}%`, px, py + 18);
        } else if (col.id === 'notes') {
          ctx.fillStyle = '#1e293b';
          ctx.font = cFont('', 14);
          let noteText = rec.notes || '—';
          const maxTextW = col.width - 30;
          const truncated = truncateText(noteText, maxTextW);
          ctx.fillText(truncated, col.startX + 20, ry + 28);
        }
      });
    });

    // 5.1 TOTAL SUMMARY ROW AT BOTTOM OF TABLE
    const totalRowY = tableY + tableHeaderH + displayRecords.length * rowH;
    const totalRowH = 48;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(tableX, totalRowY, tableW, totalRowH);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tableX, totalRowY);
    ctx.lineTo(tableX + tableW, totalRowY);
    ctx.moveTo(tableX, totalRowY + totalRowH);
    ctx.lineTo(tableX + tableW, totalRowY + totalRowH);
    ctx.stroke();

    const isFinalPage = pageNum === totalPages;
    const pageRevenue = displayRecords.reduce((sum, r) => sum + r.revenue, 0);
    const pageExpense = displayRecords.reduce((sum, r) => sum + r.expense, 0);
    const pageProfit = displayRecords.reduce((sum, r) => sum + r.profit, 0);

    const displayRev = isFinalPage ? stats.totalRevenue : pageRevenue;
    const displayExp = isFinalPage ? stats.totalExpense : pageExpense;
    const displayProf = isFinalPage ? stats.totalProfit : pageProfit;
    const displayMargin = displayRev > 0 ? (displayProf / displayRev) * 100 : 0;

    colsWithX.forEach(col => {
      ctx.textAlign = col.align;
      if (col.id === 'stt') {
        ctx.fillStyle = '#0f172a';
        ctx.font = cFont('bold', 15);
        const countLabel = isWeeklyGrouped ? `${reportRecords.length} TUẦN` : `${stats.count} NGÀY`;
        const labelText = isFinalPage ? `TỔNG CỘNG (${countLabel}):` : `TỔNG TRANG ${pageNum}:`;
        ctx.fillText(labelText, col.startX + 20, totalRowY + 30);
      } else if (col.id === 'revenue') {
        ctx.fillStyle = '#0f172a';
        ctx.font = cFont('bold', 16);
        ctx.fillText(formatVND(displayRev).replace('₫', '').trim(), col.startX + col.width - 20, totalRowY + 30);
      } else if (col.id === 'expense') {
        ctx.fillStyle = '#475569';
        ctx.font = cFont('bold', 16);
        ctx.fillText(formatVND(displayExp).replace('₫', '').trim(), col.startX + col.width - 20, totalRowY + 30);
      } else if (col.id === 'profit') {
        ctx.fillStyle = displayProf >= 0 ? '#059669' : '#dc2626';
        ctx.font = cFont('bold', 16);
        ctx.fillText(formatVND(displayProf).replace('₫', '').trim(), col.startX + col.width - 20, totalRowY + 30);
      } else if (col.id === 'margin') {
        ctx.fillStyle = '#0284c7';
        ctx.font = cFont('bold', 13);
        ctx.fillText(`${displayMargin.toFixed(1)}%`, col.startX + col.width / 2, totalRowY + 30);
      }
    });

    if (pageNum < totalPages) {
      ctx.fillStyle = '#0284c7';
      ctx.font = cFont('italic', 14);
      ctx.textAlign = 'left';
      ctx.fillText(`* Chú ý: Danh sách chi tiết còn tiếp diễn, xin vui lòng xem trang sau.`, 40, totalRowY + totalRowH + 26);
    }

    if (pageNum === totalPages && showSignatures) {
      // 6. BOTTOM SIGNATURES AREA
      const signatureY = totalRowY + totalRowH + 35;

      if (signatureStyle === 'single') {
        // Single signature on right side
        ctx.fillStyle = '#334155';
        ctx.font = cFont('italic', 14);
        ctx.textAlign = 'center';
        ctx.fillText(`Ngày .... tháng .... năm ${currentYear}`, 880, signatureY);

        ctx.fillStyle = '#0f172a';
        ctx.font = cFont('bold', 16);
        ctx.textAlign = 'center';
        ctx.fillText(signerTitle.toUpperCase(), 880, signatureY + 30);

        ctx.fillStyle = '#64748b';
        ctx.font = cFont('italic', 13);
        ctx.fillText('(Ký, đóng dấu và ghi rõ họ tên)', 880, signatureY + 52);

        if (signerName.trim()) {
          ctx.fillStyle = '#0f172a';
          ctx.font = cFont('bold', 16);
          ctx.fillText(signerName.trim().toUpperCase(), 880, signatureY + 145);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = cFont('', 14);
          for (let i = 1; i <= 6; i++) {
            const lineY = signatureY + 52 + i * 20;
            if (i === 6) {
              ctx.fillStyle = '#475569';
              ctx.font = cFont('italic', 13);
              ctx.fillText('Họ và tên: ............................................', 880, lineY);
            } else {
              ctx.fillText('........................................................', 880, lineY);
            }
          }
        }
      } else {
        // Double signature: Left (Creator) & Right (Store Owner)
        // Left Column (X = 300)
        ctx.fillStyle = '#0f172a';
        ctx.font = cFont('bold', 16);
        ctx.textAlign = 'center';
        ctx.fillText(creatorTitle.toUpperCase(), 300, signatureY + 30);

        ctx.fillStyle = '#64748b';
        ctx.font = cFont('italic', 13);
        ctx.fillText('(Ký và ghi rõ họ tên)', 300, signatureY + 52);

        if (creatorName.trim()) {
          ctx.fillStyle = '#0f172a';
          ctx.font = cFont('bold', 16);
          ctx.fillText(creatorName.trim().toUpperCase(), 300, signatureY + 145);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = cFont('', 14);
          for (let i = 1; i <= 6; i++) {
            const lineY = signatureY + 52 + i * 20;
            if (i === 6) {
              ctx.fillStyle = '#475569';
              ctx.font = cFont('italic', 13);
              ctx.fillText('Họ và tên: ............................................', 300, lineY);
            } else {
              ctx.fillText('........................................................', 300, lineY);
            }
          }
        }

        // Right Column (X = 880)
        ctx.fillStyle = '#334155';
        ctx.font = cFont('italic', 14);
        ctx.textAlign = 'center';
        ctx.fillText(`Ngày .... tháng .... năm ${currentYear}`, 880, signatureY);

        ctx.fillStyle = '#0f172a';
        ctx.font = cFont('bold', 16);
        ctx.textAlign = 'center';
        ctx.fillText(signerTitle.toUpperCase(), 880, signatureY + 30);

        ctx.fillStyle = '#64748b';
        ctx.font = cFont('italic', 13);
        ctx.fillText('(Ký, đóng dấu và ghi rõ họ tên)', 880, signatureY + 52);

        if (signerName.trim()) {
          ctx.fillStyle = '#0f172a';
          ctx.font = cFont('bold', 16);
          ctx.fillText(signerName.trim().toUpperCase(), 880, signatureY + 145);
        } else {
          ctx.fillStyle = '#cbd5e1';
          ctx.font = cFont('', 14);
          for (let i = 1; i <= 6; i++) {
            const lineY = signatureY + 52 + i * 20;
            if (i === 6) {
              ctx.fillStyle = '#475569';
              ctx.font = cFont('italic', 13);
              ctx.fillText('Họ và tên: ............................................', 880, lineY);
            } else {
              ctx.fillText('........................................................', 880, lineY);
            }
          }
        }
      }
    }

    // --- Footer for all pages ---
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, canvas.height - 90);
    ctx.lineTo(canvas.width - 40, canvas.height - 90);
    ctx.stroke();

    // Footer Text (Left-aligned)
    ctx.fillStyle = '#475569';
    ctx.font = cFont('italic', 13);
    ctx.textAlign = 'left';
    const defaultFooter = `Kết quả kinh doanh của "${customStoreName}" được xuất Tháng ${displayMonth}/${displayYear}.`;
    const footerText = customFooterNote.trim() ? customFooterNote.trim() : defaultFooter;
    ctx.fillText(footerText, 40, canvas.height - 58);

    // Page Number Indicator (Right-aligned)
    ctx.fillStyle = '#64748b';
    ctx.font = cFont('bold', 13);
    ctx.textAlign = 'right';
    ctx.fillText(`Trang ${pageNum} / ${totalPages}`, canvas.width - 40, canvas.height - 58);
  };

  // Helper text-wrapper for canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  // Effect to re-render preview canvas on customization change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawReportToCanvas(canvas, previewPage);
    }
  }, [
    customStoreName,
    customAddress,
    stats,
    commentary,
    startDate,
    endDate,
    filteredRecords,
    previewPage,
    totalPages,
    showRevenue,
    showExpense,
    showProfit,
    showMargin,
    showNotes,
    selectedFontId,
    selectedThemeId,
    tableDensity,
    reportTitle,
    showKpiCards,
    showSignatures,
    signatureStyle,
    signerTitle,
    signerName,
    creatorTitle,
    creatorName,
    customFooterNote
  ]);

  // Handle PDF Generation & Local Download
  const handleDownloadPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isGenerating) return;

    setIsGenerating(true);
    try {
      // Ensure all web fonts are loaded prior to rendering
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('Font loading check warning:', e);
        }
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 1200;
      tempCanvas.height = 1700;

      // Create PDF in A4 format (Portrait)
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let p = 1; p <= totalPages; p++) {
        if (p > 1) {
          pdf.addPage();
        }
        drawReportToCanvas(tempCanvas, p);
        const imgData = tempCanvas.toDataURL('image/jpeg', 0.95);
        // A4 measures: 210mm x 297mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
      
      const getExportFileName = () => {
        let targetMonth = '';
        let targetYear = '';
        if (endDate) {
          const parts = endDate.split('-');
          if (parts.length >= 2) {
            targetMonth = parts[1];
            targetYear = parts[0];
          }
        }
        if (!targetMonth || !targetYear) {
          const now = new Date();
          targetMonth = String(now.getMonth() + 1).padStart(2, '0');
          targetYear = String(now.getFullYear());
        }

        const safeStoreName = (customStoreName || store.name || 'Hộ kinh doanh')
          .trim()
          .replace(/[/\\?%*:|"<>]/g, '');

        if (is12MonthsActive) {
          const groupTag = isWeeklyGrouped ? '_gop_tuan' : '';
          return `bao cao 12 thang ${safeStoreName} (${last12Months.startDisplayMonth.replace('/', '-')}_den_${last12Months.endDisplayMonth.replace('/', '-')})${groupTag}.pdf`;
        }

        if (isWeeklyGrouped) {
          return `báo cáo gộp tuần ${safeStoreName} đến tháng ${targetMonth}-${targetYear}.pdf`;
        } else {
          return `bao cao ${safeStoreName} đến tháng ${targetMonth}-${targetYear}.pdf`;
        }
      };

      pdf.save(getExportFileName());
    } catch (err) {
      console.error('Lỗi xuất file PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Instant print via browser
  const handlePrint = async () => {
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch {}
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1200;
    tempCanvas.height = 1700;

    const pagesDataUrls: string[] = [];
    for (let p = 1; p <= totalPages; p++) {
      drawReportToCanvas(tempCanvas, p);
      pagesDataUrls.push(tempCanvas.toDataURL('image/png'));
    }

    const pagesHtml = pagesDataUrls
      .map(
        (url, idx) => `
      <div class="print-page ${idx < pagesDataUrls.length - 1 ? 'page-break' : ''}">
        <img src="${url}" style="width: 100%; height: auto; display: block;" />
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${customStoreName} - ${reportTitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: #f1f5f9;
            }
            .print-page {
              width: 100%;
              box-sizing: border-box;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
            @media print {
              body {
                background: white;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle Simulated Email dispatch with professional stage step loadings
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) {
      setEmailError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      setEmailError('Địa chỉ email không đúng định dạng');
      return;
    }

    setEmailError('');
    setEmailStep('sending');

    const steps = [
      'Khởi chạy nhân tệp PDF...',
      'Đang nén dữ liệu báo cáo...',
      'Đang kết nối đến máy chủ thư điện tử bảo mật...',
      'Đang đính kèm tệp tin tài chính...',
      'Đang gửi email thông báo...'
    ];

    let currentStepIdx = 0;
    setSendingStatus(steps[0]);

    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setSendingStatus(steps[currentStepIdx]);
      } else {
        clearInterval(interval);
        setEmailStep('success');
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header Block */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
            <div>
              <h2 className="text-base font-extrabold text-zinc-50 tracking-tight">Xuất Báo Cáo Doanh Thu PDF</h2>
              <p className="text-[11px] text-zinc-400">Thiết kế chuẩn A4 trang nhã phục vụ in ấn hoặc lưu trữ thông tin nội bộ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/20">
          
          {/* Left Column: Scaled-down Crisp Canvas Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <label className="w-full text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 flex justify-between">
              <span>BẢN IN XEM TRƯỚC (RETINA PREVIEW)</span>
              <span className="text-sky-400 font-extrabold">{totalPages > 1 ? `TRANG ${previewPage} / ${totalPages}` : 'A4 PORTRAIT'}</span>
            </label>
            
            <div className="w-full max-h-[500px] overflow-y-auto border border-zinc-800/80 rounded-xl bg-zinc-950 p-4 flex justify-center shadow-inner scrollbar-thin scrollbar-thumb-zinc-800">
              <canvas
                ref={canvasRef}
                className="bg-white rounded-lg shadow-2xl select-none"
                style={{ width: '330px', height: '467px' }}
              />
            </div>

            {/* Page Navigation Controls */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  disabled={previewPage <= 1}
                  onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 disabled:hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg cursor-pointer transition-colors"
                >
                  Trang trước
                </button>
                <span className="text-[11px] font-semibold text-zinc-300">
                  Trang {previewPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={previewPage >= totalPages}
                  onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 text-[11px] font-bold bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 disabled:hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg cursor-pointer transition-colors"
                >
                  Trang sau
                </button>
              </div>
            )}
            
            <p className="text-[10px] text-zinc-500 mt-2.5 leading-normal text-center italic">
              💡 Báo cáo tự động phân trang ({totalPages} trang - {filteredRecords.length} ngày). Tất cả các trang sẽ được xuất đầy đủ trong file PDF tải về.
            </p>
          </div>

          {/* Right Column: Customization & Actions panel */}
          <div className="lg:col-span-7 space-y-5 flex flex-col justify-between">
            
            {/* Custom inputs */}
            <div className="space-y-4">
              
              {/* 1. GIAO DIỆN & PHÔNG CHỮ CHUYÊN NGHIỆP */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Phông Chữ & Bảng Màu Chủ Đạo</span>
                </h3>
                <span className="text-[10px] text-zinc-400">Tùy biến cao cấp chuẩn A4</span>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-4">
                {/* Font Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-sky-400" />
                      <span>Phông chữ báo cáo ({CONTRACT_FONTS.length} phông):</span>
                    </span>
                    <span className="text-sky-300 font-semibold normal-case text-[10px]">
                      {currentFont.name} ({currentFont.category})
                    </span>
                  </label>
                  
                  <select
                    value={selectedFontId}
                    onChange={(e) => handleSelectFont(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-medium cursor-pointer"
                  >
                    {CONTRACT_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name} — [{font.category}] {font.description ? `• ${font.description}` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Font Quick Preview Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {CONTRACT_FONTS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectFont(f.id)}
                        style={{ fontFamily: f.fontFamily }}
                        className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                          selectedFontId === f.id
                            ? 'bg-sky-500/20 border-sky-500 text-sky-200 font-bold shadow-sm'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Bảng màu chủ đạo (Theme):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {REPORT_THEMES.map((theme) => {
                      const isSelected = selectedThemeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedThemeId(theme.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-zinc-850 border-sky-500 ring-1 ring-sky-500/40 shadow-sm'
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm"
                            style={{ backgroundColor: theme.previewColor }}
                          />
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold truncate text-zinc-100">{theme.name}</span>
                            <span className="block text-[9px] text-zinc-400 truncate">{theme.badge}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Table Density */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Mật độ bảng biểu (Bố cục dòng):</span>
                    <span className="text-sky-400 font-semibold normal-case text-[10px]">
                      {tableDensity === 'compact' ? 'Nhỏ gọn (Tiết kiệm trang)' : tableDensity === 'spacious' ? 'Thoáng đãng (Rộng rãi)' : 'Tiêu chuẩn'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTableDensity('compact')}
                      className={`py-1.5 px-2 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                        tableDensity === 'compact'
                          ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Nhỏ gọn (~27 dòng/trang)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableDensity('normal')}
                      className={`py-1.5 px-2 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                        tableDensity === 'normal'
                          ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Tiêu chuẩn (~23 dòng/trang)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableDensity('spacious')}
                      className={`py-1.5 px-2 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                        tableDensity === 'spacious'
                          ? 'bg-sky-500/15 border-sky-500 text-sky-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Thoáng đãng (~20 dòng/trang)
                    </button>
                  </div>
                </div>

              </div>

              {/* 2. THÔNG TIN TIÊU ĐỀ BÁO CÁO */}
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Nội Dung & Tiêu Đề Báo Cáo</span>
              </h3>
              
              <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Tiêu Đề Báo Cáo (In hoa trên đầu bản in)
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="Ví dụ: BÁO CÁO DOANH THU & HIỆU QUẢ HOẠT ĐỘNG..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Tên Cửa Hàng / Cơ Sở <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500">
                        <StoreIcon className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={customStoreName}
                        onChange={(e) => setCustomStoreName(e.target.value)}
                        placeholder="Nhập tên đại lý/cửa hàng..."
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Địa chỉ Cửa Hàng <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="Nhập địa chỉ cơ sở..."
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Ghi Chú / Khẩu Hiệu Chân Trang (Footer note)
                  </label>
                  <input
                    type="text"
                    value={customFooterNote}
                    onChange={(e) => setCustomFooterNote(e.target.value)}
                    placeholder="Để trống sẽ dùng câu mặc định của cửa hàng..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer hover:text-zinc-100 select-none">
                    <input
                      type="checkbox"
                      checked={showKpiCards}
                      onChange={(e) => setShowKpiCards(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer"
                    />
                    <span>Hiển thị 3 thẻ số liệu KPI tổng quan trên đầu trang 1</span>
                  </label>
                </div>
              </div>

              {/* 3. CỘT BẢNG BIỂU & GOM NHÓM */}
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Cột Hiển Thị Trên Báo Cáo</span>
              </h3>
              <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3">
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Tích chọn các cột muốn hiển thị chi tiết trong bảng biểu của tệp PDF (Bố cục bảng sẽ tự động căn lề co dãn chuẩn xác):
                </p>
                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer hover:text-zinc-100 select-none">
                    <input
                      type="checkbox"
                      checked={showRevenue}
                      onChange={(e) => setShowRevenue(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer"
                    />
                    <span>Doanh thu</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer hover:text-zinc-100 select-none">
                    <input
                      type="checkbox"
                      checked={showExpense}
                      onChange={(e) => setShowExpense(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer"
                    />
                    <span>Chi phí</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer hover:text-zinc-100 select-none">
                    <input
                      type="checkbox"
                      checked={showProfit}
                      onChange={(e) => setShowProfit(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer"
                    />
                    <span>Lợi nhuận</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer hover:text-zinc-100 select-none">
                    <input
                      type="checkbox"
                      checked={showMargin}
                      onChange={(e) => setShowMargin(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer"
                    />
                    <span>Tỷ suất LN (%)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer hover:text-zinc-100 select-none col-span-2">
                    <input
                      type="checkbox"
                      checked={showNotes}
                      onChange={(e) => setShowNotes(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer"
                    />
                    <span>Ghi chú / Chi tiết hoạt động</span>
                  </label>
                </div>
              </div>

              {/* 4. CHỮ KÝ & PHÊ DUYỆT */}
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Ký Tên & Phê Duyệt Văn Bản</span>
              </h3>
              <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3.5">
                <label className="flex items-center gap-2.5 text-xs font-bold text-zinc-300 cursor-pointer hover:text-zinc-100 select-none">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) => setShowSignatures(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer"
                  />
                  <span>Hiển thị khu vực ký tên & phê duyệt ở cuối báo cáo</span>
                </label>

                {showSignatures && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-300">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="signatureStyle"
                          value="single"
                          checked={signatureStyle === 'single'}
                          onChange={() => setSignatureStyle('single')}
                          className="text-sky-500 accent-sky-500"
                        />
                        <span>1 Bên (Chủ hộ kinh doanh)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="signatureStyle"
                          value="double"
                          checked={signatureStyle === 'double'}
                          onChange={() => setSignatureStyle('double')}
                          className="text-sky-500 accent-sky-500"
                        />
                        <span>2 Bên (Người lập & Người duyệt)</span>
                      </label>
                    </div>

                    {signatureStyle === 'double' && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            Chức danh bên trái (Người lập)
                          </label>
                          <input
                            type="text"
                            value={creatorTitle}
                            onChange={(e) => setCreatorTitle(e.target.value)}
                            placeholder="NGƯỜI LẬP BIỂU"
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            Họ tên người lập (để trống nếu ký tay)
                          </label>
                          <input
                            type="text"
                            value={creatorName}
                            onChange={(e) => setCreatorName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Chức danh người ký duyệt
                        </label>
                        <input
                          type="text"
                          value={signerTitle}
                          onChange={(e) => setSignerTitle(e.target.value)}
                          placeholder="CHỦ HỘ KINH DOANH"
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                          Họ tên người ký duyệt (để trống nếu ký tay)
                        </label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="Trần Văn B"
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider">Chế Độ Gom Nhóm Bảng Biểu</h3>
              <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 text-xs font-bold text-sky-300 cursor-pointer hover:text-sky-200 select-none">
                  <input
                    type="checkbox"
                    checked={isWeeklyGrouped}
                    onChange={(e) => setIsWeeklyGrouped(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-zinc-800 bg-zinc-950 text-sky-500 focus:ring-sky-500/20 focus:ring-offset-zinc-900 focus:ring-2 accent-sky-500 cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="block text-sky-300 font-bold">Cộng gộp doanh thu theo từng Tuần</span>
                    <p className="text-[10px] text-zinc-400 font-normal leading-relaxed mt-1">
                      Tiết kiệm giấy in khi xuất báo cáo cả năm (Gom 365 ngày thành ~52 dòng tuần, rút ngắn từ ~16 trang xuống còn ~2-3 trang A4).
                    </p>
                  </div>
                </label>
              </div>

              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center justify-between">
                <span>Thời Gian Xuất Báo Cáo</span>
                {filteredRecords.length > 0 && (
                  <span className="text-[10px] text-zinc-400 font-normal normal-case">
                    Hiển thị: <strong className="text-sky-300 font-semibold">{reportRecords.length} {isWeeklyGrouped ? 'tuần' : 'ngày'}</strong> ({totalPages} trang in A4)
                  </span>
                )}
              </h3>
              
              <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3.5">
                {/* Week Selector Dropdown */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Chọn nhanh theo Tuần (Tiết kiệm trang in):</span>
                    </span>
                  </label>
                  <select
                    value={selectedWeekKey}
                    onChange={(e) => handleSelectWeek(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold cursor-pointer"
                  >
                    <option value="custom">-- Tùy chỉnh ngày bên dưới --</option>
                    <option value="all">Toàn bộ thời gian ({storeRecords.length} ngày)</option>
                    {availableWeeks.map((w) => (
                      <option key={w.key} value={w.key}>
                        Tuần {w.weekNum}/{w.year} ({w.startDisplay} - {w.endDisplay}) • {w.recordCount} ngày
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preset Quick Buttons */}
                <div className="space-y-2.5 pt-1">
                  {/* Primary 12-Month Quick Preset Button */}
                  <button
                    type="button"
                    onClick={handleSelect12Months}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                      is12MonthsActive
                        ? 'bg-sky-500/15 border-sky-500 text-sky-300 ring-1 ring-sky-500/30'
                        : 'bg-zinc-950 hover:bg-zinc-850 border-sky-500/40 text-sky-400 hover:text-sky-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
                      <span className="font-extrabold">12 tháng gần nhất (Trừ lùi 1 tháng)</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/30 text-sky-200 font-mono font-bold">
                      {last12Months.startDisplayMonth} - {last12Months.endDisplayMonth}
                    </span>
                  </button>

                  {/* Active 12-month info badge */}
                  {is12MonthsActive && (
                    <div className="p-2.5 bg-sky-950/30 border border-sky-500/20 rounded-lg text-[11px] text-sky-300 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-300">Khung thời gian 12 tháng:</span>
                        <span className="font-mono text-sky-300 font-bold">{last12Months.startDisplayFull} → {last12Months.endDisplayFull}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        ✓ Tính từ đầu {last12Months.startMonthName} đến hết {last12Months.endMonthName} (đúng 12 tháng kinh doanh trọn vẹn).
                      </p>
                    </div>
                  )}

                  {/* Other Quick Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => { setSelectedWeekKey('all'); setStartDate(minDate); setEndDate(maxDate); }}
                      className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedWeekKey === 'all' || (startDate === minDate && endDate === maxDate && !is12MonthsActive)
                          ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                          : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Tất cả thời gian
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectRelativeWeek(0)}
                      className="px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Tuần này</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectRelativeWeek(-1)}
                      className="px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Tuần trước</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWeekKey('custom');
                        if (maxDate) {
                          const max = parseLocalDate(maxDate);
                          const sevenDaysAgo = new Date(max.getTime());
                          sevenDaysAgo.setDate(max.getDate() - 7);
                          const start = formatLocalDate(sevenDaysAgo);
                          setStartDate(start < minDate ? minDate : start);
                          setEndDate(maxDate);
                        }
                      }}
                      className="px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      7 ngày gần nhất
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWeekKey('custom');
                        if (maxDate) {
                          const max = parseLocalDate(maxDate);
                          const thirtyDaysAgo = new Date(max.getTime());
                          thirtyDaysAgo.setDate(max.getDate() - 30);
                          const start = formatLocalDate(thirtyDaysAgo);
                          setStartDate(start < minDate ? minDate : start);
                          setEndDate(maxDate);
                        }
                      }}
                      className="px-3 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      30 ngày gần nhất
                    </button>
                  </div>
                </div>

                {/* Custom Date Inputs */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      max={endDate}
                      onChange={(e) => {
                        setSelectedWeekKey('custom');
                        setStartDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => {
                        setSelectedWeekKey('custom');
                        setEndDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email Dispatch Block */}
            <div className="space-y-4 py-2 border-t border-zinc-850">
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider">Nhận tệp qua Email</h3>
              
              {emailStep === 'idle' && (
                <form onSubmit={handleSendEmail} className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl space-y-3">
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Hệ thống hỗ trợ gửi trực tiếp file PDF đính kèm qua email để bạn lưu trữ từ xa, gửi cho các cổ đông hoặc bộ phận kế toán.
                  </p>
                  
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-zinc-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Nhập email nhận báo cáo..."
                        value={emailAddress}
                        onChange={(e) => {
                          setEmailAddress(e.target.value);
                          if (emailError) setEmailError('');
                        }}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-xs font-mono"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="px-4 bg-sky-500/10 hover:bg-sky-500 hover:text-zinc-950 border border-sky-500/20 hover:border-sky-500 text-sky-400 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi Ngay
                    </button>
                  </div>
                  {emailError && (
                    <p className="text-[10px] text-red-400 font-semibold">{emailError}</p>
                  )}
                </form>
              )}

              {emailStep === 'sending' && (
                <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-xl flex flex-col items-center justify-center space-y-3.5">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <div className="text-center">
                    <p className="text-xs text-zinc-100 font-bold">{sendingStatus}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">Vui lòng giữ kết nối internet ổn định</p>
                  </div>
                </div>
              )}

              {emailStep === 'success' && (
                <div className="bg-emerald-950/10 border border-emerald-900/30 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Đã gửi email thành công!</h4>
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Báo cáo PDF đã được xuất bản và chuyển phát thành công đến hộp thư <span className="text-zinc-200 font-mono font-semibold">{emailAddress}</span> làm tài liệu đính kèm. Bạn có thể kiểm tra mục thư đến/Spam để đọc tệp tin.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailStep('idle');
                        setEmailAddress('');
                      }}
                      className="text-[10px] text-sky-400 font-bold underline hover:text-sky-300 mt-1.5 block"
                    >
                      Gửi tiếp đến email khác
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Download & Print Buttons */}
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={isGenerating}
                  className="py-3 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border border-zinc-700 rounded-xl font-bold tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4 text-sky-400" />
                  <span>In Trực Tiếp (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGenerating}
                  className="py-3 px-4 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl font-extrabold tracking-wider text-xs uppercase flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-lg shadow-sky-500/10 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xuất PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Tải PDF Về Máy</span>
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-[9.5px] text-zinc-500 text-center leading-normal">
                🔒 Tệp PDF của bạn được xử lý cục bộ hoàn toàn riêng tư bằng công nghệ High-DPI Canvas, cam kết bảo mật 100% dữ liệu tài chính cửa hàng của bạn.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
