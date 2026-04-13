import { NextRequest, NextResponse } from 'next/server'
import { getAgentByPhone } from '@/lib/agent-recognition'
import { quoteBotReply, getOpenConversation } from '@/lib/quote-bot'
import { sendWhatsAppText, sendWhatsAppDocument } from '@/lib/whatsapp-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Webhook verification (Meta calls this once) ──────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// ── Receive messages ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const entry   = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const message = changes?.value?.messages?.[0]

    // Ignore non-text messages and status updates
    if (!message || message.type !== 'text') {
      return NextResponse.json({ ok: true })
    }

    const fromPhone = message.from as string      // e.g. "256788138721"
    const text      = message.text.body as string
    const phoneE164 = `+${fromPhone}`

    // Check if sender is a team member
    const agent = await getAgentByPhone(phoneE164)

    if (agent) {
      // ── AGENT MODE ──────────────────────────────────────────────────────
      const openConv = await getOpenConversation(phoneE164)

      // Handle "send pdf" on a done conversation
      if (openConv?.status === 'done' && (text.toLowerCase().trim() === 'send pdf' || text.toLowerCase().trim() === 'pdf')) {
        const pdfUrl  = openConv.pdf_url as string | null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const qd      = openConv.quote_data as any
        if (pdfUrl && qd) {
          const filename = `${qd.quote_number}_${qd.client_last_name}.pdf`
          await sendWhatsAppDocument(phoneE164, pdfUrl, filename)
        }
        return NextResponse.json({ ok: true })
      }

      const reply = await quoteBotReply({
        phone:          phoneE164,
        agentName:      agent.agent_name,
        message:        text,
        interface:      'whatsapp',
        conversationId: openConv?.id as string | undefined,
      })

      // Check for internal PDF send signal
      if (reply.message.startsWith('__SEND_PDF__:')) {
        const parts    = reply.message.replace('__SEND_PDF__:', '').split(':')
        const url      = parts[0]
        const filename = parts[1] ?? 'quote.pdf'
        await sendWhatsAppDocument(phoneE164, url, filename)
        return NextResponse.json({ ok: true })
      }

      await sendWhatsAppText(phoneE164, reply.message)

      if (reply.pdfUrl) {
        await sendWhatsAppText(
          phoneE164,
          `📎 Download: ${reply.pdfUrl}\n\nReply *"send pdf"* to receive it as a document.`,
        )
      }

    } else {
      // ── CLIENT MODE — Phase 2 (not yet built) ───────────────────────────
      await sendWhatsAppText(
        phoneE164,
        "Hi! 👋 Thank you for reaching out to À Bientôt Tour & Travels.\nOur team will be with you shortly! 🌍",
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Always return 200 to prevent Meta retries
    console.error('[whatsapp/webhook]', err)
    return NextResponse.json({ ok: true })
  }
}
