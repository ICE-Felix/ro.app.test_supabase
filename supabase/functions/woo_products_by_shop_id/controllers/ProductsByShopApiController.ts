import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProductsByShop } from "../../_shared/woo_commerce/products/wooProductsByShop.ts";
import type { WooProductQuery } from "../../_shared/woo_commerce/products/wooProducts.ts";

interface ParsedQueryParams {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    stock_status?: string;
    category?: string;
    tag?: string;
    type?: string;
    sku?: string;
}

export class ProductsByShopApiController
    extends Controller<Record<string, unknown>> {
    private parseQueryParams(req?: Request): Partial<WooProductQuery> {
        const out: Partial<WooProductQuery> = {};
        if (!req) return out;
        const url = new URL(req.url);
        const pg = url.searchParams.get("page");
        const pp = url.searchParams.get("per_page");
        if (pg) out.page = parseInt(pg, 10);
        if (pp) out.per_page = parseInt(pp, 10);
        const map: Array<[keyof WooProductQuery, string]> = [
            ["search", "search"],
            ["status", "status"],
            ["stock_status", "stock_status"],
            ["category", "category"],
            ["tag", "tag"],
            ["type", "type"],
            ["sku", "sku"],
        ];
        for (const [key, param] of map) {
            const v = url.searchParams.get(param);
            if (v) (out as Record<string, unknown>)[key as string] = v;
        }
        return out;
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

    override get(shopId?: string, req?: Request): Promise<Response> {
        this.logAction("ProductsByShopAPI GET", { shopId });
        try {
            if (!shopId) {
                return Promise.resolve(ResponseService.error(
                    "Shop ID is required",
                    "MISSING_SHOP_ID",
                    400,
                    {},
                    ResponseType.API,
                ));
            }
            const query = this.parseQueryParams(req);
            return WooProductsByShop.getByShopId(
                shopId,
                query as WooProductQuery,
            ).then((products) =>
                this.ok(products, "Products retrieved successfully")
            ).catch((error) =>
                this.fail(
                    error,
                    "Failed to retrieve products",
                    "PRODUCTS_BY_SHOP_GET_ERROR",
                )
            );
        } catch (error) {
            return Promise.resolve(
                this.fail(
                    error,
                    "Failed to retrieve products",
                    "PRODUCTS_BY_SHOP_GET_ERROR",
                ),
            );
        }
    }

    override post(
        _data: Record<string, unknown>,
        _req?: Request,
    ): Promise<Response> {
        return Promise.resolve(ResponseService.error(
            "Not implemented",
            "NOT_IMPLEMENTED",
            501,
            {},
            ResponseType.API,
        ));
    }

    override put(
        _id: string,
        _data: Record<string, unknown>,
        _req?: Request,
    ): Promise<Response> {
        return Promise.resolve(ResponseService.error(
            "Not implemented",
            "NOT_IMPLEMENTED",
            501,
            {},
            ResponseType.API,
        ));
    }

    override delete(_id: string, _req?: Request): Promise<Response> {
        return Promise.resolve(ResponseService.error(
            "Not implemented",
            "NOT_IMPLEMENTED",
            501,
            {},
            ResponseType.API,
        ));
    }
}
