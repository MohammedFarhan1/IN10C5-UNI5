"use server";

import { redirect } from "next/navigation";
import { ActionState } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function createOrderAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["customer"]);
  const productId = String(formData.get("product_id") ?? "").trim();

  if (!productId) {
    return { error: "Product ID is required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("place_order", {
    product_uuid: productId,
    buyer_uuid: profile.id
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/orders");
}