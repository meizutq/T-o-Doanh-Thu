import React, { useState, useEffect, useRef } from 'react';
import { Store, SalesRecord, SUPPORTED_BANKS } from '../types';
import { formatVND } from '../utils/sampleData';
import * as XLSX from 'xlsx';
import { 
  X, 
  Download, 
  FileText, 
  CheckCircle2, 
  User, 
  CreditCard, 
  Clock, 
  Info,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Check,
  Sparkles,
  Coins,
  ArrowRightLeft,
  Upload,
  Trash2
} from 'lucide-react';

interface InvoiceModalProps {
  store: Store;
  record: SalesRecord;
  onClose: () => void;
}

interface InvoiceItem {
  no: number;
  name: string;
  unit: string;
  qty: number;
  price: number;
  total: number;
}

interface SubInvoice {
  id: number;
  invoiceNo: string;
  buyerName: string;
  buyerAddress: string;
  amount: number;
  items: InvoiceItem[];
  txTime: string;
  txCode: string;
  reference: string;
}

// Regional address pools for realistic generation
const REGION_DATA = {
  danang: {
    name: 'Đà Nẵng',
    streets: [
      'Nguyễn Văn Linh', 'Lê Duẩn', 'Điện Biên Phủ', 'Trần Hưng Đạo', 'Bạch Đằng',
      'Nguyễn Hữu Thọ', 'Phan Châu Trinh', 'Hùng Vương', 'Trường Chinh', 'Nguyễn Lương Bằng',
      'Võ Nguyên Giáp', 'Phạm Văn Đồng', 'Ngô Quyền', 'Cách Mạng Tháng Tám', 'Tôn Đức Thắng',
      '2 Tháng 9', '30 Tháng 4', 'Đống Đa', 'Quang Trung', 'Trần Phú', 'Hàm Nghi',
      'Nguyễn Văn Thoại', 'Lê Lợi', 'Hoàng Diệu', 'Phan Đăng Lưu', 'Trần Cao Vân',
      'Lê Đình Lý', 'Hải Phòng', 'Nguyễn Tất Thành', 'Nguyễn Chí Thanh', 'Yên Bái',
      'Lê Thanh Nghị', 'Tiểu La', 'Lê Sát', 'Xô Viết Nghệ Tĩnh', 'Trần Phước Phan',
      'Phan Tứ', 'Châu Thị Vĩnh Tế', 'Nguyễn Hữu Dật', 'Bùi Tá Hán', 'Lê Văn Hiến',
      'Lê Đại Hành', 'Phan Văn Định', 'Nguyễn Chánh', 'Hồ Tùng Mậu', 'Trần Nam Trung',
      'Võ Chí Công', 'Mai Đăng Chơn', 'Nam Kỳ Khởi Nghĩa', 'Nguyễn Tri Phương', 'Hồ Xuân Hương'
    ],
    districts: [
      'Quận Hải Châu, Đà Nẵng',
      'Quận Thanh Khê, Đà Nẵng',
      'Quận Liên Chiểu, Đà Nẵng',
      'Quận Sơn Trà, Đà Nẵng',
      'Quận Ngũ Hành Sơn, Đà Nẵng',
      'Quận Cẩm Lệ, Đà Nẵng',
      'Huyện Hòa Vang, Đà Nẵng'
    ]
  },
  hue: {
    name: 'Huế',
    streets: [
      'Lê Lợi', 'Hùng Vương', 'Bến Nghé', 'Đống Đa', 'Nguyễn Huệ',
      'Trần Hưng Đạo', 'Phan Đăng Lưu', 'Phan Bội Châu', 'Nguyễn Sinh Cung', 'Chi Lăng',
      'Phan Chu Trinh', 'Trần Quang Khải', 'Nguyễn Khuyến', 'Lâm Hoằng', 'Điện Biên Phủ',
      'Nguyễn Trãi', 'Lê Thánh Tôn', 'Đinh Tiên Hoàng', 'Đoàn Thị Điểm', 'Nhật Lệ',
      'Mai Thúc Loan', 'Huỳnh Thúc Kháng', 'Lê Trường An', 'Ngự Bình', 'Trần Phú'
    ],
    districts: [
      'Phường Vĩnh Ninh, TP. Huế',
      'Phường Phú Nhuận, TP. Huế',
      'Phường Trường An, TP. Huế',
      'Phường Thuận Lộc, TP. Huế',
      'Phường Phú Hội, TP. Huế',
      'Phường Vy Dạ, TP. Huế',
      'Phường Xuân Phú, TP. Huế',
      'Phường Hương Sơ, TP. Huế'
    ]
  },
  hcm: {
    name: 'Hồ Chí Minh',
    streets: [
      'Nguyễn Huệ', 'Lê Lợi', 'Đồng Khởi', 'Nam Kỳ Khởi Nghĩa', 'Cách Mạng Tháng Tám',
      'Điện Biên Phủ', 'Võ Thị Sáu', 'Nguyễn Thị Minh Khai', 'Trần Hưng Đạo', 'Nguyễn Trãi',
      'Ba Tháng Hai', 'Lý Thường Kiệt', 'Lê Hồng Phong', 'Phạm Văn Đồng', 'Xa Lộ Hà Nội',
      'Nguyễn Hữu Thọ', 'Hoàng Sa', 'Trường Sa', 'Phan Xích Long', 'Cộng Hòa', 'Nguyễn Văn Trỗi',
      'Trần Quốc Thảo', 'Lê Văn Sỹ', 'Nguyễn Kiệm', 'Gò Dầu', 'Tân Kỳ Tân Quý', 'Nguyễn Thị Thập'
    ],
    districts: [
      'Quận 1, TP. Hồ Chí Minh',
      'Quận 3, TP. Hồ Chí Minh',
      'Quận 5, TP. Hồ Chí Minh',
      'Quận 7, TP. Hồ Chí Minh',
      'Quận 10, TP. Hồ Chí Minh',
      'Quận Bình Thạnh, TP. Hồ Chí Minh',
      'Quận Phú Nhuận, TP. Hồ Chí Minh',
      'Quận Gò Vấp, TP. Hồ Chí Minh',
      'Quận Tân Bình, TP. Hồ Chí Minh',
      'Thành phố Thủ Đức, TP. Hồ Chí Minh'
    ]
  },
  hanoi: {
    name: 'Hà Nội',
    streets: [
      'Hoàn Kiếm', 'Trần Hưng Đạo', 'Bà Triệu', 'Phố Huế', 'Tràng Thi',
      'Lý Thường Kiệt', 'Hai Bà Trưng', 'Hàng Bông', 'Hàng Đào', 'Nguyễn Thái Học',
      'Kim Mã', 'Giảng Võ', 'Đê La Thành', 'Xã Đàn', 'Giải Phóng', 'Trường Chinh',
      'Nguyễn Trãi', 'Cầu Giấy', 'Xuân Thủy', 'Trần Duy Hưng', 'Nguyễn Chí Thanh',
      'Láng Hạ', 'Tây Sơn', 'Chùa Bộc', 'Thụy Khuê', 'Hoàng Hoa Thám', 'Phan Đình Phùng'
    ],
    districts: [
      'Quận Hoàn Kiếm, Hà Nội',
      'Quận Hai Bà Trưng, Hà Nội',
      'Quận Ba Đình, Hà Nội',
      'Quận Đống Đa, Hà Nội',
      'Quận Tây Hồ, Hà Nội',
      'Quận Cầu Giấy, Hà Nội',
      'Quận Thanh Xuân, Hà Nội',
      'Quận Hoàng Mai, Hà Nội',
      'Quận Long Biên, Hà Nội',
      'Quận Hà Đông, Hà Nội'
    ]
  }
};

const VIETNAMESE_BUYERS = [
  'Lê Hoàng Nam', 'Nguyễn Thị Minh Thư', 'Trần Thanh Sơn', 'Phạm Minh Đức', 'Vũ Hoài Nam',
  'Nguyễn Văn Trọng', 'Đỗ Thùy Linh', 'Hoàng Nhật Huy', 'Nguyễn Bảo Khánh', 'Trần Quốc Bảo',
  'Bùi Minh Tuấn', 'Nguyễn Hải Đăng', 'Phan Quốc Khánh', 'Đặng Hồng Nhung', 'Lê Quỳnh Anh',
  'Nguyễn Tiến Đạt', 'Trần Hữu Quyết', 'Phạm Ngọc Trinh', 'Vũ Việt Anh', 'Nguyễn Thanh Tùng',
  'Đỗ Minh Hoàng', 'Phan Thanh Trà', 'Võ Hoàng Yên', 'Nguyễn Thu Trang', 'Hoàng Công Danh',
  'Đặng Văn Lâm', 'Trần Mai Hoa', 'Bùi Xuân Huấn', 'Nguyễn Duy Mạnh', 'Vũ Cát Tường',
  'Phạm Thế Vinh', 'Nguyễn Hoàng Lâm', 'Trần Quốc Tuấn', 'Lê Thị Thu Hà', 'Hoàng Minh Khôi',
  'Nguyễn Văn An', 'Phan Ngọc Diệp', 'Đỗ Hoàng Quân', 'Vũ Thu Thảo', 'Bùi Tiến Dũng',
  'Nguyễn Mai Chi', 'Trần Anh Khoa', 'Phạm Hoài Thương', 'Lê Gia Bảo', 'Nguyễn Thành Nam',
  'Trần Thị Tuyết', 'Đặng Quang Huy', 'Vũ Phương Ly', 'Nguyễn Văn Đạt', 'Lê Hồng Vân',
  'Hoàng Khánh Nam', 'Trần Minh Khang', 'Phạm Thanh Trúc', 'Nguyễn Duy Bách', 'Phan Văn Trị',
  'Đỗ Thùy Trang', 'Bùi Hữu Đạt', 'Nguyễn Tuấn Kiệt', 'Vũ Ngọc Hân', 'Trần Thế Minh',
  'Lê Thảo Nhi', 'Nguyễn Phúc Lâm', 'Phạm Đình Phong', 'Hoàng Ngọc Ánh', 'Nguyễn Hữu Phước',
  'Trần Nhật Nam', 'Đặng Thúy Quỳnh', 'Vũ Quốc Anh', 'Lê Minh Tú', 'Nguyễn Đăng Khoa',
  'Bùi Khánh An', 'Trần Hà Phương', 'Phạm Tuấn Tú', 'Nguyễn Thụy Đan', 'Lê Quốc Trung'
];

