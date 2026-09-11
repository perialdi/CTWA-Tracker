import { useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, Loader2, X, FileSpreadsheet, Eye, Send } from 'lucide-react';
import { MetaCapiConfig, ClosingEvent, MetaEventType } from '../types';
import { cleanNumeric, formatIndonesianPhone, generateOrderId, formatRupiah } from '../utils/formatters';

interface BatchClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MetaCapiConfig;
  onBatchCompleted: (newEvents: ClosingEvent[]) => void;
  showToast: (title: string, type?: any, message?: string) => void;
}

interface ParsedRow {
  phone: string;
  name: string;
  value: number;
  product: string;
  city: string;
  orderId: string;
  isValid: boolean;
}

const SAMPLE_INPUT = `081234567891, Budi Santoso, 350000, Paket Glowing, Jakarta
085712345678, Siti Rahma, 500000, Paket Complete, Surabaya
089611223344, Hendra Kusuma, 250000, Serum Anti-Aging, Bandung`;

function parseInputText(text: string): ParsedRow[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map(line => {
      const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
      const parts = line.split(delimiter).map(p => p.trim());
      const phone = parts[0] || '';
      return {
        phone,
        name: parts[1] || '',
        value: parts[2] ? cleanNumeric(parts[2]) : 0,
        product: parts[3] || 'Produk Standar',
        city: parts[4] || '',
        orderId: generateOrderId('WA-BATCH'),
        isValid: phone.length >= 8
      };
    });
}

