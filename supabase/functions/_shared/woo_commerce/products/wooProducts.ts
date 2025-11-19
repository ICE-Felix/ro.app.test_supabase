/**
 * WooCommerce Products API
 * Handles product management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#products
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Types and Enums
export enum ProductStatus {
    DRAFT = "draft",
    PENDING = "pending",
    PRIVATE = "private",
    PUBLISH = "publish",
}

export enum ProductType {
    SIMPLE = "simple",
    GROUPED = "grouped",
    EXTERNAL = "external",
    VARIABLE = "variable",
}

export enum CatalogVisibility {
    VISIBLE = "visible",
    CATALOG = "catalog",
    SEARCH = "search",
    HIDDEN = "hidden",
}

export enum TaxStatus {
    TAXABLE = "taxable",
    SHIPPING = "shipping",
    NONE = "none",
}

export enum StockStatus {
    IN_STOCK = "instock",
    OUT_OF_STOCK = "outofstock",
    ON_BACKORDER = "onbackorder",
}

export enum BackorderStatus {
    NO = "no",
    NOTIFY = "notify",
    YES = "yes",
}

// Product Image Interface
export interface ProductImage {
    /** Image ID */
    id: number;
    /** Date the image was created, in the site's timezone */
    date_created: string;
    /** Date the image was created, as GMT */
    date_created_gmt: string;
    /** Date the image was last modified, in the site's timezone */
    date_modified: string;
    /** Date the image was last modified, as GMT */
    date_modified_gmt: string;
    /** Image URL */
    src: string;
    /** Image name */
    name: string;
    /** Image alternative text */
    alt: string;
    /** Image position. 0 means that the image is featured */
    position: number;
}

// Product Dimensions Interface
export interface ProductDimensions {
    /** Product length */
    length: string;
    /** Product width */
    width: string;
    /** Product height */
    height: string;
}

// Product Category Interface
export interface ProductCategory {
    /** Category ID */
    id: number;
    /** Category name */
    name: string;
    /** Category slug */
    slug: string;
}

// Product Tag Interface
export interface ProductTag {
    /** Tag ID */
    id: number;
    /** Tag name */
    name: string;
    /** Tag slug */
    slug: string;
}

// Product Attribute Interface
export interface ProductAttribute {
    /** Attribute ID */
    id: number;
    /** Attribute name */
    name: string;
    /** Attribute position */
    position: number;
    /** Whether the attribute is visible on the product page */
    visible: boolean;
    /** Whether the attribute can be used for variations */
    variation: boolean;
    /** List of available term names of the attribute */
    options: string[];
}

// Product Default Attribute Interface
export interface ProductDefaultAttribute {
    /** Attribute ID */
    id: number;
    /** Attribute name */
    name: string;
    /** Selected attribute term name */
    option: string;
}

// Product Download Interface
export interface ProductDownload {
    /** File ID */
    id: string;
    /** File name */
    name: string;
    /** File URL */
    file: string;
}

// Product Meta Data Interface
export interface ProductMetaData {
    /** Meta ID */
    id: number;
    /** Meta key */
    key: string;
    /** Meta value */
    value: string;
}

