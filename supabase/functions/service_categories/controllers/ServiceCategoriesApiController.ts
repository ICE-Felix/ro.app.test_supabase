import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseServiceCategoriesService } from "../../_shared/supabase/service_categories/supabaseServiceCategories.ts";

export class ServiceCategoriesApiController extends Controller {
    async get(id: string | undefined, _req: Request) {
        this.logAction("ServiceCategoriesAPI GET", { id });

        const { client } = await AuthenticationService.authenticate(_req);

        if (id) {
            try {
                const row = await SupabaseServiceCategoriesService.getById(client, id);
                if (!row) {
                    return ResponseService.error(
                        "Service category not found",
                        "NOT_FOUND",
                        404,
                        undefined,
                        ResponseType.API,
                    );
                }
                return ResponseService.success(row, 200, undefined, ResponseType.API);
            } catch (error) {
                return ResponseService.error(
                    "Error fetching service category",
                    "SERVICE_CATEGORIES_GET_BY_ID_ERROR",
                    400,
                    { error: error instanceof Error ? error.message : String(error) },
                    ResponseType.API,
                );
            }
        }

        // list with filters
        const url = new URL(_req.url);
        const query = {
            limit: url.searchParams.get("limit")
                ? parseInt(url.searchParams.get("limit") as string, 10)
                : 20,
            offset: url.searchParams.get("offset")
                ? parseInt(url.searchParams.get("offset") as string, 10)
                : 0,
            page: url.searchParams.get("page")
                ? parseInt(url.searchParams.get("page") as string, 10)
                : undefined,
            search: (url.searchParams.get("search") as string) || undefined,
            hierarchical: url.searchParams.get("hierarchical") === "true",
            parentsOnly: url.searchParams.get("parents_only") === "true",
            parentId: (url.searchParams.get("parent_id") as string) || undefined,
        };

        try {
            const finalOffset = query.page ? (query.page - 1) * query.limit : query.offset;

            const { data, count } = await SupabaseServiceCategoriesService.list(client, {
                limit: query.limit,
                offset: finalOffset,
                search: query.search,
                hierarchical: query.hierarchical,
                parentsOnly: query.parentsOnly,
                parentId: query.parentId,
            });

            const totalPages = Math.ceil((count ?? 0) / query.limit);
            const currentPage = query.page ?? Math.floor(finalOffset / query.limit) + 1;

            return ResponseService.success(
                data,
                200,
                {
                    pagination: {
                        page: currentPage,
                        limit: query.limit,
                        total: count ?? 0,
                        totalPages,
                        hasNext: currentPage < totalPages,
                        hasPrev: currentPage > 1,
                    },
                },
                ResponseType.API,
            );
        } catch (error) {
            return ResponseService.error(
                "Error fetching service categories",
                "SERVICE_CATEGORIES_GET_LIST_ERROR",
                400,
                { error: error instanceof Error ? error.message : String(error) },
                ResponseType.API,
            );
        }
    }

    async post(data: Record<string, unknown>, _req: Request) {
        this.logAction("ServiceCategoriesAPI POST", { data });

        const { client } = await AuthenticationService.authenticate(_req);

        try {
            const created = await SupabaseServiceCategoriesService.create(client, data);
            return ResponseService.created(created, (created as { id: string }).id, ResponseType.API);
        } catch (error) {
            return ResponseService.error(
                "Error creating service category",
                "SERVICE_CATEGORIES_CREATE_ERROR",
                400,
                { error: error instanceof Error ? error.message : String(error) },
                ResponseType.API,
            );
        }
    }

    async put(id: string, data: Record<string, unknown>, _req: Request) {
        this.logAction("ServiceCategoriesAPI PUT", { id, data });

        const { client } = await AuthenticationService.authenticate(_req);

        try {
            const updated = await SupabaseServiceCategoriesService.update(client, id, data);
            return ResponseService.success(updated, 200, undefined, ResponseType.API);
        } catch (error) {
            return ResponseService.error(
                "Error updating service category",
                "SERVICE_CATEGORIES_UPDATE_ERROR",
                400,
                { error: error instanceof Error ? error.message : String(error) },
                ResponseType.API,
            );
        }
    }

    async delete(id: string, _req: Request) {
        this.logAction("ServiceCategoriesAPI DELETE", { id });

        const { client } = await AuthenticationService.authenticate(_req);

        try {
            const result = await SupabaseServiceCategoriesService.softDelete(client, id);
            return ResponseService.success(result, 200, undefined, ResponseType.API);
        } catch (error) {
            return ResponseService.error(
                "Error deleting service category",
                "SERVICE_CATEGORIES_DELETE_ERROR",
                400,
                { error: error instanceof Error ? error.message : String(error) },
                ResponseType.API,
            );
        }
    }
}
