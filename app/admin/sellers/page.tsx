import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminSellerVerifications } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { updateSellerVerificationStatusAction } from "@/lib/actions/seller-verification";

export default async function AdminSellerVerificationsPage() {
  const sellers = await getAdminSellerVerifications();

  return (
    <div className="space-y-8">
      <PageHeader
        description="Review seller business details, inspect uploaded documents, and approve or reject marketplace access."
        eyebrow="Seller verification"
        title="Seller approvals"
      />

      {sellers.length === 0 ? (
        <EmptyState
          description="New seller applications will appear here as soon as businesses sign up."
          title="No seller applications yet"
        />
      ) : (
        <div className="space-y-6">
          {sellers.map((seller) => (
            <Card className="space-y-5" key={seller.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-brand-ink">
                      {seller.business_name || "Business details pending"}
                    </h2>
                    <StatusBadge value={seller.account_status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{seller.email}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Applied on {formatDate(seller.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {seller.trademark_signed_url ? (
                    <Link href={seller.trademark_signed_url} target="_blank">
                      <Button variant="secondary">View trademark</Button>
                    </Link>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-500">
                      No trademark file
                    </span>
                  )}

                  {seller.document_signed_url ? (
                    <Link href={seller.document_signed_url} target="_blank">
                      <Button variant="secondary">View document</Button>
                    </Link>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-500">
                      No extra document
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-brand-ink">SPOC</p>
                  <p className="mt-2">{seller.spoc_name || seller.full_name || "Not submitted"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-brand-ink">Mobile</p>
                  <p className="mt-2">{seller.mobile_number || "Not submitted"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-brand-ink">CIN</p>
                  <p className="mt-2 break-all">{seller.cin || "Not submitted"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-semibold text-brand-ink">GST</p>
                  <p className="mt-2 break-all">{seller.gst || "Not submitted"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-5">
                <form action={updateSellerVerificationStatusAction}>
                  <input name="sellerId" type="hidden" value={seller.id} />
                  <input name="account_status" type="hidden" value="approved" />
                  <Button type="submit">Approve</Button>
                </form>

                <form action={updateSellerVerificationStatusAction}>
                  <input name="sellerId" type="hidden" value={seller.id} />
                  <input name="account_status" type="hidden" value="rejected" />
                  <Button type="submit" variant="danger">
                    Reject
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
