import { Store, SalesRecord } from '../types';

export const sampleStores: Store[] = [
  {
    id: 'store-1',
    name: 'Đại lý Bia, nước ngọt & Nông sản Hùng Phát',
    industry: 'bia_nuoc_giai_khat',
    address: '124 Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh',
    notes: 'Đại lý chuyên sỉ và lẻ bia, nước ngọt, nông sản sạch các loại. Doanh thu cao, biên lợi nhuận ổn định.',
    createdAt: '2026-05-01',
    bankName: 'Vietcombank',
    bankAccount: '1023456789',
    bankOwner: 'NGUYEN HUNG PHAT',
  },
  {
    id: 'store-2',
    name: 'Cửa hàng Tạp hóa Minh Thư',
    industry: 'tap_hoa',
    address: '45 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    notes: 'Cửa hàng bách hóa gia đình tiện lợi phục vụ cư dân khu phố. Doanh thu đều đặn, mặt hàng đa dạng.',
    createdAt: '2026-05-15',
    bankName: 'Techcombank',
    bankAccount: '19034567890123',
    bankOwner: 'TRAN THI MINH THU',
  },
  {
    id: 'store-3',
    name: 'Góc Phố Cafe & Trà',
    industry: 'ca_phe',
    address: '88 Đường số 7, Thảo Điền, TP. Thủ Đức',
    notes: 'Quán cà phê máy phong cách mộc mạc. Doanh số trung bình nhưng biên lợi nhuận cao nhờ chi phí nguyên liệu tối ưu.',
    createdAt: '2026-06-01',
    bankName: 'MB Bank',
    bankAccount: '0987654321',
    bankOwner: 'LE HOANG PHONG',
  },
  {
    id: 'store-4',
    name: 'Nhà hàng Ẩm thực Quê Nhà',
    industry: 'nha_hang',
    address: '210 Võ Nguyên Giáp, Quận Sơn Trà, TP. Đà Nẵng',
    notes: 'Nhà hàng đặc sản ẩm thực Việt và hải sản tươi sống bên bờ biển Mỹ Khê. Lượng khách cực kỳ đông đúc vào dịp cuối tuần.',
    createdAt: '2026-06-05',
    bankName: 'ACB',
    bankAccount: '2468101214',
    bankOwner: 'PHAM HOANG VIET',
  },
  {
    id: 'store-5',
    name: 'Vườn kiểng Bonsai & Cây cảnh nghệ thuật Xanh',
    industry: 'cay_canh',
    address: '412 Mai Chí Thọ, An Khánh, TP. Thủ Đức, TP. Hồ Chí Minh',
    notes: 'Vườn cây cảnh nghệ thuật, chuyên kinh doanh, cho thuê bonsai, cây kiểng văn phòng, phong thủy và thiết kế tiểu cảnh sân vườn.',
    createdAt: '2026-05-20',
    bankName: 'Vietcombank',
    bankAccount: '1122334455',
    bankOwner: 'LAM THE VINH',
  },
  {
    id: 'store-6',
    name: 'Tổng Kho Vật Liệu Xây Dựng Tiến Phát',
    industry: 'vat_lieu_xay_dung',
    address: '890 Quốc Lộ 1A, Quận Bình Tân, TP. Hồ Chí Minh',
    notes: 'Đại lý phân phối sỉ và lẻ xi măng, sắt thép Hòa Phát/Pomina, cát đá, gạch xây dựng, tôn lợp và sơn nước chống thấm.',
    createdAt: '2026-06-10',
    bankName: 'Vietcombank',
    bankAccount: '007100889988',
    bankOwner: 'VO TIEN PHAT',
  },
];

// Helper to generate a range of dates
function generateDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const end = new Date(ey, em - 1, ed);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

const dates = generateDateRange('2026-06-10', '2026-06-24');

export const sampleRecords: SalesRecord[] = [];

