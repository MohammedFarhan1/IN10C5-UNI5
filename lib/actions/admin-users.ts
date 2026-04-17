"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ActionState, Role } from "@/types";

type UserFormRole = Role;

function isValidManagedRole(role: string): role is UserFormRole {
  return role === "customer" || role === "seller" || role === "admin";
}

function normalizeUserForm(formData: FormData) {
  return {
    userId: String(formData.get("userId") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "").trim()
  };
}

export async function createAdminUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole(["admin"]);
  const { email, password, role } = normalizeUserForm(formData);

  if (!email || !password || !role) {
    return { error: "Email, password, and role are required." };
  }

  if (!isValidManagedRole(role)) {
    return { error: "Choose a valid role for the new user." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role
    }
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const { error: profileError } = await supabaseAdmin.from("users").upsert({
      id: data.user.id,
      email,
      role,
      account_status: "approved"
    });

    if (profileError) {
      return { error: profileError.message };
    }
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateAdminUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { profile } = await requireRole(["admin"]);
  const { userId, email, password, role } = normalizeUserForm(formData);

  if (!userId || !email || !role) {
    return { error: "User, email, and role are required." };
  }

  if (!isValidManagedRole(role)) {
    return { error: "Choose a valid role." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const attributes: {
    email: string;
    email_confirm?: boolean;
    password?: string;
    user_metadata: { role: UserFormRole };
  } = {
    email,
    email_confirm: true,
    user_metadata: { role }
  };

  if (password) {
    if (password.length < 6) {
      return { error: "Password must be at least 6 characters if you set one." };
    }

    attributes.password = password;
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, attributes);

  if (error) {
    return { error: error.message };
  }

  const { error: profileError } = await supabaseAdmin
    .from("users")
    .update({
      email,
      role
    })
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);

  if (profile.id === userId && profile.role !== role) {
    redirect("/");
  }

  redirect("/admin/users");
}

export async function deleteAdminUserAction(formData: FormData) {
  const { profile } = await requireRole(["admin"]);
  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId || userId === profile.id) {
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
}
