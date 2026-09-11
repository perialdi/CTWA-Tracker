import { useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, Loader2, X, FileSpreadsheet } from 'lucide-react';
import { MetaCapiConfig, ClosingEvent, MetaEventType } from '../types';
import { cleanNumeric, formatIndonesianPhone, generateOrderId } from '../utils/formatters';

interface BatchClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MetaCapiConfig;
  onBatchCompleted: (newEvents: ClosingEvent[]) => void;
}

export function BatchClosingModal({ isOpen, onClose, config, onBatchCompleted }: BatchClosingModalProps) {
  const [inputText, setInputText] = useState(
    `081234567891, Budi Santoso, 350000, Paket Glowing, Jakarta\n085712345678, Siti Rahma, 500000, Paket Complete, Surabaya\n089611223344, Hendra Kusuma, 250000, Serum Anti-Aging, Bandung`
  );
  const [eventName, setEventName] = useState<MetaEventType>('Purchase');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleStartBatch = async () => {
    if (!config.pixelId || !config.accessToken) {
      alert('Pixel ID dan Meta Access Token wajib diisi di Pengaturan sebelum melakukan pengiriman.');
      return;
    }

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('Teks data closing masih kosong.');
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: lines.length });
    setLogs([]);

    const createdEvents: ClosingEvent[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Supports comma or tab or semicolon separation
      const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const parts = line.split(delimiter).map((p) => p.trim());

      const rawPhone = parts[0] || '';
      const rawName = parts[1] || '';
      const rawValue = parts[2] ? cleanNumeric(parts[2]) : 0;
      const rawProduct = parts[3] || 'Produk Standar';
      const rawCity = parts[4] || '';

      const phoneInfo = formatIndonesianPhone(rawPhone);
      const orderId = generateOrderId('WA-BATCH');

      const payload = {
        pixelId: config.pixelId,
        accessToken: config.accessToken,
        testEventCode: config.testEventCode,
        eventName,
        phone: phoneInfo.normalized || rawPhone,
        name: rawName,
        value: rawValue,
        currency: 'IDR',
        productName: rawProduct,
        city: rawCity,
        orderId,
        adminName: config.defaultAdminName || 'Admin CS',
        actionSource: config.actionSource || 'chat'
      };

      try {
        const response = await fetch('/api/send-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resData = await response.json();

        if (response.ok && resData.success) {
          createdEvents.push({
            id: `evt_${Date.now()}_${i}`,
            createdAt: new Date().toISOString(),
            eventTime: new Date().toISOString(),
            eventName,
            customerName: rawName || 'Customer WA',
            customerPhone: rawPhone,
            customerCity: rawCity,
            value: rawValue,
            currency: 'IDR',
            productName: rawProduct,
            quantity: 1,
            orderId,
            adminName: config.defaultAdminName || 'CS Batch',
            status: 'success',
            testMode: Boolean(config.testEventCode),
            eventId: resData.eventId,
            fbtraceId: resData.fbtraceId
          });
          setLogs((prev) => [`✅ [${i + 1}/${lines.length}] Sukses: ${rawName || rawPhone} - Rp ${rawValue.toLocaleString('id-ID')}`, ...prev]);
        } else {
          createdEvents.push({
            id: `evt_${Date.now()}_${i}`,
            createdAt: new Date().toISOString(),
            eventTime: new Date().toISOString(),
            eventName,
            customerName: rawName || 'Customer WA',
            customerPhone: rawPhone,
            customerCity: rawCity,
            value: rawValue,
            currency: 'IDR',
            productName: rawProduct,
            quantity: 1,
            orderId,
            adminName: config.defaultAdminName || 'CS Batch',
            status: 'failed',
            testMode: Boolean(config.testEventCode),
            eventId: resData.eventId || orderId,
            errorMessage: resData.message
          });
          setLogs((prev) => [`❌ [${i + 1}/${lines.length}] Gagal: ${rawName || rawPhone} (${resData.message})`, ...prev]);
        }
      } catch (err: any) {
        setLogs((prev) => [`❌ [${i + 1}/${lines.length}] Error: ${err.message}`, ...prev]);
      }

      setProgress({ current: i + 1, total: lines.length });
      // Small pause to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsProcessing(false);
    onBatchCompleted(createdEvents);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Kirim Closing Massal (Batch / Bulk)</h2>
              <p className="text-xs text-slate-500">Paste rekap penjualan dari Google Sheets / Excel sekaligus ke Meta CAPI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Pilih Tipe Event:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEventName('Purchase')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  eventName === 'Purchase' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Purchase (Omset Closing)
              </button>
              <button
                type="button"
                onClick={() => setEventName('Lead')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  eventName === 'Lead' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Lead (Prospek)
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Format Baris: <code className="text-slate-500 font-mono">No.WA, Nama, Nominal, Produk, Kota</code>
              </label>
              <span className="text-[11px] text-slate-500">Bisa copas langsung dari Excel / CSV</span>
            </div>
            <textarea
              rows={6}
              value={inputText}
              disabled={isProcessing}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="08123456789, Budi, 350000, Paket A, Jakarta"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {isProcessing && (
            <div className="space-y-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex justify-between text-xs font-medium text-blue-900">
                <span>Mengirim ke Meta CAPI...</span>
                <span>{progress.current} dari {progress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="max-h-36 overflow-y-auto p-3 bg-slate-900 rounded-xl text-slate-200 font-mono text-[11px] space-y-1">
              {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleStartBatch}
            disabled={isProcessing}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Kirim Semua Data ke Meta CAPI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
