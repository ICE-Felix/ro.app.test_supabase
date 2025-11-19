import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseEventTypesService } from "../../_shared/supabase/event_types/supabaseEventTypes.ts";
import type { Tables as _Tables } from "../../_shared/supabase/event_types/event_types.types.ts";

type EventTypeRow = _Tables<"event_types">;

// Define resource data interface
interface EventTypesResourceData {
  name: string;
  is_active: boolean | string | number;
  [key: string]: unknown;
}

export class EventTypesApiController
  extends Controller<EventTypesResourceData> {
  // Validation method
  private validateEventTypesData(
    data: EventTypesResourceData,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (
      !data.name || typeof data.name !== "string" ||
      data.name.trim() === ""
    ) {
      errors.push("name is required and must be a non-empty string");
    }

    const v = data.is_active;
    if (v !== undefined) {
      const isBoolLike = typeof v === "boolean" || typeof v === "string" ||
        typeof v === "number";
      if (!isBoolLike) {
        errors.push(
          "is_active must be a boolean, string ('1'/'0'/'true'/'false'), or number (1/0)",
        );
      } else if (typeof v === "string") {
        const s = v.toLowerCase();
        if (s !== "1" && s !== "0" && s !== "true" && s !== "false") {
          errors.push(
            "is_active string value must be '1', '0', 'true', or 'false'",
          );
        }
      } else if (typeof v === "number" && v !== 1 && v !== 0) {
        errors.push("is_active number value must be 1 or 0");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validation method for updates (only validates present fields)
  private validateEventTypesDataForUpdate(
    data: Partial<EventTypesResourceData>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (
        !data.name || typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.push("name must be a non-empty string");
      }
    }

    if (data.is_active !== undefined) {
      const v = data.is_active;
      const isBoolLike = typeof v === "boolean" || typeof v === "string" ||
        typeof v === "number";
      if (!isBoolLike) {
        errors.push(
          "is_active must be a boolean, string ('1'/'0'/'true'/'false'), or number (1/0)",
        );
      } else if (typeof v === "string") {
        const s = v.toLowerCase();
        if (s !== "1" && s !== "0" && s !== "true" && s !== "false") {
          errors.push(
            "is_active string value must be '1', '0', 'true', or 'false'",
          );
        }
      } else if (typeof v === "number" && v !== 1 && v !== 0) {
        errors.push("is_active number value must be 1 or 0");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private convertBooleanValue(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value === "1" || value.toLowerCase() === "true";
    }
    if (typeof value === "number") return value === 1;
    return false;
  }

  // Core API methods
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("EventTypesAPI GET", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    if (id) {
      try {
        const row = await SupabaseEventTypesService.getById(client, id);
        return ResponseService.success(row, 200, undefined, ResponseType.API);
      } catch (error: unknown) {
        return ResponseService.error(
          "Error fetching event type",
          "EVENT_TYPES_GET_BY_ID_ERROR",
          400,
          { error: error instanceof Error ? error.message : String(error) },
          ResponseType.API,
        );
      }
    }

    try {
      const rows = await SupabaseEventTypesService.list(client);
      return ResponseService.success(rows, 200, undefined, ResponseType.API);
    } catch (error: unknown) {
      return ResponseService.error(
        "Error fetching event types",
        "EVENT_TYPES_GET_ALL_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  override async post(
    data: EventTypesResourceData,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("EventTypesAPI POST", { data });

    const validation = this.validateEventTypesData(data);
    if (!validation.isValid) {
      return Promise.resolve(ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API,
      ));
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    try {
      const created = await SupabaseEventTypesService.create(client, {
        name: data.name.trim(),
        is_active: this.convertBooleanValue(data.is_active),
      });
      return ResponseService.created(created, created.id, ResponseType.API);
    } catch (error: unknown) {
      return ResponseService.error(
        "Error creating event type",
        "EVENT_TYPES_CREATE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  override async put(
    id: string,
    data: Partial<EventTypesResourceData>,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("EventTypesAPI PUT", { id, data });

    const validation = this.validateEventTypesDataForUpdate(data);
    if (!validation.isValid) {
      return Promise.resolve(ResponseService.error(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        { errors: validation.errors },
        ResponseType.API,
      ));
    }

    const { client } = await AuthenticationService.authenticate(_req!);

    try {
      const updated = await SupabaseEventTypesService.update(client, id, {
        name: data.name !== undefined ? data.name.trim() : undefined,
        is_active: data.is_active !== undefined
          ? this.convertBooleanValue(data.is_active)
          : undefined,
      });
      return ResponseService.success(updated, 200, undefined, ResponseType.API);
    } catch (error: unknown) {
      return ResponseService.error(
        "Error updating event type",
        "EVENT_TYPES_UPDATE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("EventTypesAPI DELETE", { id });

    const { client } = await AuthenticationService.authenticate(_req!);

    try {
      const result = await SupabaseEventTypesService.softDelete(client, id);
      return ResponseService.success(result, 200, undefined, ResponseType.API);
    } catch (error: unknown) {
      return ResponseService.error(
        "Error deleting event type",
        "EVENT_TYPES_DELETE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }
}