// Helper to greedily get items for a specific split amount matching the store's industry
const getItemsForAmount = (
  amount: number, 
  industry: string, 
  customPool?: { name: string; unit: string; price: number }[]
): InvoiceItem[] => {
  const items: InvoiceItem[] = [];

  const beerPool = [
    { name: 'Bia Tiger Crystal (Thùng 24 lon 330ml)', unit: 'Thùng', price: 415000 },
    { name: 'Bia Heineken Silver (Thùng 24 lon 330ml)', unit: 'Thùng', price: 460000 },
    { name: 'Bia Saigon Special (Thùng 24 lon 330ml)', unit: 'Thùng', price: 345000 },
    { name: 'Bia Hà Nội Premium (Thùng 24 lon 330ml)', unit: 'Thùng', price: 280000 },
    { name: 'Bia 333 Premium (Thùng 24 lon 330ml)', unit: 'Thùng', price: 290000 },
    { name: 'Bia Sapporo Premium (Thùng 24 lon 330ml)', unit: 'Thùng', price: 485000 },
    { name: 'Bia Corona Extra (Thùng 24 chai 355ml)', unit: 'Thùng', price: 820000 },
    { name: 'Bia Budweiser (Thùng 24 lon 330ml)', unit: 'Thùng', price: 440000 },
    { name: 'Bia Larue Blue (Thùng 24 lon 330ml)', unit: 'Thùng', price: 265000 },
    { name: 'Bia Huda Gold (Thùng 24 lon 330ml)', unit: 'Thùng', price: 275000 },
    { name: 'Bia Blanc 1664 (Thùng 24 lon 330ml)', unit: 'Thùng', price: 510000 },
    { name: 'Bia Việt (Thùng 24 lon 330ml)', unit: 'Thùng', price: 260000 },
    { name: 'Bia Tiger Nâu (Thùng 24 lon 330ml)', unit: 'Thùng', price: 385000 },
    { name: 'Bia Heineken Thường (Thùng 24 lon 330ml)', unit: 'Thùng', price: 450000 },
    { name: 'Bia Sài Gòn Lager (Thùng 24 lon 330ml)', unit: 'Thùng', price: 260000 },
    { name: 'Nước tăng lực Red Bull Thái Lan (Thùng 24 lon)', unit: 'Thùng', price: 260000 },
    { name: 'Nước tăng lực Sting Hương Dâu (Thùng 24 chai 320ml)', unit: 'Thùng', price: 195000 },
    { name: 'Nước ngọt Coca-Cola vị nguyên bản (Thùng 24 lon 320ml)', unit: 'Thùng', price: 205000 },
    { name: 'Nước ngọt Pepsi Không Đường (Thùng 24 lon 320ml)', unit: 'Thùng', price: 195000 },
    { name: 'Nước ngọt 7Up vị chanh (Thùng 24 lon 320ml)', unit: 'Thùng', price: 190000 },
    { name: 'Trà xanh Không Độ (Thùng 24 chai 455ml)', unit: 'Thùng', price: 210000 },
    { name: 'Trà thanh nhiệt Dr. Thanh (Thùng 24 chai 350ml)', unit: 'Thùng', price: 200000 },
    { name: 'Nước uống vận động Revive Chanh Muối (Thùng 24 chai 500ml)', unit: 'Thùng', price: 180000 },
    { name: 'Nước khoáng thiên nhiên La Vie (Thùng 24 chai 500ml)', unit: 'Thùng', price: 110000 },
    { name: 'Nước tinh khiết Aquafina (Thùng 24 chai 500ml)', unit: 'Thùng', price: 105000 },
    { name: 'Trà sữa Kirin Latte (Thùng 24 chai 345ml)', unit: 'Thùng', price: 245000 },
    { name: 'Nước ép trái cây Twister Cam (Thùng 24 lon 320ml)', unit: 'Thùng', price: 215000 },
    { name: 'Sữa đậu nành Fami Nguyên Chất (Thùng 40 hộp 200ml)', unit: 'Thùng', price: 170000 },
    { name: 'Trà Ô Long TEA+ Plus (Thùng 24 chai 455ml)', unit: 'Thùng', price: 215000 },
    { name: 'Nước ngọt Mirinda Hương Xá Xị (Thùng 24 lon 320ml)', unit: 'Thùng', price: 190000 },
    { name: 'Nước ngọt Mirinda Hương Cam (Thùng 24 lon 320ml)', unit: 'Thùng', price: 190000 },
    { name: 'Nước ngọt Sprite vị chanh (Thùng 24 lon 320ml)', unit: 'Thùng', price: 195000 },
    { name: 'Nước uống sữa trái cây Nutri Boost (Thùng 24 chai 297ml)', unit: 'Thùng', price: 240000 },
    { name: 'Trà xanh C2 hương chanh (Thùng 24 chai 360ml)', unit: 'Thùng', price: 165000 },
    { name: 'Nước yến ngân nhĩ Tribeco (Thùng 24 lon 240ml)', unit: 'Thùng', price: 155000 },
    { name: 'Nước tăng lực Monster Energy (Thùng 24 lon 355ml)', unit: 'Thùng', price: 640000 },
    { name: 'Nước bù khoáng Pocari Sweat (Thùng 24 chai 500ml)', unit: 'Thùng', price: 310000 },
    { name: 'Nước uống sữa lên men Betagen (Thùng 40 chai 85ml)', unit: 'Thùng', price: 195000 },
    { name: 'Sữa tiệt trùng Milo lúa mạch (Thùng 48 hộp 180ml)', unit: 'Thùng', price: 375000 },
    { name: 'Nước uống sâm dứa nha đam (Thùng 24 chai 450ml)', unit: 'Thùng', price: 205000 },
    { name: 'Nước ép táo chín Vfresh (Thùng 12 hộp 1L)', unit: 'Thùng', price: 440000 },
    { name: 'Nước ép ổi tự nhiên Vfresh (Thùng 12 hộp 1L)', unit: 'Thùng', price: 410000 },
    { name: 'Nước bù điện giải ICY chanh muối (Thùng 24 chai 390ml)', unit: 'Thùng', price: 160000 },
    { name: 'Sữa đậu nành Goldsoy Vinamilk (Thùng 48 hộp 200ml)', unit: 'Thùng', price: 220000 },
    { name: 'Nước khoáng có ga Vĩnh Hảo (Thùng 24 chai 500ml)', unit: 'Thùng', price: 145000 },
    { name: 'Nước ép cà chua Vfresh (Thùng 12 hộp 1L)', unit: 'Thùng', price: 425000 },
    { name: 'Nước sâm thảo lượng bí đao Wonderfarm (Thùng 24 lon)', unit: 'Thùng', price: 160000 },
    { name: 'Nước khoáng kiềm thiên nhiên Vikoda (Thùng 24 chai 500ml)', unit: 'Thùng', price: 155000 },
    { name: 'Nước uống thạch dừa nha đam (Thùng 24 chai 450ml)', unit: 'Thùng', price: 185000 },
    { name: 'Soda Schweppes Tonic Water (Thùng 24 lon 320ml)', unit: 'Thùng', price: 210000 },
  ];

  const farmPool = [
    { name: 'Gạo thơm lúa mùa ST25 Sóc Trăng (Bao 10kg)', unit: 'Bao', price: 320000 },
    { name: 'Gạo thơm Jasmine Thượng Hạng (Bao 10kg)', unit: 'Bao', price: 220000 },
    { name: 'Gạo lứt đỏ Điện Biên organic (Túi 5kg)', unit: 'Túi', price: 185000 },
    { name: 'Hạt Điều tươi rang muối vỏ lụa Bình Phước (Hộp 500g)', unit: 'Hộp', price: 155000 },
    { name: 'Hạt Mắc Ca nứt vỏ sấy chín Đắk Lắk (Hộp 500g)', unit: 'Hộp', price: 175000 },
    { name: 'Cà phê hạt Robusta Đắk Lắk mộc nguyên chất (Bao 5kg)', unit: 'Bao', price: 1150000 },
    { name: 'Trà xanh Thái Nguyên đặc sản móc câu (Túi 500g)', unit: 'Túi', price: 195000 },
    { name: 'Hạt tiêu đen Chư Sê Tây Nguyên hữu cơ (Lọ 200g)', unit: 'Lọ', price: 75000 },
    { name: 'Hạt sen khô Tịnh Tâm Huế loại 1 (Túi 500g)', unit: 'Túi', price: 185000 },
    { name: 'Mít sấy giòn xuất khẩu bơ thơm (Túi 500g)', unit: 'Túi', price: 125000 },
    { name: 'Khoai lang sấy dẻo Đà Lạt mộc tự nhiên (Gói 500g)', unit: 'Gói', price: 95000 },
    { name: 'Hạt điều nhân trắng xuất khẩu Bình Phước (Bao 5kg)', unit: 'Bao', price: 1350000 },
    { name: 'Hạt tiêu sọ trắng Chư Sê cao cấp (Lọ 200g)', unit: 'Lọ', price: 95000 },
    { name: 'Bột nghệ vàng nguyên chất Nghệ An (Gói 500g)', unit: 'Gói', price: 115000 },
    { name: 'Tỏi Lý Sơn chính gốc loại 1 (Túi 1kg)', unit: 'Túi', price: 165000 },
    { name: 'Hành tím Vĩnh Châu chọn lọc (Túi 1kg)', unit: 'Túi', price: 75000 },
    { name: 'Nấm rơm sấy khô đóng gói xuất khẩu (Hộp 200g)', unit: 'Hộp', price: 145000 },
    { name: 'Trà Oolong cao cấp Cầu Đất (Hộp 250g)', unit: 'Hộp', price: 185000 },
    { name: 'Nước cốt dâu tằm Đà Lạt nguyên chất (Chai 1L)', unit: 'Chai', price: 110000 },
    { name: 'Mật ong hoa nhãn Hưng Yên nguyên chất (Chai 1L)', unit: 'Chai', price: 320000 },
    { name: 'Chuối Laba Đà Lạt sấy dẻo tự nhiên (Túi 500g)', unit: 'Túi', price: 85000 },
    { name: 'Khô bò sợi Tây Nguyên thơm cay (Hộp 500g)', unit: 'Hộp', price: 290000 },
    { name: 'Khô gà lá chanh loại ngon cay giòn (Hộp 500g)', unit: 'Hộp', price: 135000 },
    { name: 'Hạt bí ngô rang tay hữu cơ (Túi 500g)', unit: 'Túi', price: 95000 },
    { name: 'Hạt dưa rang cát truyền thống Bình Thuận (Túi 500g)', unit: 'Túi', price: 85000 },
    { name: 'Hạt hướng dương sấy giòn thơm bùi (Bao 5kg)', unit: 'Bao', price: 340000 },
    { name: 'Đậu nành hữu cơ hạt nhỏ giống thuần (Túi 1kg)', unit: 'Túi', price: 65000 },
    { name: 'Đậu đen xanh lòng Tây Nguyên (Túi 1kg)', unit: 'Túi', price: 70000 },
    { name: 'Đậu đỏ giống bản địa Điện Biên (Túi 1kg)', unit: 'Túi', price: 68000 },
    { name: 'Đậu xanh xát vỏ loại ngon xuất khẩu (Túi 1kg)', unit: 'Túi', price: 55000 },
    { name: 'Ngô ngọt đóng hộp xuất khẩu (Thùng 24 lon)', unit: 'Thùng', price: 380000 },
    { name: 'Măng khô Tây Bắc non sạch mộc mạc (Túi 1kg)', unit: 'Túi', price: 290000 },
    { name: 'Nấm tai mèo khô (Mộc nhĩ đen) Tây Bắc (Túi 1kg)', unit: 'Túi', price: 195000 },
    { name: 'Nấm hương rừng khô Tây Bắc tự nhiên (Túi 500g)', unit: 'Túi', price: 220000 },
    { name: 'Tinh bột sắn dây nguyên chất Kinh Môn (Túi 1kg)', unit: 'Túi', price: 185000 },
    { name: 'Miến dong phên sợi nhỏ Cao Bằng (Túi 1kg)', unit: 'Túi', price: 115000 },
    { name: 'Sắn lát sấy khô xuất khẩu (Bao 50kg)', unit: 'Bao', price: 480000 },
    { name: 'Ngô hạt đỏ sấy khô làm thức ăn chăn nuôi (Bao 50kg)', unit: 'Bao', price: 390000 },
    { name: 'Đậu phộng sẻ hạt đỏ Quảng Nam (Túi 1kg)', unit: 'Túi', price: 78000 },
    { name: 'Trà Atiso Đà Lạt nguyên bông khô (Túi 500g)', unit: 'Túi', price: 195000 },
    { name: 'Trà hoa cúc chi sấy lạnh Hưng Yên (Lọ 100g)', unit: 'Lọ', price: 125000 },
    { name: 'Hoa hồi Lạng Sơn khô thơm nguyên cánh (Túi 500g)', unit: 'Túi', price: 165000 },
    { name: 'Quế cây bóc vỏ Yên Bái thơm nồng (Túi 500g)', unit: 'Túi', price: 95000 },
    { name: 'Thảo quả khô Tây Bắc tuyển chọn (Túi 500g)', unit: 'Túi', price: 210000 },
    { name: 'Rong biển khô sấy giòn Nha Trang (Túi 200g)', unit: 'Túi', price: 85000 },
    { name: 'Sá sùng khô Vân Đồn tuyển chọn loại 1 (Hộp 100g)', unit: 'Hộp', price: 550000 },
    { name: 'Hành tây Đà Lạt củ lớn sạch vỏ (Túi 5kg)', unit: 'Túi', price: 115000 },
    { name: 'Khoai tây Đà Lạt củ vàng đều hạt (Túi 5kg)', unit: 'Túi', price: 145000 },
    { name: 'Gừng củ già cay nồng miền núi (Túi 2kg)', unit: 'Túi', price: 85000 },
    { name: 'Nghệ củ đỏ tươi ép nước nguyên chất (Túi 5kg)', unit: 'Túi', price: 150000 },
  ];

  const coffeePool = [
    { name: 'Cà phê Sữa đá pha máy', unit: 'Ly', price: 35000 },
    { name: 'Cà phê Đen đá truyền thống', unit: 'Ly', price: 29000 },
    { name: 'Trà đào Cam sả hạt chia', unit: 'Ly', price: 45000 },
    { name: 'Trà sữa góc phố trân châu', unit: 'Ly', price: 42000 },
    { name: 'Bánh mì pate xúc xích đặc biệt', unit: 'Ổ', price: 30000 },
    { name: 'Bánh Croissant bơ tỏi nướng', unit: 'Cái', price: 38000 },
    { name: 'Nước ép hoa quả nhiệt đới', unit: 'Ly', price: 49000 },
    { name: 'Bạc xỉu nóng cốt dừa béo ngậy', unit: 'Ly', price: 39000 },
    { name: 'Trà xanh đá xay matcha cốt dừa', unit: 'Ly', price: 55000 },
    { name: 'Sinh tố bơ sáp Đắk Lắk ngọt ngào', unit: 'Ly', price: 49000 },
    { name: 'Nước ép Cam sành nguyên chất', unit: 'Ly', price: 39000 },
    { name: 'Sô-cô-la nóng marshmallow ngọt bùi', unit: 'Ly', price: 45000 },
    { name: 'Cà phê muối Huế đặc sản thơm bùi', unit: 'Ly', price: 39000 },
    { name: 'Cà phê trứng Hà Nội béo mịn ngọt', unit: 'Ly', price: 45000 },
    { name: 'Trà lài macchiato kem sữa béo', unit: 'Ly', price: 42000 },
    { name: 'Trà ô long hạt sen ngọt thanh', unit: 'Ly', price: 45000 },
    { name: 'Soda việt quất bạc hà mát lạnh', unit: 'Ly', price: 39000 },
    { name: 'Soda dâu tây nha đam giòn sần sật', unit: 'Ly', price: 39000 },
    { name: 'Trà thái xanh trân châu đường đen', unit: 'Ly', price: 35000 },
    { name: 'Trà thái đỏ thạch dừa giòn dai', unit: 'Ly', price: 35000 },
    { name: 'Bánh mousse chanh dây ngọt chua', unit: 'Cái', price: 45000 },
    { name: 'Bánh tiramisu cacao béo ngậy Ý', unit: 'Cái', price: 49000 },
    { name: 'Bánh phô mai nướng cháy thơm phức', unit: 'Cái', price: 55000 },
    { name: 'Hạt hướng dương rang muối gói nhỏ', unit: 'Gói', price: 15000 },
    { name: 'Hạt điều rang củi Bình Phước hộp nhỏ', unit: 'Hộp', price: 45000 },
    { name: 'Khô bò lá chanh đĩa nhỏ nhâm nhi', unit: 'Đĩa', price: 65000 },
    { name: 'Khô gà xé cay đĩa nhỏ nhâm nhi', unit: 'Đĩa', price: 35000 },
    { name: 'Sữa tươi trân châu đường đen', unit: 'Ly', price: 45000 },
    { name: 'Khoai tây chiên lắc phô mai giòn', unit: 'Đĩa', price: 35000 },
    { name: 'Nem chua rán giòn rụm phố cổ', unit: 'Đĩa', price: 45000 },
    { name: 'Trà gừng mật ong ấm áp mùa đông', unit: 'Ly', price: 35000 },
    { name: 'Hồng trà tắc sả đá mát lạnh', unit: 'Ly', price: 29000 },
    { name: 'Cà phê cốt dừa đá xay mát lạnh', unit: 'Ly', price: 49000 },
    { name: 'Sinh tố xoài cát Hòa Lộc thơm dẻo', unit: 'Ly', price: 49000 },
    { name: 'Nước ép Dứa mật ngọt thanh mát', unit: 'Ly', price: 39000 },
    { name: 'Trà sữa sương sáo đường đen', unit: 'Ly', price: 42000 },
    { name: 'Thạch rau câu trái dừa mát lạnh', unit: 'Cái', price: 35000 },
    { name: 'Bánh tart trứng KFC béo ngậy', unit: 'Cái', price: 25000 },
    { name: 'Bánh panna cotta dâu tây mượt mà', unit: 'Cái', price: 30000 },
    { name: 'Trà sữa matcha kem cheese béo', unit: 'Ly', price: 49000 },
    { name: 'Trà hoa cúc mật ong ấm áp', unit: 'Ly', price: 35000 },
    { name: 'Sữa đậu nành lá dứa nóng', unit: 'Ly', price: 20000 },
    { name: 'Trà sữa thái đỏ thạch phô mai', unit: 'Ly', price: 45000 },
    { name: 'Soda chanh leo bạc hà giải nhiệt', unit: 'Ly', price: 39000 },
    { name: 'Kem dừa Côn Đảo hũ tròn ngọt mát', unit: 'Hũ', price: 45000 },
    { name: 'Kem chocolate ốc quế mát lạnh', unit: 'Cái', price: 29000 },
    { name: 'Trà vải hạt sen thanh nhiệt cơ thể', unit: 'Ly', price: 45000 },
    { name: 'Cà phê cold brew cam sả thanh nhẹ', unit: 'Ly', price: 49000 },
    { name: 'Nước khoáng Lavie chai nhỏ mát lạnh', unit: 'Chai', price: 10000 },
    { name: 'Hộp quẹt gas cao cấp bỏ túi', unit: 'Cái', price: 5000 },
  ];

  const groceryPool = [
    { name: 'Gạo thơm thượng hạng ST25 (5kg)', unit: 'Bao', price: 195000 },
    { name: 'Dầu ăn đậu nành Simply (1L)', unit: 'Chai', price: 58000 },
    { name: 'Nước mắm Nam Ngư siêu tiết kiệm', unit: 'Chai', price: 42000 },
    { name: 'Mì gói ăn liền Hảo Hảo Tôm chua cay', unit: 'Thùng', price: 120000 },
    { name: 'Sữa tươi tiệt trùng Vinamilk 180ml', unit: 'Thùng', price: 360000 },
    { name: 'Nước giặt Comfort Hương ban mai 3.2kg', unit: 'Túi', price: 185000 },
    { name: 'Bột ngọt Ajinomoto 454g', unit: 'Gói', price: 34000 },
    { name: 'Đường tinh luyện Biên Hòa 1kg', unit: 'Gói', price: 27000 },
    { name: 'Muối i-ốt Hải Phòng gói 500g', unit: 'Gói', price: 8000 },
    { name: 'Nước tương Chinsu tỏi ớt chai 250ml', unit: 'Chai', price: 16000 },
    { name: 'Hạt nêm Knorr thịt thăn 900g', unit: 'Gói', price: 85000 },
    { name: 'Tương ớt Chin-su chai 250g', unit: 'Chai', price: 15000 },
    { name: 'Sữa đặc Ông Thọ lon thiếc 380g', unit: 'Lon', price: 26000 },
    { name: 'Trứng gà tươi CP hộp 10 quả', unit: 'Hộp', price: 32000 },
    { name: 'Kem đánh răng Colgate 225g', unit: 'Hộp', price: 38000 },
    { name: 'Bàn chải đánh răng P/S lông tơ mềm', unit: 'Cái', price: 18000 },
    { name: 'Dầu gội Clear thảo dược 630ml', unit: 'Chai', price: 145000 },
    { name: 'Sữa tắm Lifebuoy sạch khuẩn 800g', unit: 'Chai', price: 165000 },
    { name: 'Nước rửa chén Sunlight chanh 750ml', unit: 'Chai', price: 28000 },
    { name: 'Giấy vệ sinh cao cấp Pulppy 10 cuộn', unit: 'Lốc', price: 72000 },
    { name: 'Bột giặt OMO Matic cửa trước 3.6kg', unit: 'Túi', price: 195000 },
    { name: 'Nước xả vải Downy huyền bí túi 1.4L', unit: 'Túi', price: 115000 },
    { name: 'Nước lau sàn Sunlight hương hoa lily 1kg', unit: 'Chai', price: 32000 },
    { name: 'Nước tẩy bồn cầu Vim diệt khuẩn 900ml', unit: 'Chai', price: 34000 },
    { name: 'Khăn giấy rút Silkwell gói 250 tờ', unit: 'Gói', price: 18000 },
    { name: 'Băng vệ sinh Kotex siêu mỏng 8 cái', unit: 'Gói', price: 19000 },
    { name: 'Tã dán Huggies size XL bịch 34 cái', unit: 'Bịch', price: 185000 },
    { name: 'Khăn ướt Bobby gói 100 tờ cao cấp', unit: 'Gói', price: 38000 },
    { name: 'Sữa tắm em bé Johnson\'s Baby 200ml', unit: 'Chai', price: 55000 },
    { name: 'Ngũ cốc dinh dưỡng sấy khô Calbee 750g', unit: 'Túi', price: 165000 },
    { name: 'Bánh quy bơ Danisa hộp sắt 454g', unit: 'Hộp', price: 125000 },
    { name: 'Bánh ChocoPie Orion hộp 12 chiếc', unit: 'Hộp', price: 55000 },
    { name: 'Snack khoai tây chiên O\'Star gói nhỡ', unit: 'Gói', price: 12000 },
    { name: 'Kẹo sing-gum Doublemint hũ nhựa nhỏ', unit: 'Hũ', price: 25000 },
    { name: 'Mì trộn Omachi xốt bò hầm hộp nhựa', unit: 'Hộp', price: 15000 },
    { name: 'Tương cà chua Chin-su chai 250g', unit: 'Chai', price: 16000 },
    { name: 'Giấm gạo nếp lên men tự nhiên Trung Thành', unit: 'Chai', price: 12000 },
    { name: 'Bột chiên giòn đa dụng Meizan gói 150g', unit: 'Gói', price: 9000 },
    { name: 'Miến dong phên Cao Bằng gói 500g', unit: 'Gói', price: 55000 },
    { name: 'Nước xịt phòng sáp thơm Glade 350ml', unit: 'Chai', price: 48000 },
    { name: 'Nước rửa tay diệt khuẩn Green Cross 250ml', unit: 'Chai', price: 32000 },
    { name: 'Pin Maxell tiểu AA carbon cao cấp vỉ 4', unit: 'Vỉ', price: 15000 },
    { name: 'Sữa chua ăn Vinamilk có đường lốc 4', unit: 'Lốc', price: 28000 },
    { name: 'Sữa tươi tiệt trùng TH True Milk 1L', unit: 'Hộp', price: 36000 },
    { name: 'Phô mai con bò cười hộp 8 miếng', unit: 'Hộp', price: 35000 },
    { name: 'Xúc xích tiệt trùng Ponnie gói 5 cây', unit: 'Gói', price: 22000 },
    { name: 'Bánh mì tươi chà bông Kinh Đô mềm', unit: 'Cái', price: 12000 },
    { name: 'Cà phê hòa tan G7 3in1 hộp 20 gói', unit: 'Hộp', price: 55000 },
    { name: 'Trà lipton nhãn vàng hộp 25 gói lọc', unit: 'Hộp', price: 48000 },
    { name: 'Bao rác tự hủy sinh học Opec cuộn 3', unit: 'Cuộn', price: 16000 },
  ];

  const restaurantPool = [
    { name: 'Lẩu Hải sản chua cay Đà Nẵng (Size L)', unit: 'Nồi', price: 450000 },
    { name: 'Tôm sú sốt bơ tỏi hoàng kim', unit: 'Đĩa', price: 280000 },
    { name: 'Mực lá nướng muối ớt xanh Nha Trang', unit: 'Đĩa', price: 240000 },
    { name: 'Gà ta hấp lá chanh nguyên con', unit: 'Con', price: 350000 },
    { name: 'Bò lúc lắc sốt tiêu đen kèm khoai tây', unit: 'Đĩa', price: 195000 },
    { name: 'Cơm chiên Hải sản hoàng gia', unit: 'Đĩa', price: 125000 },
    { name: 'Gỏi ngó sen tôm thịt đặc sản', unit: 'Đĩa', price: 115000 },
    { name: 'Rau muống xào tỏi xanh giòn', unit: 'Đĩa', price: 55000 },
    { name: 'Nước ép Cam sành tươi nguyên chất', unit: 'Ly', price: 45000 },
    { name: 'Bia Heineken Silver lon cao', unit: 'Lon', price: 28000 },
    { name: 'Khăn lạnh hương chanh', unit: 'Cái', price: 5000 },
    { name: 'Đậu phộng rang húng quế', unit: 'Đĩa', price: 15000 },
    { name: 'Trà đá Hà Nội', unit: 'Ly', price: 5000 },
    { name: 'Nước khoáng thiên nhiên', unit: 'Chai', price: 15000 },
    { name: 'Sườn heo nướng tảng sốt mật ong BBQ', unit: 'Đĩa', price: 320000 },
    { name: 'Heo quay bánh hỏi Kim Long giòn rụm', unit: 'Đĩa', price: 220000 },
    { name: 'Cá lóc hấp bầu cuốn bánh tráng rau sống', unit: 'Con', price: 250000 },
    { name: 'Cá chép om dưa chua ngọt miền bắc', unit: 'Nồi', price: 380000 },
    { name: 'Gỏi bò bóp thấu bánh phồng tôm giòn', unit: 'Đĩa', price: 165000 },
    { name: 'Súp hải sản rong biển tuyết trắng', unit: 'Bát', price: 65000 },
    { name: 'Miến xào cua bể thịt ngọt bùi thơm', unit: 'Đĩa', price: 185000 },
    { name: 'Nem hải sản chiên xù giòn rụm', unit: 'Đĩa', price: 145000 },
    { name: 'Ốc hương rang muối tuyết cay mặn', unit: 'Đĩa', price: 220000 },
    { name: 'Tu hài nướng mỡ hành thơm nức mũi', unit: 'Con', price: 45000 },
    { name: 'Hàu sữa nướng phô mai Pháp béo ngậy', unit: 'Con', price: 35000 },
    { name: 'Ghẹ hấp bia gừng Sông Cầu', unit: 'Con', price: 185000 },
    { name: 'Đậu hũ hải sản giấy bạc bốc khói', unit: 'Đĩa', price: 135000 },
    { name: 'Sườn sụn rang muối hạt giòn rụm', unit: 'Đĩa', price: 155000 },
    { name: 'Cánh gà chiên mắm cốt đậm vị', unit: 'Đĩa', price: 115000 },
    { name: 'Chân gà rút xương quất sả ớt', unit: 'Đĩa', price: 95000 },
    { name: 'Nộm xoài xanh tai heo giòn sần sật', unit: 'Đĩa', price: 85000 },
    { name: 'Măng trúc xào bò tơ Tây Ninh mềm', unit: 'Đĩa', price: 175000 },
    { name: 'Súp cua óc heo trứng bắc thảo thơm', unit: 'Bát', price: 75000 },
    { name: 'Khổ qua xào trứng gà tươi giòn', unit: 'Đĩa', price: 65000 },
    { name: 'Khoai lang kén chiên vừng ngọt bùi', unit: 'Đĩa', price: 45000 },
    { name: 'Ngô chiên bơ vàng giòn ngọt ngào', unit: 'Đĩa', price: 45000 },
    { name: 'Cá quả nướng riềng mẻ thơm lừng', unit: 'Con', price: 290000 },
    { name: 'Cháo bồ câu hạt sen bồi bổ sức khỏe', unit: 'Tô', price: 185000 },
    { name: 'Bạch tuộc xào sa tế cay nồng nàn', unit: 'Đĩa', price: 195000 },
    { name: 'Trứng đúc thịt băm hành hoa chiên', unit: 'Đĩa', price: 55000 },
    { name: 'Nước ép táo chín đỏ ngọt thanh', unit: 'Ly', price: 45000 },
    { name: 'Sinh tố bơ dừa béo ngậy thơm mát', unit: 'Ly', price: 55000 },
    { name: 'Bia Tiger Crystal lon cao mát lạnh', unit: 'Lon', price: 25000 },
    { name: 'Coca Cola lon đỏ vị nguyên bản', unit: 'Lon', price: 20000 },
    { name: 'Nước ngọt Sprite lon chanh thanh mát', unit: 'Lon', price: 20000 },
    { name: 'Rượu nếp cái hoa vàng chum nhỏ', unit: 'Chum', price: 120000 },
    { name: 'Rượu mơ Yên Tử ngọt êm dịu', unit: 'Chai', price: 180000 },
    { name: 'Trà sâm dứa đá giải nhiệt cơ thể', unit: 'Ly', price: 10000 },
    { name: 'Kem dừa trái thơm ngon mát lịm', unit: 'Trái', price: 65000 },
    { name: 'Trái cây đĩa tổng hợp dưa hấu xoài', unit: 'Đĩa', price: 85000 },
  ];

  const plantsPool = [
    { name: 'Cây Kim Tiền phong thủy (Chậu sứ)', unit: 'Chậu', price: 350000 },
    { name: 'Cây Kim Ngân 5 thân bính (Chậu đại)', unit: 'Chậu', price: 580000 },
    { name: 'Cây Thiết Mộc Lan ghép (Văn phòng)', unit: 'Chậu', price: 750000 },
    { name: 'Cây Lưỡi Hổ viền vàng lọc không khí', unit: 'Chậu', price: 220000 },
    { name: 'Chậu Bonsai Tùng La Hán mini để bàn', unit: 'Chậu', price: 1250000 },
    { name: 'Cây Vạn Lộc tài lộc (Chậu sứ nhỏ)', unit: 'Chậu', price: 180000 },
    { name: 'Cây Bàng Singapore dáng đơn', unit: 'Chậu', price: 420000 },
    { name: 'Phân bón hữu cơ sinh học Nhật Bản (5kg)', unit: 'Bao', price: 150000 },
    { name: 'Dịch vụ thiết kế tiểu cảnh ban công', unit: 'Gói', price: 4500000 },
    { name: 'Cây Mai Vạn Phúc (Chậu nhựa)', unit: 'Chậu', price: 120000 },
    { name: 'Cây Bonsai Sung cảnh nghệ thuật', unit: 'Chậu', price: 2500000 },
    { name: 'Hạt giống hoa & phân vi lượng các loại', unit: 'Combo', price: 85000 },
    { name: 'Cây Bonsai Sanh cổ lá trung ôm đá', unit: 'Chậu', price: 8500000 },
    { name: 'Cây Bonsai Mai Chiếu Thủy dáng trực', unit: 'Chậu', price: 4200000 },
    { name: 'Cây Bonsai Linh Sam bông tím lũa zin', unit: 'Chậu', price: 3800000 },
    { name: 'Cây Hạnh Phúc phong thủy phòng khách', unit: 'Chậu', price: 450000 },
    { name: 'Đất phù sa bồi giá thể xơ dừa sấy', unit: 'Bao', price: 25000 },
    { name: 'Bộ chậu gốm sứ Bát Tràng vẽ tay', unit: 'Bộ', price: 160000 },
    { name: 'Kéo cắt Bonsai thép đen Nhật Bản', unit: 'Cái', price: 195000 },
    { name: 'Dây nhôm uốn cành Bonsai chuyên dụng', unit: 'Cuộn', price: 75000 },
    { name: 'Thuốc kích rễ cực mạnh N3M hũ lớn', unit: 'Hũ', price: 19000 },
    { name: 'Đất nung Nhật Bản Akadama lót nền', unit: 'Bao', price: 145000 },
    { name: 'Cây Lan Ý lọc không khí văn phòng', unit: 'Chậu', price: 120000 },
    { name: 'Chậu nhựa thông minh trồng rau hoa', unit: 'Cái', price: 18000 },
    { name: 'Hệ thống tưới nhỏ giọt tự động', unit: 'Bộ', price: 220000 },
    { name: 'Cây Bonsai Đề Lâm bám đá dáng bay', unit: 'Chậu', price: 4800000 },
    { name: 'Cây Bonsai Hồng Ngọc Mai hoa đỏ', unit: 'Chậu', price: 3100000 },
    { name: 'Cây Trầu Bà leo cột đại lọc khí', unit: 'Chậu', price: 520000 },
    { name: 'Cây Ngũ Gia Bì xanh tươi đuổi muỗi', unit: 'Chậu', price: 230000 },
    { name: 'Cây Trúc Bách Hợp phong thủy', unit: 'Chậu', price: 410000 },
    { name: 'Đất sạch hữu cơ dinh dưỡng Tribat', unit: 'Bao', price: 38000 },
    { name: 'Đất đỏ bazan Tây Nguyên sấy khô', unit: 'Bao', price: 48000 },
    { name: 'Phân bò hoai mục xử lý vi sinh', unit: 'Bao', price: 22000 },
    { name: 'Phân trùn quế nguyên chất hữu cơ', unit: 'Bao', price: 62000 },
    { name: 'Phân bón NPK chậm tan dạng hạt', unit: 'Hũ', price: 42000 },
    { name: 'Thuốc dưỡng lá sinh học hữu cơ', unit: 'Bộ', price: 92000 },
    { name: 'Bộ chậu nhựa lục giác cỡ nhỡ', unit: 'Cái', price: 13000 },
    { name: 'Chậu gốm đất nung mộc mạc cổ kính', unit: 'Cái', price: 68000 },
    { name: 'Khay nhựa lót chậu tránh tràn nước', unit: 'Cái', price: 5500 },
    { name: 'Bình xịt nước áp suất Dudaco 4L', unit: 'Cái', price: 165000 },
    { name: 'Cuộn lưới lan che nắng vườn 70%', unit: 'Cuộn', price: 350000 },
    { name: 'Vòi phun sương làm mát tự động', unit: 'Bộ', price: 98000 },
    { name: 'Kéo tỉa dăm cành dẹp thép sắc bén', unit: 'Cái', price: 115000 },
    { name: 'Máy đo độ ẩm độ pH đất trồng 3 in 1', unit: 'Bộ', price: 195000 },
    { name: 'Đất dừa ép viên sơ dừa bánh nén', unit: 'Bánh', price: 7500 },
    { name: 'Cây Đa Tam Phúc lá tim mộc mạc', unit: 'Chậu', price: 450000 },
    { name: 'Cây Cau Tiểu Trâm mini văn phòng', unit: 'Chậu', price: 60000 },
    { name: 'Cây Sen Đá tổng hợp chậu nhỏ', unit: 'Chậu', price: 35000 },
    { name: 'Cây Xương Rồng cảnh mini sặc sỡ', unit: 'Chậu', price: 40000 },
    { name: 'Dây buộc cành lõi kẽm bọc nhựa mềm', unit: 'Cuộn', price: 22000 },
  ];

  const furniturePool = [
    { name: 'Giường ngủ gỗ gõ đỏ tự nhiên cao cấp', unit: 'Cái', price: 15500000 },
    { name: 'Giường ngủ gỗ sồi Nga hiện đại 1m8x2m', unit: 'Cái', price: 7800000 },
    { name: 'Tủ quần áo 4 cánh gỗ công nghiệp MDF chống ẩm', unit: 'Cái', price: 6200000 },
    { name: 'Tủ quần áo gỗ xoan đào tự nhiên 3 cánh', unit: 'Cái', price: 11200000 },
    { name: 'Bộ bàn ăn gỗ sồi 6 ghế bọc da cao cấp', unit: 'Bộ', price: 8500000 },
    { name: 'Bàn làm việc giám đốc gỗ tự nhiên sơn PU', unit: 'Cái', price: 5800000 },
    { name: 'Bàn học sinh kèm giá sách gỗ công nghiệp', unit: 'Cái', price: 2400000 },
    { name: 'Bàn trà sofa gỗ sồi mặt kính cường lực', unit: 'Cái', price: 3200000 },
    { name: 'Ghế sofa da phòng khách đệm mút cao cấp', unit: 'Bộ', price: 14500000 },
    { name: 'Ghế làm việc xoay lưới văn phòng công sở', unit: 'Cái', price: 750000 },
    { name: 'Ghế ăn gỗ cao su xuất khẩu tiện lợi', unit: 'Cái', price: 420000 },
    { name: 'Kệ tivi phòng khách gỗ công nghiệp 2m', unit: 'Cái', price: 2800000 },
    { name: 'Tủ giày thông minh cánh lật gỗ MDF', unit: 'Cái', price: 1950000 },
    { name: 'Bàn trang điểm đèn LED gương tròn hiện đại', unit: 'Cái', price: 3100000 },
    { name: 'Tủ thờ gia tiên gỗ gụ chạm khắc tinh xảo', unit: 'Cái', price: 18500000 },
    { name: 'Giường tầng trẻ em gỗ thông nhập khẩu', unit: 'Cái', price: 9200000 },
    { name: 'Ghế bập bênh thư giãn gỗ sồi tự nhiên', unit: 'Cái', price: 2600000 },
    { name: 'Tủ tài liệu văn phòng gỗ MDF 4 ngăn', unit: 'Cái', price: 3500000 },
    { name: 'Kệ sách trang trí đứng gỗ sồi 5 tầng', unit: 'Cái', price: 2200000 },
    { name: 'Bộ bàn ghế học sinh chống gù chống cận', unit: 'Bộ', price: 4800000 },
  ];

  const babyPool = [
    { name: 'Tã quần Pampers Baby Dry XL', unit: 'Bịch', price: 215000 },
    { name: 'Tã dán Huggies Skin Care M', unit: 'Bịch', price: 195000 },
    { name: 'Tã quần Bobby Extra Soft L', unit: 'Bịch', price: 205000 },
    { name: 'Sữa bột Infant Formula Nan Optipro 1', unit: 'Lon', price: 475000 },
    { name: 'Sữa bột Meiji Hohoemi số 0', unit: 'Lon', price: 498000 },
    { name: 'Bình sữa Cổ rộng PPSU Pigeon 240ml', unit: 'Bình', price: 240000 },
    { name: 'Bình sữa Thủy tinh Avent Natural 120ml', unit: 'Bình', price: 245000 },
    { name: 'Sữa tắm gội Dnee Baby 380ml', unit: 'Chai', price: 90000 },
    { name: 'Sữa tắm gội Cetaphil Baby 230ml', unit: 'Chai', price: 179000 },
    { name: 'Khăn ướt em bé Bobby dịu nhẹ 100 tờ', unit: 'Gói', price: 32000 },
    { name: 'Nước rửa bình sữa Dnee Organic 600ml', unit: 'Túi', price: 65000 },
    { name: 'Kem chống hăm Bepanthen Balm 30g', unit: 'Tuýp', price: 70000 },
    { name: 'Phấn rôm Johnson\'s Baby 200g', unit: 'Chai', price: 38000 },
    { name: 'Dầu tràm nguyên chất Huế 50ml', unit: 'Chai', price: 70000 },
    { name: 'Nước giặt xả em bé Dnee 3000ml', unit: 'Can', price: 170000 },
    { name: 'Tăm bông kháng khuẩn em bé YumYum', unit: 'Hộp', price: 22000 },
    { name: 'Khăn xô tắm sợi tre 6 lớp cho bé', unit: 'Chiếc', price: 65000 },
    { name: 'Khăn sữa sợi tre kháng khuẩn 4 lớp', unit: 'Bịch', price: 35000 },
    { name: 'Bột ăn dăm Hipp Organic 250g', unit: 'Hộp', price: 115000 },
    { name: 'Bánh ăn dăm Gerber Organic vị dâu chuối', unit: 'Hũ', price: 82000 },
    { name: 'Xe đẩy em bé gấp gọn Baobaohao V8', unit: 'Chiếc', price: 1150000 },
    { name: 'Chậu tắm gấp gọn kèm phao chống trượt', unit: 'Bộ', price: 220000 },
  ];

  const constructionPool = [
    { name: 'Xi măng Portland INSEE Đa Dụng PCB40', unit: 'Bao', price: 92000 },
    { name: 'Xi măng Hà Tiên 1 chuyên dụng xây tô', unit: 'Bao', price: 88000 },
    { name: 'Xi măng Nghi Sơn PCB40 chất lượng cao', unit: 'Bao', price: 86000 },
    { name: 'Cát vàng hạt lớn đổ bê tông xây dựng', unit: 'm3', price: 380000 },
    { name: 'Đá 1x2 xanh Đồng Nai đổ bê tông tươi', unit: 'm3', price: 420000 },
    { name: 'Gạch ống 4 lỗ Tuynel Bình Dương', unit: 'Viên', price: 1250 },
    { name: 'Gạch đinh đặc Tuynel chịu lực xây móng', unit: 'Viên', price: 1450 },
    { name: 'Thép cây vằn Hòa Phát phi 10 D10 CB300-V', unit: 'Cây', price: 128000 },
    { name: 'Thép cây vằn Hòa Phát phi 12 D12 CB300-V', unit: 'Cây', price: 186000 },
    { name: 'Thép hộp mạ kẽm Hoa Sen 50x100x1.8mm', unit: 'Cây', price: 420000 },
    { name: 'Thép hộp vuông mạ kẽm Nam Kim 40x40x1.4mm', unit: 'Cây', price: 195000 },
    { name: 'Lưới thép hàn đổ sàn bê tông D4 a150', unit: 'Cuộn', price: 1850000 },
    { name: 'Tôn lạnh màu Hoa Sen dày 0.45mm sóng vuông', unit: 'Mét', price: 118000 },
    { name: 'Tấm trần thạch cao Gyproc Vĩnh Tường 9mm', unit: 'Tấm', price: 125000 },
    { name: 'Tấm xi măng sợi Cemboard SCG 18mm lót sàn', unit: 'Tấm', price: 620000 },
    { name: 'Gạch lát nền Granite Đồng Tâm 80x80cm', unit: 'Thùng', price: 495000 },
    { name: 'Gạch lát nền Prime 60x60cm chống trơn', unit: 'Thùng', price: 215000 },
    { name: 'Gạch ốp tường Viglacera 30x60cm men bóng', unit: 'Thùng', price: 195000 },
    { name: 'Keo dán gạch chống thấm Weber.tai fix', unit: 'Bao', price: 280000 },
    { name: 'Sơn lót kháng kiềm ngoại thất Dulux 18L', unit: 'Thùng', price: 2850000 },
    { name: 'Sơn chống thấm pha xi măng Kova CT-11A', unit: 'Thùng', price: 1950000 },
    { name: 'Hóa chất chống thấm Sikatop Seal 107', unit: 'Bộ', price: 890000 },
    { name: 'Ống nhựa uPVC Tiền Phong D110 dày 3.2mm', unit: 'Cây', price: 265000 },
    { name: 'Ống cấp nước nóng PPR Bình Minh D25', unit: 'Cây', price: 145000 },
  ];

  const otherPool = [
    { name: 'Dịch vụ tư vấn giải pháp kỹ thuật', unit: 'Gói', price: 1500000 },
    { name: 'Linh kiện phụ trợ loại B', unit: 'Bộ', price: 45000 },
    { name: 'Thiết bị đo lường cầm tay', unit: 'Cái', price: 2200000 },
    { name: 'Chi phí thi công lắp đặt tại chỗ', unit: 'Giờ', price: 250000 },
    { name: 'Vật tư đóng gói tiêu chuẩn', unit: 'Lô', price: 800000 },
    { name: 'Giấy in Double A A4 70gsm', unit: 'Ream', price: 70000 },
    { name: 'Bút bi Thiên Long 0.5mm màu xanh', unit: 'Hộp', price: 58000 },
    { name: 'Khẩu trang y tế kháng khuẩn 4 lớp', unit: 'Hộp', price: 33000 },
    { name: 'Nước rửa tay diệt khuẩn Lifebuoy', unit: 'Can', price: 263000 },
    { name: 'Bộ dụng cụ văn phòng phẩm tổng hợp', unit: 'Bộ', price: 250000 },
    { name: 'Thùng carton đóng hàng 3 lớp', unit: 'Lô', price: 560000 },
    { name: 'Khăn ướt cồn diệt khuẩn gói 80 tờ', unit: 'Gói', price: 19000 },
    { name: 'Pin điện tử Alkaline AA Energizer', unit: 'Vỉ', price: 95000 },
    { name: 'Băng keo dán thùng OPP siêu dính', unit: 'Cuộn', price: 11000 },
    { name: 'Màng PE bọc hàng hóa chống trầy', unit: 'Cuộn', price: 142000 },
    { name: 'Túi nilon tự hủy sinh học đóng hàng', unit: 'Lô', price: 390000 },
    { name: 'Dịch vụ bảo trì vệ sinh máy điều hòa', unit: 'Máy', price: 240000 },
    { name: 'Ổ cắm điện đa năng chống quá tải Lioa', unit: 'Cái', price: 145000 },
    { name: 'Kệ sắt lắp ghép thông minh đa năng v lỗ', unit: 'Bộ', price: 700000 },
    { name: 'Bộ bóng đèn LED siêu sáng Rạng Đông', unit: 'Cái', price: 67000 },
    { name: 'Máy dập ghim đại & ghim Deli xoay', unit: 'Bộ', price: 156000 },
    { name: 'Thùng rác nhựa HDPE nắp lật 60L', unit: 'Cái', price: 220000 },
    { name: 'Bộ dụng cụ vệ sinh nhà xưởng đa năng', unit: 'Bộ', price: 1650000 },
    { name: 'Bảng từ trắng viết bút lông Hàn Quốc', unit: 'Cái', price: 850000 },
    { name: 'Ghế xoay văn phòng tựa lưng lưới', unit: 'Cái', price: 790000 },
    { name: 'Thảm nỉ đỏ lót sàn sự kiện tiệc cưới', unit: 'Mét', price: 45000 },
    { name: 'Bình chữa cháy bột MFZ4 tiêu chuẩn', unit: 'Bình', price: 145000 },
    { name: 'Găng tay bảo hộ lao động phủ cao su', unit: 'Đôi', price: 8500 },
    { name: 'Mũ bảo hộ lao động Thùy Dương', unit: 'Cái', price: 38000 },
    { name: 'Cuộn dây cáp mạng Cat6 xanh 305m', unit: 'Cuộn', price: 1350000 },
    { name: 'Thiết bị phát Wifi TP-Link chuẩn AC', unit: 'Cái', price: 490000 },
    { name: 'Bộ dụng cụ tô vít & khóa lục giác Deli', unit: 'Bộ', price: 170000 },
    { name: 'Hộp nhựa đựng đồ đa năng bánh xe 120L', unit: 'Cái', price: 165000 },
    { name: 'Dây rút nhựa trắng nhiều kích cỡ', unit: 'Bịch', price: 11500 },
    { name: 'Máy sấy tay cảm ứng nhiệt gắn tường', unit: 'Cái', price: 1850000 },
    { name: 'Kệ gỗ đựng tài liệu hồ sơ 5 ngăn', unit: 'Cái', price: 950000 },
    { name: 'Khăn lau microfiber siêu thấm hút', unit: 'Cái', price: 6750 },
    { name: 'Gương treo phòng tắm viền inox', unit: 'Cái', price: 220000 },
    { name: 'Khóa tay gạt Việt Tiệp inox chính hãng', unit: 'Bộ', price: 220000 },
    { name: 'Đồng hồ treo tường kim trôi hiện đại', unit: 'Cái', price: 125000 },
    { name: 'Bộ chổi quét nhà & hót rác nhựa', unit: 'Bộ', price: 75000 },
    { name: 'Thùng đựng nước đá Duy Tân 45L', unit: 'Cái', price: 270000 },
    { name: 'Ô dù cầm tay gấp ngược che mưa nắng', unit: 'Cái', price: 92500 },
    { name: 'Áo mưa cánh dơi vải dù siêu bền', unit: 'Cái', price: 49000 },
    { name: 'Nước lau kính Sunlight sạch bóng 1kg', unit: 'Chai', price: 28000 },
    { name: 'Túi zip lụa mờ có khóa kéo', unit: 'Lô', price: 145000 },
    { name: 'Giấy xi măng gói quà kraft cuộn', unit: 'Cuộn', price: 85000 },
    { name: 'Sáp thơm khử mùi phòng ngủ Glade', unit: 'Hộp', price: 40000 },
    { name: 'Dụng cụ đóng đai nhựa cầm tay', unit: 'Cái', price: 1150000 },
    { name: 'Con lăn sơn tường thông minh Deli', unit: 'Bộ', price: 136000 },
  ];

  let pool = otherPool;
  if (customPool && customPool.length > 0) {
    pool = customPool;
  } else {
    if (industry === 'bia_nuoc_giai_khat') pool = beerPool;
    else if (industry === 'hang_nong_san') pool = farmPool;
    else if (industry === 'ca_phe') pool = coffeePool;
    else if (industry === 'tap_hoa') pool = groceryPool;
    else if (industry === 'nha_hang') pool = restaurantPool;
    else if (industry === 'cay_canh') pool = plantsPool;
    else if (industry === 'giuong_tu_ban_ghe') pool = furniturePool;
    else if (industry === 'do_dung_em_be') pool = babyPool;
    else if (industry === 'vat_lieu_xay_dung') pool = constructionPool;
  }

  let remaining = amount;
  let idx = 1;

  // Choose items greedily to sum up exactly to the total amount
  while (remaining >= 5000 && items.length < (industry === 'nha_hang' ? 6 : 5)) {
    const itemTemplate = pool[Math.floor(Math.random() * pool.length)];
    const maxQty = Math.max(1, Math.floor(remaining / itemTemplate.price));
    if (maxQty === 0) break;
    
    const qty = Math.max(1, Math.min(maxQty, items.length === 4 ? maxQty : Math.floor(Math.random() * 3) + 1));
    const total = qty * itemTemplate.price;

    if (remaining - total >= 0) {
      if (!items.find(it => it.name === itemTemplate.name)) {
        items.push({
          no: idx++,
          name: itemTemplate.name,
          unit: itemTemplate.unit,
          qty,
          price: itemTemplate.price,
          total
        });
        remaining -= total;
      }
    } else {
      break;
    }
  }

  // Handle rounding & residuals
  if (remaining > 0) {
    let fallbackName = 'Hàng hóa / Dịch vụ bán lẻ tổng hợp';
    let unit = 'Lượt';
    if (industry === 'bia_nuoc_giai_khat') {
       fallbackName = 'Phụ phí bốc xếp & Giao hàng bia nước ngọt lẻ';
    } else if (industry === 'hang_nong_san') {
       fallbackName = 'Phụ phí đóng gói & Giao hàng nông sản lẻ';
    } else if (industry === 'ca_phe') {
       fallbackName = 'Combo Thức uống & Phụ phí dịch vụ lẻ';
    } else if (industry === 'tap_hoa') {
       fallbackName = 'Phụ phí đóng gói & Túi bảo vệ môi trường';
    } else if (industry === 'nha_hang') {
       fallbackName = 'Phí phục vụ & Khăn lạnh';
    } else if (industry === 'cay_canh') {
       fallbackName = 'Chậu nhựa bổ trợ & Phụ kiện làm vườn lẻ';
    } else if (industry === 'giuong_tu_ban_ghe') {
       fallbackName = 'Phụ kiện kim khí & Phụ phí giao hàng lắp đặt nội thất lẻ';
    } else if (industry === 'do_dung_em_be') {
       fallbackName = 'Túi bảo vệ & Phụ kiện em bé lẻ';
    } else {
       fallbackName = 'Hàng hóa phụ trợ & Dịch vụ phát sinh lẻ';
    }

    const existing = items.find(it => it.name === fallbackName);
    if (existing) {
      existing.total += remaining;
      existing.price = existing.total;
    } else {
      items.push({
        no: idx++,
        name: fallbackName,
        unit: unit,
        qty: 1,
        price: remaining,
        total: remaining
      });
    }
  }

  return items;
};

