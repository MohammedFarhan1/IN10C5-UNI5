"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionState } from "@/types";
import { getCurrentSession, requireRole } from "@/lib/auth";
import {
  cancelMarketplaceOrder,
  placeMarketplaceOrder
} from "@/lib/marketplace";
import { roleHome } from "@/lib/utils";

export async function createOrderAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);
  const listingId = String(formData.get("listing_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!listingId) {
    return { error: "Select a seller option before buying." };
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "Quantity must be at least 1." };
  }

  try {
    await placeMarketplaceOrder({
      buyerId: profile.id,
      items: [{ listing_id: listingId, quantity }]
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to place the order."
    };
  }

  redirect("/orders");
}

export async function cancelOrderGroupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);
  const orderId = String(formData.get("order_id") ?? "").trim();

  if (!orderId) {
    return { error: "Order ID is required." };
  }

  try {
    await cancelMarketplaceOrder(orderId, profile.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to cancel this order."
    };
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

  const subOrderId = String(formData.get("sub_order_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (
    !subOrderId ||
    ![
      "placed",
      "confirmed",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "returned"
    ].includes(status)
  ) {
    return;
  }

  const { error } = await supabase
    .schema("marketplace")
    .rpc("update_suborder_status", {
      sub_order_uuid: subOrderId,
      next_status: status
    });

  if (error) {
    return;
  }

  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
}
