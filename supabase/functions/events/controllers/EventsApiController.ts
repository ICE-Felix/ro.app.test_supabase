import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseEventsService } from "../../_shared/supabase/events/supabaseEvents.ts";
import {
  validateEventsInsert,
  validateEventsUpdate,
} from "../../_shared/supabase/events/validation.ts";
import type { Tables as _Tables } from "../../_shared/supabase/events/events.types.ts";

type EventRow = _Tables<"events">;

type EventsData = Partial<EventRow> & {
  image_file?: File | Blob;
  image_base64?: string;
  address?: string;
  location_latitude?: string;
  location_longitude?: string;
};

type EnrichedEvent = EventRow & {
  event_type_name?: string;
  venue_name?: string;
  image_url?: string;
  image_error?: string;
};

export class EventsApiController extends Controller<EventsData> {
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("EventsAPI GET", { id });
    const { client } = await AuthenticationService.authenticate(_req!);

    if (id) {
      try {
        const row = await SupabaseEventsService.getById(client, id);
        if (!row) {
          return ResponseService.error(
            "Event not found",
            "NOT_FOUND",
            404,
            undefined,
            ResponseType.API,
          );
        }
        const enriched = await SupabaseEventsService.enrichEventRow(
          client,
          row,
        );
        return ResponseService.success(
          enriched,
          200,
          undefined,
          ResponseType.API,
        );
      } catch (error: unknown) {
        return ResponseService.error(
          "Error fetching event",
          "GET_BY_ID_ERROR",
          400,
          { error: error instanceof Error ? error.message : String(error) },
          ResponseType.API,
        );
      }
    }

    // list with filters
    const url = new URL(_req!.url);
    const query = {
      event_type_id: url.searchParams.get("event_type_id") || undefined,
      venue_id: url.searchParams.get("venue_id") || undefined,
      search: url.searchParams.get("search") || undefined,
      start: url.searchParams.get("start") || undefined,
      end: url.searchParams.get("end") || undefined,
      limit: url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : undefined,
      offset: url.searchParams.get("offset")
        ? parseInt(url.searchParams.get("offset")!, 10)
        : undefined,
      page: url.searchParams.get("page")
        ? parseInt(url.searchParams.get("page")!, 10)
        : undefined,
    };

    try {
      const { data, pagination } = await SupabaseEventsService.listEnriched(
        client,
        query,
      );
      return ResponseService.success(
        data,
        200,
        {
          pagination,
          filters: {
            event_type_id: query.event_type_id,
            venue_id: query.venue_id,
            search: query.search,
            start: query.start,
            end: query.end,
          },
        },
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error fetching events",
        "GET_LIST_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  override async post(data: EventsData, _req?: Request): Promise<Response> {
    this.logAction("EventsAPI POST", { data });

    const validation = validateEventsInsert(
      data as unknown as Record<string, unknown>,
    );
    if (!validation.isValid) {
      return Promise.resolve(
        ResponseService.error("Validation failed", "VALIDATION_ERROR", 400, {
          errors: validation.errors,
        }, ResponseType.API),
      );
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    // Resolve location data (from venue or request body)
    const locationData = await SupabaseEventsService.resolveLocationData(
      client,
      data,
    );

    // image upload
    let imagePath: string | null = null;
    let imageId: string | null = null;
    if (data.image_file || data.image_base64) {
      const imageData = data.image_file || data.image_base64!;
      const fileName = data.image_file instanceof File
        ? data.image_file.name
        : "uploaded-image.jpg";
      const uploadResult = await SupabaseEventsService.uploadEventImage(
        client,
        imageData,
        fileName,
      );
      if (uploadResult) {
        imagePath = uploadResult.path;
        imageId = uploadResult.id || null;
      }
    }

    try {
      // Determine if this is a one-time or recurring event based on schedule_type
      const isOneTimeEvent = !data.schedule_type || data.schedule_type === null;

      const created = isOneTimeEvent
        ? await SupabaseEventsService.setupOneTimeEvent(client, {
          ...data,
          event_image_id: imageId || data.event_image_id,
          ...locationData,
        })
        : await SupabaseEventsService.setupRecurringEvent(client, {
          ...data,
          event_image_id: imageId || data.event_image_id,
          ...locationData,
        });

      const enriched = await SupabaseEventsService.enrichEventRow(
        client,
        created,
        imagePath || undefined,
      );
      return ResponseService.created(
        enriched as EnrichedEvent,
        created.id,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error creating event",
        "CREATE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  override async put(
    id: string,
    data: Partial<EventsData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("EventsAPI PUT", { id, data });

    const validation = validateEventsUpdate(
      data as unknown as Record<string, unknown>,
    );
    if (!validation.isValid) {
      return Promise.resolve(
        ResponseService.error("Validation failed", "VALIDATION_ERROR", 400, {
          errors: validation.errors,
        }, ResponseType.API),
      );
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    // Resolve location data (from venue or request body) only if location fields are being updated
    let locationData = {};
    if (
      data.venue_id !== undefined || data.address !== undefined ||
      data.location_latitude !== undefined ||
      data.location_longitude !== undefined
    ) {
      locationData = await SupabaseEventsService.resolveLocationData(
        client,
        data,
      );
    }

    let imagePath: string | null = null;
    let imageId: string | null = null;
    if (data.image_file || data.image_base64) {
      const imageData = data.image_file || data.image_base64!;
      const fileName = data.image_file instanceof File
        ? data.image_file.name
        : "uploaded-image.jpg";
      const uploadResult = await SupabaseEventsService.uploadEventImage(
        client,
        imageData,
        fileName,
      );
      if (uploadResult) {
        imagePath = uploadResult.path;
        imageId = uploadResult.id || null;
      }
    }

    try {
      const updated = await SupabaseEventsService.update(client, id, {
        ...data,
        event_image_id: imageId || data.event_image_id,
        ...locationData,
      });
      const enriched = await SupabaseEventsService.enrichEventRow(
        client,
        updated,
        imagePath || undefined,
      );
      return ResponseService.success(
        enriched as EnrichedEvent,
        200,
        undefined,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error updating event",
        "UPDATE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("EventsAPI DELETE", { id });
    const { client } = await AuthenticationService.authenticate(_req!);
    try {
      const result = await SupabaseEventsService.softDelete(client, id);
      return ResponseService.success(result, 200, undefined, ResponseType.API);
    } catch (error: unknown) {
      return ResponseService.error(
        "Error deleting event",
        "DELETE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }
}
