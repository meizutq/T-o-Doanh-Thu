import React, { useState, useEffect, useRef } from 'react';
import { Store } from '../types';
import { formatNumberWithDots, convertNumberToVietnameseWords } from '../utils/sampleData';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  Printer,
  Building2,
  FileText,
  MapPin,
  Check,
  RefreshCw,
  CheckCircle2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import {
  getVietcombankLogoImage,
  getCurrentLogoSrc,
  updateVietcombankLogo,
  drawVietcombankHeaderLogo
} from '../utils/uncLogoHelper';

export interface UynhiemchiModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store;
  isInput?: boolean;
  contractNumber?: string;
  signingDate?: string;
  initialAmount?: number;
  defaultDebitName?: string;
  defaultDebitAccount?: string;
  defaultDebitAddress?: string;
  defaultCreditName?: string;
  defaultCreditAccount?: string;
  defaultCreditBank?: string;
  defaultCreditAddress?: string;
  defaultNotes?: string;
}

// Ensure authentic Vietnamese Name formatting in uppercase
function sanitizeVietnameseName(rawName?: string, fallback = 'NGUYỄN VĂN AN'): string {
  if (!rawName || !rawName.trim()) return fallback;
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'chủ cửa hàng' || lower === 'store owner' || lower === 'chưa có tên' || lower === 'khách hàng') {
    return fallback;
  }
  return trimmed.toUpperCase();
}

