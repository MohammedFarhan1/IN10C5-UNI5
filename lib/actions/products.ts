"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionState } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireApprovedSeller } from "@/lib/auth";
import { getSellerOwnedProduct } from "@/lib/data";

const MARKETPLACE_SETUP_GUIDE =
  "Run `supabase/2026_04_10_marketplace_core.sql` in your Supabase SQL editor and add `marketplace` under Supabase Dashboard -> Settings -> API -> Exposed schemas.";

type ImportedUnitRecord = {
  unitId: string;
  details: Record<string, string> | null;
};

type BulkProductUploadRecord = {
  customProductId: string | null;
  name: string;
  brand: string;
  categoryName: string;
  categoryDescription: string | null;
  description: string;
  mainImage: string | null;
  galleryImages: string[];
  variants: VariantCreatePayload[];
};

type VariantCreatePayload = {
  custom_variant_id?: string | null;
  size?: string | null;
  color?: string | null;
  attributes?: Record<string, string> | null;
  seller_sku: string;
  price: number;
  mrp: number;
  stock_quantity: number;
};

function formatMarketplaceActionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Something went wrong while saving the marketplace product.";
  }

  const record = error as {
    code?: string | null;
    message?: string | null;
  };
  const code = record.code ?? "";
  const message = record.message ?? "";
  const combined = `${code} ${message}`.toLowerCase();

  if (
    combined.includes("marketplace") &&
    (
      combined.includes("schema") ||
      combined.includes("relation") ||
      combined.includes("column") ||
      combined.includes("cache") ||
      code === "PGRST106" ||
      code === "42P01" ||
      code === "42703"
    )
  ) {
    return `${MARKETPLACE_SETUP_GUIDE}${message ? ` Supabase said: ${message}` : ""}`;
  }

  return `${MARKETPLACE_SETUP_GUIDE}${message ? ` Supabase said: ${message}` : ""}`;
}

function normalizeDetailMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entryValue]) => [key.trim(), entryValue == null ? "" : String(entryValue).trim()] as const)
    .filter(([key, entryValue]) => key.length > 0 && entryValue.length > 0);

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries);
}

function parseLooseDetails(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) {
    return normalizeDetailMap(JSON.parse(trimmedValue));
  }

  const pairEntries = trimmedValue
    .split(/[;,]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const separatorIndex = segment.includes(":")
        ? segment.indexOf(":")
        : segment.indexOf("=");

      if (separatorIndex < 1) {
        return null;
      }

      const key = segment.slice(0, separatorIndex).trim();
      const entryValue = segment.slice(separatorIndex + 1).trim();
      return key && entryValue ? ([key, entryValue] as const) : null;
    });

  if (pairEntries.every(Boolean) && pairEntries.length > 0) {
    return Object.fromEntries(pairEntries as Array<readonly [string, string]>);
  }

  return { note: trimmedValue };
}

function parseManualUnitEntries(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [rawUnitId, ...rest] = line.split("|");
      const unitId = rawUnitId?.trim();

      if (!unitId) {
        throw new Error(`Line ${index + 1} is missing a unit ID.`);
      }

      const detailsText = rest.join("|").trim();

      return {
        unitId,
        details: detailsText ? parseLooseDetails(detailsText) : null
      } satisfies ImportedUnitRecord;
    });
}

