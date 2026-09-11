import { calculateEMQ, getEMQMeta } from '../utils/formatters';

interface EmqIndicatorProps {
  phone?: string;
  name?: string;
  email?: string;
  city?: string;
  compact?: boolean;
}

export function EmqIndicator({ phone, name, email, city, compact = false }: EmqIndicatorProps) {
  const score = calculateEMQ({ phone, name, email, city });
  const meta = getEMQMeta(score);

  if (compact) {
    // Compact badge for table rows
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${meta.bgColor} ${meta.color}`}>
        EMQ {score}
      </span>
    );
  }

  return (
    <div className={`p-3 rounded-xl border ${meta.bgColor} animate-fade-in`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold ${meta.color} flex items-center gap-1.5`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Kualitas Match Data (EMQ): <strong>{score}/100 — {meta.label}</strong>
        </span>
        <span className={`text-[10px] ${meta.color} opacity-70`}>{meta.description}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden border border-white/50">
        <div
          className={`emq-bar ${meta.barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      {/* EMQ breakdown dots */}
      <div className="flex items-center gap-3 mt-2">
        <EMQDot active={Boolean(phone && phone.trim().length >= 8)} label="No. WA (40)" />
        <EMQDot active={Boolean(name && name.trim().length >= 2)} label="Nama (20)" />
        <EMQDot active={Boolean(email && email.includes('@'))} label="Email (25)" />
        <EMQDot active={Boolean(city && city.trim().length >= 2)} label="Kota (15)" />
      </div>
    </div>
  );
}

function EMQDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-current' : 'bg-slate-300'}`} />
      {label}
    </span>
  );
}
