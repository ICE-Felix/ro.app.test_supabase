import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProductTags } from "../../_shared/woo_commerce/products/wooProductTags.ts";
import {
    WooProductTag,
    WooProductTagBatch,
    WooProductTagCreate,
    WooProductTagQuery,
    WooProductTagUpdate,
} from "../../_shared/woo_commerce/products/wooProductTags.ts";

// Define product tag data interface
interface ProductTagData {
    id?: number;
    name: string;
    slug?: string;
    description?: string;
    [key: string]: unknown;
}

interface ParsedQueryParams {
    searchTerm: string | null;
    limit: number;
    offset: number;
    page: number | null;
    hide_empty: boolean | null;
    slug: string | null;
    product: number | null;
    orderby: string | null;
    order: "asc" | "desc" | null;
    category: string | null
}

export class ProductTagsApiController extends Controller<ProductTagData> {
    // Helper method for success responses
    private handleSuccess(data: any, message: string): Response {
        return ResponseService.success(
            data,
            200,
            { message },
            ResponseType.API,
        );
    }

    // Helper method for error responses
    private handleError(
        error: any,
        message: string,
        code: string,
        status: number = 500,
    ): Response {
        return ResponseService.error(
            message,
            code,
            status,
            { error: error.message || error },
            ResponseType.API,
        );
    }

    // Parse query parameters from request
    private parseQueryParams(req?: Request): ParsedQueryParams {
        const params: ParsedQueryParams = {
            searchTerm: null,
            limit: 20,
            offset: 0,
            page: null,
            hide_empty: null,
            slug: null,
            product: null,
            orderby: null,
            order: null,
            category: null,
        };

        if (!req) return params;

        const url = new URL(req.url);

        params.searchTerm = url.searchParams.get("search");
        params.slug = url.searchParams.get("slug");
        params.hide_empty = url.searchParams.get("hide_empty") === "true";
        params.orderby = url.searchParams.get("orderby");
        params.order = url.searchParams.get("order") as "asc" | "desc" | null;
        params.category = url.searchParams.get("category");
        // Parse product parameter
        const productParam = url.searchParams.get("product");
        if (productParam) {
            const parsedProduct = parseInt(productParam, 10);
            if (!isNaN(parsedProduct)) {
                params.product = parsedProduct;
            }
        }

        // Parse pagination parameters
        const limitParam = url.searchParams.get("limit");
        const offsetParam = url.searchParams.get("offset");
        const pageParam = url.searchParams.get("page");

        if (limitParam) {
            const parsedLimit = parseInt(limitParam, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
                params.limit = parsedLimit;
            }
        }

        if (offsetParam) {
            const parsedOffset = parseInt(offsetParam, 10);
            if (!isNaN(parsedOffset) && parsedOffset >= 0) {
                params.offset = parsedOffset;
            }
        }

        if (pageParam) {
            const parsedPage = parseInt(pageParam, 10);
            if (!isNaN(parsedPage) && parsedPage > 0) {
                params.page = parsedPage;
            }
        }

        return params;
    }

    // Build WooProductTagQuery from parsed parameters
    private buildWooQuery(params: ParsedQueryParams): WooProductTagQuery {
        const query: WooProductTagQuery = {};

        if (params.searchTerm) query.search = params.searchTerm;
        if (params.slug) query.slug = params.slug;
        if (params.hide_empty !== null) query.hide_empty = params.hide_empty;
        if (params.orderby) query.orderby = params.orderby as any;
        if (params.order) query.order = params.order;
        if (params.product) query.product = params.product;
        if (params.category) query.category = params.category;
        // Handle pagination
        if (params.page) {
            query.page = params.page;
            query.per_page = params.limit;
        } else {
            // Use offset-based pagination by calculating page
            const page = Math.floor(params.offset / params.limit) + 1;
            query.page = page;
            query.per_page = params.limit;
        }

        return query;
    }

