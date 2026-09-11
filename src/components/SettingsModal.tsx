import { useState, useEffect, ReactNode } from 'react';
import { MetaCapiConfig, ProductPreset } from '../types';
import { 
  KeyRound, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Sparkles,
  X,
  Package,
  Plus,
  Trash2,
  Settings2,
  Edit3,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MetaCapiConfig;
  onSave: (newConfig: MetaCapiConfig) => void;
}

type TabId = 'creds' | 'presets' | 'prefs';

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'creds', label: 'Kredensial CAPI', icon: <KeyRound className="w-4 h-4" /> },
  { id: 'presets', label: 'Preset Produk', icon: <Package className="w-4 h-4" /> },
  { id: 'prefs', label: 'Preferensi', icon: <Settings2 className="w-4 h-4" /> },
];

export function SettingsModal({ isOpen, onClose, config, onSave }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('creds');

  // Credentials tab
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; pixelName?: string } | null>(null);

  // Preferences tab
  const [defaultAdminName, setDefaultAdminName] = useState('');
  const [actionSource, setActionSource] = useState<'chat' | 'other' | 'website'>('chat');

  // Product presets tab
  const [productPresets, setProductPresets] = useState<ProductPreset[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sync state from config when modal opens
  useEffect(() => {
    if (isOpen) {
      setPixelId(config.pixelId || '');
      setAccessToken(config.accessToken || '');
      setTestEventCode(config.testEventCode || '');
      setDefaultAdminName(config.defaultAdminName || '');
      setActionSource(config.actionSource || 'chat');
      setProductPresets(config.productPresets || []);
      setTestResult(null);
      setActiveTab('creds');
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!pixelId.trim() || !accessToken.trim()) {
      setTestResult({ success: false, message: 'Harap isi Pixel ID dan Access Token terlebih dahulu.' });
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
        setTestResult({ success: true, message: data.message, pixelName: data.pixelName });
      } else {
        setTestResult({ success: false, message: data.message || 'Gagal memverifikasi ke Meta API.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Koneksi ke server gagal.' });
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
      actionSource,
      productPresets
    });
    onClose();
  };

  // Product preset handlers
  const handleAddPreset = () => {
    if (!newProductName.trim()) return;
    if (editingId) {
      setProductPresets(prev => prev.map(p => 
        p.id === editingId 
          ? { ...p, name: newProductName.trim(), price: parseInt(newProductPrice) || 0, category: newProductCategory.trim() }
          : p
      ));
      setEditingId(null);
    } else {
      const preset: ProductPreset = {
        id: `preset_${Date.now()}`,
        name: newProductName.trim(),
        price: parseInt(newProductPrice) || 0,
        category: newProductCategory.trim()
      };
      setProductPresets(prev => [...prev, preset]);
    }
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCategory('');
  };

  const handleEditPreset = (preset: ProductPreset) => {
    setEditingId(preset.id);
    setNewProductName(preset.name);
    setNewProductPrice(preset.price > 0 ? preset.price.toString() : '');
    setNewProductCategory(preset.category);
  };

  const handleDeletePreset = (id: string) => {
    setProductPresets(prev => prev.filter(p => p.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductCategory('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCategory('');
  };

  // Pixel ID validation — should be 13-16 digit number
  const pixelIdValid = !pixelId || /^\d{13,16}$/.test(pixelId.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-[var(--shadow-modal)] max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Pengaturan Meta CAPI</h2>
              <p className="text-xs text-slate-500">Konfigurasi Pixel, Token, dan Preset Produk</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-h-[60vh] overflow-y-auto modal-scroll">
          
          {/* === CREDENTIALS TAB === */}
          {activeTab === 'creds' && (
            <div className="p-6 space-y-5">
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
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-colors ${
                    pixelId && !pixelIdValid ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                {pixelId && !pixelIdValid && (
                  <p className="text-xs text-rose-600 mt-1">Pixel ID biasanya 13-16 digit angka.</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Meta Events Manager → Pengaturan → ID Kumpulan Data / ID Piksel.
                </p>
              </div>

              {/* Access Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Meta CAPI Access Token <span className="text-red-500">*</span>
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
                <textarea 
                  rows={3}
                  placeholder="Contoh: EAAGm0PX4ZC8kBA... (System User Token)"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all ${
                    !showToken && accessToken ? 'blur-sm hover:blur-none' : ''
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Events Manager → Pengaturan → Conversions API → "Generate Access Token".
                </p>
              </div>

              {/* Test Event Code */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Test Event Code (Opsional)
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Testing</span>
                </div>
                <input 
                  type="text"
                  placeholder="Contoh: TEST12345"
                  value={testEventCode}
                  onChange={(e) => setTestEventCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-lg border border-amber-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono uppercase"
                />
                <p className="text-xs text-amber-800/80 mt-1.5">
                  Isi untuk mode uji — event tidak masuk ke data iklan live. Kosongkan untuk mode live.
                </p>
              </div>

              {/* Test Connection */}
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
                    className={`mt-3 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-slide-down ${
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
          )}

          {/* === PRESET PRODUCTS TAB === */}
          {activeTab === 'presets' && (
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Tambahkan produk yang sering dijual. Preset akan muncul sebagai shortcut di form closing.
              </p>

              {/* Add/Edit Form */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700">
                  {editingId ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Nama Produk / Paket *"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Harga (Rp, opsional)"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Kategori (opsional)"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddPreset}
                    disabled={!newProductName.trim()}
                    className="flex-1 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                  >
                    {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              {/* Preset List */}
              {productPresets.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Belum ada preset produk. Tambahkan di atas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productPresets.map(preset => (
                    <div
                      key={preset.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        editingId === preset.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{preset.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {preset.price > 0 && (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              Rp {preset.price.toLocaleString('id-ID')}
                            </span>
                          )}
                          {preset.category && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {preset.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditPreset(preset)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(preset.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === PREFERENCES TAB === */}
          {activeTab === 'prefs' && (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Default CS / Admin
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: Sarah / CS-01"
                  value={defaultAdminName}
                  onChange={(e) => setDefaultAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Nama ini akan auto-terisi di form closing sebagai default.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sumber Aksi (Action Source)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'chat', label: 'Chat', desc: 'WhatsApp / Messenger' },
                    { value: 'other', label: 'Offline', desc: 'Manual / Lainnya' },
                    { value: 'website', label: 'Website', desc: 'From web' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActionSource(opt.value as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        actionSource === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Untuk WhatsApp, gunakan <strong>Chat</strong>. Ini mempengaruhi kualitas event di Meta.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-700">Info Konfigurasi Saat Ini:</p>
                <p>Pixel ID: <code className="font-mono bg-white px-1 rounded border border-slate-200">{config.pixelId || '—'}</code></p>
                <p>Token: {config.accessToken ? `${config.accessToken.substring(0, 15)}...` : '—'}</p>
                <p>Mode: {config.testEventCode ? `🧪 Test (${config.testEventCode})` : '🟢 Live'}</p>
                <p>Preset Produk: {config.productPresets?.length || 0} item</p>
              </div>
            </div>
          )}
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
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
