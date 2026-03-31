# VoyageDoc Design System — SKILL.md

Reference for consistent UI generation across all VoyageDoc modules.

---

## Brand Tokens

```css
--color-primary:       #2BBFB3;
--color-primary-dark:  #1a9990;
--color-primary-light: #e6f9f8;
--color-bg:            #f1f3f4;
--color-surface:       #ffffff;
--color-surface-var:   #f8f9fa;
--color-border:        #dadce0;
--color-text:          #202124;
--color-text-muted:    #5f6368;
--color-error:         #d93025;
--color-success:       #188038;
--color-warning:       #f29900;
```

---

## Typography

| Role     | Font          | Weights  | Usage                     |
|----------|---------------|----------|---------------------------|
| Display  | Space Grotesk | 300–700  | Page titles, card headers |
| Body/UI  | DM Sans       | 300–600  | Labels, inputs, body text |

Google Fonts URL:
```
https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap
```

Tailwind config:
```ts
fontFamily: {
  display: ["Space Grotesk", "sans-serif"],
  body:    ["DM Sans", "sans-serif"],
}
```

---

## Tailwind Color Tokens

```ts
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: "#2BBFB3",
    dark:    "#1a9990",
    light:   "#e6f9f8",
  }
}
```

---

## Layout

### App Shell
- Sidebar: 240px fixed left, white bg, border-r border-gray-200
- Content area: ml-60, p-6, bg-gray-50, min-h-screen
- Card: bg-white rounded-2xl shadow-sm border border-gray-100 p-6
- Page header: flex justify-between, mb-6, title in font-display text-2xl font-semibold

### Sidebar Nav Items
```tsx
// Active
<a className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary-light text-primary font-medium text-sm">

// Inactive
<a className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm transition-colors">
```

### Nav Structure
- Dashboard    /dashboard      🏠
- Travellers   /travellers     👥
- Invoices     /invoices       🧾
- Receipts     /receipts       💳
- Proformas    /proformas      📋
- Quotations   /quotations     💬
- Settings     /settings       ⚙️  (admin only)

---

## Status Badge Component

```tsx
const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  sent:      "bg-teal-50 text-teal-700",
  paid:      "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  approved:  "bg-green-50 text-green-700",
  rejected:  "bg-red-50 text-red-600",
  expired:   "bg-amber-50 text-amber-700",
};

export function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
```

---

## Avatar Component

```tsx
const AVATAR_COLORS = ["#1a73e8","#e37400","#188038","#a142f4","#d93025","#007b83","#c5221f","#0d652d"];

function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: avatarColor(name) }}
    >
      {initials}
    </div>
  );
}
```

---

## Button Variants

```tsx
// Primary
<button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">

// Secondary
<button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">

// Danger (admin delete)
<button className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">

// Ghost (table row actions)
<button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
```

---

## Table Pattern

```tsx
<div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-gray-50 border-b border-gray-100">
      <tr>
        <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-50">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-gray-900">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Form Input

```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">{label}</label>
  <input
    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900
               placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30
               focus:border-primary transition-colors"
  />
</div>
```

---

## Dashboard Stats Card

```tsx
<div className="bg-white rounded-2xl border border-gray-100 p-5">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
      {icon}
    </div>
  </div>
  <p className="font-display text-2xl font-semibold text-gray-900">{value}</p>
  <p className="text-xs text-gray-400 mt-1">{subtext}</p>
</div>
```

---

## PDF Document Styles (@react-pdf — inline JS objects only, no Tailwind)

```ts
import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page:       { padding: 48, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  rule:       { height: 2, backgroundColor: "#2BBFB3", marginBottom: 24 },
  h1:         { fontSize: 22, fontWeight: "bold", color: "#202124" },
  h2:         { fontSize: 14, fontWeight: "bold", color: "#202124", marginBottom: 8 },
  body:       { fontSize: 10, color: "#5f6368", lineHeight: 1.5 },
  label:      { fontSize: 8, color: "#5f6368", textTransform: "uppercase", letterSpacing: 0.5 },
  tableHead:  { backgroundColor: "#f1f3f4", flexDirection: "row", padding: "6 8" },
  tableRow:   { flexDirection: "row", padding: "6 8", borderBottomWidth: 1, borderBottomColor: "#e8eaed" },
  totalRow:   { flexDirection: "row", padding: "8 8", backgroundColor: "#e6f9f8" },
  amountBold: { fontSize: 12, fontWeight: "bold", color: "#202124" },
});
```

### Document Header Layout
```
┌──────────────────────────────────────────────────┐
│  [LOGO]  À Bientôt Tour & Travels Ltd            │  Space Grotesk bold
│          Pearl of Africa · Kampala, Uganda        │  9pt muted
│                               INVOICE             │  right, 28pt, #2BBFB3
│                               ABT-2026-0001       │  right, 11pt
├──────────────────────────────────────────────────┤  2px #2BBFB3 rule
│  Bill To:                     Issue Date:         │
│  [Traveller name]             [date]              │
│  [Country]                    Due Date:           │
│  [Email]                      [date]              │
└──────────────────────────────────────────────────┘
```

---

## M3 Shadow Scale

```ts
export const SHADOWS = {
  sm: "0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
  md: "0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)",
  lg: "0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px rgba(60,64,67,0.3)",
};
```

---

## Border Radius Scale

```ts
export const RADIUS = { xs:4, sm:8, md:12, lg:16, xl:24, pill:50 };
// Tailwind: rounded-sm(4) rounded-lg(12) rounded-2xl(16) rounded-3xl(24) rounded-full(pill)
```