export function BatchClosingModal({ isOpen, onClose, config, onBatchCompleted, showToast }: BatchClosingModalProps) {
  const [inputText, setInputText] = useState(SAMPLE_INPUT);
  const [eventName, setEventName] = useState<MetaEventType>('Purchase');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<{ text: string; success: boolean }[]>([]);
  const [summary, setSummary] = useState<{ success: number; failed: number; totalOmset: number } | null>(null);

  if (!isOpen) return null;

  const parsedRows = parseInputText(inputText);
  const validRows = parsedRows.filter(r => r.isValid);

  const handleStartBatch = async () => {
    if (!config.pixelId || !config.accessToken) {
      showToast('Pixel ID dan Token belum dikonfigurasi', 'error', 'Isi pengaturan CAPI terlebih dahulu.');
      return;
    }

    if (validRows.length === 0) {
      showToast('Tidak ada data yang valid', 'warning', 'Pastikan format data sudah benar (No.WA, Nama, Nominal, Produk, Kota).');
      return;
    }

    setIsProcessing(true);
    setShowPreview(false);
    setProgress({ current: 0, total: validRows.length });
    setLogs([]);
    setSummary(null);

    const createdEvents: ClosingEvent[] = [];
    let successCount = 0;
    let totalOmset = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const phoneInfo = formatIndonesianPhone(row.phone);

      const payload = {
        pixelId: config.pixelId,
        accessToken: config.accessToken,
        testEventCode: config.testEventCode,
        eventName,
        phone: phoneInfo.normalized || row.phone,
        name: row.name,
        value: row.value,
        currency: 'IDR',
        productName: row.product,
        city: row.city,
        orderId: row.orderId,
        adminName: config.defaultAdminName || 'CS Batch',
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
          successCount++;
          if (eventName === 'Purchase') totalOmset += row.value;
          createdEvents.push({
            id: `evt_${Date.now()}_${i}`,
            createdAt: new Date().toISOString(),
            eventTime: new Date().toISOString(),
            eventName,
            customerName: row.name || 'Customer WA',
            customerPhone: row.phone,
            customerCity: row.city,
            value: row.value,
            currency: 'IDR',
            productName: row.product,
            quantity: 1,
            orderId: row.orderId,
            adminName: config.defaultAdminName || 'CS Batch',
            status: 'success',
            testMode: Boolean(config.testEventCode),
            eventId: resData.eventId,
            fbtraceId: resData.fbtraceId
          });
          setLogs(prev => [...prev, {
            text: `[${i + 1}/${validRows.length}] ✅ ${row.name || row.phone} — Rp ${row.value.toLocaleString('id-ID')}`,
            success: true
          }]);
        } else {
          createdEvents.push({
            id: `evt_${Date.now()}_${i}`,
            createdAt: new Date().toISOString(),
            eventTime: new Date().toISOString(),
            eventName,
            customerName: row.name || 'Customer WA',
            customerPhone: row.phone,
            customerCity: row.city,
            value: row.value,
            currency: 'IDR',
            productName: row.product,
            quantity: 1,
            orderId: row.orderId,
            adminName: config.defaultAdminName || 'CS Batch',
            status: 'failed',
            testMode: Boolean(config.testEventCode),
            eventId: resData.eventId || row.orderId,
            errorMessage: resData.message
          });
          setLogs(prev => [...prev, {
            text: `[${i + 1}/${validRows.length}] ❌ ${row.name || row.phone}: ${resData.message}`,
            success: false
          }]);
        }
      } catch (err: any) {
        setLogs(prev => [...prev, {
          text: `[${i + 1}/${validRows.length}] ❌ Error: ${err.message}`,
          success: false
        }]);
      }

      setProgress({ current: i + 1, total: validRows.length });
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    setIsProcessing(false);
    const failedCount = validRows.length - successCount;
    setSummary({ success: successCount, failed: failedCount, totalOmset });
    onBatchCompleted(createdEvents);
    
    showToast(
      `Batch selesai: ${successCount} berhasil, ${failedCount} gagal`,
      failedCount === 0 ? 'success' : successCount > 0 ? 'warning' : 'error',
      eventName === 'Purchase' ? `Total omset: ${formatRupiah(totalOmset)}` : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-[var(--shadow-modal)] max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Kirim Closing Massal (Batch)</h2>
              <p className="text-xs text-slate-500">Paste rekap dari Google Sheets / Excel sekaligus ke Meta CAPI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Event Type */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Tipe Event:</span>
            <div className="flex gap-2">
              {(['Purchase', 'Lead'] as MetaEventType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventName(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    eventName === type
                      ? type === 'Purchase' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'Purchase' ? '💰 Purchase (Omset)' : '🎯 Lead (Prospek)'}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Format: <code className="text-slate-500 font-mono text-[11px]">No.WA, Nama, Nominal, Produk, Kota</code>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{parsedRows.length} baris ({validRows.length} valid)</span>
                {parsedRows.length > 0 && !isProcessing && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showPreview ? 'Sembunyikan' : 'Preview'}
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows={6}
              value={inputText}
              disabled={isProcessing}
              onChange={(e) => { setInputText(e.target.value); setShowPreview(false); setSummary(null); }}
              placeholder="08123456789, Budi, 350000, Paket A, Jakarta"
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed resize-none"
            />
          </div>

          {/* Preview Table */}
          {showPreview && parsedRows.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-hidden animate-slide-down">
              <div className="bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                Preview Data ({parsedRows.length} baris)
              </div>
              <div className="overflow-x-auto max-h-48 overflow-y-auto modal-scroll">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/80 text-[10px] text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">No. WA</th>
                      <th className="px-3 py-2 text-left">Nama</th>
                      <th className="px-3 py-2 text-right">Nominal</th>
                      <th className="px-3 py-2 text-left">Produk</th>
                      <th className="px-3 py-2 text-center">Valid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, i) => (
                      <tr key={i} className={row.isValid ? '' : 'bg-rose-50'}>
                        <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-1.5 font-mono">{row.phone || '—'}</td>
                        <td className="px-3 py-1.5">{row.name || '—'}</td>
                        <td className="px-3 py-1.5 text-right font-medium">{row.value > 0 ? `Rp ${row.value.toLocaleString('id-ID')}` : '—'}</td>
                        <td className="px-3 py-1.5 text-slate-600">{row.product}</td>
                        <td className="px-3 py-1.5 text-center">
                          {row.isValid
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                            : <AlertCircle className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex justify-between text-xs font-medium text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim ke Meta CAPI...
                </span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 transition-all duration-500 ease-out"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          {summary && !isProcessing && (
            <div className={`p-4 rounded-xl border animate-slide-down ${
              summary.failed === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <p className={`text-sm font-semibold ${summary.failed === 0 ? 'text-emerald-800' : 'text-amber-800'}`}>
                {summary.failed === 0 ? '✅ Semua data berhasil dikirim!' : `⚠️ ${summary.success} berhasil, ${summary.failed} gagal`}
              </p>
              <div className="mt-1 flex gap-4 text-xs">
                <span className="text-emerald-700">✅ Berhasil: {summary.success}</span>
                {summary.failed > 0 && <span className="text-rose-700">❌ Gagal: {summary.failed}</span>}
                {summary.totalOmset > 0 && <span className="text-emerald-700 font-semibold">💰 {formatRupiah(summary.totalOmset)}</span>}
              </div>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="max-h-36 overflow-y-auto p-3 bg-slate-900 rounded-xl font-mono text-[11px] space-y-0.5 modal-scroll">
              {logs.map((log, idx) => (
                <div key={idx} className={log.success ? 'text-emerald-400' : 'text-rose-400'}>
                  {log.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-30 transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleStartBatch}
            disabled={isProcessing || validRows.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses {progress.current}/{progress.total}...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim {validRows.length} Data ke Meta CAPI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
