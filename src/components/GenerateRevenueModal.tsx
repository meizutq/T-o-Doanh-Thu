import React, { useState, useMemo } from 'react';
import { Store, SalesRecord, ProjectionParams } from '../types';
import { formatVND } from '../utils/sampleData';
import { computeProjectionMetrics, generateRecordsFromProjection, GeneratedDataSummary } from '../utils/revenueGenerator';
import { 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileSpreadsheet,
  Zap,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';

interface GenerateRevenueModalProps {
  store: Store;
  records: SalesRecord[];
  currentParams: ProjectionParams;
  onClose: () => void;
  onApplyRecords: (records: SalesRecord[], isOverwrite: boolean) => void;
}

export default function GenerateRevenueModal({
  store,
  records,
  currentParams,
  onClose,
  onApplyRecords,
}: GenerateRevenueModalProps) {
  const [includeHist, setIncludeHist] = useState(true);
  const [includeProj, setIncludeProj] = useState(true);
  const [isOverwrite, setIsOverwrite] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedDataSummary | null>(null);

  const existingStoreRecords = useMemo(() => {
    return records.filter((r) => r.storeId === store.id);
  }, [records, store.id]);

  const metrics = useMemo(() => {
    return computeProjectionMetrics(store, currentParams, records);
  }, [store, currentParams, records]);

  // Preview generated records
  const { previewRecords, previewSummary } = useMemo(() => {
    const res = generateRecordsFromProjection(store, currentParams, {
      includeHistoricalYear: includeHist,
      includeCurrentYear: includeProj,
      historicalYear: 2025,
      currentYear: 2026,
    });
    return { previewRecords: res.records, previewSummary: res.summary };
  }, [store, currentParams, includeHist, includeProj]);

  const handleConfirm = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onApplyRecords(previewRecords, isOverwrite);
      setGeneratedSummary(previewSummary);
      setIsGenerating(false);
      setGenerationDone(true);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in text-zinc-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-50 flex items-center gap-2">
                Tự động tạo 12 Tháng Doanh thu từ Phương án Dự phóng
              </h3>
              <p className="text-xs text-zinc-400">
                Cửa hàng: <span className="font-semibold text-emerald-400">{store.name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
          
          {generationDone && generatedSummary ? (
            /* Success View */
            <div className="py-6 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-black text-zinc-100">
                  Khởi tạo Dữ liệu Doanh thu Thành công!
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Hệ thống đã tạo tổng cộng <strong className="text-emerald-400 font-mono font-bold">{generatedSummary.totalRecordsCreated}</strong> bản ghi nhật ký bán hàng theo đúng thông số phương án vay vốn ngắn hạn đã lưu.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto pt-2 text-left">
                {generatedSummary.histRecordCount > 0 && (
                  <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Năm cũ ({generatedSummary.histYear})</span>
                      <span className="text-emerald-400 font-mono text-[10px] font-bold">100% Khớp</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-zinc-100">
                      {formatVND(generatedSummary.histActualRevenue)}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Chi phí: <span className="font-mono text-zinc-300">{formatVND(generatedSummary.histActualExpense)}</span>
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Lợi nhuận: <span className="font-mono font-bold">{formatVND(generatedSummary.histActualProfit)}</span>
                    </div>
                  </div>
                )}

                {generatedSummary.currentRecordCount > 0 && (
                  <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Năm hiện tại ({generatedSummary.currentYear})</span>
                      <span className="text-sky-400 font-mono text-[10px] font-bold">{generatedSummary.currentRecordCount} ngày</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-zinc-100">
                      {formatVND(generatedSummary.currentActualRevenue)}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Dự phóng năm: <span className="font-mono text-zinc-300">{formatVND(generatedSummary.currentTargetRevenue)}</span>
                    </div>
                    <div className="text-[10px] text-sky-400">
                      Lợi nhuận lũy kế: <span className="font-mono font-bold">{formatVND(generatedSummary.currentActualProfit)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  Hoàn tất & Xem Báo cáo
                </button>
              </div>
            </div>
          ) : (
            /* Setup & Configuration View */
            <>
              {/* Informational Banner */}
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/40 rounded-xl text-xs text-zinc-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-300">
                    Nguyên tắc đồng bộ số liệu chuẩn xác:
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    • <strong>Năm cũ (2025)</strong>: Tạo đủ 12 tháng (365 ngày) với tổng doanh thu và chi phí <strong>chính xác 100% bằng phương án dự phóng đã lưu</strong>.<br />
                    • <strong>Năm hiện tại (2026)</strong>: Tạo số liệu 12 tháng gần nhất phân bổ tự nhiên theo ngày trong tuần và tính mùa vụ của ngành hàng.
                  </p>
                </div>
              </div>

              {/* Targets Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Historical Year 2025 */}
                <div className={`p-4 rounded-xl border transition-all ${
                  includeHist 
                    ? 'bg-zinc-950/70 border-emerald-500/40 shadow-sm' 
                    : 'bg-zinc-950/30 border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeHist}
                        onChange={(e) => setIncludeHist(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-emerald-500 focus:ring-offset-zinc-950 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-200">
                        Niên độ Lịch sử 2025 (Năm cũ)
                      </span>
                    </label>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/50">
                      365 ngày
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Doanh thu cả năm:</span>
                      <span className="font-mono font-bold text-zinc-100 text-sm">
                        {formatVND(metrics.hist.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Chi phí ngắn hạn:</span>
                      <span className="font-mono text-zinc-300">
                        {formatVND(metrics.hist.expense)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-850">
                      <span className="text-emerald-400 font-semibold">Lợi nhuận dự kiến:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formatVND(metrics.hist.revenue - metrics.hist.expense)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Year 2026 */}
                <div className={`p-4 rounded-xl border transition-all ${
                  includeProj 
                    ? 'bg-zinc-950/70 border-sky-500/40 shadow-sm' 
                    : 'bg-zinc-950/30 border-zinc-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeProj}
                        onChange={(e) => setIncludeProj(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-500 bg-zinc-900 border-zinc-700 focus:ring-sky-500 focus:ring-offset-zinc-950 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-200">
                        Niên độ Dự phóng 2026 (Năm nay)
                      </span>
                    </label>
                    <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-900/50">
                      12 Tháng gần nhất
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Quy mô Doanh thu:</span>
                      <span className="font-mono font-bold text-rose-400 text-sm">
                        {formatVND(metrics.proj.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Chi phí ngắn hạn:</span>
                      <span className="font-mono text-rose-300">
                        {formatVND(metrics.proj.expense)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-850">
                      <span className="text-sky-400 font-semibold">Lợi nhuận dự kiến:</span>
                      <span className="font-mono font-bold text-sky-400">
                        {formatVND(metrics.proj.revenue - metrics.proj.expense)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Overwrite or Merge notice */}
              {existingStoreRecords.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-300">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Cửa hàng hiện có <strong>{existingStoreRecords.length}</strong> bản ghi doanh thu cũ.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isOverwrite}
                      onChange={(e) => setIsOverwrite(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-amber-500 bg-zinc-900 border-zinc-700"
                    />
                    <span className="text-[11px] font-semibold">Ghi đè hoàn toàn</span>
                  </label>
                </div>
              )}

              {/* Sample Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    Xem trước bản ghi mẫu sẽ tạo ({previewRecords.length} ngày):
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Dao động tự nhiên theo ngành {store.industry}
                  </span>
                </div>

                <div className="overflow-hidden border border-zinc-800 rounded-xl bg-zinc-950/60">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase">
                        <th className="p-2">Ngày</th>
                        <th className="p-2 text-right">Doanh thu</th>
                        <th className="p-2 text-right">Chi phí</th>
                        <th className="p-2 text-right">Lợi nhuận</th>
                        <th className="p-2 text-left font-sans">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850/60 text-[11px]">
                      {previewRecords.slice(0, 4).map((rec, i) => (
                        <tr key={i} className="hover:bg-zinc-900/40">
                          <td className="p-2 text-zinc-300">{rec.date}</td>
                          <td className="p-2 text-right text-emerald-400 font-bold">{formatVND(rec.revenue)}</td>
                          <td className="p-2 text-right text-zinc-400">{formatVND(rec.expense)}</td>
                          <td className="p-2 text-right text-sky-400">{formatVND(rec.profit)}</td>
                          <td className="p-2 text-zinc-500 font-sans text-[10px] truncate max-w-[140px]">{rec.notes || 'Doanh thu thường nhật'}</td>
                        </tr>
                      ))}
                      {previewRecords.length > 4 && (
                        <tr>
                          <td colSpan={5} className="p-2 text-center text-[10px] text-zinc-500 bg-zinc-950 font-sans">
                            ... và {previewRecords.length - 4} ngày tiếp theo được phân bổ hoàn hảo ...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!generationDone && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={isGenerating || (!includeHist && !includeProj) || previewRecords.length === 0}
              onClick={handleConfirm}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                isGenerating
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/10'
              }`}
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating
                ? 'Đang tạo dữ liệu...'
                : `Xác nhận tạo ${previewRecords.length} ngày doanh thu`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
