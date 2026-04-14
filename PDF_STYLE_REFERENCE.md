---
name: pdf-style-reference
description: >
  Complete styling reference for all À Bientôt Tour & Travels PDF documents.
  Read this before generating any PDF — quotation, proforma, invoice or receipt.
  Defines exact colours, fonts, sizes, layout structure and spacing.
  Use alongside PDF_QUOTATION.md and QUOTE_ASSISTANT_SKILL.md.
---

# À Bientôt PDF — Complete Style Reference

---

## Page Setup

```
Page size:      A4 (210mm × 297mm)
Left margin:    20mm
Right margin:   20mm
Top margin:     26mm
Bottom margin:  18mm
Content width:  170mm (A4 width minus both margins)
```

---

## Brand Colours

```
Primary Teal:    #2BBFB3   main accent — header bar, dividers, tags, totals, chips
Light Teal:      #e6f9f8   note box bg, total row bg, page footer bar, badge bg
Dark Text:       #202124   all primary body text, client name, amounts
Secondary Text:  #5f6368   labels, subtitles, table column headers, footer
Light Grey:      #f8f9fa   alternating table rows, totals box background
Border Grey:     #dadce0   table borders, dividers, box outlines
Teal Border:     #8addd8   note box outline only
```

---

## Page Decoration

Applied on EVERY page via `onFirstPage` and `onLaterPages` canvas callbacks:

```
Top bar:
  Height:     7mm
  Position:   top of page, full width
  Colour:     #2BBFB3 (solid fill, no stroke)

Bottom bar:
  Height:     10mm
  Position:   bottom of page, full width
  Colour:     #e6f9f8 (solid fill, no stroke)
```

---

## Typography

### Font Mapping

```
PDF (ReportLab)      →   Web / ERP (AlgoriOffice)
─────────────────────────────────────────────────
Helvetica-Bold       →   Space Grotesk, weight 600 or 700
Helvetica            →   DM Sans, weight 400 or 500
```

Both fonts are already loaded in AlgoriOffice via Google Fonts.

---

### Complete Text Style Definitions

| Style Name   | Weight  | Size  | Colour    | Align   | Line Height | Usage |
|---|---|---|---|---|---|---|
| `doc_title`  | Bold    | 26pt  | `#2BBFB3` | Right   | auto        | Document type — "QUOTATION" / "INVOICE" |
| `doc_num`    | Bold    | 14pt  | `#202124` | Right   | auto        | Document number — "QT-2026-0008" |
| `doc_sub`    | Regular | 9pt   | `#5f6368` | Right   | auto        | Issued date, Expires date |
| `chip`       | Bold    | 8pt   | `#2BBFB3` | Right   | auto        | Status — "● SENT" / "● DRAFT" |
| `agency_sub` | Regular | 9pt   | `#5f6368` | Left    | auto        | Agency address, phone, email |
| `label`      | Bold    | 8pt   | `#2BBFB3` | Left    | auto        | Section labels — "QUOTE FOR" / "CONSULTANT" |
| `client_name`| Bold    | 13pt  | `#202124` | Left    | auto        | Client full name / agent name |
| `client_sub` | Regular | 10pt  | `#5f6368` | Left    | auto        | Phone number, country |
| `th`         | Bold    | 8pt   | `#5f6368` | Left    | auto        | Table column headers — SERVICE / PAX / TOTAL |
| `td`         | Regular | 10pt  | `#202124` | Left    | 14pt        | Table body text and descriptions |
| `td_tag`     | Bold    | 8pt   | `#2BBFB3` | Left    | auto        | Service type tag above description |
| `td_grey`    | Regular | 10pt  | `#5f6368` | Left    | auto        | Traveller name, date, secondary columns |
| `total_lbl`  | Bold    | 13pt  | `#202124` | Left    | auto        | "Estimated Total" label |
| `total_val`  | Bold    | 13pt  | `#2BBFB3` | Right   | auto        | Total amount value |
| `sub_lbl`    | Regular | 9pt   | `#5f6368` | Left    | auto        | Subtotal / Discount / Tax labels |
| `sub_val`    | Regular | 9pt   | `#5f6368` | Right   | auto        | Subtotal / Discount / Tax values |
| `note`       | Regular | 9pt   | `#202124` | Left    | 14pt        | Note box paragraph text |
| `footer`     | Regular | 8pt   | `#5f6368` | Centre  | auto        | Footer contact line |
| `terms_lbl`  | Bold    | 8pt   | `#5f6368` | Left    | auto        | "NOTES" / "TERMS & CONDITIONS" headings |
| `terms_val`  | Regular | 9pt   | `#202124` | Left    | 14pt        | Notes and terms line items |
| `bank_lbl`   | Bold    | 8pt   | `#2BBFB3` | Left    | auto        | "PAYMENT / BANKING DETAILS" |
| `bank_head`  | Bold    | 9pt   | `#202124` | Left    | auto        | Bank name |
| `bank_val`   | Regular | 9pt   | `#202124` | Left    | 14pt        | Account number lines |
| `option_badge`| Bold   | 9pt   | `#2BBFB3` | Left    | auto        | Option 2 badge text |

