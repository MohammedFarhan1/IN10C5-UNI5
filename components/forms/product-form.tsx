"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
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

type ListingDraft = {
  custom_variant_id: string;
  seller_sku: string;
  price: string;
  mrp: string;
  stock_quantity: string;
};

type AttributeGroup = {
  id: string;
  name: string;
  values: string;
};

type VariantCombination = {
  key: string;
  attributes: Record<string, string>;
  label: string;
  size?: string;
  color?: string;
};

const initialState: ActionState = {};

const emptyListingDraft: ListingDraft = {
  custom_variant_id: "",
  seller_sku: "",
  price: "",
  mrp: "",
  stock_quantity: ""
};

function parseValues(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function buildVariantCombinations(
  groups: Array<{ id: string; name: string; values: string[] }>
): VariantCombination[] {
  if (groups.length === 0) {
    return [];
  }

  let combinations: Array<{ attributes: Record<string, string>; labelParts: string[] }> = [
    { attributes: {}, labelParts: [] }
  ];

  for (const group of groups) {
    combinations = combinations.flatMap((combo) =>
      group.values.map((value) => ({
        attributes: { ...combo.attributes, [group.name]: value },
        labelParts: [...combo.labelParts, `${group.name}: ${value}`]
      }))
    );
  }

  return combinations.map((combo) => {
    const entries = Object.entries(combo.attributes);
    const key = entries.map(([name, value]) => `${name}=${value}`).join("||");
    const sizeEntry = entries.find(([name]) => name.toLowerCase() === "size");
    const colorEntry = entries.find(([name]) => name.toLowerCase() === "color");

    return {
      key,
      attributes: combo.attributes,
      label: combo.labelParts.join(" / "),
      size: sizeEntry?.[1],
      color: colorEntry?.[1]
    } satisfies VariantCombination;
  });
}
export function ProductForm({ action, categories }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([
    { id: "attr-1", name: "Size", values: "" },
    { id: "attr-2", name: "Color", values: "" }
  ]);
  const [listingDrafts, setListingDrafts] = useState<Record<string, ListingDraft>>({});

  const normalizedGroups = useMemo(
    () =>
      attributeGroups
        .map((group) => ({
          id: group.id,
          name: group.name.trim(),
          values: parseValues(group.values)
        }))
        .filter((group) => group.name.length > 0 && group.values.length > 0),
    [attributeGroups]
  );

  const combinations = useMemo(
    () => buildVariantCombinations(normalizedGroups),
    [normalizedGroups]
  );

  const variantsPayload = useMemo(
    () =>
      JSON.stringify(
        combinations.map((combination) => {
          const draft = listingDrafts[combination.key] ?? emptyListingDraft;

          return {
            custom_variant_id: draft.custom_variant_id.trim() || null,
            size: combination.size || null,
            color: combination.color || null,
            attributes: combination.attributes,
            seller_sku: draft.seller_sku.trim(),
            price: Number(draft.price || 0),
            mrp: Number(draft.mrp || 0),
            stock_quantity: Number(draft.stock_quantity || 0)
          };
        })
      ),
    [combinations, listingDrafts]
  );

  function updateListingDraft(key: string, field: keyof ListingDraft, value: string) {
    setListingDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? emptyListingDraft),
        [field]: value
      }
    }));
  }

  function updateAttributeGroup(id: string, field: "name" | "values", value: string) {
    setAttributeGroups((current) =>
      current.map((group) => (group.id === id ? { ...group, [field]: value } : group))
    );
  }

  function addAttributeGroup() {
    setAttributeGroups((current) => [
      ...current,
      { id: `attr-${Date.now()}-${Math.floor(Math.random() * 1000)}`, name: "", values: "" }
    ]);
  }

  function removeAttributeGroup(id: string) {
    setAttributeGroups((current) => current.filter((group) => group.id !== id));
  }

  return (
    <form action={formAction} className="space-y-8">
      <input name="variants_payload" type="hidden" value={variantsPayload} />

      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-brand-ink">Product</h2>
          <p className="mt-1 text-sm text-slate-500">
            Store shared catalog information once. Price and stock live only inside seller listings below.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Product name
            </label>
            <Input id="name" name="name" placeholder="Air Max Runner" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="custom_product_id">
              Custom product ID
            </label>
            <Input
              id="custom_product_id"
              name="custom_product_id"
              placeholder="Optional seller-defined ID"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="brand">
              Brand
            </label>
            <Input id="brand" name="brand" placeholder="Nike" required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="category_id">
              Category
            </label>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
              defaultValue=""
              id="category_id"
              name="category_id"
            >
              <option value="">
                {categories.length > 0 ? "Select an existing category" : "No categories yet"}
              </option>
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
              id="description"
              name="description"
              placeholder="Describe the product once for all variants."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="catalog_reference">
              Catalog reference
            </label>
            <Input
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
              id="image_urls"
              name="image_urls"
              placeholder={"https://images.example.com/product-front.jpg\nhttps://images.example.com/product-side.jpg"}
            />
            <p className="text-xs text-slate-500">
              Add one image URL per line. The first image becomes the main image and the rest fill the gallery.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-brand-ink">Variants</h2>
          <p className="mt-1 text-sm text-slate-500">
            Every attribute combination becomes a sellable variant with its own listing.
          </p>
        </div>

        <div className="space-y-4">
          {attributeGroups.map((group) => (
            <div
              className="grid items-end gap-3 md:grid-cols-[1fr_1.2fr_auto]"
              key={group.id}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Attribute name</label>
                <Input
                  placeholder="Size, Color, Material"
                  value={group.name}
                  onChange={(event) => updateAttributeGroup(group.id, "name", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Values</label>
                <Input
                  placeholder="S, M, L"
                  value={group.values}
                  onChange={(event) => updateAttributeGroup(group.id, "values", event.target.value)}
                />
              </div>

              {attributeGroups.length > 1 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => removeAttributeGroup(group.id)}
                >
                  Remove
                </Button>
              ) : (
                <div className="h-10" />
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={addAttributeGroup}>
              Add attribute
            </Button>
            <p className="text-xs text-slate-500">Separate values with commas.</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-brand-ink">Seller listings</h2>
          <p className="mt-1 text-sm text-slate-500">
            `seller_sku`, price, MRP, and stock are stored only at listing level. Each listing is linked to a generated `variant_id`.
          </p>
        </div>

        {combinations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Add at least one attribute with values to generate sellable variants.
          </div>
        ) : (
          <div className="space-y-4">
            {combinations.map((combination, index) => {
              const draft = listingDrafts[combination.key] ?? emptyListingDraft;

              return (
                <div
                  key={combination.key}
                  className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-pine">
                        Variant {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-brand-ink">{combination.label}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      `variant_id` is system-generated when you save.
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Custom variant ID</label>
                      <Input
                        value={draft.custom_variant_id}
                        onChange={(event) =>
                          updateListingDraft(combination.key, "custom_variant_id", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Seller SKU</label>
                      <Input
                        required
                        value={draft.seller_sku}
                        onChange={(event) =>
                          updateListingDraft(combination.key, "seller_sku", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Price (INR)</label>
                      <Input
                        min="0.01"
                        required
                        step="0.01"
                        type="number"
                        value={draft.price}
                        onChange={(event) =>
                          updateListingDraft(combination.key, "price", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">MRP (INR)</label>
                      <Input
                        min="0.01"
                        required
                        step="0.01"
                        type="number"
                        value={draft.mrp}
                        onChange={(event) =>
                          updateListingDraft(combination.key, "mrp", event.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Stock quantity</label>
                      <Input
                        min="0"
                        required
                        step="1"
                        type="number"
                        value={draft.stock_quantity}
                        onChange={(event) =>
                          updateListingDraft(combination.key, "stock_quantity", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Need to create a whole catalog at once?{" "}
        <Link
          className="font-medium text-brand-pine hover:text-brand-ink"
          href="/dashboard/products/bulk-upload"
        >
          Use bulk variant upload
        </Link>
        .
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      <Button disabled={pending || combinations.length === 0} type="submit">
        {pending ? "Creating product..." : "Create product, variants, and listings"}
      </Button>
    </form>
  );
}







