import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountStatus, Role, UserProfile } from "@/types";
import { roleHome } from "@/lib/utils";

function asAccountStatus(value: unknown): AccountStatus {
  return value === "pending" || value === "rejected" ? value : "approved";
}

export async function getCurrentSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null as UserProfile | null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, email, role, full_name, business_name, spoc_name, cin, gst, trademark_url, document_url, mobile_number, address, account_status, created_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: profile
      ? ({
          ...profile,
          account_status: asAccountStatus(profile.account_status)
        } as UserProfile)
      : null
  };
}

export async function requireRole(allowedRoles: Role[]) {
  const context = await getCurrentSession();

  if (!context.user || !context.profile) {
    redirect("/login");
  }

  if (!allowedRoles.includes(context.profile.role)) {
    redirect(roleHome(context.profile.role));
  }

  return {
    ...context,
    user: context.user,
    profile: context.profile
  };
}

export async function redirectIfAuthenticated() {
  const context = await getCurrentSession();

  if (context.profile) {
    redirect(roleHome(context.profile.role));
  }
}

export function isSellerApproved(profile: Pick<UserProfile, "role" | "account_status">) {
  return profile.role === "seller" && profile.account_status === "approved";
}

export async function requireApprovedSeller() {
  const context = await requireRole(["seller"]);

  if (context.profile.account_status !== "approved") {
    redirect("/dashboard");
  }

  return context;
}
