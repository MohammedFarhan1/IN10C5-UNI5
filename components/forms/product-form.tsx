"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionState } from "@/types";

type ProductFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
};

const initialState: ActionState = {};

export function ProductForm({ action }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Product name
          </label>
          <Input id="name" name="name" placeholder="Limited edition coffee dripper" required />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="description">
            Description
          </label>
          <textarea
            className="min-h-36 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            id="description"
            name="description"
            placeholder="Tell buyers what makes this product worth tracking unit by unit."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="price">
            Price (INR)
          </label>
          <Input id="price" min="1" name="price" required step="0.01" type="number" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="total_units">
            Total units
          </label>
          <Input id="total_units" min="1" name="total_units" required step="1" type="number" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="image_url">
            Image URL
          </label>
          <Input
            id="image_url"
            name="image_url"
            placeholder="https://images.example.com/product.jpg"
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
        {pending ? "Creating product..." : "Create product and units"}
      </Button>
    </form>
  );
}