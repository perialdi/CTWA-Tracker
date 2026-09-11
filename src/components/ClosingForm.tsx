import { useState, FormEvent } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  DollarSign, 
  Target, 
  ShoppingCart, 
  MessageSquare, 
  Sparkles, 
  RotateCcw,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  Hash
} from 'lucide-react';
import { MetaCapiConfig, ClosingEvent, MetaEventType, LeadQuality } from '../types';
import { formatIndonesianPhone, formatRupiah, cleanNumeric, generateOrderId } from '../utils/formatters';

interface ClosingFormProps {
  config: MetaCapiConfig;
  onEventSent: (event: ClosingEvent) => void;
  onOpenSettings: () => void;
}

const PRESET_AMOUNTS = [150000, 250000, 350000, 500000, 750000, 1000000];

const SAMPLE_PRODUCTS = [
  'Paket Promo Glowing',
  'Paket Acne Care',
  'Serum Booster Anti-Aging',
  'Paket Reseller Starter'
];

export function ClosingForm({ config, onEventSent, onOpenSettings }: ClosingFormProps) {
  const [eventType, setEventType] = useState<MetaEventType>('Purchase');
  
  // Form fields
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [valueStr, setValueStr] = useState('350000');
  const [productName, setProductName] = useState('Paket Promo Glowing');
  const [quantity, setQuantity] = useState(1);
  const [leadQuality, setLeadQuality] = useState<LeadQuality>('Hot Lead (Siap Bayar)');
  const [adminName, setAdminName] = useState(config.defaultAdminName || 'CS 01');
  const [orderId, setOrderId] = useState(generateOrderId());
  const [fbclid, setFbclid] = useState('');
  const [notes, setNotes] = useState('');

  // Status handling
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultStatus, setResultStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    fbtraceId?: string;
    eventId?: string;
  } | null>(null);

  const phoneValidation = formatIndonesianPhone(customerPhone);
  const numericValue = cleanNumeric(valueStr);

  const handleAmountSelect = (val: number) => {
    setValueStr(val.toString());
  };

  const handleQuickReset = () => {
    setCustomerPhone('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerCity('');
    setValueStr('350000');
    setOrderId(generateOrderId());
    setFbclid('');
    setNotes('');
    setResultStatus(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!config.pixelId || !config.accessToken) {
      setResultStatus({
        type: 'error',
        message: 'Pixel ID dan Access Token Meta CAPI belum diisi. Silakan klik tombol Pengaturan di atas untuk memasukkan kredensial Anda.'
      });
      return;
    }

    if (!customerPhone.trim() && !customerEmail.trim()) {
      setResultStatus({
        type: 'error',
        message: 'Nomor WhatsApp atau Email wajib diisi agar Meta Ads dapat mencocokkan profil pembeli.'
      });
      return;
    }

    setIsSubmitting(true);
    setResultStatus(null);

    const payload = {
      pixelId: config.pixelId,
      accessToken: config.accessToken,
      testEventCode: config.testEventCode,
      eventName: eventType,
      phone: phoneValidation.normalized || customerPhone,
      name: customerName,
      email: customerEmail,
      city: customerCity,
      value: eventType === 'Purchase' ? numericValue : 0,
      currency: 'IDR',
      productName: productName || 'Produk Standar',
      quantity,
      orderId,
      actionSource: config.actionSource || 'chat',
      leadQuality: eventType === 'Lead' ? leadQuality : undefined,
      adminName,
      fbclid: fbclid.trim(),
      notes
    };

    try {
      const response = await fetch('/api/send-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        const newEvent: ClosingEvent = {
          id: `evt_${Date.now()}`,
          createdAt: new Date().toISOString(),
          eventTime: new Date().toISOString(),
          eventName: eventType,
          customerName: customerName || 'Customer WA',
          customerPhone,
          customerEmail,
          customerCity,
          value: eventType === 'Purchase' ? numericValue : 0,
          currency: 'IDR',
          productName,
          quantity,
          orderId,
          leadQuality: eventType === 'Lead' ? leadQuality : undefined,
          adminName,
          fbclid,
          notes,
          status: 'success',
          testMode: Boolean(config.testEventCode),
          eventId: data.eventId,
          fbtraceId: data.fbtraceId,
          rawMetaResponse: data.rawMetaResponse
        };

        onEventSent(newEvent);
        setResultStatus({
          type: 'success',
          message: `Data ${eventType} berhasil diterima oleh Meta CAPI! Omset: ${formatRupiah(numericValue)}`,
          fbtraceId: data.fbtraceId,
          eventId: data.eventId
        });

        // Generate next order ID automatically
        setOrderId(generateOrderId());
      } else {
        setResultStatus({
          type: 'error',
          message: data.message || 'Meta CAPI menolak pengiriman event. Periksa Token & Pixel ID Anda.',
          fbtraceId: data.metaError?.fbtrace_id
        });
      }
    } catch (err: any) {
      setResultStatus({
        type: 'error',
        message: err.message || 'Gagal menghubungi server aplikasi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Event Type Selector Tabs */}
      <div className="border-b border-slate-100 bg-slate-50/70 p-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEventType('Purchase')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            eventType === 'Purchase'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Closing (Purchase)</span>
        </button>

        <button
          type="button"
          onClick={() => setEventType('Lead')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            eventType === 'Lead'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Prospek (Lead)</span>
        </button>

        <button
          type="button"
          onClick={() => setEventType('InitiateCheckout')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            eventType === 'InitiateCheckout'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Minta Rekening</span>
        </button>

        <button
          type="button"
          onClick={() => setEventType('Contact')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            eventType === 'Contact'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat Masuk</span>
        </button>
      </div>

      {/* Test Mode Indicator Banner */}
      {config.testEventCode ? (
        <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>
              <strong>Mode Uji Peristiwa Aktif:</strong> Menggunakan Test Event Code <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-bold">{config.testEventCode}</code>
            </span>
          </div>
          <span className="text-[11px] text-amber-700 hidden sm:inline">Event muncul di tab Test Events Meta</span>
        </div>
      ) : !config.pixelId ? (
        <div className="bg-rose-50 px-5 py-2.5 border-b border-rose-200 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Pixel ID Meta belum dikonfigurasi. Data belum bisa terkirim ke Meta.</span>
          </div>
          <button 
            type="button" 
            onClick={onOpenSettings}
            className="underline font-semibold hover:text-rose-950"
          >
            Buka Pengaturan
          </button>
        </div>
      ) : null}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Kolom Kiri: Data Customer */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              1. Data Pelanggan WhatsApp (Advanced Matching)
            </h3>

            {/* Nomor WA */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Nomor WhatsApp Pelanggan <span className="text-red-500">*</span></span>
                {phoneValidation.isValid && (
                  <span className="text-[11px] text-emerald-600 font-normal flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Meta format: {phoneValidation.display}
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 081234567890 / 62812..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Otomatis diubah ke format internasional dan dienkripsi <strong>SHA-256</strong> sebelum dikirim.
              </p>
            </div>

            {/* Nama Pelanggan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Pelanggan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email Pelanggan (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    placeholder="budi@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Domisili (Opsional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Jakarta / Surabaya"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Lead Quality Selector if event is Lead */}
            {eventType === 'Lead' && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <label className="block text-xs font-semibold text-blue-900 mb-1.5">
                  Tingkat Kualitas Lead (Prospek)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hot Lead (Siap Bayar)', 'Warm Lead (Tertarik)', 'Cold Lead (Baru Nanya)'] as LeadQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setLeadQuality(q)}
                      className={`p-2 rounded-lg text-center text-xs font-medium border transition-all ${
                        leadQuality === q
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {q.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Data Transaksi & Omset */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              2. Data Nilai Transaksi / Omset
            </h3>

            {/* Nominal Omset (Only relevant for Purchase or checkout) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {eventType === 'Purchase' ? 'Nilai Omset / Penjualan Closing' : 'Estimasi Nilai Transaksi'} <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {formatRupiah(numericValue)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="350000"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Preset Nominal Cepat */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountSelect(amt)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition-colors"
                  >
                    {amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>

            {/* Produk */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk / Paket yang Dibeli
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Contoh: Paket Glowing 3in1"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SAMPLE_PRODUCTS.map((prod) => (
                  <button
                    key={prod}
                    type="button"
                    onClick={() => setProductName(prod)}
                    className="text-[11px] text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded transition-colors"
                  >
                    + {prod}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty & Admin CS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qty / Jumlah Item
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama CS / Admin Closing
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Nama CS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Order ID & Ref / fbclid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  Order / Invoice ID
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Iklan / fbclid (Opsional)
                </label>
                <input
                  type="text"
                  value={fbclid}
                  onChange={(e) => setFbclid(e.target.value)}
                  placeholder="Misal: IG-ADS-01"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {resultStatus && (
          <div
            className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-3 transition-all ${
              resultStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {resultStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{resultStatus.message}</p>
              {resultStatus.eventId && (
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Event ID: {resultStatus.eventId} {resultStatus.fbtraceId ? `• fbtrace_id: ${resultStatus.fbtraceId}` : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleQuickReset}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Form
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              eventType === 'Purchase'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim ke Meta Ads CAPI...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Closing ke Dashboard Meta Ads</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
