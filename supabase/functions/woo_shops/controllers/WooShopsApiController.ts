import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooShops } from "../../_shared/woo_commerce/shops/wooShops.ts";

interface ParsedQueryParams {
    page?: number;
    per_page?: number;
    search?: string;
}

export class WooShopsApiController extends Controller<Record<string, unknown>> {
    private parseQueryParams(req?: Request): ParsedQueryParams {
        const params: ParsedQueryParams = {};
        if (!req) return params;
        const url = new URL(req.url);
        const pg = url.searchParams.get("page");
        const pp = url.searchParams.get("per_page");
        const search = url.searchParams.get("search");
        if (pg) params.page = parseInt(pg, 10);
        if (pp) params.per_page = parseInt(pp, 10);
        if (search) params.search = search;
        return params;
    }

    private ok(data: unknown, message: string): Response {
        return ResponseService.success(
            data,
            200,
            { message },
            ResponseType.API,
        );
    }

    private fail(
        error: unknown,
        message: string,
        code: string,
        status = 500,
    ): Response {
        return ResponseService.error(
            error instanceof Error ? error.message : message,
            code,
            status,
            { error: error instanceof Error ? error.message : String(error) },
            ResponseType.API,
        );
    }

    override get(id?: string, req?: Request): Promise<Response> {
        this.logAction("WooShopsAPI GET", { id });
        try {
            if (id) {
                return WooShops.getById(id).then((shop) =>
                    this.ok(shop, "Shop retrieved successfully")
                ).catch((error) =>
                    this.fail(
                        error,
                        "Failed to retrieve shop",
                        "WOO_SHOPS_GET_BY_ID_ERROR",
                    )
                );
            }
            const q = this.parseQueryParams(req);
            if (q.search && q.search.trim().length > 0) {
                return WooShops.search(q.search, {
                    page: q.page,
                    per_page: q.per_page,
                }).then((shops) =>
                    this.ok(shops, "Shops retrieved successfully")
                ).catch((error) =>
                    this.fail(
                        error,
                        "Failed to search shops",
                        "WOO_SHOPS_SEARCH_ERROR",
                    )
                );
            }
            return WooShops.getAll({ page: q.page, per_page: q.per_page }).then(
                (shops) => this.ok(shops, "Shops retrieved successfully"),
            ).catch((error) =>
                this.fail(
                    error,
                    "Failed to retrieve shops",
                    "WOO_SHOPS_GET_ALL_ERROR",
                )
            );
        } catch (error) {
            return Promise.resolve(
                this.fail(
                    error,
                    "Failed to retrieve shops",
                    "WOO_SHOPS_GET_ERROR",
                ),
            );
        }
    }

    override post(
        data: Record<string, unknown>,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("WooShopsAPI POST", {});
        try {
            return WooShops.create(data).then((created) =>
                this.ok(created, "Shop created successfully")
            ).catch((error) =>
                this.fail(
                    error,
                    "Failed to create shop",
                    "WOO_SHOPS_CREATE_ERROR",
                )
            );
        } catch (error) {
            return Promise.resolve(
                this.fail(
                    error,
                    "Failed to create shop",
                    "WOO_SHOPS_CREATE_ERROR",
                ),
            );
        }
    }

    override put(
        id: string,
        data: Record<string, unknown>,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("WooShopsAPI PUT", { id });
        try {
            if (!id || isNaN(Number(id))) {
                return Promise.resolve(ResponseService.error(
                    "Valid shop ID is required",
                    "INVALID_SHOP_ID",
                    400,
                    {},
                    ResponseType.API,
                ));
            }
            return WooShops.update(id, data).then((updated) =>
                this.ok(updated, "Shop updated successfully")
            ).catch((error) =>
                this.fail(
                    error,
                    "Failed to update shop",
                    "WOO_SHOPS_UPDATE_ERROR",
                )
            );
        } catch (error) {
            return Promise.resolve(
                this.fail(
                    error,
                    "Failed to update shop",
                    "WOO_SHOPS_UPDATE_ERROR",
                ),
            );
        }
    }

    override delete(id: string, req?: Request): Promise<Response> {
        this.logAction("WooShopsAPI DELETE", { id });
        try {
            if (!id || isNaN(Number(id))) {
                return Promise.resolve(ResponseService.error(
                    "Valid shop ID is required",
                    "INVALID_SHOP_ID",
                    400,
                    {},
                    ResponseType.API,
                ));
            }
            const url = req ? new URL(req.url) : null;
            const force = url?.searchParams.get("force");
            const forceBool = force === "true"
                ? true
                : force === "false"
                ? false
                : undefined;
            return WooShops.delete(id, forceBool).then((deleted) =>
                this.ok(deleted, "Shop deleted successfully")
            ).catch((error) =>
                this.fail(
                    error,
                    "Failed to delete shop",
                    "WOO_SHOPS_DELETE_ERROR",
                )
            );
        } catch (error) {
            return Promise.resolve(
                this.fail(
                    error,
                    "Failed to delete shop",
                    "WOO_SHOPS_DELETE_ERROR",
                ),
            );
        }
    }
}
