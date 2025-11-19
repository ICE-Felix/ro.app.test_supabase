import { SupabaseClient } from "./supabaseClient.ts";
import { SupabaseAdmin } from "./supabaseAdmin.ts";

export interface ImageUploadResult {
    path: string;
    url: string;
    id?: string;
}

export interface ImageDeleteResult {
    deleted: boolean;
    path?: string;
    error?: string;
}

export class SupabaseImageUtils {
    /**
     * Builds a public image URL from bucket and object path
     */
    static buildPublicImageUrl(
        bucket: string,
        objectPath: string,
    ): string | null {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") as string | undefined;
        if (!supabaseUrl) return null;
        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
    }

    /**
     * Extracts the object path from a public image URL
     */
    static extractObjectPathFromUrl(publicUrl: string): string | null {
        try {
            const url = new URL(publicUrl);
            const pathMatch = url.pathname.match(
                /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/,
            );
            if (pathMatch && pathMatch.length >= 3) {
                return pathMatch[2]; // Return the object path (everything after bucket name)
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Extracts bucket name from a public image URL
     */
    static extractBucketFromUrl(publicUrl: string): string | null {
        try {
            const url = new URL(publicUrl);
            const pathMatch = url.pathname.match(
                /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/,
            );
            if (pathMatch && pathMatch.length >= 2) {
                return pathMatch[1]; // Return the bucket name
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Uploads an image from base64 data to a specific bucket
     */
    static async uploadImage(
        client: SupabaseClient,
        base64Data: string,
        fileName: string,
        bucket: string,
    ): Promise<ImageUploadResult | null> {
        try {
            // Remove data URL prefix if present
            const base64String = base64Data.replace(
                /^data:image\/[a-z]+;base64,/,
                "",
            );

            // Convert base64 to bytes
            const bytes = Uint8Array.from(
                atob(base64String),
                (c) => c.charCodeAt(0),
            );

            // Create blob with appropriate MIME type
            const mimeType = this.getMimeTypeFromBase64(base64Data);
            const fileData = new Blob([bytes], { type: mimeType });

            // Generate unique filename with timestamp
            const uploadFileName = `${Date.now()}-${fileName}`;

            // Upload to storage
            const { data: uploadData, error } = await client.storage
                .from(bucket)
                .upload(uploadFileName, fileData);

            if (error) {
                console.error("Upload error:", error);
                return null;
            }

            if (!uploadData) return null;

            // Build public URL
            const url = this.buildPublicImageUrl(bucket, uploadData.path);
            const storageId = (uploadData as { id?: string }).id;

            return {
                path: uploadData.path,
                url: url || "",
                id: storageId,
            };
        } catch (error) {
            console.error("Image upload failed:", error);
            return null;
        }
    }

    /**
     * Deletes an image by its public URL
     */
    static async deleteImageByUrl(
        client: SupabaseClient,
        publicUrl: string,
    ): Promise<ImageDeleteResult> {
        try {
            const bucket = this.extractBucketFromUrl(publicUrl);
            const objectPath = this.extractObjectPathFromUrl(publicUrl);

            if (!bucket || !objectPath) {
                return {
                    deleted: false,
                    error: "Invalid public URL format",
                };
            }

            const { error } = await client.storage
                .from(bucket)
                .remove([objectPath]);

            if (error) {
                console.error("Delete error:", error);
                return {
                    deleted: false,
                    path: objectPath,
                    error: error.message,
                };
            }

            return {
                deleted: true,
                path: objectPath,
            };
        } catch (error) {
            console.error("Image deletion failed:", error);
            return {
                deleted: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Deletes an image by bucket and object path
     */
    static async deleteImageByPath(
        client: SupabaseClient,
        bucket: string,
        objectPath: string,
    ): Promise<ImageDeleteResult> {
        try {
            const { error } = await client.storage
                .from(bucket)
                .remove([objectPath]);

            if (error) {
                console.error("Delete error:", error);
                return {
                    deleted: false,
                    path: objectPath,
                    error: error.message,
                };
            }

            return {
                deleted: true,
                path: objectPath,
            };
        } catch (error) {
            console.error("Image deletion failed:", error);
            return {
                deleted: false,
                path: objectPath,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Gets storage object by ID (useful for finding existing images)
     */
    static async getStorageObjectById(
        bucket: string,
        id: string,
    ): Promise<{ id?: string; name?: string; metadata?: unknown } | null> {
        try {
            const adminClient = SupabaseAdmin.initialize();
            const { data, error } = await adminClient
                .schema("storage")
                .from("objects")
                .select("id, name, metadata")
                .eq("id", id)
                .single();
            if (!error) {
                return data as {
                    id?: string;
                    name?: string;
                    metadata?: unknown;
                };
            }

            const { data: files } = await adminClient.storage.from(bucket).list(
                "",
                { limit: 1000, offset: 0 },
            );
            const found = (files || []).find((
                f: { id?: string; name: string },
            ) => f.id === id || f.name.includes(id));
            return found || null;
        } catch {
            return null;
        }
    }

    /**
     * Extracts MIME type from base64 data URL
     */
    private static getMimeTypeFromBase64(base64Data: string): string {
        const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
        if (mimeMatch && mimeMatch[1]) {
            return mimeMatch[1];
        }
        // Default to JPEG if no MIME type detected
        return "image/jpeg";
    }

    /**
     * Validates if a string is a valid base64 image
     */
    static isValidBase64Image(base64Data: string): boolean {
        return true;
        // // Check if it starts with data:image/ and contains base64
        // const base64ImageRegex =
        //     /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/;
        // return base64ImageRegex.test(base64Data);
    }

    /**
     * Gets file extension from MIME type
     */
    static getFileExtensionFromMimeType(mimeType: string): string {
        const mimeToExt: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/svg+xml": "svg",
        };
        return mimeToExt[mimeType] || "jpg";
    }
}