// Seed records for Store 1 (Beer & Soft drinks) - High revenue, low margin (15% target)
// We add some daily fluctuations
dates.forEach((date, index) => {
  const dayFactor = 1 + (index % 3 === 0 ? 0.25 : index % 2 === 0 ? -0.15 : 0.05); // weekend and random variation
  const baseRevenue = 18000000; // 18 million VND
  const revenue = Math.round(baseRevenue * dayFactor);
  const expenseFactor = 0.84 + (Math.random() * 0.03 - 0.015); // around 84% cost
  const expense = Math.round(revenue * expenseFactor);
  const profit = revenue - expense;

  sampleRecords.push({
    id: `rec-store1-${index}`,
    storeId: 'store-1',
    date,
    revenue,
    expense,
    profit,
    notes: index % 5 === 0 ? 'Nhập hàng đợt mới, doanh số tăng tốt' : '',
  });
});

// Seed records for Store 2 (Grocery) - Medium revenue, medium-low margin (12% target)
dates.forEach((date, index) => {
  const dayFactor = 1 + (index % 4 === 0 ? 0.2 : index % 3 === 0 ? -0.1 : 0.02);
  const baseRevenue = 8500000; // 8.5 million VND
  const revenue = Math.round(baseRevenue * dayFactor);
  const expenseFactor = 0.88 + (Math.random() * 0.02 - 0.01); // around 88% cost
  const expense = Math.round(revenue * expenseFactor);
  const profit = revenue - expense;

  sampleRecords.push({
    id: `rec-store2-${index}`,
    storeId: 'store-2',
    date,
    revenue,
    expense,
    profit,
    notes: '',
  });
});

// Seed records for Store 3 (Coffee Shop) - Low-medium revenue, high margin (35% target)
dates.forEach((date, index) => {
  const dayFactor = 1 + (index % 7 >= 5 ? 0.4 : index % 3 === 0 ? -0.15 : 0.05); // High weekend peak
  const baseRevenue = 4200000; // 4.2 million VND
  const revenue = Math.round(baseRevenue * dayFactor);
  // Coffee has high profit margins (about 35-40% profit, meaning 60-65% cost of goods + operation per day)
  const expenseFactor = 0.62 + (Math.random() * 0.04 - 0.02); // around 62% cost
  const expense = Math.round(revenue * expenseFactor);
  const profit = revenue - expense;

  sampleRecords.push({
    id: `rec-store3-${index}`,
    storeId: 'store-3',
    date,
    revenue,
    expense,
    profit,
    notes: index % 7 >= 5 ? 'Cuối tuần đông khách, đồ uống bán chạy' : '',
  });
});

// Seed records for Store 4 (Restaurant) - High revenue, medium margin (22% target)
dates.forEach((date, index) => {
  const dayFactor = 1 + (index % 7 >= 4 ? 0.45 : index % 3 === 0 ? -0.12 : 0.03); // Very high weekend (Fri-Sun) traffic
  const baseRevenue = 15200000; // 15.2 million VND
  const revenue = Math.round(baseRevenue * dayFactor);
  const expenseFactor = 0.78 + (Math.random() * 0.03 - 0.015); // around 78% cost (giving ~22% margin)
  const expense = Math.round(revenue * expenseFactor);
  const profit = revenue - expense;

  sampleRecords.push({
    id: `rec-store4-${index}`,
    storeId: 'store-4',
    date,
    revenue,
    expense,
    profit,
    notes: index % 7 >= 4 ? 'Tiệc sinh nhật đông, phục vụ liên tục' : 'Ngày giữa tuần ổn định',
  });
});

// Seed records for Store 5 (Bonsai & Ornamental Plants) - High-value transactions, 28% margin target
dates.forEach((date, index) => {
  const dayFactor = 1 + (index % 5 === 0 ? 0.35 : index % 3 === 0 ? -0.2 : 0.05);
  const baseRevenue = 7800000; // 7.8 million VND average
  const revenue = Math.round(baseRevenue * dayFactor);
  const expenseFactor = 0.72 + (Math.random() * 0.04 - 0.02); // around 72% cost (giving ~28% margin)
  const expense = Math.round(revenue * expenseFactor);
  const profit = revenue - expense;

  const plantNotes = [
    'Bán 5 chậu Cây Kim Ngân và Thiết Mộc Lan phong thủy',
    'Bàn giao chậu Tùng La Hán Bonsai dáng trực',
    'Bán sỉ hoa lan hồ điệp và sen đá nhập khẩu',
    'Thu tiền dịch vụ chăm sóc & cắt tỉa vườn kiểng định kỳ',
    'Cho thuê cây cảnh văn phòng và bonsai mini tháng mới',
    'Bàn giao tiểu cảnh sân vườn cho biệt thự khu Thảo Điền'
  ];

  sampleRecords.push({
    id: `rec-store5-${index}`,
    storeId: 'store-5',
    date,
    revenue,
    expense,
    profit,
    notes: plantNotes[index % plantNotes.length],
  });
});

