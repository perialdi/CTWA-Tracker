import { useState } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, X, Sparkles } from 'lucide-react';
import { formatIndonesianPhone } from '../utils/formatters';

interface WaLinkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaLinkGeneratorModal({ isOpen, onClose }: WaLinkGeneratorModalProps) {
  const [phone, setPhone] = useState('');
  const [campaignName, setCampaignName] = useState('PROMO-SKINCARE');
  const [productName, setProductName] = useState('Paket Glowing 3in1');
  const [customGreeting, setCustomGreeting] = useState('Halo Admin, saya mau pesan');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const phoneInfo = formatIndonesianPhone(phone);
  const normalizedNumber = phoneInfo.normalized || '628xxxxxxxx';

  // Build message with tracking tag
  const message = `${customGreeting} *${productName}*. Tolong infokan total harganya ya kak.\n\n[Ref: ${campaignName.toUpperCase()}]`;
  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${normalizedNumber}?text=${encodedMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(waUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Generator Link WhatsApp + Tracking Iklan</h2>
              <p className="text-xs text-slate-500">Buat link wa.me dengan kode referensi iklan otomatis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor WhatsApp CS Anda
            </label>
            <input 
              type="text"
              placeholder="Contoh: 081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Kampanye Iklan / Adset
              </label>
              <input 
                type="text"
                placeholder="Contoh: META-ADS-01"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk
              </label>
              <input 
                type="text"
                placeholder="Contoh: Paket 1"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pesan Pembuka WhatsApp
            </label>
            <input 
              type="text"
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hasil Link WhatsApp:</span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Siap Dipasang di Iklan Meta Ads
              </span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700 break-all select-all">
              {waUrl}
            </div>
            <div className="text-xs text-slate-500 italic">
              Pratinjau chat yang dikirim customer: <br />
              <span className="text-slate-800 whitespace-pre-line not-italic font-sans block mt-1 p-2 bg-emerald-50/50 rounded border border-emerald-100">
                {message}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            Tes Buka Chat WhatsApp
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Tersalin ke Clipboard!' : 'Salin Link WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
