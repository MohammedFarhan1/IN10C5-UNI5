"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { ActionState, MarketplaceCartItem } from "@/types";
import { formatCurrency, formatVariantLabel } from "@/lib/utils";
import { updateCartItemAction, removeFromCartAction } from "@/lib/actions/cart";

type CartItemListProps = {
  cartItems: MarketplaceCartItem[];
};

const initialState: ActionState = {};

export function CartItemList({ cartItems }: CartItemListProps) {
  return (
    <div className="divide-y divide-slate-200">
      {cartItems.map((item) => (
        <CartItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function CartItemRow({ item }: { item: MarketplaceCartItem }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCartItemAction,
    initialState
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeFromCartAction,
    initialState
  );
  const [, startTransition] = useTransition();

  if (!item.listing?.variant?.product) return null;

  const product = item.listing.variant.product;
  const variant = item.listing.variant;
  const sellerName =
    item.listing.seller?.display_name ||
    item.listing.seller?.business_name ||
    item.listing.seller?.email ||
    "Seller";

  const subtotal = item.listing.price * item.quantity;

  const handleQuantityChange = (newQuantity: number) => {
    const formData = new FormData();
    formData.set("cart_item_id", item.id);
    formData.set("quantity", newQuantity.toString());
    startTransition(() => updateAction(formData));
  };

  const handleRemove = () => {
    const formData = new FormData();
    formData.set("cart_item_id", item.id);
    startTransition(() => removeAction(formData));
  };

  return (
    <div className="p-6">
      {/* Main Item Row */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Image and Product Info */}
        <div className="flex flex-1 gap-4">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <img
              alt={product.name}
              className="h-full w-full object-cover"
              src={product.primary_image_url || "/placeholder-product.jpg"}
            />
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <Link
                className="block font-semibold text-slate-900 hover:text-brand-pine transition-colors line-clamp-2"
                href={`/product/${product.id}`}
              >
                {product.name}
              </Link>
              <p className="mt-1 text-sm text-slate-600">
                {formatVariantLabel(variant)} • {sellerName}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatCurrency(item.listing.price)} each
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white">
          <button
            onClick={() => handleQuantityChange(Math.max(1, item.quantity - 1))}
            disabled={updatePending || item.quantity <= 1}
            className="p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            title="Decrease quantity"
          >
            <span className="text-lg font-bold text-slate-600">−</span>
          </button>
          <span className="w-8 text-center font-semibold text-slate-900">
            {item.quantity}
          </span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={updatePending || item.quantity >= item.listing.available_stock}
            className="p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            title="Increase quantity"
          >
            <span className="text-lg font-bold text-slate-600">+</span>
          </button>
        </div>

        {/* Price */}
        <div className="flex flex-col items-end justify-center min-w-fit">
          <p className="text-xs text-slate-600 uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(subtotal)}
          </p>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={removePending}
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors flex-shrink-0"
          title="Remove from cart"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Error Messages */}
      {(updateState.error || removeState.error) && (
        <div className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {updateState.error || removeState.error}
        </div>
      )}
    </div>
  );
}

