"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionState } from "@/types";
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

export async function cancelOrderGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);
  const orderGroupId = String(formData.get("order_group_id") ?? "").trim();

  if (!orderGroupId) {
    return { error: "Order group ID is required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, unit_id, status")
    .eq("order_group_id", orderGroupId)
    .eq("buyer_id", profile.id);

  if (error) {
    return { error: error.message };
  }

  if (!orders || orders.length === 0) {
    return { error: "Order not found." };
  }

  const hasShippedOrDelivered = orders.some(
    (order) => order.status === "shipped" || order.status === "delivered"
  );

  if (hasShippedOrDelivered) {
    return { error: "Only orders that have not shipped can be cancelled." };
  }

  const orderedUnitIds = orders
    .filter((order) => order.status === "ordered")
    .map((order) => order.unit_id)
    .filter(Boolean);

  const { error: cancelError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("order_group_id", orderGroupId)
    .eq("buyer_id", profile.id)
    .eq("status", "ordered");

  if (cancelError) {
    return { error: cancelError.message };
  }

  if (orderedUnitIds.length > 0) {
    const { error: unitError } = await supabase
      .from("product_units")
      .update({ status: "available" })
      .in("id", orderedUnitIds);

    if (unitError) {
      return { error: unitError.message };
    }
  }

  revalidatePath("/orders");
  return { success: "Order cancelled successfully." };
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
  const status = String(formData.get("status") ?? "").trim();

  if (
    !orderId ||
    !["ordered", "shipped", "delivered", "cancelled"].includes(status)
  ) {
    return;
  }

  const { data: orderRecord } = await supabase
    .from("orders")
    .select(
      `
      id,
      product_id,
      unit_id,
      status,
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
  const currentStatus =
    typeof orderObject?.status === "string" ? orderObject.status : "ordered";

  if (!order || (profile.role === "seller" && sellerId !== profile.id)) {
    redirect(roleHome(profile.role));
  }

  if (status === "cancelled" && currentStatus !== "ordered") {
    return;
  }

  if (currentStatus === "cancelled" && status !== "cancelled") {
    return;
  }

  await supabase.from("orders").update({ status }).eq("id", orderId);

  const unitStatus =
    status === "delivered"
      ? "delivered"
      : status === "cancelled"
      ? "available"
      : "sold";
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
