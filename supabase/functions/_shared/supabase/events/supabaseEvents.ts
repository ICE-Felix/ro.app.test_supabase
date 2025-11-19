import { SupabaseClient } from "../supabaseClient.ts";
import { SupabaseAdmin } from "../supabaseAdmin.ts";
import { SupabaseScheduleTimeWindowService } from "../schedule_time_window/supabaseScheduleTimeWindow.ts";
import { SupabaseOccurenceService } from "../occurence/supabaseOccurence.ts";
import { SupabaseEventScheduleService } from "../event_schedule/supabaseEventSchedule.ts";
import { SupabaseEventTicketsService } from "../event_tickets/supabaseEventTickets.ts";
import { SupabaseTicketEligibilityService } from "../ticket_eligibility/supabaseTicketEligibility.ts";
import type { Tables as _Tables } from "./events.types.ts";

export type EventRow = _Tables<"events">;
export type EventInsert = import("./events.types.ts").TablesInsert<"events">;
export type EventUpdate = import("./events.types.ts").TablesUpdate<"events">;

export type EnrichedEvent = EventRow & {
    event_type_name?: string;
    venue_name?: string;
    image_url?: string;
    image_error?: string;
};

export interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface EventsQuery {
    event_type_id?: string;
    venue_id?: string;
    search?: string;
    start?: string;
    end?: string;
    limit?: number;
    offset?: number;
    page?: number;
}

interface AdHocWindow {
    start_time: string;
    end_time: string;
}

interface AdHocDateWindow {
    date: string;
    windows: AdHocWindow[];
}

interface ScheduleWindow {
    start_time: string;
    end_time: string;
}

interface ScheduleJson {
    frequency: "daily" | "weekly" | "monthly";
    starts_on: string;
    ends_on: string;
    windows: ScheduleWindow[];
    weekly_days?: number[];
    monthly_days?: number[];
}

interface TicketJson {
    name: string;
    type: string; // UUID string to ticket_type table
    price: number;
    age_category?: string;
    is_active?: boolean;
    max_per_order: number;
    frequency?: "daily" | "weekly" | "monthly";
    monthly_days?: number[];
    weekly_days?: number[];
}

function trimOrNull(value: unknown): string | null {
    if (typeof value === "string") {
        const t = value.trim();
        return t.length > 0 ? t : null;
    }
    return value === null || value === undefined ? null : String(value);
}

export class SupabaseEventsService {
    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<EventRow | null> {
        const { data, error } = await client
            .from("events")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();
        if (error) throw error;
        return data as EventRow;
    }

    static async list(
        client: SupabaseClient,
        query: EventsQuery,
    ): Promise<{ data: EventRow[]; pagination: PaginationMeta }> {
        const limit = query.limit && query.limit > 0 && query.limit <= 100
            ? query.limit
            : 20;
        const page = query.page && query.page >= 1
            ? query.page
            : (query.offset !== undefined
                ? Math.floor(query.offset / limit) + 1
                : 1);
        const offset = query.offset !== undefined
            ? query.offset
            : (page - 1) * limit;

        let countQuery = client
            .from("events")
            .select("*", { count: "exact", head: true })
            .is("deleted_at", null);

        let dataQuery = client
            .from("events")
            .select("*")
            .is("deleted_at", null);

        if (query.event_type_id) {
            countQuery = countQuery.eq("event_type_id", query.event_type_id);
            dataQuery = dataQuery.eq("event_type_id", query.event_type_id);
        }
        if (query.venue_id) {
            countQuery = countQuery.eq("venue_id", query.venue_id);
            dataQuery = dataQuery.eq("venue_id", query.venue_id);
        }
        if (query.start) {
            countQuery = countQuery.gte("start", query.start);
            dataQuery = dataQuery.gte("start", query.start);
        }
        if (query.end) {
            countQuery = countQuery.lte("end", query.end);
            dataQuery = dataQuery.lte("end", query.end);
        }
        if (query.search && query.search.trim().length > 0) {
            const pattern = `%${query.search.trim()}%`;
            try {
                // PostgREST OR syntax
                countQuery = countQuery.or(
                    `title.ilike.${pattern},description.ilike.${pattern},agenda.ilike.${pattern}`,
                );
                dataQuery = dataQuery.or(
                    `title.ilike.${pattern},description.ilike.${pattern},agenda.ilike.${pattern}`,
                );
            } catch {
                countQuery = countQuery.ilike("title", pattern);
                dataQuery = dataQuery.ilike("title", pattern);
            }
        }

        const countRes = await countQuery;
        const total = countRes.count || 0;

        const { data, error } = await dataQuery
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;

        const pagination: PaginationMeta = {
            total,
            limit,
            offset,
            page,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrevious: offset > 0,
        };

        return { data: (data || []) as EventRow[], pagination };
    }

