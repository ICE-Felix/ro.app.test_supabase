import { ResponseService } from "../services/ResponseService.ts";
import { ResponseType } from "../services/ErrorsService.ts";
import { Controller } from "./Controller.ts";
import { AuthenticationService } from "../services/AuthenticationService.ts";
import { SupabaseClient } from "../supabase/supabaseClient.ts";
import { SupabaseAdmin } from "../supabase/supabaseAdmin.ts";

// Gallery image interface
interface GalleryImage {
  id: string;
  gallery_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Gallery data interface
interface GalleryData {
  id?: string;
  name?: string;
  description?: string;
  venue_id?: string;
  images?: GalleryImage[];
  created_at?: string;
  updated_at?: string;
}

// Upload request interface
interface UploadRequest {
  gallery_id?: string;
  venue_id?: string;
  images: Array<{
    file_data: string; // base64 encoded image data
    file_name: string;
    mime_type: string;
    display_order?: number;
    is_primary?: boolean;
  }>;
}

// Delete request interface
interface DeleteRequest {
  gallery_id: string;
  image_ids: string[];
}

export class GalleryController extends Controller<GalleryData> {
  private readonly BUCKET_NAME = "venue-galleries";
  private readonly MAX_IMAGES = 6;
  private readonly MIN_IMAGES = 1;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // UUID validation helper
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Validate image data
  private validateImageData(image: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!image.file_data || typeof image.file_data !== "string") {
      errors.push("file_data is required and must be a base64 string");
    }

    if (!image.file_name || typeof image.file_name !== "string") {
      errors.push("file_name is required and must be a string");
    }

    if (!image.mime_type || typeof image.mime_type !== "string") {
      errors.push("mime_type is required and must be a string");
    } else if (!this.ALLOWED_MIME_TYPES.includes(image.mime_type)) {
      errors.push(`mime_type must be one of: ${this.ALLOWED_MIME_TYPES.join(", ")}`);
    }

    if (image.display_order !== undefined && (typeof image.display_order !== "number" || image.display_order < 1)) {
      errors.push("display_order must be a positive number");
    }

    if (image.is_primary !== undefined && typeof image.is_primary !== "boolean") {
      errors.push("is_primary must be a boolean");
    }

