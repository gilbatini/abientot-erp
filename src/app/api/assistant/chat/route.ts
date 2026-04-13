import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { quoteBotReply } from '@/lib/quote-bot'

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

    const { conversationId, message } = await req.json() as {
      conversationId: string | null
      message:        string
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const agentName = user.user_metadata?.name ?? user.email ?? 'Agent'

    const result = await quoteBotReply({
      agentId:        user.id,
      agentName,
      message:        message.trim(),
      interface:      'panel',
      conversationId: conversationId ?? undefined,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[assistant/chat]', err)
    return NextResponse.json(
      { error: 'Chat failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
