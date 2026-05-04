-- ============================================================
-- Migration: 20260505_drop_item_currency.sql
-- Drop per-item currency columns from all three item tables.
-- Document-level currency is the single source of truth.
-- ============================================================

-- ── Sanity check: log any rows where item.currency != parent document currency ─
DO $$
DECLARE
  v_qi integer;
  v_ii integer;
  v_pi integer;
BEGIN
  SELECT COUNT(*) INTO v_qi
  FROM quotation_items qi
  JOIN quotations q ON q.id = qi.quotation_id
  WHERE qi.currency <> q.currency;

  SELECT COUNT(*) INTO v_ii
  FROM invoice_items ii
  JOIN invoices i ON i.id = ii.invoice_id
  WHERE ii.currency <> i.currency;

  SELECT COUNT(*) INTO v_pi
  FROM proforma_items pi
  JOIN proformas p ON p.id = pi.proforma_id
  WHERE pi.currency <> p.currency;

  RAISE NOTICE 'Currency mismatch rows — quotation_items: %, invoice_items: %, proforma_items: %',
    v_qi, v_ii, v_pi;
END $$;

-- ── Drop currency from item tables ────────────────────────────────────────────
ALTER TABLE quotation_items DROP COLUMN IF EXISTS currency;
ALTER TABLE invoice_items   DROP COLUMN IF EXISTS currency;
ALTER TABLE proforma_items  DROP COLUMN IF EXISTS currency;