function normalizeImportedUnitRecord(value: unknown, sourceLabel: string, index: number) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Item ${index + 1} in ${sourceLabel} must be an object.`);
  }

  const record = value as Record<string, unknown>;
  const rawUnitId =
    record.unitId ?? record.unit_id ?? record.customUnitId ?? record.custom_unit_id ?? record.id;
  const unitId = typeof rawUnitId === "string" ? rawUnitId.trim() : "";

  if (!unitId) {
    throw new Error(`Item ${index + 1} in ${sourceLabel} is missing a unitId.`);
  }

  return {
    unitId,
    details: normalizeDetailMap(
      record.details ?? record.detail ?? record.metadata ?? record.meta ?? null
    )
  } satisfies ImportedUnitRecord;
}

function parseJsonUnitEntries(value: string, sourceLabel: string) {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new Error(`The ${sourceLabel} is not valid JSON.`);
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error(`The ${sourceLabel} must contain a JSON array.`);
  }

  return parsedValue.map((item, index) =>
    normalizeImportedUnitRecord(item, `the ${sourceLabel}`, index)
  );
}

async function collectImportedUnitEntries(formData: FormData) {
  const importedEntries: ImportedUnitRecord[] = [];
  const manualUnits = String(formData.get("manual_units") ?? "").trim();
  const jsonUnits = String(formData.get("units_json") ?? "").trim();
  const jsonFile = formData.get("units_json_file");

  if (manualUnits) {
    importedEntries.push(...parseManualUnitEntries(manualUnits));
  }

  if (jsonUnits) {
    importedEntries.push(...parseJsonUnitEntries(jsonUnits, "JSON payload"));
  }

  if (jsonFile instanceof File && jsonFile.size > 0) {
    importedEntries.push(...parseJsonUnitEntries(await jsonFile.text(), "uploaded JSON file"));
  }

  return importedEntries;
}

function normalizeBulkProductRecord(value: unknown, index: number): BulkProductUploadRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Product ${index + 1} in the bulk upload must be an object.`);
  }

  const record = value as Record<string, unknown>;
  const customProductIdValue = String(
    record.customProductId ?? record.custom_product_id ?? record.productId ?? record.product_id ?? ""
  ).trim();
  const name = String(record.product_name ?? record.name ?? "").trim();
  const brand = String(record.brand ?? "").trim();
  const categoryName = String(
    record.category ?? record.category_name ?? record.categoryName ?? ""
  ).trim();
  const categoryDescription = String(
    record.category_description ?? record.categoryDescription ?? ""
  ).trim();
  const description = String(record.description ?? "").trim();
  const mainImage = String(
    record.main_image ?? record.mainImage ?? record.imageUrl ?? record.image_url ?? ""
  ).trim();
  const rawGalleryImages =
    record.gallery_images ?? record.galleryImages ?? record.images ?? [];

  if (!name || !brand || !categoryName || !description) {
    throw new Error(
      `Product ${index + 1} must include product_name, brand, category, and description.`
    );
  }

  if (!Array.isArray(rawGalleryImages)) {
    throw new Error(`Product ${index + 1} has an invalid gallery_images array.`);
  }

  const galleryImages = rawGalleryImages
    .map((image, imageIndex) => {
      const normalizedImage = String(image ?? "").trim();

      if (!normalizedImage) {
        throw new Error(`Product ${index + 1} has an empty gallery image at position ${imageIndex + 1}.`);
      }

      return normalizedImage;
    });

  const rawVariants = record.variants ?? [];

  if (!Array.isArray(rawVariants) || rawVariants.length === 0) {
    throw new Error(`Product ${index + 1} must include at least one variant.`);
  }

  const variants = parseVariantPayload(JSON.stringify(rawVariants));
  const duplicateVariantIds = variants
    .map((variant) => String(variant.custom_variant_id ?? "").trim())
    .filter(Boolean)
    .filter((variantId, variantIndex, variantIds) => variantIds.indexOf(variantId) !== variantIndex);

  if (duplicateVariantIds.length > 0) {
    throw new Error(
      `Product ${index + 1} contains duplicate custom variant IDs: ${Array.from(new Set(duplicateVariantIds)).join(", ")}.`
    );
  }

  return {
    customProductId: customProductIdValue || null,
    name,
    brand,
    categoryName,
    categoryDescription: categoryDescription || null,
    description,
    mainImage: mainImage || null,
    galleryImages,
    variants
  };
}

function parseBulkProductsJson(value: string, sourceLabel: string) {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new Error(`The ${sourceLabel} is not valid JSON.`);
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error(`The ${sourceLabel} must contain a JSON array of products.`);
  }

  const products = parsedValue.map((item, index) => normalizeBulkProductRecord(item, index));
  const duplicateProductIds = products
    .map((product) => String(product.customProductId ?? "").trim())
    .filter(Boolean)
    .filter((productId, index, productIds) => productIds.indexOf(productId) !== index);

  const duplicateSellerSkus = products
    .flatMap((product) => product.variants.map((variant) => variant.seller_sku))
    .filter((sellerSku, index, sellerSkus) => sellerSkus.indexOf(sellerSku) !== index);

  if (duplicateProductIds.length > 0) {
    throw new Error(
      `The upload contains duplicate custom product IDs: ${Array.from(new Set(duplicateProductIds)).join(", ")}.`
    );
  }

  if (duplicateSellerSkus.length > 0) {
    throw new Error(
      `The upload contains duplicate seller SKUs: ${Array.from(new Set(duplicateSellerSkus)).join(", ")}.`
    );
  }

  return products;
}

async function collectBulkProducts(formData: FormData) {
  const products: BulkProductUploadRecord[] = [];
  const jsonText = String(formData.get("products_json") ?? "").trim();
  const jsonFile = formData.get("products_json_file");

  if (jsonText) {
    products.push(...parseBulkProductsJson(jsonText, "JSON payload"));
  }

  if (jsonFile instanceof File && jsonFile.size > 0) {
    products.push(...parseBulkProductsJson(await jsonFile.text(), "uploaded JSON file"));
  }

  return products;
}

