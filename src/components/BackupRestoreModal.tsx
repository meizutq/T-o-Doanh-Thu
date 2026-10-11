import React, { useState, useRef } from 'react';
import { Store, SalesRecord, PurchaseContract, ProjectionParams, INDUSTRIES } from '../types';
import { formatVND } from '../utils/sampleData';
import { computeProjectionMetrics, getDefaultIndustryParameters } from '../utils/revenueGenerator';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Layers,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  HardDrive,
  FileJson,
  Landmark,
  ShieldCheck,
  CreditCard,
  UserCheck
} from 'lucide-react';

export interface BackupPayload {
  appName: string;
  version: string;
  backupType: 'single_store' | 'all_stores';
  exportedAt: string;
  store?: Store;
  stores?: Store[];
  projectionParams?: ProjectionParams;
  storesProjectionParams?: Record<string, ProjectionParams>;
  records: SalesRecord[];
  contracts?: PurchaseContract[];
  activeStoreId?: string;
  metadata?: {
    totalRevenue: number;
    totalRecords: number;
    totalContracts: number;
    hasCapitalPlan?: boolean;
    capitalPlanWCR?: number;
    capitalPlanVcbLoan?: number;
    capitalPlanProjRevenue?: number;
    capitalPlanTurnover?: number;
    storesWithCapitalPlan?: number;
  };
}

