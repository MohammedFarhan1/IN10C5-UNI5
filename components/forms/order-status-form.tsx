"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/types";

type OrderStatusFormProps = {
  action: (formData: FormData) => Promise<void>;
  orderId: string;
  status: OrderStatus;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-xl px-3 py-2 text-xs" disabled={pending} type="submit" variant="secondary">
      {pending ? "Saving..." : "Update"}
    </Button>
  );
}

export function OrderStatusForm({ action, orderId, status }: OrderStatusFormProps) {
  return (
    <form action={action} className="flex min-w-[180px] items-center gap-2">
      <input name="order_id" type="hidden" value={orderId} />
      <select
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-brand-ink outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
        defaultValue={status}
        name="status"
      >
        <option value="ordered">Ordered</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <SubmitButton />
    </form>
  );
}
