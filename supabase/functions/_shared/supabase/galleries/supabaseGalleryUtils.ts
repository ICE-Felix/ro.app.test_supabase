import { SupabaseClient } from "../supabaseClient.ts";
import { SupabaseGalleriesService } from "./supabaseGalleries.ts";
import { SupabaseGalleryImagesService } from "../gallery_images/supabaseGalleryImages.ts";

export interface GalleryImageData {
    base64: string;
    filename: string;
    contentType: string;
}

export interface ProcessedGalleryImage {
    id: string;
    file_name: string;
    url: string;
}

export interface GalleryContext {
    bucket: string;
    folderPrefix: string;
}

export class SupabaseGalleryUtils {
    /**
     * Process gallery data and create gallery with images
     */
    static async processGalleryData(
        client: SupabaseClient,
        galleryImages: string[] | null,
        context: GalleryContext,
    ): Promise<{ galleryId: string | null; images: ProcessedGalleryImage[] }> {
        // Always create a gallery, even if no images
        const gallery = await SupabaseGalleriesService.create(client, {});
        console.log("Created gallery:", gallery.id);

        const processedImages: ProcessedGalleryImage[] = [];

        if (galleryImages && galleryImages.length > 0) {
            // Transform base64 strings into structured data
            const imageDataArray: GalleryImageData[] = galleryImages.map(
                (base64String, index) => {
                    // Extract content type from data URL if present
                    const contentTypeMatch = base64String.match(
                        /^data:([^;]+);base64,/,
                    );
                    const contentType = contentTypeMatch
                        ? contentTypeMatch[1]
                        : "image/jpeg";

                    // Extract file extension from content type
                    const _extension = contentType.split("/")[1] || "jpg";

                    return {
                        base64: base64String,
                        filename: `image-${index + 1}.${_extension}`,
                        contentType: contentType,
                    };
                },
            );

            // Upload images and create gallery_image records
            for (const imageData of imageDataArray) {
                try {
                    const uploadedImage = await this.uploadImageToStorage(
                        client,
                        context.bucket,
                        imageData,
                        gallery.id,
                        context.folderPrefix,
                    );

                    if (uploadedImage) {
                        // Create gallery_image record
                        const galleryImage = await SupabaseGalleryImagesService
                            .create(client, {
                                gallery_id: gallery.id,
                                image_name: uploadedImage.filename,
                            });

                        // Construct public URL
                        const publicUrl = this.constructImageUrl(
                            context.bucket,
                            `${context.folderPrefix}_${gallery.id}`,
                            uploadedImage.filename,
                        );

                        processedImages.push({
                            id: galleryImage.id,
                            file_name: galleryImage.image_name,
                            url: publicUrl,
                        });

                        console.log("Created gallery image:", {
                            id: galleryImage.id,
                            filename: uploadedImage.filename,
                            url: publicUrl,
                        });
                    }
                } catch (error) {
                    console.error("Error processing gallery image:", error);
                    // Continue with other images even if one fails
                }
            }
        }

        return {
            galleryId: gallery.id,
            images: processedImages,
        };
    }

    /**
     * Upload base64 image to Supabase storage
     */
    private static async uploadImageToStorage(
        client: SupabaseClient,
        bucket: string,
        imageData: GalleryImageData,
        galleryId: string,
        folderPrefix: string,
    ): Promise<{ filename: string; path: string } | null> {
        try {
            // Validate required fields
            if (!imageData.base64) {
                console.error("Missing base64 data for image upload");
                return null;
            }

            if (!imageData.filename) {
                console.error("Missing filename for image upload");
                return null;
            }

            // Convert base64 to blob
            const base64Data = imageData.base64.replace(
                /^data:image\/[a-z]+;base64,/,
                "",
            );
            const bytes = Uint8Array.from(
                atob(base64Data),
                (c) => c.charCodeAt(0),
            );
            const blob = new Blob([bytes], {
                type: imageData.contentType || "image/jpeg",
            });

            // Generate unique filename with timestamp
            const timestamp = Date.now();
            const _fileExtension = imageData.filename.split(".").pop() || "jpg";
            const uniqueFilename = `${timestamp}-${imageData.filename}`;

            // Create folder path: {folderPrefix}_{galleryId}/{filename}
            const folderPath = `${folderPrefix}_${galleryId}`;
            const fullPath = `${folderPath}/${uniqueFilename}`;

            // Upload to storage
            const { data, error } = await client.storage
                .from(bucket)
                .upload(fullPath, blob);

            if (error) {
                console.error("Storage upload error:", error);
                return null;
            }

            console.log("Storage upload successful:", {
                bucket,
                fullPath,
                uploadData: data,
            });

            return {
                filename: uniqueFilename,
                path: fullPath,
            };
        } catch (error) {
            console.error("Error processing base64 image:", error);
            return null;
        }
    }

