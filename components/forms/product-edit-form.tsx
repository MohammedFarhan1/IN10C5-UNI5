"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionState, ProductWithDetails } from "@/types";

type ProductEditFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  product: ProductWithDetails;
};

const initialState: ActionState = {};

export function ProductEditForm({ action, product }: ProductEditFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="product_id" type="hidden" value={product.id} />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Product name
          </label>
          <Input defaultValue={product.name} id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="custom_product_id_readonly">
            Custom product ID
          </label>
          <Input
            defaultValue={product.custom_product_id ?? "Generated product only"}
            disabled
            id="custom_product_id_readonly"
            name="custom_product_id_readonly"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="description">
            Description
          </label>
          <textarea
            className="min-h-36 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            defaultValue={product.description}
            id="description"
            name="description"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="price">
            Price (INR)
          </label>
          <Input
            defaultValue={product.price}
            id="price"
            min="1"
            name="price"
            required
            step="0.01"
            type="number"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="total_units">
            Total units
          </label>
          <Input
            defaultValue={product.total_units}
            disabled
            id="total_units"
            name="total_units_readonly"
          />
          <p className="text-xs text-slate-500">
            Unit counts stay fixed here to preserve generated unit identities.
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="image_url">
            Image URL
          </label>
          <Input
            defaultValue={product.image_url ?? ""}
            id="image_url"
            name="image_url"
            type="url"
          />
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Saving changes..." : "Update product"}
      </Button>
    </form>
  );
}
