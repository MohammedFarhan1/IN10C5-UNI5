"use server";

import { redirect } from "next/navigation";
import { ActionState } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["seller"]);

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
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      seller_id: profile.id,
      name,
      description,
      price,
      image_url: imageUrl || null,
      total_units: totalUnits
    })
    .select("id")
    .single();

  if (productError || !product) {
    return { error: productError?.message ?? "Unable to create product." };
  }

  const units = Array.from({ length: totalUnits }, () => ({
    product_id: product.id,
    unit_code: crypto.randomUUID(),
    status: "available" as const
  }));

  const { error: unitsError } = await supabase.from("product_units").insert(units);

  if (unitsError) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: unitsError.message };
  }

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
