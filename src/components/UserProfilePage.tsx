import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  User, 
  Clock, 
  Globe, 
  Activity, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCw, 
  LogOut, 
  Mail, 
  Phone, 
  Save, 
  ArrowLeft,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { Store, SalesRecord, UserAccount, SecurityLog, PurchaseContract } from '../types';
import { sampleStores, sampleRecords } from '../utils/sampleData';
import { syncUserDataToFirestore } from '../lib/firebase';

interface UserProfilePageProps {
  currentUser: string;
  stores: Store[];
  records: SalesRecord[];
  contracts?: PurchaseContract[];
  onLogout: () => void;
  onUpdateData: (stores: Store[], records: SalesRecord[], contracts?: PurchaseContract[]) => void;
  onShowConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger?: boolean,
    confirmText?: string,
    cancelText?: string
  ) => void;
  onBackToDashboard: () => void;
}

export default function UserProfilePage({
  currentUser,
  stores,
  records,
  contracts = [],
  onLogout,
  onUpdateData,
  onShowConfirm,
  onBackToDashboard
}: UserProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'database'>('profile');
  const [user, setUser] = useState<UserAccount | null>(null);

  // Profile edit states
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Load user data helper
  const reloadUserData = () => {
    const existingUsersStr = localStorage.getItem('store_reports_users') || '[]';
    let users: UserAccount[] = [];
    try {
      users = JSON.parse(existingUsersStr);
    } catch (e) {
      users = [];
    }

    const email = currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser;
    const found = users.find(u => (u as any).username === currentUser || u.email === email);
    if (found) {
      setUser(found);
      setEditFullName(found.fullName || '');
      setEditPhone(found.phone || '');
    } else {
      const fallback: UserAccount = {
        uid: currentUser,
        email: email,
        fullName: email.split('@')[0],
        photoURL: null,
        phone: '',
        role: email === 'meizutq@gmail.com' ? 'Quản trị viên' : 'Chủ cửa hàng',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        securityLogs: []
      };
      setUser(fallback);
      setEditFullName(fallback.fullName);
    }
  };

  useEffect(() => {
    reloadUserData();
  }, [currentUser]);

  // Handle profile save submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!editFullName.trim()) {
      setProfileError('Vui lòng nhập họ và tên hiển thị.');
      return;
    }

    setProfileLoading(true);

    try {
      const existingUsersStr = localStorage.getItem('store_reports_users') || '[]';
      let users: UserAccount[] = JSON.parse(existingUsersStr);
      const email = currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser;

      const targetIdx = users.findIndex(u => (u as any).username === currentUser || u.email === email);
      if (targetIdx !== -1) {
        users[targetIdx].fullName = editFullName.trim();
        users[targetIdx].phone = editPhone.trim();
        localStorage.setItem('store_reports_users', JSON.stringify(users));
        setUser(users[targetIdx]);
      }

      // Sync updated profile to Firestore
      const firestoreUid = localStorage.getItem(`store_reports_google_uid_${currentUser}`) || user?.uid || currentUser;
      await syncUserDataToFirestore(firestoreUid, {
        fullName: editFullName.trim(),
        phone: editPhone.trim()
      });

      setProfileSuccess('Cập nhật thông tin cá nhân thành công!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError('Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Export Data as JSON
  const handleExportData = () => {
    // Enrich each store with capital plan parameters if saved in localStorage
    const enrichedStores = stores.map((s) => {
      let params = s.projectionParams;
      if (!params) {
        try {
          const item = localStorage.getItem(`projection_params_${s.id}`);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed === 'object') params = parsed;
          }
        } catch (e) {
          console.warn('Lỗi đọc projection_params:', e);
        }
      }
      return {
        ...s,
        ...(params ? { projectionParams: params } : {})
      };
    });

    const exportData = {
      exportVersion: '2.1.0',
      exportDate: new Date().toISOString(),
      user: {
        email: user?.email,
        fullName: user?.fullName,
        role: user?.role
      },
      stores: enrichedStores,
      records,
      contracts,
      securityLogs: user?.securityLogs || []
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ProFinance_Backup_${user?.email || 'user'}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (!parsed.stores || !Array.isArray(parsed.stores) || !parsed.records || !Array.isArray(parsed.records)) {
            alert('Tệp tin sao lưu không đúng cấu trúc hợp lệ của Pro-Finance.');
            return;
          }

          const importedContracts = Array.isArray(parsed.contracts) ? parsed.contracts : [];

          // Persist capital plans for each store to localStorage so the UI renders immediately
          parsed.stores.forEach((s: any) => {
            if (s.projectionParams) {
              try {
                localStorage.setItem(`projection_params_${s.id}`, JSON.stringify(s.projectionParams));
              } catch (err) {
                console.warn('Lỗi lưu projection_params khi import:', err);
              }
            }
          });

          const applyImport = async () => {
            onUpdateData(parsed.stores, parsed.records, importedContracts);
            const firestoreUid = localStorage.getItem(`store_reports_google_uid_${currentUser}`) || currentUser;
            await syncUserDataToFirestore(firestoreUid, {
              stores: parsed.stores,
              records: parsed.records,
              contracts: importedContracts,
              activeStoreId: parsed.stores[0]?.id || ''
            });
            alert('Đã phục hồi cơ sở dữ liệu và phương án vốn ngắn hạn thành công!');
          };

          if (onShowConfirm) {
            onShowConfirm(
              'Ghi đè dữ liệu từ tệp sao lưu',
              `Tệp chứa ${parsed.stores.length} cửa hàng và ${parsed.records.length} bản ghi doanh thu. Bạn có muốn ghi đè lên dữ liệu hiện tại không?`,
              applyImport,
              true,
              'Ghi đè & Nhập'
            );
          } else {
            if (confirm('Bạn có chắc chắn muốn ghi đè cơ sở dữ liệu hiện tại bằng tệp tin này không?')) {
              applyImport();
            }
          }
        } catch (err) {
          alert('Không thể đọc tệp sao lưu JSON. Vui lòng kiểm tra lại định dạng tệp.');
        }
      };
    }
  };

  // Load Sample Data
  const handleLoadSampleDataForUser = () => {
    const doSeed = async () => {
      onUpdateData(sampleStores, sampleRecords);
      const firestoreUid = localStorage.getItem(`store_reports_google_uid_${currentUser}`) || currentUser;
      await syncUserDataToFirestore(firestoreUid, {
        stores: sampleStores,
        records: sampleRecords,
        activeStoreId: sampleStores[0]?.id || ''
      });
      alert('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
    };

    if (onShowConfirm) {
      onShowConfirm(
        'Nạp lại dữ liệu mẫu',
        'Bạn có muốn ghi đè toàn bộ dữ liệu hiện tại bằng bộ dữ liệu mẫu mặc định để kiểm thử báo cáo không?',
        doSeed,
        true,
        'Ghi đè dữ liệu'
      );
    } else {
      if (confirm('Bạn có muốn ghi đè toàn bộ dữ liệu hiện tại bằng bộ dữ liệu mẫu mặc định không?')) {
        doSeed();
      }
    }
  };

  // Wipe user's database
  const handleWipeDatabase = () => {
    const doWipe = async () => {
      onUpdateData([], []);
      const firestoreUid = localStorage.getItem(`store_reports_google_uid_${currentUser}`) || currentUser;
      await syncUserDataToFirestore(firestoreUid, {
        stores: [],
        records: [],
        activeStoreId: ''
      });
      alert('Đã xóa sạch dữ liệu của tài khoản.');
    };

    if (onShowConfirm) {
      onShowConfirm(
        'Xóa sạch toàn bộ dữ liệu',
        'CẢNH BÁO NGUY HIỂM: Thao tác này sẽ xóa vĩnh viễn toàn bộ cửa hàng, lịch sử doanh thu và hợp đồng của riêng tài khoản này. Không thể khôi phục sau khi xóa!',
        doWipe,
        true,
        'Xác nhận Xóa sạch'
      );
    } else {
      if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ cửa hàng và số liệu không?')) {
        doWipe();
      }
    }
  };

  const userEmail = user?.email || (currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser);
  const initials = (user?.fullName || userEmail).substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-3 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Top Breadcrumb & Return Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>Quay lại Bảng điều khiển</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 rounded-xl text-xs font-bold text-red-300 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất Google</span>
          </button>
        </div>

        {/* User Identity Banner Card */}
        <div className="p-5 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-3xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 blur-[80px] pointer-events-none rounded-full" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-500/40 shadow-lg shadow-sky-500/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-zinc-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                  {initials}
                </div>
              )}
              
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
                    {user?.fullName || userEmail}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Google Verified
                  </span>
                  <span className="px-2.5 py-0.5 bg-sky-950/80 border border-sky-800/60 text-sky-400 text-[10px] font-bold rounded-full">
                    {user?.role || 'Chủ cửa hàng'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">{userEmail}</p>
              </div>
            </div>

            {/* Quick KPI stats for this user */}
            <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-850 p-3 rounded-2xl">
              <div className="text-center px-2">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Cửa hàng</p>
                <p className="text-lg font-black text-zinc-200">{stores.length}</p>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div className="text-center px-2">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Bản ghi P&L</p>
                <p className="text-lg font-black text-emerald-400">{records.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-sky-500 text-sky-400 bg-zinc-900/40 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ sơ tài khoản Google</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-sky-500 text-sky-400 bg-zinc-900/40 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Nhật ký bảo mật & Phiên làm việc</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`py-3 px-4 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-sky-500 text-sky-400 bg-zinc-900/40 rounded-t-xl'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Quản lý dữ liệu & Sao lưu</span>
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-black text-zinc-100 uppercase tracking-wide">
                Thông tin định danh người dùng
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tài khoản được xác thực chính chủ thông qua Google OAuth 2.0. Mọi thông tin gắn liền với địa chỉ Email Google.
              </p>
            </div>

            {profileError && (
              <div className="p-3.5 bg-red-950/40 border border-red-900/40 text-red-300 rounded-2xl text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                  Email tài khoản Google (Không thay đổi)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={userEmail}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-400 rounded-xl text-sm cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                  Họ và tên hiển thị trong hệ thống
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-sm text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">
                  Số điện thoại liên hệ
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Ví dụ: 0988123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-sm text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-sky-500/10"
                >
                  {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu thông tin tài khoản</span>
                </button>
              </div>
            </form>

            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex items-start gap-3 text-xs text-zinc-400">
              <Shield className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-200">Xác thực Google OAuth an toàn</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  Tài khoản của bạn được bảo vệ với xác thực 2 bước (2FA) bởi Google. Không có rủi ro bị lộ mật khẩu cục bộ trên website.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security Logs */}
        {activeTab === 'security' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-zinc-100 uppercase tracking-wide">
                  Nhật ký truy cập và thao tác (Tối đa 50 sự kiện)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Lịch sử đăng nhập thông qua Google Identity và các thao tác cập nhật dữ liệu.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {user?.securityLogs && user.securityLogs.length > 0 ? (
                user.securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-zinc-200">{log.action}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-zinc-400" />
                          IP: {log.ipAddress}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 self-start sm:self-auto ${
                        log.status === 'Thành công'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
                          : 'bg-red-950 text-red-400 border border-red-900/50'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 text-xs">Chưa ghi nhận nhật ký bảo mật nào.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Database & Backup */}
        {activeTab === 'database' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-black text-zinc-100 uppercase tracking-wide">
                Quản trị cơ sở dữ liệu & Sao lưu
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Xuất tệp sao lưu JSON định dạng chuẩn hoặc khôi phục dữ liệu cửa hàng tài chính của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Export Card */}
              <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                    <Download className="w-4 h-4" />
                    <span>Xuất dữ liệu sao lưu (JSON)</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Kết xuất và tải xuống toàn bộ dữ liệu gồm {stores.length} cửa hàng và {records.length} nhật ký tài chính dưới dạng tệp JSON.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Tải xuống bản sao lưu (.json)</span>
                </button>
              </div>

              {/* Import Card */}
              <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                    <Upload className="w-4 h-4" />
                    <span>Phục hồi từ bản sao lưu (JSON)</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Tải lên tệp sao lưu Pro-Finance JSON hợp lệ để ghi đè và phục hồi cấu hình cửa hàng cũng như báo cáo.
                  </p>
                </div>
                <label className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Chọn tệp JSON và nạp phục hồi</span>
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>

            </div>

            {/* Danger Zone */}
            <div className="p-5 bg-zinc-950 border border-red-950/60 rounded-2xl space-y-4">
              <h3 className="text-xs font-black text-red-400 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Khu vực thao tác nâng cao</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2.5">
                  <p className="text-xs text-zinc-400">
                    Khôi phục dữ liệu mẫu ban đầu để kiểm thử nhanh biểu đồ và báo cáo.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSampleDataForUser}
                    className="px-3.5 py-2 bg-sky-950 hover:bg-sky-900 border border-sky-900/50 text-sky-400 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Nạp lại dữ liệu mẫu</span>
                  </button>
                </div>

                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2.5">
                  <p className="text-xs text-zinc-400">
                    Xóa toàn bộ các cửa hàng và lịch sử tài chính của riêng tài khoản này.
                  </p>
                  <button
                    type="button"
                    onClick={handleWipeDatabase}
                    className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-900/50 text-red-400 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Xóa sạch dữ liệu tài khoản</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
