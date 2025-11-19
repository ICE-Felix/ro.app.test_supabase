/**
 * WooCommerce Product Attributes API
 * Handles product attributes management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#product-attributes
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Types and Enums
export enum AttributeType {
    SELECT = "select",
    TEXT = "text",
}

export enum AttributeOrderBy {
    MENU_ORDER = "menu_order",
    NAME = "name",
    NAME_NUM = "name_num",
    ID = "id",
}

// Base Product Attribute Interface
export interface WooProductAttribute {
    /** Unique identifier for the attribute */
    id: number;
    /** Attribute name */
    name: string;
    /** An alphanumeric identifier for the attribute unique to its type */
    slug: string;
    /** Type of attribute. Options: select and text */
    type: AttributeType;
    /** Default sort order. Options: menu_order, name, name_num and id */
    order_by: AttributeOrderBy;
    /** Enable/Disable attribute archives */
    has_archives: boolean;
}

// Interface for creating/updating product attributes
export interface WooProductAttributeCreate {
    /** Attribute name */
    name: string;
    /** An alphanumeric identifier for the attribute unique to its type */
    slug?: string;
    /** Type of attribute. Options: select and text */
    type?: AttributeType;
    /** Default sort order. Options: menu_order, name, name_num and id */
    order_by?: AttributeOrderBy;
    /** Enable/Disable attribute archives */
    has_archives?: boolean;
}

// Interface for updating product attributes
export interface WooProductAttributeUpdate {
    /** Attribute name */
    name?: string;
    /** An alphanumeric identifier for the attribute unique to its type */
    slug?: string;
    /** Type of attribute. Options: select and text */
    type?: AttributeType;
    /** Default sort order. Options: menu_order, name, name_num and id */
    order_by?: AttributeOrderBy;
    /** Enable/Disable attribute archives */
    has_archives?: boolean;
}

// Interface for querying product attributes
export interface WooProductAttributeQuery {
    /** Scope under which the request is made; determines fields present in response */
    context?: "view" | "edit";
}

// Interface for batch operations
export interface WooProductAttributeBatch {
    /** Product attributes to be created */
    create?: WooProductAttributeCreate[];
    /** Product attributes to be updated */
    update?: Array<WooProductAttributeUpdate & { id: number }>;
    /** Product attributes to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductAttributeBatchResponse {
    /** Created product attributes */
    create?: WooProductAttribute[];
    /** Updated product attributes */
    update?: WooProductAttribute[];
    /** Deleted product attributes */
    delete?: WooProductAttribute[];
}

export class WooProductAttributes {
    /**
     * Create a new product attribute
     * @param attributeData - Data for the new attribute
     * @returns Created attribute data
     */
    static async createProductAttribute(
        attributeData: WooProductAttributeCreate,
    ): Promise<WooProductAttribute> {
        const url = buildWooUrl("/products/attributes");
        const response = await fetch(url, {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(attributeData),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to create product attribute: ${response.status}`,
            );
        }

        return response.json();
    }

    /**
     * Get a specific product attribute by ID
     * @param attributeId - ID of the attribute to retrieve
     * @returns Attribute data
     */
    static async getProductAttribute(
        attributeId: number,
    ): Promise<WooProductAttribute> {
        const url = buildWooUrl(`/products/attributes/${attributeId}`);
        const response = await fetch(url, {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to get product attribute: ${response.status}`,
            );
        }

        return response.json();
    }

    /**
     * Get all product attributes
     * @param query - Optional query parameters
     * @returns Array of attributes
     */
    static async getAllProductAttributes(
        query?: WooProductAttributeQuery,
    ): Promise<WooProductAttribute[]> {
        const url = buildWooUrl("/products/attributes", query);
        const response = await fetch(url, {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to get product attributes: ${response.status}`,
            );
        }

        return response.json();
    }

    /**
     * Update an existing product attribute
     * @param attributeId - ID of the attribute to update
     * @param attributeData - Data to update the attribute with
     * @returns Updated attribute data
     */
    static async updateProductAttribute(
        attributeId: number,
        attributeData: WooProductAttributeUpdate,
    ): Promise<WooProductAttribute> {
        const url = buildWooUrl(`/products/attributes/${attributeId}`);
        const response = await fetch(url, {
            method: "PUT",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(attributeData),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to update product attribute: ${response.status}`,
            );
        }

        return response.json();
    }

    /**
     * Delete a product attribute
     * @param attributeId - ID of the attribute to delete
     * @param force - Whether to bypass trash and force deletion
     * @returns Deleted attribute data
     */
    static async deleteProductAttribute(
        attributeId: number,
        force: boolean = false,
    ): Promise<WooProductAttribute> {
        const url = buildWooUrl(`/products/attributes/${attributeId}`, {
            force,
        });
        const response = await fetch(url, {
            method: "DELETE",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to delete product attribute: ${response.status}`,
            );
        }

        return response.json();
    }

    /**
     * Batch operations for product attributes
     * @param batchData - Batch operation data
     * @returns Batch operation results
     */
    static async batchProductAttributes(
        batchData: WooProductAttributeBatch,
    ): Promise<WooProductAttributeBatchResponse> {
        const url = buildWooUrl("/products/attributes/batch");
        const response = await fetch(url, {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(batchData),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to batch product attributes: ${response.status}`,
            );
        }

        return response.json();
    }

    /**
     * Get product attributes by type
     * @param type - Type of attribute to filter by
     */
    static async getProductAttributesByType(
        type: AttributeType,
    ): Promise<WooProductAttribute[]> {
        const attributes = await this.getAllProductAttributes();
        return attributes.filter((attr) => attr.type === type);
    }

    /**
     * Get product attributes with archives enabled
     */
    static async getProductAttributesWithArchives(): Promise<
        WooProductAttribute[]
    > {
        const attributes = await this.getAllProductAttributes();
        return attributes.filter((attr) => attr.has_archives);
    }

    /**
     * Search product attributes by name
     * @param searchTerm - Term to search for in attribute names
     */
    static async searchProductAttributes(
        searchTerm: string,
    ): Promise<WooProductAttribute[]> {
        const attributes = await this.getAllProductAttributes();
        return attributes.filter((attr) =>
            attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            attr.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
}
