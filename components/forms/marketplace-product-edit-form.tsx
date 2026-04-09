"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionState, Category, MarketplaceProductWithDetails } from "@/types";

type MarketplaceProductEditFormProps = {
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  categories: Category[];
  product: MarketplaceProductWithDetails;
};

const initialState: ActionState = {};

export function MarketplaceProductEditForm({
  action,
  categories,
  product
}: MarketplaceProductEditFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const imageUrls = [product.primary_image_url, ...(product.gallery_image_urls ?? [])]
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");
  const catalogReference = product.metadata?.catalog_reference ?? "";

  return (
    <form action={formAction} className="space-y-6">
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
            defaultValue={product.custom_product_id ?? "Auto-generated product"}
            disabled
            id="custom_product_id_readonly"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="brand">
            Brand
          </label>
          <Input defaultValue={product.brand} id="brand" name="brand" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="category_id">
            Category
          </label>
          <select
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            defaultValue={product.category_id ?? ""}
            id="category_id"
            name="category_id"
          >
            <option value="">Select an existing category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
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
          <label className="text-sm font-medium text-slate-700" htmlFor="catalog_reference">
            Catalog reference
          </label>
          <Input
            defaultValue={catalogReference}
            id="catalog_reference"
            name="catalog_reference"
            placeholder="Optional internal reference"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="new_category_name">
            New category name
          </label>
          <Input
            id="new_category_name"
            name="new_category_name"
            placeholder="Create a new category if needed"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="new_category_description">
            New category description
          </label>
          <Input
            id="new_category_description"
            name="new_category_description"
            placeholder="Optional category description"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="image_urls">
            Main image + gallery images
          </label>
          <textarea
            className="min-h-28 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            defaultValue={imageUrls}
            id="image_urls"
            name="image_urls"
            placeholder={"https://images.example.com/product-front.jpg\nhttps://images.example.com/product-side.jpg"}
          />
          <p className="text-xs text-slate-500">
            The first image is the main product image. Remaining URLs fill the gallery.
          </p>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      <Button disabled={pending} type="submit">
        {pending ? "Saving changes..." : "Update product"}
      </Button>
    </form>
  );
}
