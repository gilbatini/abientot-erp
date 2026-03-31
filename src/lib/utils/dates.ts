import { format, differenceInYears, differenceInDays } from "date-fns";

export function formatDate(date: string | Date, fmt = "dd MMM yyyy"): string {
  return format(new Date(date), fmt);
}

export function calcAge(dob: string): number {
  return differenceInYears(new Date(), new Date(dob));
}

export function birthdayStatus(dob: string): { label: string; color: string; bg: string } | null {
  const today   = new Date();
  const thisYear = new Date(today.getFullYear(), new Date(dob).getMonth(), new Date(dob).getDate());
  const diff     = differenceInDays(thisYear, today);
  if (diff === 0)         return { label: "🎂 Birthday TODAY!",        color: "#d93025", bg: "#fce8e6" };
  if (diff > 0 && diff <= 7)  return { label: `🎉 Birthday in ${diff} days`, color: "#e37400", bg: "#fef7e0" };
  if (diff > 0 && diff <= 30) return { label: `🎈 Birthday in ${diff} days`, color: "#188038", bg: "#e6f4ea" };
  return null;
}
