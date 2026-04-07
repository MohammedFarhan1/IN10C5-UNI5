"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionState, Role } from "@/types";
import { roleHome } from "@/lib/utils";

function isValidRole(role: string): role is Exclude<Role, "admin"> {
  return role === "customer" || role === "seller";
}

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Supabase email rate limit was hit. For demo signup, disable email confirmation in Supabase Auth and then use any sample address like user@example.com.";
  }

  if (normalized.includes("email not confirmed")) {
    return "This account still needs email confirmation. For demo mode, disable email confirmation in Supabase Auth so sample addresses can sign in immediately.";
  }

  return message;
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  redirect(roleHome((profile?.role as Role | undefined) ?? "customer"));
}

export async function signupAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim();

  if (!email || !password || !role) {
    return { error: "Email, password, and role are required." };
  }

  if (!isValidRole(role)) {
    return { error: "Please choose either customer or seller." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role }
    }
  });

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  redirect(roleHome(role));
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
