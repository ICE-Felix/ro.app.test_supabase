import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { WooProducts } from "../../_shared/woo_commerce/products/wooProducts.ts";
import {
    ProductMetaData,
    WooProduct,
    WooProductBatch,
    WooProductQuery,
} from "../../_shared/woo_commerce/products/wooProducts.ts";
import { SupabaseImageUtils } from "../../_shared/supabase/supabaseImageUtils.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";

// Define WooCommerce product data interface
interface WooProductData {
    id?: number;
    shop_id?: number;
    name: string;
    type?: string;
    status?: string;
    featured?: boolean;
    catalog_visibility?: string;
    description?: string;
    short_description?: string;
    sku?: string;
    price?: string;
    regular_price?: string;
    sale_price?: string;
    date_on_sale_from?: string;
    date_on_sale_to?: string;
    price_html?: string;
    on_sale?: boolean;
    purchasable?: boolean;
    total_sales?: number;
    virtual?: boolean;
    downloadable?: boolean;
    downloads?: any[];
    download_limit?: number;
    download_expiry?: number;
    external_url?: string;
    button_text?: string;
    tax_status?: string;
    tax_class?: string;
    manage_stock?: boolean;
    stock_quantity?: number;
    backorders?: string;
    backorders_allowed?: boolean;
    backordered?: boolean;
    low_stock_amount?: number;
    sold_individually?: boolean;
    weight?: string;
    dimensions?: any;
    shipping_required?: boolean;
    shipping_taxable?: boolean;
    shipping_class?: string;
    shipping_class_id?: number;
    reviews_allowed?: boolean;
    average_rating?: string;
    rating_count?: number;
    upsell_ids?: number[];
    cross_sell_ids?: number[];
    parent_id?: number;
    purchase_note?: string;
    categories?: any[];
    tags?: any[];
    images?: any[];
    attributes?: any[];
    default_attributes?: any[];
    variations?: number[];
    grouped_products?: number[];
    menu_order?: number;
    price_range?: any;
    related_ids?: number[];
    stock_status?: string;
    has_options?: boolean;
    post_password?: string;
    global_unique_id?: string;
    image_base64?: string;
    [key: string]: unknown;
}

interface ParsedQueryParams {
    searchTerm: string | null;
    limit: number;
    offset: number;
    page: number | null;
    category: string | null;
    tag: string | null;
    featured: boolean | null;
    on_sale: boolean | null;
    status: string | null;
    stock_status: string | null;
    type: string | null;
    sku: string | null;
}

export class WooProductsApiController extends Controller<WooProductData> {
    // Parse query parameters from request
    private parseQueryParams(req?: Request): ParsedQueryParams {
        const params: ParsedQueryParams = {
            searchTerm: null,
            limit: 20,
            offset: 0,
            page: null,
            category: null,
            tag: null,
            featured: null,
            on_sale: null,
            status: null,
            stock_status: null,
            type: null,
            sku: null,
        };

        if (!req) return params;

        const url = new URL(req.url);

        params.searchTerm = url.searchParams.get("search");
        params.category = url.searchParams.get("category");
        params.tag = url.searchParams.get("tag");
        params.featured = url.searchParams.get("featured") === "true";
        params.on_sale = url.searchParams.get("on_sale") === "true";
        params.status = url.searchParams.get("status");
        params.stock_status = url.searchParams.get("stock_status");
        params.type = url.searchParams.get("type");
        params.sku = url.searchParams.get("sku");

        console.log("DEBUG: Raw URL parameters:", {
            search: params.searchTerm,
            category: params.category,
            tag: params.tag,
            featured: params.featured,
            on_sale: params.on_sale,
            status: params.status,
            stock_status: params.stock_status,
            type: params.type,
            sku: params.sku,
            limit: url.searchParams.get("limit"),
            offset: url.searchParams.get("offset"),
            page: url.searchParams.get("page"),
            fullUrl: req.url,
        });

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
            per_page: params.limit,
            offset: params.offset,
            page: params.page || 1,
        };

        if (params.searchTerm) queryParams.search = params.searchTerm;
        if (params.category) queryParams.category = params.category;
        if (params.tag) queryParams.tag = params.tag;
        if (params.featured !== null) queryParams.featured = params.featured;
        if (params.on_sale !== null) queryParams.on_sale = params.on_sale;
        if (params.status) queryParams.status = params.status as any;
        if (params.stock_status) {
            queryParams.stock_status = params.stock_status as any;
        }
        if (params.type) queryParams.type = params.type as any;
        if (params.sku) queryParams.sku = params.sku;

