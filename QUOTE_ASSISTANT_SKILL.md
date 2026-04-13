---
name: quote-assistant
description: >
  Build the À Bientôt Quote Assistant — a dual-interface AI-powered bot
  that lets agents generate PDF quotations by typing trip details naturally.
  Works in TWO places simultaneously: the AlgoriOffice floating panel (browser)
  AND WhatsApp (phone). Same bot brain, same Supabase, same PDF output.
  Read this skill completely before writing any code.
---

# Quote Assistant — AlgoriOffice Feature Skill

## Overview

The Quote Assistant bot lives in **two interfaces simultaneously**:

1. **AlgoriOffice Panel** — floating chat button on every page, for when
   agents are working at their desk in the browser
2. **WhatsApp** — agents text the À Bientôt business number from their
   phone and get the same experience

Both interfaces share the same bot brain (Claude Haiku), the same
conversation history (Supabase), and the same PDF output (PDF_QUOTATION skill).

### Agent Recognition on WhatsApp
Team phone numbers are stored in a Supabase whitelist table. When a message
arrives on WhatsApp, the system checks the sender's number:
- **Known team number** → agent mode (quote bot)
- **Unknown number** → client mode (Phase 2, not built yet — reply with
  "Our team will be with you shortly")

### PDF Delivery on WhatsApp
When a PDF is ready, WhatsApp sends:
1. A download link to the Supabase Storage URL (immediately)
2. The PDF as a WhatsApp document (if agent replies "send document" or "pdf")

---

## User Flow (The 5 States)

```
State 1: GREETING
  Bot greets agent, waits for input

State 2: COLLECTING
  Agent types trip details (one message or multiple)
  Bot checks if all required fields are present:
    → All present: jump to State 3 immediately
    → Missing fields: ask ONE follow-up question, stay in State 2

State 3: SUMMARY
  Bot displays structured summary of extracted quote data
  Agent sees [Edit] and [Generate PDF] buttons

State 4: GENERATING
  Bot shows spinner: "Generating QT-2026-XXXX..."
  Calls PDF generation service
  Saves quote to Supabase quotes table
  Saves PDF to Supabase Storage

State 5: DONE
  "✅ Quote ready!"
  Shows [Preview in browser] and [Download PDF] buttons
  Shows [New Quote] to reset to State 1
```

---

## Required Fields for a Complete Quote

The bot must confirm ALL of these before moving to Summary:

```typescript
interface QuoteData {
  // Client
  client_first_name: string
  client_last_name:  string
  client_country:    string
  client_phone?:     string   // optional — ask only if agent provides

  // Document
  quote_number:  string        // auto-generated e.g. "QT-2026-0006"
  issue_date:    string        // today's date
  expiry_date:   string        // today + 14 days
  consultant:    string        // logged-in agent's name
  currency:      string        // default "USD"

  // Items (one or more)
  items: QuoteItem[]

  // Totals (calculated)
  subtotal: number
  discount: number             // default 0
  tax_rate: number             // default 0
  total:    number

  // Notes & Terms
  notes: string[]
  terms: string[]              // use standard terms (see below)
}

interface QuoteItem {
  type:          string        // see Service Types below
  description:   string
  traveller:     string        // client last name or "Group"
  date:          string        // travel date range
  pax:           number
  unit_price:    number
  total:         number        // unit_price × pax
}
```

### Service Types (exact strings)
```
FLIGHT BOOKING
HOTEL RESERVATION
SAFARI PACKAGE
AIRPORT TRANSFER
GLAMPING
BED & BREAKFAST
```

### Standard Terms (always include these)
```
· Quote valid for 14 days from issue date
· 50% deposit required to confirm booking
· Balance due 7 days before travel date
· Cancellation policy applies
```

### Banking Details (always include on every PDF)
```
Bank:         Stanbic Bank — Ntinda Branch
Account Name: ABIENTOT TOUR & TRAVELS
USD Account:  9030024157236
UGX Account:  9030024156841
Branch Code:  031008
```

---

## Natural Language Extraction Rules

The bot must extract structured data from casual agent input.

### Examples

