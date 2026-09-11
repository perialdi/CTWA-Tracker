export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function cleanNumeric(str: string): number {
  const digits = str.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatIndonesianPhone(phone: string): { normalized: string; display: string; isValid: boolean } {
  if (!phone) return { normalized: '', display: '', isValid: false };

  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }

  // Indonesian mobile numbers are usually between 10 to 14 digits including 62
  const isValid = /^62\d{8,13}$/.test(cleaned);

  // Friendly display: +62 812-3456-7890
  let display = `+${cleaned}`;
  if (cleaned.length >= 11) {
    display = `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
  }

  return {
    normalized: cleaned,
    display,
    isValid
  };
}

export function generateOrderId(prefix = 'WA'): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${randomSuffix}`;
}

export function formatDateIndo(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Calculate Event Match Quality (EMQ) score based on customer data provided.
 * Returns a score from 0-100.
 * Phone = 40pts, Name = 20pts, Email = 25pts, City = 15pts
 */
export function calculateEMQ(data: {
  phone?: string;
  name?: string;
  email?: string;
  city?: string;
}): number {
  let score = 0;
  if (data.phone && data.phone.trim().length >= 8) score += 40;
  if (data.name && data.name.trim().length >= 2) score += 20;
  if (data.email && data.email.includes('@')) score += 25;
  if (data.city && data.city.trim().length >= 2) score += 15;
  return score;
}

/**
 * Get EMQ label and color based on score
 */
export function getEMQMeta(score: number): {
  label: string;
  color: string;
  bgColor: string;
  barColor: string;
  description: string;
} {
  if (score >= 80) return {
    label: 'Sangat Baik',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
    barColor: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    description: 'Peluang match tinggi ke profil Meta'
  };
  if (score >= 60) return {
    label: 'Baik',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    barColor: 'bg-gradient-to-r from-blue-400 to-blue-600',
    description: 'Data cukup untuk pelacakan konversi'
  };
  if (score >= 40) return {
    label: 'Sedang',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    barColor: 'bg-gradient-to-r from-amber-400 to-amber-500',
    description: 'Tambahkan email / kota untuk hasil lebih baik'
  };
  return {
    label: 'Rendah',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 border-rose-200',
    barColor: 'bg-gradient-to-r from-rose-400 to-rose-500',
    description: 'Isi nomor WA minimal untuk tracking'
  };
}

/**
 * Export events to CSV with proper UTF-8 BOM for Excel compatibility
 */
export function exportToCsv(rows: string[][], filename: string): void {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const csvContent = BOM + rows.map(row => 
    row.map(cell => {
      const str = String(cell ?? '');
      // Escape double quotes and wrap in quotes if contains comma/quote/newline
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
