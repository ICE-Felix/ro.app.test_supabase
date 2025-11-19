import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";

// Define resource data interface
interface WooProductResourceData {
    name: string;
    type?: string;
    status?: string;
    price?: string;
    [key: string]: unknown;
}

export class WooProductsWebController
    extends Controller<WooProductResourceData> {
    // Core Web methods
    override get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("WooProductsWeb GET", { id });

        if (id) {
            console.log(`Web: Fetching WooCommerce product with id: ${id}`);
            // Web-specific resource retrieval logic, possibly returning HTML
            return Promise.resolve(ResponseService.success(
                {
                    id,
                    data: "WooCommerce Product Web Resource data",
                    html: "<div>WooCommerce Product Details</div>",
                },
                200,
                undefined,
                ResponseType.WEB,
            ));
        }

        console.log("Web: Fetching all WooCommerce products");
        // Web-specific resources retrieval logic
        return Promise.resolve(ResponseService.success(
            {
                resources: ["WooProduct1", "WooProduct2"],
                html:
                    "<ul><li>WooCommerce Product 1</li><li>WooCommerce Product 2</li></ul>",
            },
            200,
            undefined,
            ResponseType.WEB,
        ));
    }

    override post(
        data: WooProductResourceData,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("WooProductsWeb POST", { data });
        console.log("Web POST data:", data);

        // Validate required fields
        if (!data.name) {
            console.log("Missing required field in data:", data);
            return Promise.resolve(ResponseService.error(
                "Missing required field: name",
                "VALIDATION_ERROR",
                400,
                { data },
                ResponseType.WEB,
            ));
        }

        // Web-specific creation logic
        return Promise.resolve(ResponseService.success(
            {
                message: "WooCommerce Product created successfully via Web",
                data,
                html: "<div>WooCommerce Product Created</div>",
            },
            200,
            undefined,
            ResponseType.WEB,
        ));
    }

    override put(
        id: string,
        data: WooProductResourceData,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("WooProductsWeb PUT", { id, data });
        console.log("Web PUT data:", data);

        // Validate required fields
        if (!data.name) {
            console.log("Missing required field in data:", data);
            return Promise.resolve(ResponseService.error(
                "Missing required field: name",
                "VALIDATION_ERROR",
                400,
                { data },
                ResponseType.WEB,
            ));
        }

        // Web-specific update logic
        return Promise.resolve(ResponseService.success(
            {
                message: "WooCommerce Product updated successfully via Web",
                id,
                data,
                html: "<div>WooCommerce Product Updated</div>",
            },
            200,
            undefined,
            ResponseType.WEB,
        ));
    }

    override delete(id: string, _req?: Request): Promise<Response> {
        this.logAction("WooProductsWeb DELETE", { id });
        console.log("Web DELETE id:", id);

        if (!id) {
            return Promise.resolve(ResponseService.error(
                "Missing required ID",
                "VALIDATION_ERROR",
                400,
                { id },
                ResponseType.WEB,
            ));
        }

        // Web-specific deletion logic
        return Promise.resolve(ResponseService.success(
            {
                message: "WooCommerce Product deleted successfully via Web",
                id,
                html: "<div>WooCommerce Product Deleted</div>",
            },
            200,
            undefined,
            ResponseType.WEB,
        ));
    }
}
