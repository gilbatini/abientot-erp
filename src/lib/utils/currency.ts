const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", UGX: "UGX ",
  KES: "KSh ", TZS: "TSh ", RWF: "RWF ",
  AED: "د.إ", CAD: "C$", ZAR: "R",
};
const NO_DECIMALS = ["UGX", "KES", "TZS", "RWF"];

export function fmtCurrency(amount: number, currency: string): string {
  const sym = SYMBOLS[currency] ?? currency + " ";
  return NO_DECIMALS.includes(currency)
    ? sym + Math.round(amount).toLocaleString()
    : sym + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
