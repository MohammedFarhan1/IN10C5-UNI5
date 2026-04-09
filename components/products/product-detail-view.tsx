"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AddToCartForm } from "@/components/cart/add-to-cart-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { MarketplaceListing, MarketplaceProductWithDetails } from "@/types";
import { formatCurrency } from "@/lib/utils";

type ProductDetailViewProps = {
  product: MarketplaceProductWithDetails;
  categoryName?: string | null;
  isCustomer: boolean;
};
type VariantWithListings = NonNullable<MarketplaceProductWithDetails["variants"]>[number];

function discountPercent(listing: MarketplaceListing) {
  if (listing.mrp <= 0 || listing.mrp <= listing.price) {
    return 0;
  }

  return Math.round(((listing.mrp - listing.price) / listing.mrp) * 100);
}

export function ProductDetailView({
  product,
  categoryName,
  isCustomer
}: ProductDetailViewProps) {
  const galleryImages = useMemo(() => {
    const allImages = [product.primary_image_url, ...(product.gallery_image_urls ?? [])].filter(
      (image): image is string => Boolean(image)
    );
    return Array.from(new Set(allImages));
  }, [product.gallery_image_urls, product.primary_image_url]);
  function extractVariantAttributes(variant: VariantWithListings) {
    const entries = Object.entries(variant.attributes ?? {})
      .map(([key, value]) => [key.trim(), value.trim()] as const)
      .filter(([key, value]) => key.length > 0 && value.length > 0);

    if (entries.length > 0) {
      return Object.fromEntries(entries);
    }

    const fallback: Record<string, string> = {};
    if (variant.size) {
      fallback.Size = variant.size;
    }
    if (variant.color) {
      fallback.Color = variant.color;
    }
    return fallback;
  }

  const attributeKeys = useMemo(() => {
    const keys: string[] = [];

    for (const variant of product.variants ?? []) {
      const attributes = extractVariantAttributes(variant);
      for (const key of Object.keys(attributes)) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    }

    return keys;
  }, [product.variants]);

  const attributeOptions = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const key of attributeKeys) {
      map.set(key, []);
    }

    for (const variant of product.variants ?? []) {
      const attributes = extractVariantAttributes(variant);
      for (const key of attributeKeys) {
        const value = attributes[key];
        if (!value) {
          continue;
        }

        const current = map.get(key) ?? [];
        if (!current.includes(value)) {
          current.push(value);
          map.set(key, current);
        }
      }
    }

    return map;
  }, [attributeKeys, product.variants]);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] ?? "");
  const [selectedListingId, setSelectedListingId] = useState("");

  useEffect(() => {
    setSelectedAttributes({});
  }, [product.id]);

  const defaultVariant = useMemo(() => {
    const variants = product.variants ?? [];
    if (variants.length === 0) {
      return null;
    }

    let bestVariant: VariantWithListings | null = null;
    let bestPrice = Number.POSITIVE_INFINITY;

    for (const variant of variants) {
      const prices = (variant.listings ?? []).map((listing) => listing.price);
      const candidatePrice = prices.length > 0 ? Math.min(...prices) : Number.POSITIVE_INFINITY;

      if (candidatePrice < bestPrice) {
        bestPrice = candidatePrice;
        bestVariant = variant;
      }
    }

    return bestVariant ?? variants[0];
  }, [product.variants]);

  useEffect(() => {
    if (attributeKeys.length === 0) {
      return;
    }

    setSelectedAttributes((current) => {
      if (Object.keys(current).length > 0) {
        return current;
      }

      const attributes = defaultVariant ? extractVariantAttributes(defaultVariant) : {};
      return Object.keys(attributes).length > 0 ? attributes : current;
    });
  }, [attributeKeys.length, defaultVariant]);

  const selectedVariant = useMemo(() => {
    const variants = product.variants ?? [];

    if (attributeKeys.length === 0) {
      return variants[0] ?? null;
    }

    return (
      variants.find((variant) => {
        const attributes = extractVariantAttributes(variant);
        return attributeKeys.every(
          (key) => selectedAttributes[key] && attributes[key] === selectedAttributes[key]
        );
      }) ?? null
    );
  }, [attributeKeys, product.variants, selectedAttributes]);

  const sellerOptions = useMemo(
    () => [...(selectedVariant?.listings ?? [])].sort((left, right) => left.price - right.price),
    [selectedVariant]
  );

  const selectedListing = useMemo(
    () => sellerOptions.find((listing) => listing.id === selectedListingId) ?? null,
    [sellerOptions, selectedListingId]
  );

  useEffect(() => {
    setSelectedImage(galleryImages[0] ?? "");
  }, [galleryImages]);

  useEffect(() => {
    const fallbackListing = sellerOptions.find((listing) => listing.available_stock > 0) ?? sellerOptions[0];
    setSelectedListingId(fallbackListing?.id ?? "");
  }, [sellerOptions]);

  const variantSelected =
    (attributeKeys.length === 0 ||
      attributeKeys.every((key) => Boolean(selectedAttributes[key]))) &&
    Boolean(selectedVariant);

  const selectedDiscount = selectedListing ? discountPercent(selectedListing) : 0;
  const selectedStock = selectedListing?.available_stock ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 md:px-6 lg:px-8 lg:py-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-soft sm:rounded-[32px]">
            <img
              alt={product.name}
              className="aspect-square w-full object-cover sm:aspect-[5/4]"
              src={
                selectedImage ||
                "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1200&q=80"
              }
            />
          </div>

          {galleryImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((image) => (
                <button
                  className={`overflow-hidden rounded-2xl border ${
                    selectedImage === image ? "border-brand-pine" : "border-slate-200"
                  }`}
                  key={image}
                  onClick={() => setSelectedImage(image)}
                  type="button"
                >
                  <img alt={product.name} className="aspect-square w-full object-cover" src={image} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Card className="space-y-6 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-pine">
              Variant-based product
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-brand-ink sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
              <span>{product.brand}</span>
              {categoryName ? <span>• {categoryName}</span> : null}
              {product.custom_product_id ? <span>• {product.custom_product_id}</span> : null}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{product.description}</p>
          </div>

          <div className="space-y-4">
            {attributeKeys.length > 0 ? (
              attributeKeys.map((key) => {
                const options = attributeOptions.get(key) ?? [];

                return (
                  <div key={key}>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {key}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {options.map((value) => (
                        <button
                          className={`rounded-full border px-4 py-2 text-sm font-medium ${
                            selectedAttributes[key] === value
                              ? "border-brand-pine bg-brand-pine text-white"
                              : "border-slate-200 bg-white text-brand-ink"
                          }`}
                          key={`${key}-${value}`}
                          onClick={() =>
                            setSelectedAttributes((current) => ({
                              ...current,
                              [key]: value
                            }))
                          }
                          type="button"
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                No selectable variant options.
              </div>
            )}
          </div>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Price</p>
            {selectedListing ? (
              <div className="mt-2">
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-semibold text-brand-pine">{formatCurrency(selectedListing.price)}</p>
                  <p className="text-sm text-slate-400 line-through">{formatCurrency(selectedListing.mrp)}</p>
                  {selectedDiscount > 0 ? (
                    <p className="text-sm font-semibold text-emerald-600">{selectedDiscount}% off</p>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedListing.seller?.display_name || selectedListing.seller?.business_name || "Seller"} selected
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Select variant options to see pricing.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Seller options</p>
            <div className="mt-3 space-y-3">
              {variantSelected && sellerOptions.length > 0 ? (
                sellerOptions.map((listing) => {
                  const sellerName =
                    listing.seller?.display_name ||
                    listing.seller?.business_name ||
                    listing.seller?.email ||
                    "Seller";

                  return (
                    <button
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                        selectedListingId === listing.id
                          ? "border-brand-pine bg-brand-pine/5"
                          : "border-slate-200 bg-white"
                      }`}
                      key={listing.id}
                      onClick={() => setSelectedListingId(listing.id)}
                      type="button"
                    >
                      <div>
                        <p className="font-medium text-brand-ink">{sellerName}</p>
                        <p className="text-xs text-slate-500">{listing.seller_sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-brand-pine">{formatCurrency(listing.price)}</p>
                        <p className="text-xs text-slate-500">
                          {listing.available_stock > 0 ? "In stock" : "Out of stock"}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                  Select variant options to choose a seller listing.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge value={selectedStock > 0 ? "available" : "sold"} />
            <span className="text-sm text-slate-500">
              {selectedListing
                ? selectedStock > 0
                  ? `${selectedStock} item(s) ready to order`
                  : "This seller listing is currently out of stock"
                : "Variant selection is required before checkout"}
            </span>
          </div>

          {isCustomer ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {selectedListing && selectedStock > 0 ? (
                <>
                  <AddToCartForm listingId={selectedListing.id} maxQuantity={selectedStock} />
                  <Link href={`/checkout/${product.id}?listing=${encodeURIComponent(selectedListing.id)}`}>
                    <Button className="h-12 rounded-xl px-6">Buy now</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button className="h-12 rounded-xl px-6" disabled>
                    Add to cart
                  </Button>
                  <Button className="h-12 rounded-xl px-6" disabled>
                    Buy now
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}














