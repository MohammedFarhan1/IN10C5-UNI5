"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

const ALLOWED_STATUSES = new Set(["approved", "rejected"]);

export async function updateSellerVerificationStatusAction(formData: FormData) {
  const { supabase } = await requireRole(["admin"]);

  const sellerId = String(formData.get("sellerId") ?? "").trim();
  const nextStatus = String(formData.get("account_status") ?? "").trim();

  if (!sellerId || !ALLOWED_STATUSES.has(nextStatus)) {
    return;
  }

  const { error } = await supabase
    .from("users")
    .update({
      account_status: nextStatus
    })
    .eq("id", sellerId)
    .eq("role", "seller");

  if (error) {
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/sellers");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/products");
}