// Base Product Interface
export interface WooProduct {
    /** Unique identifier for the product */
    id: number;
    /** Shop ID for multi-shop support */
    shop_id?: number;
    /** Product name */
    name: string;
    /** Product slug */
    slug: string;
    /** Product permalink */
    permalink: string;
    /** The date the product was created, in the site's timezone */
    date_created: string;
    /** The date the product was created, as GMT */
    date_created_gmt: string;
    /** The date the product was last modified, in the site's timezone */
    date_modified: string;
    /** The date the product was last modified, as GMT */
    date_modified_gmt: string;
    /** Product type */
    type: ProductType;
    /** Product status */
    status: ProductStatus;
    /** Featured product */
    featured: boolean;
    /** Catalog visibility */
    catalog_visibility: CatalogVisibility;
    /** Product description */
    description: string;
    /** Product short description */
    short_description: string;
    /** Unique identifier */
    sku: string;
    /** Product regular price */
    price: string;
    /** Product regular price */
    regular_price: string;
    /** Product sale price */
    sale_price: string;
    /** Start date of sale price, in the site's timezone */
    date_on_sale_from: string;
    /** Start date of sale price, as GMT */
    date_on_sale_from_gmt: string;
    /** End date of sale price, in the site's timezone */
    date_on_sale_to: string;
    /** End date of sale price, as GMT */
    date_on_sale_to_gmt: string;
    /** Shows if the product is on sale */
    on_sale: boolean;
    /** Shows if the product can be bought */
    purchasable: boolean;
    /** Amount of sales */
    total_sales: number;
    /** If the product is virtual */
    virtual: boolean;
    /** If the product is downloadable */
    downloadable: boolean;
    /** List of downloadable files */
    downloads: ProductDownload[];
    /** Number of times downloadable files can be downloaded after purchase */
    download_limit: number;
    /** Number of days until access to downloadable files expires */
    download_expiry: number;
    /** Product external URL. Only for external products */
    external_url: string;
    /** Product external button text. Only for external products */
    button_text: string;
    /** Tax status */
    tax_status: TaxStatus;
    /** Tax class */
    tax_class: string;
    /** Stock management at product level */
    manage_stock: boolean;
    /** Stock quantity */
    stock_quantity: number;
    /** Controls the stock status of the product */
    stock_status: StockStatus;
    /** If managing stock, this controls if backorders are allowed */
    backorders: BackorderStatus;
    /** Shows if backorders are allowed */
    backorders_allowed: boolean;
    /** Shows if the product is on backorder */
    backordered: boolean;
    /** Limit one per order */
    sold_individually: boolean;
    /** Product weight */
    weight: string;
    /** Product dimensions */
    dimensions: ProductDimensions;
    /** Shows if the product need to be shipped */
    shipping_required: boolean;
    /** Shows whether or not the product is shipped to the customer */
    shipping_taxable: boolean;
    /** Shipping class slug */
    shipping_class: string;
    /** Shipping class ID */
    shipping_class_id: number;
    /** Allow reviews */
    reviews_allowed: boolean;
    /** Reviews average rating */
    average_rating: string;
    /** Amount of reviews that the product has */
    rating_count: number;
    /** List of up-sell products IDs */
    upsell_ids: number[];
    /** List of cross-sell products IDs */
    cross_sell_ids: number[];
    /** Product parent ID */
    parent_id: number;
    /** Optional note to send the customer after purchase */
    purchase_note: string;
    /** List of categories */
    categories: ProductCategory[];
    /** List of tags */
    tags: ProductTag[];
    /** List of images */
    images: ProductImage[];
    /** List of attributes */
    attributes: ProductAttribute[];
    /** Defaults variation attributes */
    default_attributes: ProductDefaultAttribute[];
    /** List of variations IDs */
    variations: number[];
    /** List of grouped products ID */
    grouped_products: number[];
    /** Menu order, used to custom sort products */
    menu_order: number;
    /** List of related products IDs */
    related_ids: number[];
    /** Meta data */
    meta_data: ProductMetaData[];
    /** Product URL */
    _links: {
        self: Array<{ href: string }>;
        collection: Array<{ href: string }>;
    };
}

