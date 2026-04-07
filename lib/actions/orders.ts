"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionState, OrderStatus } from "@/types";
import { getCurrentSession, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/utils";

export async function createOrderAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);
  const productId = String(formData.get("product_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!productId) {
    return { error: "Product ID is required." };
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "Quantity must be at least 1." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("place_order_batch", {
    product_uuid: productId,
    buyer_uuid: profile.id,
    quantity_int: quantity
  });

  if (error) {
    if (quantity === 1) {
      const { error: singleOrderError } = await supabase.rpc("place_order", {
        product_uuid: productId,
        buyer_uuid: profile.id
      });

      if (!singleOrderError) {
        redirect("/orders");
      }

      return { error: singleOrderError.message };
    }

    return { error: error.message };
  }

  redirect("/orders");
}

export async function updateOrderStatusAction(formData: FormData) {
  const { profile, supabase } = await getCurrentSession();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "seller" && profile.role !== "admin") {
    redirect(roleHome(profile.role));
  }

  const orderId = String(formData.get("order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as OrderStatus;

  if (!orderId || !["ordered", "shipped", "delivered"].includes(status)) {
    return;
  }

  const { data: orderRecord } = await supabase
    .from("orders")
    .select(
      `
      id,
      product_id,
      unit_id,
      product:products!orders_product_id_fkey (
        seller_id
      )
    `
    )
    .eq("id", orderId)
    .maybeSingle();

  const order = Array.isArray(orderRecord) ? orderRecord[0] : orderRecord;
  const orderObject =
    order && typeof order === "object" ? (order as Record<string, unknown>) : undefined;
  const rawProduct = orderObject?.product;
  const product =
    rawProduct && typeof rawProduct === "object"
      ? (Array.isArray(rawProduct) ? rawProduct[0] : rawProduct) as Record<string, unknown>
      : undefined;
  const sellerId = product && typeof product.seller_id === "string" ? product.seller_id : "";

  if (!order || (profile.role === "seller" && sellerId !== profile.id)) {
    redirect(roleHome(profile.role));
  }

  await supabase.from("orders").update({ status }).eq("id", orderId);

  const unitStatus = status === "delivered" ? "delivered" : "sold";
  const unitId =
    typeof orderObject?.unit_id === "string"
      ? orderObject.unit_id
      : "";

  if (unitId) {
    await supabase.from("product_units").update({ status: unitStatus }).eq("id", unitId);
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}