---

## Document Structure

Build story in this exact order every time:

```
── 1. HEADER TABLE ─────────────────────────────────────────────
   Column widths: [88mm | 82mm]

   LEFT COLUMN:
     Row 1: Logo image — 52mm × 52mm
     Row 2: Agency address (agency_sub)
     Row 3: Phone · Email (agency_sub)

   RIGHT COLUMN:
     Row 1: Document type title (doc_title)   e.g. "QUOTATION"
     Row 2: Document number (doc_num)         e.g. "QT-2026-0008"
     Row 3: Issued date (doc_sub)
     Row 4: Expires date bold (doc_sub)
     Row 5: Status chip (chip)                e.g. "● SENT"

── 2. Spacer — 3mm ─────────────────────────────────────────────

── 3. TEAL DIVIDER ─────────────────────────────────────────────
   Thickness: 3pt
   Colour:    #2BBFB3
   Width:     100%

── 4. Spacer — 5mm ─────────────────────────────────────────────

── 5. META TABLE ───────────────────────────────────────────────
   Column widths: [95mm | 75mm]

   LEFT COLUMN:
     Row 1: "QUOTE FOR" label (label)
     Row 2: Client name (client_name)
     Row 3: Client phone (client_sub)
     Row 4: Client country (client_sub)

   RIGHT COLUMN:
     Row 1: "CONSULTANT" label (label)
     Row 2: Agent name (client_name)
     Row 3: "À Bientôt Tour & Travels" (client_sub)
     Row 4: Empty

   NOTE: For invoices change "QUOTE FOR" → "BILL TO"
         For proformas change "QUOTE FOR" → "PREPARED FOR"

── 6. Spacer — 3mm ─────────────────────────────────────────────

── 7. OPTION BADGE (conditional — only when multiple options) ──
   Width:          170mm full content width
   Background:     #e6f9f8
   Bottom border:  2pt solid #2BBFB3
   Outline:        0.5pt #8addd8
   Padding:        7pt top/bottom, 10pt left/right
   Text style:     option_badge
   Example text:   "OPTION 2 — Economy Saver Fare | Longer Transit"

── 8. Spacer — 5mm ─────────────────────────────────────────────

── 9. ITEMS TABLE ──────────────────────────────────────────────
   Column widths: [65mm | 20mm | 23mm | 10mm | 23mm | 24mm]
   Column labels:  SERVICE · TRAVELLER · DATE · PAX · UNIT PRICE · TOTAL
   repeatRows:     1 (header repeats on page 2+)

   HEADER ROW:
     Background:     #f8f9fa
     Bottom border:  1.5pt #2BBFB3
     Text style:     th (8pt bold #5f6368)

   DATA ROWS:
     Alternating bg: white (odd) / #f8f9fa (even)
     Row dividers:   0.5pt #dadce0
     Outer box:      0.5pt #dadce0

   SERVICE CELL (column 1) — nested 2-row table:
     Row 1: Service type tag  (td_tag)  e.g. "FLIGHT BOOKING"
     Row 2: Full description  (td)      e.g. "Kenya Airways (KQ)..."

   OTHER COLUMNS:
     Traveller:   td_grey
     Date:        td_grey
     Pax:         td (centred)
     Unit Price:  td
     Total:       td (bold)

   CELL PADDING (all cells):
     Top: 7pt  Bottom: 7pt  Left: 6pt  Right: 6pt
     Vertical align: TOP

── 10. Spacer — 5mm ────────────────────────────────────────────

── 11. TOTALS WRAPPER ──────────────────────────────────────────
    Outer table column widths: [100mm | 70mm]
    Left column: empty (pushes totals right)
    Right column: TOTALS BOX

    TOTALS BOX column widths: [42mm | 30mm]
    Rows:
      Subtotal       sub_lbl | sub_val
      Discount       sub_lbl | sub_val
      Tax / VAT (X%) sub_lbl | sub_val
      ─────────────────────────────────  (1.5pt #2BBFB3 line above)
      Estimated Total total_lbl | total_val

    Row backgrounds:
      Subtotal / Discount / Tax:  #f8f9fa
      Estimated Total row:        #e6f9f8
    Outer box: 0.5pt #dadce0
    Cell padding: 5pt top/bottom, 8pt left/right
    Vertical align: MIDDLE

── 12. Spacer — 5mm ────────────────────────────────────────────

── 13. NOTE BOX ────────────────────────────────────────────────
    Width:          170mm
    Background:     #e6f9f8
    Bottom border:  2pt solid #2BBFB3
    Outline:        0.5pt #8addd8
    Padding:        8pt top/bottom, 10pt left/right
    Text style:     note (9pt, leading 14pt)
    Content:        "Note: This is an estimated quotation and not a demand
                    for payment. Prices are subject to availability and may
                    change at time of booking. This quote expires on [date]."
                    Add airline-specific note if relevant.

── 14. Spacer — 5mm ────────────────────────────────────────────

── 15. THIN DIVIDER ────────────────────────────────────────────
    Thickness: 0.5pt
    Colour:    #dadce0
    Width:     100%

── 16. Spacer — 4mm ────────────────────────────────────────────

── 17. BOTTOM 3-COLUMN TABLE ───────────────────────────────────
    Column widths: [80mm | 47mm | 43mm]
    Vertical dividers between columns: 0.5pt #dadce0
    Left padding after dividers: 8pt

    COLUMN 1 — PAYMENT / BANKING DETAILS:
      Row 1: "PAYMENT / BANKING DETAILS" (bank_lbl)
      Row 2: Bank name (bank_head)
      Row 3: "Account Name: ABIENTOT TOUR & TRAVELS" (bank_val)
      Row 4: "USD Account:  9030024157236" (bank_val)
      Row 5: "UGX Account:  9030024156841" (bank_val)
      Row 6: "Branch Code:  031008" (bank_val)

    COLUMN 2 — NOTES:
      Row 1: "NOTES" (terms_lbl)
      Rows 2–5: Bullet points specific to this booking (terms_val)
      Format: "· Note text here"

    COLUMN 3 — TERMS & CONDITIONS:
      Row 1: "TERMS & CONDITIONS" (terms_lbl)
      Row 2: "· Quote valid for 14 days" (terms_val)
      Row 3: "· 50% deposit to confirm booking" (terms_val)
      Row 4: "· Balance due 7 days before travel" (terms_val)
      Row 5: "· Cancellation policy applies" (terms_val)

── 18. Spacer — 6mm ────────────────────────────────────────────

── 19. THIN DIVIDER ────────────────────────────────────────────
    Thickness: 0.5pt
    Colour:    #dadce0
    Width:     100%

── 20. Spacer — 3mm ────────────────────────────────────────────

── 21. FOOTER ──────────────────────────────────────────────────
    Style:  footer (8pt regular #5f6368 centred)
    Text:   "Thank you for choosing À Bientôt Tour & Travels  ·
             Pearl of Africa  ·  +256 788 138 721  ·
             abientottours2023@gmail.com"
```

