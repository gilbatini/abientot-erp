'use client'

import type { QuoteData } from '@/lib/quote-assistant-parser'

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
  pdfUrl:     string
  quoteId:    string
  onNewQuote: () => void
}

export function QuoteAssistantDone({ data, pdfUrl, onNewQuote }: Props) {
  const filename = `${data.quote_number}_${data.client_last_name}.pdf`

  function handleDownload() {
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = filename
    a.target = '_blank'
    a.click()
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex items-start" style={{ background: '#f8f9fa' }}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm w-full">

        {/* Success header */}
        <div className="px-4 py-4 border-b border-gray-100 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div
            className="font-semibold text-base"
            style={{ color: '#2BBFB3', fontFamily: 'var(--font-display)' }}
          >
            {data.quote_number} is ready!
          </div>
          <div className="text-gray-500 text-xs mt-0.5">
            {data.client_first_name} {data.client_last_name}
          </div>
          <div className="text-gray-700 font-semibold text-sm mt-1">
            Total: {fmtAmt(data.total, data.currency)}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 space-y-2 border-b border-gray-100">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-200
                       text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            🔍 Preview in Browser
          </a>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-xs font-semibold
                       hover:opacity-90 transition-opacity"
            style={{ background: '#2BBFB3' }}
          >
            ⬇️ Download PDF
          </button>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 text-center">
          <p className="text-gray-400 text-xs">Quote saved to AlgoriOffice ✓</p>
        </div>

        {/* New quote */}
        <div className="px-4 pb-3">
          <button
            onClick={onNewQuote}
            className="w-full py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium
                       hover:bg-gray-50 transition-colors"
          >
            ✨ New Quote
          </button>
        </div>
      </div>
    </div>
  )
}
