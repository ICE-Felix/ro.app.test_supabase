import { SupabaseClient } from '../supabaseClient.ts';
import type { Tables, TablesInsert, TablesUpdate } from "../database.types.ts";

export type GalleryRow = Tables<"galleries">;
export type GalleryInsert = TablesInsert<"galleries">;
export type GalleryUpdate = TablesUpdate<"galleries">;

export class SupabaseGalleriesService {
    static async create(
        client: SupabaseClient,
        payload: GalleryInsert,
    ): Promise<GalleryRow> {
        const { data, error } = await client
            .from("galleries")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create gallery: ${error.message}`);
        }

        return data;
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<GalleryRow | null> {
        const { data, error } = await client
            .from("galleries")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to get gallery: ${error.message}`);
        }

        return data;
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: GalleryUpdate,
    ): Promise<GalleryRow> {
        const { data, error } = await client
            .from("galleries")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update gallery: ${error.message}`);
        }

        return data;
    }

    static async delete(
        client: SupabaseClient,
        id: string,
    ): Promise<void> {
        const { error } = await client
            .from("galleries")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            throw new Error(`Failed to delete gallery: ${error.message}`);
        }
    }
}
