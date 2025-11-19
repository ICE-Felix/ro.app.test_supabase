import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables as _Tables } from "./ticket_eligibility.types.ts";

export type TicketEligibilityRow = _Tables<"ticket_eligibility">;
export type TicketEligibilityInsert =
    import("./ticket_eligibility.types.ts").TablesInsert<
        "ticket_eligibility"
    >;
export type TicketEligibilityUpdate =
    import("./ticket_eligibility.types.ts").TablesUpdate<
        "ticket_eligibility"
    >;

export class SupabaseTicketEligibilityService {
    static async create(
        client: SupabaseClient,
        payload: TicketEligibilityInsert,
    ): Promise<TicketEligibilityRow> {
        const { data, error } = await client
            .from("ticket_eligibility")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as TicketEligibilityRow;
    }

    static async createMultiple(
        client: SupabaseClient,
        payloads: TicketEligibilityInsert[],
    ): Promise<TicketEligibilityRow[]> {
        const { data, error } = await client
            .from("ticket_eligibility")
            .insert(payloads)
            .select();

        if (error) throw error;
        return (data || []) as TicketEligibilityRow[];
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<TicketEligibilityRow | null> {
        const { data, error } = await client
            .from("ticket_eligibility")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as TicketEligibilityRow;
    }

    static async listByEventTicketId(
        client: SupabaseClient,
        eventTicketId: string,
    ): Promise<TicketEligibilityRow[]> {
        const { data, error } = await client
            .from("ticket_eligibility")
            .select("*")
            .eq("event_ticket_id", eventTicketId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return (data || []) as TicketEligibilityRow[];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<TicketEligibilityUpdate>,
    ): Promise<TicketEligibilityRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof TicketEligibilityUpdate>(
            key: K,
            value: TicketEligibilityUpdate[K],
        ) => {
            if (value !== undefined) {
                updateData[key as string] = value;
            }
        };

        set("event_ticket_id", changes.event_ticket_id);
        set("schedule_id", changes.schedule_id);
        set("frequency", changes.frequency);
        set("weekly_days", changes.weekly_days);
        set("monthly_days", changes.monthly_days);

        const { data, error } = await client
            .from("ticket_eligibility")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as TicketEligibilityRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("ticket_eligibility")
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