// Interface for creating products
export interface WooProductCreate {
    /** Product name */
    name: string;
    /** Shop ID for multi-shop support */
    shop_id?: number;
    /** Product slug */
    slug?: string;
    /** Product type */
    type?: ProductType;
    /** Product status */
    status?: ProductStatus;
    /** Featured product */
    featured?: boolean;
    /** Catalog visibility */
    catalog_visibility?: CatalogVisibility;
    /** Product description */
    description?: string;
    /** Product short description */
    short_description?: string;
    /** Unique identifier */
    sku?: string;
    /** Product regular price */
    regular_price?: string;
    /** Product sale price */
    sale_price?: string;
    /** Start date of sale price, in the site's timezone */
    date_on_sale_from?: string;
    /** Start date of sale price, as GMT */
    date_on_sale_from_gmt?: string;
    /** End date of sale price, in the site's timezone */
    date_on_sale_to?: string;
    /** End date of sale price, as GMT */
    date_on_sale_to_gmt?: string;
    /** If the product is virtual */
    virtual?: boolean;
    /** If the product is downloadable */
    downloadable?: boolean;
    /** List of downloadable files */
    downloads?: ProductDownload[];
    /** Number of times downloadable files can be downloaded after purchase */
    download_limit?: number;
    /** Number of days until access to downloadable files expires */
    download_expiry?: number;
    /** Product external URL. Only for external products */
    external_url?: string;
    /** Product external button text. Only for external products */
    button_text?: string;
    /** Tax status */
    tax_status?: TaxStatus;
    /** Tax class */
    tax_class?: string;
    /** Stock management at product level */
    manage_stock?: boolean;
    /** Stock quantity */
    stock_quantity?: number;
    /** Controls the stock status of the product */
    stock_status?: StockStatus;
    /** If managing stock, this controls if backorders are allowed */
    backorders?: BackorderStatus;
    /** Limit one per order */
    sold_individually?: boolean;
    /** Product weight */
    weight?: string;
    /** Product dimensions */
    dimensions?: ProductDimensions;
    /** Shipping class slug */
    shipping_class?: string;
    /** Allow reviews */
    reviews_allowed?: boolean;
    /** List of up-sell products IDs */
    upsell_ids?: number[];
    /** List of cross-sell products IDs */
    cross_sell_ids?: number[];
    /** Product parent ID */
    parent_id?: number;
    /** Optional note to send the customer after purchase */
    purchase_note?: string;
    /** List of categories */
    categories?: ProductCategory[];
    /** List of tags */
    tags?: ProductTag[];
    /** List of images */
    images?: ProductImage[];
    /** List of attributes */
    attributes?: ProductAttribute[];
    /** Defaults variation attributes */
    default_attributes?: ProductDefaultAttribute[];
    /** Menu order, used to custom sort products */
    menu_order?: number;
    /** Meta data */
    meta_data?: ProductMetaData[];
}

// Interface for updating products
export interface WooProductUpdate {
    /** Product name */
    name?: string;
    /** Shop ID for multi-shop support */
    shop_id?: number;
    /** Product slug */
    slug?: string;
    /** Product type */
    type?: ProductType;
    /** Product status */
    status?: ProductStatus;
    /** Featured product */
    featured?: boolean;
    /** Catalog visibility */
    catalog_visibility?: CatalogVisibility;
    /** Product description */
    description?: string;
    /** Product short description */
    short_description?: string;
    /** Unique identifier */
    sku?: string;
    /** Product regular price */
    regular_price?: string;
    /** Product sale price */
    sale_price?: string;
    /** Start date of sale price, in the site's timezone */
    date_on_sale_from?: string;
    /** Start date of sale price, as GMT */
    date_on_sale_from_gmt?: string;
    /** End date of sale price, in the site's timezone */
    date_on_sale_to?: string;
    /** End date of sale price, as GMT */
    date_on_sale_to_gmt?: string;
    /** If the product is virtual */
    virtual?: boolean;
    /** If the product is downloadable */
    downloadable?: boolean;
    /** List of downloadable files */
    downloads?: ProductDownload[];
    /** Number of times downloadable files can be downloaded after purchase */
    download_limit?: number;
    /** Number of days until access to downloadable files expires */
    download_expiry?: number;
    /** Product external URL. Only for external products */
    external_url?: string;
    /** Product external button text. Only for external products */
    button_text?: string;
    /** Tax status */
    tax_status?: TaxStatus;
    /** Tax class */
    tax_class?: string;
    /** Stock management at product level */
    manage_stock?: boolean;
    /** Stock quantity */
    stock_quantity?: number;
    /** Controls the stock status of the product */
    stock_status?: StockStatus;
    /** If managing stock, this controls if backorders are allowed */
    backorders?: BackorderStatus;
    /** Limit one per order */
    sold_individually?: boolean;
    /** Product weight */
    weight?: string;
    /** Product dimensions */
    dimensions?: ProductDimensions;
    /** Shipping class slug */
    shipping_class?: string;
    /** Allow reviews */
    reviews_allowed?: boolean;
    /** List of up-sell products IDs */
    upsell_ids?: number[];
    /** List of cross-sell products IDs */
    cross_sell_ids?: number[];
    /** Product parent ID */
    parent_id?: number;
    /** Optional note to send the customer after purchase */
    purchase_note?: string;
    /** List of categories */
    categories?: ProductCategory[];
    /** List of tags */
    tags?: ProductTag[];
    /** List of images */
    images?: ProductImage[];
    /** List of attributes */
    attributes?: ProductAttribute[];
    /** Defaults variation attributes */
    default_attributes?: ProductDefaultAttribute[];
    /** Menu order, used to custom sort products */
    menu_order?: number;
    /** Meta data */
    meta_data?: ProductMetaData[];
}

