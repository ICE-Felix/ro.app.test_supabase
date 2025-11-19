import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import {
  SupabaseVenueGeneralAttributesService,
} from "../../_shared/supabase/venue_general_attributes/supabaseVenueGeneralAttributes.ts";
import type {
  TablesInsert as _TablesInsert,
  TablesUpdate as _TablesUpdate,
} from "../../_shared/supabase/venue_general_attributes/venue_general_attributes.types.ts";
import {
  applyOverrides,
  buildPayloadBase,
} from "../../_shared/utils/payload.ts";

type VenueGeneralAttributeInsertPayload = _TablesInsert<
  "venue_general_attributes"
>;
type VenueGeneralAttributeUpdatePayload = _TablesUpdate<
  "venue_general_attributes"
>;

export class VenueGeneralAttributesApiController extends Controller<
  VenueGeneralAttributeInsertPayload | VenueGeneralAttributeUpdatePayload
> {
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("VenueGeneralAttributesAPI GET", { id });
    const { client } = await AuthenticationService.authenticate(_req!);

    if (id) {
      try {
        const row = await SupabaseVenueGeneralAttributesService.getById(
          client,
          id,
        );
        if (!row) {
          return ResponseService.error(
            "Venue general attribute not found",
            "NOT_FOUND",
            404,
            undefined,
            ResponseType.API,
          );
        }
        return ResponseService.success(
          row,
          200,
          undefined,
          ResponseType.API,
        );
      } catch (error: unknown) {
        console.error("GetById error details:", error);
        return ResponseService.error(
          "Error fetching venue general attribute",
          "VENUE_GENERAL_ATTRIBUTE_GET_BY_ID_ERROR",
          400,
          {
            error: error instanceof Error ? error.message : String(error),
            errorDetails: error,
          },
          ResponseType.API,
        );
      }
    }

    try {
      const data = await SupabaseVenueGeneralAttributesService.list(client);
      return ResponseService.success(
        data,
        200,
        undefined,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error fetching venue general attributes",
        "VENUE_GENERAL_ATTRIBUTE_GET_LIST_ERROR",
        400,
        {
          error: error instanceof Error ? error.message : String(error),
        },
        ResponseType.API,
      );
    }
  }

  override async post(
    data: VenueGeneralAttributeInsertPayload,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("VenueGeneralAttributesAPI POST", { data });
    const { client } = await AuthenticationService.authenticate(_req!);

    const base = buildPayloadBase(data as Record<string, unknown>);
    const payload = applyOverrides(
      base,
      data as Record<string, unknown>,
      {},
    ) as VenueGeneralAttributeInsertPayload;

    try {
      const created = await SupabaseVenueGeneralAttributesService.create(
        client,
        payload,
      );
      return ResponseService.created(
        created,
        (created as { id: string }).id,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error creating venue general attribute",
        "VENUE_GENERAL_ATTRIBUTE_CREATE_ERROR",
        400,
        {
          error: error instanceof Error ? error.message : error,
        },
        ResponseType.API,
      );
    }
  }

  override async put(
    id: string,
    data: VenueGeneralAttributeUpdatePayload,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("VenueGeneralAttributesAPI PUT", { id, data });
    const { client } = await AuthenticationService.authenticate(_req!);

    const base = buildPayloadBase(data as Record<string, unknown>);
    const changes = applyOverrides(
      base,
      data as Record<string, unknown>,
      {},
    ) as VenueGeneralAttributeUpdatePayload;

    try {
      const updated = await SupabaseVenueGeneralAttributesService.update(
        client,
        id,
        changes,
      );
      return ResponseService.success(
        updated,
        200,
        undefined,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error updating venue general attribute",
        "VENUE_GENERAL_ATTRIBUTE_UPDATE_ERROR",
        400,
        {
          error: error instanceof Error ? error.message : String(error),
        },
        ResponseType.API,
      );
    }
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("VenueGeneralAttributesAPI DELETE", { id });
    const { client } = await AuthenticationService.authenticate(_req!);
    try {
      const result = await SupabaseVenueGeneralAttributesService.softDelete(
        client,
        id,
      );
      return ResponseService.success(
        result,
        200,
        undefined,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error deleting venue general attribute",
        "VENUE_GENERAL_ATTRIBUTE_DELETE_ERROR",
        400,
        {
          error: error instanceof Error ? error.message : String(error),
        },
        ResponseType.API,
      );
    }
  }
}