| Agent types | Bot extracts |
|---|---|
| `"Thomas Wandera"` | first_name: Thomas, last_name: Wandera |
| `"Uganda"` | client_country: Uganda |
| `"26-29 April"` or `"26th to 29th April"` | date: "26–29 Apr 2026" |
| `"2 pax"` or `"for 2"` or `"two people"` | pax: 2 |
| `"Uganda Airlines EBB-MBA"` | type: FLIGHT BOOKING, description includes airline + route |
| `"$533.90 each"` or `"usd533.9 per person"` | unit_price: 533.90 |
| `"PrideInn Mara 3 nights full board"` | type: SAFARI PACKAGE, description: PrideInn Mara Camp... |
| `"$1090 each"` | unit_price: 1090.00 |
| `"round trip transfers"` | type: AIRPORT TRANSFER |
| `"EnglishPoint Marina B&B"` | type: HOTEL RESERVATION |
| `"KQ"` or `"Kenya Airways"` | Kenya Airways in description |
| `"option 2"` or `"economy saver"` | option_badge: "OPTION 2 — Economy Saver Fare" |

### Calculation Rules
- `item.total = item.unit_price × item.pax`
- `subtotal = sum of all item.total`
- `total = subtotal - discount + (subtotal × tax_rate / 100)`
- Never ask agent to do math — bot calculates everything

### Quote Numbering
```typescript
// Get next quote number from Supabase
const { data } = await supabase
  .from('quotations')
  .select('quote_number')
  .order('created_at', { ascending: false })
  .limit(1)

const lastNum = parseInt(data?.[0]?.quote_number?.split('-')[2] || '0')
const nextNum = String(lastNum + 1).padStart(4, '0')
const quoteNumber = `QT-${new Date().getFullYear()}-${nextNum}`
```

---

## Claude Haiku System Prompt

Use this exact system prompt for every conversation:

```
You are the À Bientôt Tour & Travels Quote Assistant, helping travel agents
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
}
```

---

## File Structure — Exact Files to Create

```
AlgoriOffice/
│
├── components/
│   ├── QuoteAssistant.tsx           ← floating button + panel (AlgoriOffice UI)
│   ├── QuoteAssistantMessages.tsx   ← message list rendering
│   ├── QuoteAssistantSummary.tsx    ← summary confirm screen
│   └── QuoteAssistantDone.tsx       ← PDF download screen
│
├── app/api/
│   ├── assistant/
│   │   ├── chat/route.ts            ← AlgoriOffice panel → Claude Haiku
│   │   └── generate/route.ts        ← triggers PDF + saves to Supabase
│   │
│   └── whatsapp/
│       ├── webhook/route.ts         ← receives ALL WhatsApp messages from Meta
│       └── send/route.ts            ← sends messages + PDFs back via Meta API
│
├── lib/
│   ├── quote-bot.ts                 ← SHARED bot brain (used by BOTH interfaces)
│   ├── agent-recognition.ts         ← phone number → agent lookup (whitelist)
│   ├── quote-assistant-parser.ts    ← parses Claude JSON output into QuoteData
│   ├── quote-numbering.ts           ← gets next QT number from Supabase
│   └── whatsapp-client.ts           ← Meta Cloud API send helpers
│
├── python/
│   ├── generate_quote.py            ← ReportLab PDF (PDF_QUOTATION skill)
│   ├── server.py                    ← FastAPI wrapper
│   └── requirements.txt
│
└── supabase/migrations/
    └── 20260408_quote_assistant.sql ← all tables for this feature
```

---

## Supabase Schema

```sql
-- ─── Assistant Conversations (unified — both interfaces) ────────────────────
CREATE TABLE assistant_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_name  TEXT,
  interface   TEXT NOT NULL DEFAULT 'panel'
              CHECK (interface IN ('panel', 'whatsapp')),
  wa_phone    TEXT,                          -- only set when interface = whatsapp
  messages    JSONB NOT NULL DEFAULT '[]',   -- [{role, content, timestamp}]
  quote_data  JSONB,                         -- extracted QuoteData object
  status      TEXT NOT NULL DEFAULT 'collecting'
              CHECK (status IN ('collecting', 'summary', 'generating', 'done')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER assistant_conversations_updated_at
  BEFORE UPDATE ON assistant_conversations
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- RLS
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can manage their conversations"
  ON assistant_conversations FOR ALL
  USING (auth.uid() = agent_id);

-- ─── Team Phone Whitelist ───────────────────────────────────────────────────
-- Maps WhatsApp phone numbers to AlgoriOffice agents
CREATE TABLE team_phone_numbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL UNIQUE,    -- e.g. +256788138721 (E.164 format)
  agent_name  TEXT NOT NULL,           -- e.g. "Remmy S"
  role        TEXT NOT NULL DEFAULT 'agent'
              CHECK (role IN ('admin', 'agent')),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS — only admins can manage whitelist
ALTER TABLE team_phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage team phones"
  ON team_phone_numbers FOR ALL
  USING (auth.role() = 'authenticated');

-- Seed with À Bientôt team
INSERT INTO team_phone_numbers (phone, agent_name, role) VALUES
  ('+256788138721', 'Remmy S', 'admin'),
  ('+256752338938', 'Rida',    'agent');
```

