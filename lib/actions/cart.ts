"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionState } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { addToCart, updateCartItem, removeFromCart, clearCart, getCartItems } from "@/lib/data";

/* eslint-disable @typescript-eslint/no-unused-vars */

export async function addToCartAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);

  const productId = String(formData.get("product_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!productId) {
    return { error: "Product ID is required." };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Quantity must be a positive integer." };
  }

  try {
    await addToCart(profile.id, productId, quantity);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to add to cart." };
  }

  revalidatePath("/cart");
  return { success: "Added to cart successfully." };
}

export async function updateCartItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(["customer"]);

  const cartItemId = String(formData.get("cart_item_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!cartItemId) {
    return { error: "Cart item ID is required." };
  }

  if (quantity < 0) {
    return { error: "Quantity cannot be negative." };
  }

  try {
    await updateCartItem(cartItemId, quantity);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to update cart item." };
  }

  revalidatePath("/cart");
  return { success: "Cart updated successfully." };
}

export async function removeFromCartAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(["customer"]);

  const cartItemId = String(formData.get("cart_item_id") ?? "").trim();

  if (!cartItemId) {
    return { error: "Cart item ID is required." };
  }

  try {
    await removeFromCart(cartItemId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to remove from cart." };
  }

  revalidatePath("/cart");
  return { success: "Item removed from cart." };
}

export async function clearCartAction(
  _formData: FormData
): Promise<void> {
  const { profile } = await requireRole(["customer"]);

  await clearCart(profile.id);

  revalidatePath("/cart");
}

export async function checkoutCartAction(
  _formData: FormData
): Promise<void> {
  const { profile } = await requireRole(["customer"]);

  const cartItems = await getCartItems(profile.id);

  if (cartItems.length === 0) {
    throw new Error("Cart is empty.");
  }

  const supabase = await createSupabaseServerClient();

  // Use the place_order_batch function for each cart item
  for (const item of cartItems) {
    if (!item.product) continue;

    try {
      const { data, error } = await supabase.rpc("place_order_batch", {
        product_uuid: item.product_id,
        buyer_uuid: profile.id,
        quantity_int: item.quantity
      });

      if (error) {
        throw new Error(`Failed to create order for ${item.product.name}: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Failed to create order for ${item.product.name}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to process order: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Clear cart
  await clearCart(profile.id);

  redirect("/orders");
}