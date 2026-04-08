"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionState } from "@/types";
import { addToCartAction } from "@/lib/actions/cart";

type AddToCartFormProps = {
  productId: string;
  maxQuantity: number;
};

const initialState: ActionState = {};

export function AddToCartForm({ productId, maxQuantity }: AddToCartFormProps) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);

  return (
    <div className="flex flex-col">
      <form action={formAction} className="flex items-center gap-4">
        <input name="product_id" type="hidden" value={productId} />
        <Input
          className="w-20 h-12 rounded-xl"
          defaultValue="1"
          max={maxQuantity}
          min="1"
          name="quantity"
          type="number"
        />
        <Button disabled={pending} type="submit" className="h-12 rounded-xl px-6 whitespace-nowrap">
          {pending ? "Adding..." : "Add to Cart"}
        </Button>
      </form>
      {state.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-2 text-sm text-green-600">{state.success}</p>
      )}
    </div>
  );
}