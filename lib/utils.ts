import { Role, MarketplaceVariant } from "@/types";
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

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
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

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function getProductDetailUrl(productId: string) {
  return `${getAppUrl()}/product/${productId}`;
}

export function getUnitTrackingUrl(unitCode: string) {
  return `${getAppUrl()}/track/${encodeURIComponent(unitCode)}`;
}

export function getQrCodeUrl(value: string, size = 180) {
  const normalizedSize = Math.max(96, Math.min(size, 512));
  return `https://api.qrserver.com/v1/create-qr-code/?size=${normalizedSize}x${normalizedSize}&data=${encodeURIComponent(value)}`;
}

export function formatUnitDetails(details?: Record<string, string> | null) {
  if (!details) {
    return [] as Array<[string, string]>;
  }

  return Object.entries(details).filter(([, value]) => value.trim().length > 0);
}

export function formatVariantLabel(
  variant: Pick<MarketplaceVariant, "attributes" | "size" | "color" | "name">
) {
  const attributes = Object.entries(variant.attributes ?? {})
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  if (attributes.length > 0) {
    return attributes.map(([key, value]) => `${key}: ${value}`).join(" / ");
  }

  const fallback = [variant.size, variant.color].filter(Boolean).join(" / ");
  return fallback || variant.name || "Variant";
}




