"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionState } from "@/types";

type CheckoutFormProps = {
  productId: string;
  availableUnits: number;
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

const initialState: ActionState = {};

export function CheckoutForm({ productId, availableUnits, action }: CheckoutFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="product_id" type="hidden" value={productId} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="quantity">
          Quantity
        </label>
        <Input
          defaultValue={1}
          id="quantity"
          max={Math.min(availableUnits, 10)}
          min="1"
          name="quantity"
          required
          step="1"
          type="number"
        />
        <p className="text-xs text-slate-500">
          Pick up to {Math.min(availableUnits, 10)} unit{Math.min(availableUnits, 10) === 1 ? "" : "s"} for this order.
        </p>
      </div>
      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Assigning units..." : "Confirm purchase"}
      </Button>
    </form>
  );
}
