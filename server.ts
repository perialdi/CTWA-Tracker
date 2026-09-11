import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 3000;

// =============================================
// MIDDLEWARE
// =============================================

app.use(express.json({ limit: '2mb' }));

// Rate limiting: max 120 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Harap tunggu 1 menit sebelum mencoba lagi.'
  }
});

// Stricter limit for test-connection endpoint
const testLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan koneksi. Tunggu 1 menit.'
  }
});

app.use('/api/', apiLimiter);

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Hash data with SHA-256 according to Meta CAPI specification
 */
function hashSha256(value: string): string {
  if (!value) return '';
  const trimmed = value.trim().toLowerCase();
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

/**
 * Normalize Indonesian/International phone number to Meta format (digits only, with country code)
 */
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Split full name into first and last name
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Log with timestamp and context
 */
function log(level: 'INFO' | 'WARN' | 'ERROR', context: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [${context}]`;
  if (data) {
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](`${prefix} ${message}`, data);
  } else {
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](`${prefix} ${message}`);
  }
}

// =============================================
// API ENDPOINTS
// =============================================

/**
 * Test Meta CAPI Credentials (Pixel ID & Access Token)
 */
app.post('/api/test-connection', testLimiter, async (req: Request, res: Response) => {
  try {
    const { pixelId, accessToken } = req.body;
    const resolvedPixelId = (pixelId || process.env.META_PIXEL_ID || '').trim();
    const resolvedAccessToken = (accessToken || process.env.META_CAPI_ACCESS_TOKEN || '').trim();

    if (!resolvedPixelId) {
      return res.status(400).json({ success: false, message: 'Pixel ID Meta belum diisi.' });
    }

    // Validate Pixel ID format (should be 13-16 digit number)
    if (!/^\d{13,16}$/.test(resolvedPixelId)) {
      return res.status(400).json({ success: false, message: 'Pixel ID tidak valid. Harus berupa angka 13-16 digit.' });
    }

    if (!resolvedAccessToken) {
      return res.status(400).json({ success: false, message: 'Meta CAPI Access Token belum diisi.' });
    }

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${resolvedPixelId}?fields=name,is_unavailable&access_token=${resolvedAccessToken}`
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      log('WARN', 'test-connection', 'Connection test failed', data.error);
      return res.status(400).json({
        success: false,
        message: data.error?.message || 'Gagal memverifikasi token atau Pixel ID.',
        details: data.error
      });
    }

    log('INFO', 'test-connection', `Connection verified for pixel: ${resolvedPixelId}`);
    return res.json({
      success: true,
      message: 'Koneksi ke Meta CAPI berhasil diverifikasi!',
      pixelName: data.name || `Pixel ID: ${resolvedPixelId}`,
      pixelId: resolvedPixelId
    });
  } catch (error: any) {
    log('ERROR', 'test-connection', 'Exception', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat memeriksa koneksi ke Meta Graph API.'
    });
  }
});

/**
 * Send event to Meta Conversions API
 */
