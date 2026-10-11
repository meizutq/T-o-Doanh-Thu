import { useState, useEffect, useMemo } from 'react';
import { Store, SalesRecord, INDUSTRIES, IndustryType, PurchaseContract } from './types';
import { sampleStores, sampleRecords, formatVND } from './utils/sampleData';
import StoreForm from './components/StoreForm';
import SalesRecordForm from './components/SalesRecordForm';
import StoreReport from './components/StoreReport';
import ContractModal from './components/ContractModal';
import BackupRestoreModal from './components/BackupRestoreModal';
import AuthPanel, { UserProfileWidget } from './components/AuthPanel';
import UserProfilePage from './components/UserProfilePage';
import AdminManagementPage from './components/AdminManagementPage';
import { auth, getUserDataFromFirestore, syncUserDataToFirestore } from './lib/firebase';
import { signOut } from 'firebase/auth';
import {
  Store as StoreIcon,
  Plus,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
  Building,
  Heart,
  Calendar,
  Sparkles,
  Trash2,
  Edit2,
  Shield,
  Database
} from 'lucide-react';

export default function App() {
  // --- Authentication State ---
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('store_reports_current_user');
  });

  // --- View Navigation State ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'profile' | 'admin'>('dashboard');

  // --- Persistent State ---
  const [stores, setStores] = useState<Store[]>([]);
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [contracts, setContracts] = useState<PurchaseContract[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [cloudLoading, setCloudLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // --- Modal / Editing states ---
  const [isStoreFormOpen, setIsStoreFormOpen] = useState(false);
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | undefined>(undefined);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>(undefined);
  const [activeContract, setActiveContract] = useState<PurchaseContract | null>(null);
  const [initialContractDoc, setInitialContractDoc] = useState<'contract' | 'uynhiemchi' | 'datcoc'>('contract');

  // --- Custom Confirm Modal State ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDanger: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    isDanger: false,
    onConfirm: () => {},
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      isDanger,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- Initialize state from LocalStorage or Firestore ---
  useEffect(() => {
    if (!currentUser) {
      setStores([]);
      setRecords([]);
      setContracts([]);
      setActiveStoreId('');
      return;
    }

    const loadData = async () => {
      // 1. Instantly load from local storage cache for maximum response speed
      const savedStores = localStorage.getItem(`store_reports_stores_${currentUser}`);
      const savedRecords = localStorage.getItem(`store_reports_records_${currentUser}`);
      const savedActiveId = localStorage.getItem(`store_reports_active_id_${currentUser}`);
      const savedContracts = localStorage.getItem(`store_reports_contracts_${currentUser}`);

      let localStores: Store[] = [];
      let localRecords: SalesRecord[] = [];
      let localContracts: PurchaseContract[] = [];
      let localActiveId = '';

      if (savedStores && savedRecords) {
        try {
          localStores = JSON.parse(savedStores);
          localRecords = JSON.parse(savedRecords);
          if (savedContracts) {
            localContracts = JSON.parse(savedContracts);
          }
          if (savedActiveId && localStores.some((s: Store) => s.id === savedActiveId)) {
            localActiveId = savedActiveId;
          } else if (localStores.length > 0) {
            localActiveId = localStores[0].id;
          }
        } catch (e) {
          console.error("Lỗi parse cache cục bộ:", e);
        }
      }

      setStores(localStores);
      setRecords(localRecords);
      setContracts(localContracts);
      setActiveStoreId(localActiveId);

      // 2. Fetch the freshest data from Firestore online and sync
      const firestoreUid = currentUser.startsWith('google:')
        ? localStorage.getItem(`store_reports_google_uid_${currentUser}`)
        : currentUser;

      if (firestoreUid) {
        setCloudLoading(true);
        try {
          const cloudData = await getUserDataFromFirestore(firestoreUid);
          if (cloudData) {
            const freshStores = cloudData.stores || [];
            const freshRecords = cloudData.records || [];
            const freshContracts = cloudData.contracts || [];
            let freshActiveId = cloudData.activeStoreId || '';

            if (freshActiveId && !freshStores.some(s => s.id === freshActiveId) && freshStores.length > 0) {
              freshActiveId = freshStores[0].id;
            }

            // Update state with fresh data from Cloud
            setStores(freshStores);
            setRecords(freshRecords);
            setContracts(freshContracts);
            setActiveStoreId(freshActiveId);

            // Update local cache
            localStorage.setItem(`store_reports_stores_${currentUser}`, JSON.stringify(freshStores));
            localStorage.setItem(`store_reports_records_${currentUser}`, JSON.stringify(freshRecords));
            localStorage.setItem(`store_reports_contracts_${currentUser}`, JSON.stringify(freshContracts));
            localStorage.setItem(`store_reports_active_id_${currentUser}`, freshActiveId);
          }
        } catch (error) {
          console.error("Lỗi khi đồng bộ dữ liệu từ đám mây:", error);
        } finally {
          setCloudLoading(false);
        }
      }
    };

    loadData();
  }, [currentUser]);

  // --- Save to LocalStorage and Firestore helper ---
  const saveToStorage = (updatedStores: Store[], updatedRecords: SalesRecord[], activeId: string, updatedContracts?: PurchaseContract[]) => {
    if (!currentUser) return;
    
    const currentContracts = updatedContracts !== undefined ? updatedContracts : contracts;

    // Save locally
    localStorage.setItem(`store_reports_stores_${currentUser}`, JSON.stringify(updatedStores));
    localStorage.setItem(`store_reports_records_${currentUser}`, JSON.stringify(updatedRecords));
    localStorage.setItem(`store_reports_contracts_${currentUser}`, JSON.stringify(currentContracts));
    localStorage.setItem(`store_reports_active_id_${currentUser}`, activeId);

    // Save to Firestore if authenticated online
    const firestoreUid = currentUser.startsWith('google:')
      ? localStorage.getItem(`store_reports_google_uid_${currentUser}`)
      : currentUser;

    if (firestoreUid) {
      setSyncing(true);
      syncUserDataToFirestore(firestoreUid, {
        stores: updatedStores,
        records: updatedRecords,
        activeStoreId: activeId,
        contracts: currentContracts
      })
      .then(() => setSyncing(false))
      .catch(err => {
        console.error("Lỗi đồng bộ Firestore:", err);
        setSyncing(false);
      });
    }
  };

  // --- Handlers for Store CRUD ---
  const handleStoreSubmit = (storeData: Omit<Store, 'id' | 'createdAt'> & { id?: string }) => {
    let updatedStores: Store[];
    let activeId = activeStoreId;

    if (storeData.id) {
      // Edit mode
      updatedStores = stores.map((s) =>
        s.id === storeData.id
          ? {
              ...s,
              name: storeData.name,
              industry: storeData.industry,
              address: storeData.address,
              representativeName: storeData.representativeName,
              bankName: storeData.bankName,
              bankAccount: storeData.bankAccount,
              bankOwner: storeData.bankOwner,
              citizenId: storeData.citizenId,
              notes: storeData.notes,
            }
          : s
      );
    } else {
      // Create mode
      const newStore: Store = {
        id: `store-${Date.now()}`,
        name: storeData.name,
        industry: storeData.industry,
        address: storeData.address,
        representativeName: storeData.representativeName,
        bankName: storeData.bankName,
        bankAccount: storeData.bankAccount,
        bankOwner: storeData.bankOwner,
        citizenId: storeData.citizenId,
        notes: storeData.notes,
        createdAt: (() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })(),
      };
      updatedStores = [...stores, newStore];
      activeId = newStore.id; // Switch to newly created store
    }

    setStores(updatedStores);
    setActiveStoreId(activeId);
    saveToStorage(updatedStores, records, activeId);
    setIsStoreFormOpen(false);
    setEditingStore(undefined);
  };

  const handleEditStoreClick = (store: Store) => {
    setEditingStore(store);
    setIsStoreFormOpen(true);
  };

  const handleDeleteStoreClick = (storeIdToDelete: string) => {
    if (stores.length <= 1) {
      alert('Hệ thống yêu cầu phải có ít nhất một cửa hàng để hiển thị báo cáo.');
      return;
    }

    showConfirm(
      'Xóa cửa hàng',
      'Bạn có chắc chắn muốn xóa cửa hàng này? Toàn bộ nhật ký doanh thu liên quan cũng sẽ bị xóa vĩnh viễn.',
      () => {
        const updatedStores = stores.filter((s) => s.id !== storeIdToDelete);
        const updatedRecords = records.filter((r) => r.storeId !== storeIdToDelete);
        
        // Select another store to be active
        let activeId = activeStoreId;
        if (activeStoreId === storeIdToDelete) {
          activeId = updatedStores[0].id;
        }

        setStores(updatedStores);
        setRecords(updatedRecords);
        setActiveStoreId(activeId);
        saveToStorage(updatedStores, updatedRecords, activeId);
      },
      true,
      'Xóa cửa hàng'
    );
  };

  const handleUpdateStore = (storeId: string, updatedFields: Partial<Store>) => {
    const updatedStores = stores.map((s) =>
      s.id === storeId ? { ...s, ...updatedFields } : s
    );
    setStores(updatedStores);
    saveToStorage(updatedStores, records, activeStoreId);
  };

  // --- Handlers for Sales Records CRUD ---
  const handleRecordSubmit = (recordData: (Omit<SalesRecord, 'id' | 'profit'> & { id?: string }) | SalesRecord[]) => {
    let updatedRecords: SalesRecord[];
    const targetStoreId = Array.isArray(recordData) ? recordData[0]?.storeId : recordData.storeId;

    if (Array.isArray(recordData)) {
      // It's a batch of multiple records generated randomly for a date range
      const datesToOverwrite = new Set(recordData.map((r) => r.date));
      const filteredExisting = records.filter(
        (r) => !(r.storeId === targetStoreId && datesToOverwrite.has(r.date))
      );

      updatedRecords = [...filteredExisting, ...recordData];
    } else {
      // It's a single record
      const profit = recordData.revenue - recordData.expense;
      if (recordData.id) {
        // Edit Mode
        updatedRecords = records.map((r) =>
          r.id === recordData.id
            ? {
                ...r,
                storeId: recordData.storeId,
                date: recordData.date,
                revenue: recordData.revenue,
                expense: recordData.expense,
                profit,
                notes: recordData.notes,
              }
            : r
        );
      } else {
        // Create Mode - avoid duplicate date for the same store
        const filteredExisting = records.filter(
          (r) => !(r.storeId === recordData.storeId && r.date === recordData.date)
        );
        const newRecord: SalesRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          storeId: recordData.storeId,
          date: recordData.date,
          revenue: recordData.revenue,
          expense: recordData.expense,
          profit,
          notes: recordData.notes,
        };
        updatedRecords = [...filteredExisting, newRecord];
      }
    }

    setRecords(updatedRecords);
    if (targetStoreId) {
      setActiveStoreId(targetStoreId);
      saveToStorage(stores, updatedRecords, targetStoreId);
    } else {
      saveToStorage(stores, updatedRecords, activeStoreId);
    }
    setIsRecordFormOpen(false);
    setEditingRecord(undefined);
  };

  const handleBatchCreateRecords = (newRecords: SalesRecord[], isOverwrite = false) => {
    if (!newRecords || newRecords.length === 0) return;
    const targetStoreId = newRecords[0].storeId;

    let updatedRecords: SalesRecord[];
    if (isOverwrite) {
      // Remove existing records for this store, replace with newRecords
      const otherStoresRecords = records.filter((r) => r.storeId !== targetStoreId);
      updatedRecords = [...otherStoresRecords, ...newRecords];
    } else {
      // Merge: overwrite matching dates, append rest
      const datesToOverwrite = new Set(newRecords.map((r) => r.date));
      const filteredExisting = records.filter(
        (r) => !(r.storeId === targetStoreId && datesToOverwrite.has(r.date))
      );
      updatedRecords = [...filteredExisting, ...newRecords];
    }

    setRecords(updatedRecords);
    if (targetStoreId) {
      setActiveStoreId(targetStoreId);
      saveToStorage(stores, updatedRecords, targetStoreId);
    } else {
      saveToStorage(stores, updatedRecords, activeStoreId);
    }
  };

  const handleEditRecordClick = (recordToEdit: SalesRecord) => {
    setEditingRecord(recordToEdit);
    setIsRecordFormOpen(true);
  };

  const handleDeleteRecordClick = (recordIdToDelete: string) => {
    showConfirm(
      'Xóa số liệu ngày',
      'Bạn có chắc chắn muốn xóa bản ghi doanh thu của ngày này? Thao tác này không thể hoàn tác.',
      () => {
        const updatedRecords = records.filter((r) => r.id !== recordIdToDelete);
        setRecords(updatedRecords);
        saveToStorage(stores, updatedRecords, activeStoreId);
      },
      true,
      'Xóa bản ghi'
    );
  };

  const handleDeleteAllRecordsClick = () => {
    if (activeStoreId && activeStore) {
      showConfirm(
        'Xóa tất cả số liệu',
        `Bạn có chắc chắn muốn XÓA TOÀN BỘ số liệu đã nhập của cửa hàng "${activeStore.name}"? Thao tác này sẽ xóa tất cả ngày số liệu đã lưu và không thể khôi phục lại!`,
        () => {
          const updatedRecords = records.filter((r) => r.storeId !== activeStoreId);
          setRecords(updatedRecords);
          saveToStorage(stores, updatedRecords, activeStoreId);
        },
        true,
        'Xóa tất cả'
      );
    }
  };

  // --- Data Reset & Seeding ---
  const handleResetToSample = () => {
    showConfirm(
      'Khôi phục dữ liệu mẫu',
      'Bạn có muốn khôi phục toàn bộ ứng dụng về dữ liệu mẫu ban đầu? Thao tác này sẽ xóa mọi dữ liệu và cửa hàng bạn đã tự nhập.',
      () => {
        setStores(sampleStores);
        setRecords(sampleRecords);
        setActiveStoreId(sampleStores[0].id);
        saveToStorage(sampleStores, sampleRecords, sampleStores[0].id);
      },
      true,
      'Khôi phục dữ liệu'
    );
  };

  // --- Memoized values ---
  const activeStore = useMemo(() => {
    return stores.find((s) => s.id === activeStoreId) || stores[0];
  }, [stores, activeStoreId]);

  // Aggregate KPIs for the active store (calculated per shop, not combined)
  const activeStoreKPIs = useMemo(() => {
    const currentId = activeStoreId || (stores[0]?.id || '');
    const storeRecords = records.filter((r) => r.storeId === currentId);
    const totalRevenue = storeRecords.reduce((sum, r) => sum + r.revenue, 0);
    const totalProfit = storeRecords.reduce((sum, r) => sum + r.profit, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    return {
      totalRevenue,
      totalProfit,
      avgMargin,
    };
  }, [records, activeStoreId, stores]);

  // Find the current user's full name to be the Buyer's representative name
  const buyerName = useMemo(() => {
    if (!currentUser) return 'Chủ cửa hàng';
    try {
      const existingUsersStr = localStorage.getItem('store_reports_users') || '[]';
      const users = JSON.parse(existingUsersStr);
      const email = currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser;
      const found = users.find((u: any) => (u.username === currentUser || u.email?.toLowerCase() === email.toLowerCase()));
      return found ? found.fullName : (email.split('@')[0] || 'Chủ cửa hàng');
    } catch (e) {
      return 'Chủ cửa hàng';
    }
  }, [currentUser]);

  // Determine user role for Admin actions
  const userRole = useMemo(() => {
    if (!currentUser) return 'Chủ cửa hàng';
    try {
      const existingUsersStr = localStorage.getItem('store_reports_users') || '[]';
      const users = JSON.parse(existingUsersStr);
      const email = currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser;
      if (email.toLowerCase() === 'meizutq@gmail.com' || email.toLowerCase().includes('admin')) {
        return 'Quản trị viên';
      }
      const found = users.find((u: any) => (u.username === currentUser || u.email?.toLowerCase() === email.toLowerCase()));
      return found ? found.role : 'Chủ cửa hàng';
    } catch (e) {
      return 'Chủ cửa hàng';
    }
  }, [currentUser]);

  // --- Handlers for Purchase Contracts CRUD ---
  const handleSaveContract = (newContract: PurchaseContract) => {
    let updatedContracts: PurchaseContract[];
    const exists = contracts.some(c => c.id === newContract.id);
    
    if (exists) {
      updatedContracts = contracts.map(c => c.id === newContract.id ? newContract : c);
    } else {
      updatedContracts = [newContract, ...contracts];
    }
    
    setContracts(updatedContracts);
    saveToStorage(stores, records, activeStoreId, updatedContracts);
    setIsContractModalOpen(false);
    setActiveContract(null);
  };

  const handleDeleteContract = (contractId: string) => {
    showConfirm(
      'Xóa Hợp đồng Mua bán',
      'Bạn có chắc chắn muốn xóa hợp đồng mua bán nhập hàng này? Thao tác này sẽ xóa vĩnh viễn văn bản hợp đồng và không thể phục hồi.',
      () => {
        const updatedContracts = contracts.filter(c => c.id !== contractId);
        setContracts(updatedContracts);
        saveToStorage(stores, records, activeStoreId, updatedContracts);
      },
      true // Is danger style
    );
  };

  // --- Handlers for Backup & Restore ---
  const handleRestoreData = (
    newStores: Store[],
    newRecords: SalesRecord[],
    newContracts: PurchaseContract[],
    newActiveStoreId: string,
    message: string
  ) => {
    // Persist capital plan parameters for each store into localStorage so CapitalPlanTab immediately displays them
    newStores.forEach((s) => {
      if (s.projectionParams) {
        try {
          localStorage.setItem(`projection_params_${s.id}`, JSON.stringify(s.projectionParams));
        } catch (e) {
          console.warn('Lỗi lưu projection_params khi restore:', e);
        }
      }
    });

    setStores(newStores);
    setRecords(newRecords);
    setContracts(newContracts);
    setActiveStoreId(newActiveStoreId);
    saveToStorage(newStores, newRecords, newActiveStoreId, newContracts);
  };

  // Safely sync data to cloud and sign out from Google and local session
  const handleLogout = async () => {
    if (currentUser) {
      const firestoreUid = currentUser.startsWith('google:')
        ? localStorage.getItem(`store_reports_google_uid_${currentUser}`)
        : currentUser;

      if (firestoreUid) {
        setSyncing(true);
        try {
          const rIp = () => Math.floor(Math.random() * 256);
          const ip = `${rIp()}.${rIp()}.${rIp()}.${rIp()}`;
          const logoutLog = {
            id: `log-${Date.now()}`,
            action: 'Đăng xuất tài khoản an toàn',
            timestamp: new Date().toISOString(),
            ipAddress: ip,
            status: 'Thành công' as const,
            userAgent: navigator.userAgent.substring(0, 60) + '...'
          };

          const localUsersStr = localStorage.getItem('store_reports_users') || '[]';
          const localUsers = JSON.parse(localUsersStr);
          const localUser = localUsers.find((u: any) => u.username === currentUser);
          const currentLogs = localUser?.securityLogs || [];
          const updatedLogs = [logoutLog, ...currentLogs].slice(0, 50);

          if (localUser) {
            localUser.securityLogs = updatedLogs;
            localStorage.setItem('store_reports_users', JSON.stringify(localUsers));
          }

          // Safe final sync of all modifications and logs
          await syncUserDataToFirestore(firestoreUid, {
            stores,
            records,
            activeStoreId,
            securityLogs: updatedLogs
          });

          if (currentUser.startsWith('google:')) {
            await signOut(auth);
          }
        } catch (error) {
          console.error("Lỗi đồng bộ hoặc đăng xuất:", error);
        } finally {
          setSyncing(false);
        }
      }
    }

    localStorage.removeItem('store_reports_current_user');
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  if (!currentUser) {
    return <AuthPanel onLoginSuccess={(username) => setCurrentUser(username)} />;
  }

  if (currentView === 'profile') {
    return (
      <UserProfilePage
        currentUser={currentUser}
        stores={stores}
        records={records}
        contracts={contracts}
        onLogout={handleLogout}
        onUpdateData={(updatedStores, updatedRecords, updatedContracts) => {
          setStores(updatedStores);
          setRecords(updatedRecords);
          const nextContracts = updatedContracts !== undefined ? updatedContracts : contracts;
          setContracts(nextContracts);
          if (updatedStores.length > 0) {
            setActiveStoreId(updatedStores[0].id);
            saveToStorage(updatedStores, updatedRecords, updatedStores[0].id, nextContracts);
          } else {
            setActiveStoreId('');
            saveToStorage(updatedStores, updatedRecords, '', nextContracts);
          }
        }}
        onShowConfirm={showConfirm}
        onBackToDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'admin') {
    return (
      <AdminManagementPage
        currentUser={currentUser}
        onBackToDashboard={() => {
          setCurrentView('dashboard');
          const savedActiveId = localStorage.getItem(`store_reports_active_id_${currentUser}`) || '';
          const savedStores = JSON.parse(localStorage.getItem(`store_reports_stores_${currentUser}`) || '[]');
          const savedRecords = JSON.parse(localStorage.getItem(`store_reports_records_${currentUser}`) || '[]');
          setStores(savedStores);
          setRecords(savedRecords);
          if (savedActiveId && savedStores.some((s: Store) => s.id === savedActiveId)) {
            setActiveStoreId(savedActiveId);
          } else if (savedStores.length > 0) {
            setActiveStoreId(savedStores[0].id);
          } else {
            setActiveStoreId('');
          }
        }}
        onShowConfirm={showConfirm}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-sky-500/20">
      
      {/* Upper Navigation/Branding Bar */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-zinc-900/95 border-b border-zinc-800 px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-sky-500 text-zinc-950 rounded-xl shadow-md shadow-sky-500/10 flex items-center justify-center shrink-0">
                <StoreIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-50 flex items-center gap-1.5 font-sans">
                  PRO-FINANCE
                  <span className="inline-block animate-pulse w-2 h-2 rounded-full bg-sky-400"></span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-1">
                  Quản lý tài chính & doanh thu đa cửa hàng
                </p>
              </div>
            </div>

            {/* Mobile Action buttons cluster */}
            <div className="flex sm:hidden items-center gap-2">
              <UserProfileWidget
                currentUser={currentUser}
                stores={stores}
                records={records}
                onLogout={handleLogout}
                onShowConfirm={showConfirm}
                onOpenProfile={() => setCurrentView('profile')}
                onUpdateData={(updatedStores, updatedRecords) => {
                  setStores(updatedStores);
                  setRecords(updatedRecords);
                  if (updatedStores.length > 0) {
                     setActiveStoreId(updatedStores[0].id);
                     saveToStorage(updatedStores, updatedRecords, updatedStores[0].id);
                  } else {
                     setActiveStoreId('');
                     saveToStorage(updatedStores, updatedRecords, '');
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            {/* Cloud Sync Status Indicator */}
            {currentUser && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-[10px] font-black uppercase tracking-wider animate-fadeIn">
                {syncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                    <span className="text-sky-400">Đang lưu...</span>
                  </>
                ) : cloudLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                    <span className="text-amber-500">Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-zinc-400">Đám mây</span>
                  </>
                )}
              </div>
            )}

            <div className="hidden sm:block">
              <UserProfileWidget
                currentUser={currentUser}
                stores={stores}
                records={records}
                onLogout={handleLogout}
                onShowConfirm={showConfirm}
                onOpenProfile={() => setCurrentView('profile')}
                onUpdateData={(updatedStores, updatedRecords) => {
                  setStores(updatedStores);
                  setRecords(updatedRecords);
                  if (updatedStores.length > 0) {
                     setActiveStoreId(updatedStores[0].id);
                     saveToStorage(updatedStores, updatedRecords, updatedStores[0].id);
                  } else {
                     setActiveStoreId('');
                     saveToStorage(updatedStores, updatedRecords, '');
                  }
                }}
              />
            </div>

            {userRole === 'Quản trị viên' && (
              <button
                onClick={() => setCurrentView('admin')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-zinc-50 rounded-lg text-xs font-bold cursor-pointer shadow-md transition-colors border border-purple-500/30 min-h-[36px]"
                id="btn-goto-admin"
              >
                <Shield className="w-3.5 h-3.5 text-purple-200" />
                <span className="hidden xs:inline">Quản trị</span>
              </button>
            )}

            <button
              onClick={() => setIsBackupRestoreOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sky-400 border border-zinc-700 hover:border-sky-500/50 rounded-lg text-xs font-bold cursor-pointer shadow-sm transition-colors min-h-[36px]"
              title="Sao lưu dữ liệu về máy hoặc khôi phục từ tệp máy tính"
              id="btn-backup-restore-header"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Sao lưu & Khôi phục</span>
              <span className="md:hidden">Sao lưu</span>
            </button>

            <button
              onClick={() => {
                setEditingStore(undefined);
                setIsStoreFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm transition-colors min-h-[36px]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Cửa hàng</span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Store Chips Bar (When there are 2+ stores) */}
        {stores.length > 1 && (
          <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-zinc-800/80 flex sm:hidden items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0">Shop:</span>
            {stores.map((st) => {
              const isCur = st.id === activeStoreId;
              const ind = INDUSTRIES[st.industry];
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setActiveStoreId(st.id);
                    localStorage.setItem(`store_reports_active_id_${currentUser}`, st.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isCur
                      ? 'bg-sky-500 text-zinc-950 shadow-sm shadow-sky-500/20'
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isCur ? '#09090b' : ind?.color || '#38bdf8' }}
                  />
                  <span className="max-w-[120px] truncate">{st.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Stores List and Global Stats (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Store Statistics Summary */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Hiệu quả: {activeStore?.name || 'Cửa hàng'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-zinc-400 font-medium">Doanh thu:</p>
                <p className="text-sm font-extrabold text-zinc-50 mt-0.5">
                  {formatVND(activeStoreKPIs.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 font-medium">Lợi nhuận:</p>
                <p className="text-sm font-extrabold text-sky-400 mt-0.5">
                  {formatVND(activeStoreKPIs.totalProfit)}
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
              <span>Tỷ suất lợi nhuận:</span>
              <span className="font-extrabold text-zinc-200">
                {activeStoreKPIs.avgMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Active Store Switcher List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-sky-400" />
                Danh sách Cửa hàng ({stores.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsBackupRestoreOpen(true)}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors bg-sky-500/10 hover:bg-sky-500/20 px-2 py-1 rounded-lg border border-sky-500/20"
                title="Sao lưu hoặc nạp lại dữ liệu cửa hàng từ tệp máy tính"
              >
                <Database className="w-3 h-3" />
                <span>Sao lưu/Nạp</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {stores.map((s) => {
                const isActive = s.id === activeStoreId;
                const industry = INDUSTRIES[s.industry];
                const storeRecs = records.filter((r) => r.storeId === s.id);
                const countOfDays = storeRecs.length;
                const storeRevenue = storeRecs.reduce((sum, r) => sum + r.revenue, 0);
                const storeProfit = storeRecs.reduce((sum, r) => sum + r.profit, 0);

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveStoreId(s.id);
                      localStorage.setItem(`store_reports_active_id_${currentUser}`, s.id);
                    }}
                    className={`group p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-2.5 ${
                      isActive
                        ? 'border-sky-500 bg-zinc-900 ring-2 ring-sky-500/10 shadow-sm'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: industry?.color || '#a1a1aa' }}
                          />
                          <h4 className="text-sm font-bold text-zinc-100 group-hover:text-sky-400 transition-colors line-clamp-1 font-sans">
                            {s.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-400">
                          <span>{industry?.name}</span>
                          <span>•</span>
                          <span>{countOfDays} ngày nhập liệu</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-center lg:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStoreClick(s);
                          }}
                          className="p-1 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Sửa cửa hàng"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStoreClick(s.id);
                          }}
                          className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Xóa cửa hàng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Store specific performance summary */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-[10px] font-sans">
                      <div>
                        <span className="text-zinc-500 block">Doanh thu shop:</span>
                        <span className="font-extrabold text-zinc-300 font-mono text-[11px]">
                          {formatVND(storeRevenue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Lợi nhuận shop:</span>
                        <span className="font-extrabold text-sky-400 font-mono text-[11px]">
                          {formatVND(storeProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Help Box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>Hướng dẫn sử dụng</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Bạn có thể tạo nhiều cửa hàng khác nhau thuộc các ngành nghề: Cà phê, Tạp hóa, Bia giải khát... sau đó chọn từng cửa hàng rồi nhấn <strong>"Nhập số liệu mới"</strong> để lưu báo cáo doanh thu theo ngày. Hệ thống tự động phân tích và tạo biểu đồ so sánh!
            </p>
          </div>

        </div>

        {/* Right Column: Active Store Report, Data Logs, Capital Plan and Contracts (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Detailed store reporting */}
          {stores.length > 0 ? (
            activeStore ? (
              <StoreReport
                store={activeStore}
                records={records}
                contracts={contracts}
                buyerName={buyerName}
                onAddRecord={() => {
                  setEditingRecord(undefined);
                  setIsRecordFormOpen(true);
                }}
                onEditRecord={(rec) => {
                  handleEditRecordClick(rec);
                }}
                onDeleteRecord={(id) => {
                  handleDeleteRecordClick(id);
                }}
                onDeleteAllRecords={handleDeleteAllRecordsClick}
                onAddContract={() => {
                  setActiveContract(null);
                  setInitialContractDoc('contract');
                  setIsContractModalOpen(true);
                }}
                onViewContract={(con) => {
                  setActiveContract(con);
                  setInitialContractDoc('contract');
                  setIsContractModalOpen(true);
                }}
                onViewUynhiemchi={(con) => {
                  setActiveContract(con);
                  setInitialContractDoc('uynhiemchi');
                  setIsContractModalOpen(true);
                }}
                onDeleteContract={handleDeleteContract}
                onUpdateStore={handleUpdateStore}
                onBatchCreateRecords={handleBatchCreateRecords}
                onOpenBackupRestore={() => setIsBackupRestoreOpen(true)}
              />
            ) : (
              <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl">
                <p className="text-sm font-semibold text-zinc-400">Vui lòng chọn hoặc thêm một cửa hàng để hiển thị báo cáo.</p>
              </div>
            )
          ) : (
            <div className="p-10 text-center bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shadow-lg">
                <Building className="w-8 h-8" />
              </div>
              
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-black tracking-wider text-zinc-50 uppercase">CHƯA CÓ CỬA HÀNG NÀO ĐƯỢC ĐĂNG KÝ</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Chào mừng bạn đến với <strong className="text-zinc-200">Pro-Finance</strong>! Tài khoản của bạn hiện chưa có cửa hàng nào. Hãy kích hoạt ngay bằng một trong các cách dưới đây:
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto pt-2">
                <button
                  onClick={() => {
                    setEditingStore(undefined);
                    setIsStoreFormOpen(true);
                  }}
                  className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-sky-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Tạo cửa hàng mới
                </button>
                <button
                  onClick={() => setIsBackupRestoreOpen(true)}
                  className="flex-1 py-3 px-4 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Nạp dữ liệu từ tệp sao lưu JSON ở máy tính"
                >
                  <Database className="w-4 h-4" />
                  Khôi phục tệp (.json)
                </button>
                <button
                  onClick={() => {
                    setStores(sampleStores);
                    setRecords(sampleRecords);
                    setActiveStoreId(sampleStores[0].id);
                    saveToStorage(sampleStores, sampleRecords, sampleStores[0].id);
                  }}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold uppercase tracking-wider border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-sky-400" />
                  Dữ liệu mẫu
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* --- MODAL DIALOGS --- */}

      {/* Store Form Modal */}
      {isStoreFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <StoreForm
            store={editingStore}
            onSubmit={handleStoreSubmit}
            onCancel={() => {
              setIsStoreFormOpen(false);
              setEditingStore(undefined);
            }}
          />
        </div>
      )}

      {/* Sales Record Form Modal */}
      {isRecordFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <SalesRecordForm
            stores={stores}
            activeStoreId={activeStoreId}
            record={editingRecord}
            onSubmit={handleRecordSubmit}
            onCancel={() => {
              setIsRecordFormOpen(false);
              setEditingRecord(undefined);
            }}
          />
        </div>
      )}

      {/* Purchase Contract Form/Preview Modal */}
      {isContractModalOpen && activeStore && (
        <ContractModal
          store={activeStore}
          contract={activeContract}
          buyerName={buyerName}
          initialPreviewDoc={initialContractDoc}
          onClose={() => {
            setIsContractModalOpen(false);
            setActiveContract(null);
          }}
          onSave={handleSaveContract}
        />
      )}

      {/* Backup and Restore Local JSON File Modal */}
      <BackupRestoreModal
        isOpen={isBackupRestoreOpen}
        onClose={() => setIsBackupRestoreOpen(false)}
        stores={stores}
        records={records}
        contracts={contracts}
        activeStore={activeStore}
        onRestore={handleRestoreData}
      />

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-55 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header Accent Line */}
            <div className={`h-1.5 w-full ${confirmDialog.isDanger ? 'bg-red-500 animate-pulse' : 'bg-sky-500'}`} />
            
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  confirmDialog.isDanger ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                }`}>
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wider">
                    {confirmDialog.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl text-xs font-semibold transition-all border border-zinc-700 cursor-pointer text-center"
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md cursor-pointer text-center ${
                    confirmDialog.isDanger
                      ? 'bg-red-500 hover:bg-red-400 text-white'
                      : 'bg-sky-500 hover:bg-sky-450 text-zinc-950'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 mt-12 py-6 text-center text-xs text-zinc-500">
        <p className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-1">
          <span>Báo Cáo Doanh Thu Cửa Hàng © {new Date().getFullYear()} • Thiết kế tinh tế cho quản trị viên</span>
        </p>
      </footer>

    </div>
  );
}