export default function UynhiemchiModal({
  isOpen,
  onClose,
  store,
  isInput = false,
  contractNumber,
  signingDate = new Date().toISOString().split('T')[0],
  initialAmount = 5000000,
  defaultDebitName,
  defaultDebitAccount,
  defaultDebitAddress,
  defaultCreditName,
  defaultCreditAccount,
  defaultCreditBank = 'Vietcombank',
  defaultCreditAddress,
  defaultNotes
}: UynhiemchiModalProps) {
  if (!isOpen) return null;

  // Header bank customization - ONLY editable fields as requested:
  // (Chi nhánh; Địa chỉ ngân hàng; Mã VAT: để thay đổi ở phần trên Uỷ nhiệm chi)
  const [branch, setBranch] = useState<string>(() => {
    return localStorage.getItem('unc_branch') || 'CN Huế';
  });
  const [bankAddress, setBankAddress] = useState<string>(() => {
    return localStorage.getItem('unc_bank_address') || '78 Hùng Vương, Phường Thuận Hoá, Thành phố Huế';
  });
  const [vatCode, setVatCode] = useState<string>(() => {
    return localStorage.getItem('unc_vat_code') || '0100112437015';
  });

  // Quản lý Logo Vietcombank (mặc định là logo chuẩn của Vietcombank, hỗ trợ người dùng tải ảnh logo khác)
  const [logoTimestamp, setLogoTimestamp] = useState<number>(Date.now());
  const [isCustomLogo, setIsCustomLogo] = useState<boolean>(() => {
    return !!localStorage.getItem('unc_logo_custom');
  });
  const currentLogoSrc = getCurrentLogoSrc();

  // Đảm bảo logo được tải xong sẽ kích hoạt vẽ lại canvas lập tức
  useEffect(() => {
    const img = getVietcombankLogoImage();
    const handleLoad = () => {
      setLogoTimestamp(Date.now());
    };
    if (!img.complete) {
      img.addEventListener('load', handleLoad);
      return () => img.removeEventListener('load', handleLoad);
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateVietcombankLogo(dataUrl);
        setIsCustomLogo(true);
        setLogoTimestamp(Date.now());
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    updateVietcombankLogo(null);
    setIsCustomLogo(false);
    setLogoTimestamp(Date.now());
  };

  // Non-editable fields: Automatically populated from contract & store (Không cho phép chỉnh các trường khác)
  const debitAccountName = sanitizeVietnameseName(
    defaultDebitName || store.representativeName || store.bankOwner,
    'NGUYỄN VĂN AN'
  );
  // Nếu là hợp đồng đầu vào, phần số tài khoản ở mục Đề nghị ghi nợ luôn luôn để trống
  const debitAccountNumber = isInput ? '' : (defaultDebitAccount || store.bankAccount || '0041000889988');
  const debitAddress = defaultDebitAddress || store.address || '78 Hùng Vương, TP. Huế';
  // Luôn luôn là Vietcombank
  const debitBank = 'VIETCOMBANK';

  const creditAccountName = defaultCreditName ? defaultCreditName.toUpperCase() : 'CÔNG TY TNHH PHÂN PHỐI THƯƠNG MẠI';
  const creditAccountNumber = defaultCreditAccount || '0123456789';
  const creditBank = (defaultCreditBank || 'Vietcombank').toUpperCase();
  const creditAddress = defaultCreditAddress || 'Việt Nam';

  const amount = initialAmount;
  const feeType: 'including' | 'excluding' = 'including';
  const paymentContent = defaultNotes || (() => {
    const cleanDate = signingDate.split('-').reverse().join('/');
    const code = contractNumber || `HDMB-${signingDate.replace(/-/g, '')}`;
    return `Thanh toán tiền hàng theo HĐ số ${code} ngày ${cleanDate}`;
  })();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Save bank defaults to localStorage
  const handleSaveDefaults = () => {
    try {
      localStorage.setItem('unc_branch', branch.trim());
      localStorage.setItem('unc_bank_address', bankAddress.trim());
      localStorage.setItem('unc_vat_code', vatCode.trim());
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    } catch {}
  };

  // Reset to default Vietcombank branch info
  const handleResetDefaults = () => {
    setBranch('CN Huế');
    setBankAddress('78 Hùng Vương, Phường Thuận Hoá, Thành phố Huế');
    setVatCode('0100112437015');
    handleResetLogo();
  };

  // Draw UNC canvas function with High-DPI accuracy
  const drawUncCanvas = (targetCanvas: HTMLCanvasElement) => {
    targetCanvas.width = 1200;
    targetCanvas.height = 1697;
    const ctx = targetCanvas.getContext('2d')!;

    // Background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 1697);

    // Outer margin box
    const x0 = 60;
    const y0 = 80;
    const w = 1080;
    const h = 860;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, w, h);

    // Main column vertical divider (x = 540, y = 200 to 675)
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(540, 200);
    ctx.lineTo(540, 675);
    ctx.stroke();

    // Horizontal separator under header (y = 200)
    ctx.beginPath();
    ctx.moveTo(x0, 200);
    ctx.lineTo(x0 + w, 200);
    ctx.stroke();

    // Horizontal separator above bank section (y = 675)
    ctx.beginPath();
    ctx.moveTo(x0, 675);
    ctx.lineTo(x0 + w, 675);
    ctx.stroke();

    // ----------------- HEADER LEFT COLUMN: LOGO VIETCOMBANK & THÔNG TIN NGÂN HÀNG -----------------
    // 1. Logo Vietcombank ở phía bên trái trên cùng
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

    // 2. Các chữ địa chỉ, mã số thuế cũ... dời qua sát logo (bắt đầu từ x = 232)
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';

    // Dòng 1: Ngân hàng TMCP Ngoại Thương VN
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    drawFittedText('Ngân hàng TMCP Ngoại Thương VN', 232, 118, 298);

    // Dòng 2: Chi nhánh (ví dụ: CN Huế)
    const branchClean = branch.trim();
    const branchText = branchClean.toLowerCase().startsWith('cn') || branchClean.toLowerCase().startsWith('chi nhánh')
      ? branchClean
      : `CN ${branchClean}`;
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    drawFittedText(branchText, 232, 137, 298);

    // Dòng 3: Địa chỉ
    ctx.font = '11px "Times New Roman", Times, serif';
    drawFittedText(`ĐC: ${bankAddress.trim()}`, 232, 155, 298);

    // Dòng 4: Mã VAT
    drawFittedText(`Mã VAT: ${vatCode.trim()}`, 232, 173, 298);

    // ----------------- HEADER RIGHT COLUMN (Document Title & Date) -----------------
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Times New Roman", Times, serif';
    ctx.fillText('CHỨNG TỪ GIAO DỊCH', 840, 115);

    ctx.font = 'bold 21px "Times New Roman", Times, serif';
    ctx.fillText('ỦY NHIỆM CHI - PAYMENT ORDER', 840, 143);

    // Ngày (date) sửa lại thành ...../...../Năm hiện tại
    const currentYear = new Date().getFullYear();
    ctx.font = 'italic 14px "Times New Roman", Times, serif';
    ctx.fillText(`Ngày (Date): ...../...../${currentYear}`, 840, 170);

    // ----------------- HELPER ROW DRAWER -----------------
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
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(xStart, yStart, xEnd - xStart, yEnd - yStart);

      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 11px "Times New Roman", Times, serif';
      ctx.textAlign = 'left';
      ctx.fillText(labelText, xStart + 8, yStart + 13);

      if (valueText) {
        ctx.fillStyle = isRedValue ? '#ef4444' : '#111827';
        ctx.font = isBoldValue ? 'bold 14px "Times New Roman", Times, serif' : '14px "Times New Roman", Times, serif';
        ctx.textAlign = 'center';
        ctx.fillText(valueText, (xStart + xEnd) / 2, yStart + 28);
        ctx.textAlign = 'left';
      }
    };

    // ----------------- A. DEBIT BLOCK (ĐỀ NGHỊ GHI NỢ TÀI KHOẢN) -----------------
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.textAlign = 'left';
    ctx.fillText('ĐỀ NGHỊ GHI NỢ TÀI KHOẢN (Please Debit account):', 75, 222);

    const dAddrShort = debitAddress.length > 50 ? debitAddress.substring(0, 50) + '...' : debitAddress;

    // SỐ TK: Hợp đồng đầu vào luôn luôn để trống
    drawFormRow('SỐ TK (A/C No):', isInput ? '' : (debitAccountNumber || '...........................................'), 235, 273, 75, 525, true);
    // TÊN TK: Tên tiếng Việt
    drawFormRow('TÊN TK (A/C name):', debitAccountName, 273, 311, 75, 525, true);
    // ĐỊA CHỈ
    drawFormRow('ĐỊA CHỈ (Address):', dAddrShort, 311, 349);
    // TẠI NH: Luôn luôn là Vietcombank
    drawFormRow('TẠI NH (With Bank):', debitBank, 349, 387, 75, 525, true);

    // ----------------- B. CREDIT BLOCK (GHI CÓ TÀI KHOẢN) -----------------
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('& GHI CÓ TÀI KHOẢN (& Credit account):', 75, 432);

    const cAddrShort = creditAddress.length > 50 ? creditAddress.substring(0, 50) + '...' : creditAddress;

    drawFormRow('SỐ TK (A/C No):', creditAccountNumber || '...........................................', 445, 483, 75, 525, true);
    drawFormRow('TÊN TK (A/C name):', creditAccountName, 483, 521, 75, 525, true);
    drawFormRow('ĐỊA CHỈ (Address):', cAddrShort, 521, 559);
    drawFormRow('TẠI NH (With Bank):', creditBank, 559, 597, 75, 525, true);

    // ----------------- RIGHT COLUMN: AMOUNT, CHARGES & OTHER DETAILS -----------------
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('SỐ TIỀN (With amount):', 555, 222);

    ctx.textAlign = 'right';
    ctx.fillText('PHÍ NH (Bank charges)', 1125, 222);
    ctx.textAlign = 'left';

    // Amount Area: x = 555 to x = 985 (width = 430)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.strokeRect(555, 235, 430, 50);

    // Vertical split inside BẢNG SỐ box for currency (x = 915)
    ctx.beginPath();
    ctx.moveTo(915, 235);
    ctx.lineTo(915, 285);
    ctx.stroke();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('BẢNG SỐ (In figures):', 563, 252);

    // Figure Value - In bold red
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px "Times New Roman", Times, serif';
    ctx.fillText(formatNumberWithDots(amount), 700, 267);

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
    const words = convertNumberToVietnameseWords(amount);
    if (words.length > 42) {
      ctx.fillText(words.substring(0, 42), 563, 335);
      ctx.fillText(words.substring(42), 563, 355);
    } else {
      ctx.fillText(words, 563, 335);
    }

    // Charges Area on the right: x = 985 to x = 1125 (width = 140)
    ctx.strokeStyle = '#9ca3af';
    ctx.strokeRect(985, 235, 140, 160);

    ctx.beginPath();
    ctx.moveTo(985, 315);
    ctx.lineTo(1125, 315);
    ctx.stroke();

    // Phí trong / Including
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('Phí trong', 995, 262);
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText('Including', 995, 275);

    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(1085, 255, 15, 15);
    if (feeType === 'including') {
      ctx.strokeStyle = '#007d3a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(1087, 262);
      ctx.lineTo(1091, 266);
      ctx.lineTo(1097, 258);
      ctx.stroke();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
    }

    // Phí ngoài / Excluding
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px "Times New Roman", Times, serif';
    ctx.fillText('Phí ngoài', 995, 342);
    ctx.font = 'italic 11px "Times New Roman", Times, serif';
    ctx.fillText('Excluding', 995, 355);

    ctx.strokeStyle = '#1f2937';
    ctx.strokeRect(1085, 335, 15, 15);

    // ----------------- DETAILS OF PAYMENT (NỘI DUNG) -----------------
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillText('NỘI DUNG (Details of Payment):', 555, 425);

    ctx.font = '14px "Times New Roman", Times, serif';
    const textLines: string[] = [];
    const maxChars = 56;
    let remaining = paymentContent;
    while (remaining.length > 0) {
      if (remaining.length <= maxChars) {
        textLines.push(remaining);
        break;
      }
      let splitIdx = remaining.lastIndexOf(' ', maxChars);
      if (splitIdx === -1 || splitIdx < 20) splitIdx = maxChars;
      textLines.push(remaining.substring(0, splitIdx).trim());
      remaining = remaining.substring(splitIdx).trim();
    }

    let lineY = 455;
    for (let i = 0; i < Math.min(3, textLines.length); i++) {
      ctx.fillText(textLines[i], 555, lineY);
      lineY += 28;
    }
    if (textLines.length < 3) {
      ctx.fillText(`.............................................................................................................................................`, 555, lineY);
    }

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
    // ĐÃ XOÁ DÒNG MÃ VAT Ở DƯỚI GẦN DÒNG DÀNH CHO NGÂN HÀNG THEO YÊU CẦU
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px "Times New Roman", Times, serif';
    ctx.fillText("DÀNH CHO NGÂN HÀNG (for Bank's Use only)", 75, 698);

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
  };

  // Re-draw whenever branch, bankAddress, vatCode, or logo change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawUncCanvas(canvas);
    }
  }, [branch, bankAddress, vatCode, logoTimestamp]);

  // Download PDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {}
      }

      const offscreen = document.createElement('canvas');
      drawUncCanvas(offscreen);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = offscreen.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

      const cleanStore = store.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      const cleanBuyer = debitAccountName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

      pdf.save(`UNC.Vietcombank.${cleanStore}.${cleanBuyer}.${amount}.pdf`);
    } catch (err) {
      console.error('Lỗi khi xuất PDF Ủy nhiệm chi:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    const offscreen = document.createElement('canvas');
    drawUncCanvas(offscreen);
    const imgData = offscreen.toDataURL('image/png');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In Ủy Nhiệm Chi - Vietcombank</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background-color: white;
            }
            img {
              width: 100%;
              height: auto;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal Bar */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-zinc-100 tracking-tight">
                  Tùy Biến Thông Tin Ngân Hàng & Xuất Ủy Nhiệm Chi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Vietcombank A4
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Chỉ cho phép tùy chỉnh Chi nhánh, Địa chỉ ngân hàng, Mã VAT ở phần trên chứng từ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-zinc-950/30">
          
          {/* Left Column: Canvas Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-start space-y-3">
            <div className="w-full flex items-center justify-between px-1">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                Bản xem trước A4 thời gian thực:
              </span>
              <span className="text-[10px] text-zinc-400">Ngày: ...../...../{new Date().getFullYear()}</span>
            </div>

            <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center justify-center shadow-inner overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full max-w-full h-auto rounded shadow-lg border border-zinc-800 bg-white"
                style={{ aspectRatio: '1200 / 1697' }}
              />
            </div>
          </div>

          {/* Right Column: Only Chi nhánh, Địa chỉ ngân hàng, Mã VAT & In/Tải PDF */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Tùy Chỉnh Phần Trên Ủy Nhiệm Chi */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Tùy Chỉnh Phần Trên Ủy Nhiệm Chi</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Khôi phục thông tin ngân hàng mặc định"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDefaults}
                    className="text-[10px] text-sky-400 font-bold hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Lưu làm mặc định cho các lần sau"
                  >
                    <Check className="w-2.5 h-2.5" />
                    Lưu mặc định
                  </button>
                </div>
              </div>

              {saveSuccessNotice && (
                <div className="py-1 px-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-300 text-[10.5px] font-semibold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Đã lưu Chi nhánh, Địa chỉ và Mã VAT làm cấu hình mặc định!
                </div>
              )}

              <div className="space-y-3">
                {/* 1. Logo Vietcombank trên chứng từ */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Logo Vietcombank trên UNC
                    </label>
                    {isCustomLogo && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        className="text-[9.5px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
                      >
                        Khôi phục logo chuẩn
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="w-24 h-9 bg-white rounded p-1 flex items-center justify-center border border-zinc-700 shrink-0">
                      <img
                        src={currentLogoSrc}
                        alt="Vietcombank Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                        <Upload className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>Tải ảnh logo khác...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="block text-[9px] text-zinc-500 mt-1 truncate">
                        {isCustomLogo ? 'Đang dùng logo tùy chỉnh của bạn' : 'Đang dùng logo Vietcombank chuẩn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Chi nhánh ngân hàng */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Chi nhánh ngân hàng <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Ví dụ: CN Huế, CN Sài Gòn..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all"
                  />
                  <span className="text-[9.5px] text-zinc-500 mt-1 block">
                    Hiển thị trên chứng từ: Ngân hàng TMCP Ngoại Thương VN - {branch}
                  </span>
                </div>

                {/* 2. Địa chỉ ngân hàng */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Địa chỉ ngân hàng <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-zinc-500">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={bankAddress}
                      onChange={(e) => setBankAddress(e.target.value)}
                      placeholder="Nhập địa chỉ chi nhánh ngân hàng..."
                      className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                {/* 3. Mã VAT */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Mã VAT ngân hàng <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={vatCode}
                    onChange={(e) => setVatCode(e.target.value)}
                    placeholder="Ví dụ: 0100112437015"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs font-mono font-semibold focus:outline-none focus:border-sky-500 transition-all"
                  />
                  <span className="text-[9.5px] text-zinc-500 mt-1 block">
                    Hiển thị ở góc trên bên trái: Mã VAT: {vatCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Print & Download */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border border-zinc-700 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>In Trực Tiếp (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 rounded-xl font-extrabold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                <span>{isGeneratingPdf ? 'Đang xuất PDF...' : 'Tải File PDF (A4)'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
