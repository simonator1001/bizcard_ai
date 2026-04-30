// Stub: Supabase removed, using AppWrite
// getImageUrl now returns null - images are served via AppWrite Storage

export async function getImageUrl(imagePath: string | null | undefined): Promise<string | null> {
  if (!imagePath) return null;
  // AppWrite storage images are accessed via their file preview API
  // This stub returns the raw path for now; actual AppWrite integration handles this
  return null;
}