function parseImageUrls(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseVariantPayload(value: string) {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new Error("The generated variant payload is not valid JSON.");
  }

  if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
    throw new Error("Add at least one variant before creating the product.");
  }

  function normalizeAttributes(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return null;
    }

    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => [key.trim(), String(entryValue ?? "").trim()] as const)
      .filter(([key, entryValue]) => key.length > 0 && entryValue.length > 0);

    return entries.length > 0 ? Object.fromEntries(entries) : null;
  }

  return parsedValue.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Variant ${index + 1} is invalid.`);
    }

    const record = item as Record<string, unknown>;
    const size = String(record.size ?? "").trim();
    const color = String(record.color ?? "").trim();
    const attributes = normalizeAttributes(record.attributes ?? record.attribute_values ?? null);
    const customVariantId = String(record.custom_variant_id ?? "").trim();
    const sellerSku = String(record.seller_sku ?? "").trim();
    const price = Number(record.price ?? 0);
    const mrp = Number(record.mrp ?? 0);
    const stockQuantity = Number(record.stock_quantity ?? 0);

    if (!attributes && !size && !color) {
      throw new Error(
        `Variant ${index + 1} must include attribute values or size/color information.`
      );
    }

    if (!sellerSku) {
      throw new Error(`Variant ${index + 1} is missing a seller SKU.`);
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Variant ${index + 1} needs a valid selling price.`);
    }

    if (!Number.isFinite(mrp) || mrp < price) {
      throw new Error(`Variant ${index + 1} needs an MRP greater than or equal to price.`);
    }

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new Error(`Variant ${index + 1} needs a whole-number stock quantity.`);
    }

    return {
      custom_variant_id: customVariantId || null,
      size: size || null,
      color: color || null,
      attributes,
      seller_sku: sellerSku,
      price,
      mrp,
      stock_quantity: stockQuantity
    } satisfies VariantCreatePayload;
  });
}


function parseVariantEditPayload(value: string) {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new Error("The variant payload is not valid JSON.");
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error("The variant payload must be a JSON array.");
  }

  return parsedValue.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Variant ${index + 1} is invalid.`);
    }

    const record = item as Record<string, unknown>;
    const variantId = String(record.variant_id ?? "").trim();
    const listingId = String(record.listing_id ?? "").trim();
    const customVariantId = String(record.custom_variant_id ?? "").trim();
    const size = String(record.size ?? "").trim();
    const color = String(record.color ?? "").trim();
    const attributes = normalizeDetailMap(record.attributes ?? record.attribute_values ?? null);
    const sellerSku = String(record.seller_sku ?? "").trim();
    const price = Number(record.price ?? 0);
    const mrp = Number(record.mrp ?? 0);
    const stockQuantity = Number(record.stock_quantity ?? 0);

    if (!attributes && !size && !color) {
      throw new Error(
        `Variant ${index + 1} must include attribute values or size/color information.`
      );
    }

    if (!sellerSku) {
      throw new Error(`Variant ${index + 1} is missing a seller SKU.`);
    }

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Variant ${index + 1} needs a valid selling price.`);
    }

    if (!Number.isFinite(mrp) || mrp < price) {
      throw new Error(`Variant ${index + 1} needs an MRP greater than or equal to price.`);
    }

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new Error(`Variant ${index + 1} needs a whole-number stock quantity.`);
    }

    return {
      variant_id: variantId || null,
      listing_id: listingId || null,
      custom_variant_id: customVariantId || null,
      size: size || null,
      color: color || null,
      attributes,
      seller_sku: sellerSku,
      price,
      mrp,
      stock_quantity: stockQuantity
    };
  });
}
function buildVariantName(variant: VariantCreatePayload) {
  const attributeEntries = Object.entries(variant.attributes ?? {}).filter(
    ([, value]) => value.trim().length > 0
  );

  if (attributeEntries.length > 0) {
    return attributeEntries
      .map(([key, value]) => `${key.trim()}: ${value.trim()}`)
      .join(" / ");
  }

  const size = variant.size?.trim() ?? "";
  const color = variant.color?.trim() ?? "";
  const fallback = [size, color].filter(Boolean).join(" / ");
  return fallback || "Variant";
}

function buildVariantAttributes(variant: VariantCreatePayload) {
  const normalized = Object.entries(variant.attributes ?? {})
    .map(([key, value]) => [key.trim(), value.trim()] as const)
    .filter(([key, value]) => key.length > 0 && value.length > 0);

  const attributes = normalized.length > 0 ? Object.fromEntries(normalized) : {};

  if (variant.size) {
    attributes.size ??= variant.size;
  }

  if (variant.color) {
    attributes.color ??= variant.color;
  }

  return Object.keys(attributes).length > 0 ? attributes : null;
}

