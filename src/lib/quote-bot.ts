import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNextQuoteNumber } from '@/lib/quote-numbering'
import { parseQuoteResponse, type QuoteData } from '@/lib/quote-assistant-parser'
import { buildQuotationPdf } from '@/lib/pdf/quotation-builder'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the À Bientôt Tour & Travels Quote Assistant, helping travel agents
create professional quotations by extracting trip details from natural language.

YOUR JOB:
Extract all required quote fields from what the agent types and return
structured JSON when complete.

REQUIRED FIELDS:
- client_first_name, client_last_name, client_country
- travel dates, number of pax (travellers)
- at least one service item (flight / hotel / safari / transfer)
- price per person for each service

BEHAVIOUR RULES:
1. If the agent's message contains ALL required fields → respond ONLY with JSON
2. If ANY field is missing → ask ONE clear question to get it
3. Never ask for fields the agent already provided
4. Never invent prices or dates
5. Calculate totals automatically (unit_price × pax)
6. Be brief and professional — this is a staff tool, not a client chat
7. Default currency is USD unless agent specifies otherwise
8. Default year is the current year

WHEN ALL FIELDS ARE PRESENT, respond with this exact JSON structure:
{
  "status": "complete",
  "data": {
    "client_first_name": "",
    "client_last_name": "",
    "client_country": "",
    "client_phone": "",
    "currency": "USD",
    "option_badge": null,
    "items": [
      {
        "type": "FLIGHT BOOKING",
        "description": "",
        "traveller": "",
        "date": "",
        "pax": 2,
        "unit_price": 0,
        "total": 0
      }
    ],
    "subtotal": 0,
    "discount": 0,
    "tax_rate": 0,
    "total": 0,
    "notes": [],
    "terms": [
      "Quote valid for 14 days from issue date",
      "50% deposit required to confirm booking",
      "Balance due 7 days before travel date",
      "Cancellation policy applies"
    ]
  }
}

WHEN ASKING A FOLLOW-UP QUESTION, respond with:
{
  "status": "collecting",
  "question": "What is the client's full name?"
}`

// ── Types ────────────────────────────────────────────────────────────────────

export interface BotInput {
  phone?:          string
  agentName:       string
  agentId?:        string
  message:         string
  interface:       'panel' | 'whatsapp'
  conversationId?: string
}

export interface BotOutput {
  conversationId: string
  message:        string
  state:          'collecting' | 'summary' | 'generating' | 'done'
  quoteData?:     QuoteData
  pdfUrl?:        string
}

interface ConversationMessage {
  role:      'user' | 'assistant'
  content:   string
  timestamp: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function serviceEmoji(type: string): string {
  const map: Record<string, string> = {
    'FLIGHT BOOKING':    '✈️',
    'HOTEL RESERVATION': '🏨',
    'SAFARI PACKAGE':    '🦁',
    'AIRPORT TRANSFER':  '🚐',
    'GLAMPING':          '⛺',
    'BED & BREAKFAST':   '🌅',
  }
  return map[type] || '📋'
}

function buildSummaryMessage(data: QuoteData): string {
  const sym = data.currency === 'USD' ? '$' : data.currency + ' '
  const lines = [
    `Here's what I have 👇`,
    ``,
    `📋 *${data.quote_number}*`,
    `👤 ${data.client_first_name} ${data.client_last_name} · ${data.client_country}`,
    `👨‍💼 Consultant: ${data.consultant}`,
    ``,
    ...data.items.map(item =>
      `${serviceEmoji(item.type)} *${item.type}*\n${item.description}\n${item.pax} pax × ${sym}${item.unit_price.toFixed(2)} = ${sym}${item.total.toFixed(2)}`
    ),
    ``,
    `─────────────────`,
    `*TOTAL: ${sym}${data.total.toFixed(2)}*`,
    ``,
    `Reply *"confirm"* to generate the PDF.`,
    `Reply *"edit"* to make changes.`,
  ]
  return lines.join('\n')
}

// ── Conversation DB helpers ──────────────────────────────────────────────────

async function createConversation(input: BotInput) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('assistant_conversations')
    .insert({
      agent_id:   input.agentId ?? null,
      agent_name: input.agentName,
      interface:  input.interface,
      wa_phone:   input.phone ?? null,
      messages:   [] as never,
      status:     'collecting',
    })
    .select()
    .single()
  if (error) throw new Error(`Failed to create conversation: ${error.message}`)
  return data as Record<string, unknown>
}

