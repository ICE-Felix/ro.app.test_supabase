import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables as _Tables } from "./ticket_type.types.ts";

export interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export type TicketTypeRow = _Tables<"ticket_type">;
export type TicketTypeInsert = import("./ticket_type.types.ts").TablesInsert<
    "ticket_type"
>;
export type TicketTypeUpdate = import("./ticket_type.types.ts").TablesUpdate<
    "ticket_type"
>;

export class SupabaseTicketTypeService {
    static async create(
        client: SupabaseClient,
        payload: TicketTypeInsert,
    ): Promise<TicketTypeRow> {
        const { data, error } = await client
            .from("ticket_type")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as TicketTypeRow;
    }

    static async createMultiple(
        client: SupabaseClient,
        payloads: TicketTypeInsert[],
    ): Promise<TicketTypeRow[]> {
        const { data, error } = await client
            .from("ticket_type")
            .insert(payloads)
            .select();

        if (error) throw error;
        return (data || []) as TicketTypeRow[];
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<TicketTypeRow | null> {
        console.log("Getting ticket type by ID:", id);

        const { data, error } = await client
            .from("ticket_type")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        console.log("GetById query result:", { data, error, id });

        if (error) {
            console.log("GetById error code:", error.code);
            // If the error is "PGRST116" (no rows found), return null instead of throwing
            if (error.code === "PGRST116") {
                console.log("No rows found for ID:", id);
                return null;
            }
            console.error("GetById database error:", error);
            throw error;
        }

        console.log("GetById success:", data);
        return data as TicketTypeRow;
    }

    static async list(
        client: SupabaseClient,
    ): Promise<TicketTypeRow[]> {
        const { data, error } = await client
            .from("ticket_type")
            .select("*")
            .is("deleted_at", null)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as TicketTypeRow[];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<TicketTypeUpdate>,
    ): Promise<TicketTypeRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof TicketTypeUpdate>(
            key: K,
            value: TicketTypeUpdate[K],
        ) => {
            if (value !== undefined) {
                updateData[key as string] = value;
            }
        };

        set("type", changes.type);

        const { data, error } = await client
            .from("ticket_type")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as TicketTypeRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("ticket_type")
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
