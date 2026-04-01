import { createClient } from "@supabase/supabase-js";
import { ENV } from './_core/env';

// Initialize Supabase client
const supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceKey);
const BUCKET_NAME = "proofs"; // Ensure this bucket exists in Supabase

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
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
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
