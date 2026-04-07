"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionState } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { getSellerOwnedProduct } from "@/lib/data";

type ImportedUnitRecord = {
  unitId: string;
  details: Record<string, string> | null;
};

type BulkProductUploadRecord = {
  customProductId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  totalUnits: number;
  units: ImportedUnitRecord[];
};

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
  const customProductId = String(
    record.customProductId ?? record.custom_product_id ?? record.productId ?? record.product_id ?? ""
  ).trim();
  const name = String(record.name ?? "").trim();
  const description = String(record.description ?? "").trim();
  const price = Number(record.price ?? 0);
  const totalUnits = Number(record.totalUnits ?? record.total_units ?? 0);
  const imageUrlValue = String(record.imageUrl ?? record.image_url ?? "").trim();

  if (!customProductId) {
    throw new Error(`Product ${index + 1} is missing a customProductId.`);
  }

  if (!name || !description) {
    throw new Error(`Product ${index + 1} needs a name and description.`);
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Product ${index + 1} has an invalid price.`);
  }

  if (!Number.isInteger(totalUnits) || totalUnits <= 0) {
    throw new Error(`Product ${index + 1} needs a whole-number totalUnits value above zero.`);
  }

  const rawUnits = record.units ?? [];

  if (!Array.isArray(rawUnits)) {
    throw new Error(`Product ${index + 1} has an invalid units array.`);
  }

  const units = rawUnits.map((unit, unitIndex) =>
    normalizeImportedUnitRecord(unit, `product ${index + 1} units`, unitIndex)
  );
  const duplicateUnitIds = units
    .map((unit) => unit.unitId)
    .filter((unitId, unitIndex, unitIds) => unitIds.indexOf(unitId) !== unitIndex);

  if (duplicateUnitIds.length > 0) {
    throw new Error(
      `Product ${index + 1} contains duplicate unit IDs: ${Array.from(new Set(duplicateUnitIds)).join(", ")}.`
    );
  }

  if (units.length > totalUnits) {
    throw new Error(`Product ${index + 1} provides more unit records than totalUnits.`);
  }

  return {
    customProductId,
    name,
    description,
    price,
    imageUrl: imageUrlValue || null,
    totalUnits,
    units
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
    .map((product) => product.customProductId)
    .filter((productId, index, productIds) => productIds.indexOf(productId) !== index);

  if (duplicateProductIds.length > 0) {
    throw new Error(
      `The upload contains duplicate custom product IDs: ${Array.from(new Set(duplicateProductIds)).join(", ")}.`
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

async function createProductWithUnits(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sellerId: string,
  input: {
    customProductId?: string | null;
    name: string;
    description: string;
    price: number;
    imageUrl: string | null;
    totalUnits: number;
    units?: ImportedUnitRecord[];
  }
) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      seller_id: sellerId,
      custom_product_id: input.customProductId || null,
      name: input.name,
      description: input.description,
      price: input.price,
      image_url: input.imageUrl,
      total_units: input.totalUnits
    })
    .select("id")
    .single();

  if (productError || !product) {
    return {
      error: productError?.message ?? "Unable to create product."
    };
  }

  const configuredUnits = input.units ?? [];
  const units = Array.from({ length: input.totalUnits }, (_, index) => ({
    product_id: product.id,
    unit_code: crypto.randomUUID(),
    custom_unit_id: configuredUnits[index]?.unitId ?? null,
    details: configuredUnits[index]?.details ?? null,
    status: "available" as const
  }));

  const { error: unitsError } = await supabase.from("product_units").insert(units);

  if (unitsError) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: unitsError.message };
  }

  return { productId: product.id };
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["seller"]);

  const customProductId = String(formData.get("custom_product_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const totalUnits = Number(formData.get("total_units") ?? 0);

  if (!name || !description) {
    return { error: "Name and description are required." };
  }

  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Price must be greater than zero." };
  }

  if (!Number.isInteger(totalUnits) || totalUnits <= 0) {
    return { error: "Total units must be a whole number above zero." };
  }

  const supabase = await createSupabaseServerClient();
  const result = await createProductWithUnits(supabase, profile.id, {
    customProductId: customProductId || null,
    name,
    description,
    price,
    imageUrl: imageUrl || null,
    totalUnits
  });

  if ("error" in result) {
    return { error: result.error };
  }

  redirect("/dashboard/products");
}

export async function bulkCreateProductsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["seller"]);

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
  const customProductIds = parsedProducts.map((product) => product.customProductId);
  const { data: existingProducts, error: existingProductsError } = await supabase
    .from("products")
    .select("custom_product_id")
    .eq("seller_id", profile.id)
    .in("custom_product_id", customProductIds);

  if (existingProductsError) {
    return { error: existingProductsError.message };
  }

  const existingProductIds = (existingProducts ?? [])
    .map((product) => String(product.custom_product_id ?? "").trim())
    .filter(Boolean);

  if (existingProductIds.length > 0) {
    return {
      error: `These custom product IDs already exist in your catalog: ${existingProductIds.join(", ")}.`
    };
  }

  const createdProductIds: string[] = [];

  for (const product of parsedProducts) {
    const result = await createProductWithUnits(supabase, profile.id, {
      customProductId: product.customProductId,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      totalUnits: product.totalUnits,
      units: product.units
    });

    if ("error" in result) {
      if (createdProductIds.length > 0) {
        await supabase
          .from("products")
          .delete()
          .eq("seller_id", profile.id)
          .in("id", createdProductIds);
      }

      return {
        error: `Bulk upload stopped at ${product.customProductId}: ${result.error}`
      };
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
  const { profile } = await requireRole(["seller"]);
  const productId = String(formData.get("product_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);

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

  redirect("/dashboard/products");
}

export async function importProductUnitsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["seller"]);
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
      error: "Add manual lines, a JSON payload, or a JSON file before importing units."
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
  const { profile } = await requireRole(["seller"]);
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
    .from("products")
    .delete()
    .eq("seller_id", profile.id)
    .in("id", uniqueProductIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/products");
  redirect(returnQuery ? `/dashboard/products?q=${encodeURIComponent(returnQuery)}` : "/dashboard/products");
}