Note: Generated quotes are saved to the **existing `quotations` table** —
no new table needed. The assistant just creates a record there like any
manually created quote.

---

## API Routes

### POST /api/assistant/chat

Called every time the agent sends a message.

**Request:**
```typescript
{
  conversationId: string | null,  // null for new conversation
  message: string,                // agent's typed message
  history: Array<{                // previous messages
    role: 'user' | 'assistant',
    content: string
  }>
}
```

**Response:**
```typescript
{
  conversationId: string,
  response: {
    status: 'collecting' | 'complete',
    question?: string,    // if collecting
    data?: QuoteData,     // if complete
  },
  message: string         // display text for chat UI
}
```

**Logic:**
```typescript
// 1. Create/update conversation in Supabase
// 2. Build messages array with system prompt
// 3. Call Claude Haiku:
const response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1024,
  system: SYSTEM_PROMPT,  // (from above)
  messages: history.map(m => ({ role: m.role, content: m.content }))
})
// 4. Parse JSON from response
// 5. If complete: get next quote number, attach to data
// 6. Save messages to Supabase
// 7. Return response
```

### POST /api/assistant/generate

Called when agent clicks "Generate PDF" on summary screen.

**Request:**
```typescript
{
  conversationId: string,
  quoteData: QuoteData
}
```

**Response:**
```typescript
{
  success: boolean,
  quoteNumber: string,
  pdfUrl: string,        // Supabase Storage public URL
  previewUrl: string,    // same URL, opened in new tab
  quoteId: string        // ID in quotations table
}
```

**Logic:**
```typescript
// 1. Call PDF generation service (see PDF Service section)
// 2. Upload PDF bytes to Supabase Storage:
//    bucket: 'quotations'
//    path: `${quoteData.quote_number}/${quoteData.client_last_name}.pdf`
// 3. Save to quotations table (same structure as manual quotes)
// 4. Update conversation status to 'done'
// 5. Return URLs
```

---

## WhatsApp API Routes

### GET /api/whatsapp/webhook — Verification

Meta calls this once to verify the webhook endpoint.

```typescript
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}
```

### POST /api/whatsapp/webhook — Receive Messages

```typescript
export async function POST(req: Request) {
  const body = await req.json()

  // Extract message from Meta webhook payload
  const entry    = body.entry?.[0]
  const changes  = entry?.changes?.[0]
  const message  = changes?.value?.messages?.[0]

  if (!message || message.type !== 'text') return Response.json({ ok: true })

  const fromPhone = message.from          // e.g. "256788138721"
  const text      = message.text.body
  const phoneE164 = `+${fromPhone}`

  // Check if sender is a team member (whitelist)
  const agent = await getAgentByPhone(phoneE164)  // lib/agent-recognition.ts

  if (agent) {
    // ── AGENT MODE — Quote bot ──────────────────────────────────────────
    const reply = await quoteBotReply({
      phone:     phoneE164,
      message:   text,
      agentName: agent.agent_name,
      interface: 'whatsapp',
    })
    await sendWhatsAppText(phoneE164, reply.message)

    // If PDF is ready, send link + offer document
    if (reply.pdfUrl) {
      await sendWhatsAppText(phoneE164,
        `📎 Download: ${reply.pdfUrl}\n\nReply *"send pdf"* to receive it as a document.`
      )
    }

  } else {
    // ── CLIENT MODE — Phase 2 (not built yet) ──────────────────────────
    await sendWhatsAppText(phoneE164,
      "Hi! 👋 Thank you for reaching out to À Bientôt Tour & Travels.\n" +
      "Our team will be with you shortly! 🌍"
    )
  }

  return Response.json({ ok: true })
}
```

