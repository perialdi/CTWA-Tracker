import { useState } from 'react';
import { MetaCapiConfig } from '../types';
import { 
  KeyRound, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  X
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MetaCapiConfig;
  onSave: (newConfig: MetaCapiConfig) => void;
}

export function SettingsModal({ isOpen, onClose, config, onSave }: SettingsModalProps) {
  const [pixelId, setPixelId] = useState(config.pixelId || '');
  const [accessToken, setAccessToken] = useState(config.accessToken || '');
  const [testEventCode, setTestEventCode] = useState(config.testEventCode || '');
  const [defaultAdminName, setDefaultAdminName] = useState(config.defaultAdminName || '');
  const [actionSource, setActionSource] = useState<'chat' | 'other' | 'website'>(config.actionSource || 'chat');
  const [showToken, setShowToken] = useState(false);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; pixelName?: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!pixelId.trim() || !accessToken.trim()) {
      setTestResult({
        success: false,
        message: 'Harap isi Pixel ID dan Access Token terlebih dahulu sebelum melakukan tes.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixelId: pixelId.trim(), accessToken: accessToken.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message,
          pixelName: data.pixelName
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Gagal memverifikasi ke Meta API.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Koneksi ke server gagal.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      pixelId: pixelId.trim(),
      accessToken: accessToken.trim(),
      testEventCode: testEventCode.trim(),
      autoTestMode: Boolean(testEventCode.trim()),
      defaultCurrency: 'IDR',
      defaultAdminName: defaultAdminName.trim(),
      actionSource
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Pengaturan Meta Conversions API (CAPI)</h2>
              <p className="text-xs text-slate-500">Hubungkan Pixel ID dan Token Akses Meta Ads Anda</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Pixel ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Meta Pixel ID / Dataset ID <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="Contoh: 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">
              Ditemukan di Meta Events Manager &gt; Pengaturan &gt; ID Kumpulan Data / ID Piksel.
            </p>
          </div>

          {/* Access Token */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Meta Conversions API Access Token <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showToken ? 'Sembunyikan' : 'Lihat Token'}
              </button>
            </div>
            <div className="relative">
              <textarea 
                rows={3}
                placeholder="Contoh: EAAGm0PX4ZC8kBA... (System User Token)"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono ${
                  !showToken ? 'filter blur-xs hover:blur-none transition-all' : ''
                }`}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dihasilkan dari Events Manager &gt; Pengaturan &gt; Conversions API &gt; "Hasilkan token akses" (Generate Access Token).
            </p>
          </div>

          {/* Test Event Code */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Test Event Code (Kode Uji Peristiwa)
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Opsional / Testing
              </span>
            </div>
            <input 
              type="text"
              placeholder="Contoh: TEST12345"
              value={testEventCode}
              onChange={(e) => setTestEventCode(e.target.value)}
              className="w-full mt-1 px-3.5 py-2 rounded-lg border border-amber-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono uppercase"
            />
            <p className="text-xs text-amber-800/80 mt-1.5">
              Buka tab <strong>"Uji Peristiwa" (Test Events)</strong> di Meta Events Manager untuk melihat event closing masuk secara instan tanpa mengotori data konversi live iklan Anda. Kosongkan jika ingin langsung mencatat ke data iklan asli.
            </p>
          </div>

          {/* Additional CS defaults */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Default CS / Admin
              </label>
              <input 
                type="text"
                placeholder="Contoh: Sarah / CS-01"
                value={defaultAdminName}
                onChange={(e) => setDefaultAdminName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sumber Aksi (Action Source)
              </label>
              <select
                value={actionSource}
                onChange={(e) => setActionSource(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="chat">Chat (WhatsApp / Messenger)</option>
                <option value="other">Other (Offline / Manual)</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>

          {/* Test connection button & feedback */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Memeriksa ke Meta Graph API...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Uji Koneksi Meta Pixel & Token</span>
                </>
              )}
            </button>

            {testResult && (
              <div 
                className={`mt-3 p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.pixelName && (
                    <p className="mt-0.5 text-emerald-700">Nama Pixel: {testResult.pixelName}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <a
            href="https://adsmanager.facebook.com/events_manager2"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
          >
            Buka Meta Events Manager
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
