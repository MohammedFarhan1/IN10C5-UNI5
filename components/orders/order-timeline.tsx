import { MarketplaceOrderTrackingEntry, MarketplaceOrderStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<MarketplaceOrderStatus, string> = {
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned"
};

export function OrderTimeline({ entries }: { entries: MarketplaceOrderTrackingEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
        No tracking events yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <div className="flex gap-3" key={entry.tracking_id}>
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-brand-pine" />
            <div
              className={cn(
                "mt-1 w-px flex-1 bg-slate-200",
                index === entries.length - 1 && "bg-transparent"
              )}
            />
          </div>
          <div className="pb-3">
            <p className="text-sm font-semibold text-brand-ink">{STATUS_LABELS[entry.status]}</p>
            <p className="text-xs text-slate-500">{formatDateTime(entry.timestamp)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              {entry.updated_by}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