        return queryParams;
    }

    // Prepare product data for creation
    private prepareProductDataForCreate(
        data: WooProductData,
    ): Partial<WooProduct> {
        return {
            name: data.name.trim(),
            type: (data.type || "simple") as any,
            status: (data.status || "draft") as any,
            featured: data.featured || false,
            catalog_visibility: (data.catalog_visibility || "visible") as any,
            description: data.description || "",
            short_description: data.short_description || "",
            sku: data.sku || "",
            price: data.price || "",
            regular_price: data.regular_price || "",
            sale_price: data.sale_price || "",
            virtual: data.virtual || false,
            downloadable: data.downloadable || false,
            manage_stock: data.manage_stock || false,
            stock_quantity: data.stock_quantity || undefined,
            weight: data.weight || "",
            reviews_allowed: data.reviews_allowed !== undefined
                ? data.reviews_allowed
                : true,
            categories: data.categories || [],
            tags: data.tags || [],
            images: data.images || [],
            attributes: data.attributes || [],
            shop_id: data.shop_id,
            meta_data: typeof data.meta_data === "string"
                ? JSON.parse(data.meta_data) as ProductMetaData[]
                : (data.meta_data as ProductMetaData[]) || [],
        };
    }

    // Prepare product data for update
    private prepareProductDataForUpdate(
        data: WooProductData,
    ): Partial<WooProduct> {
        const updateData: Partial<WooProduct> = {};

        if (data.name !== undefined) updateData.name = data.name.trim();
        if (data.type !== undefined) updateData.type = data.type as any;
        if (data.status !== undefined) updateData.status = data.status as any;
        if (data.featured !== undefined) updateData.featured = data.featured;
        if (data.catalog_visibility !== undefined) {
            updateData.catalog_visibility = data.catalog_visibility as any;
        }
        if (data.description !== undefined) {
            updateData.description = data.description;
        }
        if (data.short_description !== undefined) {
            updateData.short_description = data.short_description;
        }
        if (data.sku !== undefined) updateData.sku = data.sku;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.regular_price !== undefined) {
            updateData.regular_price = data.regular_price;
        }
        if (data.sale_price !== undefined) {
            updateData.sale_price = data.sale_price;
        }
        if (data.virtual !== undefined) updateData.virtual = data.virtual;
        if (data.downloadable !== undefined) {
            updateData.downloadable = data.downloadable;
        }
        if (data.manage_stock !== undefined) {
            updateData.manage_stock = data.manage_stock;
        }
        if (data.stock_quantity !== undefined) {
            updateData.stock_quantity = data.stock_quantity;
        }
        if (data.weight !== undefined) updateData.weight = data.weight;
        if (data.reviews_allowed !== undefined) {
            updateData.reviews_allowed = data.reviews_allowed;
        }
        if (data.categories !== undefined) {
            updateData.categories = data.categories;
        }
        if (data.tags !== undefined) updateData.tags = data.tags;
        if (data.images !== undefined) updateData.images = data.images;
        if (data.attributes !== undefined) {
            updateData.attributes = data.attributes;
        }
        if (data.shop_id !== undefined) {
            updateData.shop_id = data.shop_id;
        }
        if (data.meta_data !== undefined) {
            if (typeof data.meta_data === "string") {
                try {
                    updateData.meta_data = JSON.parse(
                        data.meta_data,
                    ) as ProductMetaData[];
                } catch (e) {
                    throw new Error(
                        "meta_data must be a valid JSON array string",
                    );
                }
            } else {
                updateData.meta_data = data.meta_data as ProductMetaData[];
            }
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

    // Handle image upload and deletion logic
    private async handleImageOperations(
        data: WooProductData,
        client: any,
    ): Promise<
        { uploadedImageUrl: string | null; shouldDeleteImage: boolean }
    > {
        let uploadedImageUrl: string | null = null;
        let shouldDeleteImage = false;

        // Handle image upload if image_base64 is present
        if (data.image_base64) {
            // Validate base64 image data
            if (!SupabaseImageUtils.isValidBase64Image(data.image_base64)) {
                throw new Error("Invalid base64 image format");
            }

            // Generate filename from product name or use default
            const fileName = data.name
                ? `${data.name.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`
                : `product_${Date.now()}.jpg`;

            // Upload image to woo-images bucket using utility
            const uploadResult = await SupabaseImageUtils.uploadImage(
                client,
                data.image_base64,
                fileName,
                "woo-images",
            );

            if (!uploadResult) {
                throw new Error("Failed to upload image");
            }

            uploadedImageUrl = uploadResult.url;
            shouldDeleteImage = true;

            // Set the images array with the uploaded image URL
            data.images = [{ src: uploadedImageUrl }];
        }

        return { uploadedImageUrl, shouldDeleteImage };
    }

    // Clean up uploaded image
    private async cleanupUploadedImage(
        uploadedImageUrl: string | null,
        shouldDeleteImage: boolean,
        client: any,
    ): Promise<void> {
        if (shouldDeleteImage && uploadedImageUrl && client) {
            const deleteResult = await SupabaseImageUtils.deleteImageByUrl(
                client,
                uploadedImageUrl,
            );
            if (!deleteResult.deleted) {
                console.warn(
                    "Failed to delete uploaded image:",
                    deleteResult.error,
                );
            }
        }
    }

    // Validation method
    private validateProductData(
        data: WooProductData,
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
        if (data.type !== undefined && typeof data.type !== "string") {
            errors.push("type must be a string");
        }

        if (data.status !== undefined && typeof data.status !== "string") {
            errors.push("status must be a string");
        }

        if (data.featured !== undefined && typeof data.featured !== "boolean") {
            errors.push("featured must be a boolean");
        }

        if (
            data.description !== undefined &&
            typeof data.description !== "string"
        ) {
            errors.push("description must be a string");
        }

        if (
            data.short_description !== undefined &&
            typeof data.short_description !== "string"
        ) {
            errors.push("short_description must be a string");
        }

        if (data.sku !== undefined && typeof data.sku !== "string") {
            errors.push("sku must be a string");
        }

        if (data.price !== undefined && typeof data.price !== "string") {
            errors.push("price must be a string");
        }

        if (
            data.regular_price !== undefined &&
            typeof data.regular_price !== "string"
        ) {
            errors.push("regular_price must be a string");
        }

        if (
            data.sale_price !== undefined && typeof data.sale_price !== "string"
        ) {
            errors.push("sale_price must be a string");
        }

        if (data.virtual !== undefined && typeof data.virtual !== "boolean") {
            errors.push("virtual must be a boolean");
        }

        if (
            data.downloadable !== undefined &&
            typeof data.downloadable !== "boolean"
        ) {
            errors.push("downloadable must be a boolean");
        }

        if (
            data.manage_stock !== undefined &&
            typeof data.manage_stock !== "boolean"
        ) {
            errors.push("manage_stock must be a boolean");
        }

        if (
            data.stock_quantity !== undefined &&
            typeof data.stock_quantity !== "number"
        ) {
            errors.push("stock_quantity must be a number");
        }

        if (data.weight !== undefined && typeof data.weight !== "string") {
            errors.push("weight must be a string");
        }

        if (
            data.reviews_allowed !== undefined &&
            typeof data.reviews_allowed !== "boolean"
        ) {
            errors.push("reviews_allowed must be a boolean");
        }

        if (data.shop_id !== undefined && typeof data.shop_id !== "number") {
            errors.push("shop_id must be a number");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Validation method for updates (only validates present fields)
    private validateProductDataForUpdate(
        data: Partial<WooProductData>,
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Validate name if present
        if (data.name !== undefined) {
            if (typeof data.name !== "string" || data.name.trim() === "") {
                errors.push("name must be a non-empty string");
            }
        }

        // Validate other fields if present (same validation logic as above)
        if (data.type !== undefined && typeof data.type !== "string") {
            errors.push("type must be a string");
        }

        if (data.status !== undefined && typeof data.status !== "string") {
            errors.push("status must be a string");
        }

        if (data.featured !== undefined && typeof data.featured !== "boolean") {
            errors.push("featured must be a boolean");
        }

        if (data.price !== undefined && typeof data.price !== "string") {
            errors.push("price must be a string");
        }

        if (
            data.regular_price !== undefined &&
            typeof data.regular_price !== "string"
        ) {
            errors.push("regular_price must be a string");
        }

        if (
            data.sale_price !== undefined && typeof data.sale_price !== "string"
        ) {
            errors.push("sale_price must be a string");
        }

        if (
            data.stock_quantity !== undefined &&
            typeof data.stock_quantity !== "number"
        ) {
            errors.push("stock_quantity must be a number");
        }

        if (data.shop_id !== undefined && typeof data.shop_id !== "number") {
            errors.push("shop_id must be a number");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    // Core API methods
    override async get(id?: string, req?: Request): Promise<Response> {
        this.logAction("WooProductsAPI GET", { id });

        try {
            if (id) {
                const product = await WooProducts.getProductById(parseInt(id));
                return this.handleSuccess(
                    product,
                    "Product retrieved successfully",
                );
            } else {
                const params = this.parseQueryParams(req);
                const queryParams = this.buildWooQueryParams(params);
                const products = await WooProducts.getAllProducts(queryParams);
                return this.handleSuccess(
                    products,
                    "Products retrieved successfully",
                );
            }
        } catch (error) {
            console.error("Error in WooProductsAPI GET:", error);
            return this.handleError(
                error,
                "Failed to retrieve products",
                "WOO_PRODUCTS_GET_ERROR",
            );
        }
    }

    override async post(
        data: WooProductData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("WooProductsAPI POST", { data });

        let uploadedImageUrl: string | null = null;
        let shouldDeleteImage = false;
        let client: any = null;

        try {
            // Authenticate and get client
            const authResult = await AuthenticationService.authenticate(req!);
            client = authResult.client;

            // Validate product data
            const validation = this.validateProductData(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Handle image operations
            const imageResult = await this.handleImageOperations(data, client);
            uploadedImageUrl = imageResult.uploadedImageUrl;
            shouldDeleteImage = imageResult.shouldDeleteImage;

            // Prepare and create product
            const productData = this.prepareProductDataForCreate(data);
            console.log(
                "Prepared product data for WooCommerce:",
                JSON.stringify(productData, null, 2),
            );
            const createdProduct = await WooProducts.createProduct(productData);

            // Delete the uploaded image after successful product creation
            await this.cleanupUploadedImage(
                uploadedImageUrl,
                shouldDeleteImage,
                client,
            );

            return this.handleSuccess(
                createdProduct,
                "Product created successfully",
            );
        } catch (error) {
            console.error("Error in WooProductsAPI POST:", error);

            // Clean up uploaded image if there was an error
            await this.cleanupUploadedImage(
                uploadedImageUrl,
                shouldDeleteImage,
                client,
            );

            return this.handleError(
                error,
                "Failed to create product",
                "WOO_PRODUCTS_CREATE_ERROR",
            );
        }
    }

    override async put(
        id: string,
        data: WooProductData,
        req?: Request,
    ): Promise<Response> {
        this.logAction("WooProductsAPI PUT", { id, data });

        let uploadedImageUrl: string | null = null;
        let shouldDeleteImage = false;
        let client: any = null;

        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Product ID is required for updates",
                    "MISSING_PRODUCT_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            // Authenticate and get client
            const authResult = await AuthenticationService.authenticate(req!);
            client = authResult.client;

            // Validate product data for update
            const validation = this.validateProductDataForUpdate(data);
            if (!validation.isValid) {
                return ResponseService.error(
                    "Validation failed",
                    "VALIDATION_ERROR",
                    400,
                    { errors: validation.errors },
                    ResponseType.API,
                );
            }

            // Handle image operations
            const imageResult = await this.handleImageOperations(data, client);
            uploadedImageUrl = imageResult.uploadedImageUrl;
            shouldDeleteImage = imageResult.shouldDeleteImage;

            // Prepare and update product
            const updateData = this.prepareProductDataForUpdate(data);
            const updatedProduct = await WooProducts.updateProduct(
                parseInt(id),
                updateData,
            );

            // Delete the uploaded image after successful product update
            await this.cleanupUploadedImage(
                uploadedImageUrl,
                shouldDeleteImage,
                client,
            );

            return this.handleSuccess(
                updatedProduct,
                "Product updated successfully",
            );
        } catch (error) {
            console.error("Error in WooProductsAPI PUT:", error);

            // Clean up uploaded image if there was an error
            await this.cleanupUploadedImage(
                uploadedImageUrl,
                shouldDeleteImage,
                client,
            );

            return this.handleError(
                error,
                "Failed to update product",
                "WOO_PRODUCTS_UPDATE_ERROR",
            );
        }
    }

    override async delete(id: string, _req?: Request): Promise<Response> {
        this.logAction("WooProductsAPI DELETE", { id });

        try {
            if (!id || isNaN(parseInt(id))) {
                return ResponseService.error(
                    "Valid product ID is required",
                    "INVALID_PRODUCT_ID",
                    400,
                    {},
                    ResponseType.API,
                );
            }

            // Check if force delete is requested
            const url = new URL(_req!.url);
            const forceDelete = url.searchParams.get("force") === "true";

            // Delete product using WooCommerce API
            const deletedProduct = await WooProducts.deleteProduct(
                parseInt(id),
                forceDelete,
            );

            return this.handleSuccess(
                deletedProduct,
                "Product deleted successfully",
            );
        } catch (error) {
            console.error("Error in WooProductsAPI DELETE:", error);
            return this.handleError(
                error,
                "Failed to delete product",
                "WOO_PRODUCTS_DELETE_ERROR",
            );
        }
    }

    // Additional helper methods
    async batchProducts(
        data: WooProductBatch,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("WooProductsAPI BATCH", { data });

        try {
            // Perform batch operations using WooCommerce API
            const batchResult = await WooProducts.batchProducts(data);
            return this.handleSuccess(
                batchResult,
                "Batch operation completed successfully",
            );
        } catch (error) {
            console.error("Error in WooProductsAPI BATCH:", error);
            return this.handleError(
                error,
                "Failed to perform batch operation",
                "WOO_PRODUCTS_BATCH_ERROR",
            );
        }
    }
}
