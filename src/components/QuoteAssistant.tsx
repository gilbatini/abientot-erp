'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { QuoteAssistantMessages, type Message } from './QuoteAssistantMessages'
import { QuoteAssistantSummary } from './QuoteAssistantSummary'
import { QuoteAssistantDone } from './QuoteAssistantDone'
import type { QuoteData } from '@/lib/quote-assistant-parser'
import type { Role } from '@/types/app'

interface Props {
  role:      Role
  agentName: string
}

type PanelState = 'collecting' | 'summary' | 'generating' | 'done'

interface DoneResult {
  quoteNumber: string
  pdfUrl:      string
  previewUrl:  string
  quoteId:     string
}

const GREETING: Message = {
  role:    'assistant',
  content: "Hi! I'm the À Bientôt Quote Assistant ✨\n\nDescribe the trip and I'll pull together a professional quote. You can type everything at once, or I'll ask follow-up questions.\n\nHow can I help today?",
}

export function QuoteAssistant({ role, agentName }: Props) {
  // Only agents and admins can use the assistant
  if (role === 'viewer') return null

  const [open,           setOpen]           = useState(false)
  const [messages,       setMessages]       = useState<Message[]>([GREETING])
  const [panelState,     setPanelState]     = useState<PanelState>('collecting')
  const [generating,     setGenerating]     = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [input,          setInput]          = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [quoteData,      setQuoteData]      = useState<QuoteData | null>(null)
  const [doneResult,     setDoneResult]     = useState<DoneResult | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`
  }, [input])

  const reset = useCallback(() => {
    setMessages([GREETING])
    setPanelState('collecting')
    setGenerating(false)
    setConversationId(null)
    setQuoteData(null)
    setDoneResult(null)
    setInput('')
  }, [])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/assistant/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ conversationId, message: text }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Chat failed')

      setConversationId(data.conversationId)

      if (data.state === 'summary' && data.quoteData) {
        setQuoteData(data.quoteData)
        setPanelState('summary')
        setMessages(prev => [...prev, {
          role:    'assistant',
          content: '✅ Got everything I need! Review the quote below.',
        }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        setPanelState('collecting')
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: `❌ ${err instanceof Error ? err.message : 'Something went wrong. Please try again.'}`,
      }])
    } finally {
      setLoading(false)
    }
  }

  async function generatePDF() {
    if (!quoteData || !conversationId) return
    setGenerating(true)

    try {
      const res = await fetch('/api/assistant/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ conversationId, quoteData }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Generation failed')

      setDoneResult({
        quoteNumber: data.quoteNumber,
        pdfUrl:      data.pdfUrl,
        previewUrl:  data.previewUrl,
        quoteId:     data.quoteId,
      })
      setPanelState('done')
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: `❌ PDF generation failed: ${err instanceof Error ? err.message : 'Please try again.'}`,
      }])
    } finally {
      setGenerating(false)
    }
  }

  function handleEdit() {
    setPanelState('collecting')
    setMessages(prev => [...prev, {
      role:    'assistant',
      content: 'No problem! What would you like to change?',
    }])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-lg
                   transition-transform hover:scale-105 active:scale-95"
        style={{ width: 56, height: 56, background: '#2BBFB3' }}
        title="Quote Assistant"
        aria-label="Open Quote Assistant"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{
            bottom:  80,
            right:   24,
            width:   384,
            height:  560,
            border:  '1px solid #dadce0',
            background: '#ffffff',
            // mobile
            ...(typeof window !== 'undefined' && window.innerWidth < 480
              ? { width: 'calc(100vw - 32px)', height: '70vh', right: 16 }
              : {}),
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ background: '#2BBFB3' }}
          >
            <div>
              <div
                className="font-semibold text-white text-sm"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ✨ Quote Assistant
              </div>
              <div className="text-white text-xs" style={{ opacity: 0.75 }}>
                À Bientôt Tour &amp; Travels · {agentName}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white text-xl leading-none hover:opacity-75 transition-opacity"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Body */}
          {panelState === 'done' && doneResult && quoteData ? (
            <QuoteAssistantDone
              data={quoteData}
              pdfUrl={doneResult.pdfUrl}
              quoteId={doneResult.quoteId}
              onNewQuote={reset}
            />
          ) : panelState === 'summary' && quoteData ? (
            <QuoteAssistantSummary
              data={quoteData}
              generating={generating}
              onEdit={handleEdit}
              onGenerate={generatePDF}
            />
          ) : (
            <>
              <QuoteAssistantMessages messages={messages} loading={loading} />

              {/* Input area */}
              <div
                className="flex-shrink-0 flex items-end gap-2 px-3 py-2"
                style={{ background: '#ffffff', borderTop: '1px solid #dadce0' }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe the trip..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    border:     '1px solid #dadce0',
                    fontFamily: 'var(--font-body)',
                    maxHeight:  100,
                    lineHeight: '1.5',
                  }}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                             disabled:opacity-40 transition-opacity hover:opacity-80"
                  style={{ background: '#2BBFB3' }}
                  aria-label="Send"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M2 21 23 12 2 3v7l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
