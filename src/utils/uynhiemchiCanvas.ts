import { formatNumberWithDots, convertNumberToVietnameseWords } from './sampleData';

export interface UncAccountInfo {
  number: string;
  name: string;
  address: string;
  bank: string;
}

export interface UncCanvasOptions {
  branch?: string;
  bankAddress?: string;
  vatCode?: string;
  signingDate?: string;
  isInput?: boolean;
  debitAccount: UncAccountInfo;
  creditAccount: UncAccountInfo;
  amount: number;
  contractNumber?: string;
  paymentDetails?: string;
  chargesType?: 'in' | 'out';
  customDateText?: string;
  wordsOverride?: string;
}

export const UNC_PRESET_ORIGINAL = {
  id: 'original',
  name: 'Mẫu Sở Giao Dịch Hà Nội (Theo ảnh tải lên)',
  branch: 'SỞ GIAO DỊCH',
  bankAddress: '31-33 Ngô Quyền, Hoàn Kiếm, Hà Nội',
  vatCode: '0100112437001',
};

export const UNC_PRESET_HUE = {
  id: 'hue',
  name: 'Chi nhánh Huế',
  branch: 'CN Huế',
  bankAddress: '78 Hùng Vương, Phường Thuận Hoá, Thành phố Huế',
  vatCode: '0100112437015',
};

/**
 * Draws the authentic Vietcombank 3D leaf emblem and text onto HTML5 canvas
 */
export function drawVietcombankLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Outer primary green curved leaf
  const primaryGreen = '#007d3a';
  const darkGreen = '#005224';
  const lightGreen = '#48c02c';

  const grad = ctx.createLinearGradient(5, 5, 45, 48);
  grad.addColorStop(0, lightGreen);
  grad.addColorStop(0.4, primaryGreen);
  grad.addColorStop(1, darkGreen);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.bezierCurveTo(29, 4, 39, 12, 43, 24);
  ctx.bezierCurveTo(47, 36, 37, 48, 23, 50);
  ctx.bezierCurveTo(10, 50, 2, 42, 1, 30);
  ctx.bezierCurveTo(0, 18, 8, 6, 18, 2);
  ctx.closePath();
  ctx.fill();

  // White inner cutout contour of the leaf
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(20, 13);
  ctx.bezierCurveTo(28, 17, 32, 25, 30, 33);
  ctx.bezierCurveTo(28, 39, 22, 41, 16, 39);
  ctx.bezierCurveTo(10, 37, 8, 31, 10, 25);
  ctx.bezierCurveTo(12, 19, 16, 15, 20, 13);
  ctx.closePath();
  ctx.fill();

  // Core accent green circle
  ctx.fillStyle = primaryGreen;
  ctx.beginPath();
  ctx.arc(19, 27, 4.2, 0, Math.PI * 2);
  ctx.fill();

  // Brand Typography: Vietcombank
  ctx.fillStyle = '#005a2b';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Vietcombank', -5, 68);

  ctx.restore();
}

/**
 * Draws the entire Vietcombank Payment Order (Ủy nhiệm chi - Form NHBL 04 - 06/99)
 * strictly matching the uploaded template image.
 */
