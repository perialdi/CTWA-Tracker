import { useState } from 'react';
import { DollarSign, ShoppingBag, Users, ShieldCheck, Sparkles, AlertCircle, TrendingUp, CalendarDays, Clock } from 'lucide-react';
import { ClosingEvent, MetaCapiConfig } from '../types';
import { formatRupiah } from '../utils/formatters';

interface StatsHeaderProps {
  events: ClosingEvent[];
  config: MetaCapiConfig;
}

export function StatsHeader({ events, config }: StatsHeaderProps) {
  const [period, setPeriod] = useState<'today' | 'all'>('today');

  // Calculations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEvents = events.filter((e) => e.createdAt.startsWith(todayStr));
  const scopedEvents = period === 'today' ? todayEvents : events;

  const successPurchases = scopedEvents.filter(
    (e) => e.eventName === 'Purchase' && e.status === 'success'
  );
  const totalOmset = successPurchases.reduce((sum, e) => sum + e.value, 0);
  const totalClosingCount = successPurchases.length;
  const totalLeadCount = scopedEvents.filter((e) => e.eventName === 'Lead' && e.status === 'success').length;
  const avgOrderValue = totalClosingCount > 0 ? totalOmset / totalClosingCount : 0;

  // Total all-time for comparison
  const allTimePurchases = events.filter(
    (e) => e.eventName === 'Purchase' && e.status === 'success'
  );
  const allTimeOmset = allTimePurchases.reduce((sum, e) => sum + e.value, 0);

  const isConfigured = Boolean(config.pixelId && config.accessToken);
  const isTestMode = Boolean(config.testEventCode);

  return (
    <div className="space-y-3">
      {/* Period Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">
          {period === 'today'
            ? `📅 Statistik hari ini — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}`
            : `📊 Statistik semua waktu — ${events.length} total event`
          }
        </p>
        <div className="flex items-center bg-slate-100 rounded-xl p-0.5 gap-0.5">
          <button
            onClick={() => setPeriod('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === 'today'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Clock className="w-3 h-3" />
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === 'all'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarDays className="w-3 h-3" />
            Semua Waktu
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Omset Total */}
        <div className="stats-card bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[var(--shadow-card)] flex items-center justify-between col-span-2 lg:col-span-1">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {period === 'today' ? 'Omset Hari Ini' : 'Total Omset'}
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 truncate animate-count-up" key={`omset-${period}`}>
              {formatRupiah(totalOmset)}
            </h3>
            {period === 'today' && allTimeOmset > 0 && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                All-time: {formatRupiah(allTimeOmset)}
              </p>
            )}
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Terkirim ke Meta CAPI
            </p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Closing */}
        <div className="stats-card bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Closing</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 animate-count-up" key={`closing-${period}`}>
              {totalClosingCount}
              <span className="text-sm font-normal text-slate-500 ml-1">transaksi</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Purchase events</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total Leads */}
        <div className="stats-card bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Leads</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 animate-count-up" key={`lead-${period}`}>
              {totalLeadCount}
              <span className="text-sm font-normal text-slate-500 ml-1">prospek</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Hot & Warm leads</p>
          </div>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Status CAPI (merged with AOV on larger screens, swapped on smaller) */}
        <div className="stats-card bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Nilai</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 animate-count-up truncate" key={`aov-${period}`}>
              {avgOrderValue > 0 ? formatRupiah(Math.round(avgOrderValue)) : '—'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {isTestMode ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Sparkles className="w-3 h-3" /> Test Mode
                </span>
              ) : isConfigured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-3 h-3" /> Belum Setup
                </span>
              )}
            </div>
          </div>
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${
            isTestMode
              ? 'bg-amber-50 text-amber-600 border-amber-100'
              : isConfigured
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
