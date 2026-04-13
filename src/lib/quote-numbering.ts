import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Get the next quotation number using the existing next_doc_number RPC.
 * Uses the admin client so it works in both browser API routes and
 * server-side WhatsApp webhook (no user session required).
 */
export async function getNextQuoteNumber(): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('next_doc_number', { doc_key: 'quotation' } as never)
  if (error) throw new Error(`Failed to generate quote number: ${error.message}`)
  return data as string
}
