import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables as _Tables } from "./schedule_time_window.types.ts";

export type ScheduleTimeWindowRow = _Tables<"schedule_time_window">;
export type ScheduleTimeWindowInsert =
    import("./schedule_time_window.types.ts").TablesInsert<
        "schedule_time_window"
    >;
export type ScheduleTimeWindowUpdate =
    import("./schedule_time_window.types.ts").TablesUpdate<
        "schedule_time_window"
    >;

export class SupabaseScheduleTimeWindowService {
    static async create(
        client: SupabaseClient,
        payload: ScheduleTimeWindowInsert,
    ): Promise<ScheduleTimeWindowRow> {
        const { data, error } = await client
            .from("schedule_time_window")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as ScheduleTimeWindowRow;
    }

    static async createMultiple(
        client: SupabaseClient,
        payloads: ScheduleTimeWindowInsert[],
    ): Promise<ScheduleTimeWindowRow[]> {
        const { data, error } = await client
            .from("schedule_time_window")
            .insert(payloads)
            .select();

        if (error) throw error;
        return (data || []) as ScheduleTimeWindowRow[];
    }

    static createWindow(
        client: SupabaseClient,
        startTime: string,
        endTime: string,
        scheduleId: string,
        date?: string | null,
    ): Promise<ScheduleTimeWindowRow> {
        const payload: ScheduleTimeWindowInsert = {
            start_time: startTime,
            end_time: endTime,
            schedule_id: scheduleId,
            date: date || null,
        };

        return this.create(client, payload);
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<ScheduleTimeWindowRow | null> {
        const { data, error } = await client
            .from("schedule_time_window")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as ScheduleTimeWindowRow;
    }

    static async listByScheduleId(
        client: SupabaseClient,
        scheduleId: string,
    ): Promise<ScheduleTimeWindowRow[]> {
        const { data, error } = await client
            .from("schedule_time_window")
            .select("*")
            .eq("schedule_id", scheduleId)
            .is("deleted_at", null)
            .order("date", { ascending: true })
            .order("start_time", { ascending: true });

        if (error) throw error;
        return (data || []) as ScheduleTimeWindowRow[];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<ScheduleTimeWindowUpdate>,
    ): Promise<ScheduleTimeWindowRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof ScheduleTimeWindowUpdate>(
            key: K,
            value: ScheduleTimeWindowUpdate[K],
        ) => {
            if (value !== undefined) {
                updateData[key as string] = value;
            }
        };

        set("date", changes.date);
        set("start_time", changes.start_time);
        set("end_time", changes.end_time);
        set("schedule_id", changes.schedule_id);

        const { data, error } = await client
            .from("schedule_time_window")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as ScheduleTimeWindowRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("schedule_time_window")
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
