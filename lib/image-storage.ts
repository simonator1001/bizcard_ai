// AppWrite image URL handler
// Card images are stored in AppWrite Storage with full URLs
// e.g. https://sgp.cloud.appwrite.io/v1/storage/buckets/.../files/.../view?project=...

export async function getImageUrl(imagePath: string | null | undefined): Promise<string | null> {
  if (!imagePath) return null;
  
  // If it's already a full URL (AppWrite or any HTTPS), return it directly
  if (imagePath.startsWith('https://')) return imagePath;
  
  // If it starts with http://, also return directly
  if (imagePath.startsWith('http://')) return imagePath;
  
  // For relative paths or file IDs, construct the AppWrite storage URL
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_CARD_IMAGES_BUCKET || 'card_images';
  
  if (projectId) {
    return `https://sgp.cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${imagePath}/view?project=${projectId}`;
  }
  
  return null;
}
