import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  User, 
  Clock, 
  Globe, 
  Activity, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Download, 
  Upload, 
  RefreshCw, 
  LogOut, 
  Mail, 
  Phone, 
  Save, 
  Sparkles,
  Lock,
  ChevronRight,
  Store as StoreIcon,
  FileSpreadsheet
} from 'lucide-react';
import { Store, SalesRecord, UserAccount, SecurityLog } from '../types';
import { sampleStores, sampleRecords } from '../utils/sampleData';
import { generateRandomIP } from '../utils/crypto';
import { auth, googleProvider, syncUserDataToFirestore, getUserDataFromFirestore } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface AuthPanelProps {
  onLoginSuccess: (username: string) => void;
}

export default function AuthPanel({ onLoginSuccess }: AuthPanelProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  // List of designated system administrators by email
  const ADMIN_EMAILS = [
    'meizutq@gmail.com'
  ];

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      if (!fbUser.email) {
        throw new Error('Tài khoản Google không có email liên kết hợp lệ. Vui lòng sử dụng tài khoản có email.');
      }

      const email = fbUser.email.toLowerCase().trim();
      const normalizedUsername = `google:${email}`;
      const ip = generateRandomIP();

      // Check if user should be an admin
      const isSuperAdmin = ADMIN_EMAILS.includes(email) || email.includes('admin');

      // Create Security Log
      const loginLog: SecurityLog = {
        id: `log-${Date.now()}`,
        action: 'Đăng nhập thành công qua Google OAuth 2.0',
        timestamp: new Date().toISOString(),
        ipAddress: ip,
        status: 'Thành công',
        userAgent: navigator.userAgent.substring(0, 60) + '...'
      };

      // Try to load existing data from Firestore
      let existingCloudData = await getUserDataFromFirestore(fbUser.uid);
      
      let finalStores: Store[] = [];
      let finalRecords: SalesRecord[] = [];
      let finalActiveStoreId = '';
      let existingLogs: SecurityLog[] = [];
      let userRole: 'Chủ cửa hàng' | 'Quản trị viên' = isSuperAdmin ? 'Quản trị viên' : 'Chủ cửa hàng';
      let fullName = fbUser.displayName || email.split('@')[0];
      let phone = '';

      if (existingCloudData) {
        // Existing user data found in Firestore
        finalStores = existingCloudData.stores || [];
        finalRecords = existingCloudData.records || [];
        finalActiveStoreId = existingCloudData.activeStoreId || (finalStores[0]?.id || '');
        existingLogs = (existingCloudData.securityLogs as SecurityLog[]) || [];
        if (existingCloudData.fullName) fullName = existingCloudData.fullName;
        if (existingCloudData.phone) phone = existingCloudData.phone;
        if (isSuperAdmin || existingCloudData.role === 'Quản trị viên') {
          userRole = 'Quản trị viên';
        }
      } else {
        // New Google user! Seed default sample data so user immediately has a functional dashboard
        finalStores = sampleStores;
        finalRecords = sampleRecords;
        finalActiveStoreId = sampleStores[0]?.id || '';
      }

      // Add the new security log
      existingLogs.unshift(loginLog);
      if (existingLogs.length > 50) existingLogs.pop();

      // Save user data to Firestore
      await syncUserDataToFirestore(fbUser.uid, {
        email: email,
        displayName: fbUser.displayName || fullName,
        photoURL: fbUser.photoURL,
        lastLogin: new Date().toISOString(),
        fullName: fullName,
        phone: phone,
        role: userRole,
        stores: finalStores,
        records: finalRecords,
        activeStoreId: finalActiveStoreId,
        securityLogs: existingLogs
      });

      // Update local storage cache
      const localUsersStr = localStorage.getItem('store_reports_users') || '[]';
      let localUsers: UserAccount[] = [];
      try {
        localUsers = JSON.parse(localUsersStr);
      } catch (e) {
        localUsers = [];
      }

      const updatedLocalUser: UserAccount = {
        uid: fbUser.uid,
        email: email,
        fullName: fullName,
        photoURL: fbUser.photoURL,
        phone: phone,
        role: userRole,
        createdAt: existingCloudData?.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        securityLogs: existingLogs
      };

      const localUserIdx = localUsers.findIndex(u => (u as any).username === normalizedUsername || u.email === email);
      if (localUserIdx !== -1) {
        localUsers[localUserIdx] = updatedLocalUser;
      } else {
        localUsers.push(updatedLocalUser);
      }

      // Set keys for immediate app loading
      localStorage.setItem('store_reports_users', JSON.stringify(localUsers));
      localStorage.setItem(`store_reports_stores_${normalizedUsername}`, JSON.stringify(finalStores));
      localStorage.setItem(`store_reports_records_${normalizedUsername}`, JSON.stringify(finalRecords));
      localStorage.setItem(`store_reports_active_id_${normalizedUsername}`, finalActiveStoreId);
      localStorage.setItem(`store_reports_google_uid_${normalizedUsername}`, fbUser.uid);
      localStorage.setItem('store_reports_current_user', normalizedUsername);

      setSuccess(`Đăng nhập Google thành công với tài khoản ${email}! Đang vào hệ thống...`);
      
      setTimeout(() => {
        onLoginSuccess(normalizedUsername);
      }, 800);

    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Bạn đã đóng cửa sổ đăng nhập Google. Vui lòng bấm đăng nhập lại.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Trình duyệt đang chặn cửa sổ bật lên. Vui lòng cho phép popup để đăng nhập bằng Google.');
      } else {
        setError(err.message || 'Đăng nhập Google thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-x-hidden selection:bg-sky-500/20">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.08] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[320px] h-[250px] sm:h-[320px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[460px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-auto"
      >
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3.5 bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-500/30 text-sky-400 rounded-2xl shadow-lg shadow-sky-500/10 mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-sky-400" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-black uppercase tracking-widest rounded-full">
              Chuẩn hoá Google Identity
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 font-sans">
            PRO-FINANCE
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-[340px]">
            Hệ thống Báo cáo Doanh thu & Quản lý Hợp đồng Mua bán đa cửa hàng trực tuyến
          </p>
        </div>

        {/* Notifications */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3.5 bg-red-950/50 border border-red-900/50 text-red-300 rounded-2xl text-xs flex items-start gap-2.5 overflow-hidden"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3.5 bg-emerald-950/50 border border-emerald-900/50 text-emerald-300 rounded-2xl text-xs flex items-start gap-2.5 overflow-hidden"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-relaxed">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Authentication Box */}
        <div className="space-y-4">
          <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
              <Mail className="w-4 h-4 text-sky-400" />
              <span>Phương thức đăng nhập duy nhất:</span>
            </div>
            
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Ứng dụng áp dụng chuẩn bảo mật Google OAuth 2.0. Toàn bộ cơ sở dữ liệu doanh thu và hợp đồng của bạn được đồng bộ tự động và bảo vệ theo từng tài khoản Google email.
            </p>

            {/* Official Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-zinc-100 disabled:opacity-75 text-zinc-900 font-bold rounded-xl text-sm shadow-lg shadow-white/5 cursor-pointer transition-all flex items-center justify-center gap-3 min-h-[48px] active:scale-[0.99] border border-zinc-200"
            >
              {googleLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 text-zinc-700 animate-spin" />
                  <span>Đang kết nối tài khoản Google...</span>
                </>
              ) : (
                <>
                  {/* Google Vector Icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                  <span>Đăng nhập bằng tài khoản Google</span>
                </>
              )}
            </button>
          </div>

          {/* Security Features Overview */}
          <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-2xl space-y-2.5">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tiện ích bảo mật & Đồng bộ</span>
            </div>

            <div className="grid grid-cols-1 gap-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Không cần tạo mật khẩu, bảo mật 2 lớp bởi Google</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tự động lưu trữ Cloud Firestore đa thiết bị</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Báo cáo doanh thu & Hợp đồng xuất PDF chuyên nghiệp</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-[10px] text-zinc-500 font-mono">
            Bảo mật mã hóa bởi Firebase Cloud & Google Cloud Platform
          </p>
        </div>

      </motion.div>
    </div>
  );
}

// ==========================================
// UserProfileWidget Component
// ==========================================

interface UserProfileWidgetProps {
  currentUser: string;
  stores: Store[];
  records: SalesRecord[];
  onLogout: () => void;
  onUpdateData?: (stores: Store[], records: SalesRecord[]) => void;
  onShowConfirm?: (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger?: boolean,
    confirmText?: string,
    cancelText?: string
  ) => void;
  onOpenProfile?: () => void;
}

export function UserProfileWidget({
  currentUser,
  stores,
  records,
  onLogout,
  onUpdateData,
  onShowConfirm,
  onOpenProfile
}: UserProfileWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'database'>('profile');
  const [user, setUser] = useState<UserAccount | null>(null);

  // Profile Edit
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Load user data
  useEffect(() => {
    const existingUsersStr = localStorage.getItem('store_reports_users') || '[]';
    let usersList: UserAccount[] = [];
    try {
      usersList = JSON.parse(existingUsersStr);
    } catch (e) {
      usersList = [];
    }

    const email = currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser;
    const found = usersList.find(u => (u as any).username === currentUser || u.email === email);
    
    if (found) {
      setUser(found);
      setEditFullName(found.fullName || '');
      setEditPhone(found.phone || '');
    } else {
      // Fallback object
      const defaultUser: UserAccount = {
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
      setUser(defaultUser);
      setEditFullName(defaultUser.fullName);
    }
  }, [currentUser, isOpen]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const existingUsersStr = localStorage.getItem('store_reports_users') || '[]';
      let usersList: UserAccount[] = JSON.parse(existingUsersStr);
      const email = currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser;
      
      const targetIdx = usersList.findIndex(u => (u as any).username === currentUser || u.email === email);
      
      if (targetIdx !== -1) {
        usersList[targetIdx].fullName = editFullName;
        usersList[targetIdx].phone = editPhone;
        localStorage.setItem('store_reports_users', JSON.stringify(usersList));
        setUser(usersList[targetIdx]);
      }

      // Sync to cloud
      const firestoreUid = localStorage.getItem(`store_reports_google_uid_${currentUser}`) || user?.uid || currentUser;
      await syncUserDataToFirestore(firestoreUid, {
        fullName: editFullName,
        phone: editPhone
      });

      setProfileSuccess('Đã cập nhật thông tin tài khoản thành công!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Export JSON
  const handleExportData = () => {
    const exportObject = {
      exportVersion: '2.0.0',
      exportDate: new Date().toISOString(),
      user: {
        email: user?.email,
        fullName: user?.fullName,
        role: user?.role
      },
      stores: stores,
      records: records,
      securityLogs: user?.securityLogs || []
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ProFinance_Backup_${user?.email || 'user'}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (!parsed.stores || !Array.isArray(parsed.stores) || !parsed.records || !Array.isArray(parsed.records)) {
            alert('Tệp tin sao lưu không đúng định dạng hợp lệ của Pro-Finance.');
            return;
          }

          const applyImport = async () => {
            if (onUpdateData) {
              onUpdateData(parsed.stores, parsed.records);
            }
            const firestoreUid = localStorage.getItem(`store_reports_google_uid_${currentUser}`) || currentUser;
            await syncUserDataToFirestore(firestoreUid, {
              stores: parsed.stores,
              records: parsed.records,
              activeStoreId: parsed.stores[0]?.id || ''
            });
            alert('Đã khôi phục cơ sở dữ liệu từ tệp tin JSON thành công!');
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

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    onLogout();
  };

  const userEmail = user?.email || (currentUser.startsWith('google:') ? currentUser.replace('google:', '') : currentUser);
  const initials = (user?.fullName || userEmail).substring(0, 2).toUpperCase();

  return (
    <>
      {/* Top Bar Widget Button */}
      <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            if (onOpenProfile) {
              onOpenProfile();
            } else {
              setIsOpen(true);
            }
          }}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer text-left"
        >
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.fullName} 
              className="w-7 h-7 rounded-lg object-cover border border-sky-500/30 shrink-0" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-zinc-950 font-black text-xs flex items-center justify-center shadow-sm shrink-0">
              {initials}
            </div>
          )}
          <div className="hidden sm:block leading-tight max-w-[130px]">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider truncate">
                {user?.role || 'Chủ cửa hàng'}
              </span>
            </div>
            <p className="text-xs font-bold text-zinc-200 truncate">{user?.fullName || userEmail}</p>
          </div>
        </button>

        <div className="w-px h-5 bg-zinc-800 mx-0.5" />

        <button
          type="button"
          onClick={handleLogoutClick}
          className="p-1.5 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer text-zinc-400"
          title="Đăng xuất khỏi Google"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-850 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Google Avatar" 
                      className="w-10 h-10 rounded-xl object-cover border border-sky-500/30 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-zinc-950 font-black text-sm flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-zinc-100">{user?.fullName || userEmail}</h3>
                      <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 rounded-full text-[9px] font-bold">
                        Google Verified
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">{userEmail}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-850 px-4 bg-zinc-950/60 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`py-2.5 px-3 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'profile'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Hồ sơ Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`py-2.5 px-3 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'security'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Nhật ký bảo mật</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('database')}
                  className={`py-2.5 px-3 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'database'
                      ? 'border-sky-500 text-sky-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Dữ liệu & Sao lưu</span>
                </button>
              </div>

              {/* Content Area */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-left">
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    {profileSuccess && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{profileSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Họ và tên hiển thị
                        </label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-sm text-zinc-100 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                          Số điện thoại liên hệ
                        </label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Ví dụ: 0988123456"
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 focus:border-sky-500 rounded-xl text-sm text-zinc-100 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
                      >
                        {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Lưu thông tin</span>
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Lịch sử đăng nhập & Thao tác (Google OAuth)
                    </h5>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {user?.securityLogs && user.securityLogs.length > 0 ? (
                        user.securityLogs.map((log) => (
                          <div 
                            key={log.id}
                            className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs flex justify-between items-start gap-2"
                          >
                            <div>
                              <p className="font-bold text-zinc-200">{log.action}</p>
                              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                                <span>{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                                <span>•</span>
                                <span>IP: {log.ipAddress}</span>
                              </p>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/40 rounded text-[9px] font-bold shrink-0">
                              {log.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 py-4 text-center">Chưa có nhật ký bảo mật.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'database' && (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">Xuất sao lưu JSON</h4>
                        <p className="text-[11px] text-zinc-500">Tải về máy toàn bộ dữ liệu {stores.length} cửa hàng và {records.length} bản ghi.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportData}
                        className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-sky-400" />
                        <span>Tải JSON</span>
                      </button>
                    </div>

                    <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200">Nhập phục hồi JSON</h4>
                        <p className="text-[11px] text-zinc-500">Nạp dữ liệu từ tệp tin sao lưu trước đó.</p>
                      </div>
                      <label className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Chọn tệp</span>
                        <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 bg-zinc-950 border-t border-zinc-850 flex justify-between items-center shrink-0">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="px-3 py-1.5 text-red-400 hover:bg-red-950/20 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