    static async create(
        client: SupabaseClient,
        payload: Partial<EventInsert>,
    ): Promise<EventRow> {
        const insertData: Partial<EventInsert> = {
            title: trimOrNull(payload.title ?? null),
            description: trimOrNull(payload.description ?? null),
            event_type_id: payload.event_type_id ?? null,
            venue_id: payload.venue_id ?? null,
            schedule_type: trimOrNull(payload.schedule_type ?? null),
            theme: trimOrNull(payload.theme ?? null),
            agenda: trimOrNull(payload.agenda ?? null),
            price: trimOrNull(payload.price ?? null),
            contact_person: trimOrNull(payload.contact_person ?? null),
            phone_no: trimOrNull(payload.phone_no ?? null),
            email: trimOrNull(payload.email ?? null),
            capacity: trimOrNull(payload.capacity ?? null),
            status: trimOrNull(payload.status ?? null),
            event_image_id: payload.event_image_id ?? null,
            start: payload.start ?? null,
            end: payload.end ?? null,
            address: trimOrNull(payload.address ?? null),
            location_latitude: trimOrNull(payload.location_latitude ?? null),
            location_longitude: trimOrNull(payload.location_longitude ?? null),
        };

        const { data, error } = await client
            .from("events")
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return data as EventRow;
    }