app.post('/api/send-event', async (req: Request, res: Response) => {
  try {
    const {
      pixelId,
      accessToken,
      testEventCode,
      eventName = 'Purchase',
      phone,
      name,
      email,
      city,
      zipCode,
      value = 0,
      currency = 'IDR',
      productName,
      productCategory,
      quantity = 1,
      orderId,
      actionSource = 'chat',
      eventTime,
      fbclid,
      fbp,
      adminName,
      leadQuality,
      notes
    } = req.body;

    const resolvedPixelId = (pixelId || process.env.META_PIXEL_ID || '').trim();
    const resolvedAccessToken = (accessToken || process.env.META_CAPI_ACCESS_TOKEN || '').trim();
    const resolvedTestCode = (testEventCode || process.env.META_TEST_EVENT_CODE || '').trim();

    // === Input Validation ===
    if (!resolvedPixelId) {
      return res.status(400).json({
        success: false,
        message: 'Pixel ID Meta wajib diisi. Masukkan di menu Pengaturan atau form.'
      });
    }

    if (!resolvedAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Meta CAPI Access Token wajib diisi. Masukkan di menu Pengaturan.'
      });
    }

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'Minimal Nomor WhatsApp atau Email pelanggan harus diisi agar Meta dapat mencocokkan konversi.'
      });
    }

    // Validate event name
    const VALID_EVENTS = ['Purchase', 'Lead', 'InitiateCheckout', 'Contact', 'CompleteRegistration', 'ViewContent', 'AddToCart'];
    if (!VALID_EVENTS.includes(eventName)) {
      return res.status(400).json({
        success: false,
        message: `Event name tidak valid: ${eventName}. Valid: ${VALID_EVENTS.join(', ')}`
      });
    }

    // Validate value for Purchase
    const numericValue = parseFloat(value);
    if (eventName === 'Purchase' && (isNaN(numericValue) || numericValue < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Nilai transaksi (value) untuk event Purchase harus berupa angka positif.'
      });
    }

    // === Build User Data with SHA-256 Hashing ===
    const userData: Record<string, any> = {};

    if (phone) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (normalizedPhone) userData.ph = [hashSha256(normalizedPhone)];
    }

    if (email && email.includes('@')) {
      userData.em = [hashSha256(email)];
    }

    if (name) {
      const { firstName, lastName } = splitName(name);
      if (firstName) userData.fn = [hashSha256(firstName)];
      if (lastName) userData.ln = [hashSha256(lastName)];
    }

    if (city) {
      userData.ct = [hashSha256(city)];
    }

    if (zipCode) {
      userData.zp = [hashSha256(zipCode)];
    }

    // Default country to Indonesia ('id') hashed
    userData.country = [hashSha256('id')];

    // Add Client IP and User Agent
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    if (clientIp) {
      userData.client_ip_address = clientIp.split(',')[0].trim();
    }
    const userAgent = req.headers['user-agent'];
    if (userAgent) {
      userData.client_user_agent = userAgent;
    }

    // Add Click ID (fbc) or Browser ID (fbp) if available
    if (fbclid) {
      const now = Date.now();
      userData.fbc = fbclid.startsWith('fb.') ? fbclid : `fb.1.${now}.${fbclid}`;
    }
    if (fbp) {
      userData.fbp = fbp;
    }

    // === Build Custom Data ===
    const customData: Record<string, any> = {
      currency: currency || 'IDR'
    };

    if (!isNaN(numericValue) && numericValue > 0) {
      customData.value = numericValue;
    }

    if (productName) {
      customData.content_name = productName;
      customData.content_type = 'product';
      customData.contents = [
        {
          id: productName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30),
          quantity: parseInt(quantity, 10) || 1,
          item_price: numericValue > 0 ? numericValue : undefined
        }
      ];
    }

    if (productCategory) {
      customData.content_category = productCategory;
    }

    const uniqueOrderId = orderId || `WA_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    customData.order_id = uniqueOrderId;

    if (leadQuality) {
      customData.lead_status = leadQuality;
    }

    if (adminName) {
      customData.sales_rep = adminName;
    }

    if (notes) {
      customData.description = notes;
    }

    // === Build Event Payload ===
    const eventTimeUnix = eventTime
      ? Math.floor(new Date(eventTime).getTime() / 1000)
      : Math.floor(Date.now() / 1000);
    const eventId = `wa_event_${uniqueOrderId}_${eventTimeUnix}`;

    const eventPayload: Record<string, any> = {
      event_name: eventName,
      event_time: eventTimeUnix,
      event_id: eventId,
      event_source_url: req.headers.referer || 'https://whatsapp.com',
      action_source: actionSource || 'chat',
      user_data: userData,
      custom_data: customData
    };

    const requestBody: Record<string, any> = {
      data: [eventPayload]
    };

    if (resolvedTestCode) {
      requestBody.test_event_code = resolvedTestCode;
    }

    // === Send to Meta CAPI ===
    const metaApiUrl = `https://graph.facebook.com/v22.0/${resolvedPixelId}/events?access_token=${resolvedAccessToken}`;

    log('INFO', 'send-event', `Sending ${eventName} event for order: ${uniqueOrderId}${resolvedTestCode ? ' [TEST]' : ''}`);

    const response = await fetch(metaApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const metaResult = await response.json();

    if (!response.ok || metaResult.error) {
      log('WARN', 'send-event', `Meta rejected event: ${uniqueOrderId}`, metaResult.error);
      return res.status(response.status >= 400 && response.status < 500 ? response.status : 400).json({
        success: false,
        message: metaResult.error?.message || 'Meta CAPI menolak data yang dikirim.',
        metaError: metaResult.error,
        eventId,
        orderId: uniqueOrderId
      });
    }

    log('INFO', 'send-event', `✅ Event sent successfully: ${uniqueOrderId} | fbtrace: ${metaResult.fbtrace_id}`);

    return res.json({
      success: true,
      message: `Event ${eventName} berhasil dikirim ke Meta CAPI!`,
      eventsReceived: metaResult.events_received ?? 1,
      fbtraceId: metaResult.fbtrace_id,
      eventId,
      orderId: uniqueOrderId,
      testMode: Boolean(resolvedTestCode),
      rawMetaResponse: metaResult
    });
  } catch (error: any) {
    log('ERROR', 'send-event', 'Exception during Meta CAPI request', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan sistem internal saat mengirim event ke Meta CAPI.'
    });
  }
});

// =============================================
// SERVER STARTUP
// =============================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    log('INFO', 'server', `🚀 CTWA Tracker running on http://0.0.0.0:${PORT}`);
    log('INFO', 'server', `Meta Graph API version: v22.0`);
  });
}

startServer();
