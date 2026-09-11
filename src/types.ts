export type MetaEventType = 'Purchase' | 'Lead' | 'InitiateCheckout' | 'Contact';

export type LeadQuality = 'Hot Lead (Siap Bayar)' | 'Warm Lead (Tertarik)' | 'Cold Lead (Baru Nanya)';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface MetaCapiConfig {
  pixelId: string;
  accessToken: string;
  testEventCode: string;
  autoTestMode: boolean;
  defaultCurrency: string;
  defaultAdminName: string;
  actionSource: 'chat' | 'other' | 'website';
  productPresets: ProductPreset[];
}

export interface ClosingEvent {
  id: string;
  createdAt: string; // ISO string
  eventTime: string; // ISO string or formatted date
  eventName: MetaEventType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity?: string;
  customerZipCode?: string;
  value: number;
  currency: string;
  productName: string;
  productCategory?: string;
  quantity: number;
  orderId: string;
  leadQuality?: LeadQuality;
  adminName: string;
  fbclid?: string;
  notes?: string;
  status: 'success' | 'failed' | 'pending';
  testMode: boolean;
  eventId: string;
  fbtraceId?: string;
  errorMessage?: string;
  rawMetaResponse?: any;
  emqScore?: number; // 0-100 Event Match Quality score
}

export interface ProductPreset {
  id: string;
  name: string;
  price: number;
  category: string;
}
