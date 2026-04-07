import { notFound } from "next/navigation";
import { CustomerAccountForm } from "@/components/forms/customer-account-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getCustomerProfile } from "@/lib/data";
import { updateCustomerAccountAction } from "@/lib/actions/account";

export default async function AccountPage() {
  const { profile } = await requireRole(["customer"]);
  const customerProfile = await getCustomerProfile(profile.id);

  if (!customerProfile) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 lg:px-8">
      <div className="space-y-8">
        <PageHeader
          description="Keep your delivery details up to date so checkout stays quick and every tracked order has a destination."
          eyebrow="Customer account"
          title="My account"
        />

        <Card className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-brand-ink">Contact and address</h2>
            <p className="text-sm text-slate-600">
              These details stay attached to your customer profile for future purchases.
            </p>
          </div>

          <CustomerAccountForm action={updateCustomerAccountAction} profile={customerProfile} />
        </Card>
      </div>
    </div>
  );
}
