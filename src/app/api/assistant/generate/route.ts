import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndSavePDF } from '@/lib/quote-bot'
import type { QuoteData } from '@/lib/quote-assistant-parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = user.user_metadata?.role as string
    if (role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { conversationId, quoteData } = await req.json() as {
      conversationId: string
      quoteData:      QuoteData
    }

    if (!conversationId || !quoteData) {
      return NextResponse.json({ error: 'conversationId and quoteData required' }, { status: 400 })
    }

    // Load conversation to pass to generateAndSavePDF
    const admin = createAdminClient()
    const { data: conv, error: convErr } = await admin
      .from('assistant_conversations')
      .select('*')
      .eq('id', conversationId)
      .single()
    if (convErr || !conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Override quote_data with what the client sent (may have been edited)
    const conversation = { ...conv as Record<string, unknown>, quote_data: quoteData }

    const { pdfUrl, quoteId } = await generateAndSavePDF(conversation)

    const previewUrl = pdfUrl  // same URL, opened in new tab

    return NextResponse.json({
      success:     true,
      quoteNumber: quoteData.quote_number,
      pdfUrl,
      previewUrl,
      quoteId,
    })
  } catch (err) {
    console.error('[assistant/generate]', err)
    return NextResponse.json(
      { error: 'Generation failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
