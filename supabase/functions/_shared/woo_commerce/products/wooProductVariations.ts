/**
 * WooCommerce Product Variations API
 * Handles all product variation-related operations for WooCommerce REST API
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";
import {
    BackorderStatus,
    ProductDimensions,
    ProductDownload,
    ProductImage,
    ProductMetaData,
    StockStatus,
    TaxStatus,
} from "./wooProducts.ts";

// Product variation attribute interface
export interface VariationAttribute {
    id: number;
    name: string;
    option: string;
}

// Product variation interface
export interface WooProductVariation {
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    description: string;
    permalink: string;
    sku: string;
    price: string;
    regular_price: string;
    sale_price: string;
    date_on_sale_from: string | null;
    date_on_sale_from_gmt: string | null;
    date_on_sale_to: string | null;
    date_on_sale_to_gmt: string | null;
    on_sale: boolean;
    status: "publish" | "private" | "draft";
    purchasable: boolean;
    virtual: boolean;
    downloadable: boolean;
    downloads: ProductDownload[];
    download_limit: number;
    download_expiry: number;
    tax_status: TaxStatus;
    tax_class: string;
    manage_stock: boolean;
    stock_quantity: number | null;
    stock_status: StockStatus;
    backorders: BackorderStatus;
    backorders_allowed: boolean;
    backordered: boolean;
    low_stock_amount: number | null;
    weight: string;
    dimensions: ProductDimensions;
    shipping_class: string;
    shipping_class_id: number;
    image: ProductImage;
    attributes: VariationAttribute[];
    menu_order: number;
    meta_data: ProductMetaData[];
}

// Product variation creation/update interface
export interface WooProductVariationCreate {
    description?: string;
    sku?: string;
    regular_price?: string;
    sale_price?: string;
    date_on_sale_from?: string;
    date_on_sale_to?: string;
    status?: "publish" | "private" | "draft";
    virtual?: boolean;
    downloadable?: boolean;
    downloads?: ProductDownload[];
    download_limit?: number;
    download_expiry?: number;
    tax_status?: TaxStatus;
    tax_class?: string;
    manage_stock?: boolean;
    stock_quantity?: number;
    stock_status?: StockStatus;
    backorders?: BackorderStatus;
    weight?: string;
    dimensions?: ProductDimensions;
    shipping_class?: string;
    image?: Partial<ProductImage>;
    attributes?: VariationAttribute[];
    menu_order?: number;
    meta_data?: Omit<ProductMetaData, "id">[];
}

// Product variation query parameters
export interface WooProductVariationQuery {
    page?: number;
    per_page?: number;
    search?: string;
    after?: string;
    before?: string;
    exclude?: number[];
    include?: number[];
    offset?: number;
    order?: "asc" | "desc";
    orderby?:
        | "date"
        | "id"
        | "include"
        | "title"
        | "slug"
        | "price"
        | "popularity"
        | "rating";
    parent?: number[];
    parent_exclude?: number[];
    slug?: string;
    status?: "publish" | "private" | "draft";
    sku?: string;
    tax_class?: string;
    on_sale?: boolean;
    min_price?: string;
    max_price?: string;
    stock_status?: StockStatus;
}

export class WooProductVariations {
    /**
     * Create a new product variation
     * @param productId - ID of the product
     * @param variationData - Data for the new variation
     * @returns Created variation data
     */
    static async createProductVariation(
        productId: number,
        variationData: WooProductVariationCreate,
    ): Promise<WooProductVariation> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/variations`),
            {
                method: "POST",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(variationData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific product variation by ID
     * @param productId - ID of the product
     * @param variationId - ID of the variation to retrieve
     * @param query - Optional query parameters
     * @returns Variation data
     */
    static async getProductVariation(
        productId: number,
        variationId: number,
        query?: WooProductVariationQuery,
    ): Promise<WooProductVariation> {
        const response = await fetch(
            buildWooUrl(
                `/products/${productId}/variations/${variationId}`,
                query,
            ),
            {
                method: "GET",
                headers: getWooAuthHeaders(),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get all product variations for a product
     * @param productId - ID of the product
     * @param query - Optional query parameters
     * @returns Array of variations
     */
    static async getProductVariations(
        productId: number,
        query?: WooProductVariationQuery,
    ): Promise<WooProductVariation[]> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/variations`, query),
            {
                method: "GET",
                headers: getWooAuthHeaders(),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update a product variation
     * @param productId - ID of the product
     * @param variationId - ID of the variation to update
     * @param variationData - Data to update the variation with
     * @returns Updated variation data
     */
    static async updateProductVariation(
        productId: number,
        variationId: number,
        variationData: WooProductVariationCreate,
    ): Promise<WooProductVariation> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/variations/${variationId}`),
            {
                method: "PUT",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(variationData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product variation
     * @param productId - ID of the product
     * @param variationId - ID of the variation to delete
     * @param force - Whether to bypass trash and force deletion
     * @returns Deleted variation data
     */
    static async deleteProductVariation(
        productId: number,
        variationId: number,
        force: boolean = false,
    ): Promise<WooProductVariation> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/variations/${variationId}`, {
                force,
            }),
            {
                method: "DELETE",
                headers: getWooAuthHeaders(),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Batch create/update/delete product variations
     * @param productId Parent product ID
     * @param data Batch operation data
     * @returns Promise<{ create: WooProductVariation[]; update: WooProductVariation[]; delete: { id: number; message: string }[] }>
     */
    static async batchProductVariations(
        productId: number,
        data: {
            create?: WooProductVariationCreate[];
            update?: (Partial<WooProductVariationCreate> & { id: number })[];
            delete?: number[];
        },
    ): Promise<{
        create: WooProductVariation[];
        update: WooProductVariation[];
        delete: { id: number; message: string }[];
    }> {
        const url = buildWooUrl(`products/${productId}/variations/batch`);
        const response = await fetch(url, {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to batch product variations: ${response.statusText}`,
            );
        }

        return response.json();
    }

    /**
     * Get variations by specific attribute
     * @param productId Parent product ID
     * @param attributeName Attribute name (e.g., 'Color', 'Size')
     * @param attributeValue Attribute value (e.g., 'Red', 'Large')
     * @returns Promise<WooProductVariation[]>
     */
    static async getVariationsByAttribute(
        productId: number,
        attributeName: string,
        attributeValue: string,
    ): Promise<WooProductVariation[]> {
        const variations = await this.getProductVariations(productId);
        return variations.filter((variation) =>
            variation.attributes.some((attr) =>
                attr.name.toLowerCase() === attributeName.toLowerCase() &&
                attr.option.toLowerCase() === attributeValue.toLowerCase()
            )
        );
    }

    /**
     * Get variations by multiple attributes
     * @param productId Parent product ID
     * @param attributes Map of attribute names to values
     * @returns Promise<WooProductVariation[]>
     */
    static async getVariationsByAttributes(
        productId: number,
        attributes: Record<string, string>,
    ): Promise<WooProductVariation[]> {
        const variations = await this.getProductVariations(productId);
        return variations.filter((variation) =>
            Object.entries(attributes).every(([attrName, attrValue]) =>
                variation.attributes.some((attr) =>
                    attr.name.toLowerCase() === attrName.toLowerCase() &&
                    attr.option.toLowerCase() === attrValue.toLowerCase()
                )
            )
        );
    }

    /**
     * Get variations in stock
     * @param productId Parent product ID
     * @returns Promise<WooProductVariation[]>
     */
    static async getVariationsInStock(
        productId: number,
    ): Promise<WooProductVariation[]> {
        return this.getProductVariations(productId, {
            stock_status: StockStatus.IN_STOCK,
        });
    }

    /**
     * Get variations on sale
     * @param productId Parent product ID
     * @returns Promise<WooProductVariation[]>
     */
    static async getVariationsOnSale(
        productId: number,
    ): Promise<WooProductVariation[]> {
        return this.getProductVariations(productId, { on_sale: true });
    }

    /**
     * Update variation stock
     * @param productId Parent product ID
     * @param variationId Variation ID
     * @param stockQuantity New stock quantity
     * @param stockStatus New stock status
     * @returns Promise<WooProductVariation>
     */
    static async updateVariationStock(
        productId: number,
        variationId: number,
        stockQuantity: number,
        stockStatus: StockStatus = StockStatus.IN_STOCK,
    ): Promise<WooProductVariation> {
        return this.updateProductVariation(productId, variationId, {
            stock_quantity: stockQuantity,
            stock_status: stockStatus,
            manage_stock: true,
        });
    }

    /**
     * Update variation price
     * @param productId Parent product ID
     * @param variationId Variation ID
     * @param regularPrice Regular price
     * @param salePrice Sale price (optional)
     * @returns Promise<WooProductVariation>
     */
    static async updateVariationPrice(
        productId: number,
        variationId: number,
        regularPrice: string,
        salePrice?: string,
    ): Promise<WooProductVariation> {
        const updateData: Partial<WooProductVariationCreate> = {
            regular_price: regularPrice,
        };

        if (salePrice) {
            updateData.sale_price = salePrice;
        }

        return this.updateProductVariation(productId, variationId, updateData);
    }
}

export default WooProductVariations;
