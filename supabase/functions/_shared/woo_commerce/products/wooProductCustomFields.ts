/**
 * WooCommerce Product Custom Fields API
 * Handles product custom fields (meta data) management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#product-meta-data
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Base Product Custom Field Interface
export interface WooProductCustomField {
    /** Meta ID */
    id: number;
    /** Meta key */
    key: string;
    /** Meta value */
    value: string | number | boolean | object;
    /** Meta value display key, for custom fields */
    display_key?: string;
    /** Meta value display value, for custom fields */
    display_value?: string;
}

// Interface for creating/updating product custom fields
export interface WooProductCustomFieldCreate {
    /** Meta key */
    key: string;
    /** Meta value */
    value: string | number | boolean | object;
}

// Interface for updating product custom fields
export interface WooProductCustomFieldUpdate {
    /** Meta ID */
    id?: number;
    /** Meta key */
    key?: string;
    /** Meta value */
    value?: string | number | boolean | object;
}

// Interface for querying product custom fields
export interface WooProductCustomFieldQuery {
    /** Scope under which the request is made; determines fields present in response */
    context?: "view" | "edit";
    /** Current page of the collection */
    page?: number;
    /** Maximum number of items to be returned in result set */
    per_page?: number;
    /** Limit results to those matching a string */
    search?: string;
    /** Ensure result set excludes specific IDs */
    exclude?: number[];
    /** Limit result set to specific IDs */
    include?: number[];
    /** Order sort attribute ascending or descending */
    order?: "asc" | "desc";
    /** Sort collection by meta attribute */
    orderby?: "id" | "include" | "key" | "value";
    /** Limit result set to custom fields with a specific key */
    key?: string;
    /** Limit result set to custom fields with a specific value */
    value?: string;
}

// Interface for batch operations
export interface WooProductCustomFieldBatch {
    /** Product custom fields to be created */
    create?: WooProductCustomFieldCreate[];
    /** Product custom fields to be updated */
    update?: Array<WooProductCustomFieldUpdate & { id: number }>;
    /** Product custom fields to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductCustomFieldBatchResponse {
    /** Created product custom fields */
    create?: WooProductCustomField[];
    /** Updated product custom fields */
    update?: WooProductCustomField[];
    /** Deleted product custom fields */
    delete?: WooProductCustomField[];
}

// Common custom field types for WooCommerce products
export enum CommonCustomFieldKeys {
    // Product fields
    PRODUCT_SUBTITLE = "_product_subtitle",
    PRODUCT_VIDEO_URL = "_product_video_url",
    PRODUCT_BADGE = "_product_badge",
    PRODUCT_GALLERY_LIMIT = "_product_gallery_limit",

    // SEO fields
    SEO_TITLE = "_yoast_wpseo_title",
    SEO_DESCRIPTION = "_yoast_wpseo_metadesc",
    SEO_KEYWORDS = "_yoast_wpseo_focuskw",
    SEO_CANONICAL = "_yoast_wpseo_canonical",

    // Shipping fields
    SHIPPING_CLASS = "_shipping_class",
    SHIPPING_LENGTH = "_length",
    SHIPPING_WIDTH = "_width",
    SHIPPING_HEIGHT = "_height",
    SHIPPING_WEIGHT = "_weight",

    // Inventory fields
    MANAGE_STOCK = "_manage_stock",
    STOCK_QUANTITY = "_stock",
    STOCK_STATUS = "_stock_status",
    BACKORDERS = "_backorders",
    LOW_STOCK_AMOUNT = "_low_stock_amount",

    // Pricing fields
    REGULAR_PRICE = "_regular_price",
    SALE_PRICE = "_sale_price",
    SALE_PRICE_FROM = "_sale_price_dates_from",
    SALE_PRICE_TO = "_sale_price_dates_to",

    // Download fields
    DOWNLOAD_LIMIT = "_download_limit",
    DOWNLOAD_EXPIRY = "_download_expiry",
    DOWNLOADABLE = "_downloadable",
    VIRTUAL = "_virtual",

    // Custom fields
    CUSTOM_FIELD_1 = "_custom_field_1",
    CUSTOM_FIELD_2 = "_custom_field_2",
    CUSTOM_FIELD_3 = "_custom_field_3",
    CUSTOM_FIELD_4 = "_custom_field_4",
    CUSTOM_FIELD_5 = "_custom_field_5",
}

