"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionState, Role } from "@/types";
import { roleHome } from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { removeSellerDocuments, uploadSellerDocument } from "@/lib/seller-documents";

function isValidRole(role: string): role is Exclude<Role, "admin"> {
  return role === "customer" || role === "seller";
}

function normalizeEmailInput(value: string) {
  const normalizedQuotes = value
    .trim()
    .replace(/[\u2018\u2019\u201C\u201D]/g, '"')
    .replace(/\s+/g, " ");

  const extractedAngleBracketEmail = normalizedQuotes.match(/<([^<>@\s]+@[^<>@\s]+)>/);
  const candidate = extractedAngleBracketEmail?.[1] ?? normalizedQuotes;

  return candidate.replace(/^["'\s]+|["'\s]+$/g, "").toLowerCase();
}

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit")) {
    return "Supabase email rate limit was hit. For demo signup, disable email confirmation in Supabase Auth and then use any sample address like user@example.com.";
  }

  if (normalized.includes("email not confirmed")) {
    return "This account still needs email confirmation. For demo mode, disable email confirmation in Supabase Auth so sample addresses can sign in immediately.";
  }

  if (normalized.includes("invalid email")) {
    return "Enter a simple email-style value like demo@example.com. Wrapping the address in quotes or extra text can make Supabase reject it.";
  }

  return message;
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = normalizeEmailInput(String(formData.get("email") ?? ""));
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
  const email = normalizeEmailInput(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim();
  const businessName = String(formData.get("business_name") ?? "").trim();
  const spocName = String(formData.get("spoc_name") ?? "").trim();
  const cin = String(formData.get("cin") ?? "").trim();
  const gst = String(formData.get("gst") ?? "").trim();
  const mobileNumber = String(formData.get("mobile_number") ?? "").trim();
  const trademarkFile = formData.get("trademark_file");
  const additionalDocumentFile = formData.get("additional_document_file");

  if (!email || !password || !role) {
    return { error: "Email, password, and role are required." };
  }

  if (!isValidRole(role)) {
    return { error: "Please choose either customer or seller." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (role === "seller") {
    if (!businessName || !spocName || !cin || !gst || !mobileNumber) {
      return {
        error:
          "Business name, SPOC name, CIN, GST, mobile number, and both document uploads are required for seller signup."
      };
    }

    if (!(trademarkFile instanceof File) || trademarkFile.size === 0) {
      return { error: "Upload your trademark document to continue." };
    }

    if (!(additionalDocumentFile instanceof File) || additionalDocumentFile.size === 0) {
      return { error: "Upload an additional verification document to continue." };
    }
  }

  const supabase = await createSupabaseServerClient();
  let supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabaseAdmin = createSupabaseAdminClient();
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `${error.message} To skip email confirmation during signup, add the service role key to your environment.`
          : "Signup is not configured correctly."
    };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      account_status: role === "seller" ? "pending" : "approved",
      full_name: role === "seller" ? spocName : null,
      business_name: role === "seller" ? businessName : null,
      spoc_name: role === "seller" ? spocName : null,
      cin: role === "seller" ? cin : null,
      gst: role === "seller" ? gst : null,
      mobile_number: role === "seller" ? mobileNumber : null
    }
  });

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  const userId = data.user?.id;

  if (!userId) {
    return { error: "Your account was created, but the profile setup could not be completed." };
  }

  if (role === "seller") {
    const uploadedPaths: string[] = [];

    try {
      const trademarkPath = await uploadSellerDocument({
        userId,
        file: trademarkFile as File,
        type: "trademark"
      });
      uploadedPaths.push(trademarkPath);

      const additionalDocumentPath = await uploadSellerDocument({
        userId,
        file: additionalDocumentFile as File,
        type: "document"
      });
      uploadedPaths.push(additionalDocumentPath);

      const { error: profileError } = await supabaseAdmin
        .from("users")
        .update({
          email,
          role,
          full_name: spocName,
          business_name: businessName,
          spoc_name: spocName,
          cin,
          gst,
          mobile_number: mobileNumber,
          trademark_url: trademarkPath,
          document_url: additionalDocumentPath,
          account_status: "pending"
        })
        .eq("id", userId);

      if (profileError) {
        throw new Error(profileError.message);
      }
    } catch (uploadError) {
      await removeSellerDocuments(uploadedPaths);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabase.auth.signOut();

      return {
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "We could not finish your seller onboarding. Please try again."
      };
    }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    return { error: getAuthErrorMessage(signInError.message) };
  }

  redirect(roleHome(role));
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