// Interface for querying products
export interface WooProductQuery {
    /** Scope under which the request is made; determines fields present in response */
    context?: "view" | "edit";
    /** Current page of the collection */
    page?: number;
    /** Maximum number of items to be returned in result set */
    per_page?: number;
    /** Limit results to those matching a string */
    search?: string;
    /** Limit response to products published after a given ISO8601 compliant date */
    after?: string;
    /** Limit response to products published before a given ISO8601 compliant date */
    before?: string;
    /** Limit response to products modified after a given ISO8601 compliant date */
    modified_after?: string;
    /** Limit response to products modified before a given ISO8601 compliant date */
    modified_before?: string;
    /** Limit response to products with specific dates */
    dates_are_gmt?: boolean;
    /** Ensure result set excludes specific IDs */
    exclude?: number[];
    /** Limit result set to specific IDs */
    include?: number[];
    /** Offset the result set by a specific number of items */
    offset?: number;
    /** Order sort attribute ascending or descending */
    order?: "asc" | "desc";
    /** Sort collection by product attribute */
    orderby?:
        | "date"
        | "id"
        | "include"
        | "title"
        | "slug"
        | "price"
        | "popularity"
        | "rating"
        | "date_modified"
        | "menu_order";
    /** Limit result set to products assigned to a specific parent ID */
    parent?: number[];
    /** Limit result set to products assigned to a specific parent ID, excluding the specified IDs */
    parent_exclude?: number[];
    /** Limit result set to products with a specific slug */
    slug?: string;
    /** Limit result set to products assigned a specific status */
    status?: ProductStatus;
    /** Limit result set to products assigned a specific type */
    type?: ProductType;
    /** Limit result set to products with a specific SKU */
    sku?: string;
    /** Limit result set to featured products */
    featured?: boolean;
    /** Limit result set to products assigned a specific category ID */
    category?: string;
    /** Limit result set to products assigned a specific tag ID */
    tag?: string;
    /** Limit result set to products assigned a specific shipping class ID */
    shipping_class?: string;
    /** Limit result set to products with a specific attribute */
    attribute?: string;
    /** Limit result set to products with a specific attribute term ID (required an assigned attribute) */
    attribute_term?: string;
    /** Limit result set to products with a specific tax class */
    tax_class?: string;
    /** Limit result set to products on sale */
    on_sale?: boolean;
    /** Limit result set to products based on a minimum price */
    min_price?: string;
    /** Limit result set to products based on a maximum price */
    max_price?: string;
    /** Limit result set to products with a specific stock status */
    stock_status?: StockStatus;
}

