import { Role } from "@/types";
import { ROLE_HOME } from "@/lib/constants";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function roleHome(role: Role) {
  return ROLE_HOME[role] ?? "/";
}

export function clampText(value: string, max = 160) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max).trim()}...`;
}

export function getStockSummary(available: number, total: number) {
  if (available <= 0) {
    return "Sold out";
  }

  if (available === total) {
    return `${available} units ready`;
  }

  return `${available} of ${total} units left`;
}