// Split revenue into N parts using randomized weights
const splitRevenue = (total: number, count: number): number[] => {
  if (count <= 1) return [total];
  
  const weights: number[] = [];
  let sumOfWeights = 0;
  for (let i = 0; i < count; i++) {
    const w = 0.5 + Math.random() * 1.0;
    weights.push(w);
    sumOfWeights += w;
  }
  
  let allocated = 0;
  const amounts: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    let amt = Math.round((total * weights[i]) / sumOfWeights / 1000) * 1000;
    if (amt < 10000) amt = 10000;
    amounts.push(amt);
    allocated += amt;
  }
  
  let remainder = total - allocated;
  if (remainder < 10000) {
    if (amounts.length > 0) {
      amounts[amounts.length - 1] += remainder;
      if (amounts[amounts.length - 1] < 10000) {
        amounts[amounts.length - 1] = 10000;
      }
    }
    remainder = total - amounts.reduce((a, b) => a + b, 0);
  }
  amounts.push(remainder);
  return amounts;
};

export default function InvoiceModal({ store, record, onClose }: InvoiceModalProps) {
  const [docType, setDocType] = useState<'invoice' | 'receipt'>('invoice');
  const [numInvoices, setNumInvoices] = useState<number>(3);
  const [selectedInvoiceIndex, setSelectedInvoiceIndex] = useState<number>(0);
  const [use80PercentPreset, setUse80PercentPreset] = useState<boolean>(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<'danang' | 'hue' | 'hcm' | 'hanoi'>('danang');
  
  // Custom uploaded item pool from Excel
  const [customItemPool, setCustomItemPool] = useState<{ name: string; unit: string; price: number }[]>(() => {
    try {
      const saved = localStorage.getItem(`custom_items_${store.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom receiver coordinates matching the active store
  const [bankNameInput, setBankNameInput] = useState(() => {
    return store.bankName || 'Vietcombank';
  });
  const [receiverName, setReceiverName] = useState(store.bankOwner || 'CHU CUA HANG');
  const [receiverAccount, setReceiverAccount] = useState(store.bankAccount || '1023456789');
  
  // Custom edit overrides for each sub-invoice
  const [userOverrides, setUserOverrides] = useState<Record<number, Partial<SubInvoice>>>({});
  
  // Current values for inputs that are bound to active invoice
  const [customBuyerName, setCustomBuyerName] = useState<string>('');
  const [customBuyerAddress, setCustomBuyerAddress] = useState<string>('');
  const [senderAccount, setSenderAccount] = useState('99998888222');
  const [txTime, setTxTime] = useState('14:32:15');
  const [txCode, setTxCode] = useState('');
  const [reference, setReference] = useState('');
  const [servingType, setServingType] = useState<'tai_ban' | 'mang_ve'>('tai_ban');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedBank = React.useMemo(() => {
    const matched = SUPPORTED_BANKS.find(
      b => b.shortName.toLowerCase() === bankNameInput.toLowerCase() || b.name.toLowerCase() === bankNameInput.toLowerCase()
    );
    if (matched) return matched;
    return {
      code: 'CUSTOM',
      name: bankNameInput,
      shortName: bankNameInput,
      color: '#0ea5e9',
      logoText: bankNameInput.toUpperCase()
    };
  }, [bankNameInput]);

  // Dynamically generate individual sub-invoices when count/record updates
  const subInvoices = React.useMemo<SubInvoice[]>(() => {
    const targetRevenue = use80PercentPreset ? Math.round(record.revenue * 0.8) : record.revenue;
    const actualCount = use80PercentPreset ? 6 : Math.max(1, numInvoices);
    const amounts = splitRevenue(targetRevenue, actualCount);
    
    return amounts.map((amt, idx) => {
      // Semi-random deterministic seeding based on ID hash
      const charSum = record.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const nameIdx = (charSum + idx * 7) % VIETNAMESE_BUYERS.length;
      
      const rData = REGION_DATA[selectedRegion];
      const streetIdx = (charSum + idx * 3) % rData.streets.length;
      const districtIdx = (charSum + idx * 11) % rData.districts.length;
      const streetNo = 10 + ((charSum + idx * 23) % 450);
      
      const buyerName = store.industry === 'nha_hang'
        ? (servingType === 'mang_ve' ? 'Khách Mang Về' : `Bàn số ${(idx + 1).toString().padStart(2, '0')}`)
        : VIETNAMESE_BUYERS[nameIdx];
      const buyerAddress = `${streetNo} Đường ${rData.streets[streetIdx]}, ${rData.districts[districtIdx]}`;
      
      const hour = 8 + (idx % 12);
      const minute = (idx * 14) % 60;
      const second = (idx * 29) % 60;
      const generatedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
      
      const seedCode = Math.floor(100000 + ((charSum + idx * 31415) % 900000));
      const generatedCode = `FT26090${seedCode}`;
      const invNo = `HD-${record.date.replace(/-/g, '')}-${record.id.slice(-4).toUpperCase()}-${(idx + 1).toString().padStart(2, '0')}`;
      
      const generatedItems = getItemsForAmount(amt, store.industry, customItemPool);
      const refText = `Thanh toan tien hang - HD ${idx + 1}`;

      return {
        id: idx + 1,
        invoiceNo: invNo,
        buyerName,
        buyerAddress,
        amount: amt,
        items: generatedItems,
        txTime: generatedTime,
        txCode: generatedCode,
        reference: refText
      };
    });
  }, [record.id, record.revenue, numInvoices, use80PercentPreset, store.industry, selectedRegion, customItemPool, servingType]);

  // Sync state values when chosen sub-invoice index changes
  useEffect(() => {
    const active = subInvoices[selectedInvoiceIndex];
    if (active) {
      const overrides = userOverrides[selectedInvoiceIndex] || {};
      setCustomBuyerName(overrides.buyerName ?? active.buyerName);
      setCustomBuyerAddress(overrides.buyerAddress ?? active.buyerAddress);
      setTxTime(overrides.txTime ?? active.txTime);
      setTxCode(overrides.txCode ?? active.txCode);
      setReference(overrides.reference ?? active.reference);
    }
  }, [selectedInvoiceIndex, subInvoices, userOverrides]);

  // Compute active variables factoring in active index and overrides
  const currentInvoice = subInvoices[selectedInvoiceIndex] || subInvoices[0];
  const overrides = userOverrides[selectedInvoiceIndex] || {};

  const activeBuyerName = overrides.buyerName ?? currentInvoice?.buyerName ?? '';
  const activeBuyerAddress = overrides.buyerAddress ?? currentInvoice?.buyerAddress ?? '';
  const activeAmount = currentInvoice?.amount ?? 0;
  const activeItems = currentInvoice?.items ?? [];
  const activeInvoiceNo = currentInvoice?.invoiceNo ?? '';
  const activeTxTime = overrides.txTime ?? currentInvoice?.txTime ?? '';
  const activeTxCode = overrides.txCode ?? currentInvoice?.txCode ?? '';
  const activeReference = overrides.reference ?? currentInvoice?.reference ?? '';

  // Trigger updating local override storage
  const handleUpdateOverride = (field: keyof SubInvoice, val: any) => {
    setUserOverrides(prev => ({
      ...prev,
      [selectedInvoiceIndex]: {
        ...prev[selectedInvoiceIndex],
        [field]: val
      }
    }));
  };

  // Handle uploading and parsing item database Excel file
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        if (!jsonData || jsonData.length === 0) {
          alert('Tệp Excel rỗng hoặc không đúng định dạng. Vui lòng tải lại tệp chuẩn.');
          return;
        }

        const parsedItems: { name: string; unit: string; price: number }[] = [];
        let nameColIdx = -1;
        let priceColIdx = -1;
        let unitColIdx = -1;

        // Try to identify headers in first few rows
        const firstRow = jsonData[0] as any[];
        if (firstRow && firstRow.length > 0) {
          firstRow.forEach((cell, idx) => {
            if (cell !== undefined && cell !== null) {
              const strVal = String(cell).toLowerCase().trim().normalize('NFC');
              if (
                strVal.includes('tên') || 
                strVal.includes('ten') || 
                strVal.includes('mặt hàng') || 
                strVal.includes('mat hang') || 
                strVal.includes('sản phẩm') || 
                strVal.includes('san pham') || 
                strVal.includes('item') || 
                strVal.includes('product') || 
                strVal.includes('dịch vụ')
              ) {
                if (nameColIdx === -1) nameColIdx = idx;
              }
              if (
                strVal.includes('giá') || 
                strVal.includes('gia') || 
                strVal.includes('tiền') || 
                strVal.includes('tien') || 
                strVal.includes('đơn giá') || 
                strVal.includes('don gia') || 
                strVal.includes('price') || 
                strVal.includes('amount') || 
                strVal.includes('chi phí')
              ) {
                if (priceColIdx === -1) priceColIdx = idx;
              }
              if (
                strVal.includes('đơn vị') || 
                strVal.includes('don vi') || 
                strVal.includes('dvt') || 
                strVal.includes('unit') || 
                strVal.includes('tính')
              ) {
                if (unitColIdx === -1) unitColIdx = idx;
              }
            }
          });
        }

        // Guess indexes if header scan failed to resolve
        if (nameColIdx === -1) nameColIdx = 0;
        if (priceColIdx === -1) priceColIdx = firstRow && firstRow.length > 2 ? 2 : 1;
        if (unitColIdx === -1 && firstRow && firstRow.length > 2 && priceColIdx !== 1) unitColIdx = 1;

        const hasHeader = firstRow && firstRow.some(cell => {
          if (!cell) return false;
          const s = String(cell).toLowerCase();
          return s.includes('tên') || s.includes('giá') || s.includes('tiền') || s.includes('đơn vị');
        });

        const startRow = hasHeader ? 1 : 0;

        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;

          const rawName = row[nameColIdx];
          const rawPrice = row[priceColIdx];
          const rawUnit = unitColIdx !== -1 ? row[unitColIdx] : 'Cái';

          if (rawName !== undefined && rawName !== null && rawPrice !== undefined && rawPrice !== null) {
            const nameStr = String(rawName).trim();
            let parsedPrice = 0;
            if (typeof rawPrice === 'number') {
              parsedPrice = rawPrice;
            } else {
              parsedPrice = parseFloat(String(rawPrice).replace(/[^0-9.-]/g, ''));
            }

            if (nameStr && !isNaN(parsedPrice) && parsedPrice > 0) {
              parsedItems.push({
                name: nameStr,
                unit: rawUnit ? String(rawUnit).trim() : 'Cái',
                price: parsedPrice
              });
            }
          }
        }

        if (parsedItems.length === 0) {
          alert('Không phát hiện thấy sản phẩm hay mặt hàng hợp lệ có cột Tên và Giá phù hợp. Vui lòng kiểm tra lại cấu trúc file.');
          return;
        }

        setCustomItemPool(parsedItems);
        localStorage.setItem(`custom_items_${store.id}`, JSON.stringify(parsedItems));
        alert(`Tải thành công ${parsedItems.length} mặt hàng tùy chọn! Hóa đơn sẽ tự động áp dụng và chia tách khớp chuẩn số tiền.`);
      } catch (err) {
        console.error(err);
        alert('Đã xảy ra lỗi trong quá trình đọc tệp Excel. Vui lòng đảm bảo tệp lưu dạng .xlsx hoặc .xls tiêu chuẩn.');
      }
    };
    reader.readAsBinaryString(file);
    // Clear input so same file can be uploaded again if needed
    e.target.value = '';
  };

  // Generate dynamic matching Excel template
  const handleDownloadTemplate = () => {
    try {
      const defaultData = [
        ['Tên mặt hàng', 'Đơn vị tính', 'Giá tiền'],
        ['Cà phê sữa đá pha máy', 'Ly', 35000],
        ['Bánh ngọt Croissant', 'Cái', 38000],
        ['Bia Tiger bạc lon cao', 'Lon', 24000],
        ['Mực nướng muối ớt sả', 'Đĩa', 185000],
        ['Lẩu Hải Sản truyền thống', 'Nồi', 350000],
      ];

      const ws = XLSX.utils.aoa_to_sheet(defaultData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách mặt hàng');
      XLSX.writeFile(wb, `mau_mat_hang_${store.name.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra sự cố khi tải tệp biểu mẫu.');
    }
  };

  const handleClearCustomItems = () => {
    if (confirm('Bạn có chắc chắn muốn xóa danh sách mặt hàng tùy chỉnh và khôi phục về danh sách mặt hàng mặc định theo ngành nghề không?')) {
      setCustomItemPool([]);
      localStorage.removeItem(`custom_items_${store.id}`);
    }
  };

  // Handle changing region/city
  const handleRegionChange = (region: 'danang' | 'hue' | 'hcm' | 'hanoi') => {
    setSelectedRegion(region);
    
    // Dynamically regenerate the address for all invoices in userOverrides as well so they match the region
    const newOverrides = { ...userOverrides };
    const targetRevenue = use80PercentPreset ? Math.round(record.revenue * 0.8) : record.revenue;
    const actualCount = use80PercentPreset ? 6 : Math.max(1, numInvoices);
    const amounts = splitRevenue(targetRevenue, actualCount);
    
    amounts.forEach((amt, idx) => {
      const charSum = record.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const rData = REGION_DATA[region];
      const streetIdx = (charSum + idx * 3) % rData.streets.length;
      const districtIdx = (charSum + idx * 11) % rData.districts.length;
      const streetNo = 10 + ((charSum + idx * 23) % 450);
      const generatedAddress = `${streetNo} Đường ${rData.streets[streetIdx]}, ${rData.districts[districtIdx]}`;
      
      newOverrides[idx] = {
        ...newOverrides[idx],
        buyerAddress: generatedAddress
      };
    });
    setUserOverrides(newOverrides);
    
    // Update active address state
    const activeOverride = newOverrides[selectedInvoiceIndex] || {};
    const rData = REGION_DATA[region];
    const charSum = record.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const streetIdx = (charSum + selectedInvoiceIndex * 3) % rData.streets.length;
    const districtIdx = (charSum + selectedInvoiceIndex * 11) % rData.districts.length;
    const streetNo = 10 + ((charSum + selectedInvoiceIndex * 23) % 450);
    const generatedAddress = `${streetNo} Đường ${rData.streets[streetIdx]}, ${rData.districts[districtIdx]}`;
    setCustomBuyerAddress(activeOverride.buyerAddress ?? generatedAddress);
  };

  // Generate random customer details from selected region for the current invoice
  const handleRandomizeBuyer = () => {
    const randomName = store.industry === 'nha_hang'
      ? (servingType === 'mang_ve' ? 'Khách Mang Về' : `Bàn số ${Math.floor(Math.random() * 35 + 1).toString().padStart(2, '0')}`)
      : VIETNAMESE_BUYERS[Math.floor(Math.random() * VIETNAMESE_BUYERS.length)];
    const rData = REGION_DATA[selectedRegion];
    const randomStreet = rData.streets[Math.floor(Math.random() * rData.streets.length)];
    const randomDistrict = rData.districts[Math.floor(Math.random() * rData.districts.length)];
    const randomStreetNo = 10 + Math.floor(Math.random() * 450);
    const randomAddress = `${randomStreetNo} Đường ${randomStreet}, ${randomDistrict}`;
    
    const hour = 8 + Math.floor(Math.random() * 12);
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    const randomTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    const randomCode = `FT26090${Math.floor(100000 + Math.random() * 900000)}`;

    setCustomBuyerName(randomName);
    setCustomBuyerAddress(randomAddress);
    setTxTime(randomTime);
    setTxCode(randomCode);

    setUserOverrides(prev => ({
      ...prev,
      [selectedInvoiceIndex]: {
        ...prev[selectedInvoiceIndex],
        buyerName: randomName,
        buyerAddress: randomAddress,
        txTime: randomTime,
        txCode: randomCode
      }
    }));
  };

  // Generate random customer details from selected region for ALL invoices
  const handleRandomizeAllBuyers = () => {
    const newOverrides = { ...userOverrides };
    subInvoices.forEach((inv, idx) => {
      const randomName = store.industry === 'nha_hang'
        ? (servingType === 'mang_ve' ? 'Khách Mang Về' : `Bàn số ${Math.floor(Math.random() * 35 + 1).toString().padStart(2, '0')}`)
        : VIETNAMESE_BUYERS[Math.floor(Math.random() * VIETNAMESE_BUYERS.length)];
      const rData = REGION_DATA[selectedRegion];
      const randomStreet = rData.streets[Math.floor(Math.random() * rData.streets.length)];
      const randomDistrict = rData.districts[Math.floor(Math.random() * rData.districts.length)];
      const randomStreetNo = 10 + Math.floor(Math.random() * 450);
      const randomAddress = `${randomStreetNo} Đường ${randomStreet}, ${randomDistrict}`;
      
      const hour = 8 + Math.floor(Math.random() * 12);
      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      const randomTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
      const randomCode = `FT26090${Math.floor(100000 + Math.random() * 900000)}`;

      newOverrides[idx] = {
        ...newOverrides[idx],
        buyerName: randomName,
        buyerAddress: randomAddress,
        txTime: randomTime,
        txCode: randomCode
      };
    });
    setUserOverrides(newOverrides);
    
    // Update active state if it matches the selected index
    const activeOverride = newOverrides[selectedInvoiceIndex] || {};
    setCustomBuyerName(activeOverride.buyerName ?? '');
    setCustomBuyerAddress(activeOverride.buyerAddress ?? '');
    setTxTime(activeOverride.txTime ?? '');
    setTxCode(activeOverride.txCode ?? '');
  };

  const drawMockQRCode = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, size, size);

    const drawFinder = (fx: number, fy: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(fx, fy, 28, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx + 4, fy + 4, 20, 20);
      ctx.fillStyle = '#000000';
      ctx.fillRect(fx + 8, fy + 8, 12, 12);
    };

    drawFinder(x + 8, y + 8);
    drawFinder(x + size - 36, y + 8);
    drawFinder(x + 8, y + size - 36);

    ctx.fillStyle = '#000000';
    ctx.fillRect(x + size - 24, y + size - 24, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + size - 20, y + size - 20, 4, 4);

    ctx.fillStyle = '#000000';
    const padding = 8;
    const innerSize = size - padding * 2;
    const cellSize = 4;
    const cells = Math.floor(innerSize / cellSize);

    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        const cx = x + padding + col * cellSize;
        const cy = y + padding + row * cellSize;
        const isTopLeft = col < 9 && row < 9;
        const isTopRight = col > cells - 10 && row < 9;
        const isBottomLeft = col < 9 && row > cells - 10;
        const isBottomRightMarker = col > cells - 7 && row > cells - 7;

        if (isTopLeft || isTopRight || isBottomLeft || isBottomRightMarker) {
          continue;
        }

        if (Math.random() > 0.45) {
          ctx.fillRect(cx, cy, cellSize, cellSize);
        }
      }
    }
  };

  const drawInvoiceToCanvas = (
    canvas: HTMLCanvasElement,
    inv: SubInvoice,
    idx: number,
    currentDocType: 'invoice' | 'receipt'
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const overrides = userOverrides[idx] || {};
    const activeBuyerName = overrides.buyerName ?? inv.buyerName;
    const activeBuyerAddress = overrides.buyerAddress ?? inv.buyerAddress;
    const activeAmount = inv.amount;
    const activeItems = inv.items;
    const activeInvoiceNo = overrides.invoiceNo ?? inv.invoiceNo;
    const activeTxTime = overrides.txTime ?? inv.txTime;
    const activeTxCode = overrides.txCode ?? inv.txCode;
    const activeReference = overrides.reference ?? inv.reference;

    const scale = 2;
    canvas.width = 540 * scale;
    canvas.height = currentDocType === 'invoice' ? 880 * scale : 750 * scale;
    ctx.scale(scale, scale);

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 540, canvas.height / scale);

    const formattedDate = record.date.split('-').reverse().join('/');

    if (currentDocType === 'invoice') {
      // --- CANVAS: DRAW SALES INVOICE ---
      
      // Store Header Block
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.fillText(store.name, 40, 50);

      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 11px "Inter", sans-serif';
      ctx.fillText(`Địa chỉ cửa hàng: ${store.address}`, 40, 70);
      ctx.fillText(`Ngày hóa đơn: ${formattedDate}`, 40, 85);
      
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 100);
      ctx.lineTo(500, 100);
      ctx.stroke();

      // Invoice Title
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HÓA ĐƠN BÁN HÀNG', 270, 135);

      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 11px "Inter", sans-serif';
      ctx.fillText(`Mã số: ${activeInvoiceNo}`, 270, 155);
      ctx.textAlign = 'left';

      // Buyer Info Block (Da Nang Customer)
      ctx.fillStyle = '#f8fafc';
      const isRestaurantAtTable = store.industry === 'nha_hang' && servingType === 'tai_ban';
      const blockHeight = isRestaurantAtTable ? 32 : 55;

      ctx.fillRect(40, 170, 460, blockHeight);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(40, 170, 460, blockHeight);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11px "Inter", sans-serif';
      
      let labelText = '';
      if (store.industry === 'nha_hang') {
        if (servingType === 'tai_ban') {
          labelText = 'BÀN SỐ / VỊ TRÍ PHỤC VỤ:';
        } else {
          labelText = 'HÌNH THỨC PHỤC VỤ:';
        }
      } else {
        labelText = 'KHÁCH HÀNG:';
      }

      ctx.fillText(labelText, 50, 187);
      const labelWidth = ctx.measureText(labelText).width;
      ctx.font = 'normal 11px "Inter", sans-serif';
      ctx.fillText(activeBuyerName.toUpperCase(), 50 + labelWidth + 8, 187);
      
      if (!isRestaurantAtTable) {
        ctx.fillStyle = '#475569';
        ctx.fillText(`Địa chỉ giao hàng: ${activeBuyerAddress}`, 50, 208);
      }

      // Table Header starts at Y=245
      let currentY = 245;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(40, currentY, 460, 26);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(40, currentY, 460, 26);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText('Hàng hóa / Dịch vụ', 50, currentY + 17);
      ctx.fillText('SL', 260, currentY + 17);
      ctx.fillText('Đơn giá', 310, currentY + 17);
      ctx.fillText('Thành tiền', 410, currentY + 17);

      currentY += 26;

      // Table Rows
      ctx.font = 'normal 11px "Inter", sans-serif';
      activeItems.forEach((item, index) => {
        if (index % 2 === 1) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(40, currentY, 460, 26);
        }
        ctx.fillStyle = '#0f172a';
        ctx.strokeRect(40, currentY, 460, 26);

        let nameText = item.name;
        if (nameText.length > 30) nameText = nameText.slice(0, 28) + '...';

        ctx.fillText(nameText, 50, currentY + 17);
        ctx.fillText(item.qty.toString(), 260, currentY + 17);
        ctx.fillText(formatVND(item.price).replace('₫', ''), 310, currentY + 17);
        ctx.fillText(formatVND(item.total).replace('₫', ''), 410, currentY + 17);
        
        currentY += 26;
      });

      // Summaries
      currentY += 15;
      ctx.fillStyle = '#475569';
      ctx.fillText('Cộng tiền hàng:', 280, currentY);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText(formatVND(activeAmount), 410, currentY);

      currentY += 20;
      ctx.font = 'normal 11px "Inter", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Thuế GTGT (0%):', 280, currentY);
      ctx.fillStyle = '#0f172a';
      ctx.fillText('0 đ', 410, currentY);

      currentY += 22;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(280, currentY - 12);
      ctx.lineTo(500, currentY - 12);
      ctx.stroke();

      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.fillText('Tổng thanh toán:', 280, currentY);
      ctx.fillStyle = '#0284c7'; // brand color
      ctx.fillText(formatVND(activeAmount), 405, currentY);

      // Payment Info Box (No QR Code - Cash or Transfer Only)
      currentY += 35;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(40, currentY, 460, 100);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(40, currentY, 460, 100);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText('PHƯƠNG THỨC THANH TOÁN: TIỀN MẶT HOẶC CHUYỂN KHOẢN NGÂN HÀNG', 60, currentY + 28);
      
      ctx.font = 'normal 10px "Inter", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`Ngân hàng thụ hưởng: ${selectedBank.shortName} (${selectedBank.name})`, 60, currentY + 48);
      ctx.fillText(`Số tài khoản cửa hàng: ${receiverAccount}`, 60, currentY + 65);
      ctx.fillText(`Chủ tài khoản: ${receiverName}`, 60, currentY + 82);

      // Footer
      currentY += 120;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 10px "Inter", sans-serif';
      ctx.fillText(`Cám ơn quý khách đã ủng hộ - ${store.name}`, 270, currentY);
      ctx.textAlign = 'left';

    } else {
      // --- CANVAS: DRAW BANK RECEIPT (NAPAS TRANSIT) ---
      ctx.fillStyle = selectedBank.color;
      ctx.fillRect(0, 0, 540, 10);

      ctx.fillStyle = selectedBank.color;
      ctx.font = 'extrabold 18px "Inter", sans-serif';
      ctx.fillText(selectedBank.logoText, 40, 50);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px "Inter", sans-serif';
      ctx.fillText('BIÊN LAI CHUYỂN TIỀN NHANH NAPAS 247', 40, 70);

      // Success Checkmark
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(270, 115, 25, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(260, 115);
      ctx.lineTo(267, 122);
      ctx.lineTo(282, 107);
      ctx.stroke();

      ctx.fillStyle = '#16a34a';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Giao dịch chuyển khoản thành công', 270, 162);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'extrabold 24px "Inter", sans-serif';
      ctx.fillText(formatVND(activeAmount), 270, 200);

      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 11px "Inter", sans-serif';
      ctx.fillText(`${formattedDate} - ${activeTxTime}`, 270, 222);
      ctx.textAlign = 'left';

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(40, 245);
      ctx.lineTo(500, 245);
      ctx.stroke();

      let itemY = 275;
      const drawRow = (label: string, val: string, isBoldVal: boolean = false) => {
        ctx.fillStyle = '#64748b';
        ctx.font = 'normal 11px "Inter", sans-serif';
        ctx.fillText(label, 40, itemY);

        ctx.fillStyle = isBoldVal ? '#0f172a' : '#334155';
        ctx.font = isBoldVal ? 'bold 11px "Inter", sans-serif' : 'normal 11px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val.toUpperCase(), 500, itemY);
        ctx.textAlign = 'left';

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, itemY + 12);
        ctx.lineTo(500, itemY + 12);
        ctx.stroke();

        itemY += 32;
      };

      drawRow('Tài khoản nguồn', senderAccount);
      drawRow(
        store.industry === 'nha_hang' 
          ? (servingType === 'mang_ve' ? 'Hình thức / Khách hàng' : 'Bàn số / Khách hàng') 
          : 'Người chuyển tiền (Đà Nẵng)', 
        activeBuyerName
      );
      drawRow('Tài khoản thụ hưởng', receiverAccount);
      drawRow('Người thụ hưởng', receiverName, true);
      drawRow('Ngân hàng thụ hưởng', selectedBank.name, true);
      drawRow('Mã giao dịch (Napas ID)', activeTxCode);
      drawRow('Nội dung chuyển tiền', activeReference);

      itemY += 10;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(40, itemY, 460, 45);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(40, itemY, 460, 45);

      ctx.fillStyle = '#475569';
      ctx.font = 'italic 10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Biên giao dịch chính thức được phê duyệt qua cổng thanh toán bảo mật liên ngân hàng.', 270, itemY + 20);
      ctx.fillText('Cảm ơn quý khách tại Đà Nẵng đã sử dụng dịch vụ thanh toán trực tuyến!', 270, itemY + 34);
      ctx.textAlign = 'left';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && currentInvoice) {
      drawInvoiceToCanvas(canvas, currentInvoice, selectedInvoiceIndex, docType);
    }
  }, [docType, bankNameInput, receiverName, receiverAccount, activeTxCode, activeTxTime, activeReference, activeBuyerName, activeBuyerAddress, activeAmount, activeItems, store.address, currentInvoice, selectedInvoiceIndex, servingType]);

  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      const tempCanvas = document.createElement('canvas');
      for (let idx = 0; idx < subInvoices.length; idx++) {
        const inv = subInvoices[idx];
        drawInvoiceToCanvas(tempCanvas, inv, idx, docType);
        
        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const buyerNameStr = (userOverrides[idx]?.buyerName ?? inv.buyerName).toLowerCase().replace(/\s+/g, '-');
        const invNoStr = userOverrides[idx]?.invoiceNo ?? inv.invoiceNo;
        
        link.download = docType === 'invoice'
          ? `hoa-don-le-${buyerNameStr}-${invNoStr}.png`
          : `bien-lai-bank-${buyerNameStr}-${invNoStr}.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (err) {
      console.error("Lỗi tải xuống hàng loạt hóa đơn:", err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = docType === 'invoice' 
      ? `hoa-don-le-${activeBuyerName.toLowerCase().replace(/\s+/g, '-')}-${activeInvoiceNo}.png`
      : `bien-lai-bank-${activeBuyerName.toLowerCase().replace(/\s+/g, '-')}-${activeInvoiceNo}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-start lg:items-center justify-center p-2 sm:p-4 z-50 animate-fade-in backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-6xl w-full flex flex-col lg:flex-row shadow-2xl overflow-hidden my-auto">
        
        {/* LEFT PANEL: CONFIGURATOR AND MULTI-INVOICE SPLITTER */}
        <div className="lg:w-5/12 p-6 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-400" /> Chia tách & Xuất Hoá đơn
                </h3>
                <p className="text-[10px] text-zinc-400">Tự động phân bổ doanh số sang khách hàng tại {REGION_DATA[selectedRegion].name}</p>
              </div>
              <button 
                onClick={onClose}
                className="lg:hidden text-zinc-400 hover:text-zinc-200 p-1.5 bg-zinc-900 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slider / Quantifier section */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-4">
              {/* Region Selection */}
              <div className="space-y-1.5 pb-1">
                <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" /> Chọn Tỉnh / Thành phố khách hàng
                </label>
                <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
                  {(['danang', 'hue', 'hcm', 'hanoi'] as const).map((reg) => {
                    const isSel = selectedRegion === reg;
                    return (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => handleRegionChange(reg)}
                        className={`py-2 px-0.5 rounded-lg text-center text-[10px] font-bold transition-all cursor-pointer ${
                          isSel
                            ? 'bg-sky-500 text-zinc-950 shadow-md font-extrabold'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                        }`}
                      >
                        {reg === 'hcm' ? 'TP.HCM' : REGION_DATA[reg].name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Preset Toggle: 6 Invoices = 80% of daily revenue */}
              <div className="p-3 bg-sky-500/5 border border-sky-500/10 rounded-xl space-y-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={use80PercentPreset}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUse80PercentPreset(checked);
                      setSelectedInvoiceIndex(0);
                    }}
                    className="w-4 h-4 text-sky-500 bg-zinc-950 border-zinc-800 rounded focus:ring-sky-500 focus:ring-offset-zinc-900 cursor-pointer"
                  />
                  <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> 6 HĐ = 80% Doanh thu ngày
                  </span>
                </label>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  Tự động phân bổ <span className="font-bold text-zinc-200">80% doanh thu</span> ({formatVND(record.revenue * 0.8)}) thành <span className="font-bold text-sky-400 font-mono">6 hóa đơn</span> lẻ thuộc khu vực {REGION_DATA[selectedRegion].name} để xuất ảnh hàng loạt nhanh chóng.
                </p>
              </div>

              {!use80PercentPreset && (
                <div>
                  <label className="block text-[11px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2 flex justify-between">
                    <span>Số lượng hoá đơn trong ngày</span>
                    <span className="text-sky-400 font-extrabold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">{numInvoices} HĐ</span>
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={numInvoices}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setNumInvoices(val);
                        setSelectedInvoiceIndex(0);
                      }}
                      className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      placeholder="1"
                      value={numInvoices === 0 ? '' : numInvoices}
                      onFocus={(e) => {
                        const target = e.currentTarget;
                        requestAnimationFrame(() => target.select());
                      }}
                      onChange={(e) => {
                        let raw = e.target.value;
                        if (raw.length > 1 && raw.startsWith('0')) {
                          raw = raw.replace(/^0+/, '');
                        }
                        if (raw === '') {
                          setNumInvoices(0);
                          return;
                        }
                        const val = parseInt(raw, 10);
                        if (!isNaN(val)) {
                          setNumInvoices(Math.min(30, Math.max(0, val)));
                          setSelectedInvoiceIndex(0);
                        }
                      }}
                      onBlur={() => {
                        if (!numInvoices || numInvoices < 1) {
                          setNumInvoices(1);
                          setSelectedInvoiceIndex(0);
                        }
                      }}
                      className="w-12 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-center text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Sub-invoice carousel / selector list */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center">
                  <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Chọn hoá đơn để tinh chỉnh & tải xuống:
                  </span>
                  <button
                    type="button"
                    onClick={handleRandomizeAllBuyers}
                    className="text-[9px] font-extrabold text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 hover:border-sky-400/30 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Tạo ngẫu nhiên toàn bộ
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {subInvoices.map((inv, idx) => {
                    const isSelected = idx === selectedInvoiceIndex;
                    const bName = userOverrides[idx]?.buyerName ?? inv.buyerName;
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => setSelectedInvoiceIndex(idx)}
                        className={`px-3 py-2.5 rounded-xl text-left border flex flex-col gap-1 min-w-[125px] transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-sky-500/10 border-sky-400 text-sky-400 ring-1 ring-sky-500/20'
                            : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[9px] font-bold tracking-wider uppercase">Hóa đơn #{inv.id}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>}
                        </div>
                        <span className="text-xs font-black font-mono text-zinc-100">{formatVND(inv.amount)}</span>
                        <span className="text-[9px] truncate text-zinc-500 font-medium max-w-[110px]">{bName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom Excel Item Upload section */}
            <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="block text-[11px] font-extrabold text-zinc-300 uppercase tracking-widest">
                      Mặt hàng tùy chỉnh (Excel)
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      Tải lên tệp mặt hàng riêng biệt của cửa hàng
                    </span>
                  </div>
                </div>
                {customItemPool.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCustomItems}
                    className="text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                    title="Xóa danh sách mặt hàng tùy chỉnh"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Xóa
                  </button>
                )}
              </div>

              {customItemPool.length > 0 ? (
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/60 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                      Đang kích hoạt ({customItemPool.length} mặt hàng)
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-[9px] text-zinc-400 hover:text-sky-400 transition-colors cursor-pointer underline"
                    >
                      Tải file mẫu
                    </button>
                  </div>
                  <div className="max-h-[80px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {customItemPool.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[9px] text-zinc-400 font-medium">
                        <span className="truncate max-w-[140px] text-zinc-300">{item.name}</span>
                        <span className="font-mono text-zinc-400">{formatVND(item.price).replace('₫', '')} ({item.unit})</span>
                      </div>
                    ))}
                    {customItemPool.length > 10 && (
                      <div className="text-center text-[8px] text-zinc-500">
                        ... và {customItemPool.length - 10} mặt hàng khác
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850 border-dashed text-center space-y-2.5">
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Chưa tải tệp mặt hàng. Hệ thống đang sử dụng danh mục hàng hóa ngẫu nhiên theo ngành nghề.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-zinc-400" /> Tải mẫu Excel
                    </button>
                    <label
                      htmlFor="excel-item-upload-input"
                      className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-450 text-zinc-950 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" /> Tải file lên
                    </label>
                  </div>
                </div>
              )}

              <input
                id="excel-item-upload-input"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </div>

            {/* Document Type Selector */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  docType === 'invoice'
                    ? 'bg-zinc-800 text-sky-400 border border-zinc-700/50 shadow-inner'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Hóa đơn bán hàng
              </button>
              <button
                type="button"
                onClick={() => setDocType('receipt')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  docType === 'receipt'
                    ? 'bg-zinc-800 text-sky-400 border border-zinc-700/50 shadow-inner'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Biên lai chuyển khoản
              </button>
            </div>

            {/* Config Fields Form */}
            <div className="space-y-4 text-xs">
              <div className="border-t border-zinc-800 pt-3 flex justify-between items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Hiệu chỉnh Hóa đơn lẻ #{selectedInvoiceIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeBuyer}
                  className="text-[9px] font-bold text-zinc-300 hover:text-sky-400 flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-2 py-1 rounded-lg transition-all cursor-pointer"
                  title={`Tạo ngẫu nhiên một khách hàng ${REGION_DATA[selectedRegion].name} khác cho hóa đơn này`}
                >
                  <Sparkles className="w-2.5 h-2.5 text-sky-400" /> Ngẫu nhiên khách {selectedRegion === 'danang' ? 'ĐN' : selectedRegion === 'hue' ? 'Huế' : selectedRegion === 'hcm' ? 'HCM' : 'HN'}
                </button>
              </div>

              {/* Serving style selector for restaurant stores */}
              {store.industry === 'nha_hang' && (
                <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800 space-y-1.5">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    Hình thức phục vụ nhà hàng
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setServingType('tai_ban')}
                      className={`py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer border ${
                        servingType === 'tai_ban'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/40'
                          : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-850'
                      }`}
                    >
                      Ăn tại bàn (Không địa chỉ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setServingType('mang_ve')}
                      className={`py-1.5 text-center text-[11px] font-bold rounded-lg transition-all cursor-pointer border ${
                        servingType === 'mang_ve'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/40'
                          : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-850'
                      }`}
                    >
                      Mua mang về (Có địa chỉ)
                    </button>
                  </div>
                </div>
              )}

              {/* General inputs matching the currently selected invoice */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    {store.industry === 'nha_hang' 
                      ? (servingType === 'mang_ve' ? 'Hình thức / Khách hàng' : 'Bàn số / Vị trí bàn') 
                      : 'Tên người mua hàng'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customBuyerName}
                      onChange={(e) => {
                        setCustomBuyerName(e.target.value);
                        handleUpdateOverride('buyerName', e.target.value);
                      }}
                      className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                    />
                    <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">
                    Mã giao dịch / Hoá đơn
                  </label>
                  <input
                    type="text"
                    value={docType === 'invoice' ? activeInvoiceNo : activeTxCode}
                    onChange={(e) => {
                      if (docType === 'invoice') {
                        handleUpdateOverride('invoiceNo', e.target.value);
                      } else {
                        setTxCode(e.target.value);
                        handleUpdateOverride('txCode', e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              {!(store.industry === 'nha_hang' && servingType === 'tai_ban') ? (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" /> Địa chỉ người mua ({REGION_DATA[selectedRegion].name})
                  </label>
                  <input
                    type="text"
                    value={customBuyerAddress}
                    onChange={(e) => {
                      setCustomBuyerAddress(e.target.value);
                      handleUpdateOverride('buyerAddress', e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                    Hỗ trợ quy chuẩn địa chỉ thuộc các phường/quận tại TP. {REGION_DATA[selectedRegion].name} phù hợp để ghi nhận doanh thu đúng hạn.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-zinc-500 text-[11px] leading-relaxed">
                  <span className="font-bold text-zinc-400 flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-600" /> Địa chỉ người mua
                  </span>
                  Phục vụ trực tiếp ăn uống tại bàn nên <strong>không ghi thông tin địa chỉ</strong> giao nhận hàng hóa trên hóa đơn bán lẻ này.
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Nội dung mô tả thanh toán
                </label>
                <input
                  type="text"
                  value={activeReference}
                  onChange={(e) => {
                    setReference(e.target.value);
                    handleUpdateOverride('reference', e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Receiving Merchant Info (Bank) */}
              <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800 space-y-3">
                <span className="block text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                  Cấu hình ngân hàng thụ hưởng cửa hàng
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    list="invoice-banks"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder="Tên ngân hàng"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none"
                  />
                  <datalist id="invoice-banks">
                    {SUPPORTED_BANKS.map((b) => (
                      <option key={b.code} value={b.shortName}>
                        {b.name}
                      </option>
                    ))}
                  </datalist>
                  <input
                    type="text"
                    value={receiverAccount}
                    onChange={(e) => setReceiverAccount(e.target.value)}
                    placeholder="Số tài khoản"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-4 border-t border-zinc-800 space-y-3">
            <button
              onClick={handleDownload}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl font-extrabold tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              Tải Hoá Đơn Ảnh (#{selectedInvoiceIndex + 1})
            </button>

            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sky-400 rounded-xl font-bold tracking-wider text-[11px] uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isDownloadingAll ? 'Đang xuất ảnh...' : `Tải toàn bộ ${subInvoices.length} ảnh hoá đơn`}
            </button>

            <p className="text-[10px] text-zinc-500 text-center leading-normal">
              Bản vẽ được kết xuất với mật độ điểm ảnh 200% (High-DPI Retina) sắc nét, thích hợp in ấn hoặc gửi zalo, đối soát.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE DOCUMENT RENDERING PREVIEW */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-zinc-900/60 max-h-[85vh] overflow-y-auto min-h-[450px]">
          <div className="flex justify-between w-full max-w-[420px] items-center mb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Bản xem trước trực tiếp (Hóa đơn lẻ {selectedInvoiceIndex + 1}/{subInvoices.length})
            </span>
            <button
              onClick={onClose}
              className="hidden lg:flex text-zinc-400 hover:text-zinc-200 p-1.5 hover:bg-zinc-800 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden Canvas used for generating exportable image */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Renderable HTML Mockup replicating identical details */}
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden text-zinc-900 border border-zinc-200 p-6 space-y-4 flex flex-col justify-between aspect-[1/1.4] transition-all transform scale-100">
            {docType === 'invoice' ? (
              // HTML PREVIEW: STORE SALES INVOICE WITH CUSTOMER INFO
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-[13px] tracking-tight text-zinc-950">{store.name}</h4>
                      <p className="text-[9px] text-zinc-500 max-w-[210px] leading-tight">{store.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-extrabold uppercase bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-full border border-sky-500/20">
                        Doanh thu lẻ
                      </span>
                    </div>
                  </div>

                  <div className="text-center my-3.5">
                    <h3 className="font-black text-base tracking-wider text-zinc-950">HÓA ĐƠN BÁN HÀNG</h3>
                    <p className="text-[9px] font-mono text-zinc-400 mt-0.5">Số: {activeInvoiceNo}</p>
                  </div>

                  {/* Buyer details on preview */}
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/80 mb-3 space-y-0.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-medium">
                        {store.industry === 'nha_hang' 
                          ? (servingType === 'mang_ve' ? 'Hình thức phục vụ:' : 'Bàn số / Vị trí:') 
                          : 'Người mua hàng:'}
                      </span>
                      <span className="font-bold text-zinc-800 uppercase">{activeBuyerName}</span>
                    </div>
                    {!(store.industry === 'nha_hang' && servingType === 'tai_ban') && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-medium">Địa chỉ khách:</span>
                        <span className="font-medium text-zinc-600 truncate max-w-[200px]" title={activeBuyerAddress}>
                          {activeBuyerAddress}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* List of items table preview */}
                  <div className="border border-zinc-200 rounded-lg overflow-hidden text-[10px]">
                    <div className="grid grid-cols-12 bg-zinc-50 border-b border-zinc-200 p-2 font-bold text-zinc-600">
                      <div className="col-span-6">Tên mặt hàng</div>
                      <div className="col-span-2 text-center">SL</div>
                      <div className="col-span-4 text-right">Thành tiền</div>
                    </div>
                    <div className="divide-y divide-zinc-100 max-h-[120px] overflow-y-auto">
                      {activeItems.map((item) => (
                        <div key={item.no} className="grid grid-cols-12 p-2 text-zinc-700">
                          <div className="col-span-6 truncate font-medium">{item.name}</div>
                          <div className="col-span-2 text-center font-semibold">{item.qty}</div>
                          <div className="col-span-4 text-right font-bold font-mono">{formatVND(item.total).replace('₫', '')}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-1 mt-2.5 text-right text-[10px]">
                    <div className="flex justify-end gap-6 text-zinc-500">
                      <span>Cộng tiền hàng:</span>
                      <span className="font-bold font-mono text-zinc-800">{formatVND(activeAmount)}</span>
                    </div>
                    <div className="flex justify-end gap-6 text-zinc-500">
                      <span>Thuế GTGT (0%):</span>
                      <span className="font-mono text-zinc-800">0 đ</span>
                    </div>
                    <div className="h-px bg-zinc-200 my-1"></div>
                    <div className="flex justify-end gap-6 font-extrabold text-xs">
                      <span className="text-zinc-900">Tổng thanh toán:</span>
                      <span className="text-sky-600 font-mono text-sm">{formatVND(activeAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom payment details Box */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 space-y-2">
                  <div className="font-bold text-zinc-900 text-[10px] uppercase tracking-wider border-b border-zinc-200 pb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-sky-500" /> Phương thức thanh toán
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white p-1.5 rounded border border-zinc-200/60 flex items-center gap-1.5 font-bold text-zinc-700">
                      <Coins className="w-3.5 h-3.5 text-amber-500" /> Tiền mặt (Cash)
                    </div>
                    <div className="bg-white p-1.5 rounded border border-zinc-200/60 flex items-center gap-1.5 font-bold text-zinc-700">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" /> Chuyển khoản (Bank)
                    </div>
                  </div>
                  <div className="text-[10px] pt-1.5 space-y-0.5 border-t border-zinc-200/60">
                    <p className="font-semibold text-zinc-700">Ngân hàng thụ hưởng: {selectedBank.shortName} ({selectedBank.name})</p>
                    <p className="font-mono font-bold text-zinc-900">STK: {receiverAccount}</p>
                    <p className="font-medium text-zinc-500">Chủ tài khoản: {receiverName}</p>
                  </div>
                </div>
              </div>
            ) : (
              // HTML PREVIEW: BANK TRANSFER SUCCESSFUL VOUCHER (NAPAS RECEIPT)
              <div className="space-y-3 flex-1 flex flex-col justify-between text-zinc-800">
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                    <span className="text-sm font-extrabold tracking-tight" style={{ color: selectedBank.color }}>
                      {selectedBank.logoText}
                    </span>
                    <span className="text-[8px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      NAPAS 247
                    </span>
                  </div>

                  <div className="flex flex-col items-center py-1 space-y-1">
                    <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-green-600 font-bold text-[11px]">Chuyển khoản thành công</span>
                    <h2 className="text-base font-extrabold text-zinc-950 font-mono tracking-tight">{formatVND(activeAmount)}</h2>
                    <span className="text-[8px] text-zinc-400 font-mono">{record.date.split('-').reverse().join('/')} - {activeTxTime}</span>
                  </div>

                  {/* Transaction info grid */}
                  <div className="divide-y divide-zinc-50 text-[10px] space-y-1.5">
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400">Tài khoản nguồn</span>
                      <span className="font-mono text-zinc-800">{senderAccount}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400">Người chuyển (Đà Nẵng)</span>
                      <span className="font-medium text-zinc-900 uppercase">{activeBuyerName}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400">Tài khoản thụ hưởng</span>
                      <span className="font-mono text-zinc-800">{receiverAccount}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400">Người thụ hưởng</span>
                      <span className="font-bold text-zinc-900 uppercase">{receiverName}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400">Ngân hàng nhận</span>
                      <span className="font-bold text-zinc-950">{selectedBank.shortName}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400">Mã giao dịch</span>
                      <span className="font-mono text-zinc-600 font-semibold">{activeTxCode}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-400">Nội dung chuyển</span>
                      <span className="text-zinc-700 italic max-w-[190px] text-right truncate">{activeReference}</span>
                    </div>
                  </div>
                </div>

                {/* Security footer stamp */}
                <div className="bg-zinc-50 border border-zinc-150 rounded-lg p-2 text-center text-[8px] text-zinc-400 leading-normal italic">
                  Giao dịch an toàn được xác thực tự động bởi Napas & {selectedBank.shortName}.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