    // Validation method
    private validateTagData(
        data: ProductTagData,
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate required fields
        if (
            !data.name || typeof data.name !== "string" ||
            data.name.trim() === ""
        ) {
            errors.push("name is required and must be a non-empty string");
        }

        // Validate optional fields
        if (data.slug !== undefined && typeof data.slug !== "string") {
            errors.push("slug must be a string");
        }

        if (
            data.description !== undefined &&
            typeof data.description !== "string"
        ) {
            errors.push("description must be a string");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Prepare tag data for creation
    private prepareTagDataForCreate(data: ProductTagData): WooProductTagCreate {
        return {
            name: data.name,
            slug: data.slug,
            description: data.description,
        };
    }

    // Prepare tag data for update
    private prepareTagDataForUpdate(data: ProductTagData): WooProductTagUpdate {
        return {
            name: data.name,
            slug: data.slug,
            description: data.description,
        };
    }

    // Core API methods (implementing abstract methods from Controller)
    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("ProductTagsAPI GET", { id });

        try {
            if (id) {
                const tag = await WooProductTags.getProductTag(
                    parseInt(id),
                );
                return this.handleSuccess(
                    tag,
                    "Tag retrieved successfully",
                );
            } else {
                const params = this.parseQueryParams(req);
                const queryParams = this.buildWooQuery(params);
                const tags = await WooProductTags
                    .getProductTags(queryParams);
                return this.handleSuccess(
                    tags,
                    "Tags retrieved successfully",
                );
            }
        } catch (error) {
            console.error("Error in ProductTagsAPI GET:", error);
            return this.handleError(
                error,
                "Failed to retrieve tags",
                "TAGS_GET_ERROR",
            );
        }
    }

    override async post(
        data: ProductTagData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductTagsAPI POST", { data });

        try {
            // Validate tag data
            const validation = this.validateTagData(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Prepare and create tag
            const tagData = this.prepareTagDataForCreate(data);
            const createdTag = await WooProductTags
                .createProductTag(tagData);

            return this.handleSuccess(
                createdTag,
                "Tag created successfully",
            );
        } catch (error) {
            console.error("Error in ProductTagsAPI POST:", error);
            return this.handleError(
                error,
                "Failed to create tag",
                "TAGS_CREATE_ERROR",
            );
        }
    }

    override async put(
        id: string,
        data: ProductTagData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductTagsAPI PUT", { id, data });

        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Valid tag ID is required",
                    "INVALID_TAG_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            // Validate tag data
            const validation = this.validateTagData(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Prepare and update tag
            const tagData = this.prepareTagDataForUpdate(data);
            const updatedTag = await WooProductTags
                .updateProductTag(parseInt(id), tagData);

            return this.handleSuccess(
                updatedTag,
                "Tag updated successfully",
            );
        } catch (error) {
            console.error("Error in ProductTagsAPI PUT:", error);
            return this.handleError(
                error,
                "Failed to update tag",
                "TAGS_UPDATE_ERROR",
            );
        }
    }

    override async delete(id: string, req?: Request): Promise<Response> {
        this.logAction("ProductTagsAPI DELETE", { id });

        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Valid tag ID is required",
                    "INVALID_TAG_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            const force = req &&
                new URL(req.url).searchParams.get("force") === "true";
            const deletedTag = await WooProductTags
                .deleteProductTag(parseInt(id), force);

            return this.handleSuccess(
                deletedTag,
                "Tag deleted successfully",
            );
        } catch (error) {
            console.error("Error in ProductTagsAPI DELETE:", error);
            return this.handleError(
                error,
                "Failed to delete tag",
                "TAGS_DELETE_ERROR",
            );
        }
    }

    // Additional helper methods
    async searchTags(searchTerm: string, req?: Request): Promise<Response> {
        this.logAction("ProductTagsAPI SEARCH", { searchTerm });

        try {
            const tags = await WooProductTags.searchProductTags(searchTerm);
            return this.handleSuccess(
                tags,
                "Tags search completed successfully",
            );
        } catch (error) {
            console.error("Error in ProductTagsAPI SEARCH:", error);
            return this.handleError(
                error,
                "Failed to search tags",
                "TAGS_SEARCH_ERROR",
            );
        }
    }

    async getMostPopularTags(
        limit: number = 10,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductTagsAPI GET_POPULAR", { limit });

        try {
            const tags = await WooProductTags.getMostPopularProductTags(limit);
            return this.handleSuccess(
                tags,
                "Popular tags retrieved successfully",
            );
        } catch (error) {
            console.error("Error in ProductTagsAPI GET_POPULAR:", error);
            return this.handleError(
                error,
                "Failed to retrieve popular tags",
                "TAGS_GET_POPULAR_ERROR",
            );
        }
    }

    async getTagsForProduct(
        productId: string,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductTagsAPI GET_FOR_PRODUCT", { productId });

        try {
            if (!productId || isNaN(parseInt(productId))) {
                return ResponseService.error(
                    "Valid product ID is required",
                    "INVALID_PRODUCT_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            const tags = await WooProductTags.getProductTagsForProduct(
                parseInt(productId),
            );
            return this.handleSuccess(
                tags,
                "Product tags retrieved successfully",
            );
        } catch (error) {
            console.error("Error in ProductTagsAPI GET_FOR_PRODUCT:", error);
            return this.handleError(
                error,
                "Failed to retrieve product tags",
                "TAGS_GET_FOR_PRODUCT_ERROR",
            );
        }
    }
}
