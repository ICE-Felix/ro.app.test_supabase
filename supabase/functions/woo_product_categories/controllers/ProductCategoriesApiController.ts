import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProductCategories } from "../../_shared/woo_commerce/products/wooProductCategories.ts";
import {
    WooProductCategory,
    WooProductCategoryBatch,
    WooProductCategoryCreate,
    WooProductCategoryQuery,
    WooProductCategoryUpdate,
} from "../../_shared/woo_commerce/products/wooProductCategories.ts";

// Define product category data interface
interface ProductCategoryData {
    id?: number;
    name: string;
    slug?: string;
    parent?: number;
    description?: string;
    display?: "default" | "products" | "subcategories" | "both";
    image?: {
        id?: number;
        src?: string;
        name?: string;
        alt?: string;
    };
    menu_order?: number;
    [key: string]: unknown;
}

interface ParsedQueryParams {
    searchTerm: string | null;
    limit: number;
    offset: number;
    page: number | null;
    parent: number | null;
    hide_empty: boolean | null;
    slug: string | null;
    product: number | null;
    orderby: string | null;
    order: "asc" | "desc" | null;
}

export class ProductCategoriesApiController
    extends Controller<ProductCategoryData> {
    // Parse query parameters from request
    private parseQueryParams(req?: Request): ParsedQueryParams {
        const params: ParsedQueryParams = {
            searchTerm: null,
            limit: 20,
            offset: 0,
            page: null,
            parent: null,
            hide_empty: null,
            slug: null,
            product: null,
            orderby: null,
            order: null,
        };

        if (!req) return params;

        const url = new URL(req.url);

        params.searchTerm = url.searchParams.get("search");
        params.slug = url.searchParams.get("slug");
        params.hide_empty = url.searchParams.get("hide_empty") === "true";
        params.orderby = url.searchParams.get("orderby");
        params.order = url.searchParams.get("order") as "asc" | "desc" | null;

        // Parse parent parameter
        const parentParam = url.searchParams.get("parent");
        if (parentParam) {
            const parsedParent = parseInt(parentParam, 10);
            if (!isNaN(parsedParent)) {
                params.parent = parsedParent;
            }
        }

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
                params.offset = (parsedPage - 1) * params.limit;
            }
        }

        return params;
    }

    // Build WooCommerce query parameters
    private buildWooQueryParams(
        params: ParsedQueryParams,
    ): WooProductCategoryQuery {
        const queryParams: WooProductCategoryQuery = {
            per_page: params.limit,
            page: params.page || 1,
        };

        if (params.searchTerm) queryParams.search = params.searchTerm;
        if (params.parent !== null) queryParams.parent = params.parent;
        if (params.hide_empty !== null) {
            queryParams.hide_empty = params.hide_empty;
        }
        if (params.slug) queryParams.slug = params.slug;
        if (params.product !== null) queryParams.product = params.product;
        if (params.orderby) queryParams.orderby = params.orderby as any;
        if (params.order) queryParams.order = params.order;

        return queryParams;
    }

    // Prepare category data for creation
    private prepareCategoryDataForCreate(
        data: ProductCategoryData,
    ): WooProductCategoryCreate {
        return {
            name: data.name.trim(),
            slug: data.slug,
            parent: data.parent || 0,
            description: data.description || "",
            display: data.display || "default",
            image: data.image,
            menu_order: data.menu_order || 0,
        };
    }

    // Prepare category data for update
    private prepareCategoryDataForUpdate(
        data: ProductCategoryData,
    ): WooProductCategoryUpdate {
        const updateData: WooProductCategoryUpdate = {};

        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.parent !== undefined) updateData.parent = data.parent;
        if (data.description !== undefined) {
            updateData.description = data.description;
        }
        if (data.display !== undefined) updateData.display = data.display;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.menu_order !== undefined) {
            updateData.menu_order = data.menu_order;
        }

        return updateData;
    }

    // Handle success response
    private handleSuccess(data: any, message: string): Response {
        return ResponseService.success(
            data,
            200,
            { message },
            ResponseType.API,
        );
    }

    // Handle error response
    private handleError(
        error: unknown,
        defaultMessage: string,
        code: string,
    ): Response {
        return ResponseService.error(
            error instanceof Error ? error.message : defaultMessage,
            code,
            500,
            {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            ResponseType.API,
        );
    }

    // Validation method
    private validateCategoryData(
        data: ProductCategoryData,
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

        if (data.parent !== undefined && typeof data.parent !== "number") {
            errors.push("parent must be a number");
        }

        if (
            data.description !== undefined &&
            typeof data.description !== "string"
        ) {
            errors.push("description must be a string");
        }

        if (
            data.display !== undefined &&
            !["default", "products", "subcategories", "both"].includes(
                data.display,
            )
        ) {
            errors.push(
                "display must be one of: default, products, subcategories, both",
            );
        }

        if (
            data.menu_order !== undefined && typeof data.menu_order !== "number"
        ) {
            errors.push("menu_order must be a number");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Validation method for updates
    private validateCategoryDataForUpdate(
        data: Partial<ProductCategoryData>,
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate name if present
        if (data.name !== undefined) {
            if (typeof data.name !== "string" || data.name.trim() === "") {
                errors.push("name must be a non-empty string");
            }
        }

        // Validate other fields if present
        if (data.slug !== undefined && typeof data.slug !== "string") {
            errors.push("slug must be a string");
        }

        if (data.parent !== undefined && typeof data.parent !== "number") {
            errors.push("parent must be a number");
        }

        if (
            data.description !== undefined &&
            typeof data.description !== "string"
        ) {
            errors.push("description must be a string");
        }

        if (
            data.display !== undefined &&
            !["default", "products", "subcategories", "both"].includes(
                data.display,
            )
        ) {
            errors.push(
                "display must be one of: default, products, subcategories, both",
            );
        }

        if (
            data.menu_order !== undefined && typeof data.menu_order !== "number"
        ) {
            errors.push("menu_order must be a number");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Core API methods
    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("ProductCategoriesAPI GET", { id });

        try {
            if (id) {
                const category = await WooProductCategories.getProductCategory(
                    parseInt(id),
                );
                return this.handleSuccess(
                    category,
                    "Category retrieved successfully",
                );
            } else {
                const params = this.parseQueryParams(req);
                const queryParams = this.buildWooQueryParams(params);
                const categories = await WooProductCategories
                    .getProductCategories(queryParams);
                return this.handleSuccess(
                    categories,
                    "Categories retrieved successfully",
                );
            }
        } catch (error) {
            console.error("Error in ProductCategoriesAPI GET:", error);
            return this.handleError(
                error,
                "Failed to retrieve categories",
                "CATEGORIES_GET_ERROR",
            );
        }
    }

    override async post(
        data: ProductCategoryData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductCategoriesAPI POST", { data });

        try {
            // Validate category data
            const validation = this.validateCategoryData(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Prepare and create category
            const categoryData = this.prepareCategoryDataForCreate(data);
            const createdCategory = await WooProductCategories
                .createProductCategory(categoryData);

            return this.handleSuccess(
                createdCategory,
                "Category created successfully",
            );
        } catch (error) {
            console.error("Error in ProductCategoriesAPI POST:", error);
            return this.handleError(
                error,
                "Failed to create category",
                "CATEGORIES_CREATE_ERROR",
            );
        }
    }

    override async put(
        id: string,
        data: ProductCategoryData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductCategoriesAPI PUT", { id, data });

        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Category ID is required for updates",
                    "MISSING_CATEGORY_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            // Validate category data for update
            const validation = this.validateCategoryDataForUpdate(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Prepare and update category
            const updateData = this.prepareCategoryDataForUpdate(data);
            const updatedCategory = await WooProductCategories
                .updateProductCategory(parseInt(id), updateData);

            return this.handleSuccess(
                updatedCategory,
                "Category updated successfully",
            );
        } catch (error) {
            console.error("Error in ProductCategoriesAPI PUT:", error);
            return this.handleError(
                error,
                "Failed to update category",
                "CATEGORIES_UPDATE_ERROR",
            );
        }
    }

    override async delete(id: string, req?: Request): Promise<Response> {
        this.logAction("ProductCategoriesAPI DELETE", { id });

        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Valid category ID is required",
                    "INVALID_CATEGORY_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            // Check if force delete is requested
            const url = new URL(req!.url);
            const forceDelete = url.searchParams.get("force") === "true";

            // Delete category using WooCommerce API
            const deletedCategory = await WooProductCategories
                .deleteProductCategory(parseInt(id), forceDelete);

            return this.handleSuccess(
                deletedCategory,
                "Category deleted successfully",
            );
        } catch (error) {
            console.error("Error in ProductCategoriesAPI DELETE:", error);
            return this.handleError(
                error,
                "Failed to delete category",
                "CATEGORIES_DELETE_ERROR",
            );
        }
    }

    // Additional helper methods
    async batchCategories(
        data: WooProductCategoryBatch,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductCategoriesAPI BATCH", { data });

        try {
            // Perform batch operations using WooCommerce API
            const batchResult = await WooProductCategories
                .batchProductCategories(data);
            return this.handleSuccess(
                batchResult,
                "Batch operation completed successfully",
            );
        } catch (error) {
            console.error("Error in ProductCategoriesAPI BATCH:", error);
            return this.handleError(
                error,
                "Failed to perform batch operation",
                "CATEGORIES_BATCH_ERROR",
            );
        }
    }

    // Get top-level categories
    async getTopLevelCategories(req?: Request): Promise<Response> {
        this.logAction("ProductCategoriesAPI GET_TOP_LEVEL", {});

        try {
            const categories = await WooProductCategories
                .getTopLevelCategories();
            return this.handleSuccess(
                categories,
                "Top-level categories retrieved successfully",
            );
        } catch (error) {
            console.error(
                "Error in ProductCategoriesAPI GET_TOP_LEVEL:",
                error,
            );
            return this.handleError(
                error,
                "Failed to retrieve top-level categories",
                "CATEGORIES_GET_TOP_LEVEL_ERROR",
            );
        }
    }

    // Get child categories
    async getChildCategories(
        parentId: string,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductCategoriesAPI GET_CHILD_CATEGORIES", {
            parentId,
        });

        try {
            if (!parentId || isNaN(parseInt(parentId))) {
                return ResponseService.error(
                    "Valid parent category ID is required",
                    "INVALID_PARENT_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            const categories = await WooProductCategories.getChildCategories(
                parseInt(parentId),
            );
            return this.handleSuccess(
                categories,
                "Child categories retrieved successfully",
            );
        } catch (error) {
            console.error(
                "Error in ProductCategoriesAPI GET_CHILD_CATEGORIES:",
                error,
            );
            return this.handleError(
                error,
                "Failed to retrieve child categories",
                "CATEGORIES_GET_CHILD_ERROR",
            );
        }
    }
}
