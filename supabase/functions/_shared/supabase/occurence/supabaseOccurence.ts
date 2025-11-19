import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables as _Tables } from "./occurence.types.ts";

export type OccurrenceRow = _Tables<"occurrence">;
export type OccurrenceInsert = import("./occurence.types.ts").TablesInsert<
    "occurrence"
>;
export type OccurrenceUpdate = import("./occurence.types.ts").TablesUpdate<
    "occurrence"
>;

export class SupabaseOccurenceService {
    static async create(
        client: SupabaseClient,
        payload: OccurrenceInsert,
    ): Promise<OccurrenceRow> {
        const { data, error } = await client
            .from("occurrence")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as OccurrenceRow;
    }

    static async createMultiple(
        client: SupabaseClient,
        payloads: OccurrenceInsert[],
    ): Promise<OccurrenceRow[]> {
        const { data, error } = await client
            .from("occurrence")
            .insert(payloads)
            .select();

        if (error) throw error;
        return (data || []) as OccurrenceRow[];
    }

    static createOccurrence(
        client: SupabaseClient,
        eventId: string,
        scheduleId: string,
        windowId: string,
        status: "open" | "sold_out" | "blocked" = "open",
    ): Promise<OccurrenceRow> {
        const payload: OccurrenceInsert = {
            event_id: eventId,
            schedule_id: scheduleId,
            window_id: windowId,
            status: status,
        };

        return this.create(client, payload);
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<OccurrenceRow | null> {
        const { data, error } = await client
            .from("occurrence")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as OccurrenceRow;
    }

    static async listByEventId(
        client: SupabaseClient,
        eventId: string,
    ): Promise<OccurrenceRow[]> {
        const { data, error } = await client
            .from("occurrence")
            .select("*")
            .eq("event_id", eventId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return (data || []) as OccurrenceRow[];
    }

    static async listByWindowId(
        client: SupabaseClient,
        windowId: string,
    ): Promise<OccurrenceRow[]> {
        const { data, error } = await client
            .from("occurrence")
            .select("*")
            .eq("window_id", windowId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return (data || []) as OccurrenceRow[];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<OccurrenceUpdate>,
    ): Promise<OccurrenceRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof OccurrenceUpdate>(
            key: K,
            value: OccurrenceUpdate[K],
        ) => {
            if (value !== undefined) {
                updateData[key as string] = value;
            }
        };

        set("event_id", changes.event_id);
        set("schedule_id", changes.schedule_id);
        set("window_id", changes.window_id);
        set("status", changes.status);

        const { data, error } = await client
            .from("occurrence")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as OccurrenceRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("occurrence")
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