export class WooProductCustomFields {
    /**
     * Create a new product custom field
     * @param productId - ID of the product
     * @param customFieldData - Data for the new custom field
     * @returns Created custom field data
     */
    static async createProductCustomField(
        productId: number,
        customFieldData: WooProductCustomFieldCreate,
    ): Promise<WooProductCustomField> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/meta`),
            {
                method: "POST",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(customFieldData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific product custom field by ID
     * @param productId - ID of the product
     * @param customFieldId - ID of the custom field to retrieve
     * @param query - Optional query parameters
     * @returns Custom field data
     */
    static async getProductCustomField(
        productId: number,
        customFieldId: number,
        query?: WooProductCustomFieldQuery,
    ): Promise<WooProductCustomField> {
        const response = await fetch(
            buildWooUrl(
                `/products/${productId}/meta/${customFieldId}`,
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
     * Get all product custom fields
     * @param productId - ID of the product
     * @param query - Optional query parameters
     * @returns Array of custom fields
     */
    static async getProductCustomFields(
        productId: number,
        query?: WooProductCustomFieldQuery,
    ): Promise<WooProductCustomField[]> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/meta`, query),
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
     * Update a product custom field
     * @param productId - ID of the product
     * @param customFieldId - ID of the custom field to update
     * @param customFieldData - Data to update the custom field with
     * @returns Updated custom field data
     */
    static async updateProductCustomField(
        productId: number,
        customFieldId: number,
        customFieldData: WooProductCustomFieldUpdate,
    ): Promise<WooProductCustomField> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/meta/${customFieldId}`),
            {
                method: "PUT",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(customFieldData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product custom field
     * @param productId - ID of the product
     * @param customFieldId - ID of the custom field to delete
     * @param force - Whether to bypass trash and force deletion
     * @returns Deleted custom field data
     */
    static async deleteProductCustomField(
        productId: number,
        customFieldId: number,
        force: boolean = false,
    ): Promise<WooProductCustomField> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/meta/${customFieldId}`, {
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
     * Batch create, update, and delete product custom fields
     * @param productId - ID of the product
     * @param batchData - Batch operation data
     * @returns Batch operation results
     */
    static async batchProductCustomFields(
        productId: number,
        batchData: WooProductCustomFieldBatch,
    ): Promise<WooProductCustomFieldBatchResponse> {
        const response = await fetch(
            buildWooUrl(`/products/${productId}/meta/batch`),
            {
                method: "POST",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(batchData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get product custom fields by key
     * @param productId - ID of the product
     * @param key - Custom field key to search for
     */
    static async getProductCustomFieldsByKey(
        productId: number,
        key: string,
    ): Promise<WooProductCustomField[]> {
        const customFields = await this.getProductCustomFields(productId);
        return customFields.filter((field) => field.key === key);
    }

    /**
     * Get product custom field value by key
     * @param productId - ID of the product
     * @param key - Custom field key to get value for
     */
    static async getProductCustomFieldValueByKey(
        productId: number,
        key: string,
    ): Promise<string | number | boolean | object | null> {
        const customFields = await this.getProductCustomFieldsByKey(
            productId,
            key,
        );
        return customFields.length > 0 ? customFields[0].value : null;
    }

    /**
     * Set product custom field value by key (creates if doesn't exist, updates if exists)
     * @param productId - ID of the product
     * @param key - Custom field key
     * @param value - Custom field value
     */
    static async setProductCustomFieldValueByKey(
        productId: number,
        key: string,
        value: string | number | boolean | object,
    ): Promise<WooProductCustomField> {
        const existingFields = await this.getProductCustomFieldsByKey(
            productId,
            key,
        );

        if (existingFields.length > 0) {
            // Update existing field
            return this.updateProductCustomField(
                productId,
                existingFields[0].id,
                { value },
            );
        } else {
            // Create new field
            return this.createProductCustomField(productId, { key, value });
        }
    }

    /**
     * Delete product custom field by key
     * @param productId - ID of the product
     * @param key - Custom field key to delete
     */
    static async deleteProductCustomFieldByKey(
        productId: number,
        key: string,
    ): Promise<WooProductCustomField[]> {
        const customFields = await this.getProductCustomFieldsByKey(
            productId,
            key,
        );
        const deletedFields: WooProductCustomField[] = [];

        for (const field of customFields) {
            const deleted = await this.deleteProductCustomField(
                productId,
                field.id,
            );
            deletedFields.push(deleted);
        }

        return deletedFields;
    }

    /**
     * Get product custom fields with specific value
     * @param productId - ID of the product
     * @param value - Custom field value to search for
     */
    static async getProductCustomFieldsByValue(
        productId: number,
        value: string | number | boolean | object,
    ): Promise<WooProductCustomField[]> {
        const customFields = await this.getProductCustomFields(productId);
        return customFields.filter((field) => field.value === value);
    }

    /**
     * Get product SEO custom fields
     * @param productId - ID of the product
     */
    static async getProductSEOCustomFields(
        productId: number,
    ): Promise<WooProductCustomField[]> {
        const customFields = await this.getProductCustomFields(productId);
        return customFields.filter((field) =>
            field.key.startsWith("_yoast_wpseo_") ||
            field.key.startsWith("_seo_")
        );
    }

    /**
     * Get product shipping custom fields
     * @param productId - ID of the product
     */
    static async getProductShippingCustomFields(
        productId: number,
    ): Promise<WooProductCustomField[]> {
        const shippingKeys = [
            "_length",
            "_width",
            "_height",
            "_weight",
            "_shipping_class",
        ];
        const customFields = await this.getProductCustomFields(productId);
        return customFields.filter((field) => shippingKeys.includes(field.key));
    }

    /**
     * Get product inventory custom fields
     * @param productId - ID of the product
     */
    static async getProductInventoryCustomFields(
        productId: number,
    ): Promise<WooProductCustomField[]> {
        const inventoryKeys = [
            "_manage_stock",
            "_stock",
            "_stock_status",
            "_backorders",
            "_low_stock_amount",
        ];
        const customFields = await this.getProductCustomFields(productId);
        return customFields.filter((field) =>
            inventoryKeys.includes(field.key)
        );
    }

    /**
     * Get product pricing custom fields
     * @param productId - ID of the product
     */
    static async getProductPricingCustomFields(
        productId: number,
    ): Promise<WooProductCustomField[]> {
        const pricingKeys = [
            "_regular_price",
            "_sale_price",
            "_sale_price_dates_from",
            "_sale_price_dates_to",
        ];
        const customFields = await this.getProductCustomFields(productId);
        return customFields.filter((field) => pricingKeys.includes(field.key));
    }
}
