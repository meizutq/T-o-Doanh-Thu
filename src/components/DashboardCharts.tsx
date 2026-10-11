import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { Store, SalesRecord, INDUSTRIES, IndustryType } from '../types';
import { formatVND, formatVNDCompact } from '../utils/sampleData';
import { TrendingUp, BarChart3, LineChart as LineChartIcon, Layers, Info } from 'lucide-react';

interface DashboardChartsProps {
  stores: Store[];
  records: SalesRecord[];
  activeStoreId: string;
}

export default function DashboardCharts({ stores, records, activeStoreId }: DashboardChartsProps) {
  const [chartTab, setChartTab] = useState<'trends' | 'industry' | 'stores'>('trends');

  // Filter records of the active store, sorted by date
  const activeStoreRecords = useMemo(() => {
    return records
      .filter((r) => r.storeId === activeStoreId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records, activeStoreId]);

  const activeStoreName = useMemo(() => {
    return stores.find((s) => s.id === activeStoreId)?.name || 'Cửa hàng hiện tại';
  }, [stores, activeStoreId]);

  // Aggregate data by industry
  const industryPerformanceData = useMemo(() => {
    const data: Record<IndustryType, { revenue: number; expense: number; profit: number; count: number; name: string; color: string; benchmark: number }> = {
      bia_nuoc_giai_khat: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.bia_nuoc_giai_khat.name, color: INDUSTRIES.bia_nuoc_giai_khat.color, benchmark: INDUSTRIES.bia_nuoc_giai_khat.benchmarkMargin },
      hang_nong_san: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.hang_nong_san.name, color: INDUSTRIES.hang_nong_san.color, benchmark: INDUSTRIES.hang_nong_san.benchmarkMargin },
      tap_hoa: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.tap_hoa.name, color: INDUSTRIES.tap_hoa.color, benchmark: INDUSTRIES.tap_hoa.benchmarkMargin },
      ca_phe: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.ca_phe.name, color: INDUSTRIES.ca_phe.color, benchmark: INDUSTRIES.ca_phe.benchmarkMargin },
      nha_hang: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.nha_hang.name, color: INDUSTRIES.nha_hang.color, benchmark: INDUSTRIES.nha_hang.benchmarkMargin },
      cay_canh: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.cay_canh.name, color: INDUSTRIES.cay_canh.color, benchmark: INDUSTRIES.cay_canh.benchmarkMargin },
      giuong_tu_ban_ghe: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.giuong_tu_ban_ghe.name, color: INDUSTRIES.giuong_tu_ban_ghe.color, benchmark: INDUSTRIES.giuong_tu_ban_ghe.benchmarkMargin },
      do_dung_em_be: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.do_dung_em_be.name, color: INDUSTRIES.do_dung_em_be.color, benchmark: INDUSTRIES.do_dung_em_be.benchmarkMargin },
      vat_lieu_xay_dung: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.vat_lieu_xay_dung.name, color: INDUSTRIES.vat_lieu_xay_dung.color, benchmark: INDUSTRIES.vat_lieu_xay_dung.benchmarkMargin },
      khac: { revenue: 0, expense: 0, profit: 0, count: 0, name: INDUSTRIES.khac.name, color: INDUSTRIES.khac.color, benchmark: INDUSTRIES.khac.benchmarkMargin },
    };

    // Calculate aggregated revenue and profit per industry across all stores and records
    records.forEach((rec) => {
      const store = stores.find((s) => s.id === rec.storeId);
      if (store && data[store.industry]) {
        const ind = data[store.industry];
        ind.revenue += rec.revenue;
        ind.expense += rec.expense;
        ind.profit += rec.profit;
        ind.count += 1;
      }
    });

    return Object.values(data).map((ind) => {
      const actualMargin = ind.revenue > 0 ? (ind.profit / ind.revenue) * 100 : 0;
      return {
        name: ind.name,
        'Doanh thu': ind.revenue,
        'Lợi nhuận': ind.profit,
        'Tỷ suất LN Thực tế (%)': parseFloat(actualMargin.toFixed(1)),
        'Tỷ suất LN Định mức (%)': ind.benchmark * 100,
        color: ind.color,
      };
    });
  }, [records, stores]);

  // Compare stores side-by-side
  const storesComparisonData = useMemo(() => {
    return stores.map((store) => {
      const storeRecs = records.filter((r) => r.storeId === store.id);
      const revenue = storeRecs.reduce((sum, r) => sum + r.revenue, 0);
      const profit = storeRecs.reduce((sum, r) => sum + r.profit, 0);
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        name: store.name,
        industry: INDUSTRIES[store.industry]?.name || 'Khác',
        'Doanh thu': revenue,
        'Lợi nhuận': profit,
        'Tỷ suất LN (%)': parseFloat(margin.toFixed(1)),
      };
    });
  }, [stores, records]);

  // Date formatted for trends chart tooltips
  const formattedTrendData = useMemo(() => {
    return activeStoreRecords.map((rec) => {
      const dateParts = rec.date.split('-');
      const formattedDate = `${dateParts[2]}/${dateParts[1]}`; // DD/MM format
      return {
        date: formattedDate,
        fullDate: rec.date,
        'Doanh thu': rec.revenue,
        'Lợi nhuận': rec.profit,
        'Chi phí': rec.expense,
        margin: rec.revenue > 0 ? ((rec.profit / rec.revenue) * 100).toFixed(1) : 0,
      };
    });
  }, [activeStoreRecords]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-50 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            Phân Tích Biểu Đồ Trực Quan
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">
            Biểu diễn số liệu doanh thu, lợi nhuận và so sánh hiệu quả kinh doanh.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex overflow-x-auto no-scrollbar bg-zinc-950 p-1 rounded-xl self-stretch sm:self-start lg:self-auto border border-zinc-800 gap-1">
          <button
            onClick={() => setChartTab('trends')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              chartTab === 'trends'
                ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Xu hướng</span>
          </button>
          <button
            onClick={() => setChartTab('industry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              chartTab === 'industry'
                ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ngành nghề</span>
          </button>
          <button
            onClick={() => setChartTab('stores')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
              chartTab === 'stores'
                ? 'bg-zinc-800 text-sky-400 shadow-sm border border-zinc-700/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>So sánh</span>
          </button>
        </div>
      </div>

      {/* CHART RENDERING SPACE */}
      <div className={`w-full ${chartTab === 'industry' ? 'h-auto md:h-[340px]' : 'h-[300px] sm:h-[340px]'} min-h-[280px]`}>
        {chartTab === 'trends' && (
          formattedTrendData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 p-6">
              <Info className="w-8 h-8 mb-2 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">Chưa có dữ liệu giao dịch cho cửa hàng này</p>
              <p className="text-xs text-center text-zinc-500 mt-1">Vui lòng chọn hoặc thêm cửa hàng và nhập số liệu doanh thu ngày tháng.</p>
            </div>
          ) : (
            <div className="w-full h-full">
              <div className="text-[10px] sm:text-xs font-semibold text-zinc-400 mb-2 flex items-center justify-between">
                <span>Cửa hàng: <span className="text-sky-400 font-bold">{activeStoreName}</span></span>
                <span className="text-zinc-500 hidden sm:inline">Trục X: Ngày nhập | Trục Y: Số tiền (VND)</span>
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={formattedTrendData} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatVNDCompact(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderRadius: '12px',
                      border: '1px solid #27272a',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#fafafa' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    formatter={(value: any) => [formatVND(value as number), '']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ color: '#fafafa' }} />
                  <Area
                    type="monotone"
                    dataKey="Doanh thu"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Lợi nhuận"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )
        )}

        {chartTab === 'industry' && (
          <div className="w-full h-full flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-3/5 h-[260px] md:h-full">
              <div className="text-xs font-semibold text-zinc-400 mb-2">
                So sánh Doanh thu & Lợi nhuận tích lũy theo Từng Ngành nghề (VND)
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={industryPerformanceData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatVNDCompact(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderRadius: '12px',
                      border: '1px solid #27272a',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#fafafa' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    formatter={(value: any) => [formatVND(value as number), '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Doanh thu" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full md:w-2/5 h-full flex flex-col justify-center border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Tỷ suất lợi nhuận ngành nghề (%)
                </h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  So sánh tỷ suất lợi nhuận thực tế đạt được với định mức trung bình của ngành hàng.
                </p>
              </div>

              <div className="space-y-3 overflow-y-auto pr-1">
                {industryPerformanceData.map((ind, index) => {
                  const actual = ind['Tỷ suất LN Thực tế (%)'];
                  const target = ind['Tỷ suất LN Định mức (%)'];

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.color }} />
                          {ind.name}
                        </span>
                        <span className="text-zinc-400">
                          Thực tế: <strong className="text-zinc-100">{actual}%</strong> (Định mức: {target}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${actual > 0 ? Math.min(actual * 2.5, 100) : 0}%`,
                            backgroundColor: actual >= target ? '#10b981' : '#f59e0b',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {chartTab === 'stores' && (
          storesComparisonData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 p-6">
              <Info className="w-8 h-8 mb-2 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">Chưa có cửa hàng nào được tạo</p>
            </div>
          ) : (
            <div className="w-full h-full">
              <div className="text-xs font-semibold text-zinc-400 mb-2">
                So sánh Doanh thu & Lợi nhuận Tổng hợp giữa Các Cửa hàng khác nhau (VND)
              </div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={storesComparisonData} margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatVNDCompact(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderRadius: '12px',
                      border: '1px solid #27272a',
                      color: '#fafafa',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#fafafa' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    formatter={(value: any) => [formatVND(value as number), '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Doanh thu" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        )}
      </div>
    </div>
  );
}
