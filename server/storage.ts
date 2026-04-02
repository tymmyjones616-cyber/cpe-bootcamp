import { createClient } from "@supabase/supabase-js";
import { ENV } from './_core/env.js';

// Initialize Supabase client
const supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceKey);
const BUCKET_NAME = "payment-proofs"; // Update this in your Supabase dashboard

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  
  const { data: uploadData, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Supabase Storage upload error for bucket '${BUCKET_NAME}':`, error);
    throw new Error(`Supabase Storage upload failed: ${error.message}. Please ensure the '${BUCKET_NAME}' bucket exists and is public.`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return { key, url: publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = relKey.replace(/^\/+/, "");
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(key);

  return { key, url: publicUrl };
}
