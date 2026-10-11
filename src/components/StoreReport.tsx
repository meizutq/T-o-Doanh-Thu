import { useState, useMemo } from 'react';
import { Store, SalesRecord, INDUSTRIES, PurchaseContract } from '../types';
import { formatVND, formatVNDCompact } from '../utils/sampleData';
import { computeProjectionMetrics, getDefaultIndustryParameters } from '../utils/revenueGenerator';
import InvoiceModal from './InvoiceModal';
import ReportPdfModal from './ReportPdfModal';
import CapitalPlanTab from './CapitalPlanTab';
import GenerateRevenueModal from './GenerateRevenueModal';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Search,
  Download,
  AlertTriangle,
  Award,
  Zap,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  FileText,
  Eye,
  Landmark,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowRight,
  Calculator,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  Check,
  Info,
  Database
} from 'lucide-react';

interface StoreReportProps {
  store: Store;
  records: SalesRecord[];
  contracts?: PurchaseContract[];
  buyerName: string;
  onAddRecord: () => void;
  onEditRecord: (record: SalesRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteAllRecords?: () => void;
  onAddContract: () => void;
  onViewContract: (contract: PurchaseContract) => void;
  onViewUynhiemchi?: (contract: PurchaseContract) => void;
  onDeleteContract: (id: string) => void;
  onUpdateStore?: (storeId: string, updatedFields: Partial<Store>) => void;
  onBatchCreateRecords?: (records: SalesRecord[], isOverwrite?: boolean) => void;
  onOpenBackupRestore?: () => void;
}

export default function StoreReport({ 
  store, 
  records, 
  contracts = [], 
  buyerName, 
  onAddRecord, 
  onEditRecord, 
  onDeleteRecord, 
  onDeleteAllRecords,
  onAddContract,
  onViewContract,
  onViewUynhiemchi,
  onDeleteContract,
  onUpdateStore,
  onBatchCreateRecords,
  onOpenBackupRestore
}: StoreReportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'revenue' | 'profit'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [invoiceRecord, setInvoiceRecord] = useState<SalesRecord | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'contracts' | 'capital_plan'>('sales');

  // States for period-based filtering
  const [filterMode, setFilterMode] = useState<'10_days' | '30_days' | 'month'>('10_days');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Industry details
  const industryInfo = INDUSTRIES[store.industry];

  // Capital plan parameters and computed projection metrics
  const currentParams = useMemo(() => {
    return store.projectionParams || getDefaultIndustryParameters(store.industry);
  }, [store.projectionParams, store.industry]);

  const projectionMetrics = useMemo(() => {
    return computeProjectionMetrics(store, currentParams, records);
  }, [store, currentParams, records]);

  // Contracts summary for this store
  const storeContracts = useMemo(() => {
    return contracts.filter((c) => c.storeId === store.id);
  }, [contracts, store.id]);

  const totalContractAmount = useMemo(() => {
    return storeContracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  }, [storeContracts]);

  const inputContractsCount = useMemo(() => {
    return storeContracts.filter((c) => c.contractType !== 'output').length;
  }, [storeContracts]);

  const outputContractsCount = useMemo(() => {
    return storeContracts.filter((c) => c.contractType === 'output').length;
  }, [storeContracts]);

  const latestContract = useMemo(() => {
    if (storeContracts.length === 0) return null;
    return [...storeContracts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }, [storeContracts]);

  // Extract unique months from all records for this store
  const availableMonths = useMemo(() => {
    const storeRecords = records.filter((r) => r.storeId === store.id);
    const months = new Set<string>();
    storeRecords.forEach((r) => {
      const parts = r.date.split('-');
      if (parts[0] && parts[1]) {
        months.add(`${parts[0]}-${parts[1]}`);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [records, store.id]);

  // Compute the current active month for filtering
  const activeMonth = useMemo(() => {
    if (selectedMonth) return selectedMonth;
    return availableMonths[0] || '';
  }, [selectedMonth, availableMonths]);

  // Filter records based on selected store and chosen period (10 days vs 30 days vs month)
  const periodRecords = useMemo(() => {
    const storeRecords = records.filter((r) => r.storeId === store.id);
    
    if (filterMode === '10_days') {
      // Sort by date descending to identify the latest 10 records
      return [...storeRecords]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);
    } else if (filterMode === '30_days') {
      // Sort by date descending to identify the latest 30 records
      return [...storeRecords]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);
    } else {
      // Filter by the active month
      if (!activeMonth) return storeRecords;
      return storeRecords.filter((r) => r.date.startsWith(activeMonth));
    }
  }, [records, store.id, filterMode, activeMonth]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    return periodRecords
      .filter((r) => r.date.includes(searchTerm) || (r.notes || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let fieldA = a[sortField];
        let fieldB = b[sortField];

        if (sortField === 'date') {
          return sortOrder === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
        } else {
          return sortOrder === 'asc' ? (fieldA as number) - (fieldB as number) : (fieldB as number) - (fieldA as number);
        }
      });
  }, [periodRecords, searchTerm, sortField, sortOrder]);

  // Dynamic subtitle explaining current filtering state
  const tableSubtitle = useMemo(() => {
    if (filterMode === '10_days') {
      return `Hiển thị 10 ngày (dòng) ghi nhận số liệu gần nhất của cửa hàng.`;
    }
    if (filterMode === '30_days') {
      return `Hiển thị tối đa 30 ngày ghi nhận số liệu gần nhất của cửa hàng.`;
    }
    if (activeMonth) {
      const [year, month] = activeMonth.split('-');
      return `Hiển thị toàn bộ các ngày ghi nhận số liệu trong Tháng ${month}/${year}.`;
    }
    return `Danh sách các ngày đã nhập số liệu doanh thu và chi phí.`;
  }, [filterMode, activeMonth]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const storeRecords = records.filter((r) => r.storeId === store.id);
    const count = storeRecords.length;

    const totalRevenue = storeRecords.reduce((sum, r) => sum + r.revenue, 0);
    const totalExpense = storeRecords.reduce((sum, r) => sum + r.expense, 0);
    const totalProfit = storeRecords.reduce((sum, r) => sum + r.profit, 0);

    const avgRevenue = count > 0 ? totalRevenue / count : 0;
    const avgProfit = count > 0 ? totalProfit / count : 0;

    const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

    // Find the best day
    let bestDay: SalesRecord | null = null;
    if (storeRecords.length > 0) {
      bestDay = storeRecords.reduce((max, r) => (r.revenue > max.revenue ? r : max), storeRecords[0]);
    }

    return {
      count,
      totalRevenue,
      totalExpense,
      totalProfit,
      avgRevenue,
      avgProfit,
      profitMargin,
      bestDay,
    };
  }, [records, store.id]);

  const handleSort = (field: 'date' | 'revenue' | 'profit') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Automated smart business commentary based on metrics
  const commentary = useMemo(() => {
    const marginDiff = stats.profitMargin - industryInfo.benchmarkMargin;
    const marginPercent = (stats.profitMargin * 100).toFixed(1);
    const benchmarkPercent = (industryInfo.benchmarkMargin * 100).toFixed(0);

    if (stats.count === 0) {
      return {
        type: 'info',
        title: 'Chưa có số liệu phân tích',
        text: 'Vui lòng nhấn nút "Nhập số liệu" để ghi nhận doanh thu và chi phí đầu tiên cho cửa hàng của bạn.',
        badge: 'Đang đợi dữ liệu',
      };
    }

    if (marginDiff >= 0.05) {
      return {
        type: 'success',
        title: 'Hiệu quả kinh doanh xuất sắc!',
        text: `Tỷ suất lợi nhuận thực tế (${marginPercent}%) đang vượt trội so với định mức trung bình của ngành ${industryInfo.name} (${benchmarkPercent}%). Quán đang kiểm soát rất tốt chi phí đầu vào và tối ưu hóa giá bán dịch vụ. Hãy tiếp tục duy trì đà tăng trưởng này!`,
        badge: 'Hiệu quả Cao',
      };
    } else if (marginDiff >= -0.02 && marginDiff < 0.05) {
      return {
        type: 'normal',
        title: 'Kinh doanh ổn định',
        text: `Tỷ suất lợi nhuận đạt ${marginPercent}%, bám sát tỷ lệ trung bình của ngành (${benchmarkPercent}%). Cửa hàng đang vận hành ổn định. Có thể gia tăng doanh số bằng cách mở rộng tệp khách hàng hoặc áp dụng thêm các chương trình khuyến mãi giờ vàng.`,
        badge: 'Ổn định',
      };
    } else {
      // low margin advice based on industry
      let advice = '';
      if (store.industry === 'bia_nuoc_giai_khat') {
        advice = 'Đối với ngành Bia & Nước ngọt, do biên lợi nhuận mỏng, bạn nên thương lượng thêm chiết khấu số lượng lớn trực tiếp từ nhà phân phối của hãng, hoặc tối ưu hóa khâu vận chuyển, bốc xếp hàng để cắt giảm chi phí phát sinh.';
      } else if (store.industry === 'hang_nong_san') {
        advice = 'Đối với ngành Hàng nông sản, bạn nên tối ưu hóa chi phí hao hụt do bảo quản nông sản tươi/khô, thu mua trực tiếp tận vườn liên kết dài hạn và đa dạng hóa sang các sản phẩm nông sản chế biến sâu để tối ưu hóa biên lợi nhuận.';
      } else if (store.industry === 'ca_phe') {
        advice = 'Đối với ngành Cà phê, tỷ suất lợi nhuận định mức rất cao (~35%). Tỷ suất của bạn đang thấp, hãy kiểm tra kỹ mức hao hụt nguyên liệu, rà soát lại chi phí nhân công cố định hoặc điều chỉnh nhẹ bảng giá.';
      } else if (store.industry === 'nha_hang') {
        advice = 'Đối với ngành Nhà hàng, hãy tập trung quản lý định mức định lượng nguyên vật liệu món ăn (Food Cost), tối ưu hóa ca kíp giờ cao điểm của bếp/nhân viên phục vụ và giảm thiểu hao hụt thực phẩm tươi sống.';
      } else if (store.industry === 'cay_canh') {
        advice = 'Đối với ngành Cây cảnh, giá trị nghệ thuật và dịch vụ chăm sóc là cốt lõi. Bạn nên tối ưu chi phí phân bón, đất trồng và nguồn giống nhập sỉ, đồng thời đẩy mạnh mảng cho thuê cây cảnh văn phòng hoặc thiết kế tiểu cảnh trọn gói để tối đa hóa biên lợi nhuận.';
      } else if (store.industry === 'giuong_tu_ban_ghe') {
        advice = 'Đối với ngành Sản xuất Giường, Tủ, Bàn, Ghế, bạn nên tập trung tối ưu hóa hao hụt nguyên vật liệu gỗ/da/sắt khi cắt xẻ, gia công cơ khí, nhập gỗ/phụ kiện kim khí số lượng lớn để nhận chiết khấu cao, và phát triển các mẫu thiết kế lắp ghép đa năng nhằm giảm chi phí vận chuyển.';
      } else if (store.industry === 'do_dung_em_be') {
        advice = 'Đối với ngành Đồ dùng & Sinh hoạt em bé, bạn nên đàm phán trực tiếp với các nhà phân phối tã, sữa, đồ dùng sơ sinh để nhận chính sách chiết khấu tốt hơn, hạn chế tồn kho sản phẩm sát hạn sử dụng và mở rộng bán hàng combo.';
      } else if (store.industry === 'vat_lieu_xay_dung') {
        advice = 'Đối với ngành Mua bán Vật liệu xây dựng, bạn nên tối ưu hóa quy trình giao vận bốc xếp, kiểm soát chặt chẽ công nợ gối đầu của các nhà thầu xây dựng và liên kết trực tiếp với nhà máy sản xuất (xi măng, sắt thép) để nhận chiết khấu khối lượng tối ưu.';
      } else {
        advice = 'Hãy kiểm tra lại cơ cấu chi phí vận hành (điện nước, nhân sự mặt bằng) hoặc tìm kiếm các nguồn cung cấp giá sỉ tốt hơn để cải thiện biên lợi nhuận.';
      }

      return {
        type: 'warning',
        title: 'Cần tối ưu chi phí vận hành',
        text: `Biên lợi nhuận hiện tại (${marginPercent}%) đang thấp hơn so với định mức trung bình của ngành ${industryInfo.name} (${benchmarkPercent}%). ${advice}`,
        badge: 'Cần cải thiện',
      };
    }
  }, [stats.profitMargin, stats.count, store.industry, industryInfo]);

  // Export report as CSV function
  const exportToCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = ['Ngày', 'Doanh thu (VND)', 'Chi phí (VND)', 'Lợi nhuận (VND)', 'Tỷ suất LN (%)', 'Ghi chú'];
    const rows = filteredRecords.map((r) => {
      const dateParts = r.date.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      const recMargin = r.revenue > 0 ? (r.profit / r.revenue) * 100 : 0;
      const safeNote = r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '""';
      return [
        `"${formattedDate}"`,
        r.revenue,
        r.expense,
        r.profit,
        `"${recMargin.toFixed(1)}%"`,
        safeNote,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bao-cao-doanh-thu-${store.name.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header of Report */}
      <div className="bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-800 text-sky-400 border border-zinc-700/50">
                {industryInfo.name}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                commentary.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                commentary.type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              }`}>
                {commentary.badge}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-50">{store.name}</h2>
            <p className="text-xs text-zinc-400 max-w-2xl">{store.address}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full lg:w-auto">
            <button
              onClick={() => setShowPdfModal(true)}
              disabled={stats.count === 0}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-bold tracking-wide transition-all border border-zinc-750 text-zinc-200 cursor-pointer min-h-[40px]"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Báo cáo PDF</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={stats.count === 0}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-xs font-bold tracking-wide transition-all border border-zinc-750 text-zinc-200 cursor-pointer min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Xuất Excel</span>
            </button>
            {onOpenBackupRestore && (
              <button
                onClick={onOpenBackupRestore}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 bg-zinc-800 hover:bg-zinc-750 text-sky-400 hover:text-sky-300 border border-zinc-750 hover:border-sky-500/40 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer min-h-[40px]"
                title="Sao lưu hoặc khôi phục dữ liệu cửa hàng từ tệp máy tính"
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span>Sao lưu / Nạp lại</span>
              </button>
            )}
            <button
              onClick={onAddContract}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer min-h-[40px]"
              title="Tạo hợp đồng mua bán nhập hàng với chiết khấu 15%"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>+ Hợp đồng</span>
            </button>
            {stats.count > 0 && onDeleteAllRecords && (
              <button
                onClick={onDeleteAllRecords}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/30 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer min-h-[40px]"
                title="Xóa toàn bộ số liệu đã nhập của cửa hàng này"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Xóa dữ liệu</span>
              </button>
            )}
            <button
              onClick={onAddRecord}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-xs font-black tracking-wider text-zinc-950 transition-all shadow-md cursor-pointer uppercase min-h-[40px]"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span>+ Nhập Số Liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-sm relative">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Tổng Doanh thu
          </div>
          <div className="text-sm sm:text-lg lg:text-xl font-extrabold text-zinc-100 font-mono mt-1 break-words">
            {formatVND(stats.totalRevenue)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 shrink-0 text-sky-500" />
            <span>{stats.count} ngày nhập</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-sm relative">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Tổng Chi phí
          </div>
          <div className="text-sm sm:text-lg lg:text-xl font-extrabold text-zinc-100 font-mono mt-1 break-words">
            {formatVND(stats.totalExpense)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Chiếm {stats.totalRevenue > 0 ? ((stats.totalExpense / stats.totalRevenue) * 100).toFixed(0) : 0}% doanh thu
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-sm relative">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Lợi nhuận gộp
          </div>
          <div className={`text-sm sm:text-lg lg:text-xl font-extrabold font-mono mt-1 break-words ${
            stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {formatVND(stats.totalProfit)}
          </div>
          <div className="text-[10px] mt-1 flex items-center gap-1">
            {stats.totalProfit >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3 shrink-0" /> Dương
              </span>
            ) : (
              <span className="text-red-400 flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3 shrink-0" /> Âm
              </span>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-sm relative">
          <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Tỷ suất LN
          </div>
          <div className="text-sm sm:text-lg lg:text-xl font-extrabold text-zinc-100 font-mono mt-1">
            {(stats.profitMargin * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">
            Định mức: <strong className="text-zinc-400">{industryInfo.benchmarkMargin * 100}%</strong>
          </div>
        </div>
      </div>

      {/* Smart Commentary Box */}
      <div className={`rounded-2xl border p-4 sm:p-5 ${
        commentary.type === 'success' ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-300' :
        commentary.type === 'warning' ? 'bg-amber-950/10 border-amber-900/30 text-amber-300' :
        'bg-zinc-950 border border-zinc-800 text-zinc-300'
      }`}>
        <div className="flex gap-3 sm:gap-3.5 items-start">
          <div className={`p-2 rounded-xl shrink-0 ${
            commentary.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
            commentary.type === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
          }`}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold tracking-tight text-zinc-100 flex items-center gap-1.5">
              Phân tích thông minh
            </h4>
            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed mt-1">
              {commentary.text}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher for Sales Log vs Purchase Contracts vs Capital Plan */}
      <div className="flex overflow-x-auto no-scrollbar border border-zinc-800 bg-zinc-950/60 p-1 rounded-2xl gap-1.5 max-w-full">
        <button
          onClick={() => setActiveReportTab('sales')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center ${
            activeReportTab === 'sales'
              ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          Nhật ký ({filteredRecords.length})
        </button>
        <button
          onClick={() => setActiveReportTab('contracts')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center ${
            activeReportTab === 'contracts'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          Hợp đồng ({contracts.filter(c => c.storeId === store.id).length})
        </button>
        <button
          onClick={() => setActiveReportTab('capital_plan')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap min-h-[38px] flex items-center justify-center ${
            activeReportTab === 'capital_plan'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          Phương án vốn
        </button>
      </div>

      {activeReportTab === 'sales' && (
        <div className="space-y-6">
          {/* Section: Capital Plan & Purchase Contracts Prominent Bento Cards on Front Page */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Card 1: Phương Án Vay Vốn & Hạn Mức Tín Dụng */}
            <div className="bg-zinc-900 border border-emerald-500/25 hover:border-emerald-500/45 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-2 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      Phương Án Vốn Vay VCB
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {store.projectionParams ? 'Đã lưu PA' : 'Định mức ngành'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Nhu cầu vốn lưu động & Hạn mức vay ngân hàng
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Figures Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                    Nhu cầu vốn LĐ
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-zinc-100 font-mono block mt-0.5">
                    {formatVND(projectionMetrics.projWCR)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
                    Tự có: <strong className="text-zinc-300 font-mono">{formatVND(currentParams.projOwnCapital)}</strong>
                  </span>
                </div>

                <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                    Hạn mức vay đề nghị
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono block mt-0.5">
                    {formatVND(currentParams.projVcbLoan)}
                  </span>
                  <span className="text-[10px] text-amber-400 block mt-0.5 truncate">
                    Vay BQ ({projectionMetrics.remainingDays}d): <strong className="font-mono">{formatVND(projectionMetrics.projVcbLoanAvg)}</strong>
                  </span>
                </div>
              </div>

              {/* Annual Revenue & Turnover info */}
              <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/60 flex items-center justify-between text-[11px]">
                <div className="text-zinc-400 truncate pr-2">
                  <span>DT dự phóng (WCR × {currentParams.projTurnover}): </span>
                  <strong className="text-zinc-200 font-mono font-bold">{formatVND(projectionMetrics.projRevenue)}</strong>
                </div>
                <div className="text-zinc-400 text-right shrink-0">
                  <span>BQ/tháng: </span>
                  <strong className="text-sky-400 font-mono font-bold">{formatVND(Math.round(projectionMetrics.projRevenue / 12))}</strong>
                </div>
              </div>

              {/* Action Triggers */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveReportTab('capital_plan')}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bảng tính chi tiết</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(true)}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Sinh 12T Doanh thu</span>
                </button>
              </div>
            </div>

            {/* Card 2: Hợp Đồng Mua Bán & Đối Tác Thương Mại */}
            <div className="bg-zinc-900 border border-amber-500/25 hover:border-amber-500/45 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-2 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      Hợp Đồng Mua Bán & Đối Tác
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {storeContracts.length} Hợp đồng
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Chứng từ mua sỉ chiết khấu 15% & đầu ra
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Figures Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                    Tổng giá trị HĐ
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono block mt-0.5">
                    {formatVND(totalContractAmount)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5 truncate">
                    {inputContractsCount} Đầu vào • {outputContractsCount} Đầu ra
                  </span>
                </div>

                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                    Hợp đồng gần nhất
                  </span>
                  {latestContract ? (
                    <div>
                      <span className="text-xs font-bold text-zinc-200 font-mono block truncate mt-0.5">
                        {latestContract.contractNumber}
                      </span>
                      <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                        {latestContract.sellerName}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-500 italic mt-1">
                      Chưa lập hợp đồng
                    </div>
                  )}
                </div>
              </div>

              {/* Recent contract preview strip or note */}
              {latestContract ? (
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/60 flex items-center justify-between text-[11px]">
                  <div className="truncate pr-2">
                    <span className="text-zinc-300 font-medium">{latestContract.itemName}</span>
                    <span className="text-amber-400/90 text-[10px] ml-1.5 font-mono">({formatVND(latestContract.totalAmount)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewContract(latestContract)}
                    className="text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem HĐ</span>
                  </button>
                </div>
              ) : (
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/60 text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Tạo hợp đồng để hợp thức hóa phương án vay vốn.</span>
                </div>
              )}

              {/* Action Triggers */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onAddContract}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                  <span>+ Tạo Hợp Đồng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReportTab('contracts')}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Xem tất cả ({storeContracts.length})</span>
                </button>
              </div>
            </div>

          </div>

          {/* Sales Log Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Table Filters Header */}
          <div className="p-5 border-b border-zinc-850 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-50 tracking-tight">
                Nhật ký Doanh số Chi tiết
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{tableSubtitle}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
              {/* Segment control for 10 days vs 30 days vs Monthly */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0 gap-0.5 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setFilterMode('10_days')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === '10_days'
                      ? 'bg-sky-500 text-zinc-950 shadow-sm shadow-sky-500/10 font-extrabold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Hiển thị 10 ngày ghi nhận gần nhất"
                >
                  10 ngày gần nhất
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('30_days')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === '30_days'
                      ? 'bg-sky-500 text-zinc-950 shadow-sm shadow-sky-500/10 font-extrabold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Hiển thị 30 ngày ghi nhận gần nhất"
                >
                  30 ngày gần nhất
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterMode === 'month'
                      ? 'bg-sky-500 text-zinc-950 shadow-sm shadow-sky-500/10'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Xem theo tháng
                </button>
              </div>

              {/* If monthly, show the month picker dropdown */}
              {filterMode === 'month' && (
                <div className="relative shrink-0">
                  <select
                    value={activeMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                    }}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 py-2 pl-3 pr-8 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition-all font-bold cursor-pointer appearance-none min-w-[130px] h-9"
                  >
                    {availableMonths.length > 0 ? (
                      availableMonths.map((m) => {
                        const [year, month] = m.split('-');
                        return (
                          <option key={m} value={m}>
                            Tháng {month}/{year}
                          </option>
                        );
                      })
                    ) : (
                      <option value="">Không có dữ liệu</option>
                    )}
                  </select>
                  <span className="absolute right-3 top-3 text-zinc-500 pointer-events-none text-[8px]">▼</span>
                </div>
              )}

              {/* Search Input */}
              <div className="relative flex-1 sm:min-w-[180px]">
                <span className="absolute left-3 top-2.5 text-zinc-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm ngày hoặc ghi chú..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Mobile Card List + Desktop Table */}
          <div className="relative">
            {filteredRecords.length === 0 ? (
              <div className="p-10 text-center text-zinc-400 space-y-4">
                {records.filter(r => r.storeId === store.id).length === 0 ? (
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100">
                      Cửa hàng mới chưa có dữ liệu doanh thu
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Bạn có thể lập tức chuyển sang tab <strong className="text-emerald-400">Phương án vốn</strong> để nhập các chỉ tiêu vay vốn ngắn hạn và tự động sinh 12 tháng doanh thu khớp chuẩn xác 100% với phương án dự phóng đã lưu!
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveReportTab('capital_plan')}
                        className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Mở Phương án Vốn & Tạo 12T Doanh thu
                      </button>
                      <button
                        type="button"
                        onClick={onAddRecord}
                        className="w-full sm:w-auto px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-semibold border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-sky-400" />
                        Nhập thủ công
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-zinc-300">Không tìm thấy bản ghi phù hợp</p>
                    <p className="text-xs mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc chọn tháng khác.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="block md:hidden divide-y divide-zinc-800/80 p-3 space-y-3">
                  {filteredRecords.map((rec) => {
                    const dateParts = rec.date.split('-');
                    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // DD/MM/YYYY

                    return (
                      <div key={rec.id} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md font-mono">
                              {formattedDate}
                            </span>
                            <div className="text-base font-black text-zinc-50 font-mono mt-1">
                              {formatVND(rec.revenue)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setInvoiceRecord(rec)}
                              className="p-2 text-zinc-300 hover:text-emerald-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Xuất Hóa đơn"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditRecord(rec)}
                              className="p-2 text-zinc-300 hover:text-sky-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Sửa bản ghi"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteRecord(rec.id)}
                              className="p-2 text-zinc-300 hover:text-red-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Xóa bản ghi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {rec.notes && (
                          <div className="text-xs text-zinc-400 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/50">
                            {rec.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-widest border-b border-zinc-850">
                        <th
                          className="p-4 font-semibold cursor-pointer select-none hover:text-zinc-100"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            Ngày nhập
                            <ArrowUpDown className="w-3 h-3 text-sky-400" />
                          </div>
                        </th>
                        <th
                          className="p-4 font-semibold text-right cursor-pointer select-none hover:text-zinc-100"
                          onClick={() => handleSort('revenue')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Doanh thu (VND)
                            <ArrowUpDown className="w-3 h-3 text-sky-400" />
                          </div>
                        </th>
                        <th className="p-4 font-semibold text-zinc-400">Ghi chú</th>
                        <th className="p-4 font-semibold text-center text-zinc-400 w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-zinc-300">
                      {filteredRecords.map((rec) => {
                        const dateParts = rec.date.split('-');
                        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // DD/MM/YYYY

                        return (
                          <tr key={rec.id} className="hover:bg-zinc-950/30 transition-colors">
                            <td className="p-4 font-medium whitespace-nowrap text-zinc-100">
                              {formattedDate}
                            </td>
                            <td className="p-4 text-right font-bold text-zinc-100 font-mono">
                              {formatVND(rec.revenue)}
                            </td>
                            <td className="p-4 text-xs text-zinc-400 max-w-[240px] truncate" title={rec.notes}>
                              {rec.notes || <span className="text-zinc-600">—</span>}
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setInvoiceRecord(rec)}
                                  className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Xuất Hóa đơn / Biên lai chuyển khoản"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onEditRecord(rec)}
                                  className="p-1 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Sửa bản ghi"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteRecord(rec.id)}
                                  className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa bản ghi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      )}

      {activeReportTab === 'contracts' && (
        /* Purchase Contracts Table */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="p-5 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-50 tracking-tight">
                Danh sách Hợp đồng Mua bán
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Các hợp đồng mua bán sỉ (Đầu vào & Đầu ra) của {store.name}
              </p>
            </div>
            <button
              onClick={onAddContract}
              className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-450 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md uppercase tracking-wide"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tạo Hợp đồng Mới
            </button>
          </div>

          {/* Mobile Card List + Desktop Table */}
          <div className="relative">
            {contracts.filter(c => c.storeId === store.id).length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p className="text-sm font-semibold text-zinc-300">Chưa có hợp đồng mua bán nào</p>
                <p className="text-xs mt-1">Hãy nhấn nút "Tạo Hợp đồng Mới" để lập văn bản mua bán ngay.</p>
              </div>
            ) : (
              <>
                {/* Mobile View: Cards */}
                <div className="block md:hidden divide-y divide-zinc-800/80 p-3 space-y-3">
                  {contracts
                    .filter(c => c.storeId === store.id)
                    .map((con) => {
                      const dateParts = con.createdAt.split('-');
                      const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                      const isInput = con.contractType !== 'output';

                      return (
                        <div key={con.id} className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-amber-400 font-mono">
                                  {con.contractNumber}
                                </span>
                                {isInput ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                    Đầu vào
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Đầu ra
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 mt-1">
                                {formattedDate} • <strong className="text-zinc-200">{con.sellerName}</strong>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onViewContract(con)}
                                className="p-2 text-zinc-300 hover:text-sky-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Xem & In hợp đồng"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isInput && (
                                <button
                                  onClick={() => onViewUynhiemchi ? onViewUynhiemchi(con) : onViewContract(con)}
                                  className="p-2 text-zinc-300 hover:text-emerald-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                  title="Xem & In Ủy nhiệm chi Vietcombank"
                                >
                                  <Landmark className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteContract(con.id)}
                                className="p-2 text-zinc-300 hover:text-red-400 bg-zinc-850 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title="Xóa hợp đồng"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/50 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-zinc-400 font-medium">{con.itemName}</span>
                              <span className="text-zinc-500 text-[11px] block">SL: {con.quantity}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-amber-400 font-bold font-mono text-sm block">
                                {formatVND(con.totalAmount)}
                              </span>
                              <span className="text-[10px] text-emerald-400">
                                Đơn giá: {formatVND(con.contractUnitPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-widest border-b border-zinc-850">
                        <th className="p-4 font-semibold">Mã hợp đồng</th>
                        <th className="p-4 font-semibold text-center">Phân loại</th>
                        <th className="p-4 font-semibold">Ngày tạo</th>
                        <th className="p-4 font-semibold">Đối tác liên kết</th>
                        <th className="p-4 font-semibold">Mặt hàng sỉ</th>
                        <th className="p-4 font-semibold text-center">S.Lượng</th>
                        <th className="p-4 font-semibold text-right text-emerald-400">Giá sỉ (-15%)</th>
                        <th className="p-4 font-semibold text-right">Tổng thanh toán (VND)</th>
                        <th className="p-4 font-semibold text-center w-24">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 text-zinc-300">
                      {contracts
                        .filter(c => c.storeId === store.id)
                        .map((con) => {
                          const dateParts = con.createdAt.split('-');
                          const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                          const isInput = con.contractType !== 'output';

                          return (
                            <tr key={con.id} className="hover:bg-zinc-950/30 transition-colors">
                              <td className="p-4 font-bold text-zinc-100 font-mono">
                                {con.contractNumber}
                              </td>
                              <td className="p-4 text-center whitespace-nowrap">
                                {isInput ? (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                    Đầu vào (Nhập)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    Đầu ra (Bán)
                                  </span>
                                )}
                              </td>
                              <td className="p-4 whitespace-nowrap text-zinc-300">
                                {formattedDate}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-zinc-100">{con.sellerName}</div>
                                <div className="text-[10px] text-zinc-500">{isInput ? 'Bên Bán' : 'Bên Mua'} | CCCD: {con.sellerCitizenId}</div>
                              </td>
                              <td className="p-4 text-xs font-semibold text-zinc-300">
                                {con.itemName}
                              </td>
                              <td className="p-4 text-center font-bold text-zinc-100 font-mono">
                                {con.quantity}
                              </td>
                              <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                                {formatVND(con.contractUnitPrice)}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-amber-400">
                                {formatVND(con.totalAmount)}
                              </td>
                              <td className="p-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => onViewContract(con)}
                                    className="p-1 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                    title="Xem & In hợp đồng mua bán"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  {isInput && (
                                    <button
                                      onClick={() => onViewUynhiemchi ? onViewUynhiemchi(con) : onViewContract(con)}
                                      className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                      title="Xem & In Mẫu Ủy Nhiệm Chi Vietcombank"
                                    >
                                      <Landmark className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onDeleteContract(con.id)}
                                    className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                    title="Xóa hợp đồng"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeReportTab === 'capital_plan' && (
        <CapitalPlanTab 
          store={store} 
          records={records} 
          onUpdateStore={onUpdateStore} 
          onBatchCreateRecords={onBatchCreateRecords}
        />
      )}

      {invoiceRecord && (
        <InvoiceModal
          store={store}
          record={invoiceRecord}
          onClose={() => setInvoiceRecord(null)}
        />
      )}

      {showPdfModal && (
        <ReportPdfModal
          store={store}
          records={records}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {showGenerateModal && (
        <GenerateRevenueModal
          store={store}
          records={records}
          currentParams={currentParams}
          onClose={() => setShowGenerateModal(false)}
          onApplyRecords={(newRecs, isOverwrite) => {
            if (onBatchCreateRecords) {
              onBatchCreateRecords(newRecs, isOverwrite);
            }
            setShowGenerateModal(false);
          }}
        />
      )}
    </div>
  );
}
