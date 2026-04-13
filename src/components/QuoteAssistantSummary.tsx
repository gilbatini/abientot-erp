'use client'

import type { QuoteData } from '@/lib/quote-assistant-parser'

const SERVICE_EMOJI: Record<string, string> = {
  'FLIGHT BOOKING':    '✈️',
  'HOTEL RESERVATION': '🏨',
  'SAFARI PACKAGE':    '🦁',
  'AIRPORT TRANSFER':  '🚐',
  'GLAMPING':          '⛺',
  'BED & BREAKFAST':   '🌅',
}

function fmtAmt(amount: number, currency: string): string {
  const SYM: Record<string, string> = {
    USD:'$', EUR:'€', GBP:'£', UGX:'UGX ', KES:'KSh ', TZS:'TSh ',
    RWF:'RWF ', AED:'AED ', CAD:'C$', ZAR:'R',
  }
  const NO_DEC = ['UGX','KES','TZS','RWF']
  const sym = SYM[currency] ?? currency + ' '
  return NO_DEC.includes(currency)
    ? sym + Math.round(amount).toLocaleString()
    : sym + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  data:       QuoteData
  generating: boolean
  onEdit:     () => void
  onGenerate: () => void
}

export function QuoteAssistantSummary({ data, generating, onEdit, onGenerate }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4" style={{ background: '#f8f9fa' }}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div
            className="font-semibold text-base"
            style={{ color: '#2BBFB3', fontFamily: 'var(--font-display)' }}
          >
            📋 {data.quote_number}
          </div>
          <div className="text-gray-500 text-xs mt-0.5">
            {data.client_first_name} {data.client_last_name} · {data.client_country}
          </div>
          {data.client_phone && (
            <div className="text-gray-400 text-xs">{data.client_phone}</div>
          )}
        </div>

        {/* Items */}
        {data.items.map((item, i) => (
          <div key={i} className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#e6f9f8', color: '#2BBFB3' }}
              >
                {SERVICE_EMOJI[item.type] ?? '📋'} {item.type}
              </span>
            </div>
            <div className="text-gray-700 mt-1 text-xs leading-relaxed">{item.description}</div>
            {item.date && (
              <div className="text-gray-400 text-xs mt-0.5">{item.date}</div>
            )}
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-gray-400 text-xs">
                {item.pax} pax × {fmtAmt(item.unit_price, data.currency)}
              </span>
              <span className="font-semibold text-gray-800 text-xs">
                {fmtAmt(item.total, data.currency)}
              </span>
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span
            className="font-semibold text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TOTAL
          </span>
          <span
            className="font-bold text-lg"
            style={{ color: '#2BBFB3', fontFamily: 'var(--font-display)' }}
          >
            {fmtAmt(data.total, data.currency)}
          </span>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 flex gap-2">
          <button
            onClick={onEdit}
            disabled={generating}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium
                       hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex-1 py-2 rounded-lg text-white text-xs font-semibold
                       hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: generating ? '#9ca3af' : '#2BBFB3' }}
          >
            {generating ? '⏳ Generating…' : '✅ Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
