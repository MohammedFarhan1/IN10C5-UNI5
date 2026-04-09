"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionState, MarketplaceProductWithDetails } from "@/types";
import { getQrCodeUrl } from "@/lib/utils";

const initialState: ActionState = {};

type VariantDraft = {
  id: string;
  variant_id?: string | null;
  listing_id?: string | null;
  custom_variant_id: string;
  size: string;
  color: string;
  attributes: string;
  seller_sku: string;
  price: string;
  mrp: string;
  stock_quantity: string;
};

function parseAttributes(value: string) {
  const entries = value
    .split(/\r?\n|,|;/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");
      if (separatorIndex < 1) {
        return null;
      }
      const key = entry.slice(0, separatorIndex).trim();
      const entryValue = entry.slice(separatorIndex + 1).trim();
      return key && entryValue ? ([key, entryValue] as const) : null;
    })
    .filter((item): item is readonly [string, string] => Boolean(item));

  return entries.length > 0 ? Object.fromEntries(entries) : {};
}

function attributesToText(attributes?: Record<string, string> | null, size?: string | null, color?: string | null) {
  const lines = Object.entries(attributes ?? {}).map(([key, value]) => `${key}: ${value}`);

  if (lines.length === 0) {
    if (size) {
      lines.push(`Size: ${size}`);
    }
    if (color) {
      lines.push(`Color: ${color}`);
    }
  }

  return lines.join("\n");
}

function buildVariantLabel(attributesText: string, size?: string, color?: string) {
  const attributes = parseAttributes(attributesText);
  const entries = Object.entries(attributes);

  if (entries.length > 0) {
    return entries.map(([key, value]) => `${key}: ${value}`).join(" / ");
  }

  const fallback = [size, color].filter(Boolean).join(" / ");
  return fallback || "Variant";
}

function createDraftFromVariant(variant: NonNullable<MarketplaceProductWithDetails["variants"]>[number]) {
  const listing = (variant.listings ?? [])[0];
  return {
    id: `variant-${variant.id}`,
    variant_id: variant.id,
    listing_id: listing?.id ?? null,
    custom_variant_id: variant.custom_variant_id ?? "",
    size: variant.size ?? "",
    color: variant.color ?? "",
    attributes: attributesToText(variant.attributes, variant.size, variant.color),
    seller_sku: listing?.seller_sku ?? "",
    price: listing ? String(listing.price) : "",
    mrp: listing ? String(listing.mrp) : "",
    stock_quantity: listing ? String(listing.stock_on_hand) : ""
  } satisfies VariantDraft;
}

function createEmptyDraft() {
  return {
    id: `new-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    custom_variant_id: "",
    size: "",
    color: "",
    attributes: "",
    seller_sku: "",
    price: "",
    mrp: "",
    stock_quantity: ""
  } satisfies VariantDraft;
}

type MarketplaceVariantManagerProps = {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  product: MarketplaceProductWithDetails;
  categoryName?: string | null;
};

export function MarketplaceVariantManager({
  action,
  product,
  categoryName
}: MarketplaceVariantManagerProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [drafts, setDrafts] = useState<VariantDraft[]>(() =>
    (product.variants ?? []).map(createDraftFromVariant)
  );

  function updateDraft(id: string, field: keyof VariantDraft, value: string) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, [field]: value } : draft))
    );
  }

  function addVariant() {
    setDrafts((current) => [...current, createEmptyDraft()]);
  }

  const payload = useMemo(
    () =>
      JSON.stringify(
        drafts.map((draft) => ({
          variant_id: draft.variant_id ?? null,
          listing_id: draft.listing_id ?? null,
          custom_variant_id: draft.custom_variant_id.trim() || null,
          size: draft.size.trim() || null,
          color: draft.color.trim() || null,
          attributes: parseAttributes(draft.attributes),
          seller_sku: draft.seller_sku.trim(),
          price: Number(draft.price || 0),
          mrp: Number(draft.mrp || 0),
          stock_quantity: Number(draft.stock_quantity || 0)
        }))
      ),
    [drafts]
  );

  return (
    <form action={formAction} className="space-y-6">
      <input name="product_id" type="hidden" value={product.id} />
      <input name="variants_payload" type="hidden" value={payload} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-brand-ink">Variants and inventory</h2>
          <p className="mt-1 text-sm text-slate-600">
            Edit existing variants, update seller SKU, price, MRP, and stock, or add new variants.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={addVariant}>
          Add variant
        </Button>
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.success}</p>
      ) : null}

      <div className="space-y-5">
        {drafts.map((draft, index) => {
          const label = buildVariantLabel(draft.attributes, draft.size, draft.color);
          const qrPayload = JSON.stringify({
            product_id: product.id,
            product_name: product.name,
            brand: product.brand,
            category: categoryName ?? "",
            variant: parseAttributes(draft.attributes),
            seller_sku: draft.seller_sku,
            price: Number(draft.price || 0),
            mrp: Number(draft.mrp || 0),
            stock: Number(draft.stock_quantity || 0)
          });

          return (
            <div
              key={draft.id}
              className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-pine">
                    Variant {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-brand-ink">{label}</p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <img
                    alt="Variant QR code"
                    className="h-24 w-24 rounded-md border border-slate-200 bg-white object-contain"
                    height={96}
                    loading="lazy"
                    src={getQrCodeUrl(qrPayload, 120)}
                    width={96}
                  />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Scan variant
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Custom variant ID</label>
                  <Input
                    value={draft.custom_variant_id}
                    onChange={(event) => updateDraft(draft.id, "custom_variant_id", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Seller SKU</label>
                  <Input
                    required
                    value={draft.seller_sku}
                    onChange={(event) => updateDraft(draft.id, "seller_sku", event.target.value)}
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
                    onChange={(event) => updateDraft(draft.id, "price", event.target.value)}
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
                    onChange={(event) => updateDraft(draft.id, "mrp", event.target.value)}
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
                    onChange={(event) => updateDraft(draft.id, "stock_quantity", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Size (optional)</label>
                  <Input
                    value={draft.size}
                    onChange={(event) => updateDraft(draft.id, "size", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Color (optional)</label>
                  <Input
                    value={draft.color}
                    onChange={(event) => updateDraft(draft.id, "color", event.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                  <label className="text-sm font-medium text-slate-700">Attributes</label>
                  <textarea
                    className="min-h-24 w-full rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                    placeholder="Size: M\nColor: Black\nMaterial: Cotton"
                    value={draft.attributes}
                    onChange={(event) => updateDraft(draft.id, "attributes", event.target.value)}
                  />
                  <p className="text-xs text-slate-500">Enter one attribute per line, for example "Material: Cotton".</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button disabled={pending} type="submit">
        {pending ? "Saving variants..." : "Save variants"}
      </Button>
    </form>
  );
}
