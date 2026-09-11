import { useState, ReactNode } from 'react';
import { 
  Search, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Sparkles, 
  Trash2,
  X,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar
} from 'lucide-react';
import { ClosingEvent, MetaCapiConfig } from '../types';
import { formatRupiah, formatDateIndo, formatIndonesianPhone, exportToCsv } from '../utils/formatters';
import { EmqIndicator } from './EmqIndicator';

interface ClosingHistoryTableProps {
  events: ClosingEvent[];
  config: MetaCapiConfig;
  onClearHistory: () => void;
  onResendEvent: (event: ClosingEvent) => void;
}

type DateFilter = 'all' | 'today' | '7d' | '30d';

const PAGE_SIZE = 10;

function getDateFilterStart(filter: DateFilter): Date | null {
  const now = new Date();
  if (filter === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (filter === '7d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (filter === '30d') {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
}

export function ClosingHistoryTable({ 
  events, 
  config, 
  onClearHistory, 
  onResendEvent 
}: ClosingHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventModal, setSelectedEventModal] = useState<ClosingEvent | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Filtering
  const dateStart = getDateFilterStart(dateFilter);
  const filteredEvents = events.filter((evt) => {
    const matchesSearch = 
      evt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.customerPhone.includes(searchTerm) ||
      evt.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.adminName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEvent = filterEvent === 'ALL' || evt.eventName === filterEvent;

    const matchesDate = !dateStart || new Date(evt.createdAt) >= dateStart;

    return matchesSearch && matchesEvent && matchesDate;
  });

  const totalFilteredOmset = filteredEvents
    .filter((e) => e.status === 'success' && e.eventName === 'Purchase')
    .reduce((sum, item) => sum + item.value, 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEvents = filteredEvents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (val: string) => {
    setFilterEvent(val);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (val: DateFilter) => {
    setDateFilter(val);
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    if (filteredEvents.length === 0) return;

    const headers = [
      'Order ID', 'Waktu', 'Tipe Event', 'Nama Customer', 'No WhatsApp',
      'Kota', 'Email', 'Produk', 'Qty', 'Nilai Omset (IDR)',
      'Status Lead', 'Nama CS', 'Status CAPI', 'Mode Uji', 'Event ID Meta', 'fbtrace_id'
    ];

    const rows = filteredEvents.map((e) => [
      e.orderId,
      e.createdAt,
      e.eventName,
      e.customerName,
      e.customerPhone,
      e.customerCity || '',
      e.customerEmail || '',
      e.productName,
      String(e.quantity),
      String(e.value),
      e.leadQuality || '',
      e.adminName,
      e.status,
      e.testMode ? 'Ya' : 'Tidak',
      e.eventId,
      e.fbtraceId || ''
    ]);

    exportToCsv(
      [headers, ...rows],
      `rekap-closing-meta-capi-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const handleCopyJson = () => {
    if (!selectedEventModal) return;
    navigator.clipboard.writeText(JSON.stringify(selectedEventModal, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const DATE_FILTERS: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'today', label: 'Hari Ini' },
    { value: '7d', label: '7 Hari' },
    { value: '30d', label: '30 Hari' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span>Riwayat Pengiriman ke Meta CAPI</span>
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredEvents.length} data
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total Omset Terverifikasi:{' '}
              <strong className="text-emerald-600">{formatRupiah(totalFilteredOmset)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, no WA, produk..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Filter Event */}
            <select
              value={filterEvent}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Semua Event</option>
              <option value="Purchase">Purchase (Closing)</option>
              <option value="Lead">Lead (Prospek)</option>
              <option value="InitiateCheckout">Initiate Checkout</option>
              <option value="Contact">Contact</option>
            </select>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredEvents.length === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>

            {/* Clear history */}
            {events.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Hapus seluruh riwayat pengiriman lokal ini?')) {
                    onClearHistory();
                  }
                }}
                title="Hapus riwayat lokal"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 mt-3">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {DATE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleDateFilterChange(value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                dateFilter === value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="py-3 px-4">Waktu & Order ID</th>
              <th className="py-3 px-4">Pelanggan WhatsApp</th>
              <th className="py-3 px-4">Tipe Event</th>
              <th className="py-3 px-4">Produk & CS</th>
              <th className="py-3 px-4 text-right">Nilai Omset</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-8 h-8 opacity-30" />
                    <p>
                      {filteredEvents.length === 0 && events.length > 0
                        ? 'Tidak ada data yang cocok dengan filter.'
                        : 'Belum ada data event. Isi formulir di atas untuk memulai.'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEvents.map((evt) => {
                const phoneInfo = formatIndonesianPhone(evt.customerPhone);
                return (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors table-row-enter">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-medium text-slate-800">{evt.orderId}</div>
                      <div className="text-[11px] text-slate-400">{formatDateIndo(evt.createdAt)}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{evt.customerName || 'Customer WA'}</div>
                      <div className="font-mono text-slate-500 text-[11px]">
                        {phoneInfo.display || evt.customerPhone}
                      </div>
                      {evt.customerCity && (
                        <span className="text-[10px] text-slate-400">{evt.customerCity}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] ${
                          evt.eventName === 'Purchase'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : evt.eventName === 'Lead'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : evt.eventName === 'InitiateCheckout'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {evt.eventName === 'Purchase' && '💰'}
                        {evt.eventName === 'Lead' && '🎯'}
                        {evt.eventName}
                      </span>
                      {evt.testMode && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Sparkles className="w-2.5 h-2.5" /> Test
                        </span>
                      )}
                      {evt.emqScore !== undefined && (
                        <div className="mt-1">
                          <EmqIndicator
                            phone={evt.customerPhone}
                            name={evt.customerName}
                            email={evt.customerEmail}
                            city={evt.customerCity}
                            compact
                          />
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 line-clamp-1">{evt.productName}</div>
                      <div className="text-[11px] text-slate-400">
                        {evt.quantity} pcs • CS: {evt.adminName}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-800">
                        {evt.value > 0 ? formatRupiah(evt.value) : '-'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {evt.status === 'success' ? (
                        <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terkirim</span>
                        </div>
                      ) : (
                        <div 
                          title={evt.errorMessage || 'Gagal'}
                          className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-medium cursor-help"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Gagal</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedEventModal(evt)}
                          title="Lihat Detail Log & Hash Meta"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {evt.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => onResendEvent(evt)}
                            title="Kirim Ulang ke Meta CAPI"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Menampilkan {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredEvents.length)} dari {filteredEvents.length} data
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (safePage <= 3) page = i + 1;
              else if (safePage >= totalPages - 2) page = totalPages - 4 + i;
              else page = safePage - 2 + i;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    page === safePage
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-[var(--shadow-modal)] max-w-lg w-full border border-slate-200 overflow-hidden my-6 animate-scale-in">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Detail Event Meta CAPI</h3>
                <p className="text-xs text-slate-500">Order ID: {selectedEventModal.orderId}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto modal-scroll">
              {/* Summary */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <Row label="Status" value={
                  <span className={selectedEventModal.status === 'success' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {selectedEventModal.status.toUpperCase()}
                  </span>
                } />
                <Row label="Event Name" value={selectedEventModal.eventName} />
                <Row label="Customer" value={`${selectedEventModal.customerName} — ${selectedEventModal.customerPhone}`} />
                <Row label="Produk" value={`${selectedEventModal.productName} × ${selectedEventModal.quantity}`} />
                {selectedEventModal.value > 0 && (
                  <Row label="Nilai" value={<strong className="text-emerald-700">{formatRupiah(selectedEventModal.value)}</strong>} />
                )}
                <Row label="Event ID" value={<span className="font-mono text-slate-700 text-[11px]">{selectedEventModal.eventId}</span>} />
                {selectedEventModal.fbtraceId && (
                  <Row label="fbtrace_id" value={<span className="font-mono text-blue-600 text-[11px]">{selectedEventModal.fbtraceId}</span>} />
                )}
                {selectedEventModal.emqScore !== undefined && (
                  <Row label="EMQ Score" value={<span className="font-semibold">{selectedEventModal.emqScore}/100</span>} />
                )}
                {selectedEventModal.errorMessage && (
                  <div className="mt-2 p-2 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs">
                    <strong>Error:</strong> {selectedEventModal.errorMessage}
                  </div>
                )}
              </div>

              {/* JSON */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600 font-semibold">Data Lengkap (JSON):</span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[11px]"
                  >
                    {copiedJson ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedJson ? 'Tersalin' : 'Salin JSON'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] leading-relaxed modal-scroll">
                  {JSON.stringify(selectedEventModal, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEventModal(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3 text-xs">
      <span className="text-slate-500 shrink-0">{label}:</span>
      <span className="text-slate-800 text-right">{value}</span>
    </div>
  );
}