### POST /api/whatsapp/send — Send Message or Document

```typescript
// lib/whatsapp-client.ts

const WA_API = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}`
const HEADERS = {
  'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
}

// Send text message
export async function sendWhatsAppText(to: string, text: string) {
  await fetch(`${WA_API}/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace('+', ''),
      type: 'text',
      text: { body: text }
    })
  })
}

// Send PDF as document
export async function sendWhatsAppDocument(to: string, pdfUrl: string, filename: string) {
  await fetch(`${WA_API}/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace('+', ''),
      type: 'document',
      document: {
        link: pdfUrl,
        filename: filename,
        caption: `${filename} — À Bientôt Tour & Travels`
      }
    })
  })
}
```

---

## Shared Bot Brain (lib/quote-bot.ts)

This is the SINGLE function used by BOTH interfaces.
`/api/assistant/chat/route.ts` calls it for the panel.
`/api/whatsapp/webhook/route.ts` calls it for WhatsApp.

```typescript
// lib/quote-bot.ts

import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from './supabase'
import { getNextQuoteNumber } from './quote-numbering'
import { parseQuoteResponse } from './quote-assistant-parser'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface BotInput {
  phone?:      string         // set for WhatsApp, null for panel
  agentName:   string
  agentId?:    string         // set for panel (auth user id)
  message:     string
  interface:   'panel' | 'whatsapp'
  conversationId?: string     // pass if continuing existing conversation
}

interface BotOutput {
  conversationId: string
  message:        string      // text to display/send
  state:          'collecting' | 'summary' | 'generating' | 'done'
  quoteData?:     QuoteData   // set when state = summary or done
  pdfUrl?:        string      // set when state = done
}

export async function quoteBotReply(input: BotInput): Promise<BotOutput> {

  // 1. Load or create conversation
  let conversation = input.conversationId
    ? await loadConversation(input.conversationId)
    : await createConversation(input)

  // 2. Append user message
  const history = [
    ...conversation.messages,
    { role: 'user', content: input.message, timestamp: new Date().toISOString() }
  ]

  // 3. Call Claude Haiku
  const claudeResponse = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system:     SYSTEM_PROMPT,    // (defined in Claude Haiku System Prompt section)
    messages:   history.map(m => ({ role: m.role, content: m.content }))
  })

  const rawText = claudeResponse.content[0].type === 'text'
    ? claudeResponse.content[0].text : ''

  // 4. Parse response
  const parsed = parseQuoteResponse(rawText)

  // 5. If complete — attach quote number
  if (parsed.status === 'complete' && parsed.data) {
    parsed.data.quote_number = await getNextQuoteNumber()
    parsed.data.issue_date   = formatDate(new Date())
    parsed.data.expiry_date  = formatDate(addDays(new Date(), 14))
    parsed.data.consultant   = input.agentName
  }

  // 6. Build display message
  const displayMessage = parsed.status === 'complete'
    ? buildSummaryMessage(parsed.data)   // for WhatsApp (panel uses component)
    : parsed.question

  // 7. Save updated conversation
  const updatedHistory = [
    ...history,
    { role: 'assistant', content: rawText, timestamp: new Date().toISOString() }
  ]
  await updateConversation(conversation.id, {
    messages:   updatedHistory,
    quote_data: parsed.data || null,
    status:     parsed.status === 'complete' ? 'summary' : 'collecting'
  })

  return {
    conversationId: conversation.id,
    message:        displayMessage,
    state:          parsed.status === 'complete' ? 'summary' : 'collecting',
    quoteData:      parsed.data,
  }
}