    static async update(
        client: SupabaseClient,
        id: string,
        changes: Partial<EventUpdate>,
    ): Promise<EventRow> {
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        const set = <K extends keyof EventUpdate>(
            key: K,
            value: EventUpdate[K],
            transform?: (v: unknown) => unknown,
        ) => {
            if (value !== undefined) {
                updateData[key as string] = transform
                    ? transform(value)
                    : value;
            }
        };

        set(
            "title",
            changes.title,
            (v) =>
                typeof v === "string"
                    ? (v.trim().length > 0 ? v.trim() : null)
                    : v,
        );
        set(
            "description",
            changes.description,
            (v) =>
                typeof v === "string"
                    ? (v.trim().length > 0 ? v.trim() : null)
                    : v,
        );
        set("event_type_id", changes.event_type_id);
        set("venue_id", changes.venue_id);
        set("schedule_type", changes.schedule_type);
        set("theme", changes.theme);
        set("agenda", changes.agenda);
        set("price", changes.price);
        set("contact_person", changes.contact_person);
        set("phone_no", changes.phone_no);
        set("email", changes.email);
        set("capacity", changes.capacity);
        set("status", changes.status);
        set("event_image_id", changes.event_image_id);
        set("start", changes.start);
        set("end", changes.end);
        set(
            "address",
            changes.address,
            (v) =>
                typeof v === "string"
                    ? (v.trim().length > 0 ? v.trim() : null)
                    : v,
        );
        set(
            "location_latitude",
            changes.location_latitude,
            (v) =>
                typeof v === "string"
                    ? (v.trim().length > 0 ? v.trim() : null)
                    : v,
        );
        set(
            "location_longitude",
            changes.location_longitude,
            (v) =>
                typeof v === "string"
                    ? (v.trim().length > 0 ? v.trim() : null)
                    : v,
        );

        const { data, error } = await client
            .from("events")
            .update(updateData)
            .eq("id", id)
            .is("deleted_at", null)
            .select()
            .single();

        if (error) throw error;
        return data as EventRow;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{ deleted: boolean; id: string }> {
        const { data, error } = await client
            .from("events")
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

    static async getStorageObjectById(
        bucket: string,
        id: string,
    ): Promise<{ id?: string; name?: string; metadata?: unknown } | null> {
        try {
            const adminClient = SupabaseAdmin.initialize();
            const { data, error } = await adminClient
                .schema("storage")
                .from("objects")
                .select("id, name, metadata")
                .eq("id", id)
                .single();
            if (!error) {
                return data as {
                    id?: string;
                    name?: string;
                    metadata?: unknown;
                };
            }

            // fallback: list bucket to try to find file
            const { data: files } = await adminClient.storage.from(bucket).list(
                "",
                { limit: 1000, offset: 0 },
            );
            const found = (files || []).find((
                f: { id?: string; name: string },
            ) => f.id === id || f.name.includes(id));
            return found || null;
        } catch (_e) {
            return null;
        }
    }

    static buildPublicImageUrl(
        bucket: string,
        objectPath: string,
    ): string | null {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") as string | undefined;
        if (!supabaseUrl) return null;
        return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
    }

    static async uploadEventImage(
        client: SupabaseClient,
        imageData: File | Blob | string,
        fileName: string,
    ): Promise<{ path: string; url: string; id?: string } | null> {
        try {
            let fileData: File | Blob;
            if (typeof imageData === "string") {
                const base64Data = imageData.replace(
                    /^data:image\/[a-z]+;base64,/,
                    "",
                );
                const bytes = Uint8Array.from(
                    atob(base64Data),
                    (c) => c.charCodeAt(0),
                );
                fileData = new Blob([bytes], { type: "image/jpeg" });
            } else {
                fileData = imageData;
            }

            const uploadFileName = `${Date.now()}-${fileName}`;
            const { data: uploadData } = await client.storage
                .from("events-images")
                .upload(uploadFileName, fileData);
            if (!uploadData) return null;

            const url = this.buildPublicImageUrl(
                "events-images",
                uploadData.path,
            );
            const storageId = (uploadData as { id?: string }).id;
            return { path: uploadData.path, url: url || "", id: storageId };
        } catch (_e) {
            return null;
        }
    }

    static async getEventTypeName(
        client: SupabaseClient,
        eventTypeId: string | null,
    ): Promise<string | undefined> {
        if (!eventTypeId) return undefined;
        const { data, error } = await client
            .from("event_types")
            .select("name")
            .eq("id", eventTypeId)
            .single();
        if (error) return undefined;
        return (data as { name: string | null })?.name || undefined;
    }

    static async getVenueName(
        client: SupabaseClient,
        venueId: string | null,
    ): Promise<string | undefined> {
        if (!venueId) return undefined;
        const { data, error } = await client
            .from("venues")
            .select("name")
            .eq("id", venueId)
            .single();
        if (error) return undefined;
        return (data as { name: string | null })?.name || undefined;
    }

    static async getVenueLocation(
        client: SupabaseClient,
        venueId: string | null,
    ): Promise<
        {
            address: string | null;
            location_latitude: string | null;
            location_longitude: string | null;
        } | null
    > {
        if (!venueId) return null;
        const { data, error } = await client
            .from("venues")
            .select("address, location_latitude, location_longitude")
            .eq("id", venueId)
            .single();
        if (error) return null;
        return data as {
            address: string | null;
            location_latitude: string | null;
            location_longitude: string | null;
        };
    }

    static async resolveLocationData(
        client: SupabaseClient,
        payload: {
            venue_id?: string | null;
            address?: string | null;
            location_latitude?: string | null;
            location_longitude?: string | null;
        },
    ): Promise<
        {
            address: string | null;
            location_latitude: string | null;
            location_longitude: string | null;
        }
    > {
        // If venue_id is provided, get location from venue
        if (payload.venue_id) {
            const venueLocation = await this.getVenueLocation(
                client,
                payload.venue_id,
            );
            if (venueLocation) {
                return venueLocation;
            }
        }

        // Otherwise, use location data from payload
        return {
            address: trimOrNull(payload.address ?? null),
            location_latitude: trimOrNull(payload.location_latitude ?? null),
            location_longitude: trimOrNull(payload.location_longitude ?? null),
        };
    }

    static async enrichEventRow(
        client: SupabaseClient,
        row: EventRow,
        uploadedImagePath?: string,
    ): Promise<EnrichedEvent> {
        const enriched: EnrichedEvent = { ...row };

        // names
        const [eventTypeName, venueName] = await Promise.all([
            this.getEventTypeName(client, row.event_type_id),
            this.getVenueName(client, row.venue_id),
        ]);
        if (eventTypeName) enriched.event_type_name = eventTypeName;
        if (venueName) enriched.venue_name = venueName;

        // image
        if (uploadedImagePath) {
            const url = this.buildPublicImageUrl(
                "events-images",
                uploadedImagePath,
            );
            if (url) enriched.image_url = url;
            return enriched;
        }

        if (row.event_image_id) {
            const obj = await this.getStorageObjectById(
                "events-images",
                row.event_image_id,
            );
            if (obj?.name) {
                const url = this.buildPublicImageUrl("events-images", obj.name);
                if (url) enriched.image_url = url;
            } else {
                enriched.image_error = "Image file not found";
            }
        }

        return enriched;
    }

    static async listEnriched(
        client: SupabaseClient,
        query: EventsQuery,
    ): Promise<{ data: EnrichedEvent[]; pagination: PaginationMeta }> {
        const { data, pagination } = await this.list(client, query);
        const enriched = await Promise.all(
            data.map((row) => this.enrichEventRow(client, row)),
        );
        return { data: enriched, pagination };
    }

    static async createTicketsFromJson(
        client: SupabaseClient,
        eventId: string,
        ticketsJson: string,
        scheduleId?: string | null,
    ): Promise<string[]> {
        try {
            const ticketsData = JSON.parse(ticketsJson) as TicketJson[];
            if (!Array.isArray(ticketsData)) {
                return [];
            }

            const createdTicketIds: string[] = [];

            for (const ticket of ticketsData) {
                const createdTicket = await SupabaseEventTicketsService
                    .createEventTicket(
                        client,
                        eventId,
                        ticket.name,
                        ticket.type,
                        ticket.price,
                        ticket.max_per_order,
                        ticket.age_category || null,
                        ticket.is_active ?? true,
                    );
                createdTicketIds.push(createdTicket.id);

                // Create ticket eligibility record
                if (ticket.frequency) {
                    const eligibilityPayload: {
                        event_ticket_id: string;
                        schedule_id: string | null;
                        frequency:
                            ("one_time" | "daily" | "weekly" | "monthly")[];
                        weekly_days?: number[];
                        monthly_days?: number[];
                    } = {
                        event_ticket_id: createdTicket.id,
                        schedule_id: scheduleId || null,
                        frequency: [
                            ticket.frequency as
                                | "one_time"
                                | "daily"
                                | "weekly"
                                | "monthly",
                        ],
                    };

                    // Set days based on frequency
                    if (ticket.frequency === "weekly" && ticket.weekly_days) {
                        eligibilityPayload.weekly_days = ticket.weekly_days;
                    } else if (
                        ticket.frequency === "monthly" && ticket.monthly_days
                    ) {
                        eligibilityPayload.monthly_days = ticket.monthly_days;
                    }
                    // For daily frequency, no additional days needed

                    console.log("eligibilityPayload: ", eligibilityPayload);

                    const result = await SupabaseTicketEligibilityService
                        .create(
                            client,
                            eligibilityPayload,
                        );
                    console.log(
                        "result after ticket eligibility creation: ",
                        result,
                    );
                }
            }

            return createdTicketIds;
        } catch (error) {
            console.error("Error parsing tickets JSON:", error);
            return [];
        }
    }

    static async setupOneTimeEvent(
        client: SupabaseClient,
        payload: Partial<EventInsert>,
    ): Promise<EventRow> {
        // Create the event first
        const createdEvent = await this.create(client, payload);

        // Create tickets if provided
        const ticketsJson = (payload as Record<string, unknown>).tickets;
        let createdTicketIds: string[] = [];
        if (ticketsJson && typeof ticketsJson === "string") {
            createdTicketIds = await this.createTicketsFromJson(
                client,
                createdEvent.id,
                ticketsJson,
                null, // No schedule for one-time events
            );
        }

        // Parse ad_hoc_windows_json if provided
        const adHocWindowsJson =
            (payload as Record<string, unknown>).ad_hoc_windows_json;
        const schedulesJson =
            (payload as Record<string, unknown>).schedules_json;

        let scheduleTimeWindows: Array<{
            date: string;
            start_time: string;
            end_time: string;
            schedule_id: string | null;
        }> = [];

        // First try ad_hoc_windows_json
        if (
            adHocWindowsJson && typeof adHocWindowsJson === "string" &&
            adHocWindowsJson.trim() !== "[]"
        ) {
            try {
                const windowsData = JSON.parse(
                    adHocWindowsJson,
                ) as AdHocDateWindow[];
                if (Array.isArray(windowsData)) {
                    // Process each date and its windows
                    for (const dateWindow of windowsData) {
                        if (
                            dateWindow.date && Array.isArray(dateWindow.windows)
                        ) {
                            for (const window of dateWindow.windows) {
                                if (window.start_time && window.end_time) {
                                    scheduleTimeWindows.push({
                                        date: dateWindow.date,
                                        start_time: window.start_time,
                                        end_time: window.end_time,
                                        schedule_id: null,
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error parsing ad_hoc_windows_json:", error);
            }
        }

        // If ad_hoc_windows_json is empty/null, try schedules_json
        if (
            scheduleTimeWindows.length === 0 && schedulesJson &&
            typeof schedulesJson === "string"
        ) {
            try {
                const scheduleData = JSON.parse(schedulesJson) as ScheduleJson;
                if (
                    scheduleData.starts_on &&
                    Array.isArray(scheduleData.windows)
                ) {
                    // Use starts_on as the date for all windows
                    for (const window of scheduleData.windows) {
                        if (window.start_time && window.end_time) {
                            scheduleTimeWindows.push({
                                date: scheduleData.starts_on,
                                start_time: window.start_time,
                                end_time: window.end_time,
                                schedule_id: null,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error parsing schedules_json:", error);
            }
        }

        // Create all schedule time windows if we have any
        if (scheduleTimeWindows.length > 0) {
            const createdWindows = await SupabaseScheduleTimeWindowService
                .createMultiple(
                    client,
                    scheduleTimeWindows,
                );

            // Create occurrences for each window
            const occurrences = createdWindows.map((window) => ({
                event_id: createdEvent.id,
                schedule_id: null,
                window_id: window.id,
                status: "open" as const,
            }));

            const createdOccurrences = await SupabaseOccurenceService
                .createMultiple(
                    client,
                    occurrences,
                );

            // Return the event with the created windows, occurrences, and tickets IDs
            return {
                ...createdEvent,
                created_window_ids: createdWindows.map((w) => w.id),
                created_occurrence_ids: createdOccurrences.map((o) => o.id),
                created_ticket_ids: createdTicketIds,
            } as EventRow & {
                created_window_ids: string[];
                created_occurrence_ids: string[];
                created_ticket_ids: string[];
            };
        }

        return {
            ...createdEvent,
            created_ticket_ids: createdTicketIds,
        } as EventRow & { created_ticket_ids: string[] };
    }

    static async setupRecurringEvent(
        client: SupabaseClient,
        payload: Partial<EventInsert>,
    ): Promise<EventRow> {
        // Create the event first
        const createdEvent = await this.create(client, payload);

        // Parse schedules_json first to get schedule ID for tickets
        let scheduleId: string | null = null;
        const schedulesJson =
            (payload as Record<string, unknown>).schedules_json;
        if (schedulesJson && typeof schedulesJson === "string") {
            try {
                const scheduleData = JSON.parse(schedulesJson) as ScheduleJson;

                // Create event schedule based on frequency
                let weeklyDays: number[] | null = null;
                let monthlyDays: number[] | null = null;

                if (scheduleData.frequency === "weekly") {
                    // For weekly, store the first day or a bitwise representation
                    weeklyDays = scheduleData.weekly_days || null;
                } else if (scheduleData.frequency === "monthly") {
                    // For monthly, store the first day
                    monthlyDays = scheduleData.monthly_days || null;
                } else if (scheduleData.frequency === "daily") {
                    // For daily frequency, set monthly_days to 1
                    // Compute all day numbers (day of month only) from start date to end date (inclusive),
                    // in the order they appear as you traverse from start to end.
                    if (scheduleData.starts_on && scheduleData.ends_on) {
                        const start = new Date(scheduleData.starts_on);
                        const end = new Date(scheduleData.ends_on);
                        monthlyDays = [];
                        for (
                            let d = new Date(start);
                            d <= end;
                            d.setDate(d.getDate() + 1)
                        ) {
                            monthlyDays.push(d.getDate());
                        }
                    }
                }

                const eventSchedule = await SupabaseEventScheduleService.create(
                    client,
                    {
                        event_id: createdEvent.id,
                        frequency: scheduleData.frequency,
                        starts_on: scheduleData.starts_on,
                        ends_on: scheduleData.ends_on,
                        weekly_days: weeklyDays,
                        monthly_days: monthlyDays,
                    },
                );
                scheduleId = eventSchedule.id;
            } catch (error) {
                console.error("Error parsing schedules_json:", error);
            }
        }

        console.log("scheduleId: ", scheduleId);

        // Create tickets if provided
        const ticketsJson = (payload as Record<string, unknown>).tickets;
        let createdTicketIds: string[] = [];
        if (ticketsJson && typeof ticketsJson === "string") {
            createdTicketIds = await this.createTicketsFromJson(
                client,
                createdEvent.id,
                ticketsJson,
                scheduleId, // Pass schedule ID for recurring events
            );
        }

        // Continue with schedule processing if schedule was created
        if (scheduleId && schedulesJson && typeof schedulesJson === "string") {
            try {
                const scheduleData = JSON.parse(schedulesJson) as ScheduleJson;

                // Create schedule time windows one at a time for each window in the schedule
                if (
                    scheduleData.windows && Array.isArray(scheduleData.windows)
                ) {
                    const createdWindows: string[] = [];

                    // Create each window individually
                    for (const window of scheduleData.windows) {
                        const createdWindow =
                            await SupabaseScheduleTimeWindowService
                                .createWindow(
                                    client,
                                    window.start_time,
                                    window.end_time,
                                    scheduleId,
                                    null, // For recurring events, date is null
                                );
                        createdWindows.push(createdWindow.id);
                    }

                    // Create occurrences for each window one at a time
                    const createdOccurrences: string[] = [];

                    for (const windowId of createdWindows) {
                        const createdOccurrence = await SupabaseOccurenceService
                            .createOccurrence(
                                client,
                                createdEvent.id,
                                scheduleId,
                                windowId,
                                "open",
                            );
                        createdOccurrences.push(createdOccurrence.id);
                    }

                    // Return the event with the created schedule, windows, occurrences, and tickets IDs
                    return {
                        ...createdEvent,
                        created_schedule_id: scheduleId,
                        created_window_ids: createdWindows,
                        created_occurrence_ids: createdOccurrences,
                        created_ticket_ids: createdTicketIds,
                    } as EventRow & {
                        created_schedule_id: string;
                        created_window_ids: string[];
                        created_occurrence_ids: string[];
                        created_ticket_ids: string[];
                    };
                }

                // Return the event with the created schedule ID and tickets
                return {
                    ...createdEvent,
                    created_schedule_id: scheduleId,
                    created_ticket_ids: createdTicketIds,
                } as EventRow & {
                    created_schedule_id: string;
                    created_ticket_ids: string[];
                };
            } catch (error) {
                console.error("Error processing schedule windows:", error);
                // Continue with event creation even if window processing fails
            }
        }

        return {
            ...createdEvent,
            created_ticket_ids: createdTicketIds,
        } as EventRow & { created_ticket_ids: string[] };
    }

}
