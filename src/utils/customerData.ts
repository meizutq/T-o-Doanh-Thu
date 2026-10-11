// Regional Customer Database across Vietnamese Provinces
// For output purchase contracts and invoice customer generation

export interface CustomerProfile {
  id: string;
  name: string;
  citizenId: string; // 12-digit standard CCCD
  address: string;
  phone: string;
  bankAccount: string;
  bankName: string;
  provinceKey: string;
  provinceName: string;
}

export interface ProvinceInfo {
  key: string;
  name: string;
  shortName: string;
  cccdPrefix: string;
  streets: string[];
  districts: string[];
}

export const PROVINCES_DATA: Record<string, ProvinceInfo> = {
  danang: {
    key: 'danang',
    name: 'Đà Nẵng',
    shortName: 'Đà Nẵng',
    cccdPrefix: '048',
    streets: [
      'Nguyễn Văn Linh', 'Lê Duẩn', 'Điện Biên Phủ', 'Trần Hưng Đạo', 'Bạch Đằng',
      'Nguyễn Hữu Thọ', 'Phan Châu Trinh', 'Hùng Vương', 'Trường Chinh', 'Nguyễn Lương Bằng',
      'Võ Nguyên Giáp', 'Phạm Văn Đồng', 'Ngô Quyền', 'Cách Mạng Tháng Tám', 'Tôn Đức Thắng',
      '2 Tháng 9', '30 Tháng 4', 'Đống Đa', 'Quang Trung', 'Trần Phú', 'Hàm Nghi',
      'Nguyễn Văn Thoại', 'Lê Lợi', 'Hoàng Diệu', 'Phan Đăng Lưu', 'Trần Cao Vân',
      'Lê Đình Lý', 'Hải Phòng', 'Nguyễn Tất Thành', 'Nguyễn Chí Thanh', 'Yên Bái',
      'Lê Thanh Nghị', 'Tiểu La', 'Lê Sát', 'Xô Viết Nghệ Tĩnh', 'Trần Phước Phan'
    ],
    districts: [
      'Quận Hải Châu, TP. Đà Nẵng',
      'Quận Thanh Khê, TP. Đà Nẵng',
      'Quận Sơn Trà, TP. Đà Nẵng',
      'Quận Ngũ Hành Sơn, TP. Đà Nẵng',
      'Quận Cẩm Lệ, TP. Đà Nẵng',
      'Quận Liên Chiểu, TP. Đà Nẵng',
      'Huyện Hòa Vang, TP. Đà Nẵng'
    ]
  },
  hue: {
    key: 'hue',
    name: 'Thừa Thiên Huế',
    shortName: 'Huế',
    cccdPrefix: '046',
    streets: [
      'Lê Lợi', 'Hùng Vương', 'Bến Nghé', 'Đống Đa', 'Nguyễn Huệ',
      'Trần Hưng Đạo', 'Phan Đăng Lưu', 'Phan Bội Châu', 'Nguyễn Sinh Cung', 'Chi Lăng',
      'Phan Chu Trinh', 'Trần Quang Khải', 'Nguyễn Khuyến', 'Lâm Hoằng', 'Điện Biên Phủ',
      'Nguyễn Trãi', 'Lê Thánh Tôn', 'Đinh Tiên Hoàng', 'Đoàn Thị Điểm', 'Nhật Lệ',
      'Mai Thúc Loan', 'Huỳnh Thúc Kháng', 'Lê Trường An', 'Ngự Bình', 'Trần Phú'
    ],
    districts: [
      'Phường Vĩnh Ninh, TP. Huế, T. Thừa Thiên Huế',
      'Phường Phú Nhuận, TP. Huế, T. Thừa Thiên Huế',
      'Phường Trường An, TP. Huế, T. Thừa Thiên Huế',
      'Phường Thuận Lộc, TP. Huế, T. Thừa Thiên Huế',
      'Phường Phú Hội, TP. Huế, T. Thừa Thiên Huế',
      'Phường Vỹ Dạ, TP. Huế, T. Thừa Thiên Huế',
      'Phường Xuân Phú, TP. Huế, T. Thừa Thiên Huế',
      'Phường Hương Sơ, TP. Huế, T. Thừa Thiên Huế',
      'Thị xã Hương Thủy, T. Thừa Thiên Huế',
      'Huyện Phú Vang, T. Thừa Thiên Huế'
    ]
  },
  hcm: {
    key: 'hcm',
    name: 'TP. Hồ Chí Minh',
    shortName: 'TP.HCM',
    cccdPrefix: '079',
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
    key: 'hanoi',
    name: 'TP. Hà Nội',
    shortName: 'Hà Nội',
    cccdPrefix: '001',
    streets: [
      'Hoàn Kiếm', 'Trần Hưng Đạo', 'Bà Triệu', 'Phố Huế', 'Tràng Thi',
      'Lý Thường Kiệt', 'Hai Bà Trưng', 'Hàng Bông', 'Hàng Đào', 'Nguyễn Thái Học',
      'Kim Mã', 'Giảng Võ', 'Đê La Thành', 'Xã Đàn', 'Giải Phóng', 'Trường Chinh',
      'Nguyễn Trãi', 'Cầu Giấy', 'Xuân Thủy', 'Trần Duy Hưng', 'Nguyễn Chí Thanh',
      'Láng Hạ', 'Tây Sơn', 'Chùa Bộc', 'Thụy Khuê', 'Hoàng Hoa Thám', 'Phan Đình Phùng'
    ],
    districts: [
      'Quận Hoàn Kiếm, TP. Hà Nội',
      'Quận Hai Bà Trưng, TP. Hà Nội',
      'Quận Ba Đình, TP. Hà Nội',
      'Quận Đống Đa, TP. Hà Nội',
      'Quận Tây Hồ, TP. Hà Nội',
      'Quận Cầu Giấy, TP. Hà Nội',
      'Quận Thanh Xuân, TP. Hà Nội',
      'Quận Hoàng Mai, TP. Hà Nội',
      'Quận Long Biên, TP. Hà Nội',
      'Quận Hà Đông, TP. Hà Nội'
    ]
  },
  binhduong: {
    key: 'binhduong',
    name: 'Bình Dương',
    shortName: 'Bình Dương',
    cccdPrefix: '074',
    streets: [
      'Đại Lộ Bình Dương', 'Yersin', 'Huỳnh Văn Lũy', 'Phạm Ngọc Thạch', 'Cách Mạng Tháng Tám',
      'Bác Sĩ Yersin', 'Lê Hồng Phong', 'Nguyễn Thị Minh Khai', 'Nguyễn Du', 'Phan Đăng Lưu',
      'Bùi Quốc Khánh', 'Đoàn Thị Liên', 'Trần Hưng Đạo', '30 Tháng 4', 'ĐT 743'
    ],
    districts: [
      'TP. Thủ Dầu Một, T. Bình Dương',
      'TP. Thuận An, T. Bình Dương',
      'TP. Dĩ An, T. Bình Dương',
      'TP. Tân Uyên, T. Bình Dương',
      'TX. Bến Cát, T. Bình Dương'
    ]
  },
  dongnai: {
    key: 'dongnai',
    name: 'Đồng Nai',
    shortName: 'Đồng Nai',
    cccdPrefix: '075',
    streets: [
      'Nguyễn Ái Quốc', 'Phạm Văn Thuận', 'Võ Thị Sáu', 'Đồng Khởi', 'Huỳnh Văn Nghệ',
      'Trần Quốc Toản', 'Hà Huy Giáp', '30 Tháng 4', 'Phan Trung', 'Nguyễn Du',
      'Bùi Trọng Nghĩa', 'Quốc Lộ 1K', 'Quốc Lộ 51', 'Hoàng Minh Châu', 'Lê Lợi'
    ],
    districts: [
      'TP. Biên Hòa, T. Đồng Nai',
      'Huyện Long Thành, T. Đồng Nai',
      'Huyện Nhơn Trạch, T. Đồng Nai',
      'Huyện Trảng Bom, T. Đồng Nai',
      'TP. Long Khánh, T. Đồng Nai'
    ]
  },
  cantho: {
    key: 'cantho',
    name: 'TP. Cần Thơ',
    shortName: 'Cần Thơ',
    cccdPrefix: '092',
    streets: [
      'Đại Lộ Hòa Bình', 'Nguyễn Trãi', '30 Tháng 4', '3 Tháng 2', 'Trần Hưng Đạo',
      'Mậu Thân', 'Nguyễn Văn Cừ', 'Cách Mạng Tháng Tám', 'Lý Tự Trọng', 'Hùng Vương',
      'Trần Văn Hoài', 'Ngô Quyền', 'Nam Kỳ Khởi Nghĩa', 'Phan Đình Phùng', 'Hai Bà Trưng'
    ],
    districts: [
      'Quận Ninh Kiều, TP. Cần Thơ',
      'Quận Bình Thủy, TP. Cần Thơ',
      'Quận Cái Răng, TP. Cần Thơ',
      'Quận Ô Môn, TP. Cần Thơ',
      'Quận Thốt Nốt, TP. Cần Thơ'
    ]
  },
  haiphong: {
    key: 'haiphong',
    name: 'TP. Hải Phòng',
    shortName: 'Hải Phòng',
    cccdPrefix: '031',
    streets: [
      'Lạch Tray', 'Cầu Đất', 'Trần Phú', 'Quang Trung', 'Lê Hồng Phong',
      'Nguyễn Đức Cảnh', 'Hoàng Văn Thụ', 'Tô Hiệu', 'Lê Lợi', 'Điện Biên Phủ',
      'Đà Nẵng', 'Hồ Sen', 'Văn Cao', 'Nguyễn Bỉnh Khiêm', 'Phạm Văn Đồng'
    ],
    districts: [
      'Quận Ngô Quyền, TP. Hải Phòng',
      'Quận Hồng Bàng, TP. Hải Phòng',
      'Quận Lê Chân, TP. Hải Phòng',
      'Quận Hải An, TP. Hải Phòng',
      'Quận Kiến An, TP. Hải Phòng'
    ]
  },
  quangnam: {
    key: 'quangnam',
    name: 'Quảng Nam',
    shortName: 'Quảng Nam',
    cccdPrefix: '049',
    streets: [
      'Hùng Vương', 'Phan Bội Châu', 'Huỳnh Thúc Kháng', 'Trần Cao Vân', 'Nguyễn Hoàng',
      'Trần Hưng Đạo', 'Cửa Đại', 'Lý Thường Kiệt', 'Trần Phú', 'Nguyễn Tất Thành'
    ],
    districts: [
      'TP. Tam Kỳ, T. Quảng Nam',
      'TP. Hội An, T. Quảng Nam',
      'Thị xã Điện Bàn, T. Quảng Nam',
      'Huyện Duy Xuyên, T. Quảng Nam',
      'Huyện Núi Thành, T. Quảng Nam'
    ]
  },
  khanhhoa: {
    key: 'khanhhoa',
    name: 'Khánh Hòa',
    shortName: 'Khánh Hòa',
    cccdPrefix: '056',
    streets: [
      'Trần Phú', 'Lê Thánh Tôn', 'Nguyễn Thiện Thuật', 'Hùng Vương', 'Thống Nhất',
      '2 Tháng 4', 'Quang Trung', 'Yersin', 'Hoàng Hoa Thám', 'Lê Hồng Phong'
    ],
    districts: [
      'TP. Nha Trang, T. Khánh Hòa',
      'TP. Cam Ranh, T. Khánh Hòa',
      'Thị xã Ninh Hòa, T. Khánh Hòa',
      'Huyện Diên Khánh, T. Khánh Hòa'
    ]
  }
};

