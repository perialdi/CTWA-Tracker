import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to hash data according to Meta CAPI specification (SHA-256 hex)
function hashSha256(value: string): string {
  if (!value) return '';
  const trimmed = value.trim().toLowerCase();
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

// Normalize Indonesian/International phone number according to Meta requirements:
// Digits only, country code included, no leading zeros or symbols.
function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // If Indonesian number starts with '0', replace with '62'
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// Format Name into First and Last name
function splitName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

// Test Meta CAPI Credentials (Pixel ID & Access Token)
app.post('/api/test-connection', async (req: Request, res: Response) => {
  try {
    const { pixelId, accessToken } = req.body;
    const resolvedPixelId = (pixelId || process.env.META_PIXEL_ID || '').trim();
    const resolvedAccessToken = (accessToken || process.env.META_CAPI_ACCESS_TOKEN || '').trim();

    if (!resolvedPixelId) {
      return res.status(400).json({
        success: false,
        message: 'Pixel ID Meta belum diisi.'
      });
    }

    if (!resolvedAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Meta CAPI Access Token belum diisi.'
      });
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${resolvedPixelId}?fields=name,is_unavailable&access_token=${resolvedAccessToken}`
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(400).json({
        success: false,
        message: data.error?.message || 'Gagal memverifikasi token atau Pixel ID.',
        details: data.error
      });
    }

    return res.json({
      success: true,
      message: 'Koneksi ke Meta CAPI berhasil diverifikasi!',
      pixelName: data.name || `Pixel ID: ${resolvedPixelId}`,
      pixelId: resolvedPixelId
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat memeriksa koneksi ke Meta Graph API.'
    });
  }
});

// Endpoint to send event to Meta Conversions API
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

    // Process user data with SHA-256 hashing according to Meta standards
    const userData: Record<string, any> = {};

    if (phone) {
      const normalizedPhone = normalizePhoneNumber(phone);
      userData.ph = [hashSha256(normalizedPhone)];
    }

    if (email) {
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

    // Default country to Indonesia ('id') hashed if not specified
    userData.country = [hashSha256('id')];

    // Add Client IP and User Agent to improve Meta Event Match Quality
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
      // If user provided fbclid, format as fbc according to Meta standard: fb.1.<creationTime>.<fbclid>
      const now = Date.now();
      userData.fbc = fbclid.startsWith('fb.') ? fbclid : `fb.1.${now}.${fbclid}`;
    }
    if (fbp) {
      userData.fbp = fbp;
    }

    // Custom Data
    const customData: Record<string, any> = {
      currency: currency || 'IDR'
    };

    const numericValue = parseFloat(value);
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

    // Meta Event Object
    const eventTimeUnix = eventTime ? Math.floor(new Date(eventTime).getTime() / 1000) : Math.floor(Date.now() / 1000);
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

    // If test event code is provided, include it
    if (resolvedTestCode) {
      requestBody.test_event_code = resolvedTestCode;
    }

    const metaApiUrl = `https://graph.facebook.com/v21.0/${resolvedPixelId}/events?access_token=${resolvedAccessToken}`;

    const response = await fetch(metaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const metaResult = await response.json();

    if (!response.ok || metaResult.error) {
      return res.status(response.status >= 400 && response.status < 500 ? response.status : 400).json({
        success: false,
        message: metaResult.error?.message || 'Meta CAPI menolak data yang dikirim.',
        metaError: metaResult.error,
        eventId,
        orderId: uniqueOrderId
      });
    }

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
    console.error('Meta CAPI Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan sistem internal saat mengirim event ke Meta CAPI.'
    });
  }
});

// Start Express server with Vite middleware
async function startServer() {
  // Vite middleware for development
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
