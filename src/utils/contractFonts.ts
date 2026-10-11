export interface ContractFontOption {
  id: string;
  name: string;
  subName: string;
  category: 'Serif' | 'Sans-serif';
  fontFamily: string;
  cssFamily: string;
  description: string;
  previewSample: string;
  badge: string;
}

export const CONTRACT_FONTS: ContractFontOption[] = [
  {
    id: 'times',
    name: 'Times New Roman',
    subName: 'Chuẩn NĐ 30/2020',
    category: 'Serif',
    fontFamily: '"Times New Roman", Times, serif',
    cssFamily: '"Times New Roman", Times, serif',
    description: 'Quy chuẩn thể thức văn bản hành chính & hợp đồng pháp lý nhà nước',
    previewSample: 'Cộng hòa Xã hội Chủ nghĩa Việt Nam',
    badge: 'Chuẩn Pháp Lý'
  },
  {
    id: 'arial',
    name: 'Arial',
    subName: 'Hiện đại & Dễ đọc',
    category: 'Sans-serif',
    fontFamily: 'Arial, Helvetica, sans-serif',
    cssFamily: 'Arial, Helvetica, sans-serif',
    description: 'Không chân, nét chữ rõ ràng, độ sắc nét cao trên mọi loại máy in',
    previewSample: 'Hợp đồng mua bán kiêm giao nhận hàng hóa',
    badge: 'Phổ Biến'
  },
  {
    id: 'be-vietnam-pro',
    name: 'Be Vietnam Pro',
    subName: 'Tối ưu dấu Tiếng Việt',
    category: 'Sans-serif',
    fontFamily: '"Be Vietnam Pro", sans-serif',
    cssFamily: '"Be Vietnam Pro", sans-serif',
    description: 'Phông chữ hiện đại thiết kế chuyên biệt cho hệ dấu tiếng Việt',
    previewSample: 'Độc lập - Tự do - Hạnh phúc',
    badge: 'Khuyên Dùng'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    subName: 'Hình học tinh gọn',
    category: 'Sans-serif',
    fontFamily: 'Roboto, Arial, sans-serif',
    cssFamily: 'Roboto, sans-serif',
    description: 'Hình học cân đối, hiện đại, khoảng cách ký tự khoa học',
    previewSample: 'Điều khoản thanh toán thương mại',
    badge: 'Hiện Đại'
  },
  {
    id: 'calibri',
    name: 'Calibri',
    subName: 'Văn phòng chuẩn mực',
    category: 'Sans-serif',
    fontFamily: 'Calibri, Candara, "Segoe UI", Arial, sans-serif',
    cssFamily: 'Calibri, Candara, "Segoe UI", Arial, sans-serif',
    description: 'Bo góc mềm mại, thanh lịch, phong cách văn phòng tập đoàn',
    previewSample: 'Biên bản thỏa thuận giao nhận',
    badge: 'Thanh Lịch'
  },
  {
    id: 'lora',
    name: 'Lora',
    subName: 'Cổ điển & Sang trọng',
    category: 'Serif',
    fontFamily: 'Lora, Georgia, serif',
    cssFamily: 'Lora, Georgia, serif',
    description: 'Có chân nghệ thuật, đường nét uốn lượn sắc sảo, thích hợp hợp đồng cao cấp',
    previewSample: 'Chứng từ mua bán thương mại',
    badge: 'Sang Trọng'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    subName: 'Dày dặn & Trang nghiêm',
    category: 'Serif',
    fontFamily: 'Georgia, "Times New Roman", serif',
    cssFamily: 'Georgia, "Times New Roman", serif',
    description: 'Đậm nét, trang nghiêm, bảo toàn tính dễ đọc khi in ấn khổ lớn',
    previewSample: 'Tổng giá trị hợp đồng thanh toán',
    badge: 'Trang Nghiêm'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    subName: 'Hình học & Đẳng cấp',
    category: 'Sans-serif',
    fontFamily: 'Montserrat, Arial, sans-serif',
    cssFamily: 'Montserrat, sans-serif',
    description: 'Đậm chất thương mại hiện đại, tiêu đề thanh thoát chuẩn quốc tế',
    previewSample: 'Báo cáo doanh thu và kế hoạch tài chính',
    badge: 'Đẳng Cấp'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    subName: 'Serif báo chí dễ đọc',
    category: 'Serif',
    fontFamily: 'Merriweather, Georgia, serif',
    cssFamily: 'Merriweather, serif',
    description: 'Phông có chân dày dặn, tương phản cao, tối ưu tuyệt đối cho in ấn tài liệu',
    previewSample: 'Hiệu quả hoạt động kinh doanh tổng hợp',
    badge: 'Cao Cấp'
  }
];

export const DEFAULT_CONTRACT_FONT_ID = 'times';