// Seed records for Store 6 (Building Materials) - High volume, 16% margin target
dates.forEach((date, index) => {
  const dayFactor = 1 + (index % 4 === 0 ? 0.3 : index % 3 === 0 ? -0.15 : 0.05);
  const baseRevenue = 28500000; // 28.5 million VND average
  const revenue = Math.round(baseRevenue * dayFactor);
  const expenseFactor = 0.84 + (Math.random() * 0.02 - 0.01); // around 84% cost (giving ~16% margin)
  const expense = Math.round(revenue * expenseFactor);
  const profit = revenue - expense;

  const matNotes = [
    'Giao 200 bao xi măng INSEE & 15 khối cát bê tông công trình',
    'Xuất kho 5 tấn thép Hòa Phát D10, D12 cho nhà thầu',
    'Giao 50 thùng gạch lát nền Granite Đồng Tâm 80x80',
    'Cung cấp tôn lạnh màu Hoa Sen & xà gồ mạ kẽm C150',
    'Bán lẻ sơn Dulux Weathershield & phụ gia chống thấm Sika',
    'Xuất lô tấm thạch cao Vĩnh Tường & phụ kiện khung trần'
  ];

  sampleRecords.push({
    id: `rec-store6-${index}`,
    storeId: 'store-6',
    date,
    revenue,
    expense,
    profit,
    notes: matNotes[index % matNotes.length],
  });
});

// Helper functions for currency Vietnamese formatting
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatVNDCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} triệu`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`;
  }
  return amount.toString();
}

export function formatNumberWithDots(val: string | number | undefined | null, allowZero: boolean = true): string {
  if (val === undefined || val === null || val === '') return '';
  let clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  // Strip leading zeros if followed by other digits: e.g. '05' -> '5', '000' -> '0'
  clean = clean.replace(/^0+(?=\d)/, '');
  if (clean === '0' && !allowZero) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseNumberFromDots(val: string | undefined | null): string {
  if (!val) return '';
  return val.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function convertNumberToVietnameseWords(amount: number): string {
  if (amount === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readThreeDigits(n: number, showZeroHundred: boolean): string {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let result = '';

    if (hundred > 0 || showZeroHundred) {
      result += digits[hundred] + ' trăm ';
    }

    if (ten > 1) {
      result += digits[ten] + ' mươi ';
    } else if (ten === 1) {
      result += 'mười ';
    } else if (ten === 0 && unit > 0 && (hundred > 0 || showZeroHundred)) {
      result += 'lẻ ';
    }

    if (unit === 1 && ten > 1) {
      result += 'mốt';
    } else if (unit === 5 && ten > 0) {
      result += 'lăm';
    } else if (unit > 0) {
      result += digits[unit];
    }

    return result.trim();
  }

  let temp = amount;
  const blocks: number[] = [];
  while (temp > 0) {
    blocks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let resultString = '';
  for (let i = blocks.length - 1; i >= 0; i--) {
    const blockValue = blocks[i];
    if (blockValue === 0) {
      if (i === 3 && blocks.some((val, idx) => idx < 3 && val > 0)) {
        resultString += ' tỷ ';
      }
      continue;
    }

    const showZeroHundred = i < blocks.length - 1;
    const blockText = readThreeDigits(blockValue, showZeroHundred);
    const unitText = units[i];

    resultString += ' ' + blockText + ' ' + unitText;
  }

  resultString = resultString.trim().replace(/\s+/g, ' ');
  return resultString.charAt(0).toUpperCase() + resultString.slice(1) + ' đồng';
}

