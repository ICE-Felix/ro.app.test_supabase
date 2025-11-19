import { SupabaseClient } from "../supabaseClient.ts";
import type {
    Tables as _Tables,
    TablesInsert,
    TablesUpdate,
} from "./event_types.types.ts";

export type EventTypeRow = _Tables<"event_types">;
export type EventTypeInsert = TablesInsert<"event_types">;
export type EventTypeUpdate = TablesUpdate<"event_types">;

export class SupabaseEventTypesService {
    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<EventTypeRow | null> {
        const { data, error } = await client
            .from("event_types")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as EventTypeRow;
    }

    static async list(client: SupabaseClient): Promise<EventTypeRow[]> {
        const { data, error } = await client
            .from("event_types")
            .select("*")
            .is("deleted_at", null)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as EventTypeRow[];
    }

    static async create(
        client: SupabaseClient,
        payload: Pick<EventTypeInsert, "name" | "is_active">,
    ): Promise<EventTypeRow> {
        const dataToInsert: EventTypeInsert = {
            name: payload.name ?? null,
            is_active: payload.is_active ?? null,
            created_at: new Date().toISOString(),
            updated_at: null,
            deleted_at: null,
            id: undefined,
        } as unknown as EventTypeInsert;

        const { data, error } = await client
            .from("event_types")
            .insert(dataToInsert)
            .select()
            .single();
        if (error) throw error;
        return data as EventTypeRow;
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<Pick<EventTypeUpdate, "name" | "is_active">>,
    ): Promise<EventTypeRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        if (changes.name !== undefined) updateData.name = changes.name;
        if (changes.is_active !== undefined) {
            updateData.is_active = changes.is_active;
        }

        const { data, error } = await client
            .from("event_types")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();
        if (error) throw error;
        return data as EventTypeRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("event_types")
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
