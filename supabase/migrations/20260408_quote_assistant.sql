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
  pdf_url     TEXT,                          -- Supabase Storage URL once generated
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
CREATE TABLE team_phone_numbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL UNIQUE,    -- e.g. +256788138721 (E.164 format)
  agent_name  TEXT NOT NULL,           -- e.g. "Remmy S"
  role        TEXT NOT NULL DEFAULT 'agent'
              CHECK (role IN ('admin', 'agent')),
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS — allow authenticated reads; service role bypasses for WA webhook
ALTER TABLE team_phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage team phones"
  ON team_phone_numbers FOR ALL
  USING (auth.role() = 'authenticated');

-- Seed with À Bientôt team
INSERT INTO team_phone_numbers (phone, agent_name, role) VALUES
  ('+256788138721', 'Remmy S', 'admin'),
  ('+256752338938', 'Rida',    'agent');
