export type IndustryType = 'bia_nuoc_giai_khat' | 'hang_nong_san' | 'tap_hoa' | 'ca_phe' | 'nha_hang' | 'cay_canh' | 'giuong_tu_ban_ghe' | 'do_dung_em_be' | 'vat_lieu_xay_dung' | 'khac';

export interface IndustryInfo {
  id: IndustryType;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  benchmarkMargin: number; // expected average profit margin (e.g. 0.12)
  costRatio: number; // expected cost of goods & operating expense ratio (75% to 90%, e.g. 0.88)
  costRatioPercent: number; // e.g. 88
  costRatioDescription: string;
}

export interface ProjectionParams {
  histOwnCapital: number;
  histVcbLoan: number;
  histOtherCapital: number;
  histTurnover: number;
  histDepreciation: number;
  histInterest: number;
  histOtherExpense: number;
  histTax: number;
  histLc: number;
  histGuarantee: number;

  projOwnCapital: number;
  projVcbLoan: number;
  projOtherCapital: number;
  projTurnover: number;
  projDepreciation: number;
  projOtherExpense: number;
  vcbInterestRate: number;
  projTaxRate: number;
  projLc: number;
  projGuarantee: number;

  arDays: number;
  apDays: number;
  invDays: number;
  reductionRate: number;
  remainingDays?: number;
}

export interface Store {
  id: string;
  name: string;
  industry: IndustryType;
  address: string;
  notes: string;
  createdAt: string;
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
  citizenId?: string;
  representativeName?: string;
  projectionParams?: ProjectionParams;
}

export interface BankConfig {
  code: string;
  name: string;
  shortName: string;
  color: string;
  logoText: string;
}

