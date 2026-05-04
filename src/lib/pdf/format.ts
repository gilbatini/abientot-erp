const SYM: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", UGX: "UGX ", KES: "KSh ",
  TZS: "TSh ", RWF: "RWF ", AED: "AED ", CAD: "C$", ZAR: "R",
};
const NO_DEC = ["UGX", "KES", "TZS", "RWF"];

export function pdfFmtCurrency(amount: number, currency: string): string {
  const sym = SYM[currency] ?? currency + " ";
  return NO_DEC.includes(currency)
    ? sym + Math.round(amount).toLocaleString("en-US")
    : sym + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function pdfFmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}
