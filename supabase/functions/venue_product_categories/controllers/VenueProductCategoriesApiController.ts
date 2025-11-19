import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseVenueProductCategoriesService } from "../../_shared/supabase/venue_product_categories/supabaseVenueProductCategories.ts";
import type {
    VenueProductCategoryInsert,
    VenueProductCategoryUpdate,
} from "../../_shared/supabase/venue_product_categories/venue_product_categories.types.ts";
import type { SupabaseClient } from "../../_shared/supabase/supabaseClient.ts";

// Type alias for compatibility
type SupabaseClientType = SupabaseClient;

// Request payload types
type VenueProductCategoryInsertPayload = VenueProductCategoryInsert;
type VenueProductCategoryUpdatePayload = VenueProductCategoryUpdate;

export class VenueProductCategoriesApiController extends Controller<
    VenueProductCategoryInsertPayload | VenueProductCategoryUpdatePayload
> {
    override async get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("VenueProductCategoriesAPI GET", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        if (id) {
            try {
                const row = await SupabaseVenueProductCategoriesService
                    .getByIdWithParent(
                        client as SupabaseClientType,
                        id,
                    );
                if (!row) {
                    return ResponseService.error(
                        "VenueProductCategory not found",
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
                return ResponseService.error(
                    "Error fetching venue_product_category",
                    "VENUE_PRODUCT_CATEGORY_GET_BY_ID_ERROR",
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

        // list with filters
        const url = new URL(_req!.url);
        const query = {
            limit: url.searchParams.get("limit")
                ? parseInt(url.searchParams.get("limit")!, 10)
                : 20,
            offset: url.searchParams.get("offset")
                ? parseInt(url.searchParams.get("offset")!, 10)
                : 0,
            page: url.searchParams.get("page")
                ? parseInt(url.searchParams.get("page")!, 10)
                : undefined,
            search: url.searchParams.get("search") || undefined,
        };

        try {
            const finalOffset = query.page
                ? (query.page - 1) * query.limit
                : query.offset;

            const { data, count } = await SupabaseVenueProductCategoriesService
                .listWithParent(
                    client as SupabaseClientType,
                    {
                        limit: query.limit,
                        offset: finalOffset,
                        search: query.search,
                    },
                );

            const totalPages = Math.ceil(count / query.limit);
            const currentPage = query.page ||
                Math.floor(finalOffset / query.limit) + 1;

            return ResponseService.success(
                data,
                200,
                {
                    pagination: {
                        page: currentPage,
                        limit: query.limit,
                        total: count,
                        totalPages,
                        hasNext: currentPage < totalPages,
                        hasPrev: currentPage > 1,
                    },
                },
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error fetching venue_product_categories",
                "VENUE_PRODUCT_CATEGORIES_GET_LIST_ERROR",
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
        data: VenueProductCategoryInsertPayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("VenueProductCategoriesAPI POST", { data });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            const created = await SupabaseVenueProductCategoriesService.create(
                client as SupabaseClientType,
                data,
            );
            return ResponseService.created(
                created,
                created.id,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error creating venue_product_category",
                "VENUE_PRODUCT_CATEGORY_CREATE_ERROR",
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

    override async put(
        id: string,
        data: VenueProductCategoryUpdatePayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("VenueProductCategoriesAPI PUT", { id, data });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            const updated = await SupabaseVenueProductCategoriesService.update(
                client as SupabaseClientType,
                id,
                data,
            );
            return ResponseService.success(
                updated,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error updating venue_product_category",
                "VENUE_PRODUCT_CATEGORY_UPDATE_ERROR",
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
        this.logAction("VenueProductCategoriesAPI DELETE", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            const result = await SupabaseVenueProductCategoriesService
                .softDelete(
                    client as SupabaseClientType,
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
                "Error deleting venue_product_category",
                "VENUE_PRODUCT_CATEGORY_DELETE_ERROR",
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
