'use client'

import { useEffect, useRef } from 'react'

export interface Message {
  role:    'user' | 'assistant'
  content: string
}

interface Props {
  messages: Message[]
  loading:  boolean
}

export function QuoteAssistantMessages({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8f9fa' }}>
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className="text-sm rounded-xl px-3 py-2 max-w-[85%] whitespace-pre-wrap"
            style={{
              background: msg.role === 'user' ? '#2BBFB3' : '#ffffff',
              color:      msg.role === 'user' ? '#ffffff' : '#202124',
              border:     msg.role === 'assistant' ? '1px solid #dadce0' : 'none',
              fontFamily: 'var(--font-body), DM Sans, sans-serif',
            }}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <div
            className="text-sm rounded-xl px-3 py-2"
            style={{
              background: '#ffffff',
              border:     '1px solid #dadce0',
              color:      '#9ca3af',
            }}
          >
            <span className="animate-pulse">Thinking…</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
