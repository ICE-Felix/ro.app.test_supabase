import { SupabaseClient } from "../supabaseClient.ts";
import type { Tables as _Tables } from "./event_tickets.types.ts";

export type EventTicketRow = _Tables<"event_tickets">;
export type EventTicketInsert = import("./event_tickets.types.ts").TablesInsert<
    "event_tickets"
>;
export type EventTicketUpdate = import("./event_tickets.types.ts").TablesUpdate<
    "event_tickets"
>;

export class SupabaseEventTicketsService {
    static async create(
        client: SupabaseClient,
        payload: EventTicketInsert,
    ): Promise<EventTicketRow> {
        const { data, error } = await client
            .from("event_tickets")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as EventTicketRow;
    }

    static async createMultiple(
        client: SupabaseClient,
        payloads: EventTicketInsert[],
    ): Promise<EventTicketRow[]> {
        const { data, error } = await client
            .from("event_tickets")
            .insert(payloads)
            .select();

        if (error) throw error;
        return (data || []) as EventTicketRow[];
    }

    static createEventTicket(
        client: SupabaseClient,
        eventId: string,
        name: string,
        type: string,
        price: number,
        maxPerOrder: number,
        ageCategory?: string | null,
        isActive: boolean = true,
    ): Promise<EventTicketRow> {
        const payload: EventTicketInsert = {
            event_id: eventId,
            name: name,
            type: type,
            price: price,
            max_per_order: maxPerOrder,
            age_category: ageCategory,
            is_active: isActive,
        };

        return this.create(client, payload);
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<EventTicketRow | null> {
        const { data, error } = await client
            .from("event_tickets")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as EventTicketRow;
    }

    static async listByEventId(
        client: SupabaseClient,
        eventId: string,
    ): Promise<EventTicketRow[]> {
        const { data, error } = await client
            .from("event_tickets")
            .select("*")
            .eq("event_id", eventId)
            .is("deleted_at", null)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return (data || []) as EventTicketRow[];
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<EventTicketUpdate>,
    ): Promise<EventTicketRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof EventTicketUpdate>(
            key: K,
            value: EventTicketUpdate[K],
        ) => {
            if (value !== undefined) {
                updateData[key as string] = value;
            }
        };

        set("event_id", changes.event_id);
        set("name", changes.name);
        set("type", changes.type);
        set("price", changes.price);
        set("max_per_order", changes.max_per_order);
        set("age_category", changes.age_category);
        set("is_active", changes.is_active);

        const { data, error } = await client
            .from("event_tickets")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as EventTicketRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("event_tickets")
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
