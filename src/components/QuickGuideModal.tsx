import { X, CheckCircle2, ShieldAlert, ArrowRight, Lightbulb, ExternalLink } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickGuideModal({ isOpen, onClose }: QuickGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Panduan Integrasi Meta CAPI WhatsApp</h2>
              <p className="text-xs text-slate-500">Kirim data closing tanpa biaya WhatsApp Cloud API Meta</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-700 text-sm">
          {/* Mengapa ini menguntungkan */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Mengapa Metode CAPI Offline Ini Sangat Menghemat Biaya?
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Jika menggunakan WhatsApp Business Cloud API resmi, Meta mengenakan biaya per percakapan (conversation fee) berkisar <strong>Rp 400 - Rp 900 per chat</strong>.
              Dengan tool ini, CS Anda tetap memakai WhatsApp biasa / WhatsApp Business gratis, lalu saat terjadi closing cukup menginput form ini. Server otomatis mengirim event <strong>Purchase</strong> dan nilai omset ke Meta Ads melalui Conversions API (CAPI) resmi Meta.
            </p>
          </div>

          {/* Langkah 1 */}
          <div className="flex gap-4 items-start">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-semibold text-slate-900">Salin Meta Pixel / Dataset ID</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buka <strong>Meta Events Manager</strong> (<a href="https://adsmanager.facebook.com/events_manager2" target="_blank" rel="noreferrer" className="text-blue-600 underline">buka di sini</a>) &gt; Pilih Kumpulan Data / Pixel Anda &gt; Buka tab <strong>Pengaturan (Settings)</strong> &gt; Salin <strong>ID Kumpulan Data (Dataset ID)</strong>.
              </p>
            </div>
          </div>

          {/* Langkah 2 */}
          <div className="flex gap-4 items-start">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-semibold text-slate-900">Buat Token Akses Meta CAPI</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Di tab <strong>Pengaturan</strong> Events Manager yang sama, scroll ke bawah ke bagian <strong>Conversions API</strong> &gt; Klik tautan <strong>"Hasilkan token akses" (Generate access token)</strong> di bawah *Siapkan secara manual*. Salin token panjang tersebut ke menu <strong>Pengaturan</strong> di aplikasi ini.
              </p>
            </div>
          </div>

          {/* Langkah 3 */}
          <div className="flex gap-4 items-start">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-semibold text-slate-900">Coba di Tab "Uji Peristiwa" (Test Events)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Buka tab <strong>Uji Peristiwa (Test Events)</strong> di Meta Events Manager. Salin kode uji (misal: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">TEST12345</code>), lalu masukkan di menu Pengaturan tool ini. Kirim satu data closing dummy: Anda akan langsung melihat event <strong>Purchase</strong> dan nominal rupiahnya muncul seketika di layar Meta!
              </p>
            </div>
          </div>

          {/* Keamanan & EMQ (Event Match Quality) */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <h3 className="font-semibold text-emerald-900 flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              Bagaimana Meta Mencocokkan Data Pembeli WA dengan Iklan?
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Meta menggunakan algoritma <strong>Advanced Matching</strong>. Nomor HP pelanggan otomatis dinormalisasi ke format internasional (misal <code className="font-mono">62812...</code>) dan dienkripsi satu arah dengan <strong>SHA-256</strong> sebelum dikirim ke Meta. Meta mencocokkan nomor tersebut dengan akun Facebook / Instagram pengguna yang sebelumnya melihat atau mengklik iklan Anda.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
          >
            Mengerti, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
