import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Store as StoreIcon, 
  FileText, 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  X, 
  Activity, 
  Shield, 
  Briefcase, 
  UserCheck, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Eye, 
  Mail, 
  Phone, 
  HardDrive, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Store, SalesRecord, PurchaseContract, INDUSTRIES, IndustryType, UserAccount, SecurityLog } from '../types';
import { formatVND, sampleStores, sampleRecords } from '../utils/sampleData';
import { generateRandomIP } from '../utils/crypto';
import { syncUserDataToFirestore } from '../lib/firebase';

interface AdminManagementPageProps {
  currentUser: string;
  onBackToDashboard: () => void;
  onShowConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger?: boolean,
    confirmText?: string,
    cancelText?: string
  ) => void;
}

interface AggregatedStore extends Store {
  owner: string;
  ownerEmail: string;
  recordCount: number;
  totalRevenue: number;
  totalProfit: number;
  avgMargin: number;
}

interface AggregatedRecord extends SalesRecord {
  owner: string;
  ownerEmail: string;
  storeName: string;
}

export default function AdminManagementPage({
  currentUser,
  onBackToDashboard,
  onShowConfirm
}: AdminManagementPageProps) {
  // Tabs: 'overview' | 'users' | 'stores' | 'records' | 'logs'
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'stores' | 'records' | 'logs'>('overview');

  // Master States
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [allStores, setAllStores] = useState<AggregatedStore[]>([]);
  const [allRecords, setAllRecords] = useState<AggregatedRecord[]>([]);
  const [syncingUser, setSyncingUser] = useState<string | null>(null);

  // Search & Filter States
  const [userQuery, setUserQuery] = useState('');
  const [storeQuery, setStoreQuery] = useState('');
  const [recordQuery, setRecordQuery] = useState('');
  const [logQuery, setLogQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    role: 'Chủ cửa hàng' as 'Chủ cửa hàng' | 'Quản trị viên',
    seedSampleData: true
  });

  const [activeLogsUser, setActiveLogsUser] = useState<UserAccount | null>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Toast status message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  };

  // Helper to normalize username key in localStorage
  const getUserKey = (email: string) => `google:${email.toLowerCase()}`;

  // 1. Load users from LocalStorage
  const loadUsersData = () => {
    try {
      const usersStr = localStorage.getItem('store_reports_users') || '[]';
      const parsedUsers: UserAccount[] = JSON.parse(usersStr);
      setUsers(parsedUsers);
      loadSystemData(parsedUsers);
    } catch (e) {
      console.error('Lỗi load danh sách users:', e);
      showToast('error', 'Không thể tải cơ sở dữ liệu người dùng.');
    }
  };

  // 2. Load and aggregate stores & records for all loaded users
  const loadSystemData = (targetUsers: UserAccount[]) => {
    let tempStores: AggregatedStore[] = [];
    let tempRecords: AggregatedRecord[] = [];

    targetUsers.forEach(u => {
      try {
        const userKey = (u as any).username || getUserKey(u.email);
        const userStoresStr = localStorage.getItem(`store_reports_stores_${userKey}`) || '[]';
        const userRecordsStr = localStorage.getItem(`store_reports_records_${userKey}`) || '[]';
        
        const userStores: Store[] = JSON.parse(userStoresStr);
        const userRecords: SalesRecord[] = JSON.parse(userRecordsStr);

        userStores.forEach(s => {
          const storeRecs = userRecords.filter(r => r.storeId === s.id);
          const totalRevenue = storeRecs.reduce((sum, r) => sum + r.revenue, 0);
          const totalProfit = storeRecs.reduce((sum, r) => sum + r.profit, 0);
          const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

          tempStores.push({
            ...s,
            owner: u.fullName || u.email,
            ownerEmail: u.email,
            recordCount: storeRecs.length,
            totalRevenue,
            totalProfit,
            avgMargin
          });
        });

        userRecords.forEach(r => {
          const store = userStores.find(s => s.id === r.storeId);
          tempRecords.push({
            ...r,
            owner: u.fullName || u.email,
            ownerEmail: u.email,
            storeName: store ? store.name : 'Cửa hàng đã xóa'
          });
        });
      } catch (err) {
        console.error(`Lỗi đọc dữ liệu của user: ${u.email}`, err);
      }
    });

    setAllStores(tempStores);
    setAllRecords(tempRecords);
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // System statistics computations
  const systemStats = useMemo(() => {
    const totalUsers = users.length;
    const totalStores = allStores.length;
    const totalRecords = allRecords.length;
    const totalRevenue = allRecords.reduce((sum, r) => sum + r.revenue, 0);
    const totalProfit = allRecords.reduce((sum, r) => sum + r.profit, 0);
    const systemMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalUsers,
      totalStores,
      totalRecords,
      totalRevenue,
      totalProfit,
      systemMargin
    };
  }, [users, allStores, allRecords]);

  // Aggregate security logs across all users for the audit trail
  const globalLogs = useMemo(() => {
    let logs: Array<SecurityLog & { userEmail: string; fullName: string }> = [];
    users.forEach(u => {
      if (u.securityLogs) {
        u.securityLogs.forEach(log => {
          logs.push({
            ...log,
            userEmail: u.email,
            fullName: u.fullName
          });
        });
      }
    });
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [users]);

  // Filters & Searches
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchQuery = 
        u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
        u.fullName.toLowerCase().includes(userQuery.toLowerCase()) ||
        (u.phone || '').includes(userQuery);
      
      const matchRole = roleFilter === 'all' || u.role === roleFilter;

      return matchQuery && matchRole;
    });
  }, [users, userQuery, roleFilter]);

  const filteredStores = useMemo(() => {
    return allStores.filter(s => {
      const matchQuery = 
        s.name.toLowerCase().includes(storeQuery.toLowerCase()) ||
        s.ownerEmail.toLowerCase().includes(storeQuery.toLowerCase()) ||
        s.owner.toLowerCase().includes(storeQuery.toLowerCase()) ||
        (s.address || '').toLowerCase().includes(storeQuery.toLowerCase());

      const matchIndustry = industryFilter === 'all' || s.industry === industryFilter;

      return matchQuery && matchIndustry;
    });
  }, [allStores, storeQuery, industryFilter]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const matchQuery = 
        r.storeName.toLowerCase().includes(recordQuery.toLowerCase()) ||
        r.ownerEmail.toLowerCase().includes(recordQuery.toLowerCase()) ||
        r.owner.toLowerCase().includes(recordQuery.toLowerCase()) ||
        (r.notes || '').toLowerCase().includes(recordQuery.toLowerCase()) ||
        r.date.includes(recordQuery);

      return matchQuery;
    });
  }, [allRecords, recordQuery]);

  const filteredLogs = useMemo(() => {
    return globalLogs.filter(log => {
      return (
        log.userEmail.toLowerCase().includes(logQuery.toLowerCase()) ||
        log.fullName.toLowerCase().includes(logQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(logQuery.toLowerCase()) ||
        log.ipAddress.includes(logQuery) ||
        log.status.toLowerCase().includes(logQuery.toLowerCase())
      );
    });
  }, [globalLogs, logQuery]);

  // --- Add/Edit User Actions ---
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      fullName: '',
      phone: '',
      role: 'Chủ cửa hàng',
      seedSampleData: true
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
      seedSampleData: false
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email.trim() || !userForm.fullName.trim()) {
      showToast('error', 'Vui lòng điền đầy đủ Email Google và Họ tên.');
      return;
    }

    const email = userForm.email.trim().toLowerCase();
    const userKey = getUserKey(email);
    const isEdit = !!editingUser;

    try {
      let usersListStr = localStorage.getItem('store_reports_users') || '[]';
      let usersList: UserAccount[] = JSON.parse(usersListStr);

      if (!isEdit) {
        // Create new account
        if (usersList.some(u => u.email.toLowerCase() === email || (u as any).username === userKey)) {
          showToast('error', `Tài khoản Google Email "${email}" đã tồn tại trong hệ thống.`);
          return;
        }

        const ip = generateRandomIP();
        const newUser: UserAccount = {
          uid: userKey,
          email: email,
          fullName: userForm.fullName.trim(),
          photoURL: null,
          phone: userForm.phone.trim() || undefined,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: userForm.role,
          securityLogs: [
            {
              id: `log-${Date.now()}`,
              action: `Ủy quyền tài khoản bởi Quản trị viên (${currentUser})`,
              timestamp: new Date().toISOString(),
              ipAddress: ip,
              status: 'Thành công',
              userAgent: 'Hệ thống Quản trị'
            }
          ]
        };

        let initialStores: Store[] = [];
        let initialRecords: SalesRecord[] = [];
        let activeStoreId = '';

        if (userForm.seedSampleData) {
          initialStores = sampleStores;
          initialRecords = sampleRecords;
          activeStoreId = sampleStores[0]?.id || '';
          newUser.securityLogs.push({
            id: `log-${Date.now() + 1}`,
            action: 'Nạp sẵn dữ liệu mẫu ban đầu từ Hệ thống Quản trị',
            timestamp: new Date().toISOString(),
            ipAddress: ip,
            status: 'Thành công',
            userAgent: 'Hệ thống Quản trị'
          });
        }

        usersList.push(newUser);
        localStorage.setItem('store_reports_users', JSON.stringify(usersList));
        localStorage.setItem(`store_reports_stores_${userKey}`, JSON.stringify(initialStores));
        localStorage.setItem(`store_reports_records_${userKey}`, JSON.stringify(initialRecords));
        localStorage.setItem(`store_reports_active_id_${userKey}`, activeStoreId);

        // Sync to cloud in background
        setSyncingUser(userKey);
        try {
          await syncUserDataToFirestore(userKey, {
            email: newUser.email,
            fullName: newUser.fullName,
            createdAt: newUser.createdAt,
            role: newUser.role,
            securityLogs: newUser.securityLogs,
            stores: initialStores,
            records: initialRecords,
            activeStoreId: activeStoreId,
            phone: newUser.phone || null
          });
        } catch (cloudErr) {
          console.warn('Không thể đồng bộ user mới lên Firestore, đã lưu offline:', cloudErr);
        } finally {
          setSyncingUser(null);
        }

        showToast('success', `Đã cấp quyền tài khoản Google "${email}" thành công!`);

      } else {
        // Edit existing account
        const targetIdx = usersList.findIndex(u => u.email.toLowerCase() === email || (u as any).username === userKey);
        if (targetIdx === -1) {
          showToast('error', 'Không tìm thấy tài khoản để chỉnh sửa.');
          return;
        }

        const targetUser = usersList[targetIdx];
        targetUser.fullName = userForm.fullName.trim();
        targetUser.role = userForm.role;
        targetUser.phone = userForm.phone.trim() || undefined;

        const ip = generateRandomIP();
        targetUser.securityLogs.unshift({
          id: `log-${Date.now()}`,
          action: `Chỉnh sửa phân quyền bởi Quản trị viên (${currentUser})`,
          timestamp: new Date().toISOString(),
          ipAddress: ip,
          status: 'Thành công',
          userAgent: 'Hệ thống Quản trị'
        });

        usersList[targetIdx] = targetUser;
        localStorage.setItem('store_reports_users', JSON.stringify(usersList));

        // Sync changes to cloud
        setSyncingUser(userKey);
        try {
          const userStores = JSON.parse(localStorage.getItem(`store_reports_stores_${userKey}`) || '[]');
          const userRecords = JSON.parse(localStorage.getItem(`store_reports_records_${userKey}`) || '[]');
          const activeId = localStorage.getItem(`store_reports_active_id_${userKey}`) || '';

          await syncUserDataToFirestore(userKey, {
            fullName: targetUser.fullName,
            role: targetUser.role,
            phone: targetUser.phone || null,
            securityLogs: targetUser.securityLogs,
            stores: userStores,
            records: userRecords,
            activeStoreId: activeId
          });
        } catch (cloudErr) {
          console.warn('Không thể đồng bộ thay đổi lên Firestore, đã lưu offline:', cloudErr);
        } finally {
          setSyncingUser(null);
        }

        showToast('success', `Đã cập nhật thông tin tài khoản "${email}" thành công!`);
      }

      setIsUserModalOpen(false);
      loadUsersData();
    } catch (e) {
      console.error(e);
      showToast('error', 'Đã xảy ra lỗi khi lưu thông tin tài khoản.');
    }
  };

  const handleDeleteUser = (targetUser: UserAccount) => {
    const targetKey = (targetUser as any).username || getUserKey(targetUser.email);
    if (targetKey === currentUser || targetUser.email.toLowerCase() === currentUser.replace('google:', '').toLowerCase()) {
      showToast('error', 'Bạn không thể tự xóa tài khoản của chính mình đang đăng nhập!');
      return;
    }

    onShowConfirm(
      'Xóa tài khoản người dùng',
      `Bạn có chắc chắn muốn xóa tài khoản Google "${targetUser.email}" (${targetUser.fullName})? Thao tác này sẽ xóa VĨNH VIỄN thông tin tài khoản cùng toàn bộ danh sách cửa hàng, số liệu doanh thu và lịch sử hợp đồng của người dùng này.`,
      async () => {
        try {
          let usersListStr = localStorage.getItem('store_reports_users') || '[]';
          let usersList: UserAccount[] = JSON.parse(usersListStr);

          usersList = usersList.filter(u => u.email.toLowerCase() !== targetUser.email.toLowerCase() && (u as any).username !== targetKey);
          localStorage.setItem('store_reports_users', JSON.stringify(usersList));

          // Cleanup user data keys
          localStorage.removeItem(`store_reports_stores_${targetKey}`);
          localStorage.removeItem(`store_reports_records_${targetKey}`);
          localStorage.removeItem(`store_reports_active_id_${targetKey}`);
          localStorage.removeItem(`store_reports_contracts_${targetKey}`);
          localStorage.removeItem(`store_reports_google_uid_${targetKey}`);

          showToast('success', `Đã xóa hoàn toàn tài khoản "${targetUser.email}".`);
          loadUsersData();
        } catch (e) {
          console.error(e);
          showToast('error', 'Gặp lỗi trong quá trình xóa tài khoản.');
        }
      },
      true,
      'Xóa vĩnh viễn'
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-sky-500/20">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            title="Quay lại Bảng điều khiển"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-sky-500/20 border border-purple-500/30 text-purple-400 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-zinc-100 tracking-tight">
                  TRUNG TÂM QUẢN TRỊ TOÀN HỆ THỐNG
                </h1>
                <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-800/60 text-purple-400 text-[10px] font-black uppercase rounded-full">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Quản lý tập trung tài khoản Google, danh mục cửa hàng và dữ liệu tài chính
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadUsersData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>Làm mới</span>
        </button>
      </header>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
                : 'bg-red-950/90 border-red-800 text-red-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-purple-500 text-purple-400 bg-zinc-900/40 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Tổng quan hệ sinh thái</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400 bg-zinc-900/40 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh sách tài khoản Google ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`py-3 px-4 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'stores'
                ? 'border-purple-500 text-purple-400 bg-zinc-900/40 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>Cơ sở cửa hàng ({allStores.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-purple-500 text-purple-400 bg-zinc-900/40 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Nhật ký bảo mật Google Auth</span>
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Tài khoản Google</span>
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-zinc-100">{systemStats.totalUsers}</div>
                <p className="text-[10px] text-zinc-500 mt-1">Đã xác thực qua Google OAuth</p>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Tổng cửa hàng</span>
                  <StoreIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-zinc-100">{systemStats.totalStores}</div>
                <p className="text-[10px] text-zinc-500 mt-1">Đang hoạt động trên hệ thống</p>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Doanh thu toàn hệ thống</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">{formatVND(systemStats.totalRevenue)}</div>
                <p className="text-[10px] text-zinc-500 mt-1">{systemStats.totalRecords} bản ghi P&L</p>
              </div>

              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider">Lợi nhuận toàn hệ thống</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">{formatVND(systemStats.totalProfit)}</div>
                <p className="text-[10px] text-zinc-500 mt-1">Biên LN: {systemStats.systemMargin.toFixed(1)}%</p>
              </div>
            </div>

            {/* Quick Banner */}
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-2xl shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-100">Chuẩn hóa danh tính Google</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Hệ thống chỉ cho phép xác thực bằng Email Google chính chủ để đảm bảo an toàn tuyệt đối và phân quyền tập trung.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenAddUser}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-sm shrink-0"
              >
                + Cấp quyền tài khoản Google
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 w-full max-w-md">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Tìm kiếm Email Google, Họ tên..."
                  className="bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="Chủ cửa hàng">Chủ cửa hàng</option>
                  <option value="Quản trị viên">Quản trị viên</option>
                </select>

                <button
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cấp quyền mới</span>
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="p-4">Tài khoản Google</th>
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4">Cơ sở dữ liệu</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                          Không tìm thấy tài khoản Google nào.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const userStoresCount = allStores.filter(s => s.ownerEmail.toLowerCase() === u.email.toLowerCase()).length;
                        const userRecsCount = allRecords.filter(r => r.ownerEmail.toLowerCase() === u.email.toLowerCase()).length;
                        const isSelf = u.email.toLowerCase() === currentUser.replace('google:', '').toLowerCase();

                        return (
                          <tr key={u.email} className="hover:bg-zinc-850/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                {u.photoURL ? (
                                  <img 
                                    src={u.photoURL} 
                                    alt={u.fullName} 
                                    className="w-7 h-7 rounded-lg object-cover border border-sky-500/30 shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center text-xs shrink-0">
                                    {u.fullName.substring(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-zinc-200">{u.email}</span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded text-[9px] font-bold">
                                        Bạn
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    Google Verified
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-zinc-300">{u.fullName}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                u.role === 'Quản trị viên'
                                  ? 'bg-purple-950/60 border border-purple-800/40 text-purple-400'
                                  : 'bg-zinc-950/60 border border-zinc-800 text-zinc-400'
                              }`}>
                                {u.role === 'Quản trị viên' ? <Shield className="w-3 h-3 text-purple-400" /> : <Briefcase className="w-3 h-3 text-zinc-500" />}
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-400 font-mono">
                              {u.phone || <span className="text-zinc-600">N/A</span>}
                            </td>
                            <td className="p-4 text-zinc-400">
                              <span className="font-bold text-zinc-200 font-mono">{userStoresCount}</span> shop • <span className="font-bold text-zinc-200 font-mono">{userRecsCount}</span> số liệu
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setActiveLogsUser(u);
                                    setIsLogsModalOpen(true);
                                  }}
                                  className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
                                  title="Xem nhật ký bảo mật"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-sky-400 rounded-lg transition-colors cursor-pointer"
                                  title="Chỉnh sửa phân quyền"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={isSelf}
                                  className={`p-1.5 bg-zinc-950 border border-zinc-850 rounded-lg transition-colors cursor-pointer ${
                                    isSelf 
                                      ? 'opacity-30 cursor-not-allowed text-zinc-600' 
                                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-red-400'
                                  }`}
                                  title={isSelf ? 'Không thể tự xóa mình' : 'Xóa tài khoản này'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Stores Management */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 w-full max-w-md">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={storeQuery}
                  onChange={(e) => setStoreQuery(e.target.value)}
                  placeholder="Tìm kiếm tên cửa hàng, chủ sở hữu, địa chỉ..."
                  className="bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>

              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả ngành nghề</option>
                {Object.entries(INDUSTRIES).map(([key, info]) => (
                  <option key={key} value={key}>{info.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="p-4">Tên Cửa Hàng</th>
                      <th className="p-4">Chủ sở hữu (Google)</th>
                      <th className="p-4">Ngành nghề</th>
                      <th className="p-4">Doanh thu</th>
                      <th className="p-4">Lợi nhuận</th>
                      <th className="p-4">Biên LN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                          Chưa có cơ sở cửa hàng nào.
                        </td>
                      </tr>
                    ) : (
                      filteredStores.map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-850/30 transition-colors">
                          <td className="p-4 font-bold text-zinc-100">{s.name}</td>
                          <td className="p-4">
                            <div className="font-semibold text-zinc-300">{s.owner}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{s.ownerEmail}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400 font-medium">
                              {INDUSTRIES[s.industry]?.name || s.industry}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-amber-400">{formatVND(s.totalRevenue)}</td>
                          <td className="p-4 font-bold text-emerald-400">{formatVND(s.totalProfit)}</td>
                          <td className="p-4 font-bold text-zinc-300">{s.avgMargin.toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 w-full max-w-md">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={logQuery}
                  onChange={(e) => setLogQuery(e.target.value)}
                  placeholder="Lọc nhật ký theo Email, sự kiện, IP..."
                  className="bg-transparent border-none text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="p-4">Thời gian</th>
                      <th className="p-4">Tài khoản Google</th>
                      <th className="p-4">Sự kiện</th>
                      <th className="p-4">Địa chỉ IP</th>
                      <th className="p-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500 font-sans">
                          Chưa có nhật ký bảo mật nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.slice(0, 100).map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-zinc-850/30 transition-colors">
                          <td className="p-4 text-zinc-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                          <td className="p-4 font-sans">
                            <span className="font-bold text-zinc-200">{log.fullName}</span>
                            <span className="text-[10px] text-zinc-500 block font-mono">{log.userEmail}</span>
                          </td>
                          <td className="p-4 font-sans text-zinc-300 font-medium">{log.action}</td>
                          <td className="p-4 text-zinc-400">{log.ipAddress}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              log.status === 'Thành công'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                                : 'bg-red-950 text-red-400 border border-red-900/50'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* User Create / Edit Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-sm text-zinc-100">
                    {editingUser ? 'Chỉnh sửa tài khoản Google' : 'Cấp quyền tài khoản Google'}
                  </h3>
                </div>
                <button onClick={() => setIsUserModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Email tài khoản Google (Bắt buộc)
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    value={userForm.email}
                    onChange={(e) => setUserForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="example@gmail.com"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 disabled:opacity-60 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Họ và tên hiển thị
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) => setUserForm(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0988123456"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    Phân quyền người dùng
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(p => ({ ...p, role: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Chủ cửa hàng">Chủ cửa hàng (Quản lý cửa hàng & P&L riêng)</option>
                    <option value="Quản trị viên">Quản trị viên (Toàn quyền quản trị hệ thống)</option>
                  </select>
                </div>

                {!editingUser && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="seedSample"
                      checked={userForm.seedSampleData}
                      onChange={(e) => setUserForm(p => ({ ...p, seedSampleData: e.target.checked }))}
                      className="rounded bg-zinc-950 border-zinc-800 text-sky-500 focus:ring-0"
                    />
                    <label htmlFor="seedSample" className="text-xs text-zinc-400 cursor-pointer">
                      Nạp sẵn 4 cửa hàng và dữ liệu mẫu kiểm thử ban đầu
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl text-xs font-extrabold shadow-sm"
                  >
                    {editingUser ? 'Lưu thay đổi' : 'Cấp quyền tài khoản'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Logs Modal */}
      <AnimatePresence>
        {isLogsModalOpen && activeLogsUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-sm text-zinc-100">
                    Nhật ký xác thực Google: {activeLogsUser.fullName} ({activeLogsUser.email})
                  </h3>
                </div>
                <button onClick={() => setIsLogsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {activeLogsUser.securityLogs && activeLogsUser.securityLogs.length > 0 ? (
                  activeLogsUser.securityLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-xs flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-zinc-200">{log.action}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {new Date(log.timestamp).toLocaleString('vi-VN')} • IP: {log.ipAddress}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/40 rounded text-[9px] font-bold">
                        {log.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-6">Chưa có nhật ký cho tài khoản này.</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsLogsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
