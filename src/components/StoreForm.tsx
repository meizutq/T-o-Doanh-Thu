import React, { useState } from 'react';
import { Store, IndustryType, INDUSTRIES, SUPPORTED_BANKS } from '../types';
import { Store as StoreIcon, MapPin, FileText, X, Landmark, CreditCard, User, Sparkles, Building2, HelpCircle } from 'lucide-react';

interface StoreFormProps {
  store?: Store; // If provided, we are editing
  onSubmit: (storeData: Omit<Store, 'id' | 'createdAt'> & { id?: string }) => void;
  onCancel: () => void;
}

export default function StoreForm({ store, onSubmit, onCancel }: StoreFormProps) {
  const [name, setName] = useState(store?.name || '');
  const [industry, setIndustry] = useState<IndustryType>(store?.industry || 'bia_nuoc_giai_khat');
  const [address, setAddress] = useState(store?.address || '');
  const [representativeName, setRepresentativeName] = useState(store?.representativeName || '');
  const [bankName, setBankName] = useState(store?.bankName || 'Vietcombank');
  const [bankAccount, setBankAccount] = useState(store?.bankAccount || '');
  const [bankOwner, setBankOwner] = useState(store?.bankOwner || '');
  const [citizenId, setCitizenId] = useState(store?.citizenId || '');
  const [notes, setNotes] = useState(store?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên cửa hàng');
      return;
    }
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ cửa hàng');
      return;
    }
    setError('');
    onSubmit({
      id: store?.id,
      name: name.trim(),
      industry,
      address: address.trim(),
      representativeName: representativeName.trim(),
      bankName: bankName,
      bankAccount: bankAccount.trim(),
      bankOwner: bankOwner.trim().toUpperCase(), // uppercase typical of bank names
      citizenId: citizenId.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-all duration-200">
      {/* Decorative top accent border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500" />

      {/* Header Container */}
      <div className="p-5 sm:p-6 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-xl">
            <StoreIcon className="w-5 h-5 sm:w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-50 uppercase tracking-wider font-sans">
              {store ? 'Chỉnh sửa Cửa hàng' : 'Thêm Cửa hàng Mới'}
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {store ? 'Cập nhật định cấu hình thông tin định danh & ngân quỹ' : 'Thiết lập không gian kinh doanh và thông tin giao dịch'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-zinc-200 p-2 hover:bg-zinc-800/80 rounded-xl transition-all cursor-pointer"
          type="button"
          title="Đóng"
        >
          <X className="w-4 h-4 sm:w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
        {error && (
          <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            {error}
          </div>
        )}

        {/* Store Name & Industry */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>Tên Cửa hàng / Hộ kinh doanh</span>
              <span className="text-red-500 font-black text-xs">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-zinc-500">
                <Building2 className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Tạp hóa Minh Thư, Góc Phố Cafe, Hải Sản Năm Béo..."
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2">
              Ngành nghề Kinh doanh <span className="text-red-500 font-black text-xs">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(INDUSTRIES) as IndustryType[]).map((type) => {
                const item = INDUSTRIES[type];
                const isSelected = industry === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setIndustry(type)}
                    className={`flex flex-col items-start p-3 border rounded-xl text-left transition-all relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/5 ring-1 ring-sky-500/20'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-950'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block"
                        style={{
                          backgroundColor: `${item.color}15`,
                          color: item.color,
                          border: `1px solid ${item.color}25`
                        }}
                      >
                        {item.name}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
                      Biên LN định mức: <strong className="text-zinc-300 font-mono">{item.benchmarkMargin * 100}%</strong>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Store Address */}
        <div>
          <label className="block text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Địa chỉ kinh doanh</span>
            <span className="text-red-500 font-black text-xs">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-zinc-500">
              <MapPin className="w-4 h-4" />
            </span>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ví dụ: 120 Hoàng Diệu, Quận Hải Châu, Đà Nẵng"
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs sm:text-sm font-medium"
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1.5 leading-normal">
            Nhập chính xác để hiển thị chuyên nghiệp trên đầu trang của các tệp báo cáo PDF.
          </p>
        </div>

        {/* Store Representative Name */}
        <div>
          <label className="block text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span>Người đại diện cửa hàng</span>
            <span className="text-zinc-500 font-normal text-[10px]">(Dùng ký kết hợp đồng, nếu trống sẽ mặc định dùng tên tài khoản)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-zinc-500">
              <User className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn A"
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs sm:text-sm font-medium"
            />
          </div>
        </div>

        {/* Banking Information Section */}
        <div className="border-t border-zinc-800/80 pt-4 mt-4 bg-zinc-950/20 rounded-xl border border-transparent">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-sky-400 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" /> Thông tin ngân quỹ nhận tiền
            </h4>
            <span className="text-[9px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full font-mono">AUTOLINK QR</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bank Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400">
                Ngân hàng nhận
              </label>
              <input
                type="text"
                list="supported-store-banks"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Chọn hoặc tự nhập ngân hàng..."
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs font-semibold"
              />
              <datalist id="supported-store-banks">
                {SUPPORTED_BANKS.map((b) => (
                  <option key={b.code} value={b.shortName}>
                    {b.name}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Bank Account */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400">
                Số tài khoản
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-3 text-zinc-500">
                  <CreditCard className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Ví dụ: 1903... hoặc 0071..."
                  className="w-full pl-8 pr-2 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Bank Owner */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400">
                Chủ tài khoản
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-3 text-zinc-500">
                  <User className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={bankOwner}
                  onChange={(e) => setBankOwner(e.target.value)}
                  placeholder="NGUYEN VAN A"
                  className="w-full pl-8 pr-2 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs uppercase font-extrabold tracking-wide"
                />
              </div>
            </div>
          </div>

          {/* Citizen ID (CCCD) */}
          <div className="mt-3.5 space-y-1">
            <label className="block text-[10px] font-bold text-zinc-400">
              Số Căn cước công dân (CCCD) chủ cửa hàng
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-3 text-zinc-500">
                <CreditCard className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, ''))}
                placeholder="Ví dụ: 012345678912"
                className="w-full pl-8 pr-2.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/40 mt-3 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-normal">
              Hệ thống sẽ <strong>tự động phát sinh mã VietQR bảo mật</strong> chứa đầy đủ thông tin số tiền & nội dung chuyển khoản tương ứng với từng ngày giao dịch bán lẻ.
            </p>
          </div>
        </div>

        {/* Short Notes */}
        <div>
          <label className="block text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2">
            Ghi chú / Mô tả không gian
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-zinc-500">
              <FileText className="w-4 h-4" />
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú đặc thù kinh doanh, định lượng khách hàng hoặc phân bố doanh thu để lưu trữ..."
              rows={3}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all text-xs sm:text-sm resize-none leading-relaxed font-medium"
            />
          </div>
        </div>

        {/* Buttons Action */}
        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-3 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:flex-1 py-3 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="w-full sm:flex-1 py-3 bg-sky-500 hover:bg-sky-450 text-zinc-950 rounded-xl font-black tracking-widest uppercase text-xs transition-all shadow-md hover:shadow-sky-500/10 cursor-pointer text-center"
          >
            {store ? 'Lưu thay đổi' : 'Tạo cửa hàng mới'}
          </button>
        </div>
      </form>
    </div>
  );
}
