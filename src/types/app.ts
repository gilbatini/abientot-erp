// AlgoriOffice by Algorivia — App-level types
// Supabase generated types go in database.ts (run: npm run types)

export type Role           = "admin" | "agent" | "viewer";
export type InvoiceStatus  = "draft" | "sent" | "paid" | "cancelled";
export type DocumentStatus = "draft" | "sent" | "approved" | "rejected" | "expired";
export type PaymentMethod  = "bank_transfer" | "card" | "mobile_money" | "cash";
export type ServiceType    = "flight" | "airport_transfer" | "hotel" | "safari_package" | "glamping" | "bed_breakfast";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  flight:           "✈️ Flight Booking",
  airport_transfer: "🚐 Airport Transfer",
  hotel:            "🏨 Hotel Reservation",
  safari_package:   "🦁 Safari Package",
  glamping:         "⛺ Glamping",
  bed_breakfast:    "🌅 Bed & Breakfast",
};

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  card:          "Card",
  mobile_money:  "Mobile Money",
  cash:          "Cash",
};

export const CURRENCIES = ["USD","UGX","EUR","GBP","KES","TZS","RWF","AED","CAD","ZAR"] as const;
export type Currency = typeof CURRENCIES[number];

/** À Bientôt Tour & Travels Ltd — client branding used in documents and emails */
export const BRAND = {
  name:         "À Bientôt Tour & Travels Ltd",
  short:        "À Bientôt",
  tagline:      "Pearl of Africa · Kampala, Uganda",
  address:      "Reed Complex, Ntinda Kiwatule, Kampala, Uganda",
  email:        "abientottours2023@gmail.com",
  phones:       ["+256 788 138 721", "+256 752 338 938"],
  primaryColor: "#2BBFB3",
} as const;

/** AlgoriOffice — product metadata by Algorivia */
export const ALGORIOFFICE = {
  product:   "AlgoriOffice",
  company:   "Algorivia",
  website:   "algorivia.com",
  fromEmail: "AlgoriOffice <noreply@algorivia.com>",
} as const;