// Interface for batch operations
export interface WooProductBatch {
    /** Products to be created */
    create?: WooProductCreate[];
    /** Products to be updated */
    update?: Array<WooProductUpdate & { id: number }>;
    /** Products to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductBatchResponse {
    /** Created products */
    create?: WooProduct[];
    /** Updated products */
    update?: WooProduct[];
    /** Deleted products */
    delete?: WooProduct[];
}

export class WooProducts {
    /**
     * Get a specific product by ID
     * @param productId - Product ID
     * @returns Product data
     */
    static async getProductById(productId: number): Promise<WooProduct> {
        const url = buildWooUrl(`/products/${productId}`);
        const response = await fetch(url, {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get product: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Create a new product
     * @param productData - Product data
     * @returns Created product data
     */
    static async createProduct(
        productData: Partial<WooProduct>,
    ): Promise<WooProduct> {
        const url = buildWooUrl("/products");
        const response = await fetch(url, {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(productData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("WooCommerce API Error:", {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                productData: JSON.stringify(productData, null, 2),
            });
            throw new Error(
                `Failed to create product: ${response.status} - ${errorText}`,
            );
        }

        return response.json();
    }

    /**
     * Get all products with optional filtering
     * @param params - Query parameters for filtering
     * @returns Array of products
     */
    static async getAllProducts(
        params?: WooProductQuery,
    ): Promise<WooProduct[]> {
        const url = buildWooUrl("/products", params);
        const response = await fetch(url, {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to get products: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update an existing product
     * @param productId - Product ID
     * @param productData - Updated product data
     * @returns Updated product data
     */
    static async updateProduct(
        productId: number,
        productData: Partial<WooProduct>,
    ): Promise<WooProduct> {
        const url = buildWooUrl(`/products/${productId}`);
        const response = await fetch(url, {
            method: "PUT",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(productData),
        });

        if (!response.ok) {
            throw new Error(`Failed to update product: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product
     * @param productId - Product ID
     * @param force - Whether to force delete (bypass trash)
     * @returns Deleted product data
     */
    static async deleteProduct(
        productId: number,
        force: boolean = false,
    ): Promise<WooProduct> {
        const url = buildWooUrl(`/products/${productId}`, { force });
        const response = await fetch(url, {
            method: "DELETE",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete product: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Batch operations for products
     * @param batchData - Batch operation data
     * @returns Batch operation results
     */
    static async batchProducts(
        batchData: WooProductBatch,
    ): Promise<WooProductBatchResponse> {
        const url = buildWooUrl("/products/batch");
        const response = await fetch(url, {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(batchData),
        });

        if (!response.ok) {
            throw new Error(`Failed to batch products: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Search products by name or description
     * @param searchTerm - Term to search for
     * @param query - Optional additional query parameters
     */
    static async searchProducts(
        searchTerm: string,
        query?: Omit<WooProductQuery, "search">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({ ...query, search: searchTerm });
    }

    /**
     * Get products by category
     * @param categoryId - Category ID to filter by
     * @param query - Optional additional query parameters
     */
    static async getProductsByCategory(
        categoryId: number,
        query?: Omit<WooProductQuery, "category">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({
            ...query,
            category: categoryId.toString(),
        });
    }

    /**
     * Get products by tag
     * @param tagId - Tag ID to filter by
     * @param query - Optional additional query parameters
     */
    static async getProductsByTag(
        tagId: number,
        query?: Omit<WooProductQuery, "tag">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({ ...query, tag: tagId.toString() });
    }

    /**
     * Get featured products
     * @param query - Optional query parameters
     */
    static async getFeaturedProducts(
        query?: Omit<WooProductQuery, "featured">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({ ...query, featured: true });
    }

    /**
     * Get products on sale
     * @param query - Optional query parameters
     */
    static async getOnSaleProducts(
        query?: Omit<WooProductQuery, "on_sale">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({ ...query, on_sale: true });
    }

    /**
     * Get products by price range
     * @param minPrice - Minimum price
     * @param maxPrice - Maximum price
     * @param query - Optional additional query parameters
     */
    static async getProductsByPriceRange(
        minPrice: string,
        maxPrice: string,
        query?: Omit<WooProductQuery, "min_price" | "max_price">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({
            ...query,
            min_price: minPrice,
            max_price: maxPrice,
        });
    }

    /**
     * Get products by stock status
     * @param stockStatus - Stock status to filter by
     * @param query - Optional additional query parameters
     */
    static async getProductsByStockStatus(
        stockStatus: StockStatus,
        query?: Omit<WooProductQuery, "stock_status">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({
            ...query,
            stock_status: stockStatus,
        });
    }

    /**
     * Get products by type
     * @param type - Product type to filter by
     * @param query - Optional additional query parameters
     */
    static async getProductsByType(
        type: ProductType,
        query?: Omit<WooProductQuery, "type">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({ ...query, type });
    }

    /**
     * Get products by SKU
     * @param sku - SKU to search for
     * @param query - Optional additional query parameters
     */
    static async getProductsBySKU(
        sku: string,
        query?: Omit<WooProductQuery, "sku">,
    ): Promise<WooProduct[]> {
        return await this.getAllProducts({ ...query, sku });
    }

    /**
     * Check stock availability for a list of product and quantity pairs
     * Returns whether all are fulfillable and which are not, including available quantity
     */
    static async checkStockAvailability(
        items: Array<{ product_id: number; quantity: number }>,
    ): Promise<{
        all_in_stock: boolean;
        not_fullfilable: Array<{
            product_id: number;
            in_stock_quantity: number;
        }>;
    }> {
        if (!items || items.length === 0) {
            return { all_in_stock: true, not_fullfilable: [] };
        }

        const uniqueIds = Array.from(new Set(items.map((i) => i.product_id)));

        // Fetch products in one or more requests if needed (per_page capped to 100 typically)
        const fetchedProducts: WooProduct[] = [];
        const chunkSize = 100;
        for (let i = 0; i < uniqueIds.length; i += chunkSize) {
            const chunk = uniqueIds.slice(i, i + chunkSize);
            const chunkProducts = await this.getAllProducts({
                include: chunk,
                per_page: Math.min(chunk.length, chunkSize),
                page: 1,
            });
            fetchedProducts.push(...chunkProducts);
        }

        const idToProduct = new Map<number, WooProduct>();
        for (const p of fetchedProducts) idToProduct.set(p.id, p);

        const notFullfilable: Array<{
            product_id: number;
            in_stock_quantity: number;
        }> = [];

        for (const item of items) {
            const product = idToProduct.get(item.product_id);

            // If product not found, treat as zero stock
            if (!product) {
                notFullfilable.push({
                    product_id: item.product_id,
                    in_stock_quantity: 0,
                });
                continue;
            }

            // Determine available quantity
            const manageStock = !!product.manage_stock;
            const backordersAllowed = !!product.backorders_allowed;
            const isInStock = product.stock_status === StockStatus.IN_STOCK;
            const rawQty = typeof product.stock_quantity === "number"
                ? product.stock_quantity
                : 0;

            let available: number;
            if (manageStock) {
                // If managing stock and backorders are allowed, treat as fulfillable
                if (backordersAllowed) {
                    available = Number.POSITIVE_INFINITY;
                } else {
                    available = Math.max(0, rawQty);
                }
            } else {
                // Not managing stock: rely on stock_status only
                available = isInStock ? Number.POSITIVE_INFINITY : 0;
            }

            const fulfillable = item.quantity <= available;
            if (!fulfillable) {
                const inStockQtyForReport = manageStock
                    ? Math.max(0, rawQty)
                    : 0;
                notFullfilable.push({
                    product_id: item.product_id,
                    in_stock_quantity: inStockQtyForReport,
                });
            }
        }

        return {
            all_in_stock: notFullfilable.length === 0,
            not_fullfilable: notFullfilable,
        };
    }
}
