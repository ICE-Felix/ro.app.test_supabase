import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import {
    SupabaseTicketTypeService,
} from "../../_shared/supabase/ticket_type/supabaseTicketType.ts";
import type {
    TablesInsert as _TablesInsert,
    TablesUpdate as _TablesUpdate,
} from "../../_shared/supabase/ticket_type/ticket_type.types.ts";
import {
    applyOverrides,
    buildPayloadBase,
} from "../../_shared/utils/payload.ts";

type TicketTypeInsertPayload = _TablesInsert<"ticket_type">;
type TicketTypeUpdatePayload = _TablesUpdate<"ticket_type">;

export class TicketTypeApiController
    extends Controller<TicketTypeInsertPayload | TicketTypeUpdatePayload> {
    override async get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("TicketTypeAPI GET", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        if (id) {
            try {
                const row = await SupabaseTicketTypeService.getById(
                    client,
                    id,
                );
                if (!row) {
                    return ResponseService.error(
                        "Ticket type not found",
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
                    "Error fetching ticket type",
                    "TICKET_TYPE_GET_BY_ID_ERROR",
                    400,
                    {
                        error: error instanceof Error
                            ? error.message
                            : String(error),
                        errorDetails: error,
                    },
                    ResponseType.API,
                );
            }
        }

        try {
            const data = await SupabaseTicketTypeService.list(client);
            return ResponseService.success(
                data,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error fetching ticket types",
                "TICKET_TYPE_GET_LIST_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }

    override async post(
        data: TicketTypeInsertPayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("TicketTypeAPI POST", { data });
        const { client } = await AuthenticationService.authenticate(_req!);

        const base = buildPayloadBase(data as Record<string, unknown>);
        const payload = applyOverrides(
            base,
            data as Record<string, unknown>,
            {},
        ) as _TablesInsert<"ticket_type">;

        try {
            const created = await SupabaseTicketTypeService.create(
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
                "Error creating ticket type",
                "TICKET_TYPE_CREATE_ERROR",
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
        data: TicketTypeUpdatePayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("TicketTypeAPI PUT", { id, data });
        const { client } = await AuthenticationService.authenticate(_req!);

        const base = buildPayloadBase(data as Record<string, unknown>);
        const changes = applyOverrides(
            base,
            data as Record<string, unknown>,
            {},
        ) as _TablesUpdate<"ticket_type">;

        try {
            const updated = await SupabaseTicketTypeService.update(
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
                "Error updating ticket type",
                "TICKET_TYPE_UPDATE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }

    override async delete(id: string, _req?: Request): Promise<Response> {
        this.logAction("TicketTypeAPI DELETE", { id });
        const { client } = await AuthenticationService.authenticate(_req!);
        try {
            const result = await SupabaseTicketTypeService.softDelete(
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
                "Error deleting ticket type",
                "TICKET_TYPE_DELETE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }
}
