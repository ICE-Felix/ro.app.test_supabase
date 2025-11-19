import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables as _Tables } from "./venue_general_attributes.types.ts";

export type VenueGeneralAttributeRow = _Tables<"venue_general_attributes">;
export type VenueGeneralAttributeInsert =
    import("./venue_general_attributes.types.ts").TablesInsert<
        "venue_general_attributes"
    >;
export type VenueGeneralAttributeUpdate =
    import("./venue_general_attributes.types.ts").TablesUpdate<
        "venue_general_attributes"
    >;

export interface AttributeFilter {
    [type: string]: Array<{
        value: string;
        uuid: string;
    }>;
}

export class SupabaseVenueGeneralAttributesService {
    static async create(
        client: SupabaseClient,
        payload: VenueGeneralAttributeInsert,
    ): Promise<VenueGeneralAttributeRow> {
        const { data, error } = await client
            .from("venue_general_attributes")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as VenueGeneralAttributeRow;
    }

    static async createMultiple(
        client: SupabaseClient,
        payloads: VenueGeneralAttributeInsert[],
    ): Promise<VenueGeneralAttributeRow[]> {
        const { data, error } = await client
            .from("venue_general_attributes")
            .insert(payloads)
            .select();

        if (error) throw error;
        return (data || []) as VenueGeneralAttributeRow[];
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueGeneralAttributeRow | null> {
        const { data, error } = await client
            .from("venue_general_attributes")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            // If the error is "PGRST116" (no rows found), return null instead of throwing
            if (error.code === "PGRST116") {
                return null;
            }
            throw error;
        }

        return data as VenueGeneralAttributeRow;
    }

    static async list(
        client: SupabaseClient,
    ): Promise<VenueGeneralAttributeRow[]> {
        const { data, error } = await client
            .from("venue_general_attributes")
            .select("*")
            .is("deleted_at", null)
            .order("type", { ascending: true })
            .order("value", { ascending: true });

        if (error) throw error;
        return (data || []) as VenueGeneralAttributeRow[];
    }

    static async getFilterList(
        client: SupabaseClient,
    ): Promise<AttributeFilter> {
        const attributes = await this.list(client);

        const filterMap: AttributeFilter = {};

        for (const attr of attributes) {
            const type = attr.type || "unknown";
            if (!filterMap[type]) {
                filterMap[type] = [];
            }

            filterMap[type].push({
                value: attr.value || "",
                uuid: attr.id,
            });
        }

        return filterMap;
    }

    static async getAttributesByIds(
        client: SupabaseClient,
        ids: string[],
    ): Promise<VenueGeneralAttributeRow[]> {
        if (ids.length === 0) return [];

        const { data, error } = await client
            .from("venue_general_attributes")
            .select("*")
            .in("id", ids)
            .is("deleted_at", null)
            .order("type", { ascending: true })
            .order("value", { ascending: true });

        if (error) throw error;
        return (data || []) as VenueGeneralAttributeRow[];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<VenueGeneralAttributeUpdate>,
    ): Promise<VenueGeneralAttributeRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof VenueGeneralAttributeUpdate>(
            key: K,
            value: VenueGeneralAttributeUpdate[K],
        ) => {
            if (value !== undefined) {
                updateData[key as string] = value;
            }
        };

        set("type", changes.type);
        set("value", changes.value);

        const { data, error } = await client
            .from("venue_general_attributes")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as VenueGeneralAttributeRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("venue_general_attributes")
            .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();
        if (error) throw error;
        return { deleted: true, id: (data as { id: string }).id };
    }
}
