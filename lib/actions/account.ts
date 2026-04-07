"use server";

import { revalidatePath } from "next/cache";
import { ActionState } from "@/types";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateCustomerAccountAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);
  const fullName = String(formData.get("full_name") ?? "").trim();
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!fullName || !mobileNumber || !address) {
    return { error: "Name, mobile number, and address are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      mobile_number: mobileNumber,
      address
    })
    .eq("id", profile.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath("/checkout");
  return { success: "Account details updated." };
}
