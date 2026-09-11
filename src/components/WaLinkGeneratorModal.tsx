import { useState } from 'react';
import { MessageSquare, Copy, Check, ExternalLink, X, Plus, Trash2, QrCode } from 'lucide-react';
import { formatIndonesianPhone } from '../utils/formatters';

interface WaLinkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LinkItem {
  id: string;
  campaign: string;
  label: string;
}

export function WaLinkGeneratorModal({ isOpen, onClose }: WaLinkGeneratorModalProps) {
  const [phone, setPhone] = useState('');
  const [customGreeting, setCustomGreeting] = useState('Halo Admin, saya mau pesan');
  const [productName, setProductName] = useState('Paket Glowing 3in1');
  const [links, setLinks] = useState<LinkItem[]>([
    { id: 'l1', campaign: 'META-IG-REELS', label: 'IG Reels' },
    { id: 'l2', campaign: 'META-FB-FEED', label: 'FB Feed' },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState('');
  const [newLabel, setNewLabel] = useState('');

  if (!isOpen) return null;

  const phoneInfo = formatIndonesianPhone(phone);
  const normalizedNumber = phoneInfo.normalized || '628xxxxxxxx';

  const buildUrl = (campaign: string) => {
    const message = `${customGreeting} *${productName}*. Tolong infokan total harganya ya kak.\n\n[Ref: ${campaign.toUpperCase()}]`;
    return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddLink = () => {
    if (!newCampaign.trim()) return;
    setLinks(prev => [...prev, {
      id: `l_${Date.now()}`,
      campaign: newCampaign.trim().toUpperCase(),
      label: newLabel.trim() || newCampaign.trim()
    }]);
    setNewCampaign('');
    setNewLabel('');
  };

  const handleDeleteLink = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-[var(--shadow-modal)] max-w-xl w-full border border-slate-200 overflow-hidden my-6 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Generator Link WA + Tracking Iklan</h2>
              <p className="text-xs text-slate-500">Buat beberapa link wa.me dengan kode tracking berbeda</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto modal-scroll">
          {/* Config Fields */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp CS Anda
              </label>
              <input 
                type="text"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
              {phoneInfo.isValid && (
                <p className="text-[11px] text-emerald-600 mt-1">✓ Format: {phoneInfo.display}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk</label>
                <input 
                  type="text"
                  placeholder="Paket Promo..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pesan Pembuka</label>
                <input 
                  type="text"
                  value={customGreeting}
                  onChange={(e) => setCustomGreeting(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Add Campaign Form */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">Tambah Kode Campaign Baru:</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Kode Campaign (contoh: IG-STORY)"
                value={newCampaign}
                onChange={(e) => setNewCampaign(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Label (opsional)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!newCampaign.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Generated Links */}
          <div className="space-y-2">
            {links.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Tambahkan kode campaign untuk membuat link.</p>
            ) : (
              links.map(link => {
                const url = buildUrl(link.campaign);
                const isCopied = copiedId === link.id;
                return (
                  <div key={link.id} className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{link.label}</span>
                        <code className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{link.campaign}</code>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowQr(showQr === link.id ? null : link.id)}
                          title="QR Code"
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Tes buka"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(link.id, url)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCopied ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100 select-all">
                      {url}
                    </p>
                    {/* QR Code placeholder — menggunakan wa.me API via QR service */}
                    {showQr === link.id && (
                      <div className="mt-2 flex items-center justify-center p-3 bg-white rounded-lg border border-slate-200 animate-fade-in">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`}
                          alt={`QR Code untuk ${link.label}`}
                          className="rounded"
                          width={150}
                          height={150}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
