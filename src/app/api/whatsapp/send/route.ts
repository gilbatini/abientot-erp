import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppText, sendWhatsAppDocument } from '@/lib/whatsapp-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { to, type, text, pdfUrl, filename } = await req.json() as {
      to:       string
      type:     'text' | 'document'
      text?:    string
      pdfUrl?:  string
      filename?: string
    }

    if (type === 'text' && text) {
      await sendWhatsAppText(to, text)
    } else if (type === 'document' && pdfUrl && filename) {
      await sendWhatsAppDocument(to, pdfUrl, filename)
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[whatsapp/send]', err)
    return NextResponse.json(
      { error: 'Send failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