    // Validate base64 and file size
    if (image.file_data && typeof image.file_data === "string") {
      try {
        const base64Data = image.file_data.split(",")[1] || image.file_data;
        const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        if (buffer.length > this.MAX_FILE_SIZE) {
          errors.push(`File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }
      } catch (e) {
        errors.push("Invalid base64 image data");
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // Validate upload request
  private validateUploadRequest(data: UploadRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.images || !Array.isArray(data.images)) {
      errors.push("images array is required");
      return { isValid: false, errors };
    }

    if (data.images.length < this.MIN_IMAGES) {
      errors.push(`At least ${this.MIN_IMAGES} image is required`);
    }

    if (data.images.length > this.MAX_IMAGES) {
      errors.push(`Maximum ${this.MAX_IMAGES} images allowed`);
    }

    if (data.gallery_id && !this.isValidUUID(data.gallery_id)) {
      errors.push("gallery_id must be a valid UUID");
    }

    if (data.venue_id && !this.isValidUUID(data.venue_id)) {
      errors.push("venue_id must be a valid UUID");
    }

    // Validate each image
    data.images.forEach((image, index) => {
      const validation = this.validateImageData(image);
      if (!validation.isValid) {
        errors.push(`Image ${index + 1}: ${validation.errors.join(", ")}`);
      }
    });

    // Check for multiple primary images
    const primaryImages = data.images.filter(img => img.is_primary);
    if (primaryImages.length > 1) {
      errors.push("Only one image can be marked as primary");
    }

    return { isValid: errors.length === 0, errors };
  }

  // Create or get gallery
  private async createOrGetGallery(client: SupabaseClient, galleryId?: string, venueId?: string): Promise<string> {
    if (galleryId) {
      // Check if gallery exists
      const { data: existingGallery, error } = await client
        .from("galleries")
        .select("id")
        .eq("id", galleryId)
        .is("deleted_at", null)
        .single();

      if (error) {
        throw new Error(`Gallery not found: ${error.message}`);
      }

      return existingGallery.id;
    }

    // Create new gallery
    const { data: newGallery, error } = await client
      .from("galleries")
      .insert({
        name: venueId ? `Venue ${venueId} Gallery` : "New Gallery",
        venue_id: venueId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create gallery: ${error.message}`);
    }

    return newGallery.id;
  }

  // Upload single image to storage
  private async uploadImageToStorage(
    client: SupabaseClient,
    galleryId: string,
    imageData: string,
    fileName: string,
    mimeType: string
  ): Promise<{ path: string; url: string; size: number }> {
    // Generate unique file name
    const timestamp = Date.now();
    const extension = fileName.split(".").pop() || "jpg";
    const uniqueFileName = `${galleryId}/${timestamp}-${fileName}`;

    // Convert base64 to blob
    const base64Data = imageData.split(",")[1] || imageData;
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const blob = new Blob([buffer], { type: mimeType });

    // Upload to Supabase Storage with better error handling
    console.log(`Uploading image to storage: ${uniqueFileName}`);
    console.log(`Bucket: ${this.BUCKET_NAME}`);
    console.log(`File size: ${buffer.length} bytes`);

    const { data: uploadData, error: uploadError } = await (client as any).storage
      .from(this.BUCKET_NAME)
      .upload(uniqueFileName, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error details:", {
        message: uploadError.message,
        status: uploadError.statusCode,
        error: uploadError.error,
        details: uploadError
      });
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: urlData } = (client as any).storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(uniqueFileName);

    console.log("Public URL generated:", urlData.publicUrl);

    return {
      path: uploadData.path,
      url: urlData.publicUrl,
      size: buffer.length,
    };
  }

