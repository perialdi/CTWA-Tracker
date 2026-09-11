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
