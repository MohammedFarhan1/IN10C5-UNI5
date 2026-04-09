"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ActionState } from "@/types";
import { requireRole } from "@/lib/auth";
import {
  addMarketplaceItemToCart,
  clearMarketplaceCart,
  getMarketplaceCartItems,
  placeMarketplaceOrder,
  removeMarketplaceCartItem,
  updateMarketplaceCartItem
} from "@/lib/marketplace";

export async function addToCartAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);

  const listingId = String(formData.get("listing_id") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!listingId) {
    return { error: "Select a seller option before adding this item to cart." };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "Quantity must be a positive integer." };
  }

  try {
    await addMarketplaceItemToCart(profile.id, listingId, quantity);
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
    await updateMarketplaceCartItem(cartItemId, quantity);
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
    await removeMarketplaceCartItem(cartItemId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to remove from cart." };
  }

  revalidatePath("/cart");
  return { success: "Item removed from cart." };
}

export async function clearCartAction(): Promise<void> {
  const { profile } = await requireRole(["customer"]);

  await clearMarketplaceCart(profile.id);

  revalidatePath("/cart");
}

export async function checkoutCartAction(): Promise<void> {
  const { profile } = await requireRole(["customer"]);

  const cartItems = await getMarketplaceCartItems(profile.id);

  if (cartItems.length === 0) {
    throw new Error("Cart is empty.");
  }

  await placeMarketplaceOrder({
    buyerId: profile.id,
    items: cartItems.map((item) => ({
      listing_id: item.listing_id,
      quantity: item.quantity
    }))
  });

  await clearMarketplaceCart(profile.id);

  redirect("/orders");
}