const BANK_NAMES_POOL = [
  'Vietcombank',
  'Techcombank',
  'MB Bank',
  'ACB',
  'BIDV',
  'VietinBank',
  'Agribank',
  'VPBank',
  'Sacombank',
  'TPBank'
];

const VIETNAMESE_FIRST_LAST_NAMES = [
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

// Helper to generate realistic 12-digit CCCD based on province
export function generateRealisticCCCD(provinceCccdPrefix: string, seed: number = Math.random()): string {
  // Format: <prefix 3 digits><gender/century 1 digit: 0=male 20th cent, 1=female, 2=male 21st, 3=female 21st><birth year 2 digits><random 6 digits>
  const genderCentury = Math.floor((seed * 100) % 4); // 0, 1, 2, 3
  const birthYear = Math.floor(75 + ((seed * 37) % 25)); // 75 to 99
  const randomSix = Math.floor(100000 + ((seed * 987654) % 900000)).toString().padStart(6, '0');
  return `${provinceCccdPrefix}${genderCentury}${birthYear.toString().padStart(2, '0')}${randomSix}`;
}

// Generate realistic bank account
export function generateRealisticBankAccount(bankName: string, seed: number = Math.random()): string {
  if (bankName.includes('Vietcombank')) {
    return `0071${Math.floor(10000000 + (seed * 89999999))}`;
  } else if (bankName.includes('Techcombank')) {
    return `1903${Math.floor(1000000000 + (seed * 8999999999))}`;
  } else if (bankName.includes('MB Bank')) {
    return `0888${Math.floor(1000000 + (seed * 8999999))}`;
  } else if (bankName.includes('ACB')) {
    return `2468${Math.floor(100000 + (seed * 899999))}`;
  } else if (bankName.includes('BIDV')) {
    return `6201${Math.floor(1000000000 + (seed * 8999999999))}`;
  } else if (bankName.includes('VietinBank')) {
    return `1010${Math.floor(1000000000 + (seed * 8999999999))}`;
  }
  return `9999${Math.floor(10000000 + (seed * 89999999))}`;
}

// Pre-generated persistent customer profiles per province
export const PROVINCE_CUSTOMERS: Record<string, CustomerProfile[]> = {};

// Initialize customer profiles for each province
Object.entries(PROVINCES_DATA).forEach(([pKey, pInfo]) => {
  const list: CustomerProfile[] = [];
  const count = 12; // 12 standard customer profiles per province

  for (let i = 0; i < count; i++) {
    const name = VIETNAMESE_FIRST_LAST_NAMES[(i * 7 + pKey.length * 3) % VIETNAMESE_FIRST_LAST_NAMES.length];
    const street = pInfo.streets[(i * 3 + pKey.charCodeAt(0)) % pInfo.streets.length];
    const district = pInfo.districts[(i * 5 + pKey.length) % pInfo.districts.length];
    const streetNo = 12 + ((i * 37 + pKey.length * 19) % 380);
    const address = `Số ${streetNo} Đường ${street}, ${district}`;
    
    const seed = (i + 1) * 0.137 + (pKey.charCodeAt(0) * 0.05);
    const citizenId = generateRealisticCCCD(pInfo.cccdPrefix, seed);
    
    const bank = BANK_NAMES_POOL[(i * 3 + pKey.length) % BANK_NAMES_POOL.length];
    const bankBranch = `${bank} - Chi nhánh ${pInfo.shortName}`;
    const bankAccount = generateRealisticBankAccount(bank, seed);
    
    const phonePrefixes = ['0905', '0913', '0983', '0978', '0888', '0799', '0935', '0942'];
    const phonePrefix = phonePrefixes[(i + pKey.length) % phonePrefixes.length];
    const phoneSuffix = Math.floor(100000 + (seed * 899999)).toString().slice(0, 6);
    const phone = `${phonePrefix}${phoneSuffix}`;

    list.push({
      id: `cust-${pKey}-${i + 1}`,
      name,
      citizenId,
      address,
      phone,
      bankAccount,
      bankName: bankBranch,
      provinceKey: pKey,
      provinceName: pInfo.name
    });
  }

  PROVINCE_CUSTOMERS[pKey] = list;
});

// Detect province from store address string
export function detectProvinceFromAddress(address: string = ''): string {
  const norm = address.toLowerCase();
  if (norm.includes('đà nẵng') || norm.includes('da nang') || norm.includes('hải châu') || norm.includes('sơn trà') || norm.includes('ngũ hành sơn') || norm.includes('thanh khê') || norm.includes('cẩm lệ') || norm.includes('hòa vang')) {
    return 'danang';
  }
  if (norm.includes('thừa thiên huế') || norm.includes('huế') || norm.includes('hue') || norm.includes('hương thủy') || norm.includes('phú vang')) {
    return 'hue';
  }
  if (norm.includes('hà nội') || norm.includes('ha noi') || norm.includes('hoàn kiếm') || norm.includes('cầu giấy') || norm.includes('đống đa') || norm.includes('ba đình') || norm.includes('hai bà trưng') || norm.includes('hà đông')) {
    return 'hanoi';
  }
  if (norm.includes('bình dương') || norm.includes('binh duong') || norm.includes('thủ dầu một') || norm.includes('thuận an') || norm.includes('dĩ an') || norm.includes('tân uyên') || norm.includes('bến cát')) {
    return 'binhduong';
  }
  if (norm.includes('đồng nai') || norm.includes('dong nai') || norm.includes('biên hòa') || norm.includes('long thành') || norm.includes('nhơn trạch')) {
    return 'dongnai';
  }
  if (norm.includes('cần thơ') || norm.includes('can tho') || norm.includes('ninh kiều') || norm.includes('bình thủy') || norm.includes('cái răng')) {
    return 'cantho';
  }
  if (norm.includes('hải phòng') || norm.includes('hai phong') || norm.includes('lạch tray') || norm.includes('ngô quyền') || norm.includes('hồng bàng')) {
    return 'haiphong';
  }
  if (norm.includes('quảng nam') || norm.includes('quang nam') || norm.includes('hội an') || norm.includes('tam kỳ') || norm.includes('điện bàn')) {
    return 'quangnam';
  }
  if (norm.includes('khánh hòa') || norm.includes('khanh hoa') || norm.includes('nha trang') || norm.includes('cam ranh') || norm.includes('ninh hòa')) {
    return 'khanhhoa';
  }
  // Default to HCM if TP.HCM or general
  return 'hcm';
}

// Get customer list for a province
export function getCustomersByProvince(provinceKey: string): CustomerProfile[] {
  return PROVINCE_CUSTOMERS[provinceKey] || PROVINCE_CUSTOMERS['hcm'] || [];
}

// Pick a random customer (optionally filtered by province)
export function getRandomCustomer(provinceKey?: string): CustomerProfile {
  const pKey = provinceKey || 'hcm';
  const list = getCustomersByProvince(pKey);
  if (!list || list.length === 0) {
    return {
      id: 'cust-default',
      name: 'Nguyễn Văn An',
      citizenId: '079085012345',
      address: 'Số 45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      phone: '0905123456',
      bankAccount: '1903456789012',
      bankName: 'Techcombank - Chi nhánh Sài Gòn',
      provinceKey: 'hcm',
      provinceName: 'TP. Hồ Chí Minh'
    };
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

// Generate an on-the-fly realistic customer for any province
export function generateRealisticCustomer(provinceKey: string): CustomerProfile {
  const pInfo = PROVINCES_DATA[provinceKey] || PROVINCES_DATA['hcm'];
  const name = VIETNAMESE_FIRST_LAST_NAMES[Math.floor(Math.random() * VIETNAMESE_FIRST_LAST_NAMES.length)];
  const street = pInfo.streets[Math.floor(Math.random() * pInfo.streets.length)];
  const district = pInfo.districts[Math.floor(Math.random() * pInfo.districts.length)];
  const streetNo = Math.floor(10 + Math.random() * 450);
  const address = `Số ${streetNo} Đường ${street}, ${district}`;
  
  const seed = Math.random();
  const citizenId = generateRealisticCCCD(pInfo.cccdPrefix, seed);
  const bank = BANK_NAMES_POOL[Math.floor(Math.random() * BANK_NAMES_POOL.length)];
  const bankBranch = `${bank} - Chi nhánh ${pInfo.shortName}`;
  const bankAccount = generateRealisticBankAccount(bank, seed);
  
  const phonePrefixes = ['0905', '0913', '0983', '0978', '0888', '0799', '0935', '0942'];
  const phonePrefix = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];
  const phone = `${phonePrefix}${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    id: `cust-${provinceKey}-${Date.now()}`,
    name,
    citizenId,
    address,
    phone,
    bankAccount,
    bankName: bankBranch,
    provinceKey,
    provinceName: pInfo.name
  };
}