async function loadConversation(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('assistant_conversations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(`Conversation not found: ${error.message}`)
  return data as Record<string, unknown>
}

async function updateConversation(
  id:      string,
  updates: { messages?: ConversationMessage[]; quote_data?: QuoteData | null; status?: string; pdf_url?: string },
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('assistant_conversations')
    .update(updates as never)
    .eq('id', id)
  if (error) throw new Error(`Failed to update conversation: ${error.message}`)
}

export async function getOpenConversation(phone: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('assistant_conversations')
    .select('*')
    .eq('wa_phone', phone)
    .eq('interface', 'whatsapp')
    .in('status', ['collecting', 'summary', 'done'] as never)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  return (data as Record<string, unknown> | null) ?? null
}

async function resetConversationToCollecting(id: string) {
  await updateConversation(id, { status: 'collecting', quote_data: null })
}

// ── Type mapping: assistant labels → DB ServiceType ─────────────────────────

const TYPE_MAP: Record<string, string> = {
  'FLIGHT BOOKING':    'flight',
  'HOTEL RESERVATION': 'hotel',
  'SAFARI PACKAGE':    'safari_package',
  'AIRPORT TRANSFER':  'airport_transfer',
  'GLAMPING':          'glamping',
  'BED & BREAKFAST':   'bed_breakfast',
}

// ── PDF generation ───────────────────────────────────────────────────────────

export async function generateAndSavePDF(conversation: Record<string, unknown>): Promise<{
  pdfUrl:  string
  quoteId: string
}> {
  const supabase  = createAdminClient()
  const quoteData = conversation.quote_data as QuoteData

  // 1. Create traveller record
  const { data: traveller, error: travErr } = await supabase
    .from('travellers')
    .insert({
      first_name:   quoteData.client_first_name,
      last_name:    quoteData.client_last_name,
      country:      quoteData.client_country,
      phone_number: quoteData.client_phone ?? null,
    } as never)
    .select()
    .single()
  if (travErr) throw new Error(`Failed to create traveller: ${travErr.message}`)

  // 2. Create quotation record
  const { data: quotation, error: quotErr } = await supabase
    .from('quotations')
    .insert({
      traveller_id: (traveller as Record<string, unknown>).id,
      number:       quoteData.quote_number,
      issue_date:   quoteData.issue_date,
      expiry_date:  quoteData.expiry_date,
      currency:     quoteData.currency,
      status:       'draft',
      subtotal:     quoteData.subtotal,
      discount:     quoteData.discount,
      tax_rate:     quoteData.tax_rate,
      total:        quoteData.total,
      notes:        quoteData.notes.length > 0 ? quoteData.notes.join('\n') : null,
      terms:        quoteData.terms.join('\n'),
    } as never)
    .select()
    .single()
  if (quotErr) throw new Error(`Failed to create quotation: ${quotErr.message}`)
  const quot = quotation as Record<string, unknown>

  // 3. Create quotation items
  if (quoteData.items.length > 0) {
    const itemRows = quoteData.items.map((item, i) => ({
      quotation_id:   quot.id,
      type:           TYPE_MAP[item.type] ?? 'flight',
      description:    item.description,
      traveller_name: item.traveller,
      travel_date:    null,           // ranges not supported as DATE — stored in description
      date_range:     item.date,      // extra column for display
      quantity:       item.pax,
      unit_price:     item.unit_price,
      currency:       quoteData.currency,
      sort_order:     i,
    }))
    const { error: itemErr } = await supabase
      .from('quotation_items')
      .insert(itemRows as never)
    if (itemErr) throw new Error(`Failed to create items: ${itemErr.message}`)
  }

  // 4. Fetch quotation with joins (for PDF builder)
  const { data: full, error: fetchErr } = await supabase
    .from('quotations')
    .select('*, travellers(first_name, last_name, country, phone_number, phone_code, email), quotation_items(*)')
    .eq('id', quot.id as string)
    .single()
  if (fetchErr || !full) throw new Error('Failed to fetch quotation for PDF')

  // 5. Build PDF
  const pdfBuffer = await buildQuotationPdf(full as Record<string, unknown>)

  // 6. Upload to Supabase Storage
  const storagePath = `${quoteData.quote_number}/${quoteData.client_last_name}.pdf`
  const { error: uploadErr } = await supabase.storage
    .from('quotations')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert:      true,
    })
  if (uploadErr) throw new Error(`Failed to upload PDF: ${uploadErr.message}`)

  const { data: urlData } = supabase.storage
    .from('quotations')
    .getPublicUrl(storagePath)
  const pdfUrl = urlData.publicUrl

  // 7. Update conversation
  await updateConversation(conversation.id as string, { status: 'done', pdf_url: pdfUrl })

  return { pdfUrl, quoteId: quot.id as string }
}

