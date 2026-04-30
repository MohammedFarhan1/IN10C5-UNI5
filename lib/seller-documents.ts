import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const SELLER_DOCUMENTS_BUCKET = "seller-documents";
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

type SellerDocumentType = "trademark" | "document";

function normalizeExtension(file: File) {
  const extension = file.name.split(".").pop()?.trim().toLowerCase();
  return extension && /^[a-z0-9]+$/.test(extension) ? extension : "bin";
}

export function validateSellerDocument(file: File, label: string) {
  if (file.size <= 0) {
    throw new Error(`${label} is empty. Please upload a valid file.`);
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(`${label} must be 10 MB or smaller.`);
  }

  if (file.type && !ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    throw new Error(`${label} must be a PDF, JPG, PNG, or WebP file.`);
  }
}

export async function ensureSellerDocumentsBucket() {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: existingBucket, error: existingBucketError } =
    await supabaseAdmin.storage.getBucket(SELLER_DOCUMENTS_BUCKET);

  if (existingBucketError && !existingBucketError.message.toLowerCase().includes("not found")) {
    throw new Error(existingBucketError.message);
  }

  if (existingBucket) {
    return;
  }

  const { error: createBucketError } = await supabaseAdmin.storage.createBucket(
    SELLER_DOCUMENTS_BUCKET,
    {
      public: false,
      fileSizeLimit: `${Math.floor(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024))}MB`
    }
  );

  if (createBucketError && !createBucketError.message.toLowerCase().includes("already exists")) {
    throw new Error(createBucketError.message);
  }
}

export async function uploadSellerDocument(input: {
  userId: string;
  file: File;
  type: SellerDocumentType;
}) {
  validateSellerDocument(
    input.file,
    input.type === "trademark" ? "Trademark document" : "Additional document"
  );
  await ensureSellerDocumentsBucket();

  const supabaseAdmin = createSupabaseAdminClient();
  const objectPath = `${input.userId}/${input.type}-${Date.now()}-${crypto.randomUUID()}.${normalizeExtension(
    input.file
  )}`;
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(SELLER_DOCUMENTS_BUCKET)
    .upload(objectPath, fileBuffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false
    });

  if (error) {
    throw new Error(error.message);
  }

  return objectPath;
}

export async function removeSellerDocuments(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));

  if (uniquePaths.length === 0) {
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin.storage.from(SELLER_DOCUMENTS_BUCKET).remove(uniquePaths);
}

export async function getSellerDocumentSignedUrl(path: string | null, expiresInSeconds = 3600) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.storage
      .from(SELLER_DOCUMENTS_BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      console.warn(`Failed to generate signed URL for ${path}:`, error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for ${path}:`, error);
    return null;
  }
}
