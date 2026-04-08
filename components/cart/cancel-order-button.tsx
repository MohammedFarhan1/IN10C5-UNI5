"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ActionState } from "@/types";
import { cancelOrderGroupAction } from "@/lib/actions/orders";

type CancelOrderButtonProps = {
  orderGroupId: string;
};

const initialState: ActionState = {};

export function CancelOrderButton({ orderGroupId }: CancelOrderButtonProps) {
  const [state, formAction, pending] = useActionState(cancelOrderGroupAction, initialState);

  return (
    <div className="space-y-2">
      <form action={formAction} className="inline-flex">
        <input name="order_group_id" type="hidden" value={orderGroupId} />
        <Button type="submit" variant="secondary" className="rounded-xl px-3 py-2 text-xs" disabled={pending}>
          {pending ? "Cancelling..." : "Cancel order"}
        </Button>
      </form>
      {state.error ? (
        <p className="text-xs text-rose-600">{state.error}</p>
      ) : state.success ? (
        <p className="text-xs text-emerald-600">{state.success}</p>
      ) : null}
    </div>
  );
}
