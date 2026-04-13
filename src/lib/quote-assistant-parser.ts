export interface QuoteItem {
  type:        string   // "FLIGHT BOOKING" | "HOTEL RESERVATION" | etc.
  description: string
  traveller:   string   // client last name or "Group"
  date:        string
  pax:         number
  unit_price:  number
  total:       number
}

export interface QuoteData {
  client_first_name: string
  client_last_name:  string
  client_country:    string
  client_phone?:     string
  quote_number:      string
  issue_date:        string
  expiry_date:       string
  consultant:        string
  currency:          string
  option_badge?:     string | null
  items:             QuoteItem[]
  subtotal:          number
  discount:          number
  tax_rate:          number
  total:             number
  notes:             string[]
  terms:             string[]
}

interface ParseResult {
  status:    'collecting' | 'complete'
  question?: string
  data?:     QuoteData
}

export function parseQuoteResponse(rawText: string): ParseResult {
  // Strip markdown code fences if present
  const stripped = rawText
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  // Try to parse JSON
  let json: Record<string, unknown> | null = null
  try {
    json = JSON.parse(stripped)
  } catch {
    // Not JSON — treat the whole response as a follow-up question
    return { status: 'collecting', question: rawText.trim() }
  }

  if (!json) return { status: 'collecting', question: rawText.trim() }

  const status = json.status as string

  if (status === 'collecting') {
    return {
      status:   'collecting',
      question: (json.question as string) || 'Could you provide more details?',
    }
  }

  if (status === 'complete' && json.data) {
    return {
      status: 'complete',
      data:   json.data as QuoteData,
    }
  }

  // Fallback — treat raw text as question
  return { status: 'collecting', question: rawText.trim() }
}
