import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables, TablesInsert, TablesUpdate } from "../database.types.ts";

export type GalleryImageRow = Tables<"gallery_images">;
export type GalleryImageInsert = TablesInsert<"gallery_images">;
export type GalleryImageUpdate = TablesUpdate<"gallery_images">;

export class SupabaseGalleryImagesService {
    static async create(
        client: SupabaseClient,
        payload: GalleryImageInsert,
    ): Promise<GalleryImageRow> {
        const { data, error } = await client
            .from("gallery_images")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create gallery image: ${error.message}`);
        }

        return data;
    }

    static async getByGalleryId(
        client: SupabaseClient,
        galleryId: string,
    ): Promise<GalleryImageRow[]> {
        const { data, error } = await client
            .from("gallery_images")
            .select("*")
            .eq("gallery_id", galleryId)
            .is("deleted_at", null);

        if (error) {
            throw new Error(`Failed to get gallery images: ${error.message}`);
        }

        return data || [];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: GalleryImageUpdate,
    ): Promise<GalleryImageRow> {
        const { data, error } = await client
            .from("gallery_images")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update gallery image: ${error.message}`);
        }

        return data;
    }

    static async delete(
        client: SupabaseClient,
        id: string,
    ): Promise<void> {
        const { error } = await client
            .from("gallery_images")
            .delete()
            .eq("id", id);

        if (error) {
            throw new Error(`Failed to delete gallery image: ${error.message}`);
        }
    }

    static async deleteByGalleryId(
        client: SupabaseClient,
        galleryId: string,
    ): Promise<void> {
        const { error } = await client
            .from("gallery_images")
            .delete()
            .eq("gallery_id", galleryId);

        if (error) {
            throw new Error(
                `Failed to delete gallery images: ${error.message}`,
            );
        }
    }
}