// WhatsApp-friendly text summary (panel uses QuoteAssistantSummary component instead)
function buildSummaryMessage(data: QuoteData): string {
  const lines = [
    `Here's what I have 👇`,
    ``,
    `📋 *${data.quote_number}*`,
    `👤 ${data.client_first_name} ${data.client_last_name} · ${data.client_country}`,
    `👨‍💼 Consultant: ${data.consultant}`,
    ``,
    ...data.items.map(item =>
      `${serviceEmoji(item.type)} *${item.type}*\n${item.description}\n${item.pax} pax × $${item.unit_price.toFixed(2)} = $${item.total.toFixed(2)}`
    ),
    ``,
    `─────────────────`,
    `*TOTAL: $${data.total.toFixed(2)}*`,
    ``,
    `Reply *"confirm"* to generate the PDF.`,
    `Reply *"edit"* to make changes.`,
  ]
  return lines.join('\n')
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
```

---

## Agent Recognition (lib/agent-recognition.ts)

```typescript
import { supabaseAdmin } from './supabase'

export async function getAgentByPhone(phone: string) {
  const { data } = await supabaseAdmin
    .from('team_phone_numbers')
    .select('*')
    .eq('phone', phone)
    .eq('active', true)
    .single()

  return data || null
}
```

---

## WhatsApp Confirm/Edit Flow

On WhatsApp, after the bot sends the summary, the agent replies with text:

```typescript
// In webhook handler, after agent is recognized,
// check if there's an open 'summary' conversation for this phone

const openConversation = await getOpenConversation(phoneE164)

if (openConversation?.status === 'summary') {
  const lowerText = text.toLowerCase().trim()

  if (lowerText === 'confirm' || lowerText === 'yes' || lowerText === '✅') {
    // Generate PDF
    await sendWhatsAppText(phoneE164, `Generating ${openConversation.quote_data.quote_number}... ⏳`)
    const { pdfUrl } = await generateAndSavePDF(openConversation)
    await sendWhatsAppText(phoneE164, `✅ Done!\n\n📎 ${pdfUrl}\n\nReply *"send pdf"* for the document.`)

  } else if (lowerText === 'edit') {
    // Reset to collecting
    await resetConversationToCollecting(openConversation.id)
    await sendWhatsAppText(phoneE164, `No problem! What would you like to change?`)

  } else if (lowerText === 'send pdf' || lowerText === 'pdf') {
    // Send as WhatsApp document
    const filename = `${openConversation.quote_data.quote_number}_${openConversation.quote_data.client_last_name}.pdf`
    await sendWhatsAppDocument(phoneE164, openConversation.pdf_url, filename)

  } else {
    // Treat as new input to edit the quote
    const reply = await quoteBotReply({ ...input, conversationId: openConversation.id })
    await sendWhatsAppText(phoneE164, reply.message)
  }
}
```

---

## Environment Variables (complete list for this feature)

```env
# Meta Cloud API
WHATSAPP_TOKEN=          # Permanent access token from Meta Developer portal
WHATSAPP_PHONE_ID=       # Phone Number ID from Meta Developer portal
WHATSAPP_VERIFY_TOKEN=   # Any random string you choose e.g. "abientot_verify_2026"

# PDF Service (choose one)
PDF_SERVICE_URL=         # Railway URL e.g. https://xxx.railway.app
                         # OR leave empty to use Vercel Python runtime

# Already exists in AlgoriOffice
ANTHROPIC_API_KEY=       # sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## PDF Generation Service

### Option A — Railway (Python FastAPI) [Recommended]
Deploy `python/server.py` to Railway. Set env var `PDF_SERVICE_URL` in Vercel.

### Option B — Vercel Python Runtime
Add `python/generate_quote.py` as a Vercel function at `api/pdf/generate.py`.

### Decision Point
Add this to `.env.local`:
```env
PDF_SERVICE_URL=        # Option A: Railway URL e.g. https://xxx.railway.app
                        # Option B: leave empty, use Vercel Python runtime
```

The `generate/route.ts` checks `PDF_SERVICE_URL`:
- If set → POST to Railway service
- If empty → call local Python runtime

### FastAPI Server (python/server.py)
```python
from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
import generate_quote  # the PDF_QUOTATION skill

app = FastAPI()

class QuoteRequest(BaseModel):
    quote_data: dict

@app.post("/generate")
def generate(req: QuoteRequest):
    pdf_bytes = generate_quote.build(req.quote_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={req.quote_data['quote_number']}.pdf"
        }
    )
```

### requirements.txt
```
fastapi
uvicorn
reportlab
cairosvg
```

---

## UI Component Spec

### QuoteAssistant.tsx — Floating Button + Panel

**Floating button:**
- Position: `fixed bottom-6 right-6 z-50`
- Size: `56px × 56px` circle
- Background: `#2BBFB3` (À Bientôt teal)
- Icon: sparkle ✨ emoji or Lucide `Sparkles` icon, white
- Shadow: `shadow-lg`
- On click: toggle panel open/closed

**Chat panel:**
- Position: `fixed bottom-20 right-6 z-50`
- Size: `w-96 h-[560px]` (desktop), `w-[calc(100vw-32px)] h-[70vh]` (mobile)
- Background: white
- Border radius: `rounded-2xl`
- Shadow: `shadow-2xl`
- Border: `1px solid #dadce0`
- Animation: slide up from bottom on open

**Panel header:**
- Background: `#2BBFB3`
- Text: "✨ Quote Assistant" white, Space Grotesk font
- Sub-text: "À Bientôt Tour & Travels" white 75% opacity
- Right: close button [×] white

**Messages area:**
- Scrollable, `flex-1`
- Background: `#f8f9fa`
- Padding: `16px`

**Message bubbles:**
- Agent (user): right-aligned, `#2BBFB3` background, white text
- Bot (assistant): left-aligned, white background, `#202124` text, border `#dadce0`
- Font: DM Sans 14px
- Border radius: `12px`
- Max width: 85%

**Input area:**
- Background: white
- Border top: `1px solid #dadce0`
- Textarea: auto-resize, max 4 lines
- Send button: `#2BBFB3` background, white icon
- Placeholder: "Describe the trip..."

### QuoteAssistantSummary.tsx — Confirm Screen

Replaces messages area when state = 'summary':

```
┌─────────────────────────────────────────┐
│  📋 QT-2026-0006                        │  ← teal, Space Grotesk
│  Harriet Kakooza Nakaggo · Uganda       │  ← grey
│  +256 700 636 065                       │  ← grey (if provided)
├─────────────────────────────────────────┤
│  ✈️  FLIGHT BOOKING                     │  ← teal tag
│  KQ EBB→MBA+Return · Economy Saver     │
│  2 pax × $684.50 = $1,369.00           │  ← right aligned
├─────────────────────────────────────────┤
│  🏨  HOTEL RESERVATION                  │
│  EnglishPoint Marina & Spa · 3 nights  │
│  2 pax × $312.33 = $937.00             │
├─────────────────────────────────────────┤
│  🚐  AIRPORT TRANSFER                   │
│  Round Trip Premium                     │
│  1 × $172.00 = $172.00                 │
├─────────────────────────────────────────┤
│                    TOTAL: $2,478.00     │  ← teal, bold, large
├─────────────────────────────────────────┤
│  [✏️ Edit]      [✅ Generate PDF]       │
└─────────────────────────────────────────┘
```

Edit button: clears summary, returns to collecting state with history intact.
Generate PDF button: calls /api/assistant/generate, moves to State 4.

### QuoteAssistantDone.tsx — PDF Ready Screen

```
┌─────────────────────────────────────────┐
│  ✅ QT-2026-0006 is ready!              │
│  Harriet Kakooza Nakaggo                │
│  Total: $2,478.00                       │
├─────────────────────────────────────────┤
│  [🔍 Preview in Browser]               │
│  [⬇️  Download PDF]                    │
├─────────────────────────────────────────┤
│  Quote saved to AlgoriOffice ✓          │  ← small grey text
├─────────────────────────────────────────┤
│  [✨ New Quote]                         │
└─────────────────────────────────────────┘
```

Preview: opens `pdfUrl` in new browser tab
Download: triggers file download with correct filename
New Quote: resets all state, returns to State 1

---

## Layout Integration

Add `<QuoteAssistant />` to the root layout file:

```typescript
// app/layout.tsx  (or the authenticated layout)
import { QuoteAssistant } from '@/components/QuoteAssistant'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <QuoteAssistant />  {/* ← add here, renders on every page */}
      </body>
    </html>
  )
}
```

---

## AlgoriOffice Conventions to Follow

These are existing rules in the codebase — never break them:

1. **PDF routes must be `.ts` not `.tsx`**
2. **Node must be 20.x** — do not use Node 24 features
3. **Supabase client:** use `createServerClient` from `@supabase/ssr` in server components/routes, `createBrowserClient` in client components
4. **Auth:** always call `verifySession()` at the top of every API route before doing anything
5. **Env vars:** never hardcode keys — always use `process.env.XXX`
6. **Tailwind v4:** use core utility classes only
7. **Font:** Space Grotesk for headings, DM Sans for body (already loaded)
8. **Primary colour:** `#2BBFB3` teal — use this for all interactive elements in this feature

---

## Environment Variables to Add

```env
# .env.local additions for this feature
PDF_SERVICE_URL=https://your-railway-app.railway.app  # or leave empty for Vercel Python
# ANTHROPIC_API_KEY already exists in AlgoriOffice
```

---

## Build Order for Claude Code

Follow this exact sequence — each step depends on the previous:

```
── FOUNDATION ──────────────────────────────────────────────────
1.  supabase/migrations/20260408_quote_assistant.sql
    (creates assistant_conversations + team_phone_numbers tables)

── SHARED LOGIC ────────────────────────────────────────────────
2.  lib/quote-numbering.ts
3.  lib/quote-assistant-parser.ts
4.  lib/agent-recognition.ts
5.  lib/whatsapp-client.ts
6.  lib/quote-bot.ts              ← uses all of the above

── API ROUTES ──────────────────────────────────────────────────
7.  app/api/assistant/chat/route.ts
8.  app/api/assistant/generate/route.ts
9.  app/api/whatsapp/webhook/route.ts
10. app/api/whatsapp/send/route.ts

── PYTHON PDF SERVICE ──────────────────────────────────────────
11. python/generate_quote.py      ← adapt from PDF_QUOTATION skill
12. python/server.py
13. python/requirements.txt

── UI COMPONENTS (AlgoriOffice panel) ──────────────────────────
14. components/QuoteAssistantMessages.tsx
15. components/QuoteAssistantSummary.tsx
16. components/QuoteAssistantDone.tsx
17. components/QuoteAssistant.tsx ← imports all above

── INTEGRATION ─────────────────────────────────────────────────
18. Add <QuoteAssistant /> to app layout (authenticated layout only)

── TESTING ─────────────────────────────────────────────────────
19. Test AlgoriOffice panel end to end
20. Configure Meta webhook + verify token
21. Test WhatsApp flow end to end
```

---

## Testing Checklist

Before marking this feature complete:

**AlgoriOffice Panel**
- [ ] Floating button appears on every AlgoriOffice page
- [ ] Panel opens and closes smoothly
- [ ] Bot responds correctly to complete trip in one message
- [ ] Bot asks follow-up when fields are missing
- [ ] Summary shows correct calculated totals
- [ ] Edit button returns to chat with history
- [ ] PDF generates with correct À Bientôt branding
- [ ] PDF matches PDF_QUOTATION skill layout exactly
- [ ] Banking details appear on every PDF
- [ ] Quote saved to quotations table in Supabase
- [ ] PDF stored in Supabase Storage
- [ ] Preview opens in new browser tab
- [ ] Download works with correct filename
- [ ] New Quote resets cleanly
- [ ] Conversation saved to assistant_conversations table
- [ ] Works on mobile (responsive panel)
- [ ] verifySession() called in both API routes

**WhatsApp**
- [ ] Meta webhook GET verification returns challenge correctly
- [ ] Remmy's number (+256788138721) recognised as agent
- [ ] Rida's number (+256752338938) recognised as agent
- [ ] Unknown number gets "team will be with you shortly" reply
- [ ] Bot collects trip details over multiple WhatsApp messages
- [ ] Summary sent as formatted WhatsApp text with bold markdown
- [ ] "confirm" triggers PDF generation
- [ ] "edit" resets and asks what to change
- [ ] PDF download link sent after generation
- [ ] "send pdf" delivers PDF as WhatsApp document attachment
- [ ] Quote saved to quotations table same as panel
- [ ] Conversation saved with interface = 'whatsapp'

**Meta Setup (complete before WhatsApp testing)**
- [ ] WHATSAPP_TOKEN added to .env.local
- [ ] WHATSAPP_PHONE_ID added to .env.local
- [ ] WHATSAPP_VERIFY_TOKEN added to .env.local
- [ ] Webhook URL set: https://[your-vercel-url]/api/whatsapp/webhook
- [ ] Webhook subscribed to: messages

---

## Related Skills

- **PDF_QUOTATION.md** — ReportLab layout, colours, and structure for the PDF output
- **CLAUDE.md** — AlgoriOffice project conventions and security rules
