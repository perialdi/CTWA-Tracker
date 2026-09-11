import { DollarSign, ShoppingBag, Users, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { ClosingEvent, MetaCapiConfig } from '../types';
import { formatRupiah } from '../utils/formatters';

interface StatsHeaderProps {
  events: ClosingEvent[];
  config: MetaCapiConfig;
}

export function StatsHeader({ events, config }: StatsHeaderProps) {
  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const todayEvents = events.filter((e) => e.createdAt.startsWith(todayStr));
  
  const totalOmsetToday = todayEvents
    .filter((e) => e.eventName === 'Purchase' && e.status === 'success')
    .reduce((sum, e) => sum + e.value, 0);

  const totalClosingCount = todayEvents.filter((e) => e.eventName === 'Purchase' && e.status === 'success').length;
  const totalLeadCount = todayEvents.filter((e) => e.eventName === 'Lead' && e.status === 'success').length;

  const isConfigured = Boolean(config.pixelId && config.accessToken);
  const isTestMode = Boolean(config.testEventCode);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Omset Hari Ini */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Omset Closing Hari Ini</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            {formatRupiah(totalOmsetToday)}
          </h3>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            Terikirim ke Meta Ads CAPI
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Jumlah Closing */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Closing (Purchase)</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            {totalClosingCount} <span className="text-sm font-normal text-slate-500">transaksi</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Event pembelian selesai
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
          <ShoppingBag className="w-6 h-6" />
        </div>
      </div>

      {/* Jumlah Leads */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prospek Masuk (Leads)</p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
            {totalLeadCount} <span className="text-sm font-normal text-slate-500">calon pembeli</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hot & Warm leads WhatsApp
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Status Koneksi CAPI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Meta CAPI</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {isTestMode ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Mode Uji Aktif
              </span>
            ) : isConfigured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Siap Kirim Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Belum Terhubung
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono truncate max-w-[140px]">
            {config.pixelId ? `ID: ${config.pixelId}` : 'Klik Pengaturan'}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
          isTestMode 
            ? 'bg-amber-50 text-amber-600 border-amber-100'
            : isConfigured 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          <ShieldCheck className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