---

## Service Type Tags (exact strings)

```
FLIGHT BOOKING
HOTEL RESERVATION
SAFARI PACKAGE
AIRPORT TRANSFER
GLAMPING
BED & BREAKFAST
ELECTRONIC TRAVEL AUTHORIZATION
```

---

## Document Types & Number Formats

| Document | Title | Number Format | Default Accent |
|---|---|---|---|
| Quotation | `QUOTATION` | `QT-YYYY-XXXX` | `#2BBFB3` teal |
| Proforma | `PROFORMA INVOICE` | `PFI-YYYY-XXXX` | `#188038` green |
| Invoice | `INVOICE` | `ABT-YYYY-XXXX` | `#2BBFB3` teal |
| Receipt | `RECEIPT` | `REC-YYYY-XXXX` | `#2BBFB3` teal |

---

## Banking Details (on every document — no exceptions)

```
Label:        PAYMENT / BANKING DETAILS
Bank:         Stanbic Bank — Ntinda Branch
Account Name: ABIENTOT TOUR & TRAVELS
USD Account:  9030024157236
UGX Account:  9030024156841
Branch Code:  031008
```

---

## Agency Details (on every document — no exceptions)

```
Name:    À Bientôt Tour & Travels
Address: Reed Complex, Ntinda Kiwatule, Kampala, Uganda
Phone:   +256 788 138 721
Email:   abientottours2023@gmail.com
Tagline: Pearl of Africa
```