  // Save image metadata to database
  private async saveImageMetadata(
    client: SupabaseClient,
    galleryId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    displayOrder: number,
    isPrimary: boolean
  ): Promise<string> {
    const { data: imageData, error } = await client
      .from("gallery_images")
      .insert({
        gallery_id: galleryId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        display_order: displayOrder,
        is_primary: isPrimary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to save image metadata: ${error.message}`);
    }

    return imageData.id;
  }

  // Upload images endpoint
  async uploadImages(data: UploadRequest, _req?: Request): Promise<Response> {
    this.logAction("Gallery Upload", { gallery_id: data.gallery_id, venue_id: data.venue_id, image_count: data.images?.length });

    // Validate request
    const validation = this.validateUploadRequest(data);
    if (!validation.isValid) {
      return ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API
      );
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    try {
      // Create or get gallery
      const galleryId = await this.createOrGetGallery(client, data.gallery_id, data.venue_id);

      // Get current image count
      const { data: existingImages, error: countError } = await client
        .from("gallery_images")
        .select("id")
        .eq("gallery_id", galleryId)
        .is("deleted_at", null);

      if (countError) {
        throw new Error(`Failed to check existing images: ${countError.message}`);
      }

      const currentImageCount = existingImages?.length || 0;
      const totalImages = currentImageCount + data.images.length;

      if (totalImages > this.MAX_IMAGES) {
        return ResponseService.error(
          `Cannot upload ${data.images.length} images. Gallery already has ${currentImageCount} images. Maximum allowed: ${this.MAX_IMAGES}`,
          "VALIDATION_ERROR",
          400,
          { current_count: currentImageCount, max_allowed: this.MAX_IMAGES },
          ResponseType.API
        );
      }

      // Upload images
      const uploadedImages: Array<{ id: string; path: string; url: string; file_name: string; display_order: number; is_primary: boolean }> = [];

      for (let i = 0; i < data.images.length; i++) {
        const image = data.images[i];
        const displayOrder = image.display_order || (currentImageCount + i + 1);
        const isPrimary = image.is_primary || (currentImageCount === 0 && i === 0); // First image is primary if no existing images

        // Upload to storage
        const uploadResult = await this.uploadImageToStorage(
          client,
          galleryId,
          image.file_data,
          image.file_name,
          image.mime_type
        );

        // Save metadata
        const imageId = await this.saveImageMetadata(
          client,
          galleryId,
          image.file_name,
          uploadResult.path,
          uploadResult.size,
          image.mime_type,
          displayOrder,
          isPrimary
        );

        uploadedImages.push({
          id: imageId,
          path: uploadResult.path,
          url: uploadResult.url,
          file_name: image.file_name,
          display_order: displayOrder,
          is_primary: isPrimary,
        });
      }

      return ResponseService.created(
        {
          gallery_id: galleryId,
          uploaded_images: uploadedImages,
          total_images: totalImages,
        },
        galleryId,
        ResponseType.API
      );

    } catch (error) {
      console.error("Gallery upload error:", error);
      return ResponseService.error(
        "Failed to upload images",
        "UPLOAD_ERROR",
        500,
        { error: error.message },
        ResponseType.API
      );
    }
  }

  // Delete images endpoint
  async deleteImages(data: DeleteRequest, _req?: Request): Promise<Response> {
    this.logAction("Gallery Delete", { gallery_id: data.gallery_id, image_ids: data.image_ids });

    // Validate request
    const errors: string[] = [];
    if (!data.gallery_id || !this.isValidUUID(data.gallery_id)) {
      errors.push("gallery_id is required and must be a valid UUID");
    }

    if (!data.image_ids || !Array.isArray(data.image_ids) || data.image_ids.length === 0) {
      errors.push("image_ids array is required and must contain at least one image ID");
    }

    if (data.image_ids && data.image_ids.some(id => !this.isValidUUID(id))) {
      errors.push("All image_ids must be valid UUIDs");
    }

    if (errors.length > 0) {
      return ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors },
        ResponseType.API
      );
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    try {
      // Get images to delete
      const { data: imagesToDelete, error: fetchError } = await client
        .from("gallery_images")
        .select("id, file_path, gallery_id")
        .eq("gallery_id", data.gallery_id)
        .in("id", data.image_ids)
        .is("deleted_at", null);

      if (fetchError) {
        throw new Error(`Failed to fetch images: ${fetchError.message}`);
      }

      if (!imagesToDelete || imagesToDelete.length === 0) {
        return ResponseService.error(
          "No images found to delete",
          "NOT_FOUND",
          404,
          {},
          ResponseType.API
        );
      }

      // Check if this would leave the gallery empty
      const { data: remainingImages, error: remainingError } = await client
        .from("gallery_images")
        .select("id")
        .eq("gallery_id", data.gallery_id)
        .not("id", "in", `(${data.image_ids.join(",")})`)
        .is("deleted_at", null);

      if (remainingError) {
        throw new Error(`Failed to check remaining images: ${remainingError.message}`);
      }

      if (!remainingImages || remainingImages.length === 0) {
        return ResponseService.error(
          "Cannot delete all images. At least one image must remain in the gallery",
          "VALIDATION_ERROR",
          400,
          { min_images: this.MIN_IMAGES },
          ResponseType.API
        );
      }

      // Delete from storage
      const deletePromises = imagesToDelete.map(async (image) => {
        console.log(`Deleting image from storage: ${image.file_path}`);
        const { error: storageError } = await (client as any).storage
          .from(this.BUCKET_NAME)
          .remove([image.file_path]);

        if (storageError) {
          console.error(`Failed to delete image from storage: ${image.file_path}`, {
            message: storageError.message,
            status: storageError.statusCode,
            error: storageError.error,
            details: storageError
          });
        } else {
          console.log(`Successfully deleted image from storage: ${image.file_path}`);
        }
      });

      await Promise.all(deletePromises);

      // Soft delete from database
      const { error: deleteError } = await client
        .from("gallery_images")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("id", data.image_ids);

      if (deleteError) {
        throw new Error(`Failed to delete images from database: ${deleteError.message}`);
      }

      return ResponseService.success(
        {
          deleted_images: imagesToDelete.length,
          remaining_images: remainingImages.length,
          gallery_id: data.gallery_id,
        },
        200,
        undefined,
        ResponseType.API
      );

    } catch (error) {
      console.error("Gallery delete error:", error);
      return ResponseService.error(
        "Failed to delete images",
        "DELETE_ERROR",
        500,
        { error: error.message },
        ResponseType.API
      );
    }
  }

  // List gallery images endpoint
  async listImages(galleryId: string, _req?: Request): Promise<Response> {
    this.logAction("Gallery List", { gallery_id: galleryId });

    // Validate gallery ID
    if (!galleryId || !this.isValidUUID(galleryId)) {
      return ResponseService.error(
        "Valid gallery_id is required",
        "VALIDATION_ERROR",
        400,
        {},
        ResponseType.API
      );
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    try {
      // Get gallery with images
      const { data: gallery, error: galleryError } = await client
        .from("galleries")
        .select(`
          id,
          name,
          description,
          venue_id,
          created_at,
          updated_at,
          gallery_images (
            id,
            file_name,
            file_path,
            file_size,
            mime_type,
            display_order,
            is_primary,
            created_at,
            updated_at
          )
        `)
        .eq("id", galleryId)
        .is("deleted_at", null)
        .single();

      if (galleryError) {
        if (galleryError.code === "PGRST116") {
          return ResponseService.error(
            "Gallery not found",
            "NOT_FOUND",
            404,
            {},
            ResponseType.API
          );
        }
        throw new Error(`Failed to fetch gallery: ${galleryError.message}`);
      }

      // Get public URLs for images
      const imagesWithUrls = await Promise.all(
        gallery.gallery_images
          .filter((img: any) => !img.deleted_at)
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map(async (image: any) => {
            console.log(`Getting public URL for image: ${image.file_path}`);
            const { data: urlData } = (client as any).storage
              .from(this.BUCKET_NAME)
              .getPublicUrl(image.file_path);

            console.log(`Public URL generated for ${image.file_path}:`, urlData.publicUrl);

            return {
              ...image,
              url: urlData.publicUrl,
            };
          })
      );

      return ResponseService.success(
        {
          gallery_id: gallery.id,
          name: gallery.name,
          description: gallery.description,
          venue_id: gallery.venue_id,
          images: imagesWithUrls,
          total_images: imagesWithUrls.length,
          created_at: gallery.created_at,
          updated_at: gallery.updated_at,
        },
        200,
        undefined,
        ResponseType.API
      );

    } catch (error) {
      console.error("Gallery list error:", error);
      return ResponseService.error(
        "Failed to list images",
        "FETCH_ERROR",
        500,
        { error: error.message },
        ResponseType.API
      );
    }
  }

  // Override methods from base Controller (not used in this implementation)
  override async get(id?: string, _req?: Request): Promise<Response> {
    return this.listImages(id!, _req);
  }

  override async post(data: GalleryData, _req?: Request): Promise<Response> {
    return ResponseService.error(
      "Use /api/gallery/upload endpoint for uploading images",
      "METHOD_NOT_ALLOWED",
      405,
      {},
      ResponseType.API
    );
  }

  override async put(id: string, data: Partial<GalleryData>, _req?: Request): Promise<Response> {
    return ResponseService.error(
      "Use /api/gallery/upload and /api/gallery/delete endpoints for managing images",
      "METHOD_NOT_ALLOWED",
      405,
      {},
      ResponseType.API
    );
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    return ResponseService.error(
      "Use /api/gallery/delete endpoint for deleting images",
      "METHOD_NOT_ALLOWED",
      405,
      {},
      ResponseType.API
    );
  }
} 