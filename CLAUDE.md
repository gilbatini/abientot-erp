# AlgoriOffice — Claude Code Instructions

## Product
**AlgoriOffice** is a product by **Algorivia** (algorivia.com).
This instance is deployed for **À Bientôt Tour & Travels Ltd** — Kampala, Uganda.

Stack: Next.js 15 App Router · TypeScript · Supabase · Tailwind CSS v4 · Resend · @react-pdf/renderer
Repo: github.com/gilbatini/abientot-erp
Deploy: Vercel → abientot-erp.vercel.app

## Personas
- Admin: Remmy Ssekanjako — full CRUD, user management, settings
- Agents: Rida + others — create/edit records, cannot delete, cannot manage users
- Viewer: read-only access to all records

---

## Architecture Rules

### Data fetching
- Server Components fetch data directly using `src/lib/supabase/server.ts`
- Never fetch in Client Components — pass data as props or use Server Actions
- All mutations (create, update, delete) live in `src/actions/*.ts` as Server Actions
- Always call `next_doc_number(key)` via Supabase RPC for document numbering — never generate numbers client-side

### Auth
- Session managed by Supabase Auth + `src/middleware.ts`
- Role stored in `session.user.user_metadata.role` (values: 'admin' | 'agent' | 'viewer')
- Always check role before rendering edit/delete/settings UI
- Redirect unauthenticated users to `/login`

### Types
- Run `npm run types` after any schema change to regenerate `src/types/database.ts`
- Use generated Database types for all Supabase queries — no raw string casting
- App-level enums live in `src/types/app.ts`

### PDF Generation
- Use `@react-pdf/renderer` — never window.print() or browser print dialog
- PDF templates live in `src/components/documents/`
- Generate via Server Action, return as base64, download client-side
- Brand: teal #2BBFB3, Space Grotesk headings, DM Sans body
- @react-pdf requires all styles as inline JS objects — no Tailwind inside PDF components

### Email (Resend)
- All sends go through `src/lib/email/sender.ts`
- React Email templates live in `src/components/emails/`
- Always attach PDF as base64 on invoice/receipt emails
- From address: `AlgoriOffice <noreply@algorivia.com>`

### Styling
- Tailwind CSS v4 with brand tokens in `tailwind.config.ts`
- Primary: #2BBFB3 → `text-primary` / `bg-primary`
- Headings: Space Grotesk via `font-display`
- Body/UI: DM Sans via `font-body`
- No inline styles in UI components (PDF templates are the only exception)

### Status color convention
| Status    | Background  | Text      |
|-----------|-------------|-----------|
| draft     | gray-100    | gray-600  |
| sent      | teal-50     | teal-700  |
| paid      | green-50    | green-700 |
| cancelled | red-50      | red-600   |
| approved  | green-50    | green-700 |
| rejected  | red-50      | red-600   |
| expired   | amber-50    | amber-700 |

### File naming
- Components: PascalCase.tsx
- Server Actions: camelCase in `src/actions/*.ts`
- Utilities: camelCase in `src/lib/utils/*.ts`
- Pages: `page.tsx` (Next.js convention)

### Do not
- Do NOT add `'use client'` to page-level components — keep pages as Server Components
- Do NOT hardcode document numbers — always use `next_doc_number()` RPC
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
- Do NOT recreate the CDN/Babel/inline-script pattern from the prototype

---

## Brand Constants

### Client (À Bientôt Tour & Travels Ltd)
```ts
export const BRAND = {
  name:         "À Bientôt Tour & Travels Ltd",
  short:        "À Bientôt",
  tagline:      "Pearl of Africa · Kampala, Uganda",
  address:      "Reed Complex, Ntinda Kiwatule, Kampala, Uganda",
  email:        "abientottours2023@gmail.com",
  phones:       ["+256 788 138 721", "+256 752 338 938"],
  primaryColor: "#2BBFB3",
} as const;
```

### Product (AlgoriOffice by Algorivia)
```ts
export const ALGORIOFFICE = {
  product:   "AlgoriOffice",
  company:   "Algorivia",
  website:   "algorivia.com",
  fromEmail: "AlgoriOffice <noreply@algorivia.com>",
} as const;
```

---

## Currency Utility (`src/lib/utils/currency.ts`)

```ts
const SYMBOLS: Record<string, string> = {
  USD:"$", EUR:"€", GBP:"£", UGX:"UGX ", KES:"KSh ",
  TZS:"TSh ", RWF:"RWF ", AED:"د.إ", CAD:"C$", ZAR:"R"
};
const NO_DECIMALS = ["UGX","KES","TZS","RWF"];

export function fmtCurrency(amount: number, currency: string): string {
  const sym = SYMBOLS[currency] ?? currency + " ";
  return NO_DECIMALS.includes(currency)
    ? sym + Math.round(amount).toLocaleString()
    : sym + amount.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
}
```

---

## Module Status Enums (`src/types/app.ts`)

```ts
export type InvoiceStatus  = "draft" | "sent" | "paid" | "cancelled";
export type DocumentStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type PaymentMethod  = "bank_transfer" | "card" | "mobile_money" | "cash";
export type Role           = "admin" | "agent" | "viewer";
export type ServiceType    = "flight" | "airport_transfer" | "hotel" | "safari_package" | "glamping" | "bed_breakfast";
```

---

## Service Type Labels

```ts
export const SERVICE_LABELS: Record<ServiceType, string> = {
  flight:           "✈️ Flight Booking",
  airport_transfer: "🚐 Airport Transfer",
  hotel:            "🏨 Hotel Reservation",
  safari_package:   "🦁 Safari Package",
  glamping:         "⛺ Glamping",
  bed_breakfast:    "🌅 Bed & Breakfast",
};
```
