import type { SupabaseClient } from "../supabaseClient.ts";
import type {
    VenueProductCategoryInsert,
    VenueProductCategoryRow,
    VenueProductCategoryUpdate,
    VenueProductCategoryWithParent,
} from "./venue_product_categories.types.ts";

export class SupabaseVenueProductCategoriesService {
    static async create(
        client: SupabaseClient,
        payload: VenueProductCategoryInsert,
    ): Promise<VenueProductCategoryRow> {
        const { data, error } = await client
            .from("venue_product_categories")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to create venue_product_category: ${error.message}`,
            );
        }

        return data;
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueProductCategoryRow | null> {
        const { data, error } = await client
            .from("venue_product_categories")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(
                `Failed to get venue_product_category: ${error.message}`,
            );
        }

        return data;
    }

    static async list(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
        } = {},
    ): Promise<{ data: VenueProductCategoryRow[]; count: number }> {
        const { limit = 20, offset = 0, search } = options;

        let query = client
            .from("venue_product_categories")
            .select("*", { count: "exact" })
            .is("deleted_at", null);

        if (search) {
            query = query.or(`name.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(
                `Failed to list venue_product_categories: ${error.message}`,
            );
        }

        return {
            data: data || [],
            count: count || 0,
        };
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: VenueProductCategoryUpdate,
    ): Promise<VenueProductCategoryRow> {
        const { data, error } = await client
            .from("venue_product_categories")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to update venue_product_category: ${error.message}`,
            );
        }

        return data;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueProductCategoryRow> {
        const { data, error } = await client
            .from("venue_product_categories")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to delete venue_product_category: ${error.message}`,
            );
        }

        return data;
    }

    /**
     * Enrich venue product category with parent name
     */
    static async enrichVenueProductCategoryRow(
        client: SupabaseClient,
        row: VenueProductCategoryRow,
    ): Promise<VenueProductCategoryWithParent> {
        let parentName: string | null = null;

        if (row.parent_id) {
            try {
                const { data: parentData, error: parentError } = await client
                    .from("venue_product_categories")
                    .select("name")
                    .eq("id", row.parent_id)
                    .is("deleted_at", null)
                    .single();

                if (!parentError && parentData) {
                    parentName = parentData.name;
                }
            } catch (error) {
                console.error("Error fetching parent name:", error);
            }
        }

        return {
            ...row,
            parent_name: parentName,
        };
    }

    /**
     * Get venue product category by ID with parent name
     */
    static async getByIdWithParent(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueProductCategoryWithParent | null> {
        const row = await this.getById(client, id);
        if (!row) {
            return null;
        }

        return await this.enrichVenueProductCategoryRow(client, row);
    }

    /**
     * List venue product categories with parent names
     */
    static async listWithParent(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
        } = {},
    ): Promise<{ data: VenueProductCategoryWithParent[]; count: number }> {
        const { data, count } = await this.list(client, options);

        // Enrich each row with parent name
        const enrichedData = await Promise.all(
            data.map((row) => this.enrichVenueProductCategoryRow(client, row)),
        );

        return {
            data: enrichedData,
            count,
        };
    }
}
