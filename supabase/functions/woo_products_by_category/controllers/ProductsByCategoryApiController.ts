import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProducts } from "../../_shared/woo_commerce/products/wooProducts.ts";
import { WooProductCategories } from "../../_shared/woo_commerce/products/wooProductCategories.ts";
import {
    WooProductQuery,
} from "../../_shared/woo_commerce/products/wooProducts.ts";

// Define query parameters interface
interface ProductsByCategoryQuery {
    categoryId: number;
    search?: string;
    limit?: number;
    offset?: number;
    page?: number;
    status?: string;
    stock_status?: string;
    featured?: boolean;
    on_sale?: boolean;
    type?: string;
    sku?: string;
    [key: string]: unknown;
}

interface ParsedQueryParams {
    categoryId: number;
    searchTerm: string | null;
    limit: number;
    offset: number;
    page: number | null;
    status: string | null;
    stock_status: string | null;
    featured: boolean | null;
    on_sale: boolean | null;
    type: string | null;
    sku: string | null;
}

export class ProductsByCategoryApiController
    extends Controller<ProductsByCategoryQuery> {
    // Parse query parameters from request
    private parseQueryParams(
        req?: Request,
        categoryId?: string,
    ): ParsedQueryParams {
        const params: ParsedQueryParams = {
            categoryId: categoryId ? parseInt(categoryId) : 0,
            searchTerm: null,
            limit: 20,
            offset: 0,
            page: null,
            status: null,
            stock_status: null,
            featured: null,
            on_sale: null,
            type: null,
            sku: null,
        };

        if (!req) return params;

        const url = new URL(req.url);

        params.searchTerm = url.searchParams.get("search");
        params.status = url.searchParams.get("status");
        params.stock_status = url.searchParams.get("stock_status");
        params.featured = url.searchParams.get("featured") === "true";
        params.on_sale = url.searchParams.get("on_sale") === "true";
        params.type = url.searchParams.get("type");
        params.sku = url.searchParams.get("sku");

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
    private buildWooQueryParams(params: ParsedQueryParams): WooProductQuery {
        const queryParams: WooProductQuery = {
            category: params.categoryId.toString(),
            per_page: params.limit,
            offset: params.offset,
            page: params.page || 1,
        };

        if (params.searchTerm) queryParams.search = params.searchTerm;
        if (params.status) queryParams.status = params.status as any;
        if (params.stock_status) {
            queryParams.stock_status = params.stock_status as any;
        }
        if (params.featured !== null) queryParams.featured = params.featured;
        if (params.on_sale !== null) queryParams.on_sale = params.on_sale;
        if (params.type) queryParams.type = params.type as any;
        if (params.sku) queryParams.sku = params.sku;

        return queryParams;
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

    // Get products by category ID
    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("ProductsByCategoryAPI GET", { categoryId: id });

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

            const categoryId = parseInt(id);

            // First, verify the category exists
            try {
                await WooProductCategories.getProductCategory(categoryId);
            } catch (error) {
                return ResponseService.error(
                    "Category not found",
                    "CATEGORY_NOT_FOUND",
                    404,
                    {},
                    ResponseType.API,
                );
            }

            // Parse query parameters and build WooCommerce query
            const params = this.parseQueryParams(req, id);
            const queryParams = this.buildWooQueryParams(params);

            console.log("DEBUG: Getting products for category:", {
                categoryId,
                queryParams,
                requestUrl: req?.url,
            });

            // Get products by category
            const products = await WooProducts.getProductsByCategory(
                categoryId,
                queryParams,
            );

            // Also get category information for context
            const category = await WooProductCategories.getProductCategory(
                categoryId,
            );

            const response = {
                category: {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    parent: category.parent,
                    description: category.description,
                    count: category.count,
                },
                products: products,
                pagination: {
                    current_page: params.page || 1,
                    per_page: params.limit,
                    total_products: products.length,
                    category_total: category.count,
                },
                filters: {
                    search: params.searchTerm,
                    status: params.status,
                    stock_status: params.stock_status,
                    featured: params.featured,
                    on_sale: params.on_sale,
                    type: params.type,
                    sku: params.sku,
                },
            };

            return this.handleSuccess(
                response,
                `Found ${products.length} products in category "${category.name}"`,
            );
        } catch (error) {
            console.error("Error in ProductsByCategoryAPI GET:", error);
            return this.handleError(
                error,
                "Failed to retrieve products by category",
                "PRODUCTS_BY_CATEGORY_GET_ERROR",
            );
        }
    }

    // POST, PUT, DELETE methods are not applicable for this read-only endpoint
    override async post(
        data: ProductsByCategoryQuery,
        req?: Request,
    ): Promise<Response> {
        return ResponseService.error(
            "POST method not supported for products by category endpoint",
            "METHOD_NOT_SUPPORTED",
            405,
            {},
            ResponseType.API,
        );
    }

    override async put(
        id: string,
        data: ProductsByCategoryQuery,
        req?: Request,
    ): Promise<Response> {
        return ResponseService.error(
            "PUT method not supported for products by category endpoint",
            "METHOD_NOT_SUPPORTED",
            405,
            {},
            ResponseType.API,
        );
    }

    override async delete(id: string, req?: Request): Promise<Response> {
        return ResponseService.error(
            "DELETE method not supported for products by category endpoint",
            "METHOD_NOT_SUPPORTED",
            405,
            {},
            ResponseType.API,
        );
    }

    // Helper method to get category statistics
    async getCategoryStats(
        categoryId: string,
        req?: Request,
    ): Promise<Response> {
        this.logAction("ProductsByCategoryAPI GET_STATS", { categoryId });

        try {
            if (!categoryId || isNaN(parseInt(categoryId))) {
                return ResponseService.error(
                    "Valid category ID is required",
                    "INVALID_CATEGORY_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            const categoryIdNum = parseInt(categoryId);

            // Get category information
            const category = await WooProductCategories.getProductCategory(
                categoryIdNum,
            );

            // Get products in different states
            const [
                allProducts,
                publishedProducts,
                featuredProducts,
                onSaleProducts,
                inStockProducts,
                outOfStockProducts,
            ] = await Promise.all([
                WooProducts.getProductsByCategory(categoryIdNum, {
                    per_page: 100,
                }),
                WooProducts.getProductsByCategory(categoryIdNum, {
                    status: "publish" as any,
                    per_page: 100,
                }),
                WooProducts.getProductsByCategory(categoryIdNum, {
                    featured: true,
                    per_page: 100,
                }),
                WooProducts.getProductsByCategory(categoryIdNum, {
                    on_sale: true,
                    per_page: 100,
                }),
                WooProducts.getProductsByCategory(categoryIdNum, {
                    stock_status: "instock" as any,
                    per_page: 100,
                }),
                WooProducts.getProductsByCategory(categoryIdNum, {
                    stock_status: "outofstock" as any,
                    per_page: 100,
                }),
            ]);

            const stats = {
                category: {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    parent: category.parent,
                    description: category.description,
                },
                product_counts: {
                    total: allProducts.length,
                    published: publishedProducts.length,
                    featured: featuredProducts.length,
                    on_sale: onSaleProducts.length,
                    in_stock: inStockProducts.length,
                    out_of_stock: outOfStockProducts.length,
                },
                last_updated: new Date().toISOString(),
            };

            return this.handleSuccess(
                stats,
                `Category statistics for "${category.name}"`,
            );
        } catch (error) {
            console.error("Error in ProductsByCategoryAPI GET_STATS:", error);
            return this.handleError(
                error,
                "Failed to retrieve category statistics",
                "CATEGORY_STATS_ERROR",
            );
        }
    }
}
