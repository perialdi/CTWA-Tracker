import { useState, useEffect } from 'react';
import { 
  Settings, 
  HelpCircle, 
  Layers, 
  MessageSquare, 
  Share2, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { MetaCapiConfig, ClosingEvent } from './types';
import { StatsHeader } from './components/StatsHeader';
import { ClosingForm } from './components/ClosingForm';
import { ClosingHistoryTable } from './components/ClosingHistoryTable';
import { SettingsModal } from './components/SettingsModal';
import { QuickGuideModal } from './components/QuickGuideModal';
import { WaLinkGeneratorModal } from './components/WaLinkGeneratorModal';
import { BatchClosingModal } from './components/BatchClosingModal';

const DEFAULT_CONFIG: MetaCapiConfig = {
  pixelId: '',
  accessToken: '',
  testEventCode: '',
  autoTestMode: false,
  defaultCurrency: 'IDR',
  defaultAdminName: 'CS Admin',
  actionSource: 'chat'
};

const INITIAL_SAMPLE_EVENTS: ClosingEvent[] = [
  {
    id: 'evt_sample_1',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    eventTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    eventName: 'Purchase',
    customerName: 'Anisa Maharani',
    customerPhone: '081298765432',
    customerEmail: 'anisa.m@gmail.com',
    customerCity: 'Jakarta Selatan',
    value: 450000,
    currency: 'IDR',
    productName: 'Paket Skincare Glowing 3in1',
    quantity: 1,
    orderId: 'WA-260910-4821',
    adminName: 'CS Sarah',
    fbclid: 'META-IG-REELS-02',
    status: 'success',
    testMode: false,
    eventId: 'wa_event_WA-260910-4821_1725968400',
    fbtraceId: 'E_fbtrace_94821_demo'
  },
  {
    id: 'evt_sample_2',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    eventTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    eventName: 'Lead',
    customerName: 'Dimas Wicaksono',
    customerPhone: '085711223344',
    customerCity: 'Surabaya',
    value: 0,
    currency: 'IDR',
    productName: 'Paket Reseller Starter',
    quantity: 1,
    orderId: 'WA-260910-1092',
    leadQuality: 'Hot Lead (Siap Bayar)',
    adminName: 'CS Sarah',
    status: 'success',
    testMode: false,
    eventId: 'wa_event_WA-260910-1092_1725957600',
    fbtraceId: 'E_fbtrace_10922_demo'
  }
];

export default function App() {
  // Load config from localStorage
  const [config, setConfig] = useState<MetaCapiConfig>(() => {
    try {
      const saved = localStorage.getItem('meta_capi_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Load events history from localStorage
  const [events, setEvents] = useState<ClosingEvent[]>(() => {
    try {
      const saved = localStorage.getItem('meta_closing_events');
      return saved ? JSON.parse(saved) : INITIAL_SAMPLE_EVENTS;
    } catch {
      return INITIAL_SAMPLE_EVENTS;
    }
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isWaLinkOpen, setIsWaLinkOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('meta_capi_config', JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('meta_closing_events', JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save events:', e);
    }
  }, [events]);

  const handleSaveConfig = (newConfig: MetaCapiConfig) => {
    setConfig(newConfig);
  };

  const handleEventSent = (newEvent: ClosingEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
  };

  const handleBatchCompleted = (newEvents: ClosingEvent[]) => {
    setEvents((prev) => [...newEvents, ...prev]);
  };

  const handleClearHistory = () => {
    setEvents([]);
  };

  const handleResendEvent = async (eventToResend: ClosingEvent) => {
    if (!config.pixelId || !config.accessToken) {
      setIsSettingsOpen(true);
      return;
    }

    try {
      const payload = {
        pixelId: config.pixelId,
        accessToken: config.accessToken,
        testEventCode: config.testEventCode,
        eventName: eventToResend.eventName,
        phone: eventToResend.customerPhone,
        name: eventToResend.customerName,
        email: eventToResend.customerEmail,
        city: eventToResend.customerCity,
        value: eventToResend.value,
        currency: eventToResend.currency,
        productName: eventToResend.productName,
        quantity: eventToResend.quantity,
        orderId: eventToResend.orderId,
        adminName: eventToResend.adminName,
        actionSource: config.actionSource || 'chat',
        fbclid: eventToResend.fbclid
      };

      const res = await fetch('/api/send-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventToResend.id
              ? {
                  ...e,
                  status: 'success',
                  fbtraceId: data.fbtraceId,
                  errorMessage: undefined,
                  testMode: Boolean(config.testEventCode)
                }
              : e
          )
        );
        alert(`Event ${eventToResend.orderId} berhasil dikirim ulang ke Meta CAPI!`);
      } else {
        alert(`Gagal mengirim ulang: ${data.message || 'Ditolak oleh Meta'}`);
      }
    } catch (err: any) {
      alert(`Error koneksi: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Meta CAPI WhatsApp Tracker
                </h1>
                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 hidden sm:inline">
                  Tanpa Biaya WA Cloud API
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sinkronisasi Omset &amp; Leads Closing WhatsApp Langsung ke Meta Ads Manager
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Kirim Massal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWaLinkOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Link WA + Ref</span>
            </button>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Panduan CAPI</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan CAPI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Metric Cards */}
        <StatsHeader events={events} config={config} />

        {/* Closing Entry Form */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Form Input Closing WhatsApp ke Meta Ads
            </h2>
            <span className="text-xs text-slate-500">
              Enkripsi SHA-256 Otomatis Sesuai Regulasi Meta
            </span>
          </div>
          <ClosingForm
            config={config}
            onEventSent={handleEventSent}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

        {/* History Table */}
        <ClosingHistoryTable
          events={events}
          config={config}
          onClearHistory={handleClearHistory}
          onResendEvent={handleResendEvent}
        />
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />

      <QuickGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <WaLinkGeneratorModal
        isOpen={isWaLinkOpen}
        onClose={() => setIsWaLinkOpen(false)}
      />

      <BatchClosingModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        config={config}
        onBatchCompleted={handleBatchCompleted}
      />
    </div>
  );
}