---

## Logo

```
Source file:   logo.svg
Conversion:    cairosvg.svg2png(url='logo.svg', write_to='/tmp/logo.png', output_width=200)
PDF size:      width=52mm, height=52mm
Position:      top-left of header table
Object fit:    contain
```

---

## Currency Formatting

```python
def fmt(amount, currency='USD'):
    symbols = {
        'USD': '$',   'EUR': '€',   'GBP': '£',
        'UGX': 'UGX ','KES': 'KSh ','TZS': 'TSh ',
        'RWF': 'RWF ','AED': 'AED '
    }
    sym = symbols.get(currency, currency + ' ')
    if currency in ['UGX', 'KES', 'TZS', 'RWF']:
        return f"{sym}{int(round(amount)):,}"   # no decimals
    return f"{sym}{amount:,.2f}"                # 2 decimal places
```

---

## Standard Terms (always use these — never change)

```
· Quote valid for 14 days from issue date
· 50% deposit required to confirm booking
· Balance due 7 days before travel date
· Cancellation policy applies
```

---

## Calculation Rules

```
item.total   = item.unit_price × item.pax
subtotal     = sum of all item.total
discount     = as specified (default 0)
tax          = subtotal × (tax_rate / 100)  (default rate 0)
grand_total  = subtotal - discount + tax

Expiry date  = issue date + 14 days
```

---

## File Naming Convention

```
QT-2026-0008_Olivia_Zanzibar.pdf
PFI-2026-0002_Chen_Wei.pdf
ABT-2026-0003_Amara_Diallo.pdf
REC-2026-0001_Sarah_Mitchell.pdf
```

---

## Related Skill Files

```
PDF_QUOTATION.md           — Full ReportLab code patterns and data shapes
QUOTE_ASSISTANT_SKILL.md   — Quote Assistant bot feature spec
CLAUDE.md                  — AlgoriOffice project conventions and security
```
