import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import {
    SupabaseVenueGeneralAttributesService,
} from "../../_shared/supabase/venue_general_attributes/supabaseVenueGeneralAttributes.ts";

export class VenueAttributesFiltersApiController extends Controller<never> {
    override async get(_id?: string, _req?: Request): Promise<Response> {
        this.logAction("VenueAttributesFiltersAPI GET");
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            const filterList = await SupabaseVenueGeneralAttributesService
                .getFilterList(client);
            return ResponseService.success(
                filterList,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error fetching venue attributes filter list",
                "VENUE_ATTRIBUTES_FILTERS_ERROR",
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

    // Not implemented for this specialized function
    override async post(_data: never, _req?: Request): Promise<Response> {
        return Promise.resolve(ResponseService.error(
            "Method not allowed",
            "METHOD_NOT_ALLOWED",
            405,
            {
                message:
                    "POST method is not supported for venue attributes filters",
            },
            ResponseType.API,
        ));
    }

    override async put(
        _id: string,
        _data: never,
        _req?: Request,
    ): Promise<Response> {
        return Promise.resolve(ResponseService.error(
            "Method not allowed",
            "METHOD_NOT_ALLOWED",
            405,
            {
                message:
                    "PUT method is not supported for venue attributes filters",
            },
            ResponseType.API,
        ));
    }

    override async delete(_id: string, _req?: Request): Promise<Response> {
        return Promise.resolve(ResponseService.error(
            "Method not allowed",
            "METHOD_NOT_ALLOWED",
            405,
            {
                message:
                    "DELETE method is not supported for venue attributes filters",
            },
            ResponseType.API,
        ));
    }
}