    /**
     * Construct public URL for an image
     */
    private static constructImageUrl(
        bucket: string,
        folderPath: string,
        filename: string,
    ): string {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        if (!supabaseUrl) {
            console.error("SUPABASE_URL not found in environment");
            return "";
        }

        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${folderPath}/${filename}`;
    }

    /**
     * Get gallery images with URLs
     */
    static async getGalleryImages(
        client: SupabaseClient,
        galleryId: string,
        context: GalleryContext,
    ): Promise<ProcessedGalleryImage[]> {
        try {
            console.log(
                `[DEBUG] Fetching gallery images for galleryId: ${galleryId}, context:`,
                context,
            );
            const images = await SupabaseGalleryImagesService.getByGalleryId(
                client,
                galleryId,
            );
            console.log(
                `[DEBUG] Found ${images.length} gallery images:`,
                images,
            );

            const processedImages = images.map((image) => {
                const publicUrl = this.constructImageUrl(
                    context.bucket,
                    `${context.folderPrefix}_${galleryId}`,
                    image.image_name,
                );

                console.log(`[DEBUG] Processed image:`, {
                    id: image.id,
                    file_name: image.image_name,
                    url: publicUrl,
                });

                return {
                    id: image.id,
                    file_name: image.image_name,
                    url: publicUrl,
                };
            });

            console.log(
                `[DEBUG] Returning ${processedImages.length} processed images`,
            );
            return processedImages;
        } catch (error) {
            console.error("Error fetching gallery images:", error);
            return [];
        }
    }

    /**
     * Delete gallery and all associated images
     */
    static async deleteGallery(
        client: SupabaseClient,
        galleryId: string,
        context: GalleryContext,
    ): Promise<void> {
        try {
            // Get all images in the gallery
            const images = await SupabaseGalleryImagesService.getByGalleryId(
                client,
                galleryId,
            );

            // Delete images from storage
            for (const image of images) {
                try {
                    const { error } = await client.storage
                        .from(context.bucket)
                        .remove([
                            `${context.folderPrefix}_${galleryId}/${image.image_name}`,
                        ]);

                    if (error) {
                        console.error(
                            "Error deleting image from storage:",
                            error,
                        );
                    }
                } catch (error) {
                    console.error("Error deleting image from storage:", error);
                }
            }

            // Delete gallery_images records
            await SupabaseGalleryImagesService.deleteByGalleryId(
                client,
                galleryId,
            );

            // Delete gallery
            await SupabaseGalleriesService.delete(client, galleryId);

            console.log(
                "Successfully deleted gallery and all associated images:",
                galleryId,
            );
        } catch (error) {
            console.error("Error deleting gallery:", error);
            throw error;
        }
    }

    /**
     * Get gallery images by context (for different entity types)
     */
    static async getGalleryImagesByContext(
        client: SupabaseClient,
        galleryId: string,
        entityType:
            | "venues"
            | "events"
            | "partners"
            | "shops"
            | "service_providers"
            | "services"
            | "venue_products" = "venues",
    ): Promise<ProcessedGalleryImage[]> {
        const contextMap: Record<string, GalleryContext> = {
            venues: { bucket: "venue-galleries", folderPrefix: "gallery" },
            events: { bucket: "event-galleries", folderPrefix: "gallery" },
            partners: { bucket: "partner-galleries", folderPrefix: "gallery" },
            shops: { bucket: "shop-galleries", folderPrefix: "gallery" },
            service_providers: {
                bucket: "service-providers-galleries",
                folderPrefix: "gallery",
            },
            services: {
                bucket: "services-galleries",
                folderPrefix: "gallery",
            },
            venue_products: {
                bucket: "venue-products-galleries",
                folderPrefix: "gallery",
            },
        };

        const context = contextMap[entityType] || contextMap.venues;
        return await this.getGalleryImages(client, galleryId, context);
    }

    /**
     * Process gallery data by context
     */
    static async processGalleryDataByContext(
        client: SupabaseClient,
        galleryImages: string[] | null,
        entityType:
            | "venues"
            | "events"
            | "partners"
            | "shops"
            | "service_providers"
            | "services"
            | "venue_products" = "venues",
    ): Promise<{ galleryId: string | null; images: ProcessedGalleryImage[] }> {
        const contextMap: Record<string, GalleryContext> = {
            venues: { bucket: "venue-galleries", folderPrefix: "gallery" },
            events: { bucket: "event-galleries", folderPrefix: "gallery" },
            partners: { bucket: "partner-galleries", folderPrefix: "gallery" },
            shops: { bucket: "shop-galleries", folderPrefix: "gallery" },
            service_providers: {
                bucket: "service-providers-galleries",
                folderPrefix: "gallery",
            },
            services: {
                bucket: "services-galleries",
                folderPrefix: "gallery",
            },
            venue_products: {
                bucket: "venue-products-galleries",
                folderPrefix: "gallery",
            },
        };

        const context = contextMap[entityType] || contextMap.venues;
        return await this.processGalleryData(client, galleryImages, context);
    }

    /**
     * Delete specific gallery images by their IDs
     */
    static async deleteGalleryImages(
        client: SupabaseClient,
        imageIds: string[],
        galleryId: string,
        context: GalleryContext,
    ): Promise<void> {
        try {
            // Get the images to delete
            const images = await SupabaseGalleryImagesService.getByGalleryId(
                client,
                galleryId,
            );

            const imagesToDelete = images.filter((image) =>
                imageIds.includes(image.id)
            );

            // Delete images from storage
            for (const image of imagesToDelete) {
                try {
                    const { error } = await client.storage
                        .from(context.bucket)
                        .remove([
                            `${context.folderPrefix}_${galleryId}/${image.image_name}`,
                        ]);

                    if (error) {
                        console.error(
                            "Error deleting image from storage:",
                            error,
                        );
                    }
                } catch (error) {
                    console.error("Error deleting image from storage:", error);
                }
            }

            // Delete gallery_images records
            for (const imageId of imageIds) {
                try {
                    await SupabaseGalleryImagesService.delete(client, imageId);
                } catch (error) {
                    console.error(
                        "Error deleting gallery image record:",
                        error,
                    );
                }
            }

            console.log(
                "Successfully deleted gallery images:",
                imageIds,
            );
        } catch (error) {
            console.error("Error deleting gallery images:", error);
            throw error;
        }
    }

    /**
     * Update existing gallery with new images
     */
    static async updateGalleryWithImages(
        client: SupabaseClient,
        galleryId: string,
        newImages: string[] | null,
        deletedImageIds: string[] | null,
        context: GalleryContext,
    ): Promise<ProcessedGalleryImage[]> {
        try {
            // Delete specified images first
            if (deletedImageIds && deletedImageIds.length > 0) {
                await this.deleteGalleryImages(
                    client,
                    deletedImageIds,
                    galleryId,
                    context,
                );
            }

            // Add new images if provided
            if (newImages && newImages.length > 0) {
                // Transform base64 strings into structured data
                const imageDataArray: GalleryImageData[] = newImages.map(
                    (base64String, index) => {
                        // Extract content type from data URL if present
                        const contentTypeMatch = base64String.match(
                            /^data:([^;]+);base64,/,
                        );
                        const contentType = contentTypeMatch
                            ? contentTypeMatch[1]
                            : "image/jpeg";

                        // Extract file extension from content type
                        const extension = contentType.split("/")[1] || "jpg";

                        return {
                            base64: base64String,
                            filename: `gallery-image-${index + 1}.${extension}`,
                            contentType: contentType,
                        };
                    },
                );

                // Upload images and create gallery_image records
                for (const imageData of imageDataArray) {
                    try {
                        const uploadedImage = await this.uploadImageToStorage(
                            client,
                            context.bucket,
                            imageData,
                            galleryId,
                            context.folderPrefix,
                        );

                        if (uploadedImage) {
                            // Create gallery_image record
                            const galleryImage =
                                await SupabaseGalleryImagesService
                                    .create(client, {
                                        gallery_id: galleryId,
                                        image_name: uploadedImage.filename,
                                    });

                            console.log("Added new gallery image:", {
                                id: galleryImage.id,
                                filename: uploadedImage.filename,
                            });
                        }
                    } catch (error) {
                        console.error(
                            "Error processing new gallery image:",
                            error,
                        );
                        // Continue with other images even if one fails
                    }
                }
            }

            // Get all remaining images in the gallery
            const allImages = await this.getGalleryImages(
                client,
                galleryId,
                context,
            );

            return allImages;
        } catch (error) {
            console.error("Error updating gallery with images:", error);
            throw error;
        }
    }
}
