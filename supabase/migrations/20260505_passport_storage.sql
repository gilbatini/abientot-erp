-- ============================================================
-- Migration: 20260505_passport_storage.sql
-- Private bucket for traveller passport scans + traveller columns
-- ============================================================

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'traveller-passports',
  'traveller-passports',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS policies ─────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can upload passports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'traveller-passports');

CREATE POLICY "Authenticated users can read passports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'traveller-passports');

CREATE POLICY "Authenticated users can update their own passport uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'traveller-passports' AND owner = auth.uid());

-- Role is stored in user_metadata (raw_user_meta_data in auth.users,
-- exposed in JWT as auth.jwt() -> 'user_metadata' ->> 'role').
-- This matches the existing pattern: user?.user_metadata?.role.
CREATE POLICY "Admins can delete passports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'traveller-passports'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ── Extend travellers table ───────────────────────────────────────────────────
ALTER TABLE travellers
  ADD COLUMN IF NOT EXISTS passport_file_path  text,
  ADD COLUMN IF NOT EXISTS passport_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS passport_uploaded_by uuid REFERENCES auth.users(id);