export const SUPPORTED_BANKS: BankConfig[] = [
  { code: 'VCB', name: 'Vietcombank', shortName: 'Vietcombank', color: '#4CAF50', logoText: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank', shortName: 'Techcombank', color: '#E53935', logoText: 'Techcombank' },
  { code: 'MB', name: 'MB Bank', shortName: 'MB Bank', color: '#1E40AF', logoText: 'MB Bank' },
  { code: 'CTG', name: 'VietinBank', shortName: 'VietinBank', color: '#0284C7', logoText: 'VietinBank' },
  { code: 'BID', name: 'BIDV', shortName: 'BIDV', color: '#059669', logoText: 'BIDV' },
  { code: 'ACB', name: 'ACB', shortName: 'ACB', color: '#0254A5', logoText: 'ACB' },
];

export interface SalesRecord {
  id: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  revenue: number; // VND
  expense: number; // VND
  profit: number; // VND (revenue - expense)
  notes: string;
}

export const INDUSTRIES: Record<IndustryType, IndustryInfo> = {
  bia_nuoc_giai_khat: {
    id: 'bia_nuoc_giai_khat',
    name: 'Bia & Nước ngọt',
    icon: 'Beer',
    color: '#eab308', // yellow
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-900/30',
    benchmarkMargin: 0.12, // 12%
    costRatio: 0.88, // 88% (75% - 90%)
    costRatioPercent: 88,
    costRatioDescription: '88% Doanh thu (Chi phí nhập bia, nước giải khát & vận chuyển)',
  },
  hang_nong_san: {
    id: 'hang_nong_san',
    name: 'Hàng nông sản',
    icon: 'Sprout',
    color: '#10b981', // emerald
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-900/30',
    benchmarkMargin: 0.13, // 13%
    costRatio: 0.87, // 87% (75% - 90%)
    costRatioPercent: 87,
    costRatioDescription: '87% Doanh thu (Chi phí thu mua nông sản, bao bì & hao hụt)',
  },
  tap_hoa: {
    id: 'tap_hoa',
    name: 'Cửa hàng Tạp hóa',
    icon: 'ShoppingBag',
    color: '#3b82f6', // blue
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-900/30',
    benchmarkMargin: 0.12, // 12%
    costRatio: 0.88, // 88% (75% - 90%)
    costRatioPercent: 88,
    costRatioDescription: '88% Doanh thu (Chi phí giá vốn hàng tiêu dùng & bách hóa)',
  },
  ca_phe: {
    id: 'ca_phe',
    name: 'Quán Cà phê',
    icon: 'Coffee',
    color: '#845ec2', // purple/brown accent
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-900/30',
    benchmarkMargin: 0.25, // 25%
    costRatio: 0.75, // 75% (75% - 90%)
    costRatioPercent: 75,
    costRatioDescription: '75% Doanh thu (Chi phí hạt cà phê, sữa, trà, hoa quả & pha chế)',
  },
  nha_hang: {
    id: 'nha_hang',
    name: 'Nhà hàng Ẩm thực',
    icon: 'Utensils',
    color: '#f43f5e', // rose-500
    bgColor: 'bg-rose-50 dark:bg-rose-950/20',
    borderColor: 'border-rose-200 dark:border-rose-900/30',
    benchmarkMargin: 0.22, // 22%
    costRatio: 0.78, // 78% (75% - 90%)
    costRatioPercent: 78,
    costRatioDescription: '78% Doanh thu (Chi phí thực phẩm tươi sống, bếp & nhân công)',
  },
  cay_canh: {
    id: 'cay_canh',
    name: 'Kinh doanh & Vườn Cây cảnh',
    icon: 'Sprout',
    color: '#16a34a', // green-600
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-900/30',
    benchmarkMargin: 0.24, // 24%
    costRatio: 0.76, // 76% (75% - 90%)
    costRatioPercent: 76,
    costRatioDescription: '76% Doanh thu (Chi phí cây giống, chậu kiểng, phân bón & chăm sóc)',
  },
  giuong_tu_ban_ghe: {
    id: 'giuong_tu_ban_ghe',
    name: 'Sản xuất Giường, Tủ, Bàn, Ghế',
    icon: 'Armchair',
    color: '#d97706', // amber-600
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-900/30',
    benchmarkMargin: 0.17, // 17%
    costRatio: 0.83, // 83% (75% - 90%)
    costRatioPercent: 83,
    costRatioDescription: '83% Doanh thu (Chi phí phôi gỗ, ván ép, phụ kiện kim khí & mộc)',
  },
  do_dung_em_be: {
    id: 'do_dung_em_be',
    name: 'Đồ dùng & Sinh hoạt em bé',
    icon: 'Baby',
    color: '#ec4899', // pink-500
    bgColor: 'bg-pink-50 dark:bg-pink-950/20',
    borderColor: 'border-pink-200 dark:border-pink-900/30',
    benchmarkMargin: 0.20, // 20%
    costRatio: 0.80, // 80% (75% - 90%)
    costRatioPercent: 80,
    costRatioDescription: '80% Doanh thu (Chi phí nhập khẩu đồ dùng mẹ & bé, tã sữa cao cấp)',
  },
  vat_lieu_xay_dung: {
    id: 'vat_lieu_xay_dung',
    name: 'Mua bán Vật liệu xây dựng',
    icon: 'HardHat',
    color: '#ea580c', // orange-600
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-900/30',
    benchmarkMargin: 0.14, // 14%
    costRatio: 0.86, // 86% (75% - 90%)
    costRatioPercent: 86,
    costRatioDescription: '86% Doanh thu (Chi phí sắt thép, xi măng, cát đá, gạch & vận chuyển)',
  },
  khac: {
    id: 'khac',
    name: 'Ngành nghề khác',
    icon: 'Store',
    color: '#10b981', // emerald
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-200 dark:border-emerald-900/30',
    benchmarkMargin: 0.18, // 18%
    costRatio: 0.82, // 82% (75% - 90%)
    costRatioPercent: 82,
    costRatioDescription: '82% Doanh thu (Chi phí SXKD theo định mức ngành)',
  },
};

export interface ContractItem {
  itemName: string;
  quantity: number;
  sellingUnitPrice: number; // Unit price selling to public
  contractUnitPrice: number; // 7% lower than sellingUnitPrice (giảm 7% so với giá niêm yết)
  totalAmount: number; // quantity * contractUnitPrice
}

export interface PurchaseContract {
  id: string;
  storeId: string;
  createdAt: string; // YYYY-MM-DD
  contractNumber: string; // HDMB-YYYYMMDD-XXXX
  
  // Buyer (Store Info)
  buyerName: string;
  buyerAddress: string;
  buyerRepresentative: string; // Full name of buyer or owner
  buyerPhone?: string;
  buyerBankName?: string;
  buyerBankAccount?: string;
  buyerBankOwner?: string;
  
  // Seller Info (Input from user)
  sellerName: string;
  sellerCitizenId: string; // Số căn cước
  sellerAddress: string;
  sellerBankAccount: string;
  sellerBankName: string;
  
  // Items (Single item root fields preserved for backwards compatibility)
  itemName: string;
  quantity: number;
  sellingUnitPrice: number;
  contractUnitPrice: number;
  totalAmount: number;
  
  // Multiple items list
  items?: ContractItem[];
  notes?: string;
  depositAmount?: number; // Số tiền đặt cọc
  contractType?: 'input' | 'output'; // input: store buys goods from someone, output: store sells goods to someone
  discountPercent?: number; // Tỷ lệ giảm giá/chiết khấu so với giá niêm yết
}

export interface SecurityLog {
  id: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  status: 'Thành công' | 'Thất bại' | 'Cảnh báo';
  userAgent: string;
}

export interface UserAccount {
  uid: string;
  email: string;
  fullName: string;
  photoURL?: string | null;
  phone?: string;
  role: 'Chủ cửa hàng' | 'Quản trị viên';
  createdAt: string;
  lastLogin: string;
  securityLogs: SecurityLog[];
}

