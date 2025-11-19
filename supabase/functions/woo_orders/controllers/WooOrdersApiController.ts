import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooOrders } from "../../_shared/woo_commerce/orders/wooOrders.ts";
import type {
    WooOrder as _WooOrder,
    WooOrderCreate,
    WooOrderQuery,
    WooOrderUpdate,
} from "../../_shared/woo_commerce/orders/wooOrders.ts";

type WooOrderData = WooOrderCreate & WooOrderUpdate;

interface ParsedQueryParams {
    page?: number;
    per_page?: number;
    status?: string;
    customer?: number;
    product?: number;
    search?: string;
    after?: string;
    before?: string;
}

export class WooOrdersApiController extends Controller<WooOrderData> {
    private parseQueryParams(req?: Request): ParsedQueryParams {
        const params: ParsedQueryParams = {};
        if (!req) return params;
        const url = new URL(req.url);
        const pg = url.searchParams.get("page");
        const pp = url.searchParams.get("per_page");
        const customer = url.searchParams.get("customer");
        const product = url.searchParams.get("product");
        const status = url.searchParams.get("status");
        if (pg) params.page = parseInt(pg, 10);
        if (pp) params.per_page = parseInt(pp, 10);
        if (customer) params.customer = parseInt(customer, 10);
        if (product) params.product = parseInt(product, 10);
        if (status) params.status = status;
        const search = url.searchParams.get("search");
        if (search) params.search = search;
        const after = url.searchParams.get("after");
        const before = url.searchParams.get("before");
        if (after) params.after = after;
        if (before) params.before = before;
        return params;
    }

    private buildWooQuery(params: ParsedQueryParams): WooOrderQuery {
        const query: WooOrderQuery = {};
        if (params.page) query.page = params.page;
        if (params.per_page) query.per_page = params.per_page;
        if (params.status) query.status = params.status;
        if (params.customer !== undefined) query.customer = params.customer;
        if (params.product !== undefined) query.product = params.product;
        if (params.search) query.search = params.search;
        if (params.after) query.after = params.after;
        if (params.before) query.before = params.before;
        return query;
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

    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("WooOrdersAPI GET", { id });
        try {
            if (id) {
                const order = await WooOrders.getOrderById(parseInt(id));
                return this.ok(order, "Order retrieved successfully");
            }
            const query = this.buildWooQuery(this.parseQueryParams(req));
            const orders = await WooOrders.getAllOrders(query);
            return this.ok(orders, "Orders retrieved successfully");
        } catch (error) {
            console.error("WooOrders GET error:", error);
            return this.fail(
                error,
                "Failed to retrieve orders",
                "WOO_ORDERS_GET_ERROR",
            );
        }
    }

    override async post(data: WooOrderData, _req?: Request): Promise<Response> {
        this.logAction("WooOrdersAPI POST", {});
        try {
            const created = await WooOrders.createOrder(data as WooOrderCreate);
            return this.ok(created, "Order created successfully");
        } catch (error) {
            console.error("WooOrders POST error:", error);
            return this.fail(
                error,
                "Failed to create order",
                "WOO_ORDERS_CREATE_ERROR",
            );
        }
    }

    override async put(
        id: string,
        data: WooOrderData,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("WooOrdersAPI PUT", { id });
        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Valid order ID is required",
                    "INVALID_ORDER_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }
            const updated = await WooOrders.updateOrder(
                parseInt(id),
                data as WooOrderUpdate,
            );
            return this.ok(updated, "Order updated successfully");
        } catch (error) {
            console.error("WooOrders PUT error:", error);
            return this.fail(
                error,
                "Failed to update order",
                "WOO_ORDERS_UPDATE_ERROR",
            );
        }
    }

    override async delete(id: string, req?: Request): Promise<Response> {
        this.logAction("WooOrdersAPI DELETE", { id });
        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Valid order ID is required",
                    "INVALID_ORDER_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }
            const url = new URL(req!.url);
            const forceDelete = url.searchParams.get("force") === "true";
            const deleted = await WooOrders.deleteOrder(
                parseInt(id),
                forceDelete,
            );
            return this.ok(deleted, "Order deleted successfully");
        } catch (error) {
            console.error("WooOrders DELETE error:", error);
            return this.fail(
                error,
                "Failed to delete order",
                "WOO_ORDERS_DELETE_ERROR",
            );
        }
    }
}