export function drawVietcombankUncToCanvas(
  targetCanvas: HTMLCanvasElement,
  options: UncCanvasOptions
): HTMLCanvasElement {
  targetCanvas.width = 1200;
  targetCanvas.height = 1697; // Standard A4 portrait ratio (1200 x 1697)
  const ctx = targetCanvas.getContext('2d')!;

  // 1. Solid Clean White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1200, 1697);

  // 2. Outer Border Frame
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 2;
  const x0 = 60;
  const y0 = 80;
  const w = 1080;
  const h = 860; // Landscape voucher proportion on A4
  ctx.strokeRect(x0, y0, w, h);

  // 3. Main Divider Lines
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1.5;

  // Horizontal line beneath header (y = 200)
  ctx.beginPath();
  ctx.moveTo(x0, 200);
  ctx.lineTo(x0 + w, 200);
  ctx.stroke();

  // Vertical center dividing line between Left & Right body columns (x = 540, y: 200 -> 675)
  ctx.beginPath();
  ctx.moveTo(540, 200);
  ctx.lineTo(540, 675);
  ctx.stroke();

  // Horizontal line separating body and Bank Use section (y = 675)
  ctx.beginPath();
  ctx.moveTo(x0, 675);
  ctx.lineTo(x0 + w, 675);
  ctx.stroke();

  // 4. Vertical Left Margin Text: Form NHBL 04 - 06/99, Liên 1: Lưu, Liên 2: KH
  ctx.save();
  ctx.translate(42, 520);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px "Times New Roman", Times, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Form NHBL 04 - 06/99, Liên 1: Lưu, Liên 2: KH', 0, 0);
  ctx.restore();

  // 5. HEADER LEFT COLUMN: Vietcombank Logo & Branch Details
  drawVietcombankLogo(ctx, 75, 92, 1);

  const branchClean = (options.branch || UNC_PRESET_ORIGINAL.branch).trim();
  const bankAddress = (options.bankAddress || UNC_PRESET_ORIGINAL.bankAddress).trim();
  const vatCode = (options.vatCode || UNC_PRESET_ORIGINAL.vatCode).trim();

  ctx.fillStyle = '#111827';
  ctx.textAlign = 'left';

  // Branch Name
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText(branchClean.toUpperCase(), 168, 114);

  // Bank Full Name
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText('NGÂN HÀNG TMCP NGOẠI THƯƠNG VN', 168, 132);

  // Address
  ctx.font = '11.5px "Times New Roman", Times, serif';
  ctx.fillText(`ĐC: ${bankAddress}`, 168, 150);

  // VAT code
  ctx.font = '11.5px "Times New Roman", Times, serif';
  ctx.fillText(`Mã VAT: ${vatCode}`, 168, 168);

  // 6. HEADER RIGHT COLUMN: Document Title & Date
  ctx.fillStyle = '#111827';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px "Times New Roman", Times, serif';
  ctx.fillText('CHỨNG TỪ GIAO DỊCH', 840, 115);

  ctx.font = 'bold 22px "Times New Roman", Times, serif';
  ctx.fillText('ỦY NHIỆM CHI - PAYMENT ORDER', 840, 143);

  const currentYear = new Date().getFullYear();
  const dateLabel = options.customDateText || (options.signingDate
    ? `Ngày (Date): ${options.signingDate.split('-').reverse().join('/')}`
    : `Ngày (Date): ...../...../${currentYear}`);
  ctx.font = 'italic 14px "Times New Roman", Times, serif';
  ctx.fillText(dateLabel, 840, 170);

  // 7. Helper to Draw Form Rows (Debit & Credit Tables)
  const drawFormRow = (
    labelText: string,
    valueText: string,
    yStart: number,
    yEnd: number,
    xStart = 75,
    xEnd = 525,
    isBoldValue = false
  ) => {
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(xStart, yStart, xEnd - xStart, yEnd - yStart);

    // Label on the top left of the cell
    ctx.fillStyle = '#4b5563';
    ctx.font = 'bold 11px "Times New Roman", Times, serif';
    ctx.textAlign = 'left';
    ctx.fillText(labelText, xStart + 8, yStart + 13);

    // Value text centered horizontally and vertically
    if (valueText) {
      ctx.fillStyle = '#111827';
      ctx.font = isBoldValue ? 'bold 13.5px "Times New Roman", Times, serif' : '13px "Times New Roman", Times, serif';
      ctx.textAlign = 'center';
      ctx.fillText(valueText, (xStart + xEnd) / 2, yStart + 28);
      ctx.textAlign = 'left';
    }
  };

  // 8. BODY LEFT COLUMN: DEBIT ACCOUNT (ĐỀ NGHỊ GHI NỢ TÀI KHOẢN)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText('ĐỀ NGHỊ GHI NỢ TÀI KHOẢN (Please Debit account):', 75, 222);

  const debit = options.debitAccount;
  drawFormRow('SỐ TK (A/C No):', debit.number, 235, 273, 75, 525, true);
  drawFormRow('TÊN TK (A/C name):', debit.name.toUpperCase(), 273, 311, 75, 525, true);
  drawFormRow('ĐỊA CHỈ (Address):', debit.address, 311, 349);
  drawFormRow('TẠI NH (With Bank):', debit.bank.toUpperCase(), 349, 387, 75, 525, true);

  // 9. BODY LEFT COLUMN: CREDIT ACCOUNT (& GHI CÓ TÀI KHOẢN)
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText('& GHI CÓ TÀI KHOẢN (& Credit account):', 75, 432);

  const credit = options.creditAccount;
  drawFormRow('SỐ TK (A/C No):', credit.number, 445, 483, 75, 525, true);
  drawFormRow('TÊN TK (A/C name):', credit.name.toUpperCase(), 483, 521, 75, 525, true);
  drawFormRow('ĐỊA CHỈ (Address):', credit.address, 521, 559);
  drawFormRow('TẠI NH (With Bank):', credit.bank.toUpperCase(), 559, 597, 75, 525, true);

  // 10. BODY RIGHT COLUMN: AMOUNT & CHARGES
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText('SỐ TIỀN (With amount):', 555, 222);

  ctx.textAlign = 'right';
  ctx.fillText('PHÍ NH (Bank charges)', 1125, 222);
  ctx.textAlign = 'left';

  // Amount Area: x = 555 -> 985
  // Box 1: BẢNG SỐ (In figures)
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  ctx.strokeRect(555, 235, 430, 50);

  // Vertical split inside BẢNG SỐ for currency (at x = 915)
  ctx.beginPath();
  ctx.moveTo(915, 235);
  ctx.lineTo(915, 285);
  ctx.stroke();

  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 12px "Times New Roman", Times, serif';
  ctx.fillText('BẢNG SỐ (In figures):', 563, 252);

  // Amount in bold crimson red
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 18px "Times New Roman", Times, serif';
  ctx.fillText(formatNumberWithDots(options.amount), 695, 267);

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
  ctx.font = 'bold italic 13.5px "Times New Roman", Times, serif';
  const words = options.wordsOverride || convertNumberToVietnameseWords(options.amount);
  if (words.length > 44) {
    ctx.fillText(words.substring(0, 44), 563, 335);
    ctx.fillText(words.substring(44), 563, 355);
  } else {
    ctx.fillText(words, 563, 335);
  }

  // Charges Area: x = 985 -> 1125
  ctx.strokeStyle = '#9ca3af';
  ctx.strokeRect(985, 235, 140, 160);

  // Horizontal divider at y = 315
  ctx.beginPath();
  ctx.moveTo(985, 315);
  ctx.lineTo(1125, 315);
  ctx.stroke();

  const isPhíTrong = (options.chargesType || 'in') === 'in';

  // Phí trong / Including
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 12px "Times New Roman", Times, serif';
  ctx.fillText('Phí trong', 995, 262);
  ctx.font = 'italic 11px "Times New Roman", Times, serif';
  ctx.fillText('Including', 995, 275);

  ctx.strokeStyle = '#1f2937';
  ctx.strokeRect(1085, 255, 15, 15);
  if (isPhíTrong) {
    ctx.strokeStyle = '#007d3a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1087, 262);
    ctx.lineTo(1091, 266);
    ctx.lineTo(1097, 258);
    ctx.stroke();
  }

  // Phí ngoài / Excluding
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 12px "Times New Roman", Times, serif';
  ctx.fillText('Phí ngoài', 995, 342);
  ctx.font = 'italic 11px "Times New Roman", Times, serif';
  ctx.fillText('Excluding', 995, 355);

  ctx.strokeStyle = '#1f2937';
  ctx.strokeRect(1085, 335, 15, 15);
  if (!isPhíTrong) {
    ctx.strokeStyle = '#007d3a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1087, 342);
    ctx.lineTo(1091, 346);
    ctx.lineTo(1097, 338);
    ctx.stroke();
  }

  // 11. DETAILS OF PAYMENT (NỘI DUNG)
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText('NỘI DUNG (Details of Payment):', 555, 425);

  const formattedSigningDate = options.signingDate
    ? options.signingDate.split('-').reverse().join('/')
    : `...../...../${currentYear}`;
  const detailsLine1 = options.paymentDetails || `Thanh toán tiền hàng theo Hợp đồng mua bán số ${options.contractNumber || 'HDMB-XXXX'}`;
  const detailsLine2 = `ký ngày ${formattedSigningDate}`;

  ctx.font = '13.5px "Times New Roman", Times, serif';
  ctx.fillText(detailsLine1, 555, 455);
  ctx.fillText(detailsLine2, 555, 485);
  ctx.fillText('.............................................................................................................................................', 555, 515);

  // 12. Signatures Divider & Signature Blocks
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(555, 535);
  ctx.lineTo(1125, 535);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(840, 535);
  ctx.lineTo(840, 675);
  ctx.stroke();

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

  // 13. BOTTOM SECTION: FOR BANK USE ONLY
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText("DÀNH CHO NGÂN HÀNG (for Bank's Use only)", 75, 700);

  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText('MÃ VAT:', 410, 700);

  // Bank Signatures at the bottom of the section
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px "Times New Roman", Times, serif';
  ctx.fillText('Thanh toán viên', 530, 825);
  ctx.fillText('Kiểm soát', 760, 825);
  ctx.fillText('Giám đốc', 990, 825);

  return targetCanvas;
}
