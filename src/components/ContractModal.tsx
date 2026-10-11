import React, { useState, useEffect } from 'react';
import { Store, PurchaseContract, ContractItem, INDUSTRIES, IndustryType } from '../types';
import { formatVND, formatNumberWithDots, parseNumberFromDots } from '../utils/sampleData';
import { X, Printer, FileText, Check, AlertCircle, Sparkles, Trash2, Plus, RefreshCw, Edit, Download, Layers, Upload, MapPin, Users, UserCheck, Percent, Type } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PROVINCES_DATA, detectProvinceFromAddress, getCustomersByProvince, getRandomCustomer, CustomerProfile, PROVINCE_CUSTOMERS } from '../utils/customerData';
import { CONTRACT_FONTS, DEFAULT_CONTRACT_FONT_ID, ContractFontOption } from '../utils/contractFonts';
import UynhiemchiModal from './UynhiemchiModal';
import { drawVietcombankHeaderLogo } from '../utils/uncLogoHelper';

function convertNumberToVietnameseWords(amount: number): string {
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

function maskCitizenId(idStr?: string): string {
  if (!idStr || !idStr.trim()) return '..........................................................';
  const trimmed = idStr.trim();
  if (trimmed.length <= 3) return '***';
  return trimmed.slice(0, -3) + '***';
}

interface PredefinedProduct {
  name: string;
  defaultSellingPrice: number;
}

const INDUSTRY_PRODUCTS: Record<string, PredefinedProduct[]> = {
  bia_nuoc_giai_khat: [
    { name: 'Bia Tiger Crystal (Thùng 24 lon 330ml)', defaultSellingPrice: 415000 },
    { name: 'Bia Heineken Silver (Thùng 24 lon 330ml)', defaultSellingPrice: 460000 },
    { name: 'Bia Sài Gòn Special (Thùng 24 lon 330ml)', defaultSellingPrice: 345000 },
    { name: 'Bia Hà Nội Premium (Thùng 24 lon 330ml)', defaultSellingPrice: 280000 },
    { name: 'Bia 333 Premium (Thùng 24 lon 330ml)', defaultSellingPrice: 290000 },
    { name: 'Bia Sapporo Premium (Thùng 24 lon 330ml)', defaultSellingPrice: 485000 },
    { name: 'Bia Corona Extra (Thùng 24 chai 355ml)', defaultSellingPrice: 820000 },
    { name: 'Bia Budweiser (Thùng 24 lon 330ml)', defaultSellingPrice: 440000 },
    { name: 'Bia Larue Blue (Thùng 24 lon 330ml)', defaultSellingPrice: 265000 },
    { name: 'Bia Huda Gold (Thùng 24 lon 330ml)', defaultSellingPrice: 275000 },
    { name: 'Bia Blanc 1664 (Thùng 24 lon 330ml)', defaultSellingPrice: 510000 },
    { name: 'Bia Việt (Thùng 24 lon 330ml)', defaultSellingPrice: 260000 },
    { name: 'Bia Tiger Nâu (Thùng 24 lon 330ml)', defaultSellingPrice: 385000 },
    { name: 'Bia Heineken Thường (Thùng 24 lon 330ml)', defaultSellingPrice: 450000 },
    { name: 'Bia Sài Gòn Lager (Thùng 24 lon 330ml)', defaultSellingPrice: 260000 },
    { name: 'Nước tăng lực Red Bull Thái Lan (Thùng 24 lon)', defaultSellingPrice: 260000 },
    { name: 'Nước tăng lực Sting Hương Dâu (Thùng 24 chai 320ml)', defaultSellingPrice: 195000 },
    { name: 'Nước ngọt Coca-Cola vị nguyên bản (Thùng 24 lon 320ml)', defaultSellingPrice: 205000 },
    { name: 'Nước ngọt Pepsi Không Đường (Thùng 24 lon 320ml)', defaultSellingPrice: 195000 },
    { name: 'Nước ngọt 7Up vị chanh (Thùng 24 lon 320ml)', defaultSellingPrice: 190000 },
    { name: 'Trà xanh Không Độ (Thùng 24 chai 455ml)', defaultSellingPrice: 210000 },
    { name: 'Trà thanh nhiệt Dr. Thanh (Thùng 24 chai 350ml)', defaultSellingPrice: 200000 },
    { name: 'Nước uống vận động Revive Chanh Muối (Thùng 24 chai 500ml)', defaultSellingPrice: 180000 },
    { name: 'Nước khoáng thiên nhiên La Vie (Thùng 24 chai 500ml)', defaultSellingPrice: 110000 },
    { name: 'Nước tinh khiết Aquafina (Thùng 24 chai 500ml)', defaultSellingPrice: 105000 },
    { name: 'Trà sữa Kirin Latte (Thùng 24 chai 345ml)', defaultSellingPrice: 245000 },
    { name: 'Nước ép trái cây Twister Cam (Thùng 24 lon 320ml)', defaultSellingPrice: 215000 },
    { name: 'Sữa đậu nành Fami Nguyên Chất (Thùng 40 hộp 200ml)', defaultSellingPrice: 170000 },
    { name: 'Trà Ô Long TEA+ Plus (Thùng 24 chai 455ml)', defaultSellingPrice: 215000 },
    { name: 'Nước ngọt Mirinda Hương Xá Xị (Thùng 24 lon 320ml)', defaultSellingPrice: 190000 },
    { name: 'Nước ngọt Mirinda Hương Cam (Thùng 24 lon 320ml)', defaultSellingPrice: 190000 },
    { name: 'Nước ngọt Sprite vị chanh (Thùng 24 lon 320ml)', defaultSellingPrice: 195000 },
    { name: 'Nước uống sữa trái cây Nutri Boost (Thùng 24 chai 297ml)', defaultSellingPrice: 240000 },
    { name: 'Trà xanh C2 hương chanh (Thùng 24 chai 360ml)', defaultSellingPrice: 165000 },
    { name: 'Nước yến ngân nhĩ Tribeco (Thùng 24 lon 240ml)', defaultSellingPrice: 155000 },
    { name: 'Nước tăng lực Monster Energy (Thùng 24 lon 355ml)', defaultSellingPrice: 640000 },
    { name: 'Nước bù khoáng Pocari Sweat (Thùng 24 chai 500ml)', defaultSellingPrice: 310000 },
    { name: 'Nước uống sữa lên men Betagen (Thùng 40 chai 85ml)', defaultSellingPrice: 195000 },
    { name: 'Sữa tiệt trùng Milo lúa mạch (Thùng 48 hộp 180ml)', defaultSellingPrice: 375000 },
    { name: 'Nước uống sâm dứa nha đam (Thùng 24 chai 450ml)', defaultSellingPrice: 205000 },
    { name: 'Nước ép táo chín Vfresh (Thùng 12 hộp 1L)', defaultSellingPrice: 440000 },
    { name: 'Nước ép ổi tự nhiên Vfresh (Thùng 12 hộp 1L)', defaultSellingPrice: 410000 },
    { name: 'Nước bù điện giải ICY chanh muối (Thùng 24 chai 390ml)', defaultSellingPrice: 160000 },
    { name: 'Sữa đậu nành Goldsoy Vinamilk (Thùng 48 hộp 200ml)', defaultSellingPrice: 220000 },
    { name: 'Nước khoáng có ga Vĩnh Hảo (Thùng 24 chai 500ml)', defaultSellingPrice: 145000 },
    { name: 'Nước ép cà chua Vfresh (Thùng 12 hộp 1L)', defaultSellingPrice: 425000 },
    { name: 'Nước sâm thảo lượng bí đao Wonderfarm (Thùng 24 lon)', defaultSellingPrice: 160000 },
    { name: 'Nước khoáng kiềm thiên nhiên Vikoda (Thùng 24 chai 500ml)', defaultSellingPrice: 155000 },
    { name: 'Nước uống thạch dừa nha đam (Thùng 24 chai 450ml)', defaultSellingPrice: 185000 },
    { name: 'Soda Schweppes Tonic Water (Thùng 24 lon 320ml)', defaultSellingPrice: 210000 },
  ],
  hang_nong_san: [
    { name: 'Gạo thơm lúa mùa ST25 Sóc Trăng (Bao 10kg)', defaultSellingPrice: 320000 },
    { name: 'Gạo thơm Jasmine Thượng Hạng (Bao 10kg)', defaultSellingPrice: 220000 },
    { name: 'Gạo lứt đỏ Điện Biên organic (Túi 5kg)', defaultSellingPrice: 185000 },
    { name: 'Hạt Điều tươi rang muối vỏ lụa Bình Phước (Hộp 500g)', defaultSellingPrice: 155000 },
    { name: 'Hạt Mắc Ca nứt vỏ sấy chín Đắk Lắk (Hộp 500g)', defaultSellingPrice: 175000 },
    { name: 'Cà phê hạt Robusta Đắk Lắk mộc nguyên chất (Bao 5kg)', defaultSellingPrice: 1150000 },
    { name: 'Trà xanh Thái Nguyên đặc sản móc câu (Túi 500g)', defaultSellingPrice: 195000 },
    { name: 'Hạt tiêu đen Chư Sê Tây Nguyên hữu cơ (Lọ 200g)', defaultSellingPrice: 75000 },
    { name: 'Hạt sen khô Tịnh Tâm Huế loại 1 (Túi 500g)', defaultSellingPrice: 185000 },
    { name: 'Mít sấy giòn xuất khẩu bơ thơm (Túi 500g)', defaultSellingPrice: 125000 },
    { name: 'Khoai lang sấy dẻo Đà Lạt mộc tự nhiên (Gói 500g)', defaultSellingPrice: 95000 },
    { name: 'Hạt điều nhân trắng xuất khẩu Bình Phước (Bao 5kg)', defaultSellingPrice: 1350000 },
    { name: 'Hạt tiêu sọ trắng Chư Sê cao cấp (Lọ 200g)', defaultSellingPrice: 95000 },
    { name: 'Bột nghệ vàng nguyên chất Nghệ An (Gói 500g)', defaultSellingPrice: 115000 },
    { name: 'Tỏi Lý Sơn chính gốc loại 1 (Túi 1kg)', defaultSellingPrice: 165000 },
    { name: 'Hành tím Vĩnh Châu chọn lọc (Túi 1kg)', defaultSellingPrice: 75000 },
    { name: 'Nấm rơm sấy khô đóng gói xuất khẩu (Hộp 200g)', defaultSellingPrice: 145000 },
    { name: 'Trà Oolong cao cấp Cầu Đất (Hộp 250g)', defaultSellingPrice: 185000 },
    { name: 'Nước cốt dâu tằm Đà Lạt nguyên chất (Chai 1L)', defaultSellingPrice: 110000 },
    { name: 'Mật ong hoa nhãn Hưng Yên nguyên chất (Chai 1L)', defaultSellingPrice: 320000 },
    { name: 'Chuối Laba Đà Lạt sấy dẻo tự nhiên (Túi 500g)', defaultSellingPrice: 85000 },
    { name: 'Khô bò sợi Tây Nguyên thơm cay (Hộp 500g)', defaultSellingPrice: 290000 },
    { name: 'Khô gà lá chanh loại ngon cay giòn (Hộp 500g)', defaultSellingPrice: 135000 },
    { name: 'Hạt bí ngô rang tay hữu cơ (Túi 500g)', defaultSellingPrice: 95000 },
    { name: 'Hạt dưa rang cát truyền thống Bình Thuận (Túi 500g)', defaultSellingPrice: 85000 },
    { name: 'Hạt hướng dương sấy giòn thơm bùi (Bao 5kg)', defaultSellingPrice: 340000 },
    { name: 'Đậu nành hữu cơ hạt nhỏ giống thuần (Túi 1kg)', defaultSellingPrice: 65000 },
    { name: 'Đậu đen xanh lòng Tây Nguyên (Túi 1kg)', defaultSellingPrice: 70000 },
    { name: 'Đậu đỏ giống bản địa Điện Biên (Túi 1kg)', defaultSellingPrice: 68000 },
    { name: 'Đậu xanh xát vỏ loại ngon xuất khẩu (Túi 1kg)', defaultSellingPrice: 55000 },
    { name: 'Ngô ngọt đóng hộp xuất khẩu (Thùng 24 lon)', defaultSellingPrice: 380000 },
    { name: 'Măng khô Tây Bắc non sạch mộc mạc (Túi 1kg)', defaultSellingPrice: 290000 },
    { name: 'Nấm tai mèo khô (Mộc nhĩ đen) Tây Bắc (Túi 1kg)', defaultSellingPrice: 195000 },
    { name: 'Nấm hương rừng khô Tây Bắc tự nhiên (Túi 500g)', defaultSellingPrice: 220000 },
    { name: 'Tinh bột sắn dây nguyên chất Kinh Môn (Túi 1kg)', defaultSellingPrice: 185000 },
    { name: 'Miến dong phên sợi nhỏ Cao Bằng (Túi 1kg)', defaultSellingPrice: 115000 },
    { name: 'Sắn lát sấy khô xuất khẩu (Bao 50kg)', defaultSellingPrice: 480000 },
    { name: 'Ngô hạt đỏ sấy khô làm thức ăn chăn nuôi (Bao 50kg)', defaultSellingPrice: 390000 },
    { name: 'Đậu phộng sẻ hạt đỏ Quảng Nam (Túi 1kg)', defaultSellingPrice: 78000 },
    { name: 'Trà Atiso Đà Lạt nguyên bông khô (Túi 500g)', defaultSellingPrice: 195000 },
    { name: 'Trà hoa cúc chi sấy lạnh Hưng Yên (Lọ 100g)', defaultSellingPrice: 125000 },
    { name: 'Hoa hồi Lạng Sơn khô thơm nguyên cánh (Túi 500g)', defaultSellingPrice: 165000 },
    { name: 'Quế cây bóc vỏ Yên Bái thơm nồng (Túi 500g)', defaultSellingPrice: 95000 },
    { name: 'Thảo quả khô Tây Bắc tuyển chọn (Túi 500g)', defaultSellingPrice: 210000 },
    { name: 'Rong biển khô sấy giòn Nha Trang (Túi 200g)', defaultSellingPrice: 85000 },
    { name: 'Sá sùng khô Vân Đồn tuyển chọn loại 1 (Hộp 100g)', defaultSellingPrice: 550000 },
    { name: 'Hành tây Đà Lạt củ lớn sạch vỏ (Túi 5kg)', defaultSellingPrice: 115000 },
    { name: 'Khoai tây Đà Lạt củ vàng đều hạt (Túi 5kg)', defaultSellingPrice: 145000 },
    { name: 'Gừng củ già cay nồng miền núi (Túi 2kg)', defaultSellingPrice: 85000 },
    { name: 'Nghệ củ đỏ tươi ép nước nguyên chất (Túi 5kg)', defaultSellingPrice: 150000 },
  ],
  tap_hoa: [
    { name: 'Gạo thơm Jasmine Thượng Hạng (Bao 10kg)', defaultSellingPrice: 220000 },
    { name: 'Gạo lứt đỏ Điện Biên organic (Túi 5kg)', defaultSellingPrice: 185000 },
    { name: 'Dầu ăn thực vật Simply nguyên chất (Thùng 12 chai 1L)', defaultSellingPrice: 690000 },
    { name: 'Dầu đậu nành Tường An Premium (Thùng 12 chai 1L)', defaultSellingPrice: 620000 },
    { name: 'Nước tương Chinsu tỏi ớt (Thùng 24 chai 250ml)', defaultSellingPrice: 390000 },
    { name: 'Hạt nêm Knorr thịt thăn xương ống (Thùng 12 gói 900g)', defaultSellingPrice: 960000 },
    { name: 'Bột ngọt Ajinomoto gói lớn (Thùng 12 gói 1kg)', defaultSellingPrice: 740000 },
    { name: 'Mì ăn liền Hảo Hảo tôm chua cay (Thùng 30 gói)', defaultSellingPrice: 135000 },
    { name: 'Mì trộn Omachi xốt bò hầm (Thùng 30 gói)', defaultSellingPrice: 245000 },
    { name: 'Sữa đặc Ông Thọ đỏ (Lô 12 hộp thiếc 380g)', defaultSellingPrice: 310000 },
    { name: 'Sữa tươi tiệt trùng Vinamilk 100% (Thùng 48 hộp 180ml)', defaultSellingPrice: 365000 },
    { name: 'Đường tinh luyện Biên Hòa Pure (Lô 20 gói 1kg)', defaultSellingPrice: 540000 },
    { name: 'Muối sấy i-ốt Hải Phòng (Lô 50 gói 500g)', defaultSellingPrice: 250000 },
    { name: 'Nước xả vải Downy huyền bí (Can 3.5L, Lô 4 can)', defaultSellingPrice: 740000 },
    { name: 'Nước rửa chén Sunlight chanh (Can 3.6kg, Thùng 3 can)', defaultSellingPrice: 380000 },
    { name: 'Bột giặt OMO Matic cửa trước (Túi 3.6kg, Thùng 4 túi)', defaultSellingPrice: 790000 },
    { name: 'Kem đánh răng Colgate ngừa sâu răng (Lô 24 hộp 225g)', defaultSellingPrice: 920000 },
    { name: 'Dầu gội Clear thảo dược mát lạnh (Lô 12 chai 630ml)', defaultSellingPrice: 1620000 },
    { name: 'Sữa tắm Lifebuoy bảo vệ vượt trội (Lô 12 chai 800g)', defaultSellingPrice: 1850000 },
    { name: 'Giấy vệ sinh cao cấp Pulppy (Thùng 10 lốc x 10 cuộn)', defaultSellingPrice: 750000 },
    { name: 'Sữa tắm mượt tóc Rejoice thơm mát (Lô 12 chai 650ml)', defaultSellingPrice: 1350000 },
    { name: 'Nước lau sàn Sunlight hương hoa lily (Can 3.6kg, Lô 4 can)', defaultSellingPrice: 360000 },
    { name: 'Nước tẩy bồn cầu Vim diệt khuẩn (Thùng 24 chai 900ml)', defaultSellingPrice: 780000 },
    { name: 'Khăn giấy rút cao cấp Silkwell (Thùng 50 gói)', defaultSellingPrice: 680000 },
    { name: 'Bột giặt Ariel giữ màu chuyên nghiệp (Túi 3.8kg, Lô 4 túi)', defaultSellingPrice: 820000 },
    { name: 'Sữa rửa mặt nam Menly mát lạnh (Lô 12 tuýp 100g)', defaultSellingPrice: 1050000 },
    { name: 'Sữa tắm em bé Johnson\'s Baby (Lô 12 chai 500ml)', defaultSellingPrice: 1420000 },
    { name: 'Tã bám dán siêu thấm Huggies size XL (Thùng 4 bịch)', defaultSellingPrice: 880000 },
    { name: 'Băng vệ sinh Kotex siêu mỏng cánh (Thùng 48 gói)', defaultSellingPrice: 765000 },
    { name: 'Sữa đặc Ngôi Sao Phương Nam xanh dương (Thùng 24 hộp 1.2kg)', defaultSellingPrice: 1380000 },
    { name: 'Sữa bột pha sẵn Abbott Grow Advance (Thùng 48 hộp 180ml)', defaultSellingPrice: 620000 },
    { name: 'Ngũ cốc dinh dưỡng sấy khô Calbee (Thùng 10 túi 750g)', defaultSellingPrice: 1650000 },
    { name: 'Bánh quy bơ Danisa Đan Mạch (Thùng 12 hộp sắt 454g)', defaultSellingPrice: 1550000 },
    { name: 'Bánh ChocoPie Orion truyền thống (Thùng 8 hộp x 20 cái)', defaultSellingPrice: 720000 },
    { name: 'Snack khoai tây chiên O\'Star (Thùng 40 gói)', defaultSellingPrice: 380000 },
    { name: 'Kẹo sing-gum Doublemint bạc hà (Lô 24 hộp thiếc)', defaultSellingPrice: 620000 },
    { name: 'Mì ăn liền lẩu Thái chua cay Acecook (Thùng 30 gói)', defaultSellingPrice: 195000 },
    { name: 'Tương ớt siêu cay Chin-su (Thùng 24 chai 250g)', defaultSellingPrice: 280000 },
    { name: 'Tương cà chua cao cấp Chin-su (Thùng 24 chai 250g)', defaultSellingPrice: 290000 },
    { name: 'Nước mắm cá cơm Nam Ngư Đệ Nhị (Thùng 15 chai 900ml)', defaultSellingPrice: 360000 },
    { name: 'Giấm gạo nếp lên men tự nhiên Trung Thành (Thùng 24 chai 450ml)', defaultSellingPrice: 240000 },
    { name: 'Bột chiên giòn đa dụng Meizan (Thùng 40 gói 150g)', defaultSellingPrice: 290000 },
    { name: 'Miến dong sấy khô sạch làng So (Thùng 20 gói 500g)', defaultSellingPrice: 750000 },
    { name: 'Hạt bí thơm lừng ăn Tết loại ngon (Lô 10 bịch 500g)', defaultSellingPrice: 850000 },
    { name: 'Khăn ướt Bobby an toàn dịu nhẹ (Thùng 30 gói 100 tờ)', defaultSellingPrice: 950000 },
    { name: 'Nước xịt phòng sáp thơm Glade oải hương (Thùng 12 chai)', defaultSellingPrice: 520000 },
    { name: 'Nước tẩy quần áo màu Axo dịu nhẹ (Thùng 12 chai 800ml)', defaultSellingPrice: 460000 },
    { name: 'Bao rác tự hủy sinh học Opec (Lô 50 cuộn 3 màu)', defaultSellingPrice: 480000 },
    { name: 'Nước rửa tay diệt khuẩn Green Cross (Thùng 24 chai 250ml)', defaultSellingPrice: 750000 },
    { name: 'Pin Maxell tiểu AA carbon cao cấp (Thùng 40 vỉ x 4 viên)', defaultSellingPrice: 540000 },
  ],
  ca_phe: [
    { name: 'Hạt Cà phê Robusta nguyên chất Đắk Lắk (Bao 10kg)', defaultSellingPrice: 2200000 },
    { name: 'Hạt Cà phê Arabica Cầu Đất cao cấp (Bao 10kg)', defaultSellingPrice: 3600000 },
    { name: 'Cà phê Espresso phối trộn Robusta - Arabica (Bao 10kg)', defaultSellingPrice: 2800000 },
    { name: 'Sữa đặc có đường Larosee (Thùng 48 lon 380g)', defaultSellingPrice: 860000 },
    { name: 'Kem béo thực vật Rich\'s Non-Dairy (Thùng 24 hộp)', defaultSellingPrice: 810000 },
    { name: 'Bột Trà xanh Matcha Nhật Bản nguyên chất (Gói 1kg)', defaultSellingPrice: 720000 },
    { name: 'Trà đen đặc sản Lộc Phát hương tự nhiên (Bao 5kg)', defaultSellingPrice: 780000 },
    { name: 'Siro Monin đường mía nguyên chất (Thùng 6 chai 700ml)', defaultSellingPrice: 1350000 },
    { name: 'Siro Davinci vị hạt dẻ / Hazelnut (Thùng 6 chai 750ml)', defaultSellingPrice: 1480000 },
    { name: 'Sốt Chocolate Hershey\'s cao cấp (Lô 12 chai)', defaultSellingPrice: 1280000 },
    { name: 'Bột sô-cô-la sữa uống liền thượng hạng (Túi 5kg)', defaultSellingPrice: 890000 },
    { name: 'Trà Oolong túi lọc Cozy hương đào (Thùng 24 hộp)', defaultSellingPrice: 680000 },
    { name: 'Bột kem béo bọt sữa Thái Lan (Bao 10kg)', defaultSellingPrice: 1150000 },
    { name: 'Đá bi tinh khiết đóng bao (Lô 20 bao 5kg)', defaultSellingPrice: 300000 },
    { name: 'Ly nhựa PP cứng nắp tim 500ml (Lô 1000 cái)', defaultSellingPrice: 980000 },
    { name: 'Ống hút giấy sinh học phân hủy (Lô 2000 ống)', defaultSellingPrice: 420000 },
    { name: 'Màng dập cốc nhựa trà sữa (Cuộn 2000 hình)', defaultSellingPrice: 280000 },
    { name: 'Đường nước hàn quốc fructose (Thùng 25kg)', defaultSellingPrice: 650000 },
    { name: 'Bột cacao nguyên chất Đắk Lắk (Gói 5kg)', defaultSellingPrice: 750000 },
    { name: 'Hộp giấy mang đi xiên tre thân thiện (Lô 500 chiếc)', defaultSellingPrice: 620000 },
    { name: 'Siro Osterberg hương dâu thanh mát (Thùng 6 chai 1L)', defaultSellingPrice: 920000 },
    { name: 'Siro Osterberg hương việt quất tự nhiên (Thùng 6 chai 1L)', defaultSellingPrice: 950000 },
    { name: 'Sinh tố đóng chai Berrino hương đào ngọt (Thùng 6 chai 1L)', defaultSellingPrice: 880000 },
    { name: 'Sinh tố đóng chai Berrino hương xoài tươi (Thùng 6 chai 1L)', defaultSellingPrice: 880000 },
    { name: 'Bột frappe chuyên dụng chống phân tầng (Lô 10 túi 1kg)', defaultSellingPrice: 1450000 },
    { name: 'Sữa tươi thanh trùng Barista chuyên nghiệp (Thùng 12 hộp 1L)', defaultSellingPrice: 460000 },
    { name: 'Sữa đặc Ngôi Sao Phương Nam xanh lá (Thùng 48 hộp)', defaultSellingPrice: 820000 },
    { name: 'Trà lài đặc sản Lộc Phát hoa tự nhiên (Lô 5 túi 1kg)', defaultSellingPrice: 850000 },
    { name: 'Trà đen số 9 hương cam hảo hạng (Lô 10 túi 500g)', defaultSellingPrice: 720000 },
    { name: 'Trà xanh túi lọc Dilmah hương bạc hà (Thùng 12 hộp)', defaultSellingPrice: 540000 },
    { name: 'Bột sữa béo b-one Thái Lan nguyên chất (Bao 25kg)', defaultSellingPrice: 1380000 },
    { name: 'Thạch dừa trân châu 3Q giòn ngon dai (Thùng 6 bịch 2kg)', defaultSellingPrice: 620000 },
    { name: 'Trân châu đen caramel Đài Loan sấy dẻo (Bao 10kg)', defaultSellingPrice: 450000 },
    { name: 'Hạt thủy tinh sữa sữa hương dâu béo ngọt (Lô 10 hũ 1kg)', defaultSellingPrice: 780000 },
    { name: 'Sốt Caramel Torani nhập khẩu Mỹ hương ngọt (Chai 1.89L)', defaultSellingPrice: 580000 },
    { name: 'Bột Matcha Uji thượng hạng từ Nhật Bản (Gói 500g)', defaultSellingPrice: 690000 },
    { name: 'Mật ong hoa rừng Tây Bắc nguyên chất (Thùng 4 can 5L)', defaultSellingPrice: 1850000 },
    { name: 'Chanh vàng Mỹ nhập khẩu quả mọng nước (Thùng 15kg)', defaultSellingPrice: 1200000 },
    { name: 'Cam sành miền tây tươi mọng tuyển chọn (Bao 30kg)', defaultSellingPrice: 540000 },
    { name: 'Trà thảo mộc Hibiscus thanh nhiệt sấy khô (Túi 1kg)', defaultSellingPrice: 320000 },
    { name: 'Hạt chia organic Nam Mỹ đóng gói sạch (Lô 10 bịch 1kg)', defaultSellingPrice: 1100000 },
    { name: 'Ly thủy tinh uống cafe đá truyền thống (Lô 120 cái)', defaultSellingPrice: 1450000 },
    { name: 'Ly nhựa PET nắp cầu dùng một lần 360ml (Lô 1000 cái)', defaultSellingPrice: 680000 },
    { name: 'Muỗng nhựa đen dài cao cấp khuấy cafe (Lô 2000 chiếc)', defaultSellingPrice: 240000 },
    { name: 'Khay gỗ đựng cốc ly bưng bê hiện đại (Lô 10 cái)', defaultSellingPrice: 850000 },
    { name: 'Nước rửa ly chén sinh học tinh chất sả chanh (Thùng 3 can 4L)', defaultSellingPrice: 340000 },
    { name: 'Bộ phin cafe nhôm mạ màu anode không rỉ (Lô 50 bộ)', defaultSellingPrice: 1250000 },
    { name: 'Giấy lau miệng napkins 1 lớp dai mềm (Thùng 60 gói)', defaultSellingPrice: 580000 },
    { name: 'Bộ dụng cụ tạo bọt sữa cafe inox 304 (5 chiếc)', defaultSellingPrice: 450000 },
    { name: 'Bình xịt kem tươi iSi dung tích 1L nhập khẩu (Chiếc)', defaultSellingPrice: 2650000 },
  ],
  nha_hang: [
    { name: 'Thịt Ba chỉ Bò Mỹ đông lạnh Choice (Thùng 10kg)', defaultSellingPrice: 2700000 },
    { name: 'Thịt lõi vai Bò Úc tươi nhập khẩu (Thùng 10kg)', defaultSellingPrice: 3400000 },
    { name: 'Gạo Thơm đặc sản ST25 Sóc Trăng (Bao 50kg)', defaultSellingPrice: 1750000 },
    { name: 'Nước mắm cá cơm Phú Quốc Khải Hoàn (Thùng 12 chai 500ml)', defaultSellingPrice: 1180000 },
    { name: 'Tôm thẻ chân trắng tươi lột vỏ đông lạnh (Thùng 10kg)', defaultSellingPrice: 2400000 },
    { name: 'Sườn non heo tươi sống nhập khẩu (Thùng 15kg)', defaultSellingPrice: 1950000 },
    { name: 'Ức gà phi-lê tươi sạch CP (Thùng 20kg)', defaultSellingPrice: 1480000 },
    { name: 'Dầu hào cao cấp Lee Kum Kee chanh tỏi (Thùng 12 chai)', defaultSellingPrice: 490000 },
    { name: 'Dầu ăn thực vật cao cấp Neptune Light (Thùng 12 chai 1L)', defaultSellingPrice: 680000 },
    { name: 'Combo gia vị lẩu nướng & sốt chấm tổng hợp', defaultSellingPrice: 950000 },
    { name: 'Trứng gà tươi sạch CP loại 1 (Thùng 300 quả)', defaultSellingPrice: 750000 },
    { name: 'Mực ống tươi cấp đông xuất khẩu (Thùng 10kg)', defaultSellingPrice: 2850000 },
    { name: 'Bột chiên giòn Meizan đa dụng (Thùng 20 gói 1kg)', defaultSellingPrice: 580000 },
    { name: 'Rau xà lách thủy canh Đà Lạt tươi sạch (Sọt 15kg)', defaultSellingPrice: 480000 },
    { name: 'Nấm kim châm Hàn Quốc tươi ngon (Thùng 50 gói)', defaultSellingPrice: 450000 },
    { name: 'Nước tương Maggi hương đậu nành (Thùng 24 chai 700ml)', defaultSellingPrice: 620000 },
    { name: 'Tương cà & Tương ớt Cholimex cao cấp (Thùng 24 chai 270g)', defaultSellingPrice: 360000 },
    { name: 'Gia vị bột cà ri & ngũ vị hương tổng hợp (Thùng)', defaultSellingPrice: 540000 },
    { name: 'Bún khô tươi dạng sợi xuất khẩu (Thùng 10kg)', defaultSellingPrice: 380000 },
    { name: 'Sốt Mayonnaise Kewpie truyền thống (Thùng 10 túi 1kg)', defaultSellingPrice: 980000 },
    { name: 'Thịt thăn ngoại Bò Úc Striploin tươi (Thùng 10kg)', defaultSellingPrice: 4200000 },
    { name: 'Đùi tỏi gà tươi sạch CP chất lượng cao (Thùng 20kg)', defaultSellingPrice: 1280000 },
    { name: 'Thịt nạc vai heo tươi ngon sỉ lẻ (Thùng 20kg)', defaultSellingPrice: 2100000 },
    { name: 'Cá hồi Na-uy nguyên con tươi fillet (Thùng 15kg)', defaultSellingPrice: 5800000 },
    { name: 'Bạch tuộc đại dương tươi giòn ngọt thịt (Thùng 10kg)', defaultSellingPrice: 1850000 },
    { name: 'Ghẹ xanh tươi sống Phú Quốc (Thùng 10kg)', defaultSellingPrice: 3600000 },
    { name: 'Sò điệp nửa mảnh cấp đông tươi sạch (Thùng 10kg)', defaultSellingPrice: 1650000 },
    { name: 'Nghêu lụa tươi sạch ngâm cát xuất khẩu (Thùng 20kg)', defaultSellingPrice: 780000 },
    { name: 'Khoai tây cọng vàng sấy giòn McCain Bỉ (Thùng 10kg)', defaultSellingPrice: 550000 },
    { name: 'Bơ lạt thực vật Anchor cao cấp (Thùng 40 khối 250g)', defaultSellingPrice: 2250000 },
    { name: 'Phô mai sợi Mozzarella hiệu Maestrella (Thùng 10kg)', defaultSellingPrice: 1950000 },
    { name: 'Sữa tươi không đường béo ngậy TH True Milk (Thùng 12 hộp 1L)', defaultSellingPrice: 420000 },
    { name: 'Kem whipping cream Anchor béo ngậy (Thùng 12 hộp 1L)', defaultSellingPrice: 1650000 },
    { name: 'Hành tây tím Đà Lạt củ tròn chắc ngọt (Bao 20kg)', defaultSellingPrice: 420000 },
    { name: 'Cà rốt tươi sạch Đà Lạt ngọt giòn (Bao 20kg)', defaultSellingPrice: 380000 },
    { name: 'Khoai tây củ tròn Đà Lạt đất đỏ sạch (Bao 20kg)', defaultSellingPrice: 480000 },
    { name: 'Tỏi Hải Dương củ già khô vỏ đều đặn (Bao 10kg)', defaultSellingPrice: 650000 },
    { name: 'Tiêu sọ hạt trắng mộc mạc thơm nồng (Túi 5kg)', defaultSellingPrice: 1350000 },
    { name: 'Muối tinh sấy khô nấu ăn chất lượng cao (Bao 50kg)', defaultSellingPrice: 280000 },
    { name: 'Đường cát trắng xuất khẩu Biên Hòa (Bao 50kg)', defaultSellingPrice: 1150000 },
    { name: 'Bột năng cao cấp Tài Ký mịn trắng dẻo (Bao 25kg)', defaultSellingPrice: 620000 },
    { name: 'Bột mì đa dụng cao cấp Meizan tiện dụng (Bao 25kg)', defaultSellingPrice: 580000 },
    { name: 'Nước khoáng Lavie chai nhựa mộc mạc (Thùng 24 chai 350ml)', defaultSellingPrice: 95000 },
    { name: 'Khăn giấy ăn rút vuông dai mịn tơ tằm (Thùng 40 bịch)', defaultSellingPrice: 620000 },
    { name: 'Than củi đun bếp không khói nướng BBQ (Lô 50 bao 5kg)', defaultSellingPrice: 1850000 },
    { name: 'Cồn khô nấu lẩu sáp siêu cháy an toàn (Thùng 4 thùng x 10kg)', defaultSellingPrice: 950000 },
    { name: 'Nước rửa bát chén Sunlight trà xanh (Thùng 3 can 4L)', defaultSellingPrice: 380000 },
    { name: 'Màng bọc thực phẩm cao cấp Ringo dẻo dai (Lô 12 cuộn 400mm)', defaultSellingPrice: 1350000 },
    { name: 'Giấy bạc nướng thực phẩm cao cấp dày (Thùng 12 cuộn 30cm)', defaultSellingPrice: 780000 },
    { name: 'Combo hộp xốp đóng cơm mang đi giữ nhiệt (Lô 1000 cái)', defaultSellingPrice: 650000 },
  ],
  cay_canh: [
    { name: 'Cây Bonsai Tùng La Hán dáng trực thế (Chậu đại)', defaultSellingPrice: 5500000 },
    { name: 'Cây Bonsai Sanh cổ lá trung ôm đá nghệ thuật', defaultSellingPrice: 8500000 },
    { name: 'Cây Bonsai Mai Chiếu Thủy nu da đen (Dáng trực)', defaultSellingPrice: 4200000 },
    { name: 'Cây Bonsai Linh Sam bông tím lũa zin nghệ thuật', defaultSellingPrice: 3800000 },
    { name: 'Cây Kim Tiền lộc phát phong thủy (Lô 10 chậu sứ)', defaultSellingPrice: 3200000 },
    { name: 'Cây Thiết Mộc Lan văn phòng (Lô 10 chậu đại)', defaultSellingPrice: 6800000 },
    { name: 'Cây Lưỡi Hổ viền vàng thanh lọc không khí (Lô 20 chậu)', defaultSellingPrice: 2800000 },
    { name: 'Cây Hạnh Phúc phong thủy phòng khách (Lô 10 chậu)', defaultSellingPrice: 4500000 },
    { name: 'Cây Bàng Singapore nội thất hiện đại (Lô 15 chậu)', defaultSellingPrice: 3900000 },
    { name: 'Đất phù sa bồi giá thể xơ dừa sấy (Lô 100 bao)', defaultSellingPrice: 2500000 },
    { name: 'Phân bón vi lượng hữu cơ Dynamic Nhật Bản (Lô 50 bao)', defaultSellingPrice: 4200000 },
    { name: 'Bộ chậu gốm sứ Bát Tràng vẽ tay cao cấp (30 bộ)', defaultSellingPrice: 4800000 },
    { name: 'Combo dụng cụ uốn tỉa & kéo cắt Bonsai chuyên dụng', defaultSellingPrice: 1950000 },
    { name: 'Dây nhôm uốn cành Bonsai chuyên nghiệp (Lô 20 cuộn)', defaultSellingPrice: 1450000 },
    { name: 'Thuốc kích rễ cực mạnh N3M nhập khẩu (Lô 50 hũ)', defaultSellingPrice: 950000 },
    { name: 'Đất nung Nhật Bản Akadama lót nền Bonsai (Lô 20 bao)', defaultSellingPrice: 2900000 },
    { name: 'Cây Vạn Lộc & Hồng Phát Lộc mini để bàn (Lô 50 chậu)', defaultSellingPrice: 4500000 },
    { name: 'Cây Lan Ý lọc không khí văn phòng (Lô 30 chậu sứ)', defaultSellingPrice: 3600000 },
    { name: 'Chậu nhựa thông minh trồng rau hoa ban công (Lô 100 cái)', defaultSellingPrice: 1800000 },
    { name: 'Hệ thống tưới nhỏ giọt tự động thông minh (10 bộ)', defaultSellingPrice: 2200000 },
    { name: 'Cây Bonsai Đề Lâm bám đá dáng bay nghệ thuật', defaultSellingPrice: 4800000 },
    { name: 'Cây Bonsai Hồng Ngọc Mai hoa đỏ thơm ngát', defaultSellingPrice: 3100000 },
    { name: 'Cây Trầu Bà leo cột đại văn phòng lọc khí (Lô 10 chậu)', defaultSellingPrice: 5200000 },
    { name: 'Cây Ngũ Gia Bì xanh tươi đuổi muỗi hiệu quả (Lô 15 chậu)', defaultSellingPrice: 3450000 },
    { name: 'Cây Trúc Bách Hợp phong thủy thịnh vượng (Lô 10 chậu)', defaultSellingPrice: 4100000 },
    { name: 'Đất sạch hữu cơ dinh dưỡng Tribat cao cấp (Lô 100 bao)', defaultSellingPrice: 3800000 },
    { name: 'Đất đỏ bazan giàu khoáng chất Tây Nguyên (Lô 50 bao)', defaultSellingPrice: 2400000 },
    { name: 'Phân bò hoai mục đã qua xử lý vi sinh (Lô 100 bao)', defaultSellingPrice: 2200000 },
    { name: 'Phân trùn quế nguyên chất hữu cơ miền nam (Lô 50 bao)', defaultSellingPrice: 3100000 },
    { name: 'Phân bón NPK chậm tan hữu dụng cho Bonsai (Lô 30 hũ)', defaultSellingPrice: 1250000 },
    { name: 'Thuốc dưỡng lá & ngừa nấm bệnh sinh học (Lô 20 bộ)', defaultSellingPrice: 1850000 },
    { name: 'Bộ chậu nhựa lục giác trồng cây cỡ nhỡ (Lô 200 cái)', defaultSellingPrice: 2600000 },
    { name: 'Chậu gốm đất nung phong cách vintage (Lô 50 cái)', defaultSellingPrice: 3400000 },
    { name: 'Khay nhựa lót chậu tránh tràn nước tưới (Lô 200 cái)', defaultSellingPrice: 1100000 },
    { name: 'Bình xịt nước áp suất cao Dudaco dung tích 4L (10 cái)', defaultSellingPrice: 1650000 },
    { name: 'Cuộn lưới lan che nắng giảm nhiệt độ vườn 70% (Cuộn lớn)', defaultSellingPrice: 1450000 },
    { name: 'Vòi phun sương làm mát tự động 4 hướng (20 bộ)', defaultSellingPrice: 1950000 },
    { name: 'Kéo tỉa dăm cành thép Nhật sắc bén (10 chiếc)', defaultSellingPrice: 1150000 },
    { name: 'Máy đo độ ẩm & độ pH đất trồng đa năng 3 in 1 (5 bộ)', defaultSellingPrice: 980000 },
    { name: 'Đất dừa ép viên sơ dừa sấy khô bánh nén (Lô 200 bánh)', defaultSellingPrice: 1500000 },
    { name: 'Cây Kim Ngân phong thủy mang may mắn thịnh vượng (Lô 20 chậu)', defaultSellingPrice: 3200000 },
    { name: 'Cây Đa Tam Phúc lá tim độc đáo mộc mạc (Lô 10 chậu)', defaultSellingPrice: 4500000 },
    { name: 'Cây Cau Tiểu Trâm mini đặt văn phòng (Lô 40 chậu)', defaultSellingPrice: 2400000 },
    { name: 'Cây Sen Đá tổng hợp các loại sặc sỡ (Lô 100 chậu)', defaultSellingPrice: 3500000 },
    { name: 'Cây Xương Rồng cảnh mini dễ thương đa dạng (Lô 80 chậu)', defaultSellingPrice: 3200000 },
    { name: 'Cây Phát Tài Phát Lộc mang tài lộc bình an (Lô 100 bình)', defaultSellingPrice: 2800000 },
    { name: 'Cây hoa Trạng Nguyên đỏ rực đón Tết may mắn (Lô 30 chậu)', defaultSellingPrice: 3600000 },
    { name: 'Cây hoa Sống Đời nở bông bền màu rực rỡ (Lô 50 chậu)', defaultSellingPrice: 2900000 },
    { name: 'Phân dơi hữu cơ tự nhiên cao cấp bón rễ (Lô 20 túi 1kg)', defaultSellingPrice: 1450000 },
    { name: 'Dây buộc cành cây lõi kẽm bọc nhựa mềm dẻo (Lô 50 cuộn)', defaultSellingPrice: 1100000 },
  ],
  giuong_tu_ban_ghe: [
    { name: 'Giường ngủ gỗ gõ đỏ tự nhiên cao cấp (Cái)', defaultSellingPrice: 15500000 },
    { name: 'Giường ngủ gỗ sồi Nga hiện đại 1m8x2m (Cái)', defaultSellingPrice: 7800000 },
    { name: 'Tủ quần áo 4 cánh gỗ công nghiệp MDF chống ẩm (Cái)', defaultSellingPrice: 6200000 },
    { name: 'Tủ quần áo gỗ xoan đào tự nhiên 3 cánh (Cái)', defaultSellingPrice: 11200000 },
    { name: 'Bộ bàn ăn gỗ sồi 6 ghế bọc da cao cấp (Bộ)', defaultSellingPrice: 8500000 },
    { name: 'Bàn làm việc giám đốc gỗ tự nhiên sơn PU (Cái)', defaultSellingPrice: 5800000 },
    { name: 'Bàn học sinh kèm giá sách gỗ công nghiệp (Cái)', defaultSellingPrice: 2400000 },
    { name: 'Bàn trà sofa gỗ sồi mặt kính cường lực (Cái)', defaultSellingPrice: 3200000 },
    { name: 'Ghế sofa da phòng khách đệm mút cao cấp (Bộ)', defaultSellingPrice: 14500000 },
    { name: 'Ghế làm việc xoay lưới văn phòng công sở (Lô 10 cái)', defaultSellingPrice: 7500000 },
    { name: 'Ghế ăn gỗ cao su xuất khẩu tiện lợi (Lô 10 cái)', defaultSellingPrice: 4200000 },
    { name: 'Kệ tivi phòng khách gỗ công nghiệp 2m (Cái)', defaultSellingPrice: 2800000 },
    { name: 'Tủ giày thông minh cánh lật tiết kiệm diện tích (Cái)', defaultSellingPrice: 1950000 },
    { name: 'Bàn trang điểm đèn LED gương tròn hiện đại (Cái)', defaultSellingPrice: 3100000 },
    { name: 'Tủ thờ gia tiên gỗ gụ chạm khắc tinh xảo (Cái)', defaultSellingPrice: 18500000 },
    { name: 'Giường tầng trẻ em gỗ thông nhập khẩu an toàn (Cái)', defaultSellingPrice: 9200000 },
    { name: 'Ghế bập bênh thư giãn gỗ sồi tự nhiên (Cái)', defaultSellingPrice: 2600000 },
    { name: 'Tủ tài liệu văn phòng gỗ MDF 4 ngăn cánh kính (Cái)', defaultSellingPrice: 3500000 },
    { name: 'Kệ sách trang trí đứng gỗ sồi 5 tầng (Cái)', defaultSellingPrice: 2200000 },
    { name: 'Bộ bàn ghế học sinh chống gù chống cận thông minh (Bộ)', defaultSellingPrice: 4800000 },
  ],
  do_dung_em_be: [
    { name: 'Tã quần Pampers Baby Dry Premium Size XL (Thùng 4 bịch 54 miếng)', defaultSellingPrice: 860000 },
    { name: 'Tã dán Huggies Skin Care Tràm Trà Size M (Thùng 4 bịch 76 miếng)', defaultSellingPrice: 780000 },
    { name: 'Tã quần Bobby Extra Soft Dry Size L (Thùng 4 bịch 68 miếng)', defaultSellingPrice: 820000 },
    { name: 'Tã dán sơ sinh Moony Natural Nhật Bản Size NB (Thùng 4 bịch 62 miếng)', defaultSellingPrice: 1150000 },
    { name: 'Tã quần Merries Jumbo Nhật Bản Size XL (Thùng 3 bịch 50 miếng)', defaultSellingPrice: 1050000 },
    { name: 'Sữa bột Infant Formula Nan Optipro số 1 800g (Lô 6 lon)', defaultSellingPrice: 2850000 },
    { name: 'Sữa bột Meiji Hohoemi số 0 nội địa Nhật 800g (Lô 8 lon)', defaultSellingPrice: 3980000 },
    { name: 'Sữa bột Aptamil Profutron Duoadvance số 2 800g (Lô 6 lon)', defaultSellingPrice: 4200000 },
    { name: 'Sữa công thức Pediasure Abbott vị vani 850g (Lô 6 lon)', defaultSellingPrice: 3650000 },
    { name: 'Sữa bột Frisolac Gold số 1 cho trẻ 0-6 tháng 850g (Lô 6 lon)', defaultSellingPrice: 2950000 },
    { name: 'Bình sữa Cổ rộng PPSU Pigeon Premium 240ml (Thùng 12 bình)', defaultSellingPrice: 2880000 },
    { name: 'Bình sữa Thủy tinh Avent Natural Philips 120ml (Thùng 10 bình)', defaultSellingPrice: 2450000 },
    { name: 'Bình sữa Silicone Hegen PPSU 150ml chống sặc (Thùng 6 bình)', defaultSellingPrice: 2100000 },
    { name: 'Núm ti Silicone siêu mềm Moyuum số 2 (Thùng 20 vỉ x 2 núm)', defaultSellingPrice: 2600000 },
    { name: 'Máy tiệt trùng & sấy khô FatzBaby Captain 1 đĩa đun (Chiếc)', defaultSellingPrice: 1250000 },
    { name: 'Máy hâm sữa & hâm thức ăn FatzBaby Mono 6 (Thùng 6 máy)', defaultSellingPrice: 1980000 },
    { name: 'Máy hút sữa điện đôi Moaz BéBé MB-029 (Chiếc)', defaultSellingPrice: 1850000 },
    { name: 'Nước rửa bình sữa & rau quả Dnee hữu cơ Organic (Thùng 12 túi 600ml)', defaultSellingPrice: 780000 },
    { name: 'Nước rửa bình sữa Arau Baby chiết xuất thảo mộc Nhật (Thùng 12 chai 500ml)', defaultSellingPrice: 1550000 },
    { name: 'Cây rửa bình sữa & núm ti xoay 360 độ Pigeon (Thùng 24 bộ)', defaultSellingPrice: 1440000 },
    { name: 'Khăn ướt em bé không mùi Bobby dịu nhẹ (Thùng 30 gói 100 tờ)', defaultSellingPrice: 890000 },
    { name: 'Khăn ướt Fressi Care All-Baby không cồn (Thùng 24 gói 80 tờ)', defaultSellingPrice: 620000 },
    { name: 'Sữa tắm gội toàn thân Dnee Baby Head & Body Wash (Thùng 12 chai 380ml)', defaultSellingPrice: 1080000 },
    { name: 'Sữa tắm gội toàn thân Cetaphil Baby Gentle Wash & Shampoo (Thùng 12 chai 230ml)', defaultSellingPrice: 2150000 },
    { name: 'Sữa tắm gội trị rôm sẩy Lactacyd Baby Gentle Care (Thùng 24 chai 250ml)', defaultSellingPrice: 1850000 },
    { name: 'Kem chống hăm tã Bepanthen Balm Pháp (Lô 24 tuýp 30g)', defaultSellingPrice: 1680000 },
    { name: 'Kem chống hăm & dịu da Sudocrem Healing Cream (Lô 12 hũ 125g)', defaultSellingPrice: 1320000 },
    { name: 'Phấn rôm em bé Johnson\'s Baby Powder thảo mộc (Thùng 24 chai 200g)', defaultSellingPrice: 920000 },
    { name: 'Dầu tràm nguyên chất Huế phòng cảm lạnh cho bé (Lô 20 chai 50ml)', defaultSellingPrice: 1400000 },
    { name: 'Nước giặt xả quần áo em bé Dnee Hương Giặt Hồng (Thùng 4 can 3000ml)', defaultSellingPrice: 680000 },
    { name: 'Nước giặt quần áo em bé Docilee Organic Thụy Sĩ (Thùng 4 can 3000ml)', defaultSellingPrice: 720000 },
    { name: 'Nước xả vải dịu nhẹ cho da nhạy cảm Hygiene Baby (Thùng 6 túi 1150ml)', defaultSellingPrice: 540000 },
    { name: 'Tăm bông thân giấy kháng khuẩn cho bé YumYum (Thùng 40 hộp 200 que)', defaultSellingPrice: 880000 },
    { name: 'Khăn xô tắm sợi tre siêu mềm 6 lớp cho bé (Thùng 30 chiếc 110x110cm)', defaultSellingPrice: 1950000 },
    { name: 'Khăn sữa sợi tre kháng khuẩn 4 lớp (Lô 50 bịch x 10 chiếc)', defaultSellingPrice: 1750000 },
    { name: 'Bột ăn dăm Hipp Organic vị kiều mạch & rau củ (Thùng 12 hộp 250g)', defaultSellingPrice: 1380000 },
    { name: 'Bột ăn dăm Cerelac Nestle vị lúa mỳ gà hầm (Thùng 24 hộp 200g)', defaultSellingPrice: 1450000 },
    { name: 'Bánh ăn dăm Gerber Organic vị dâu chuối (Thùng 12 hũ 42g)', defaultSellingPrice: 980000 },
    { name: 'Ghế ăn dăm nâng hạ độ cao Hanbei đa năng (Thùng 5 chiếc)', defaultSellingPrice: 2100000 },
    { name: 'Xe đẩy em bé gấp gọn đi du lịch Baobaohao V8 (Chiếc)', defaultSellingPrice: 1150000 },
    { name: 'Nôi đưa tự động cho bé sơ sinh Joie Serina 2in1 (Chiếc)', defaultSellingPrice: 3450000 },
    { name: 'Chậu tắm gấp gọn kèm phao tắm chống trượt cho bé (Thùng 10 chậu)', defaultSellingPrice: 2200000 },
    { name: 'Cắn răng Silicone định hình mọc răng Richell (Lô 20 chiếc)', defaultSellingPrice: 1800000 },
    { name: 'Ty giả Silicon chỉnh nha Ultra Air Avent (Lô 15 vỉ x 2 ty)', defaultSellingPrice: 2850000 },
    { name: 'Yếm ăn dăm Silicone có máng hứng chống văng (Lô 30 chiếc)', defaultSellingPrice: 1050000 },
    { name: 'Bát ăn dăm chống lật Silicone kèm thìa Richell (Lô 20 bộ)', defaultSellingPrice: 1950000 },
    { name: 'Nhiệt kế hồng ngoại đo nhiệt độ trán Microlife NC200 (Thùng 5 chiếc)', defaultSellingPrice: 3600000 },
    { name: 'Dụng cụ hút mũi dây Silicone chống ngược NoseFrida (Thùng 12 bộ)', defaultSellingPrice: 1800000 },
    { name: 'Nước muối sinh lý Physiodose Pháp tép đơn (Thùng 10 hộp x 40 ống)', defaultSellingPrice: 1450000 },
    { name: 'Bộ kéo bấm móng tay & giũa móng sơ sinh ToiIng (Thùng 20 bộ)', defaultSellingPrice: 1100000 },
  ],
  vat_lieu_xay_dung: [
    { name: 'Xi măng Portland INSEE Đa Dụng PCB40 (Bao 50kg)', defaultSellingPrice: 92000 },
    { name: 'Xi măng Hà Tiên 1 chuyên dụng xây tô (Bao 50kg)', defaultSellingPrice: 88000 },
    { name: 'Xi măng Nghi Sơn PCB40 chất lượng cao (Bao 50kg)', defaultSellingPrice: 86000 },
    { name: 'Xi măng Vicem Bỉm Sơn PCB40 (Bao 50kg)', defaultSellingPrice: 85000 },
    { name: 'Xi măng trắng SCG White Portland Cement Thái Lan (Bao 40kg)', defaultSellingPrice: 175000 },
    { name: 'Vôi bột xây dựng khử khuẩn quét tường (Bao 25kg)', defaultSellingPrice: 45000 },
    { name: 'Cát vàng hạt lớn đổ bê tông xây dựng (Khối / m3)', defaultSellingPrice: 380000 },
    { name: 'Cát mịn san lấp mặt bằng chuẩn công trình (Khối / m3)', defaultSellingPrice: 220000 },
    { name: 'Đá 1x2 xanh Đồng Nai đổ bê tông tươi (Khối / m3)', defaultSellingPrice: 420000 },
    { name: 'Đá mi sàng rải nền & phụ gia bê tông (Khối / m3)', defaultSellingPrice: 290000 },
    { name: 'Đá 4x6 xanh kè móng chịu lực công trình (Khối / m3)', defaultSellingPrice: 360000 },
    { name: 'Gạch ống 4 lỗ Tuynel Bình Dương 8x8x18 (Lô 1.000 viên)', defaultSellingPrice: 1250000 },
    { name: 'Gạch đinh đặc Tuynel chịu lực xây móng (Lô 1.000 viên)', defaultSellingPrice: 1450000 },
    { name: 'Gạch bê tông nhẹ khí chưng áp AAC 600x200x100 (Khối / m3)', defaultSellingPrice: 1350000 },
    { name: 'Gạch block xi măng xây tường rào 9x19x39 (Lô 500 viên)', defaultSellingPrice: 2800000 },
    { name: 'Thép cuộn Pomina D6 / D8 CB240-T (Tấn)', defaultSellingPrice: 15800000 },
    { name: 'Thép cây vằn Hòa Phát phi 10 D10 CB300-V (Cây 11.7m)', defaultSellingPrice: 128000 },
    { name: 'Thép cây vằn Hòa Phát phi 12 D12 CB300-V (Cây 11.7m)', defaultSellingPrice: 186000 },
    { name: 'Thép cây vằn Việt Nhật phi 16 D16 CB400-V (Cây 11.7m)', defaultSellingPrice: 335000 },
    { name: 'Thép cây vằn Pomina phi 20 D20 CB400-V (Cây 11.7m)', defaultSellingPrice: 520000 },
    { name: 'Thép hộp mạ kẽm Hoa Sen 50x100x1.8mm (Cây 6m)', defaultSellingPrice: 420000 },
    { name: 'Thép hộp vuông mạ kẽm Nam Kim 40x40x1.4mm (Cây 6m)', defaultSellingPrice: 195000 },
    { name: 'Thép góc V mạ kẽm V50x50x4mm (Cây 6m)', defaultSellingPrice: 290000 },
    { name: 'Lưới thép hàn đổ sàn bê tông D4 a150 (Cuộn 2mx25m)', defaultSellingPrice: 1850000 },
    { name: 'Kẽm buộc 1 ly mềm dẻo buộc cốt thép (Cuộn 50kg)', defaultSellingPrice: 950000 },
    { name: 'Đinh thép đóng coppha bê tông 5cm - 7cm (Bao 50kg)', defaultSellingPrice: 1150000 },
    { name: 'Tôn lạnh màu Hoa Sen dày 0.45mm sóng vuông (Mét tới)', defaultSellingPrice: 118000 },
    { name: 'Tôn xốp cách nhiệt PU Đông Á 3 lớp dày 0.45mm (Mét tới)', defaultSellingPrice: 175000 },
    { name: 'Xà gồ mạ kẽm C150x50x20 dày 1.8mm (Cây 6m)', defaultSellingPrice: 360000 },
    { name: 'Tấm trần thạch cao Gyproc Vĩnh Tường 9mm tiêu chuẩn (Tấm 1.22x2.44m)', defaultSellingPrice: 125000 },
    { name: 'Tấm thạch cao chống ẩm Gyproc Vĩnh Tường 9mm (Tấm 1.22x2.44m)', defaultSellingPrice: 165000 },
    { name: 'Khung xương trần chìm Vĩnh Tường Basi (Bộ vật tư / 50m2)', defaultSellingPrice: 3200000 },
    { name: 'Tấm xi măng sợi Cemboard SCG Thái Lan 18mm lót sàn (Tấm 1.22x2.44m)', defaultSellingPrice: 620000 },
    { name: 'Gạch lát nền Granite Đồng Tâm 80x80cm bóng kiếng (Thùng 3 viên / 1.92m2)', defaultSellingPrice: 495000 },
    { name: 'Gạch lát nền Ceramic Prime 60x60cm chống trơn (Thùng 4 viên / 1.44m2)', defaultSellingPrice: 215000 },
    { name: 'Gạch ốp tường Viglacera 30x60cm men bóng cao cấp (Thùng 8 viên / 1.44m2)', defaultSellingPrice: 195000 },
    { name: 'Gạch men lát sân vườn chống trượt Catalan 40x40cm (Thùng 6 viên / 0.96m2)', defaultSellingPrice: 135000 },
    { name: 'Keo dán gạch chống thấm Weber.tai fix (Bao 25kg)', defaultSellingPrice: 280000 },
    { name: 'Keo chà ron chống rêu mốc Sika Tile Grout (Gói 1kg)', defaultSellingPrice: 35000 },
    { name: 'Sơn lót kháng kiềm ngoại thất Dulux Weathershield (Thùng 18L)', defaultSellingPrice: 2850000 },
    { name: 'Sơn phủ ngoại thất Dulux Weathershield Colour Protect (Thùng 15L)', defaultSellingPrice: 3450000 },
    { name: 'Sơn nội thất lau chùi hiệu quả Jotun Majestic (Thùng 15L)', defaultSellingPrice: 2250000 },
    { name: 'Sơn chống thấm pha xi măng Kova CT-11A Plus (Thùng 20kg)', defaultSellingPrice: 1950000 },
    { name: 'Hóa chất chống thấm đàn hồi Sikatop Seal 107 (Bộ 25kg)', defaultSellingPrice: 890000 },
    { name: 'Phụ gia chống thấm bê tông & vữa Sika Latex TH (Can 25L)', defaultSellingPrice: 1450000 },
    { name: 'Keo bọt nở chống thấm Apollo Foam chuyên dụng (Chai 750ml)', defaultSellingPrice: 95000 },
    { name: 'Keo Silicone trung tính Apollo A500 dán kính nhôm (Thùng 24 chai)', defaultSellingPrice: 1320000 },
    { name: 'Ống nhựa uPVC Tiền Phong D110 dày 3.2mm Class 2 (Cây 4m)', defaultSellingPrice: 265000 },
    { name: 'Ống cấp nước nóng hàn nhiệt PPR Bình Minh D25 PN20 (Cây 4m)', defaultSellingPrice: 145000 },
    { name: 'Hố ga thu nước composite chịu tải trọng nặng kèm nắp đậy (Bộ)', defaultSellingPrice: 1150000 },
  ],
  khac: [
    { name: 'Giấy in Double A A4 70gsm cao cấp (Thùng 5 ream)', defaultSellingPrice: 350000 },
    { name: 'Bút bi Thiên Long 0.5mm màu xanh (Thùng 20 hộp)', defaultSellingPrice: 1150000 },
    { name: 'Khẩu trang y tế kháng khuẩn 4 lớp (Thùng 50 hộp)', defaultSellingPrice: 1650000 },
    { name: 'Nước rửa tay diệt khuẩn Lifebuoy (Thùng 6 can 4L)', defaultSellingPrice: 1580000 },
    { name: 'Bộ dụng cụ văn phòng phẩm tổng hợp Deli cao cấp', defaultSellingPrice: 2500000 },
    { name: 'Thùng carton đóng hàng 3 lớp 30x20x10 (Lô 500 cái)', defaultSellingPrice: 2800000 },
    { name: 'Khăn ướt cồn diệt khuẩn gói 80 tờ (Thùng 48 gói)', defaultSellingPrice: 920000 },
    { name: 'Pin điện tử Alkaline AA/AAA Energizer (Thùng 120 viên)', defaultSellingPrice: 1150000 },
    { name: 'Băng keo dán thùng OPP siêu dính trong suốt (Lô 120 cuộn)', defaultSellingPrice: 1320000 },
    { name: 'Màng PE bọc hàng hóa chống trầy xước (Thùng 6 cuộn 5kg)', defaultSellingPrice: 850000 },
    { name: 'Túi nilon tự hủy sinh học đóng hàng siêu thị (Lô 50kg)', defaultSellingPrice: 1950000 },
    { name: 'Dịch vụ bảo trì, vệ sinh hệ thống điều hòa máy lạnh', defaultSellingPrice: 1200000 },
    { name: 'Ổ cắm điện đa năng chống quá tải Lioa (Lô 10 cái)', defaultSellingPrice: 1450000 },
    { name: 'Kệ sắt lắp ghép thông minh đa năng v lỗ (Bộ 3 kệ)', defaultSellingPrice: 2100000 },
    { name: 'Bộ bóng đèn LED siêu sáng tiết kiệm điện Rạng Đông (20 cái)', defaultSellingPrice: 1350000 },
    { name: 'Máy dập ghim đại & ghim Deli xoay chiều (5 bộ)', defaultSellingPrice: 780000 },
    { name: 'Thùng rác nhựa HDPE nắp lật dung tích 60L (Lô 5 cái)', defaultSellingPrice: 1100000 },
    { name: 'Bộ dụng cụ vệ sinh nhà xưởng đa năng nhập khẩu', defaultSellingPrice: 1650000 },
    { name: 'Bảng từ trắng viết bút lông Hàn Quốc treo tường', defaultSellingPrice: 850000 },
    { name: 'Ghế xoay văn phòng tựa lưng lưới thoáng khí (Chiếc)', defaultSellingPrice: 790000 },
    { name: 'Thảm nỉ đỏ lót sàn sự kiện tiệc cưới cao cấp (Cuộn lớn)', defaultSellingPrice: 1850000 },
    { name: 'Bình chữa cháy bột MFZ4 an toàn tiêu chuẩn (Lô 10 bình)', defaultSellingPrice: 1450000 },
    { name: 'Găng tay bảo hộ lao động phủ cao su bền dai (Lô 100 đôi)', defaultSellingPrice: 850000 },
    { name: 'Mũ bảo hộ lao động Thùy Dương chất lượng cao (Lô 30 chiếc)', defaultSellingPrice: 1150000 },
    { name: 'Cuộn dây cáp mạng Cat6 xanh chống nhiễu (Cuộn 305m)', defaultSellingPrice: 1350000 },
    { name: 'Thiết bị phát Wifi TP-Link chuẩn AC băng tần kép (5 chiếc)', defaultSellingPrice: 2450000 },
    { name: 'Bộ dụng cụ tô vít & khóa lục giác sửa chữa Deli (5 bộ)', defaultSellingPrice: 850000 },
    { name: 'Hộp nhựa đựng đồ đa năng có bánh xe 120L (Lô 10 cái)', defaultSellingPrice: 1650000 },
    { name: 'Dây rút nhựa trắng nhiều kích cỡ dai dẻo (Lô 100 bịch)', defaultSellingPrice: 1150000 },
    { name: 'Máy sấy tay cảm ứng nhiệt tự động gắn tường (Chiếc)', defaultSellingPrice: 1850000 },
    { name: 'Kệ gỗ đựng tài liệu hồ sơ văn phòng 5 ngăn', defaultSellingPrice: 950000 },
    { name: 'Khăn lau microfiber siêu thấm hút đa năng (Lô 200 cái)', defaultSellingPrice: 1350000 },
    { name: 'Gương treo phòng tắm viền inox chống bám mờ (5 chiếc)', defaultSellingPrice: 1100000 },
    { name: 'Khóa tay gạt Việt Tiệp inox chính hãng bền bỉ (Lô 10 bộ)', defaultSellingPrice: 2200000 },
    { name: 'Đồng hồ treo tường kim trôi hiện đại yên tĩnh (Lô 10 cái)', defaultSellingPrice: 1250000 },
    { name: 'Bộ chổi quét nhà & hót rác nhựa tự động gập (10 bộ)', defaultSellingPrice: 750000 },
    { name: 'Thùng đựng nước đá nhựa Duy Tân 45L giữ nhiệt (5 cái)', defaultSellingPrice: 1350000 },
    { name: 'Ô dù cầm tay gấp ngược che mưa nắng ô tô (Lô 20 cái)', defaultSellingPrice: 1850000 },
    { name: 'Áo mưa cánh dơi vải dù siêu bền chống thấm (Lô 50 cái)', defaultSellingPrice: 2450000 },
    { name: 'Nước lau kính Sunlight sạch bóng hương bạc hà (Thùng 12 chai)', defaultSellingPrice: 340000 },
    { name: 'Túi zip lụa mờ có khóa kéo đựng quần áo (Lô 1000 cái)', defaultSellingPrice: 1450000 },
    { name: 'Giấy xi măng gói quà kraft thân thiện (Lô 1000 tờ)', defaultSellingPrice: 850000 },
    { name: 'Sáp thơm khử mùi phòng ngủ Glade (Thùng 24 hộp)', defaultSellingPrice: 960000 },
    { name: 'Dụng cụ đóng đai nhựa cầm tay đóng thùng hàng', defaultSellingPrice: 1150000 },
    { name: 'Con lăn sơn tường thông minh không rơi vãi Deli (5 bộ)', defaultSellingPrice: 680000 },
    { name: 'Vải bạt xanh cam che mưa nắng công trình (10 tấm 4x6m)', defaultSellingPrice: 1350000 },
    { name: 'Dây thừng nylon bện xoắn chịu lực kéo tải (Lô 5 cuộn)', defaultSellingPrice: 980000 },
    { name: 'Giá treo tivi đa năng xoay góc thông minh (5 chiếc)', defaultSellingPrice: 850000 },
    { name: 'Ổ khóa treo đồng thau Việt Tiệp chống cắt (Lô 15 cái)', defaultSellingPrice: 1450000 },
    { name: 'Đèn pin sạc điện siêu sáng chống nước dã ngoại (10 chiếc)', defaultSellingPrice: 1150000 },
  ],
};

const INDUSTRY_INPUT_PRODUCTS: Record<string, PredefinedProduct[]> = {
  giuong_tu_ban_ghe: [
    { name: 'Gỗ sồi Mỹ nhập khẩu xẻ sấy quy cách (Khối)', defaultSellingPrice: 18500000 },
    { name: 'Gỗ gõ đỏ Nam Phi nhập khẩu chất lượng cao (Khối)', defaultSellingPrice: 32000000 },
    { name: 'Gỗ xoan đào Gia Lai xẻ sấy chuẩn (Khối)', defaultSellingPrice: 15500000 },
    { name: 'Gỗ tần bì (Ash) nhập khẩu sấy khô (Khối)', defaultSellingPrice: 12500000 },
    { name: 'Ván công nghiệp MDF phủ Melamine chống ẩm 18mm (Tấm)', defaultSellingPrice: 450000 },
    { name: 'Ván công nghiệp HDF siêu chống ẩm An Cường (Tấm)', defaultSellingPrice: 680000 },
    { name: 'Ván gỗ ghép thanh cao su phủ bóng 2 mặt (Tấm)', defaultSellingPrice: 380000 },
    { name: 'Bộ phụ kiện bản lề giảm chấn tủ bếp inox 304 (Lô 100 bộ)', defaultSellingPrice: 2800000 },
    { name: 'Bộ ray trượt bi 3 tầng giảm chấn tủ quần áo (Lô 50 cặp)', defaultSellingPrice: 3500000 },
    { name: 'Sơn PU cao cấp chống trầy xước Oseven (Thùng 20L)', defaultSellingPrice: 1850000 },
    { name: 'Dung môi pha sơn xăng thơm Butyl Acetate (Thùng 20L)', defaultSellingPrice: 950000 },
    { name: 'Keo dán gỗ sữa Titebond chịu nước cường độ cao (Thùng 10kg)', defaultSellingPrice: 1450000 },
    { name: 'Cuộn chỉ viền nhựa PVC dán cạnh gỗ công nghiệp (Cuộn 200m)', defaultSellingPrice: 550000 },
    { name: 'Bộ ốc liên kết âm cam chốt tủ thông minh (Lô 1000 bộ)', defaultSellingPrice: 1200000 },
    { name: 'Tay nắm cửa tủ hợp kim nhôm hiện đại (Lô 100 cái)', defaultSellingPrice: 1800000 },
    { name: 'Da công nghiệp PU bọc nệm ghế sofa cao cấp (Cuộn 50m)', defaultSellingPrice: 6500000 },
    { name: 'Mút xốp D40 đàn hồi cao làm đệm ghế sofa (Tấm 1.6m x 2m)', defaultSellingPrice: 850000 },
    { name: 'Chân sắt hộp sơn tĩnh điện lắp ráp bàn làm việc (Lô 20 cái)', defaultSellingPrice: 4200000 },
    { name: 'Giấy nhám chà nhẵn bề mặt gỗ các độ hạt (Lô 500 tờ)', defaultSellingPrice: 750000 },
    { name: 'Kính cường lực 10mm mặt bàn trà sofa (Lô 10 tấm)', defaultSellingPrice: 3800000 },
  ]
};

const generateMultiItems = (
  targetAmount: number,
  productsList: PredefinedProduct[],
  numItemsSelected: number = 3,
  discountPercent: number = 7
): ContractItem[] => {
  if (!productsList || productsList.length === 0 || targetAmount <= 0) return [];
  
  const discountMultiplier = Math.max(0, 1 - discountPercent / 100);
  // Pick candidate products that fit the total amount, or use the whole list
  const filteredProds = productsList.filter(p => Math.round(p.defaultSellingPrice * discountMultiplier) <= targetAmount);
  const candidates = filteredProds.length >= 1 ? filteredProds : productsList;
  
  // Determine distinct items to pick
  const numItems = Math.max(1, numItemsSelected);
  const selectedProds: PredefinedProduct[] = [];
  
  // Pick distinct items from the list
  for (let i = 0; i < numItems; i++) {
    const itemIdx = i % candidates.length;
    selectedProds.push(candidates[itemIdx]);
  }
  
  let runningTotal = 0;
  const items: ContractItem[] = [];
  
  selectedProds.forEach((prod, index) => {
    const sellingPrice = prod.defaultSellingPrice;
    const contractPrice = Math.round(sellingPrice * discountMultiplier);
    
    let qty = 1;
    if (index === selectedProds.length - 1) {
      const targetShare = Math.max(0, targetAmount - runningTotal);
      qty = Math.max(1, Math.round(targetShare / (contractPrice || 1)));
    } else {
      // Distribute relatively evenly
      const targetShare = targetAmount / numItems;
      qty = Math.max(1, Math.round(targetShare / (contractPrice || 1)));
    }
    
    const itemTotal = qty * contractPrice;
    runningTotal += itemTotal;
    
    items.push({
      itemName: prod.name,
      quantity: qty,
      sellingUnitPrice: sellingPrice,
      contractUnitPrice: contractPrice,
      totalAmount: itemTotal,
    });
  });
  
  return items;
};

interface ContractModalProps {
  store: Store;
  contract?: PurchaseContract | null; // If editing or viewing
  buyerName: string; // From current user's profile
  initialPreviewDoc?: 'contract' | 'uynhiemchi' | 'datcoc';
  onClose: () => void;
  onSave: (contract: PurchaseContract) => void;
}

export default function ContractModal({ store, contract, buyerName, initialPreviewDoc, onClose, onSave }: ContractModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingUynhiemchiPdf, setIsGeneratingUynhiemchiPdf] = useState(false);
  const [isGeneratingDatcocPdf, setIsGeneratingDatcocPdf] = useState(false);
  const [showUynhiemchiModal, setShowUynhiemchiModal] = useState(() => initialPreviewDoc === 'uynhiemchi');

  const logoRef = React.useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoRef.current = img;
    };
    img.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Vietcombank_logo.svg/512px-Vietcombank_logo.svg.png';
  }, []);

  // Form states
  const [contractType, setContractType] = useState<'input' | 'output'>('input');
  const [sellerName, setSellerName] = useState('');
  const [sellerCitizenId, setSellerCitizenId] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerBankAccount, setSellerBankAccount] = useState('');
  const [sellerBankName, setSellerBankName] = useState('');
  const [signingDate, setSigningDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Customer selection from provinces (for output contracts)
  const [selectedCustomerProvince, setSelectedCustomerProvince] = useState<string>(() => detectProvinceFromAddress(store.address));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const applyCustomerProfile = (customer: CustomerProfile) => {
    setSellerName(customer.name);
    setSellerCitizenId(customer.citizenId);
    setSellerAddress(customer.address);
    setSellerBankAccount(customer.bankAccount);
    setSellerBankName(customer.bankName);
    setSelectedCustomerId(customer.id);
  };

  const handleSelectContractType = (type: 'input' | 'output') => {
    setContractType(type);
    if (type === 'output') {
      // If creating a new contract or if partner info is empty/default, auto-select a customer from provincial data
      if (!contract || !sellerName) {
        const cust = getRandomCustomer(selectedCustomerProvince);
        applyCustomerProfile(cust);
      }
    }
  };

  // Multiple items state
  const [items, setItems] = useState<ContractItem[]>([]);
  const [desiredTotalAmount, setDesiredTotalAmount] = useState<number>(5000000);
  const [allocationCount, setAllocationCount] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [selectedAllocationIndustry, setSelectedAllocationIndustry] = useState<string>(store.industry);
  const [discountPercent, setDiscountPercent] = useState<number>(() => contract?.discountPercent ?? 7);
  const [discountInputStr, setDiscountInputStr] = useState<string>(() => {
    const val = contract?.discountPercent ?? 7;
    return val === 0 ? '' : String(val);
  });

  // Font preference for printing and PDF export
  const [selectedFontId, setSelectedFontId] = useState<string>(() => {
    try {
      return localStorage.getItem('contract_preferred_font') || DEFAULT_CONTRACT_FONT_ID;
    } catch {
      return DEFAULT_CONTRACT_FONT_ID;
    }
  });
  const currentFont = CONTRACT_FONTS.find(f => f.id === selectedFontId) || CONTRACT_FONTS[0];

  const handleSelectFont = (fontId: string) => {
    setSelectedFontId(fontId);
    try {
      localStorage.setItem('contract_preferred_font', fontId);
    } catch {
      // ignore
    }
  };

  const effectiveBuyerName = store.representativeName || buyerName || 'Chủ cửa hàng';
  const isInput = contractType === 'input';
  const buyerSignName = isInput ? effectiveBuyerName : (sellerName || '......................................................');
  const sellerSignName = isInput ? (sellerName || '......................................................') : effectiveBuyerName;

  const industryProducts = React.useMemo(() => {
    if (selectedAllocationIndustry === 'giuong_tu_ban_ghe' && isInput) {
      return INDUSTRY_INPUT_PRODUCTS.giuong_tu_ban_ghe;
    }
    return INDUSTRY_PRODUCTS[selectedAllocationIndustry] || INDUSTRY_PRODUCTS['khac'];
  }, [selectedAllocationIndustry, isInput]);

  // Handle dynamic discount percentage change
  const handleDiscountPercentChange = (newPercent: number, syncInputStr: boolean = true) => {
    const clamped = Math.max(0, Math.min(100, newPercent));
    setDiscountPercent(clamped);
    if (syncInputStr) {
      setDiscountInputStr(clamped === 0 ? '' : String(clamped));
    }
    const multiplier = Math.max(0, 1 - clamped / 100);
    const updated = items.map(item => {
      const contractPrice = Math.round(item.sellingUnitPrice * multiplier);
      return {
        ...item,
        contractUnitPrice: contractPrice,
        totalAmount: item.quantity * contractPrice,
      };
    });
    setItems(updated);
    setDesiredTotalAmount(updated.reduce((sum, i) => sum + i.totalAmount, 0));
  };

  // Interactive Sync Handlers for individual items
  const handleUpdateItemQty = (index: number, qty: number) => {
    const updated = [...items];
    const item = updated[index];
    if (item) {
      item.quantity = Math.max(0, qty);
      item.totalAmount = item.quantity * item.contractUnitPrice;
      setItems(updated);
      setDesiredTotalAmount(updated.reduce((sum, i) => sum + i.totalAmount, 0));
    }
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    const updated = [...items];
    const item = updated[index];
    if (item) {
      item.sellingUnitPrice = Math.max(0, price);
      item.contractUnitPrice = Math.round(item.sellingUnitPrice * (1 - discountPercent / 100));
      item.totalAmount = item.quantity * item.contractUnitPrice;
      setItems(updated);
      setDesiredTotalAmount(updated.reduce((sum, i) => sum + i.totalAmount, 0));
    }
  };

  const handleUpdateItemName = (index: number, name: string) => {
    const updated = [...items];
    const item = updated[index];
    if (item) {
      item.itemName = name;
      setItems(updated);
    }
  };

  const handleDeleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setDesiredTotalAmount(updated.reduce((sum, i) => sum + i.totalAmount, 0));
  };

  const handleAddItem = () => {
    const defaultProd = industryProducts[0] || { name: 'Mặt hàng sỉ mới', defaultSellingPrice: 100000 };
    const sellingPrice = defaultProd.defaultSellingPrice;
    const contractPrice = Math.round(sellingPrice * (1 - discountPercent / 100));
    const newItem: ContractItem = {
      itemName: defaultProd.name,
      quantity: 1,
      sellingUnitPrice: sellingPrice,
      contractUnitPrice: contractPrice,
      totalAmount: contractPrice,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setDesiredTotalAmount(updated.reduce((sum, i) => sum + i.totalAmount, 0));
  };

  const handleItemProductSelect = (index: number, productName: string) => {
    const prod = industryProducts.find(p => p.name === productName);
    if (prod) {
      const updated = [...items];
      const item = updated[index];
      if (item) {
        item.itemName = prod.name;
        item.sellingUnitPrice = prod.defaultSellingPrice;
        item.contractUnitPrice = Math.round(prod.defaultSellingPrice * (1 - discountPercent / 100));
        item.totalAmount = item.quantity * item.contractUnitPrice;
        setItems(updated);
        setDesiredTotalAmount(updated.reduce((sum, i) => sum + i.totalAmount, 0));
      }
    }
  };

  const handleDesiredTotalAmountChange = (val: number, itemCount: number = allocationCount, customDiscount: number = discountPercent) => {
    setDesiredTotalAmount(val);
    const generated = generateMultiItems(val, industryProducts, itemCount, customDiscount);
    setItems(generated);
  };

  // Set initial form states if viewing/editing an existing contract
  useEffect(() => {
    setSelectedAllocationIndustry(store.industry);
    if (contract) {
      setSellerName(contract.sellerName);
      setSellerCitizenId(contract.sellerCitizenId);
      setSellerAddress(contract.sellerAddress);
      setSellerBankAccount(contract.sellerBankAccount);
      setSellerBankName(contract.sellerBankName);
      setDesiredTotalAmount(contract.totalAmount);
      setNotes(contract.notes || '');
      setDepositAmount(contract.depositAmount || 0);
      setSigningDate(contract.createdAt || new Date().toISOString().split('T')[0]);
      setContractType(contract.contractType || 'input');
      setDiscountPercent(contract.discountPercent ?? 7);
      
      if (contract.items && contract.items.length > 0) {
        setItems(contract.items);
      } else {
        // Fallback for older legacy single-item records
        setItems([
          {
            itemName: contract.itemName,
            quantity: contract.quantity,
            sellingUnitPrice: contract.sellingUnitPrice,
            contractUnitPrice: contract.contractUnitPrice,
            totalAmount: contract.totalAmount
          }
        ]);
      }
      setActiveTab('preview'); // Default to preview if viewing an existing contract
    } else {
      // Clear form for new contract
      setSellerName('');
      setSellerCitizenId('');
      setSellerAddress('');
      setSellerBankAccount('');
      setSellerBankName('');
      setSigningDate(new Date().toISOString().split('T')[0]);
      setContractType('input');
      setDiscountPercent(7);
      
      // Auto-generate items for a default target contract value of 5 million VND
      const initialTotal = 5000000;
      setDesiredTotalAmount(initialTotal);
      const initialItems = generateMultiItems(initialTotal, industryProducts, allocationCount, 7);
      setItems(initialItems);
      setNotes('');
      setDepositAmount(0);
      setActiveTab('form');
    }
  }, [contract, store.industry]);

  // Dynamically regenerate products for a new contract when industry or contract type changes
  useEffect(() => {
    if (!contract) {
      const generated = generateMultiItems(desiredTotalAmount, industryProducts, allocationCount, discountPercent);
      setItems(generated);
    }
  }, [industryProducts, allocationCount, contract]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isPartnerBankRequired = contractType === 'input';
    if (!sellerName || !sellerCitizenId || !sellerAddress || (isPartnerBankRequired && (!sellerBankAccount || !sellerBankName))) {
      alert('Vui lòng điền đầy đủ thông tin Đối tác (Bên còn lại của hợp đồng).');
      return;
    }

    if (items.length === 0) {
      alert('Hợp đồng phải có ít nhất 1 mặt hàng sỉ. Vui lòng thêm mặt hàng.');
      return;
    }

    // Verify all items are filled
    const hasInvalidItem = items.some(item => !item.itemName.trim() || item.quantity <= 0 || item.sellingUnitPrice <= 0);
    if (hasInvalidItem) {
      alert('Vui lòng kiểm tra lại thông tin các mặt hàng (Tên hàng, số lượng và đơn giá phải lớn hơn 0).');
      return;
    }

    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const contractNo = contract?.contractNumber || `HDMB-${signingDate.replace(/-/g, '')}-${randomNumber}`;

    // Calculate sum aggregates for compatibility
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmt = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const mainItemName = items.length === 1 
      ? items[0].itemName 
      : `${items[0].itemName} và ${items.length - 1} mặt hàng sỉ khác`;

    const newContract: PurchaseContract = {
      id: contract?.id || `contract-${Date.now()}`,
      storeId: store.id,
      createdAt: signingDate,
      contractNumber: contractNo,
      contractType,
      discountPercent,
      
      // Buyer (Cửa hàng)
      buyerName: store.name,
      buyerAddress: store.address || 'Chưa cập nhật địa chỉ',
      buyerRepresentative: effectiveBuyerName,
      buyerBankName: store.bankName || '',
      buyerBankAccount: store.bankAccount || '',
      buyerBankOwner: store.bankOwner || '',

      // Seller
      sellerName,
      sellerCitizenId,
      sellerAddress,
      sellerBankAccount,
      sellerBankName,

      // Items summary (compatibility)
      itemName: mainItemName,
      quantity: totalQty,
      sellingUnitPrice: items[0]?.sellingUnitPrice || 0,
      contractUnitPrice: items[0]?.contractUnitPrice || 0,
      totalAmount: totalAmt,
      
      // Full details
      items,
      notes,
      depositAmount
    };

    onSave(newContract);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-contract-area');
    if (!printContent) return;

    // Create printable container
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>In Hợp Đồng - ${contract?.contractNumber || 'Mới'}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Roboto:ital,wght@0,400;0,500;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <style>
              body {
                font-family: ${currentFont.cssFamily};
                padding: 40px;
                color: #000;
                line-height: 1.6;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .italic { font-style: italic; }
              .uppercase { text-transform: uppercase; }
              .mt-4 { margin-top: 16px; }
              .mt-8 { margin-top: 32px; }
              .mb-4 { margin-bottom: 16px; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
                margin-bottom: 16px;
              }
              table, th, td {
                border: 1px solid #000;
              }
              th, td {
                padding: 8px;
                text-align: left;
              }
              .no-border td {
                border: none;
                padding: 4px 0;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body style="font-family: ${currentFont.cssFamily}">
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Get date parts from signingDate for displaying in preview/print without timezone shifts
  let dateDay = new Date().getDate();
  let dateMonth = new Date().getMonth() + 1;
  let dateYear = new Date().getFullYear();
  if (signingDate) {
    const parts = signingDate.split('-');
    if (parts.length === 3) {
      dateYear = parseInt(parts[0], 10);
      dateMonth = parseInt(parts[1], 10);
      dateDay = parseInt(parts[2], 10);
    }
  }

  const drawContractToCanvasPages = (): HTMLCanvasElement[] => {
    const pages: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }[] = [];

    const createNewPage = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1700;
      const ctx = canvas.getContext('2d')!;
      
      // Fill background with pristine white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Default text styling
      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'top';
      
      pages.push({ canvas, ctx });
      return { canvas, ctx };
    };

    let { canvas, ctx } = createNewPage();

    // Helper to generate dynamic font string with current chosen contract font
    const cFont = (style: 'normal' | 'bold' | 'italic' | 'bold italic', size: number) => {
      const family = currentFont.fontFamily;
      if (style === 'bold italic') return `italic bold ${size}px ${family}`;
      if (style === 'italic') return `italic ${size}px ${family}`;
      if (style === 'bold') return `bold ${size}px ${family}`;
      return `${size}px ${family}`;
    };

    // Helper to draw text centered
    const drawCenteredText = (text: string, y: number, font: string) => {
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.fillText(text, 600, y);
    };

    // Helper to draw a horizontal line
    const drawHorizontalLine = (x1: number, x2: number, y: number, color = '#cccccc', width = 1) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    };

    let currentY = 70;

    // 1. National Emblem heading
    drawCenteredText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', currentY, cFont('bold', 18));
    currentY += 25;
    drawCenteredText('Độc lập - Tự do - Hạnh phúc', currentY, cFont('bold', 16));
    currentY += 25;
    
    // Draw emblem line
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.moveTo(480, currentY);
    ctx.lineTo(720, currentY);
    ctx.stroke();
    currentY += 35;

    // 2. Contract metadata (Date & Number)
    const contractNo = contract?.contractNumber || `HDMB-${signingDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let dDay = dateDay;
    let dMonth = dateMonth;
    let dYear = dateYear;
    
    ctx.fillStyle = '#1e293b';
    ctx.font = cFont('italic', 14);
    ctx.textAlign = 'right';
    ctx.fillText(`Số: ${contractNo}`, 1100, currentY);
    currentY += 22;
    ctx.fillText(`Ngày ${dDay < 10 ? '0' + dDay : dDay} tháng ${dMonth < 10 ? '0' + dMonth : dMonth} năm ${dYear}`, 1100, currentY);
    currentY += 40;

    // 3. Main Title
    ctx.fillStyle = '#000000';
    drawCenteredText('HỢP ĐỒNG MUA BÁN KIÊM GIAO NHẬN HÀNG HÓA', currentY, cFont('bold', 22));
    currentY += 40;

    // 4. Legal Bases (Căn cứ...)
    ctx.font = cFont('italic', 13);
    ctx.textAlign = 'left';
    ctx.fillText('- Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện hành.', 100, currentY);
    currentY += 22;
    ctx.fillText('- Căn cứ Luật Thương mại nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện hành.', 100, currentY);
    currentY += 22;
    ctx.fillText('- Dựa trên nhu cầu cung ứng và năng lực thực hiện của hai bên.', 100, currentY);
    currentY += 30;

    ctx.font = cFont('normal', 14);
    ctx.fillText('Chúng tôi gồm các bên dưới đây đồng thuận ký kết hợp đồng mua bán này:', 100, currentY);
    currentY += 30;

    // 5. Party A (BÊN MUA)
    ctx.font = cFont('bold', 14);
    if (isInput) {
      ctx.fillText(`BÊN MUA (BÊN A): CỬA HÀNG ${store.name.toUpperCase()}`, 100, currentY);
    } else {
      ctx.fillText(`BÊN MUA (BÊN A): THÔNG TIN ĐỐI TÁC KHÁCH HÀNG`, 100, currentY);
    }
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, currentY + 18);
    ctx.lineTo(350, currentY + 18);
    ctx.stroke();
    currentY += 25;

    ctx.font = cFont('normal', 14);
    const drawFormRow = (label: string, value: string, yVal: number) => {
      ctx.font = cFont('bold', 14);
      ctx.fillText(label, 110, yVal);
      ctx.font = cFont('normal', 14);
      ctx.fillText(value, 280, yVal);
    };

    if (isInput) {
      drawFormRow('Tên đơn vị:', store.name, currentY); currentY += 22;
      drawFormRow('Địa chỉ cửa hàng:', store.address || 'Chưa cập nhật', currentY); currentY += 22;
      drawFormRow('Người đại diện:', effectiveBuyerName, currentY); currentY += 22;
      if (store.citizenId) {
        drawFormRow('Số Căn cước (CCCD):', store.citizenId, currentY); currentY += 22;
      }
      if (store.bankAccount) {
        drawFormRow('Tài khoản ngân hàng:', `${store.bankAccount} tại ${store.bankName} (Chủ TK: ${store.bankOwner})`, currentY); currentY += 22;
      }
    } else {
      drawFormRow('Họ và Tên cá nhân:', sellerName || '..........................................................', currentY); currentY += 22;
      drawFormRow('Số Căn cước (CCCD):', maskCitizenId(sellerCitizenId), currentY); currentY += 22;
      drawFormRow('Địa chỉ thường trú:', sellerAddress || '..........................................................................................', currentY); currentY += 22;
    }
    currentY += 15;

    // 6. Party B (BÊN BÁN)
    ctx.font = cFont('bold', 14);
    if (isInput) {
      ctx.fillText('BÊN BÁN (BÊN B): THÔNG TIN ĐỐI TÁC CUNG CẤP', 100, currentY);
    } else {
      ctx.fillText(`BÊN BÁN (BÊN B): CỬA HÀNG ${store.name.toUpperCase()}`, 100, currentY);
    }
    ctx.beginPath();
    ctx.moveTo(100, currentY + 18);
    ctx.lineTo(350, currentY + 18);
    ctx.stroke();
    currentY += 25;

    if (isInput) {
      drawFormRow('Họ và Tên cá nhân:', sellerName || '..........................................................', currentY); currentY += 22;
      drawFormRow('Số Căn cước (CCCD):', sellerCitizenId || '..........................................................', currentY); currentY += 22;
      drawFormRow('Địa chỉ thường trú:', sellerAddress || '..........................................................................................', currentY); currentY += 22;
      drawFormRow('Tài khoản ngân hàng:', sellerBankAccount ? `${sellerBankAccount} tại ${sellerBankName}` : '..........................................................................................', currentY); currentY += 35;
    } else {
      drawFormRow('Tên đơn vị:', store.name, currentY); currentY += 22;
      drawFormRow('Địa chỉ cửa hàng:', store.address || 'Chưa cập nhật', currentY); currentY += 22;
      drawFormRow('Người đại diện:', effectiveBuyerName, currentY); currentY += 22;
      if (store.citizenId) {
        drawFormRow('Số Căn cước (CCCD):', store.citizenId, currentY); currentY += 22;
      }
      if (store.bankAccount) {
        drawFormRow('Tài khoản ngân hàng:', `${store.bankAccount} tại ${store.bankName} (Chủ TK: ${store.bankOwner})`, currentY); currentY += 22;
      }
      currentY += 35;
    }

    // 7. Clause 1 & Products Table
    ctx.font = cFont('bold', 14);
    ctx.fillText('ĐIỀU 1: ĐỐI TƯỢNG HÀNG HÓA VÀ ĐƠN GIÁ HỢP ĐỒNG', 100, currentY);
    currentY += 25;

    ctx.font = cFont('normal', 14);
    const textWrapped = isInput
      ? 'Bên B bán cho Bên A các mặt hàng có thông tin chi tiết dưới đây. Hai bên thống nhất thực hiện giao nhận và thanh toán theo đơn giá hợp đồng như sau:'
      : 'Bên B (Cửa hàng) bán cho Bên A (Khách hàng) các mặt hàng có thông tin chi tiết dưới đây. Hai bên thống nhất thực hiện giao nhận và thanh toán theo đơn giá hợp đồng như sau:';
    ctx.fillText(textWrapped.substring(0, 85), 100, currentY);
    currentY += 22;
    ctx.fillText(textWrapped.substring(85), 100, currentY);
    currentY += 30;

    // Table Header drawing helper (5 columns, no listed price column)
    const colX = [100, 160, 600, 720, 900, 1100];
    const drawTableHeader = (pCtx: CanvasRenderingContext2D, y: number) => {
      pCtx.strokeStyle = '#000000';
      pCtx.lineWidth = 1;
      pCtx.font = cFont('bold', 12);
      pCtx.strokeRect(100, y, 1000, 32);
      for (let idx = 1; idx < colX.length - 1; idx++) {
        pCtx.beginPath();
        pCtx.moveTo(colX[idx], y);
        pCtx.lineTo(colX[idx], y + 32);
        pCtx.stroke();
      }
      pCtx.fillStyle = '#000000';
      pCtx.textAlign = 'center';
      pCtx.fillText('STT', 130, y + 10);
      pCtx.textAlign = 'left';
      pCtx.fillText('Tên Mặt Hàng', 175, y + 10);
      pCtx.textAlign = 'center';
      pCtx.fillText('S.Lượng', 660, y + 10);
      pCtx.textAlign = 'right';
      pCtx.fillText('Đơn Giá (VNĐ)', 885, y + 10);
      pCtx.fillText('Thành Tiền (VNĐ)', 1085, y + 10);
    };

    drawTableHeader(ctx, currentY);
    currentY += 32;

    // Helper to wrap text for table cells to avoid overlapping
    const getWrappedLines = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        let testLine = currentLine + words[n] + ' ';
        ctx.font = cFont('bold', 13);
        let metrics = ctx.measureText(testLine.trim());
        if (metrics.width > maxWidth && n > 0) {
          lines.push(currentLine.trim());
          currentLine = words[n] + ' ';
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      return lines;
    };

    // Table Rows
    items.forEach((it, idx) => {
      ctx.font = cFont('bold', 13);
      const lines = getWrappedLines(it.itemName, 410);
      const rowHeight = Math.max(34, lines.length * 18 + 14);

      // Check for page overflow
      if (currentY + rowHeight > 1500) {
        const newPage = createNewPage();
        canvas = newPage.canvas;
        ctx = newPage.ctx;
        currentY = 100;
        
        // Draw Table Header on the new page
        drawTableHeader(ctx, currentY);
        currentY += 32;
      }

      const rowY = currentY;

      // Draw outer row box
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(100, rowY, 1000, rowHeight);

      // Draw column partition lines
      for (let cIdx = 1; cIdx < colX.length - 1; cIdx++) {
        ctx.beginPath();
        ctx.moveTo(colX[cIdx], rowY);
        ctx.lineTo(colX[cIdx], rowY + rowHeight);
        ctx.stroke();
      }

      // STT (Column 1)
      ctx.textAlign = 'center';
      ctx.font = cFont('normal', 13);
      ctx.fillText(String(idx + 1), 130, rowY + (rowHeight - 14) / 2);

      // Tên Mặt Hàng (Column 2) - Multi-line wrapping
      ctx.textAlign = 'left';
      ctx.font = cFont('bold', 13);
      const textStartY = rowY + (rowHeight - (lines.length * 18)) / 2;
      lines.forEach((lineText, lIdx) => {
        ctx.fillText(lineText, 175, textStartY + (lIdx * 18));
      });

      // S.Lượng (Column 3)
      ctx.textAlign = 'center';
      ctx.font = cFont('bold', 13);
      ctx.fillText(String(it.quantity), 660, rowY + (rowHeight - 14) / 2);

      // Đơn giá & Thành tiền (Columns 4, 5)
      ctx.textAlign = 'right';
      ctx.font = cFont('normal', 13);
      ctx.fillText(formatVND(it.contractUnitPrice), 885, rowY + (rowHeight - 14) / 2);
      ctx.fillText(formatVND(it.totalAmount), 1085, rowY + (rowHeight - 14) / 2);

      currentY += rowHeight;
    });

    // Draw table total row
    const totalRowHeight = 34;
    if (currentY + totalRowHeight > 1500) {
      const newPage = createNewPage();
      canvas = newPage.canvas;
      ctx = newPage.ctx;
      currentY = 100;
      
      // Draw Table Header on the new page
      drawTableHeader(ctx, currentY);
      currentY += 32;
    }
    
    const tRowY = currentY;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(100, tRowY, 1000, totalRowHeight);

    // Draw column partition lines
    for (let cIdx = 1; cIdx < colX.length - 1; cIdx++) {
      ctx.beginPath();
      ctx.moveTo(colX[cIdx], tRowY);
      ctx.lineTo(colX[cIdx], tRowY + totalRowHeight);
      ctx.stroke();
    }

    // "Tổng cộng" text
    ctx.textAlign = 'left';
    ctx.font = cFont('bold', 13);
    ctx.fillText('Tổng cộng', 175, tRowY + (totalRowHeight - 14) / 2);

    // Sum of quantities
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    ctx.textAlign = 'center';
    ctx.fillText(String(totalQty), 660, tRowY + (totalRowHeight - 14) / 2);

    // Sum of total amount
    const totalAmountSum = items.reduce((sum, item) => sum + item.totalAmount, 0);
    ctx.textAlign = 'right';
    ctx.fillText(formatVND(totalAmountSum), 1085, tRowY + (totalRowHeight - 14) / 2);

    currentY += totalRowHeight;

    // Page overflow check for totals and Clause 2
    if (currentY + 280 > 1500) {
      const newPage = createNewPage();
      canvas = newPage.canvas;
      ctx = newPage.ctx;
      currentY = 100;
    }

    // Total text
    currentY += 15;
    ctx.textAlign = 'left';
    ctx.font = cFont('bold', 14);
    const totalContractAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    ctx.fillText(`Tổng Cộng: ${formatVND(totalContractAmount)}`, 100, currentY);
    currentY += 22;
    ctx.fillText(`Tổng giá trị hợp đồng thanh toán thực tế: ${formatVND(totalContractAmount)}`, 100, currentY);
    currentY += 22;

    if (depositAmount > 0) {
      ctx.font = cFont('bold', 14);
      ctx.fillStyle = '#b45309';
      ctx.fillText(`Số tiền Bên A đã đặt cọc trước: ${formatVND(depositAmount)}`, 100, currentY);
      ctx.fillStyle = '#000000';
      currentY += 22;
    }
    currentY += 15;

    // 8. Clause 2
    ctx.font = cFont('bold', 14);
    ctx.fillText('ĐIỀU 2: PHƯƠNG THỨC GIAO NHẬN VÀ THANH TOÁN', 100, currentY);
    currentY += 25;

    ctx.font = cFont('normal', 14);
    const paymentText = isInput
      ? `- Phương thức thanh toán: Bên A chuyển khoản vào số tài khoản của Bên B: ${sellerBankAccount || '....................'} ngân hàng ${sellerBankName || '....................'}.`
      : `- Phương thức thanh toán: Bên A chuyển khoản vào số tài khoản của Bên B: ${store.bankAccount || '....................'} ngân hàng ${store.bankName || '....................'}.`;
    ctx.fillText(paymentText, 110, currentY);
    currentY += 22;

    const deliveryText = isInput
      ? '- Phương thức giao hàng: Bên B giao hàng đầy đủ cho Bên A đảm bảo đúng chất lượng yêu cầu.'
      : '- Phương thức giao hàng: Bên B (Cửa hàng) giao hàng đầy đủ cho Bên A đảm bảo đúng chất lượng yêu cầu.';
    ctx.fillText(deliveryText, 110, currentY);
    currentY += 22;

    if (depositAmount > 0) {
      ctx.fillText(`- Số tiền đặt cọc: Bên A đặt cọc trước cho Bên B số tiền là ${formatVND(depositAmount)}.`, 110, currentY);
      currentY += 22;
      ctx.fillText(`- Số tiền còn lại của hợp đồng: ${formatVND(Math.max(0, totalContractAmount - depositAmount))}.`, 110, currentY);
      currentY += 22;
    }

    const remainingText = depositAmount > 0 ? ` (${formatVND(Math.max(0, totalContractAmount - depositAmount))})` : '';
    const dueDaysText = isInput
      ? `- Hai bên đã Giao-Nhận đầy đủ hàng hóa nêu trên và Bên mua hẹn thanh toán giá trị còn lại của Hợp đồng${remainingText} trong vòng 05 ngày làm việc tiếp theo.`
      : `- Hai bên đã Giao-Nhận đầy đủ hàng hóa nêu trên và Bên A hẹn thanh toán giá trị còn lại của Hợp đồng${remainingText} cho Bên B trong vòng 05 ngày làm việc tiếp theo.`;
    
    if (dueDaysText.length > 85) {
      ctx.fillText(dueDaysText.substring(0, 85), 110, currentY);
      currentY += 22;
      ctx.fillText(dueDaysText.substring(85), 110, currentY);
    } else {
      ctx.fillText(dueDaysText, 110, currentY);
    }
    currentY += 22;

    ctx.fillText(`- Ghi chú bổ sung: ${notes || 'Không có.'}`, 110, currentY);
    currentY += 35;

    // Page overflow check for Clause 3
    if (currentY + 160 > 1500) {
      const newPage = createNewPage();
      canvas = newPage.canvas;
      ctx = newPage.ctx;
      currentY = 100;
    }

    // 9. Clause 3
    ctx.font = cFont('bold', 14);
    ctx.fillText('ĐIỀU 3: HIỆU LỰC HỢP ĐỒNG', 100, currentY);
    currentY += 25;

    ctx.font = cFont('normal', 14);
    const clause3Text = 'Hợp đồng có hiệu lực kể từ ngày ký. Hai bên cam kết thực hiện đầy đủ các điều khoản đã cam kết trên tinh thần hợp tác thiện chí. Bản hợp đồng này được lập thành hai (02) bản có giá trị pháp lý tương đương nhau, mỗi bên giữ một bản để theo dõi thực hiện.';
    ctx.fillText(clause3Text.substring(0, 85), 110, currentY);
    currentY += 22;
    ctx.fillText(clause3Text.substring(85, 170), 110, currentY);
    currentY += 22;
    ctx.fillText(clause3Text.substring(170), 110, currentY);
    currentY += 45;

    // Page overflow check for Signatures
    if (currentY + 180 > 1500) {
      const newPage = createNewPage();
      canvas = newPage.canvas;
      ctx = newPage.ctx;
      currentY = 100;
    }

    // 10. Signatures
    drawHorizontalLine(100, 1100, currentY, '#e2e8f0', 1);
    currentY += 25;

    ctx.textAlign = 'center';
    
    // Left side: Buyer A (Always Buyer)
    ctx.font = cFont('bold', 14);
    ctx.fillText('ĐẠI DIỆN BÊN MUA (BÊN A)', 350, currentY);
    ctx.font = cFont('italic', 12);
    ctx.fillText('(Ký, ghi rõ họ tên và đóng dấu)', 350, currentY + 20);

    ctx.fillStyle = '#000000';
    ctx.font = cFont('normal', 14);
    ctx.fillText(`Họ và tên: ${buyerSignName}`, 350, currentY + 130);

    // Right side: Seller B (Always Seller)
    ctx.font = cFont('bold', 14);
    ctx.fillText('ĐẠI DIỆN BÊN BÁN (BÊN B)', 850, currentY);
    ctx.font = cFont('italic', 12);
    ctx.fillText('(Ký, ghi rõ họ tên)', 850, currentY + 20);

    ctx.fillText(`Họ và tên: ${sellerSignName}`, 850, currentY + 130);

    // 11. Draw footer page numbers on all pages
    pages.forEach((page, index) => {
      page.ctx.fillStyle = '#64748b';
      page.ctx.font = cFont('italic', 12);
      page.ctx.textAlign = 'center';
      page.ctx.fillText(`Trang ${index + 1}/${pages.length}`, 600, 1630);
    });

    return pages.map(p => p.canvas);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('Font loading check warning:', e);
        }
      }
      const pageCanvases = drawContractToCanvasPages();
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      pageCanvases.forEach((canvasPage, index) => {
        const imgData = canvasPage.toDataURL('image/jpeg', 0.95);
        if (index > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      });
      
      const cleanStoreName = store.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      const cleanSellerName = (sellerName || 'chua-co-ten')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

      pdf.save(`hopdong.${cleanStoreName}.${cleanSellerName}.${totalAmount}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất file PDF hợp đồng:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const drawUynhiemchiToCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1697;
    const ctx = canvas.getContext('2d')!;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1697);

    // Set colors & line styles
    ctx.strokeStyle = '#1f2937'; // Dark charcoal line
    ctx.lineWidth = 2;

    // Outer margin box (landscape rectangle on A4 portrait canvas)
    const x0 = 60;
    const y0 = 80;
    const w = 1080;
    const h = 860; // Reduced to 860 (about 5 blank lines) for better spacing and printing structure
    ctx.strokeRect(x0, y0, w, h);

    // Main column division vertical line (at x = 540, from y = 200 to y = 675)
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(540, 200);
    ctx.lineTo(540, 675);
    ctx.stroke();

    // Horizontal separator under header (at y = 200)
    ctx.beginPath();
    ctx.moveTo(x0, 200);
    ctx.lineTo(x0 + w, 200);
    ctx.stroke();

    // Horizontal separator above bank use (at y = 675)
    ctx.beginPath();
    ctx.moveTo(x0, 675);
    ctx.lineTo(x0 + w, 675);
    ctx.stroke();

    // ----------------- HEADER LEFT COLUMN: LOGO VIETCOMBANK & THÔNG TIN NGÂN HÀNG -----------------
    // 1. Thêm logo Vietcombank vào phía bên trái trên cùng
    drawVietcombankHeaderLogo(ctx, 75, 105, 145, 55);

    // Helper rút gọn chữ nếu quá dài so với giới hạn cột trái
    const drawFittedText = (text: string, x: number, y: number, maxW: number) => {
      if (ctx.measureText(text).width <= maxW) {
        ctx.fillText(text, x, y);
      } else {
        let t = text;
        while (t.length > 3 && ctx.measureText(t + '...').width > maxW) {
          t = t.slice(0, -1);
        }
        ctx.fillText(t + '...', x, y);
      }
    };

    const savedBranch = localStorage.getItem('unc_branch') || 'CN Huế';
    const savedBankAddr = localStorage.getItem('unc_bank_address') || '78 Hùng Vương, Phường Thuận Hoá, Thành phố Huế';
    const savedVatCode = localStorage.getItem('unc_vat_code') || '0100112437015';

    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';

    // Dòng 1: Ngân hàng TMCP Ngoại Thương VN
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    drawFittedText('Ngân hàng TMCP Ngoại Thương VN', 232, 118, 298);

    // Dòng 2: Chi nhánh
    const branchClean = savedBranch.trim();
    const branchText = branchClean.toLowerCase().startsWith('cn') || branchClean.toLowerCase().startsWith('chi nhánh')
      ? branchClean
      : `CN ${branchClean}`;
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    drawFittedText(branchText, 232, 137, 298);

    // Dòng 3: Địa chỉ
    ctx.font = '11px "Times New Roman", Times, serif';
    drawFittedText(`ĐC: ${savedBankAddr.trim()}`, 232, 155, 298);

    // Dòng 4: Mã VAT
    drawFittedText(`Mã VAT: ${savedVatCode.trim()}`, 232, 173, 298);

    // ----------------- HEADER RIGHT COLUMN (Document Title) -----------------
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Times New Roman", Times, serif';
    ctx.fillText('CHỨNG TỪ GIAO DỊCH', 840, 115);

    ctx.font = 'bold 21px "Times New Roman", Times, serif';
    ctx.fillText('ỦY NHIỆM CHI - PAYMENT ORDER', 840, 143);

    const currentYear = new Date().getFullYear();
    const formattedDate = signingDate.split('-').reverse().join('/');
    ctx.font = 'italic 14px "Times New Roman", Times, serif';
    ctx.fillText(`Ngày (Date): ...../...../${currentYear}`, 840, 170);

    // ----------------- LEFT COLUMN: DEBIT & CREDIT ACCOUNTS -----------------
    ctx.textAlign = 'left';

    // Helper function to render a labeled form field with box borders
    const drawFormRow = (
      labelText: string,
      valueText: string,
      yStart: number,
      yEnd: number,
      xStart = 75,
      xEnd = 525,
      isBoldValue = false,
      isRedValue = false
    ) => {
      // Cell outline
      ctx.strokeStyle = '#9ca3af'; // Crisp light gray cell outline
      ctx.lineWidth = 1;
      ctx.strokeRect(xStart, yStart, xEnd - xStart, yEnd - yStart);

      // Label text
      ctx.fillStyle = '#4b5563'; // Slightly lighter gray for elegant label
      ctx.font = 'bold 11px "Times New Roman", Times, serif';
      ctx.fillText(labelText, xStart + 8, yStart + 13);

      // Value text - Centered both horizontally and vertically
      if (valueText) {
        ctx.fillStyle = isRedValue ? '#ef4444' : '#111827';
        ctx.font = isBoldValue ? 'bold 14px "Times New Roman", Times, serif' : '14px "Times New Roman", Times, serif';
        ctx.textAlign = 'center';
        ctx.fillText(valueText, (xStart + xEnd) / 2, yStart + 28);
        ctx.textAlign = 'left'; // Reset to default left alignment
      }
    };

    // A. DEBIT BLOCK (y = 200 to y = 415)
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('ĐỀ NGHỊ GHI NỢ TÀI KHOẢN (Please Debit account):', 75, 222);

    const storeAddr = store.address || 'Chưa cập nhật địa chỉ';
    const storeAddrShort = storeAddr.length > 50 ? storeAddr.substring(0, 50) + '...' : storeAddr;
    const rawSAddr = sellerAddress || '......................................................................';
    const sAddrShort = rawSAddr.length > 50 ? rawSAddr.substring(0, 50) + '...' : rawSAddr;

    // Helper to ensure authentic Vietnamese name formatting
    const getValidVietnameseName = (raw?: string, fallback = 'NGUYỄN VĂN AN') => {
      if (!raw || !raw.trim()) return fallback;
      const lower = raw.trim().toLowerCase();
      if (lower === 'chủ cửa hàng' || lower === 'store owner' || lower === 'chưa có tên' || lower === 'khách hàng') {
        return fallback;
      }
      return raw.trim().toUpperCase();
    };

    // Row heights = 38px
    if (isInput) {
      // Input contract: Store pays Supplier (Số tài khoản đề nghị ghi nợ luôn luôn để trống)
      const debitName = getValidVietnameseName(store.representativeName || store.bankOwner || effectiveBuyerName, 'NGUYỄN VĂN AN');
      drawFormRow('SỐ TK (A/C No):', '', 235, 273, 75, 525, true);
      drawFormRow('TÊN TK (A/C name):', debitName, 273, 311, 75, 525, true);
      drawFormRow('ĐỊA CHỈ (Address):', storeAddrShort, 311, 349);
      drawFormRow('TẠI NH (With Bank):', 'VIETCOMBANK', 349, 387, 75, 525, true);
    } else {
      // Output contract: Customer (Buyer) pays Store (Seller)
      const debitName = getValidVietnameseName(sellerName, 'NGUYỄN VĂN AN');
      drawFormRow('SỐ TK (A/C No):', sellerBankAccount || '0041000889988', 235, 273, 75, 525, true);
      drawFormRow('TÊN TK (A/C name):', debitName, 273, 311, 75, 525, true);
      drawFormRow('ĐỊA CHỈ (Address):', sAddrShort, 311, 349);
      drawFormRow('TẠI NH (With Bank):', 'VIETCOMBANK', 349, 387, 75, 525, true);
    }

    // B. CREDIT BLOCK (y = 415 to y = 625)
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('& GHI CÓ TÀI KHOẢN (& Credit account):', 75, 432);

    if (isInput) {
      // Input contract: Credit Supplier
      drawFormRow('SỐ TK (A/C No):', sellerBankAccount || '...........................................', 445, 483, 75, 525, true);
      drawFormRow('TÊN TK (A/C name):', (sellerName || '...........................................').toUpperCase(), 483, 521, 75, 525, true);
      drawFormRow('ĐỊA CHỈ (Address):', sAddrShort, 521, 559);
      drawFormRow('TẠI NH (With Bank):', (sellerBankName || '...........................................').toUpperCase(), 559, 597, 75, 525, true);
    } else {
      // Output contract: Credit Store
      drawFormRow('SỐ TK (A/C No):', store.bankAccount || '...........................................', 445, 483, 75, 525, true);
      drawFormRow('TÊN TK (A/C name):', (store.bankOwner || effectiveBuyerName).toUpperCase(), 483, 521, 75, 525, true);
      drawFormRow('ĐỊA CHỈ (Address):', storeAddrShort, 521, 559);
      drawFormRow('TẠI NH (With Bank):', (store.bankName || 'Vietcombank').toUpperCase(), 559, 597, 75, 525, true);
    }


    // ----------------- RIGHT COLUMN: AMOUNT, CHARGES & OTHER DETAILS -----------------
    // Column split at x = 540
    // Amount labels (left side) and Charges (right side)
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('SỐ TIỀN (With amount):', 555, 222);

    ctx.textAlign = 'right';
    ctx.fillText('PHÍ NH (Bank charges)', 1125, 222);
    ctx.textAlign = 'left';

    // Amount Area: x = 555 to x = 985 (width = 430)
    // Box 1: BẢNG SỐ (In figures) - divided for currency code
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(555, 235, 430, 50);

    // Draw vertical split inside BẢNG SỐ box for currency symbol (at x = 915)
    ctx.beginPath();
    ctx.moveTo(915, 235);
    ctx.lineTo(915, 285);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('BẢNG SỐ (In figures):', 563, 252);

    // Figure Value - Drawn in bold crimson red exactly as shown in the upload!
    const totalContractAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const remainingAmount = Math.max(0, totalContractAmount - depositAmount);
    ctx.fillStyle = '#ef4444'; // Red color
    ctx.font = 'bold 18px "Times New Roman", Times, serif';
    ctx.fillText(formatNumberWithDots(remainingAmount), 700, 267);

    // Currency
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('VND', 935, 265);

    // Box 2: BẰNG CHỮ (In words)
    ctx.strokeStyle = '#9ca3af';
    ctx.strokeRect(555, 285, 430, 110);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('BẰNG CHỮ (In words):', 563, 305);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold italic 14px "Times New Roman", Times, serif';
    const words = convertNumberToVietnameseWords(remainingAmount);
    if (words.length > 42) {
      ctx.fillText(words.substring(0, 42), 563, 335);
      ctx.fillText(words.substring(42), 563, 355);
    } else {
      ctx.fillText(words, 563, 335);
    }

    // Charges Area on the right: x = 985 to x = 1125 (width = 140)
    ctx.strokeStyle = '#9ca3af';
    ctx.strokeRect(985, 235, 140, 160);

    // Split horizontally inside Charges box
    ctx.beginPath();
    ctx.moveTo(985, 315);
    ctx.lineTo(1125, 315);
    ctx.stroke();

    // Phí trong / Including (top box)
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('Phí trong', 995, 262);
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText('Including', 995, 275);

    // Checkbox Phí trong (Checked by default)
    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(1085, 255, 15, 15);
    ctx.strokeStyle = '#007d3a'; // Green tick
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1087, 262);
    ctx.lineTo(1091, 266);
    ctx.lineTo(1097, 258);
    ctx.stroke();

    // Restore line styles
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;

    // Phí ngoài / Excluding (bottom box)
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('Phí ngoài', 995, 342);
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText('Excluding', 995, 355);

    // Checkbox Phí ngoài (Unchecked)
    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(1085, 335, 15, 15);

    // ----------------- DETAILS OF PAYMENT (NỘI DUNG) -----------------
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('NỘI DUNG (Details of Payment):', 555, 425);

    // Multi-line dotted text representing payment explanation
    ctx.font = '14px "Times New Roman", Times, serif';
    ctx.fillText(`Thanh toán tiền hàng còn thiếu theo Hợp đồng mua bán`, 555, 455);
    ctx.fillText(`số ${contract?.contractNumber || 'HDMB-' + signingDate.replace(/-/g, '')} ký ngày ${formattedDate}`, 555, 485);
    ctx.fillText(`.............................................................................................................................................`, 555, 515);

    // Signature Area Divider (x = 555 to x = 1125 at y = 535)
    ctx.strokeStyle = '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(555, 535);
    ctx.lineTo(1125, 535);
    ctx.stroke();

    // Center vertical separator for signatures (from y = 535 to y = 675 at x = 840)
    ctx.beginPath();
    ctx.moveTo(840, 535);
    ctx.lineTo(840, 675);
    ctx.stroke();

    // Signatures
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('KẾ TOÁN TRƯỞNG KÝ', 697, 558);
    ctx.font = 'italic 12px "Times New Roman", Times, serif';
    ctx.fillText('Chief Accountant', 697, 574);

    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('CHỦ TÀI KHOẢN KÝ VÀ ĐÓNG DẤU', 982, 558);
    ctx.font = 'italic 12px "Times New Roman", Times, serif';
    ctx.fillText('Acc. Holder & Stamp', 982, 574);

    // ----------------- BOTTOM SECTION: FOR BANK USE ONLY -----------------
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px "Times New Roman", Times, serif';
    ctx.fillText("DÀNH CHO NGÂN HÀNG (for Bank's Use only)", 75, 698);

    // Bank signatures arranged horizontally near the bottom as requested (no vertical line partition)
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Times New Roman", Times, serif';
    ctx.fillText('Thanh toán viên', 650, 730);
    ctx.font = 'italic 13px "Times New Roman", Times, serif';
    ctx.fillText('(Teller)', 650, 747);

    ctx.font = 'bold 14px "Times New Roman", Times, serif';
    ctx.fillText('Kiểm soát', 860, 730);
    ctx.font = 'italic 13px "Times New Roman", Times, serif';
    ctx.fillText('(Supervisor)', 860, 747);

    ctx.font = 'bold 14px "Times New Roman", Times, serif';
    ctx.fillText('Giám đốc', 1050, 730);
    ctx.font = 'italic 13px "Times New Roman", Times, serif';
    ctx.fillText('(Manager)', 1050, 747);

    return canvas;
  };

  const handleDownloadUynhiemchiPdf = async () => {
    setIsGeneratingUynhiemchiPdf(true);
    try {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('Font loading check warning:', e);
        }
      }
      const canvasPage = drawUynhiemchiToCanvas();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvasPage.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      
      const totalContractAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
      const remainingAmount = Math.max(0, totalContractAmount - depositAmount);
      
      const cleanStoreName = store.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      const cleanSellerName = (sellerName || 'chua-co-ten')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
        
      pdf.save(`UNC.${cleanStoreName}.${cleanSellerName}.${remainingAmount}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất file PDF Ủy nhiệm chi:', err);
    } finally {
      setIsGeneratingUynhiemchiPdf(false);
    }
  };

  const drawDatcocToCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1697;
    const ctx = canvas.getContext('2d')!;

    const contractNo = contract?.contractNumber || `HDMB-${signingDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1697);

    // Set colors & line styles
    ctx.strokeStyle = '#1f2937'; // Dark charcoal line
    ctx.lineWidth = 2;

    // Outer margin box
    const x0 = 80;
    const y0 = 100;
    const w = 1040;
    const h = 1497;
    ctx.strokeRect(x0, y0, w, h);

    // Inner border
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 10, y0 + 10, w - 20, h - 20);

    // ----------------- HEADER SECTION -----------------
    // Store/Buyer Header on Left
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Times New Roman", Times, serif';
    ctx.fillText(`ĐƠN VỊ: ${store.name.toUpperCase()}`, x0 + 30, y0 + 45);
    ctx.font = '11px "Times New Roman", Times, serif';
    ctx.fillText(`ĐC: ${store.address || 'Chưa cập nhật địa chỉ'}`, x0 + 30, y0 + 68);
    ctx.fillText('SĐT: ......................', x0 + 30, y0 + 88);

    // Receipt details on Right
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px "Times New Roman", Times, serif';
    ctx.fillText('Mẫu số: 01-TT (Ban hành theo TT 200/2014/TT-BTC)', x0 + w - 30, y0 + 45);
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText('Số liên: Liên 2 (Giao cho người nộp tiền)', x0 + w - 30, y0 + 65);
    ctx.fillText(`Số phiếu: BDTC-${signingDate.replace(/-/g, '')}`, x0 + w - 30, y0 + 85);
    ctx.font = 'bold 11px "Times New Roman", Times, serif';
    ctx.fillText(`Số Hợp Đồng: ${contractNo}`, x0 + w - 30, y0 + 105);

    // ----------------- MAIN TITLE -----------------
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 24px "Times New Roman", Times, serif';
    ctx.fillText('HÓA ĐƠN ĐẶT CỌC & BIÊN NHẬN', x0 + w / 2, y0 + 150);
    ctx.font = 'bold 18px "Times New Roman", Times, serif';
    ctx.fillText('(DEPOSIT INVOICE & RECEIPT VOUCHER)', x0 + w / 2, y0 + 180);

    const formattedDate = signingDate.split('-').reverse().join('/');
    ctx.font = 'italic 12px "Times New Roman", Times, serif';
    ctx.fillText(`Ngày ký kết: ngày ${formattedDate.split('/')[0]} tháng ${formattedDate.split('/')[1]} năm ${formattedDate.split('/')[2]}`, x0 + w / 2, y0 + 210);

    // ----------------- CLIENT & SUPPLIER DETAILS -----------------
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillStyle = '#0f766e'; // Teal color block
    ctx.fillText('I. THÔNG TIN CÁC BÊN GIAO DỊCH (TRANSACTION PARTIES)', x0 + 30, y0 + 260);

    ctx.fillStyle = '#1f2937';
    ctx.font = '12px "Times New Roman", Times, serif';
    let currentY = y0 + 290;

    // 1. Bên mua (Bên đặt cọc)
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('1. BÊN MUA (Bên đặt cọc - Buyer/Payer):', x0 + 30, currentY);
    ctx.font = '12px "Times New Roman", Times, serif';
    if (isInput) {
      ctx.fillText(`   - Đại diện đơn vị: ${effectiveBuyerName.toUpperCase()} - CỬA HÀNG ${store.name.toUpperCase()}`, x0 + 30, currentY + 22);
      ctx.fillText(`   - Địa chỉ: ${store.address || 'Chưa cập nhật địa chỉ'}`, x0 + 30, currentY + 44);
      ctx.fillText(`   - Tài khoản thanh toán: ${store.bankAccount || '......................'} tại ${store.bankName || '......................'}`, x0 + 30, currentY + 66);
    } else {
      ctx.fillText(`   - Tên cá nhân/Khách hàng: ${(sellerName || '...........................................').toUpperCase()}`, x0 + 30, currentY + 22);
      ctx.fillText(`   - Số CCCD/CMND: ${sellerCitizenId || '...........................................'}`, x0 + 30, currentY + 44);
      ctx.fillText(`   - Địa chỉ liên hệ: ${sellerAddress || '...........................................'}`, x0 + 30, currentY + 66);
    }

    currentY += 100;

    // 2. Bên bán (Bên nhận đặt cọc)
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('2. BÊN BÁN (Bên nhận đặt cọc - Seller/Recipient):', x0 + 30, currentY);
    ctx.font = '12px "Times New Roman", Times, serif';
    if (isInput) {
      ctx.fillText(`   - Tên đơn vị/Cá nhân: ${(sellerName || '...........................................').toUpperCase()}`, x0 + 30, currentY + 22);
      ctx.fillText(`   - Số CCCD/CMND: ${sellerCitizenId || '...........................................'}`, x0 + 30, currentY + 44);
      ctx.fillText(`   - Địa chỉ liên hệ: ${sellerAddress || '...........................................'}`, x0 + 30, currentY + 66);
      ctx.fillText(`   - Tài khoản thụ hưởng: ${sellerBankAccount || '......................'} tại ${sellerBankName || '......................'}`, x0 + 30, currentY + 88);
    } else {
      ctx.fillText(`   - Tên đơn vị: CỬA HÀNG ${store.name.toUpperCase()} (Đại diện: ${effectiveBuyerName.toUpperCase()})`, x0 + 30, currentY + 22);
      ctx.fillText(`   - Địa chỉ: ${store.address || 'Chưa cập nhật địa chỉ'}`, x0 + 30, currentY + 44);
      ctx.fillText(`   - Tài khoản thụ hưởng: ${store.bankAccount || '......................'} tại ${store.bankName || '......................'}`, x0 + 30, currentY + 66);
    }

    currentY += 125;

    // ----------------- DEPOSIT DETAILS -----------------
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillStyle = '#0f766e';
    ctx.fillText('II. CHI TIẾT ĐẶT CỌC (DEPOSIT DETAILS)', x0 + 30, currentY);

    currentY += 25;

    const tableX = x0 + 30;
    const tableW = w - 60; // 980

    // Draw clean deposit details box
    const infoBoxY = currentY;
    const infoBoxH = 160;
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, infoBoxY, tableW, infoBoxH);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    
    // Row 1: Lý do nộp / Nội dung
    ctx.fillText('- Nội dung đặt cọc:', tableX + 25, infoBoxY + 35);
    ctx.font = '12px "Times New Roman", Times, serif';
    ctx.fillText(`Tạm ứng đặt cọc đảm bảo thực hiện giao dịch Hợp đồng mua bán nhập hàng`, tableX + 220, infoBoxY + 35);

    // Row 2: Số Hợp Đồng
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('- Số Hợp Đồng liên kết:', tableX + 25, infoBoxY + 70);
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(`${contractNo}`, tableX + 220, infoBoxY + 70);

    // Row 3: Ngày ký hợp đồng
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('- Ngày ký hợp đồng:', tableX + 25, infoBoxY + 105);
    ctx.font = '12px "Times New Roman", Times, serif';
    ctx.fillText(`${signingDate.split('-').reverse().join('/')}`, tableX + 220, infoBoxY + 105);

    // Row 4: Phương thức giao dịch
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('- Phương thức nhận tiền:', tableX + 25, infoBoxY + 138);
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText(`Tiền mặt`, tableX + 220, infoBoxY + 138);

    currentY += infoBoxH + 30;

    // ----------------- TOTALS & RECEIPT SPECIFICATION -----------------
    // Draw Box for totals
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tableX, currentY, tableW, 150);

    const totalContractAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const receiptValue = depositAmount > 0 ? depositAmount : totalContractAmount;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText(`1. Tổng giá trị đơn hàng (Total Contract Value):`, tableX + 20, currentY + 30);
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText(`${formatNumberWithDots(totalContractAmount)} VND`, tableX + tableW - 220, currentY + 30);

    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText(`2. Số tiền đặt cọc ĐÃ NHẬN ĐỦ (Deposit Amount Received In Full):`, tableX + 20, currentY + 65);
    ctx.fillStyle = '#dc2626'; // Vibrant Red for deposit received in full!
    ctx.font = 'bold 15px "Times New Roman", Times, serif';
    ctx.fillText(`${formatNumberWithDots(receiptValue)} VND`, tableX + tableW - 220, currentY + 65);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText(`3. Số tiền còn lại của hợp đồng (Remaining Balance Due):`, tableX + 20, currentY + 100);
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    const finalRemaining = Math.max(0, totalContractAmount - receiptValue);
    ctx.fillText(`${formatNumberWithDots(finalRemaining)} VND`, tableX + tableW - 220, currentY + 100);

    // Draw divider inside Box
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tableX + 15, currentY + 115);
    ctx.lineTo(tableX + tableW - 15, currentY + 115);
    ctx.stroke();

    // Bằng chữ (In words)
    ctx.fillStyle = '#374151';
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText(`Bằng chữ (In words): ${convertNumberToVietnameseWords(receiptValue)}`, tableX + 20, currentY + 134);

    currentY += 185;

    // ----------------- COMMITMENT & DECLARATION -----------------
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold italic 11px "Times New Roman", Times, serif';
    ctx.fillText('Lưu ý / Ghi chú (Notes):', tableX, currentY);
    ctx.font = 'italic 10.5px "Times New Roman", Times, serif';
    ctx.fillText('- Bên Bán (Người nhận đặt cọc) xác nhận đã nhận đủ số tiền đặt cọc nêu trên qua tài khoản ngân hàng hoặc tiền mặt.', tableX, currentY + 20);
    ctx.fillText('- Chứng từ này là một phần không thể tách rời của Hợp đồng mua bán nhập hàng đã ký kết giữa hai bên.', tableX, currentY + 36);

    currentY += 80;

    // ----------------- SIGNATURES SECTION -----------------
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('ĐẠI DIỆN BÊN MUA (Bên đặt cọc)', tableX + 220, currentY);
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText('(Buyer / Payer Sign)', tableX + 220, currentY + 18);
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText(buyerSignName.toUpperCase(), tableX + 220, currentY + 130);

    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('ĐẠI DIỆN BÊN BÁN (Bên nhận cọc & Lập phiếu)', tableX + tableW - 220, currentY);
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText('(Seller / Recipient Sign)', tableX + tableW - 220, currentY + 18);
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText(sellerSignName.toUpperCase(), tableX + tableW - 220, currentY + 130);

    return canvas;
  };

  const handleDownloadDatcocPdf = async () => {
    setIsGeneratingDatcocPdf(true);
    try {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('Font loading check warning:', e);
        }
      }
      const canvasPage = drawDatcocToCanvas();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvasPage.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      
      const receiptValue = depositAmount > 0 ? depositAmount : items.reduce((sum, item) => sum + item.totalAmount, 0);

      const cleanStoreName = store.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      const cleanSellerName = (sellerName || 'chua-co-ten')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
        
      pdf.save(`hoadondatcoc_${cleanStoreName}...${cleanSellerName}.${receiptValue}.pdf`);
    } catch (err) {
      console.error('Lỗi xuất file PDF Hóa đơn đặt cọc:', err);
    } finally {
      setIsGeneratingDatcocPdf(false);
    }
  };



  const renderStoreBlock = (isBênA: boolean) => (
    <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
        <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider">
          {isBênA ? 'BÊN MUA (BÊN A) — THÔNG TIN CỬA HÀNG' : 'BÊN BÁN (BÊN B) — THÔNG TIN CỬA HÀNG'}
        </h4>
        <span className="text-[10px] text-zinc-500 italic">Tự động điền</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
        <div>
          <label className="text-zinc-500 font-semibold block mb-1">Tên đơn vị:</label>
          <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-bold text-sm sm:text-xs">
            {store.name}
          </div>
        </div>
        <div>
          <label className="text-zinc-500 font-semibold block mb-1">Người đại diện:</label>
          <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-bold flex justify-between items-center text-sm sm:text-xs">
            <span>{effectiveBuyerName}</span>
            {store.citizenId && (
              <span className="text-[9px] sm:text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md font-mono border border-sky-500/20">CCCD: {store.citizenId}</span>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-zinc-500 font-semibold block mb-1">Địa chỉ cửa hàng:</label>
          <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-sm sm:text-xs">
            {store.address || 'Chưa cấu hình địa chỉ'}
          </div>
        </div>
        {store.bankAccount && (
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="text-zinc-500 font-semibold block mb-1">Tài khoản thanh toán:</label>
              <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-mono font-bold text-sm sm:text-xs">
                {store.bankAccount}
              </div>
            </div>
            <div>
              <label className="text-zinc-500 font-semibold block mb-1">Ngân hàng:</label>
              <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-bold text-sm sm:text-xs">
                {store.bankName}
              </div>
            </div>
            <div>
              <label className="text-zinc-500 font-semibold block mb-1">Chủ tài khoản:</label>
              <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 uppercase font-bold text-sm sm:text-xs">
                {store.bankOwner}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPartnerBlock = (isBênA: boolean) => (
    <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="border-b border-zinc-850 pb-2.5 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
          {isBênA ? 'BÊN MUA (BÊN A) — THÔNG TIN ĐỐI TÁC KHÁCH HÀNG' : 'BÊN BÁN (BÊN B) — THÔNG TIN ĐỐI TÁC CUNG CẤP'}
        </h4>
        {isBênA && (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full font-bold border border-emerald-500/20 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
            Tự động chọn theo dữ liệu khách hàng tỉnh thành
          </span>
        )}
      </div>

      {/* Provincial Customer Auto-Selector for Output Contracts (Bên Mua) */}
      {isBênA && (
        <div className="bg-zinc-900/70 border border-emerald-500/20 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-200 block">
                  Tỉnh/Thành phố khách hàng:
                </span>
                <span className="text-[10px] text-zinc-400">
                  Dữ liệu tự động đồng bộ họ tên, CCCD theo mã tỉnh, địa chỉ & tài khoản ngân hàng
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => {
                const cust = getRandomCustomer(selectedCustomerProvince);
                applyCustomerProfile(cust);
              }}
              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
              title={`Đổi ngẫu nhiên khách hàng khác tại ${PROVINCES_DATA[selectedCustomerProvince]?.name || 'tỉnh này'}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi khách hàng ngẫu nhiên</span>
            </button>
          </div>

          {/* Quick Province Selector Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(PROVINCES_DATA).map(([pKey, pInfo]) => {
              const isActive = selectedCustomerProvince === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerProvince(pKey);
                    const cust = getRandomCustomer(pKey);
                    applyCustomerProfile(cust);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold shadow-sm shadow-emerald-500/10'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span>{pInfo.shortName}</span>
                  <span className={`text-[9px] font-mono px-1 rounded ${isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-zinc-850 text-zinc-500'}`}>
                    {pInfo.cccdPrefix}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pick Specific Customer Dropdown */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-[11px] text-zinc-300 font-semibold shrink-0 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Chọn nhanh hồ sơ mẫu ({PROVINCES_DATA[selectedCustomerProvince]?.name || 'Tỉnh'}):
            </span>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                const list = getCustomersByProvince(selectedCustomerProvince);
                const found = list.find(c => c.id === e.target.value);
                if (found) {
                  applyCustomerProfile(found);
                }
              }}
              className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            >
              <option value="">-- Chọn khách hàng cụ thể --</option>
              {getCustomersByProvince(selectedCustomerProvince).map((cust, idx) => (
                <option key={cust.id} value={cust.id}>
                  {idx + 1}. {cust.name} | CCCD: {cust.citizenId} | {cust.address}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="text-zinc-300 text-xs font-semibold block mb-1.5">
            {isBênA ? 'Họ và Tên người mua (Bên A)' : 'Họ và Tên đối tác (Bên B)'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Nguyễn Văn A"
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            className="w-full px-3.5 py-2.5 sm:py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm sm:text-xs font-semibold"
          />
        </div>
        <div>
          <label className="text-zinc-300 text-xs font-semibold block mb-1.5">
            Số căn cước công dân (CCCD 12 số) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="012345678912"
            value={sellerCitizenId}
            onChange={(e) => setSellerCitizenId(e.target.value)}
            className="w-full px-3.5 py-2.5 sm:py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm sm:text-xs font-mono font-bold"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-zinc-300 text-xs font-semibold block mb-1.5">
            {isBênA ? 'Địa chỉ thường trú người mua' : 'Địa chỉ thường trú đối tác'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Số 123 Đường ABC, Quận/Huyện, Tỉnh/Thành phố"
            value={sellerAddress}
            onChange={(e) => setSellerAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 sm:py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm sm:text-xs"
          />
        </div>
        {!isBênA && (
          <>
            <div>
              <label className="text-zinc-300 text-xs font-semibold block mb-1.5">
                Số tài khoản ngân hàng đối tác <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="99999999999"
                value={sellerBankAccount}
                onChange={(e) => setSellerBankAccount(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm sm:text-xs font-mono font-black"
              />
            </div>
            <div>
              <label className="text-zinc-300 text-xs font-semibold block mb-1.5">
                Tên ngân hàng & Chi nhánh đối tác <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Vietcombank - Chi nhánh Đà Nẵng"
                value={sellerBankName}
                onChange={(e) => setSellerBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 sm:py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm sm:text-xs font-semibold"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-black text-zinc-50 tracking-tight leading-snug">
                {contract ? 'CHI TIẾT HỢP ĐỒNG MUA BÁN KIÊM GIAO NHẬN HÀNG HÓA' : 'TẠO HỢP ĐỒNG MUA BÁN KIÊM GIAO NHẬN HÀNG HÓA'}
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-400">
                {isInput ? 'Nhập kho' : 'Bán hàng'} kiêm giao nhận với giá ưu đãi thấp hơn {discountPercent}% giá niêm yết bán lẻ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-zinc-950/60 px-4 sm:px-6 py-2 border-b border-zinc-850 gap-1.5">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'form'
                ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Thông tin Hợp đồng
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Xem trước & In ấn
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-zinc-900/30">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Contract Type Selection */}
              <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                  <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider">
                    LOẠI HỢP ĐỒNG MUA BÁN
                  </h4>
                  <span className="text-[10px] text-zinc-500 italic">Chọn chiều giao dịch</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectContractType('input')}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      contractType === 'input'
                        ? 'bg-sky-500/15 border-sky-500/50 text-sky-400 shadow-md shadow-sky-500/5'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Hợp đồng Đầu vào (Nhập hàng về kho)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectContractType('output')}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      contractType === 'output'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/5'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-850'
                    }`}
                  >
                    <Upload className="w-4 h-4 shrink-0" />
                    <span>Hợp đồng Đầu ra (Bán hàng cho khách)</span>
                  </button>
                </div>
              </div>
              
              {/* Contract General Metadata (Customizable Date) */}
              <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2.5">
                  <h4 className="text-xs font-black text-amber-500 uppercase tracking-wider">
                    THÔNG TIN CHUNG HỢP ĐỒNG
                  </h4>
                  <span className="text-[10px] text-zinc-500 italic">Chọn ngày ký hợp đồng</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div>
                    <label className="text-zinc-400 font-semibold block mb-1">Ngày ký hợp đồng <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={signingDate}
                      onChange={(e) => setSigningDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm sm:text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 font-semibold block mb-1">Số Hợp đồng (Tự động cập nhật):</label>
                    <div className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 text-sm sm:text-xs font-mono font-bold select-all">
                      {contract?.contractNumber || `HDMB-${signingDate.replace(/-/g, '')}-XXXX`}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Party A / B details dynamically ordered */}
              {contractType === 'input' ? (
                <>
                  {renderStoreBlock(true)}
                  {renderPartnerBlock(false)}
                </>
              ) : (
                <>
                  {renderPartnerBlock(true)}
                  {renderStoreBlock(false)}
                </>
              )}

              {/* Goods & Pricing (Calculates configurable discount & automated quantity fitting) */}
              <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4 sm:p-5 space-y-5">
                <div className="border-b border-zinc-850 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                      DANH SÁCH HÀNG HÓA & PHÂN BỔ GIÁ CẢ
                    </h4>
                    <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded-full border border-emerald-500/20 font-black">
                      GIẢM {discountPercent}% CHIẾT KHẤU SỈ
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 hidden sm:inline">Đồng bộ tự động</span>
                </div>

                {/* Configurable Discount Percentage Settings */}
                <div className="bg-zinc-900/80 border border-amber-500/20 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <label className="text-zinc-200 text-xs font-bold flex items-center gap-1.5 leading-normal">
                        <Percent className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Phần trăm giảm giá / Chiết khấu cho {isInput ? 'giá nhập' : 'giá bán'}:</span>
                      </label>
                      <p className="text-[10px] text-zinc-400">
                        Đơn giá hợp đồng = Giá niêm yết × (100% - {discountPercent}%)
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-[10px] text-zinc-400 font-semibold hidden md:inline">Chọn nhanh:</span>
                      <div className="flex gap-1">
                        {[0, 5, 7, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleDiscountPercentChange(pct)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                              discountPercent === pct
                                ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                                : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Tự nhập:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0"
                          value={discountInputStr}
                          onFocus={(e) => {
                            const target = e.currentTarget;
                            requestAnimationFrame(() => target.select());
                          }}
                          onChange={(e) => {
                            let raw = e.target.value;
                            if (raw.length > 1 && raw.startsWith('0') && !raw.startsWith('0.')) {
                              raw = raw.replace(/^0+/, '');
                            }
                            setDiscountInputStr(raw);
                            if (raw === '') {
                              handleDiscountPercentChange(0, false);
                            } else {
                              const val = parseFloat(raw);
                              if (!isNaN(val)) {
                                handleDiscountPercentChange(Math.max(0, Math.min(100, val)), false);
                              }
                            }
                          }}
                          onBlur={() => {
                            if (discountInputStr === '' || isNaN(parseFloat(discountInputStr))) {
                              setDiscountInputStr('');
                              handleDiscountPercentChange(0, true);
                            } else {
                              const val = Math.max(0, Math.min(100, parseFloat(discountInputStr)));
                              setDiscountInputStr(val === 0 ? '' : String(val));
                              handleDiscountPercentChange(val, true);
                            }
                          }}
                          className="w-12 bg-transparent text-amber-400 font-mono font-black text-xs text-right focus:outline-none"
                        />
                        <span className="text-zinc-400 text-xs font-bold">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automation input: set total amount and auto-distribute products */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-zinc-200 text-xs font-bold flex items-center gap-1.5 leading-normal">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                      Phân bổ tự động theo tổng tiền mong muốn:
                    </label>
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Rất nhanh & Tiết kiệm</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Select Industry for Goods Allocation */}
                    <div className="sm:col-span-12 space-y-1.5">
                      <span className="text-[10px] font-semibold text-zinc-400 block">Chọn ngành hàng để lấy mẫu sản phẩm phân bổ:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(INDUSTRIES).map(([key, ind]) => {
                          const isActive = selectedAllocationIndustry === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setSelectedAllocationIndustry(key);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 cursor-pointer active:scale-95 ${
                                isActive
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/45 font-bold'
                                  : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                              }`}
                            >
                              {ind.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Amount Input */}
                    <div className="sm:col-span-6 space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400 block">Tổng số tiền hợp đồng (VND)</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ví dụ: 10.000.000"
                        value={desiredTotalAmount === 0 ? '' : formatNumberWithDots(desiredTotalAmount)}
                        onFocus={(e) => {
                          const target = e.currentTarget;
                          requestAnimationFrame(() => target.select());
                        }}
                        onChange={(e) => {
                          const raw = parseNumberFromDots(e.target.value);
                          setDesiredTotalAmount(raw === '' ? 0 : parseInt(raw, 10));
                        }}
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all text-sm sm:text-xs font-mono font-bold"
                      />
                    </div>

                    {/* Number of Items Select */}
                    <div className="sm:col-span-3 space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400 block">Số lượng mặt hàng sỉ</span>
                      <select
                        value={allocationCount}
                        onChange={(e) => setAllocationCount(parseInt(e.target.value) || 3)}
                        className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/10 transition-all text-sm sm:text-xs font-semibold cursor-pointer"
                      >
                        {Array.from({ length: 50 }, (_, i) => i + 1).map((val) => (
                          <option key={val} value={val}>
                            {val} mặt hàng
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Submit Button */}
                    <div className="sm:col-span-3 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleDesiredTotalAmountChange(desiredTotalAmount, allocationCount)}
                        className="w-full h-[38px] px-4 bg-amber-500 hover:bg-amber-450 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-98"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Phân bổ tự động
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Hệ thống sẽ chọn ngẫu nhiên <strong>{allocationCount}</strong> mặt hàng trong ngành nghề <strong>{INDUSTRIES[selectedAllocationIndustry as IndustryType]?.name || 'Ngành nghề khác'}</strong> và quy đổi ra số lượng tương ứng sao cho tổng tiền hợp đồng khớp hoặc tiệm cận chính xác mục tiêu của bạn.
                  </p>
                </div>

                {/* Render List of contract items */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-300 font-bold uppercase tracking-wider">Danh sách mặt hàng cụ thể ({items.length})</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1 px-2.5 py-2 sm:py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 rounded-lg text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Thêm mặt hàng sỉ
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center p-8 bg-zinc-950/20 border border-dashed border-zinc-800 rounded-2xl">
                      <p className="text-xs text-zinc-500">Chưa có sản phẩm nào. Hãy bấm "Thêm mặt hàng sỉ" hoặc nhập tổng tiền để tự động phân bổ.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="bg-zinc-950/70 border border-zinc-850 rounded-xl p-4 space-y-3 relative overflow-hidden group">
                          {/* Item Card Header */}
                          <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                            <span className="text-[10px] text-zinc-400 font-black tracking-widest uppercase">Mặt hàng #{index + 1}</span>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(index)}
                                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer active:scale-95"
                                title="Xóa mặt hàng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Item Fields Row */}
                          <div className="grid grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 text-xs">
                            {/* Column 1: Name select and input */}
                            <div className="col-span-2 md:col-span-5 space-y-1.5">
                              <label className="text-[10px] text-zinc-400 font-bold block">Tên sản phẩm / Mặt hàng sỉ:</label>
                              <div className="flex flex-col gap-1.5">
                                <select
                                  value={industryProducts.some(p => p.name === item.itemName) ? item.itemName : ''}
                                  onChange={(e) => handleItemProductSelect(index, e.target.value)}
                                  className="w-full px-3 py-2.5 sm:py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 text-sm sm:text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                                >
                                  <option value="">-- Chọn sản phẩm sỉ mẫu hoặc tự nhập dưới --</option>
                                  {industryProducts.map((p, idx) => (
                                    <option key={idx} value={p.name}>
                                      {p.name} ({formatVND(p.defaultSellingPrice)})
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  required
                                  placeholder="Nhập thủ công..."
                                  value={item.itemName}
                                  onChange={(e) => handleUpdateItemName(index, e.target.value)}
                                  className="w-full px-3 py-2.5 sm:py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm sm:text-xs font-semibold"
                                />
                              </div>
                            </div>

                            {/* Column 2: Quantity */}
                            <div className="col-span-1 md:col-span-2 space-y-1.5">
                              <label className="text-[10px] text-zinc-400 font-bold block">Số lượng:</label>
                              <input
                                type="number"
                                required
                                min="1"
                                placeholder="1"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onFocus={(e) => {
                                  const target = e.currentTarget;
                                  requestAnimationFrame(() => target.select());
                                }}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (val.length > 1 && val.startsWith('0')) {
                                    val = val.replace(/^0+/, '');
                                  }
                                  handleUpdateItemQty(index, val === '' ? 0 : parseInt(val, 10));
                                }}
                                onBlur={() => {
                                  if (!item.quantity || item.quantity < 1) {
                                    handleUpdateItemQty(index, 1);
                                  }
                                }}
                                className="w-full px-3 py-2.5 sm:py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm sm:text-xs font-mono font-black"
                              />
                            </div>

                            {/* Column 3: Retail and Wholesale prices */}
                            <div className="col-span-1 md:col-span-3 space-y-1.5">
                              <label className="text-[10px] text-zinc-400 font-bold block">Giá bán lẻ niêm yết (VND):</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                required
                                placeholder="0"
                                value={item.sellingUnitPrice === 0 ? '' : formatNumberWithDots(item.sellingUnitPrice)}
                                onFocus={(e) => {
                                  const target = e.currentTarget;
                                  requestAnimationFrame(() => target.select());
                                }}
                                onChange={(e) => {
                                  const raw = parseNumberFromDots(e.target.value);
                                  handleUpdateItemPrice(index, raw === '' ? 0 : parseInt(raw, 10));
                                }}
                                className="w-full px-3 py-2.5 sm:py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm sm:text-xs font-mono"
                              />
                              <div className="text-[9px] text-emerald-400 flex items-center justify-between px-1 mt-0.5">
                                <span>Sỉ (-{discountPercent}%):</span>
                                <span className="font-bold">{formatVND(item.contractUnitPrice)}</span>
                              </div>
                            </div>

                            {/* Column 4: Item total */}
                            <div className="col-span-2 md:col-span-2 space-y-1.5 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] text-zinc-400 font-bold block">Thành tiền sỉ:</span>
                                <div className="px-3 py-2.5 sm:py-2 bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-zinc-200 font-mono font-bold text-right mt-1 text-sm sm:text-xs">
                                  {formatVND(item.totalAmount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final calculated total presentation */}
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/15 flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-3 mt-4">
                  <div className="space-y-1">
                    <span className="text-zinc-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      TỔNG TRỊ GIÁ THANH TOÁN THỰC TẾ TRÊN HỢP ĐỒNG:
                    </span>
                    <span className="text-[10px] text-zinc-500 block leading-normal">
                      Bằng tổng thành tiền thực tế của {items.length} mặt hàng {isInput ? 'nhập sỉ' : 'bán ra'} đã được chiết khấu {discountPercent}%.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {formatVND(items.reduce((sum, i) => sum + i.totalAmount, 0))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-300 text-xs font-semibold block mb-1.5">Số tiền đặt cọc (VND)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={depositAmount === 0 ? '' : formatNumberWithDots(depositAmount)}
                      onFocus={(e) => {
                        const target = e.currentTarget;
                        requestAnimationFrame(() => target.select());
                      }}
                      onChange={(e) => {
                        const raw = parseNumberFromDots(e.target.value);
                        setDepositAmount(raw === '' ? 0 : parseInt(raw, 10));
                      }}
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm sm:text-xs font-mono font-bold"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Để trống hoặc nhập 0 nếu không có đặt cọc.</p>
                  </div>
                  <div>
                    <label className="text-zinc-300 text-xs font-semibold block mb-1.5">Ghi chú điều khoản bổ sung</label>
                    <textarea
                      rows={2}
                      placeholder="Giao hàng tận nơi vào sáng thứ 2, thanh toán ngay sau khi bàn giao đủ chứng từ chất lượng..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm sm:text-xs resize-none"
                    />
                  </div>
                </div>

                {/* Font Selection for Export and Printing */}
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <Type className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                          Phông chữ văn bản & xuất file PDF
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                            {CONTRACT_FONTS.length} phông chữ
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          {currentFont.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedFontId}
                        onChange={(e) => handleSelectFont(e.target.value)}
                        className="w-full sm:w-auto px-3 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-xl text-zinc-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
                      >
                        {CONTRACT_FONTS.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.name} — {f.category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-zinc-750 flex items-center justify-center active:scale-98"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/10 cursor-pointer active:scale-98"
                >
                  <Check className="w-4 h-4" />
                  Lưu & Xem hợp đồng
                </button>
              </div>

            </form>
          ) : (
            /* Printable Legal Preview Area */
            <div className="space-y-6">
              
              <div className="flex flex-col gap-3.5 bg-zinc-950/40 p-4 rounded-2xl border border-zinc-800">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                  <div className="flex items-start gap-2 text-zinc-400 text-xs leading-normal">
                    <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Hợp đồng được kết xuất tài liệu chuẩn A4. Có thể chọn phông chữ bên dưới trước khi in hoặc xuất file PDF.</span>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowUynhiemchiModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-450 text-zinc-950 rounded-xl text-xs font-extrabold cursor-pointer shadow-lg shadow-amber-500/5 transition-all active:scale-98"
                      title="Tùy chỉnh Chi nhánh, Địa chỉ NH, Mã VAT và tải/in Ủy nhiệm chi"
                    >
                      <FileText className="w-4 h-4" />
                      Tùy Chỉnh & Tải UNC
                    </button>
                    {isInput && (
                      <button
                        onClick={handleDownloadDatcocPdf}
                        disabled={isGeneratingDatcocPdf}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-500 hover:bg-rose-450 text-zinc-950 rounded-xl text-xs font-extrabold cursor-pointer shadow-lg shadow-rose-500/5 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText className={`w-4 h-4 ${isGeneratingDatcocPdf ? 'animate-bounce' : ''}`} />
                        {isGeneratingDatcocPdf ? 'Đang xuất HĐĐC...' : 'Tải Đặt Cọc (PDF)'}
                      </button>
                    )}
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isGeneratingPdf}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 rounded-xl text-xs font-extrabold cursor-pointer shadow-lg shadow-emerald-500/5 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                      {isGeneratingPdf ? 'Đang xuất PDF...' : 'Tải Hợp Đồng (PDF)'}
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-500 hover:bg-sky-450 text-zinc-950 rounded-xl text-xs font-extrabold cursor-pointer shadow-lg shadow-sky-500/5 transition-all active:scale-98"
                    >
                      <Printer className="w-4 h-4" />
                      In Hợp Đồng
                    </button>
                  </div>
                </div>

                {/* Font Selector Buttons */}
                <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="text-xs font-bold text-zinc-200">Chọn phông chữ in & PDF:</span>
                    <span className="text-[11px] text-zinc-400 hidden sm:inline">({currentFont.description})</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
                    {CONTRACT_FONTS.map((font) => {
                      const isSelected = font.id === selectedFontId;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => handleSelectFont(font.id)}
                          style={{ fontFamily: font.cssFamily }}
                          title={font.description}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500 text-zinc-950 font-black shadow-md shadow-sky-500/20 ring-1 ring-sky-300'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <span className="font-semibold">{font.name}</span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-sans ${
                              isSelected ? 'bg-zinc-950/20 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {font.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Paper Look A4 container */}
              <div
                className="bg-white text-zinc-950 rounded-2xl p-4 sm:p-12 shadow-xl border border-zinc-300 max-w-3xl mx-auto leading-relaxed text-sm antialiased overflow-hidden transition-all"
                id="printable-contract-area"
                style={{ fontFamily: currentFont.cssFamily }}
              >
                
                {/* National emblem equivalent text */}
                <div className="text-center font-bold uppercase tracking-tight text-xs">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  <div className="font-semibold text-[10px] sm:text-xs tracking-wide capitalize mt-0.5">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="mt-1 text-zinc-400 font-light">---------------------</div>
                </div>

                {/* Document details */}
                <div className="text-right mt-6 text-[10px] sm:text-xs italic text-zinc-700 leading-normal">
                  Số: {contract?.contractNumber || `HDMB-${signingDate.replace(/-/g, '')}-XXXX`} <br />
                  Ngày {dateDay < 10 ? `0${dateDay}` : dateDay} tháng {dateMonth < 10 ? `0${dateMonth}` : dateMonth} năm {dateYear}
                </div>

                {/* Title */}
                <div className="text-center font-extrabold uppercase mt-6 sm:mt-8 text-sm sm:text-base tracking-wide border-b border-black pb-3">
                  HỢP ĐỒNG MUA BÁN KIÊM GIAO NHẬN HÀNG HÓA
                </div>

                <div className="mt-6 space-y-4 text-xs sm:text-sm">
                  <p className="italic text-[11px] sm:text-xs text-zinc-800 leading-relaxed">
                    Căn cứ Bộ luật Dân sự nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện hành.<br />
                    Căn cứ Luật Thương mại nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện hành.<br />
                    Dựa trên nhu cầu cung ứng và năng lực thực hiện của hai bên.
                  </p>

                  <p className="text-[11px] sm:text-xs">Chúng tôi gồm các bên dưới đây đồng thuận ký kết hợp đồng mua bán này:</p>

                  {/* Party A: Buyer */}
                  <div>
                    <div className="font-bold uppercase text-[11px] sm:text-[13px] tracking-wide border-l-2 border-zinc-400 pl-2">
                      {isInput ? `BÊN MUA (BÊN A): CỬA HÀNG ${store.name.toUpperCase()}` : 'BÊN MUA (BÊN A): ĐỐI TÁC KHÁCH HÀNG'}
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="no-border w-full mt-1.5 text-[11px] sm:text-xs text-zinc-900 min-w-[300px]">
                        <tbody>
                          {isInput ? (
                            <>
                              <tr>
                                <td className="font-bold w-24 sm:w-40 py-1">Tên đơn vị:</td>
                                <td className="py-1">{store.name}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Địa chỉ cửa hàng:</td>
                                <td className="py-1">{store.address || 'Chưa cập nhật'}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Người đại diện:</td>
                                <td className="py-1">{effectiveBuyerName}</td>
                              </tr>
                              {store.citizenId && (
                                <tr>
                                  <td className="font-bold py-1">Số Căn cước (CCCD):</td>
                                  <td className="font-mono py-1">{store.citizenId}</td>
                                </tr>
                              )}
                              {store.bankAccount && (
                                <tr>
                                  <td className="font-bold py-1">Tài khoản ngân hàng:</td>
                                  <td className="py-1">{store.bankAccount} tại {store.bankName} (Chủ tài khoản: {store.bankOwner})</td>
                                </tr>
                              )}
                            </>
                          ) : (
                            <>
                              <tr>
                                <td className="font-bold w-24 sm:w-40 py-1">Họ và Tên cá nhân:</td>
                                <td className="font-semibold uppercase py-1">{sellerName || '..........................................................'}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Số Căn cước (CCCD):</td>
                                <td className="font-mono py-1">{maskCitizenId(sellerCitizenId)}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Địa chỉ thường trú:</td>
                                <td className="py-1">{sellerAddress || '......................................................................................................'}</td>
                              </tr>
                              {isInput && (
                                <tr>
                                  <td className="font-bold py-1">Tài khoản ngân hàng:</td>
                                  <td className="py-1">{sellerBankAccount ? `${sellerBankAccount} tại ${sellerBankName}` : '......................................................................................................'}</td>
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Party B: Seller */}
                  <div className="mt-4">
                    <div className="font-bold uppercase text-[11px] sm:text-[13px] tracking-wide border-l-2 border-zinc-400 pl-2">
                      {isInput ? 'BÊN BÁN (BÊN B): ĐỐI TÁC CUNG CẤP' : `BÊN BÁN (BÊN B): CỬA HÀNG ${store.name.toUpperCase()}`}
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="no-border w-full mt-1.5 text-[11px] sm:text-xs text-zinc-900 min-w-[300px]">
                        <tbody>
                          {isInput ? (
                            <>
                              <tr>
                                <td className="font-bold w-24 sm:w-40 py-1">Họ và Tên cá nhân:</td>
                                <td className="font-semibold uppercase py-1">{sellerName || '..........................................................'}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Số Căn cước (CCCD):</td>
                                <td className="font-mono py-1">{sellerCitizenId || '..........................................................'}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Địa chỉ thường trú:</td>
                                <td className="py-1">{sellerAddress || '......................................................................................................'}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Tài khoản ngân hàng:</td>
                                <td className="py-1">{sellerBankAccount ? `${sellerBankAccount} tại ${sellerBankName}` : '......................................................................................................'}</td>
                              </tr>
                            </>
                          ) : (
                            <>
                              <tr>
                                <td className="font-bold w-24 sm:w-40 py-1">Tên đơn vị:</td>
                                <td className="py-1">{store.name}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Địa chỉ cửa hàng:</td>
                                <td className="py-1">{store.address || 'Chưa cập nhật'}</td>
                              </tr>
                              <tr>
                                <td className="font-bold py-1">Người đại diện:</td>
                                <td className="py-1">{effectiveBuyerName}</td>
                              </tr>
                              {store.citizenId && (
                                <tr>
                                  <td className="font-bold py-1">Số Căn cước (CCCD):</td>
                                  <td className="font-mono py-1">{store.citizenId}</td>
                                </tr>
                              )}
                              {store.bankAccount && (
                                <tr>
                                  <td className="font-bold py-1">Tài khoản ngân hàng:</td>
                                  <td className="py-1">{store.bankAccount} tại {store.bankName} (Chủ tài khoản: {store.bankOwner})</td>
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clause 1 */}
                  <div className="mt-6">
                    <div className="font-bold text-[11px] sm:text-xs uppercase">ĐIỀU 1: ĐỐI TƯỢNG HÀNG HÓA VÀ ĐƠN GIÁ GIẢM TRỪ THƯƠNG MẠI</div>
                    <p className="mt-1 text-[11px] sm:text-xs text-zinc-800 leading-normal">
                      {isInput
                        ? `Bên B bán cho Bên A mặt hàng có thông tin chi tiết dưới đây. Đơn giá nhập hàng Bên A được hưởng thấp hơn ${discountPercent}% so với giá niêm yết bán ra của thị trường do Bên A là cửa hàng nhập sỉ trực tiếp:`
                        : `Bên B (Cửa hàng) bán cho Bên A (Khách hàng) mặt hàng có thông tin chi tiết dưới đây. Đơn giá bán Bên A được hưởng thấp hơn ${discountPercent}% so với giá niêm yết bán lẻ của thị trường:`}
                    </p>
                    <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                      <table className="w-full mt-3 text-[10px] sm:text-xs text-left border-collapse border border-zinc-400 min-w-[500px]">
                        <thead>
                          <tr className="bg-zinc-100 font-bold border-b border-zinc-400">
                            <th className="p-1.5 border border-zinc-400 text-center w-[8%]">STT</th>
                            <th className="p-1.5 border border-zinc-400 w-[44%]">Tên Mặt Hàng</th>
                            <th className="p-1.5 border border-zinc-400 text-center w-[14%]">Số Lượng</th>
                            <th className="p-1.5 border border-zinc-400 text-right w-[17%]">{isInput ? 'Đơn Giá Nhập (VND)' : 'Đơn Giá Bán (VND)'}</th>
                            <th className="p-1.5 border border-zinc-400 text-right w-[17%]">Thành Tiền (VND)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center border border-zinc-400 text-zinc-500 italic">Chưa có sản phẩm nào</td>
                            </tr>
                          ) : (
                            <>
                              {items.map((it, idx) => (
                                <tr key={idx} className="border-b border-zinc-300">
                                  <td className="p-1.5 border border-zinc-400 text-center">{idx + 1}</td>
                                  <td className="p-1.5 border border-zinc-400 font-bold break-words whitespace-normal max-w-[200px]">{it.itemName}</td>
                                  <td className="p-1.5 border border-zinc-400 text-center font-bold">{it.quantity}</td>
                                  <td className="p-1.5 border border-zinc-400 text-right font-mono font-bold text-emerald-700">{formatVND(it.contractUnitPrice)}</td>
                                  <td className="p-1.5 border border-zinc-400 text-right font-mono font-bold">{formatVND(it.totalAmount)}</td>
                                </tr>
                              ))}
                              <tr className="bg-zinc-50 font-bold">
                                <td colSpan={2} className="p-1.5 border border-zinc-400 text-left text-zinc-900">Tổng cộng</td>
                                <td className="p-1.5 border border-zinc-400 text-center text-zinc-900">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                                <td className="p-1.5 border border-zinc-400"></td>
                                <td className="p-1.5 border border-zinc-400 text-right font-mono text-zinc-900">{formatVND(items.reduce((sum, item) => sum + item.totalAmount, 0))}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-zinc-900">
                      Tổng Cộng: {formatVND(items.reduce((sum, item) => sum + item.totalAmount, 0))}
                    </p>
                    <p className="mt-1 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-zinc-600">
                      Tổng giá trị hợp đồng thanh toán thực tế: {formatVND(items.reduce((sum, item) => sum + item.totalAmount, 0))}
                    </p>
                    {depositAmount > 0 && (
                      <p className="text-[11px] sm:text-xs font-bold text-amber-700">
                        Số tiền Bên A đã đặt cọc trước: {formatVND(depositAmount)}
                      </p>
                    )}
                  </div>

                  {/* Clause 2 */}
                  <div className="mt-4">
                    <div className="font-bold text-[11px] sm:text-xs uppercase">ĐIỀU 2: PHƯƠNG THỨC GIAO NHẬN VÀ THANH TOÁN</div>
                    <p className="mt-1 text-[11px] sm:text-xs text-zinc-800 leading-relaxed">
                      - Phương thức thanh toán: Bên A chuyển khoản vào số tài khoản của Bên B: <strong>{isInput ? (sellerBankAccount || '....................') : (store.bankAccount || '....................')}</strong> ngân hàng <strong>{isInput ? (sellerBankName || '....................') : (store.bankName || '....................')}</strong>.<br />
                      - Phương thức giao hàng: Bên B giao hàng đầy đủ cho Bên A đảm bảo đúng chất lượng yêu cầu.<br />
                      {depositAmount > 0 ? (
                        <>
                          - Số tiền đặt cọc: Bên A đặt cọc trước cho Bên B số tiền là <strong>{formatVND(depositAmount)}</strong>.<br />
                          - Số tiền còn lại của hợp đồng: <strong>{formatVND(Math.max(0, items.reduce((sum, item) => sum + item.totalAmount, 0) - depositAmount))}</strong>.<br />
                        </>
                      ) : null}
                      - {isInput 
                          ? `Hai bên đã Giao-Nhận đầy đủ hàng hóa nêu trên và Bên mua hẹn thanh toán giá trị còn lại của Hợp đồng ${depositAmount > 0 ? `(${formatVND(Math.max(0, items.reduce((sum, item) => sum + item.totalAmount, 0) - depositAmount))})` : ''} trong vòng 05 ngày làm việc tiếp theo.`
                          : `Hai bên đã Giao-Nhận đầy đủ hàng hóa nêu trên và Bên A hẹn thanh toán giá trị còn lại của Hợp đồng ${depositAmount > 0 ? `(${formatVND(Math.max(0, items.reduce((sum, item) => sum + item.totalAmount, 0) - depositAmount))})` : ''} cho Bên B trong vòng 05 ngày làm việc tiếp theo.`
                        }<br />
                      - Ghi chú bổ sung: {notes || 'Không có.'}
                    </p>
                  </div>

                  {/* Clause 3 */}
                  <div className="mt-4">
                    <div className="font-bold text-[11px] sm:text-xs uppercase">ĐIỀU 3: HIỆU LỰC HỢP ĐỒNG</div>
                    <p className="mt-1 text-[11px] sm:text-xs text-zinc-800 leading-relaxed">
                      Hợp đồng có hiệu lực kể từ ngày ký. Hai bên cam kết thực hiện đầy đủ các điều khoản đã cam kết trên tinh thần hợp tác thiện chí. Bản hợp đồng này được lập thành hai (02) bản có giá trị pháp lý tương đương nhau, mỗi bên giữ một bản để theo dõi thực hiện.
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 text-center mt-8 sm:mt-12 gap-6 sm:gap-4 text-xs font-sans pt-6 border-t border-zinc-100">
                    <div>
                      <div className="font-bold uppercase text-[11px] sm:text-xs">ĐẠI DIỆN BÊN MUA (BÊN A)</div>
                      <div className="text-zinc-400 italic text-[10px] mt-0.5">{isInput ? '(Ký, ghi rõ họ tên và đóng dấu)' : '(Ký, ghi rõ họ tên)'}</div>
                      <div className="h-28 flex items-end justify-center pb-3">
                        <span className="text-zinc-300 font-light select-none">..................................................</span>
                      </div>
                      <div className="font-bold uppercase text-zinc-800 text-[11px] sm:text-xs">Họ và tên: {buyerSignName}</div>
                    </div>
                    <div>
                      <div className="font-bold uppercase text-[11px] sm:text-xs">ĐẠI DIỆN BÊN BÁN (BÊN B)</div>
                      <div className="text-zinc-400 italic text-[10px] mt-0.5">{isInput ? '(Ký, ghi rõ họ tên)' : '(Ký, ghi rõ họ tên và đóng dấu)'}</div>
                      <div className="h-28 flex items-end justify-center pb-3">
                        <span className="text-zinc-300 font-light select-none">..................................................</span>
                      </div>
                      <div className="font-bold uppercase text-zinc-800 text-[11px] sm:text-xs">Họ và tên: {sellerSignName}</div>
                    </div>
                  </div>

                </div>

              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 transition-all cursor-pointer text-center justify-center"
                >
                  Quay lại chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-450 text-zinc-950 transition-all cursor-pointer text-center justify-center"
                >
                  Hoàn tất
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Uynhiemchi Customization & PDF Export Modal */}
      {showUynhiemchiModal && (
        <UynhiemchiModal
          isOpen={showUynhiemchiModal}
          onClose={() => setShowUynhiemchiModal(false)}
          store={store}
          isInput={isInput}
          contractNumber={contract?.contractNumber}
          signingDate={signingDate}
          initialAmount={Math.max(0, items.reduce((sum, item) => sum + item.totalAmount, 0) - depositAmount)}
          defaultDebitName={isInput ? (store.representativeName || store.bankOwner || effectiveBuyerName) : sellerName}
          defaultDebitAccount={isInput ? '' : sellerBankAccount}
          defaultDebitAddress={isInput ? store.address : sellerAddress}
          defaultCreditName={isInput ? sellerName : store.name}
          defaultCreditAccount={isInput ? sellerBankAccount : store.bankAccount}
          defaultCreditBank={isInput ? (sellerBankName || 'Vietcombank') : (store.bankName || 'Vietcombank')}
          defaultCreditAddress={isInput ? sellerAddress : store.address}
          defaultNotes={`Thanh toán tiền hàng còn thiếu theo HĐ mua bán số ${contract?.contractNumber || 'HDMB-' + signingDate.replace(/-/g, '')} ký ngày ${signingDate.split('-').reverse().join('/')}`}
        />
      )}
    </div>
  );
}
