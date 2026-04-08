"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionState, Category } from "@/types";

type ProductFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  categories: Category[];
};

const initialState: ActionState = {};

export function ProductForm({ action, categories }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Product name
          </label>
          <Input id="name" name="name" placeholder="Limited edition coffee dripper" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="custom_product_id">
            Custom product ID
          </label>
          <Input id="custom_product_id" name="custom_product_id" placeholder="DRIPPER-001" />
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

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="categories">
            Categories
          </label>
          <select
            id="categories"
            name="categories"
            multiple
            className="min-h-36 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">Hold Ctrl (Cmd on Mac) to select multiple categories</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Need to create a whole catalog at once?{" "}
        <Link className="font-medium text-brand-pine hover:text-brand-ink" href="/dashboard/products/bulk-upload">
          Use Bulk upload
        </Link>
        .
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
