import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Role, UserProfile } from "@/types";
import { roleHome } from "@/lib/utils";

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
    .select("id, email, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile as UserProfile | null) ?? null
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