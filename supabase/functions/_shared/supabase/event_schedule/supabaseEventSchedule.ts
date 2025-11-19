import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables as _Tables } from "./event_schedule.types.ts";

export type EventScheduleRow = _Tables<"event_schedule">;
export type EventScheduleInsert =
    import("./event_schedule.types.ts").TablesInsert<"event_schedule">;
export type EventScheduleUpdate =
    import("./event_schedule.types.ts").TablesUpdate<"event_schedule">;

export class SupabaseEventScheduleService {
    static async create(
        client: SupabaseClient,
        payload: EventScheduleInsert,
    ): Promise<EventScheduleRow> {
        const { data, error } = await client
            .from("event_schedule")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as EventScheduleRow;
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<EventScheduleRow | null> {
        const { data, error } = await client
            .from("event_schedule")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as EventScheduleRow;
    }

    static async listByEventId(
        client: SupabaseClient,
        eventId: string,
    ): Promise<EventScheduleRow[]> {
        const { data, error } = await client
            .from("event_schedule")
            .select("*")
            .eq("event_id", eventId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return (data || []) as EventScheduleRow[];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<EventScheduleUpdate>,
    ): Promise<EventScheduleRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof EventScheduleUpdate>(
            key: K,
            value: EventScheduleUpdate[K],
        ) => {
            if (value !== undefined) {
                updateData[key as string] = value;
            }
        };

        set("event_id", changes.event_id);
        set("frequency", changes.frequency);
        set("starts_on", changes.starts_on);
        set("ends_on", changes.ends_on);
        set("weekly_days", changes.weekly_days);
        set("monthly_days", changes.monthly_days);

        const { data, error } = await client
            .from("event_schedule")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as EventScheduleRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("event_schedule")
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
