import { SupabaseClient } from "./supabaseClient.ts";

/**
 * Reusable utilities for common Supabase function operations
 * including image handling, gallery management, and other shared functionality
 */
export class SupabaseFunctionUtils {
    /**
     * Upload an image to a specific bucket with organized folder structure
     * @param client - Supabase client
     * @param imageData - File, Blob, or base64 string
     * @param fileName - Original file name
     * @param bucket - Storage bucket name
     * @param folderPath - Folder path within bucket (e.g., "service-provider-id")
     * @returns Upload result with path, url, and storage id
     */
    static async uploadImage(
        client: SupabaseClient,
        imageData: File | Blob | string,
        fileName: string,
        bucket: string,
        folderPath: string,
    ): Promise<{ path: string; url: string; id?: string } | null> {
        try {
            let fileData: File | Blob;
            if (typeof imageData === "string") {
                const base64Data = imageData.replace(
                    /^data:image\/[a-z]+;base64,/,
                    "",
                );
                const bytes = Uint8Array.from(
                    atob(base64Data),
                    (c) => c.charCodeAt(0),
                );
                fileData = new Blob([bytes], { type: "image/jpeg" });
            } else {
                fileData = imageData;
            }

            const uploadFileName = `${Date.now()}-${fileName}`;
            const fullPath = `${folderPath}/${uploadFileName}`;

            const { data: uploadData } = await client.storage
                .from(bucket)
                .upload(fullPath, fileData);

            if (!uploadData) return null;

            const url = this.buildPublicImageUrl(bucket, uploadData.path);
            const storageId = (uploadData as { id?: string }).id;

            return {
                path: uploadData.path,
                url: url || "",
                id: storageId,
            };
        } catch (error) {
            console.error("Error uploading image:", error);
            return null;
        }
    }

    /**
     * Delete an image from storage
     * @param client - Supabase client
     * @param bucket - Storage bucket name
     * @param path - Image path in storage
     * @returns Success status
     */
    static async deleteImage(
        client: SupabaseClient,
        bucket: string,
        path: string,
    ): Promise<boolean> {
        try {
            const { error } = await client.storage
                .from(bucket)
                .remove([path]);

            if (error) {
                console.error("Error deleting image:", error);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error deleting image:", error);
            return false;
        }
    }

    /**
     * Build public image URL
     * @param bucket - Storage bucket name
     * @param path - Image path in storage
     * @returns Public URL
     */
    static buildPublicImageUrl(bucket: string, path: string): string {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        if (!supabaseUrl) return "";
        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    }

    /**
     * Handle featured image upload with automatic cleanup of old image
     * @param client - Supabase client
     * @param imageData - File, Blob, or base64 string
     * @param fileName - Original file name
     * @param bucket - Storage bucket name
     * @param entityId - Entity ID for folder organization
     * @param currentImagePath - Current image path to delete (optional)
     * @returns Upload result with path, url, and storage id
     */
    static async handleFeaturedImageUpload(
        client: SupabaseClient,
        imageData: File | Blob | string,
        fileName: string,
        bucket: string,
        entityId: string,
        currentImagePath?: string | null,
    ): Promise<{ path: string; url: string; id?: string } | null> {
        try {
            // Delete old image if exists
            if (currentImagePath) {
                await this.deleteImage(client, bucket, currentImagePath);
            }

            // Upload new image
            const result = await this.uploadImage(
                client,
                imageData,
                fileName,
                bucket,
                entityId,
            );

            return result;
        } catch (error) {
            console.error("Error handling featured image upload:", error);
            return null;
        }
    }

    /**
     * Handle featured image deletion
     * @param client - Supabase client
     * @param bucket - Storage bucket name
     * @param imagePath - Image path to delete
     * @returns Success status
     */
    static async handleFeaturedImageDeletion(
        client: SupabaseClient,
        bucket: string,
        imagePath: string | null,
    ): Promise<boolean> {
        if (!imagePath) return true;

        try {
            return await this.deleteImage(client, bucket, imagePath);
        } catch (error) {
            console.error("Error handling featured image deletion:", error);
            return false;
        }
    }

    /**
     * Process base64 image data
     * @param base64Data - Base64 encoded image string
     * @returns Blob object
     */
    static processBase64Image(base64Data: string): Blob {
        const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        return new Blob([bytes], { type: "image/jpeg" });
    }

    /**
     * Validate image file type
     * @param fileName - File name
     * @param allowedTypes - Array of allowed MIME types
     * @returns Validation result
     */
    static validateImageType(
        fileName: string,
        allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp"],
    ): boolean {
        const extension = fileName.toLowerCase().split(".").pop();
        const typeMap: Record<string, string> = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
        };

        const mimeType = typeMap[extension || ""];
        return mimeType ? allowedTypes.includes(mimeType) : false;
    }

    /**
     * Generate unique file name with timestamp
     * @param originalName - Original file name
     * @param prefix - Optional prefix
     * @returns Unique file name
     */
    static generateUniqueFileName(
        originalName: string,
        prefix?: string,
    ): string {
        const timestamp = Date.now();
        const extension = originalName.split(".").pop();
        const baseName = originalName.split(".").slice(0, -1).join(".");
        const safeBaseName = baseName.replace(/[^a-zA-Z0-9]/g, "_");

        if (prefix) {
            return `${prefix}_${timestamp}_${safeBaseName}.${extension}`;
        }
        return `${timestamp}_${safeBaseName}.${extension}`;
    }
}
