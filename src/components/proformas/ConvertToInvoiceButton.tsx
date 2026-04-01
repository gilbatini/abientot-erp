"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  onConvert: () => Promise<string>;
}

export function ConvertToInvoiceButton({ onConvert }: Props) {
  const router   = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleConvert() {
    setLoading(true);
    setError(null);
    try {
      const invoiceId = await onConvert();
      router.push(`/invoices/${invoiceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={handleConvert}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Converting…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Convert to Invoice
          </>
        )}
      </button>
    </div>
  );
}
