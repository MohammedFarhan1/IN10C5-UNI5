import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth";
import { getMarketplaceCartItems } from "@/lib/marketplace";
import { formatCurrency } from "@/lib/utils";
import { CartItemList } from "@/components/cart/cart-item-list";
import { checkoutCartAction, clearCartAction } from "@/lib/actions/cart";

export default async function CartPage() {
  const { profile } = await requireRole(["customer"]);
  const cartItems = await getMarketplaceCartItems(profile.id);

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.listing?.price ?? 0) * item.quantity;
  }, 0);
  
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          description="Review your items and proceed to checkout"
          title="Shopping Cart"
        />

        {cartItems.length === 0 ? (
          <div className="mt-12 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="mb-6 rounded-full bg-slate-100 p-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  Your cart is empty
                </h2>
                <p className="mb-8 text-slate-600">
                  Add some products to get started shopping
                </p>
                <Link href="/">
                  <Button className="w-full px-6 py-3 text-base">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Order Summary ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})
                  </h2>
                </div>
                <CartItemList cartItems={cartItems} />
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card>
                  <div className="space-y-6 p-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Order Summary
                    </h3>

                    <div className="space-y-3 border-t border-b border-slate-200 py-4">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Tax (10%)</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(tax)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-brand-pine">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    <div className="space-y-3 pt-4">
                      <form action={checkoutCartAction} className="w-full">
                        <Button type="submit" className="w-full px-6 py-3 text-base">
                          Proceed to Checkout
                        </Button>
                      </form>
                      <Link href="/" className="block">
                        <Button type="button" variant="secondary" className="w-full px-6 py-3 text-base">
                          Continue Shopping
                        </Button>
                      </Link>
                      <form action={clearCartAction} className="w-full">
                        <Button type="submit" variant="ghost" className="w-full text-slate-600">
                          Clear Cart
                        </Button>
                      </form>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