function getAttributeValue(attributes: Record<string, string> | null, key: string) {
  if (!attributes) {
    return null;
  }

  const match = Object.entries(attributes).find(([name]) => name.toLowerCase() === key.toLowerCase());
  return match ? match[1] : null;
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireApprovedSeller();

  const name = String(formData.get("name") ?? "").trim();
  const customProductId = String(formData.get("custom_product_id") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const selectedCategoryId = String(formData.get("category_id") ?? "").trim();
  const newCategoryName = String(formData.get("new_category_name") ?? "").trim();
  const newCategoryDescription = String(formData.get("new_category_description") ?? "").trim();
  const imageUrls = parseImageUrls(String(formData.get("image_urls") ?? ""));
  const catalogReference = String(formData.get("catalog_reference") ?? "").trim();
  const rawVariantsPayload = String(formData.get("variants_payload") ?? "").trim();

  if (!name || !brand || !description) {
    return { error: "Product name, brand, and description are required." };
  }

  let variants: VariantCreatePayload[] = [];

  try {
    variants = parseVariantPayload(rawVariantsPayload);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to read the generated variants."
    };
  }

  const supabase = await createSupabaseServerClient();
  let categoryId = selectedCategoryId;
  const presetCategoryName = selectedCategoryId.startsWith("preset:")
    ? selectedCategoryId.split(":").slice(2).join(":").trim()
    : "";

  if (presetCategoryName) {
    categoryId = "";
  }

  if (!categoryId && !newCategoryName && !presetCategoryName) {
    return { error: "Choose an existing category or create a new one." };
  }

  if (newCategoryName || presetCategoryName) {
    const targetCategoryName = newCategoryName || presetCategoryName;
    const targetCategoryDescription = newCategoryName
      ? newCategoryDescription || null
      : null;

    const { data: existingCategory, error: existingCategoryError } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", targetCategoryName)
      .maybeSingle();

    if (existingCategoryError) {
      return { error: existingCategoryError.message };
    }

    if (existingCategory?.id) {
      categoryId = String(existingCategory.id);
    } else {
      const { data: createdCategory, error: createdCategoryError } = await supabase
        .from("categories")
        .insert({
          name: targetCategoryName,
          description: targetCategoryDescription
        })
        .select("id")
        .single();

      if (createdCategoryError || !createdCategory) {
        return {
          error: createdCategoryError?.message ?? "Unable to create the new category."
        };
      }

      categoryId = String(createdCategory.id);
    }
  }

  const duplicateSellerSkus = variants
    .map((variant) => variant.seller_sku)
    .filter((sku, index, skus) => skus.indexOf(sku) !== index);

  if (duplicateSellerSkus.length > 0) {
    return {
      error: `Seller SKUs must be unique. Duplicate values: ${Array.from(new Set(duplicateSellerSkus)).join(", ")}.`
    };
  }

  const { data: existingListings, error: existingListingsError } = await supabase
    .schema("marketplace")
    .from("listings")
    .select("seller_sku")
    .eq("seller_id", profile.id)
    .in(
      "seller_sku",
      variants.map((variant) => variant.seller_sku)
    );

  if (existingListingsError) {
    return { error: formatMarketplaceActionError(existingListingsError) };
  }

  const conflictingSkus = (existingListings ?? [])
    .map((listing) => String(listing.seller_sku ?? "").trim())
    .filter(Boolean);

  if (conflictingSkus.length > 0) {
    return {
      error: `These seller SKUs already exist in your catalog: ${conflictingSkus.join(", ")}.`
    };
  }

  const metadata = {
    catalog_reference: catalogReference || null
  };

  const { data: product, error: productError } = await supabase
    .schema("marketplace")
    .from("products")
    .insert({
      custom_product_id: customProductId || null,
      name,
      brand,
      category_id: categoryId,
      description,
      primary_image_url: imageUrls[0] ?? null,
      gallery_image_urls: imageUrls.slice(1),
      metadata,
      created_by: profile.id
    })
    .select("id")
    .single();

  if (productError || !product) {
    return {
      error: formatMarketplaceActionError(productError) || "Unable to create the product catalog entry."
    };
  }

  try {
    for (const variant of variants) {
      const variantAttributes = buildVariantAttributes(variant);
      const variantSize = getAttributeValue(variantAttributes, "size") ?? variant.size ?? null;
      const variantColor = getAttributeValue(variantAttributes, "color") ?? variant.color ?? null;
      const variantName = buildVariantName({
        ...variant,
        attributes: variantAttributes
      });

      const { data: createdVariant, error: variantError } = await supabase
        .schema("marketplace")
        .from("variants")
        .insert({
          product_id: product.id,
          custom_variant_id: variant.custom_variant_id ?? null,
          name: variantName,
          size: variantSize,
          color: variantColor,
          attributes: variantAttributes
        })
        .select("id")
        .single();

      if (variantError || !createdVariant) {
        throw new Error(
          formatMarketplaceActionError(variantError) || `Unable to create variant ${variantName}.`
        );
      }

      const { error: listingError } = await supabase
        .schema("marketplace")
        .from("listings")
        .insert({
          variant_id: createdVariant.id,
          seller_id: profile.id,
          seller_sku: variant.seller_sku,
          price: variant.price,
          mrp: variant.mrp,
          stock_on_hand: variant.stock_quantity,
          fulfillment_type: "seller",
          condition: "new",
          status: "active"
        });

      if (listingError) {
        throw new Error(formatMarketplaceActionError(listingError));
      }
    }
  } catch (error) {
    await supabase.schema("marketplace").from("products").delete().eq("id", product.id);

    return {
      error: error instanceof Error ? error.message : "Unable to create all variant listings."
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

async function resolveCategoryIdForBulkUpload(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  categoryName: string,
  categoryDescription: string | null
) {
  const { data: existingCategory, error: existingCategoryError } = await supabase
    .from("categories")
    .select("id")
    .ilike("name", categoryName)
    .maybeSingle();

  if (existingCategoryError) {
    return { error: existingCategoryError.message };
  }

  if (existingCategory?.id) {
    return { categoryId: String(existingCategory.id) };
  }

  const { data: createdCategory, error: createdCategoryError } = await supabase
    .from("categories")
    .insert({
      name: categoryName,
      description: categoryDescription
    })
    .select("id")
    .single();

  if (createdCategoryError || !createdCategory) {
    return {
      error: createdCategoryError?.message ?? "Unable to create category for bulk upload."
    };
  }

  return { categoryId: String(createdCategory.id) };
}

async function createMarketplaceProductFromBulkUpload(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sellerId: string,
  product: BulkProductUploadRecord
) {
  const categoryResult = await resolveCategoryIdForBulkUpload(
    supabase,
    product.categoryName,
    product.categoryDescription
  );

  if ("error" in categoryResult) {
    return { error: categoryResult.error };
  }

  const { data: createdProduct, error: productError } = await supabase
    .schema("marketplace")
    .from("products")
    .insert({
      custom_product_id: product.customProductId,
      name: product.name,
      brand: product.brand,
      category_id: categoryResult.categoryId,
      description: product.description,
      primary_image_url: product.mainImage,
      gallery_image_urls: product.galleryImages,
      metadata: {
        catalog_reference: null
      },
      created_by: sellerId
    })
    .select("id")
    .single();

  if (productError || !createdProduct) {
    return {
      error: formatMarketplaceActionError(productError) || "Unable to create bulk catalog product."
    };
  }

  try {
    for (const variant of product.variants) {
      const variantAttributes = buildVariantAttributes(variant);
      const variantSize = getAttributeValue(variantAttributes, "size") ?? variant.size ?? null;
      const variantColor = getAttributeValue(variantAttributes, "color") ?? variant.color ?? null;
      const variantName = buildVariantName({
        ...variant,
        attributes: variantAttributes
      });

      const { data: createdVariant, error: variantError } = await supabase
        .schema("marketplace")
        .from("variants")
        .insert({
          product_id: createdProduct.id,
          custom_variant_id: variant.custom_variant_id ?? null,
          name: variantName,
          size: variantSize,
          color: variantColor,
          attributes: variantAttributes
        })
        .select("id")
        .single();

      if (variantError || !createdVariant) {
        throw new Error(
          formatMarketplaceActionError(variantError) ||
            `Unable to create variant ${variant.size} / ${variant.color}.`
        );
      }

      const { error: listingError } = await supabase
        .schema("marketplace")
        .from("listings")
        .insert({
          variant_id: createdVariant.id,
          seller_id: sellerId,
          seller_sku: variant.seller_sku,
          price: variant.price,
          mrp: variant.mrp,
          stock_on_hand: variant.stock_quantity,
          fulfillment_type: "seller",
          condition: "new",
          status: "active"
        });

      if (listingError) {
        throw new Error(formatMarketplaceActionError(listingError));
      }
    }
  } catch (error) {
    await supabase.schema("marketplace").from("products").delete().eq("id", createdProduct.id);

    return {
      error: error instanceof Error ? error.message : "Unable to create product variants from bulk upload."
    };
  }

  return { productId: createdProduct.id };
}

export async function bulkCreateProductsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireApprovedSeller();

  let parsedProducts: BulkProductUploadRecord[] = [];

  try {
    parsedProducts = await collectBulkProducts(formData);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to read the bulk product upload."
    };
  }

  if (parsedProducts.length === 0) {
    return {
      error: "Upload a JSON file or paste a JSON payload before starting the bulk upload."
    };
  }

  const supabase = await createSupabaseServerClient();
  const customProductIds = parsedProducts
    .map((product) => String(product.customProductId ?? "").trim())
    .filter(Boolean);
  const sellerSkus = parsedProducts.flatMap((product) =>
    product.variants.map((variant) => variant.seller_sku)
  );
  const { data: existingProducts, error: existingProductsError } = await supabase
    .schema("marketplace")
    .from("products")
    .select("custom_product_id")
    .eq("created_by", profile.id)
    .in("custom_product_id", customProductIds);

  if (existingProductsError) {
    return { error: formatMarketplaceActionError(existingProductsError) };
  }

  const existingProductIds = (existingProducts ?? [])
    .map((product) => String(product.custom_product_id ?? "").trim())
    .filter(Boolean);

  if (existingProductIds.length > 0) {
    return {
      error: `These custom product IDs already exist in your catalog: ${existingProductIds.join(", ")}.`
    };
  }

  const { data: existingListings, error: existingListingsError } = await supabase
    .schema("marketplace")
    .from("listings")
    .select("seller_sku")
    .eq("seller_id", profile.id)
    .in("seller_sku", sellerSkus);

  if (existingListingsError) {
    return { error: formatMarketplaceActionError(existingListingsError) };
  }

  const conflictingSkus = (existingListings ?? [])
    .map((listing) => String(listing.seller_sku ?? "").trim())
    .filter(Boolean);

  if (conflictingSkus.length > 0) {
    return {
      error: `These seller SKUs already exist in your catalog: ${conflictingSkus.join(", ")}.`
    };
  }

  const createdProductIds: string[] = [];

  for (const product of parsedProducts) {
    const result = await createMarketplaceProductFromBulkUpload(supabase, profile.id, product);

    if ("error" in result) {
      if (createdProductIds.length > 0) {
        await supabase
          .schema("marketplace")
          .from("products")
          .delete()
          .eq("created_by", profile.id)
          .in("id", createdProductIds);
      }

      const productLabel = product.customProductId ?? product.name;
      return { error: `Bulk upload stopped at ${productLabel}: ${result.error}` };
    }

    createdProductIds.push(result.productId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireApprovedSeller();
  const productId = String(formData.get("product_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const categoryIds = formData.getAll("categories").map(String);

  if (!productId || !name || !description) {
    return { error: "Product, name, and description are required." };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Price must be greater than zero." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update({
      name,
      description,
      price,
      image_url: imageUrl || null
    })
    .eq("id", productId)
    .eq("seller_id", profile.id);

  if (error) {
    return { error: error.message };
  }

  // Update categories
  await supabase.from("product_categories").delete().eq("product_id", productId);

  if (categoryIds.length > 0) {
    const productCategories = categoryIds.map((categoryId) => ({
      product_id: productId,
      category_id: categoryId
    }));

    const { error: categoriesError } = await supabase
      .from("product_categories")
      .insert(productCategories);

    if (categoriesError) {
      return { error: categoriesError.message };
    }
  }

  redirect("/dashboard/products");
}


export async function updateMarketplaceVariantsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireApprovedSeller();
  const productId = String(formData.get("product_id") ?? "").trim();
  const rawVariantsPayload = String(formData.get("variants_payload") ?? "").trim();

  if (!productId) {
    return { error: "Product ID is required." };
  }

  let variants: Array<
    VariantCreatePayload & {
      variant_id?: string | null;
      listing_id?: string | null;
    }
  > = [];

  try {
    variants = parseVariantEditPayload(rawVariantsPayload);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to read the variant payload."
    };
  }

  if (variants.length === 0) {
    return { error: "Add at least one variant before saving." };
  }

  const duplicateSellerSkus = variants
    .map((variant) => variant.seller_sku)
    .filter((sku, index, skus) => skus.indexOf(sku) !== index);

  if (duplicateSellerSkus.length > 0) {
    return {
      error: `Seller SKUs must be unique. Duplicate values: ${Array.from(new Set(duplicateSellerSkus)).join(", ")}.`
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: productRecord, error: productError } = await supabase
    .schema("marketplace")
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("created_by", profile.id)
    .maybeSingle();

  if (productError) {
    return { error: formatMarketplaceActionError(productError) };
  }

  if (!productRecord) {
    return { error: "Product not found." };
  }

  const sellerSkus = variants.map((variant) => variant.seller_sku);
  const listingIds = variants
    .map((variant) => variant.listing_id)
    .filter((listingId): listingId is string => Boolean(listingId));

  const { data: existingListings, error: existingListingsError } = await supabase
    .schema("marketplace")
    .from("listings")
    .select("id, seller_sku")
    .eq("seller_id", profile.id)
    .in("seller_sku", sellerSkus);

  if (existingListingsError) {
    return { error: formatMarketplaceActionError(existingListingsError) };
  }

  const conflictingSkus = (existingListings ?? [])
    .filter((listing) => !listingIds.includes(String(listing.id)))
    .map((listing) => String(listing.seller_sku ?? "").trim())
    .filter(Boolean);

  if (conflictingSkus.length > 0) {
    return {
      error: `These seller SKUs already exist in your catalog: ${conflictingSkus.join(", ")}.`
    };
  }

  try {
    for (const variant of variants) {
      const variantAttributes = buildVariantAttributes(variant);
      const variantSize = getAttributeValue(variantAttributes, "size") ?? variant.size ?? null;
      const variantColor = getAttributeValue(variantAttributes, "color") ?? variant.color ?? null;
      const variantName = buildVariantName({
        ...variant,
        attributes: variantAttributes
      });

      let variantId = variant.variant_id ?? null;

      if (variantId) {
        const { error: updateVariantError } = await supabase
          .schema("marketplace")
          .from("variants")
          .update({
            custom_variant_id: variant.custom_variant_id ?? null,
            name: variantName,
            size: variantSize,
            color: variantColor,
            attributes: variantAttributes
          })
          .eq("id", variantId)
          .eq("product_id", productId);

        if (updateVariantError) {
          throw new Error(formatMarketplaceActionError(updateVariantError));
        }
      } else {
        const { data: createdVariant, error: createVariantError } = await supabase
          .schema("marketplace")
          .from("variants")
          .insert({
            product_id: productId,
            custom_variant_id: variant.custom_variant_id ?? null,
            name: variantName,
            size: variantSize,
            color: variantColor,
            attributes: variantAttributes
          })
          .select("id")
          .single();

        if (createVariantError || !createdVariant) {
          throw new Error(formatMarketplaceActionError(createVariantError));
        }

        variantId = createdVariant.id;
      }

      if (variant.listing_id) {
        const { error: updateListingError } = await supabase
          .schema("marketplace")
          .from("listings")
          .update({
            seller_sku: variant.seller_sku,
            price: variant.price,
            mrp: variant.mrp,
            stock_on_hand: variant.stock_quantity,
            status: "active"
          })
          .eq("id", variant.listing_id)
          .eq("seller_id", profile.id);

        if (updateListingError) {
          throw new Error(formatMarketplaceActionError(updateListingError));
        }
      } else {
        const { error: createListingError } = await supabase
          .schema("marketplace")
          .from("listings")
          .insert({
            variant_id: variantId,
            seller_id: profile.id,
            seller_sku: variant.seller_sku,
            price: variant.price,
            mrp: variant.mrp,
            stock_on_hand: variant.stock_quantity,
            fulfillment_type: "seller",
            condition: "new",
            status: "active"
          });

        if (createListingError) {
          throw new Error(formatMarketplaceActionError(createListingError));
        }
      }
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update variants."
    };
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
  revalidatePath(`/product/${productId}`);
  return { success: "Variants updated successfully." };
}
export async function updateMarketplaceProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireApprovedSeller();
  const productId = String(formData.get("product_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const selectedCategoryId = String(formData.get("category_id") ?? "").trim();
  const newCategoryName = String(formData.get("new_category_name") ?? "").trim();
  const newCategoryDescription = String(formData.get("new_category_description") ?? "").trim();
  const catalogReference = String(formData.get("catalog_reference") ?? "").trim();
  const imageUrls = parseImageUrls(String(formData.get("image_urls") ?? ""));

  if (!productId || !name || !brand || !description) {
    return { error: "Product name, brand, and description are required." };
  }

  const supabase = await createSupabaseServerClient();
  let categoryId = selectedCategoryId;
  const presetCategoryName = selectedCategoryId.startsWith("preset:")
    ? selectedCategoryId.split(":").slice(2).join(":").trim()
    : "";

  if (presetCategoryName) {
    categoryId = "";
  }

  if (!categoryId && !newCategoryName && !presetCategoryName) {
    return { error: "Choose an existing category or create a new one." };
  }

  if (newCategoryName || presetCategoryName) {
    const targetCategoryName = newCategoryName || presetCategoryName;
    const targetCategoryDescription = newCategoryName
      ? newCategoryDescription || null
      : null;

    const { data: existingCategory, error: existingCategoryError } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", targetCategoryName)
      .maybeSingle();

    if (existingCategoryError) {
      return { error: existingCategoryError.message };
    }

    if (existingCategory?.id) {
      categoryId = String(existingCategory.id);
    } else {
      const { data: createdCategory, error: createdCategoryError } = await supabase
        .from("categories")
        .insert({
          name: targetCategoryName,
          description: targetCategoryDescription
        })
        .select("id")
        .single();

      if (createdCategoryError || !createdCategory) {
        return {
          error: createdCategoryError?.message ?? "Unable to create the new category."
        };
      }

      categoryId = String(createdCategory.id);
    }
  }

  const { error } = await supabase
    .schema("marketplace")
    .from("products")
    .update({
      name,
      brand,
      category_id: categoryId,
      description,
      primary_image_url: imageUrls[0] ?? null,
      gallery_image_urls: imageUrls.slice(1),
      metadata: {
        catalog_reference: catalogReference || null
      }
    })
    .eq("id", productId)
    .eq("created_by", profile.id);

  if (error) {
    return { error: formatMarketplaceActionError(error) };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
  revalidatePath(`/product/${productId}`);
  redirect("/dashboard/products");
}

export async function importProductUnitsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireApprovedSeller();
  const productId = String(formData.get("product_id") ?? "").trim();

  if (!productId) {
    return { error: "Product ID is required." };
  }

  let importedEntries: ImportedUnitRecord[] = [];

  try {
    importedEntries = await collectImportedUnitEntries(formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to read the unit import." };
  }

  if (importedEntries.length === 0) {
    return {
      error: "Add manual lines before importing units."
    };
  }

  const duplicateUnitIds = importedEntries
    .map((entry) => entry.unitId)
    .filter((unitId, index, entries) => entries.indexOf(unitId) !== index);

  if (duplicateUnitIds.length > 0) {
    return {
      error: `Duplicate unit IDs found in this import: ${Array.from(new Set(duplicateUnitIds)).join(", ")}.`
    };
  }

  const product = await getSellerOwnedProduct(productId, profile.id);

  if (!product) {
    return { error: "Product not found." };
  }

  const existingUnits = [...(product.units ?? [])].sort((left, right) =>
    new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );

  if (existingUnits.length === 0) {
    return { error: "This product does not have generated unit records yet." };
  }

  const assignedUnits = new Map(
    existingUnits
      .filter((unit) => unit.custom_unit_id)
      .map((unit) => [unit.custom_unit_id!, unit])
  );
  const unassignedUnits = existingUnits.filter((unit) => !unit.custom_unit_id);

  const newAssignmentsNeeded = importedEntries.filter(
    (entry) => !assignedUnits.has(entry.unitId)
  ).length;

  if (newAssignmentsNeeded > unassignedUnits.length) {
    return {
      error: `Only ${unassignedUnits.length} unassigned unit record(s) remain for this product.`
    };
  }

  const updates = importedEntries.map((entry) => {
    const matchedUnit = assignedUnits.get(entry.unitId);

    if (matchedUnit) {
      return {
        id: matchedUnit.id,
        unit_code: matchedUnit.unit_code,
        custom_unit_id: entry.unitId,
        details: entry.details ?? matchedUnit.details ?? null
      };
    }

    const nextUnit = unassignedUnits.shift();

    if (!nextUnit) {
      throw new Error("No remaining unit records are available for assignment.");
    }

    assignedUnits.set(entry.unitId, nextUnit);

    return {
      id: nextUnit.id,
      unit_code: nextUnit.unit_code,
      custom_unit_id: entry.unitId,
      details: entry.details
    };
  });

  const supabase = await createSupabaseServerClient();

  for (const update of updates) {
    const { error } = await supabase
      .from("product_units")
      .update({
        custom_unit_id: update.custom_unit_id,
        details: update.details
      })
      .eq("id", update.id)
      .eq("product_id", productId);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}/edit`);
  revalidatePath(`/product/${productId}`);

  for (const update of updates) {
    revalidatePath(`/track/${update.unit_code}`);
  }

  return {
    success: `Imported ${updates.length} unit record(s). Their QR links are now ready in the product details view.`
  };
}

export async function deleteSelectedProductsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireApprovedSeller();
  const productIds = formData
    .getAll("product_ids")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const returnQuery = String(formData.get("return_query") ?? "").trim();

  if (productIds.length === 0) {
    return { error: "Select at least one product to delete." };
  }

  const uniqueProductIds = Array.from(new Set(productIds));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .schema("marketplace")
    .from("products")
    .delete()
    .eq("created_by", profile.id)
    .in("id", uniqueProductIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/products");
  redirect(returnQuery ? `/dashboard/products?q=${encodeURIComponent(returnQuery)}` : "/dashboard/products");
}