// ── Main bot function ────────────────────────────────────────────────────────

export async function quoteBotReply(input: BotInput): Promise<BotOutput> {

  // 1. Load or create conversation
  const conversation = input.conversationId
    ? await loadConversation(input.conversationId)
    : await createConversation(input)

  const prevMessages = (conversation.messages ?? []) as ConversationMessage[]

  // Handle WhatsApp confirm / edit / send pdf shortcuts
  if (input.interface === 'whatsapp') {
    const lower = input.message.toLowerCase().trim()
    const convStatus = conversation.status as string

    if (convStatus === 'summary') {
      if (lower === 'confirm' || lower === 'yes' || lower === '✅') {
        await updateConversation(conversation.id as string, { status: 'generating' })
        const { pdfUrl } = await generateAndSavePDF({
          ...conversation,
          status: 'summary',
        })
        return {
          conversationId: conversation.id as string,
          message: `✅ Done!\n\n📎 ${pdfUrl}\n\nReply *"send pdf"* for the document.`,
          state: 'done',
          pdfUrl,
        }
      }
      if (lower === 'edit') {
        await resetConversationToCollecting(conversation.id as string)
        return {
          conversationId: conversation.id as string,
          message: 'No problem! What would you like to change?',
          state: 'collecting',
        }
      }
    }

    if (convStatus === 'done' && (lower === 'send pdf' || lower === 'pdf')) {
      const storedPdfUrl = conversation.pdf_url as string | null
      const data = conversation.quote_data as QuoteData | null
      if (storedPdfUrl && data) {
        return {
          conversationId: conversation.id as string,
          message: `__SEND_PDF__:${storedPdfUrl}:${data.quote_number}_${data.client_last_name}.pdf`,
          state: 'done',
          pdfUrl: storedPdfUrl,
        }
      }
    }
  }

  // 2. Build history for Claude
  const history: ConversationMessage[] = [
    ...prevMessages,
    { role: 'user', content: input.message, timestamp: new Date().toISOString() },
  ]

  // 3. Call Claude Haiku
  const claudeResponse = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system:     SYSTEM_PROMPT,
    messages:   history.map(m => ({ role: m.role, content: m.content })),
  })

  const rawText = claudeResponse.content[0].type === 'text'
    ? claudeResponse.content[0].text
    : ''

  // 4. Parse response
  const parsed = parseQuoteResponse(rawText)

  // 5. Attach auto-generated fields if complete
  if (parsed.status === 'complete' && parsed.data) {
    parsed.data.quote_number = await getNextQuoteNumber()
    parsed.data.issue_date   = todayStr()
    parsed.data.expiry_date  = addDays(todayStr(), 14)
    parsed.data.consultant   = input.agentName
  }

  // 6. Build display message
  const displayMessage = parsed.status === 'complete' && parsed.data
    ? buildSummaryMessage(parsed.data)
    : (parsed.question ?? 'Could you provide more details?')

  // 7. Save updated conversation
  const updatedHistory: ConversationMessage[] = [
    ...history,
    { role: 'assistant', content: rawText, timestamp: new Date().toISOString() },
  ]
  await updateConversation(conversation.id as string, {
    messages:   updatedHistory,
    quote_data: parsed.data ?? null,
    status:     parsed.status === 'complete' ? 'summary' : 'collecting',
  })

  return {
    conversationId: conversation.id as string,
    message:        displayMessage,
    state:          parsed.status === 'complete' ? 'summary' : 'collecting',
    quoteData:      parsed.data,
  }
}
