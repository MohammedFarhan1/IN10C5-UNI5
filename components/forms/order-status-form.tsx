"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { MarketplaceOrderStatus } from "@/types";

type OrderStatusFormProps = {
  action: (formData: FormData) => Promise<void>;
  subOrderId: string;
  status: MarketplaceOrderStatus;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-xl px-3 py-2 text-xs" disabled={pending} type="submit" variant="secondary">
      {pending ? "Saving..." : "Update"}
    </Button>
  );
}

export function OrderStatusForm({ action, subOrderId, status }: OrderStatusFormProps) {
  return (
    <form action={action} className="flex min-w-[180px] items-center gap-2">
      <input name="sub_order_id" type="hidden" value={subOrderId} />
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-brand-ink outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
        defaultValue={status}
        name="status"
      >
        <option value="placed">Order placed</option>
        <option value="confirmed">Confirmed</option>
        <option value="packed">Packed</option>
        <option value="shipped">Shipped</option>
        <option value="out_for_delivery">Out for delivery</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
        <option value="returned">Returned</option>
      </select>
      <SubmitButton />
    </form>
  );
}
