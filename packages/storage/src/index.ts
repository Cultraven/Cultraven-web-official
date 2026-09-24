export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<{ url: string }>;
  remove(key: string): Promise<void>;
}
// Implementations: Google Cloud Storage or Cloudinary — apps/services only use this interface.