// Helper to retrieve store with guaranteed up-to-date capital plan
export const getCompleteStore = (s: Store): Store => {
  let params: ProjectionParams | undefined = s.projectionParams;
  try {
    const local = localStorage.getItem(`projection_params_${s.id}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object') {
        params = { ...params, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc tham số phương án vốn từ localStorage:', e);
  }

  if (!params && s.industry) {
    params = getDefaultIndustryParameters(s.industry);
  }

  return {
    ...s,
    ...(params ? { projectionParams: params } : {})
  };
};

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  records: SalesRecord[];
  contracts: PurchaseContract[];
  activeStore: Store | undefined;
  onRestore: (
    newStores: Store[],
    newRecords: SalesRecord[],
    newContracts: PurchaseContract[],
    newActiveStoreId: string,
    message: string
  ) => void;
}

export default function BackupRestoreModal({
  isOpen,
  onClose,
  stores,
  records,
  contracts,
  activeStore,
  onRestore,
}: BackupRestoreModalProps) {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');

  // Restore states
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    payload: BackupPayload;
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Active store records and contracts for single-store backup
  const activeStoreRecords = activeStore
    ? records.filter((r) => r.storeId === activeStore.id)
    : [];
  const activeStoreContracts = activeStore
    ? contracts.filter((c) => c.storeId === activeStore.id)
    : [];
  const activeStoreTotalRevenue = activeStoreRecords.reduce((sum, r) => sum + r.revenue, 0);

  // Complete active store with full capital plan parameters
  const completeActiveStore = activeStore ? getCompleteStore(activeStore) : undefined;
  const activeStoreCapitalPlan = completeActiveStore?.projectionParams;
  const activeStoreMetrics = completeActiveStore && activeStoreCapitalPlan
    ? computeProjectionMetrics(completeActiveStore, activeStoreCapitalPlan, activeStoreRecords)
    : null;

  // All stores totals
  const allStoresTotalRevenue = records.reduce((sum, r) => sum + r.revenue, 0);

  // Sanitize name for file downloads
  const cleanFileName = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // 1. Export Single Store Backup
  const handleBackupSingleStore = () => {
    if (!activeStore) return;

    const fullStore = getCompleteStore(activeStore);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `backup-shop-${cleanFileName(activeStore.name)}-${dateStr}.json`;

    const metrics = fullStore.projectionParams
      ? computeProjectionMetrics(fullStore, fullStore.projectionParams, activeStoreRecords)
      : null;

    const payload: BackupPayload = {
      appName: 'Pro-Finance',
      version: '2.1',
      backupType: 'single_store',
      exportedAt: new Date().toISOString(),
      store: fullStore,
      projectionParams: fullStore.projectionParams, // Explicit backward/forward compatible field
      records: activeStoreRecords,
      contracts: activeStoreContracts,
      metadata: {
        totalRevenue: activeStoreTotalRevenue,
        totalRecords: activeStoreRecords.length,
        totalContracts: activeStoreContracts.length,
        hasCapitalPlan: !!fullStore.projectionParams,
        capitalPlanWCR: metrics?.projWCR,
        capitalPlanVcbLoan: fullStore.projectionParams?.projVcbLoan,
        capitalPlanProjRevenue: metrics?.projRevenue,
        capitalPlanTurnover: fullStore.projectionParams?.projTurnover,
      },
    };

    triggerDownload(fileName, payload);
  };

  // 2. Export All Stores Backup
  const handleBackupAllStores = () => {
    const fullStores = stores.map(getCompleteStore);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `backup-toan-bo-he-thong-${stores.length}-shop-${dateStr}.json`;

    const storesProjectionParams: Record<string, ProjectionParams> = {};
    fullStores.forEach((s) => {
      if (s.projectionParams) {
        storesProjectionParams[s.id] = s.projectionParams;
      }
    });

    const payload: BackupPayload = {
      appName: 'Pro-Finance',
      version: '2.1',
      backupType: 'all_stores',
      exportedAt: new Date().toISOString(),
      stores: fullStores,
      storesProjectionParams,
      records,
      contracts,
      activeStoreId: activeStore?.id || (stores[0]?.id ?? ''),
      metadata: {
        totalRevenue: allStoresTotalRevenue,
        totalRecords: records.length,
        totalContracts: contracts.length,
        hasCapitalPlan: fullStores.some((s) => !!s.projectionParams),
        storesWithCapitalPlan: fullStores.filter((s) => !!s.projectionParams).length,
      },
    };

    triggerDownload(fileName, payload);
  };

  const triggerDownload = (fileName: string, payload: BackupPayload) => {
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 3. Handle File Upload & Validation
  const processUploadedFile = (file: File) => {
    setParseError(null);
    setRestoreSuccessMessage(null);

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setParseError('Định dạng tệp không hợp lệ. Vui lòng chọn tệp có đuôi mở rộng .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation logic
        let payload: BackupPayload;

        if (parsed.backupType === 'single_store' && (parsed.store || parsed.id)) {
          // Standard single store backup
          const rawStore: Store = parsed.store || parsed;
          const capitalPlan: ProjectionParams | undefined = rawStore.projectionParams || parsed.projectionParams;
          const hydratedStore: Store = {
            ...rawStore,
            ...(capitalPlan ? { projectionParams: capitalPlan } : {}),
          };

          payload = {
            appName: parsed.appName || 'Pro-Finance',
            version: parsed.version || '2.1',
            backupType: 'single_store',
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            store: hydratedStore,
            projectionParams: capitalPlan,
            records: Array.isArray(parsed.records) ? parsed.records : [],
            contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
          };
        } else if (Array.isArray(parsed.stores)) {
          // Standard all-stores backup or legacy format
          const storesProjMap = parsed.storesProjectionParams || {};
          const hydratedStores: Store[] = parsed.stores.map((s: any) => {
            const capitalPlan = s.projectionParams || storesProjMap[s.id];
            return {
              ...s,
              ...(capitalPlan ? { projectionParams: capitalPlan } : {}),
            };
          });

          payload = {
            appName: parsed.appName || 'Pro-Finance',
            version: parsed.version || '2.1',
            backupType: 'all_stores',
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            stores: hydratedStores,
            storesProjectionParams: storesProjMap,
            records: Array.isArray(parsed.records) ? parsed.records : [],
            contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
            activeStoreId: parsed.activeStoreId,
          };
        } else if (parsed.id && parsed.name) {
          // Single store object saved directly
          const { records: recs = [], contracts: conts = [], projectionParams: plan, ...restStore } = parsed;
          const hydratedStore: Store = {
            ...(restStore as Store),
            ...(plan ? { projectionParams: plan } : {}),
          };
          payload = {
            appName: 'Pro-Finance',
            version: '2.1',
            backupType: 'single_store',
            exportedAt: new Date().toISOString(),
            store: hydratedStore,
            projectionParams: plan,
            records: Array.isArray(recs) ? recs : [],
            contracts: Array.isArray(conts) ? conts : [],
          };
        } else {
          throw new Error('Tệp JSON không chứa cấu trúc dữ liệu cửa hàng hợp lệ của ứng dụng.');
        }

        setUploadedFile({
          name: file.name,
          size: file.size,
          payload,
        });
      } catch (err: any) {
        console.error('Lỗi phân tích tệp sao lưu:', err);
        setParseError(err.message || 'Không thể đọc nội dung tệp sao lưu JSON. Vui lòng kiểm tra lại tệp.');
        setUploadedFile(null);
      }
    };
    reader.onerror = () => {
      setParseError('Lỗi trong quá trình đọc tệp tin từ máy tính.');
      setUploadedFile(null);
    };
    reader.readAsText(file);
  };

  // 4. Perform Restore Action
  const handleExecuteRestore = () => {
    if (!uploadedFile) return;

    setIsRestoring(true);
    const { payload } = uploadedFile;

    try {
      if (payload.backupType === 'single_store' && payload.store) {
        const importedStore = payload.store;
        const importedRecords = (payload.records || []).map((r) => ({
          ...r,
          storeId: importedStore.id, // ensure storeId links correctly
        }));
        const importedContracts = (payload.contracts || []).map((c) => ({
          ...c,
          storeId: importedStore.id,
        }));

        // Crucial: Persist capital plan parameters to localStorage so CapitalPlanTab immediately reflects them
        if (importedStore.projectionParams) {
          try {
            localStorage.setItem(`projection_params_${importedStore.id}`, JSON.stringify(importedStore.projectionParams));
          } catch (e) {
            console.warn('Lỗi lưu projection_params khi restore:', e);
          }
        }

        if (restoreMode === 'overwrite') {
          // Overwrite mode: replace entire state with this single store
          onRestore(
            [importedStore],
            importedRecords,
            importedContracts,
            importedStore.id,
            `Đã khôi phục hoàn tất cửa hàng "${importedStore.name}" (Kèm đầy đủ phương án vốn ngắn hạn, ${importedRecords.length} ngày doanh thu, ${importedContracts.length} hợp đồng)!`
          );
        } else {
          // Merge mode: Add or update this store, keeping all other stores intact
          const existingStoreIndex = stores.findIndex((s) => s.id === importedStore.id || s.name === importedStore.name);
          let nextStores: Store[];

          if (existingStoreIndex >= 0) {
            nextStores = stores.map((s, idx) => (idx === existingStoreIndex ? importedStore : s));
          } else {
            nextStores = [...stores, importedStore];
          }

          // Remove old records and contracts for this store, replace with imported ones
          const otherRecords = records.filter((r) => r.storeId !== importedStore.id);
          const nextRecords = [...otherRecords, ...importedRecords];

          const otherContracts = contracts.filter((c) => c.storeId !== importedStore.id);
          const nextContracts = [...otherContracts, ...importedContracts];

          onRestore(
            nextStores,
            nextRecords,
            nextContracts,
            importedStore.id,
            `Đã hòa trộn thành công cửa hàng "${importedStore.name}" (Kèm đầy đủ phương án vốn ngắn hạn, ${importedRecords.length} ngày doanh thu, ${importedContracts.length} hợp đồng)!`
          );
        }
      } else if (payload.backupType === 'all_stores' && payload.stores) {
        const importedStores = payload.stores;
        const importedRecords = payload.records || [];
        const importedContracts = payload.contracts || [];
        const targetActiveId = payload.activeStoreId || importedStores[0]?.id || '';

        // Crucial: Persist capital plan parameters for all stores to localStorage
        importedStores.forEach((s) => {
          if (s.projectionParams) {
            try {
              localStorage.setItem(`projection_params_${s.id}`, JSON.stringify(s.projectionParams));
            } catch (e) {
              console.warn('Lỗi lưu projection_params khi restore all stores:', e);
            }
          }
        });

        if (restoreMode === 'overwrite') {
          onRestore(
            importedStores,
            importedRecords,
            importedContracts,
            targetActiveId,
            `Đã khôi phục ghi đè toàn bộ hệ thống (${importedStores.length} cửa hàng kèm phương án vốn ngắn hạn, ${importedRecords.length} ngày doanh thu, ${importedContracts.length} hợp đồng)!`
          );
        } else {
          // Merge mode for all stores: merge stores by id, merge records & contracts
          const mergedStoresMap = new Map<string, Store>();
          stores.forEach((s) => mergedStoresMap.set(s.id, s));
          importedStores.forEach((s) => mergedStoresMap.set(s.id, s));
          const nextStores = Array.from(mergedStoresMap.values());

          // Merge records avoiding duplicates by ID or date+storeId
          const recordsMap = new Map<string, SalesRecord>();
          records.forEach((r) => recordsMap.set(`${r.storeId}_${r.date}`, r));
          importedRecords.forEach((r) => recordsMap.set(`${r.storeId}_${r.date}`, r));
          const nextRecords = Array.from(recordsMap.values());

          // Merge contracts avoiding duplicates by ID
          const contractsMap = new Map<string, PurchaseContract>();
          contracts.forEach((c) => contractsMap.set(c.id, c));
          importedContracts.forEach((c) => contractsMap.set(c.id, c));
          const nextContracts = Array.from(contractsMap.values());

          onRestore(
            nextStores,
            nextRecords,
            nextContracts,
            targetActiveId || stores[0]?.id || '',
            `Đã hòa trộn thành công ${importedStores.length} cửa hàng (Kèm phương án vốn ngắn hạn) từ bản sao lưu vào hệ thống hiện tại!`
          );
        }
      }

      setRestoreSuccessMessage('Khôi phục dữ liệu thành công! Dữ liệu đã được lưu trữ và đồng bộ.');
      setTimeout(() => {
        setIsRestoring(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Lỗi khi thực hiện khôi phục:', err);
      setParseError('Đã xảy ra lỗi trong quá trình ghi dữ liệu: ' + err.message);
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-50 tracking-tight flex items-center gap-2 font-sans">
                Sao Lưu & Khôi Phục Dữ Liệu
              </h2>
              <p className="text-xs text-zinc-400">
                Tải về máy tính hoặc nạp lại đầy đủ hồ sơ cửa hàng, doanh thu & hợp đồng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 sm:px-6 bg-zinc-950/70 border-b border-zinc-800 flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('backup');
              setParseError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20 font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Sao lưu về máy (Export)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('restore');
              setParseError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Khôi phục từ máy (Restore)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* TAB 1: SAO LƯU */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Tệp sao lưu chứa đầy đủ thông tin cửa hàng, tài khoản ngân hàng, thông số dự toán, toàn bộ bản ghi doanh thu từng ngày và các hợp đồng mua bán thương mại. Bạn có thể lưu giữ an toàn trên máy tính và phục hồi bất cứ lúc nào!
                </span>
              </div>

              {/* Option A: Sao lưu cửa hàng đang chọn */}
              {activeStore && (
                <div className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-sky-500/50 transition-all space-y-3.5 relative group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                        <h3 className="text-sm font-bold text-zinc-100 font-sans">
                          Sao lưu cửa hàng: <strong className="text-sky-400">{activeStore.name}</strong>
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {activeStore.address} • Ngành: {INDUSTRIES[activeStore.industry]?.name}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg text-[11px] font-bold self-start sm:self-auto">
                      Shop hiện tại
                    </span>
                  </div>

                  {/* Representative & Bank Info */}
                  {(activeStore.representativeName || activeStore.bankAccount || activeStore.citizenId) && (
                    <div className="p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-xl text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {activeStore.representativeName && (
                        <span className="flex items-center gap-1 text-zinc-300">
                          <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                          Đại diện: <strong className="text-zinc-100">{activeStore.representativeName}</strong>
                          {activeStore.citizenId && <span className="text-zinc-500 font-mono">(CCCD: {activeStore.citizenId})</span>}
                        </span>
                      )}
                      {activeStore.bankAccount && (
                        <span className="flex items-center gap-1 text-zinc-300">
                          <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                          Tài khoản: <strong className="text-zinc-100">{activeStore.bankName} - {activeStore.bankAccount}</strong>
                          {activeStore.bankOwner && <span className="text-zinc-400">({activeStore.bankOwner})</span>}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Capital Plan Summary Box */}
                  {activeStoreCapitalPlan && (
                    <div className="p-3 bg-zinc-900/90 border border-emerald-900/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <Landmark className="w-3.5 h-3.5" />
                          <span>Phương án vốn ngắn hạn đã nhập</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          Tự động sao lưu đầy đủ
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-zinc-950/80 rounded-lg">
                          <span className="text-[10px] text-zinc-500 block">Vay VCB ngắn hạn</span>
                          <strong className="text-emerald-400 font-mono text-xs font-bold block truncate">
                            {formatVND(activeStoreCapitalPlan.projVcbLoan || 0)}
                          </strong>
                        </div>
                        <div className="p-2 bg-zinc-950/80 rounded-lg">
                          <span className="text-[10px] text-zinc-500 block">Nhu cầu vốn (WCR)</span>
                          <strong className="text-zinc-200 font-mono text-xs block truncate">
                            {formatVND(activeStoreMetrics?.projWCR || 0)}
                          </strong>
                        </div>
                        <div className="p-2 bg-zinc-950/80 rounded-lg">
                          <span className="text-[10px] text-zinc-500 block">Doanh thu kế hoạch</span>
                          <strong className="text-sky-400 font-mono text-xs block truncate">
                            {formatVND(activeStoreMetrics?.projRevenue || 0)}
                          </strong>
                        </div>
                        <div className="p-2 bg-zinc-950/80 rounded-lg">
                          <span className="text-[10px] text-zinc-500 block">Vòng quay vốn</span>
                          <strong className="text-zinc-300 font-mono text-xs block">
                            {activeStoreCapitalPlan.projTurnover} vòng/năm
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revenue and Contracts Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-850 text-center text-xs">
                    <div className="p-2 bg-zinc-900/80 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Số ngày thu</span>
                      <strong className="text-zinc-100 text-sm font-mono">{activeStoreRecords.length}</strong>
                    </div>
                    <div className="p-2 bg-zinc-900/80 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Hợp đồng</span>
                      <strong className="text-zinc-100 text-sm font-mono">{activeStoreContracts.length}</strong>
                    </div>
                    <div className="p-2 bg-zinc-900/80 rounded-xl">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Tổng doanh thu</span>
                      <strong className="text-sky-400 text-xs font-mono font-bold block truncate">
                        {formatVND(activeStoreTotalRevenue)}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackupSingleStore}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải tệp sao lưu shop này (Gồm phương án vốn & dữ liệu)</span>
                  </button>
                </div>
              )}

              {/* Option B: Sao lưu toàn bộ hệ thống */}
              <div className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-purple-500/50 transition-all space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      <h3 className="text-sm font-bold text-zinc-100 font-sans">
                        Sao lưu toàn bộ hệ thống ({stores.length} cửa hàng)
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Đầy đủ mọi cửa hàng, phương án vốn ngắn hạn từng shop, toàn bộ nhật ký doanh thu và hợp đồng
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[11px] font-bold self-start sm:self-auto">
                    Toàn hệ thống
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-900/60 border border-zinc-850 rounded-xl text-[11px] text-zinc-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    Bao gồm <strong>toàn bộ {stores.length} phương án vốn ngắn hạn</strong> đã nhập trên các cửa hàng.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-855 text-center text-xs">
                  <div className="p-2 bg-zinc-900/80 rounded-xl">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Cửa hàng</span>
                    <strong className="text-zinc-100 text-sm font-mono">{stores.length}</strong>
                  </div>
                  <div className="p-2 bg-zinc-900/80 rounded-xl">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Tổng bản ghi</span>
                    <strong className="text-zinc-100 text-sm font-mono">{records.length}</strong>
                  </div>
                  <div className="p-2 bg-zinc-900/80 rounded-xl">
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Tổng hợp đồng</span>
                    <strong className="text-zinc-100 text-sm font-mono">{contracts.length}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBackupAllStores}
                  disabled={stores.length === 0}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 disabled:pointer-events-none text-zinc-100 border border-zinc-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Tải bản sao lưu toàn bộ ({stores.length} shop)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: KHÔI PHỤC */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              {/* Drop / Select File Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processUploadedFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : uploadedFile
                    ? 'border-emerald-500/50 bg-zinc-950'
                    : 'border-zinc-750 hover:border-zinc-600 bg-zinc-950/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processUploadedFile(e.target.files[0]);
                    }
                  }}
                />

                <div className={`p-3.5 rounded-2xl ${uploadedFile ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-850 text-zinc-400'}`}>
                  {uploadedFile ? <CheckCircle2 className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />}
                </div>

                <div>
                  <p className="text-sm font-bold text-zinc-100">
                    {uploadedFile ? 'Đã tải lên tệp sao lưu' : 'Kéo thả tệp JSON sao lưu hoặc bấm để chọn'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Hỗ trợ tệp sao lưu chuẩn của Pro-Finance (.json)
                  </p>
                </div>

                <span className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-lg mt-1 transition-colors">
                  {uploadedFile ? 'Chọn tệp khác' : 'Duyệt tệp trên máy...'}
                </span>
              </div>

              {/* Error Message */}
              {parseError && (
                <div className="p-3.5 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-400 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Success Message */}
              {restoreSuccessMessage && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{restoreSuccessMessage}</span>
                </div>
              )}

              {/* File Preview Card */}
              {uploadedFile && (
                <div className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4 animate-fadeIn">
                  <div className="flex items-start justify-between gap-3 border-b border-zinc-850 pb-3">
                    <div className="flex items-center gap-2.5">
                      <FileJson className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-100 font-sans truncate max-w-xs sm:max-w-md">
                          {uploadedFile.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>Xuất ngày: {new Date(uploadedFile.payload.exportedAt).toLocaleDateString('vi-VN')}</span>
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-extrabold uppercase shrink-0">
                      {uploadedFile.payload.backupType === 'single_store' ? '1 Cửa hàng' : 'Toàn hệ thống'}
                    </span>
                  </div>

                  {/* Summary Details in File */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Nội dung dữ liệu nhận diện trong tệp:
                    </span>

                    {uploadedFile.payload.backupType === 'single_store' && uploadedFile.payload.store ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-zinc-900 rounded-xl space-y-1.5 border border-zinc-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-sky-400" />
                              {uploadedFile.payload.store.name}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {INDUSTRIES[uploadedFile.payload.store.industry]?.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {uploadedFile.payload.store.address}
                          </p>

                          {/* Representative and bank if present in backup */}
                          {(uploadedFile.payload.store.representativeName || uploadedFile.payload.store.bankAccount) && (
                            <div className="pt-1 text-[10px] text-zinc-400 flex flex-wrap gap-x-2 border-t border-zinc-800/80">
                              {uploadedFile.payload.store.representativeName && (
                                <span>Đại diện: <strong className="text-zinc-200">{uploadedFile.payload.store.representativeName}</strong></span>
                              )}
                              {uploadedFile.payload.store.bankAccount && (
                                <span>TK: <strong className="text-zinc-200">{uploadedFile.payload.store.bankName} - {uploadedFile.payload.store.bankAccount}</strong></span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Capital plan detection box */}
                        {(() => {
                          const storePlan = uploadedFile.payload.store.projectionParams || uploadedFile.payload.projectionParams;
                          if (!storePlan) return null;
                          const previewMetrics = computeProjectionMetrics(
                            uploadedFile.payload.store,
                            storePlan,
                            uploadedFile.payload.records || []
                          );
                          return (
                            <div className="p-3 bg-zinc-900/90 border border-emerald-900/40 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                                  <Landmark className="w-3.5 h-3.5" />
                                  <span>Phương án vốn ngắn hạn trong tệp</span>
                                </div>
                                <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20 font-medium">
                                  Đã nhận diện ✓
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-1.5 bg-zinc-950/80 rounded-lg">
                                  <span className="text-[9px] text-zinc-500 block">Vay VCB ngắn hạn</span>
                                  <strong className="text-emerald-400 font-mono text-[11px] font-bold block truncate">
                                    {formatVND(storePlan.projVcbLoan || 0)}
                                  </strong>
                                </div>
                                <div className="p-1.5 bg-zinc-950/80 rounded-lg">
                                  <span className="text-[9px] text-zinc-500 block">Nhu cầu vốn (WCR)</span>
                                  <strong className="text-zinc-200 font-mono text-[11px] block truncate">
                                    {formatVND(previewMetrics.projWCR || 0)}
                                  </strong>
                                </div>
                                <div className="p-1.5 bg-zinc-950/80 rounded-lg">
                                  <span className="text-[9px] text-zinc-500 block">Doanh thu KH</span>
                                  <strong className="text-sky-400 font-mono text-[11px] block truncate">
                                    {formatVND(previewMetrics.projRevenue || 0)}
                                  </strong>
                                </div>
                                <div className="p-1.5 bg-zinc-950/80 rounded-lg">
                                  <span className="text-[9px] text-zinc-500 block">Vòng quay</span>
                                  <strong className="text-zinc-300 font-mono text-[11px] block">
                                    {storePlan.projTurnover} vòng/năm
                                  </strong>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-zinc-900 rounded-xl space-y-1 border border-zinc-800">
                          <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                            Gồm {uploadedFile.payload.stores?.length || 0} cửa hàng:
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {uploadedFile.payload.stores?.map((s) => (
                              <span
                                key={s.id}
                                className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-medium"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-2.5 bg-zinc-900/90 border border-emerald-900/40 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            Tệp bao gồm đầy đủ phương án vốn ngắn hạn của tất cả {uploadedFile.payload.stores?.length || 0} cửa hàng
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                      <div className="p-2 bg-zinc-900 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Số ngày thu</span>
                        <strong className="text-zinc-100 font-mono text-xs">
                          {uploadedFile.payload.records?.length || 0}
                        </strong>
                      </div>
                      <div className="p-2 bg-zinc-900 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Số hợp đồng</span>
                        <strong className="text-zinc-100 font-mono text-xs">
                          {uploadedFile.payload.contracts?.length || 0}
                        </strong>
                      </div>
                      <div className="p-2 bg-zinc-900 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Tổng doanh thu</span>
                        <strong className="text-emerald-400 font-mono text-[11px] font-bold block truncate">
                          {formatVND(
                            (uploadedFile.payload.records || []).reduce((sum, r) => sum + r.revenue, 0)
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Restore Mode Selection */}
                  <div className="space-y-2 pt-1 border-t border-zinc-850">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Phương thức nạp khôi phục:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div
                        onClick={() => setRestoreMode('merge')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          restoreMode === 'merge'
                            ? 'border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/20'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-zinc-100">Hòa trộn / Bổ sung</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed pl-5">
                          Cập nhật cửa hàng này và giữ nguyên các cửa hàng khác đang có trong danh sách của bạn (An toàn nhất).
                        </p>
                      </div>

                      <div
                        onClick={() => setRestoreMode('overwrite')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          restoreMode === 'overwrite'
                            ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500/20'
                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'overwrite'}
                            onChange={() => setRestoreMode('overwrite')}
                            className="text-red-500 focus:ring-red-500"
                          />
                          <span className="text-xs font-bold text-zinc-100">Ghi đè hoàn toàn</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed pl-5">
                          Thay thế toàn bộ dữ liệu hiện tại bằng tệp tin sao lưu này.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Action Button */}
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang khôi phục và đồng bộ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác nhận nạp và khôi phục dữ liệu</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 bg-zinc-950/90 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
          <span>Dữ liệu khôi phục sẽ tự động lưu cục bộ & đồng bộ đám mây</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold cursor-pointer transition-colors border border-zinc-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
