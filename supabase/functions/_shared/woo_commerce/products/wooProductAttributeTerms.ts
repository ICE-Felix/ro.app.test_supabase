/**
 * WooCommerce Product Attribute Terms API
 * Handles product attribute terms management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#product-attribute-terms
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Base Product Attribute Term Interface
export interface WooProductAttributeTerm {
    /** Unique identifier for the term */
    id: number;
    /** Term name */
    name: string;
    /** An alphanumeric identifier for the term unique to its type */
    slug: string;
    /** HTML description of the term */
    description: string;
    /** Menu order, used to custom sort terms */
    menu_order: number;
    /** Number of published products for the term */
    count: number;
}

// Interface for creating/updating product attribute terms
export interface WooProductAttributeTermCreate {
    /** Term name */
    name: string;
    /** An alphanumeric identifier for the term unique to its type */
    slug?: string;
    /** HTML description of the term */
    description?: string;
    /** Menu order, used to custom sort terms */
    menu_order?: number;
}

// Interface for updating product attribute terms
export interface WooProductAttributeTermUpdate {
    /** Term name */
    name?: string;
    /** An alphanumeric identifier for the term unique to its type */
    slug?: string;
    /** HTML description of the term */
    description?: string;
    /** Menu order, used to custom sort terms */
    menu_order?: number;
}

// Interface for querying product attribute terms
export interface WooProductAttributeTermQuery {
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
    /** Sort collection by term attribute */
    orderby?:
        | "id"
        | "include"
        | "name"
        | "slug"
        | "term_group"
        | "description"
        | "count";
    /** Whether to hide terms not assigned to any products */
    hide_empty?: boolean;
    /** Limit result set to terms assigned to a specific parent */
    parent?: number;
    /** Limit result set to terms with a specific product */
    product?: number;
    /** Limit result set to terms with a specific slug */
    slug?: string;
}

// Interface for batch operations
export interface WooProductAttributeTermBatch {
    /** Product attribute terms to be created */
    create?: WooProductAttributeTermCreate[];
    /** Product attribute terms to be updated */
    update?: Array<WooProductAttributeTermUpdate & { id: number }>;
    /** Product attribute terms to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductAttributeTermBatchResponse {
    /** Created product attribute terms */
    create?: WooProductAttributeTerm[];
    /** Updated product attribute terms */
    update?: WooProductAttributeTerm[];
    /** Deleted product attribute terms */
    delete?: WooProductAttributeTerm[];
}

export class WooProductAttributeTerms {
    /**
     * Create a new product attribute term
     * @param attributeId - ID of the product attribute
     * @param termData - Data for the new product attribute term
     */
    static async createProductAttributeTerm(
        attributeId: number,
        termData: WooProductAttributeTermCreate,
    ): Promise<WooProductAttributeTerm> {
        const response = await fetch(
            buildWooUrl(`/products/attributes/${attributeId}/terms`),
            {
                method: "POST",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(termData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific product attribute term by ID
     * @param attributeId - ID of the product attribute
     * @param termId - ID of the product attribute term to retrieve
     * @param query - Optional query parameters
     */
    static async getProductAttributeTerm(
        attributeId: number,
        termId: number,
        query?: WooProductAttributeTermQuery,
    ): Promise<WooProductAttributeTerm> {
        const response = await fetch(
            buildWooUrl(
                `/products/attributes/${attributeId}/terms/${termId}`,
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
     * Get all product attribute terms for a specific attribute
     * @param attributeId - ID of the product attribute
     * @param query - Optional query parameters
     */
    static async getProductAttributeTerms(
        attributeId: number,
        query?: WooProductAttributeTermQuery,
    ): Promise<WooProductAttributeTerm[]> {
        const response = await fetch(
            buildWooUrl(`/products/attributes/${attributeId}/terms`, query),
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
     * Update a product attribute term
     * @param attributeId - ID of the product attribute
     * @param termId - ID of the term to update
     * @param termData - Data to update the term with
     */
    static async updateProductAttributeTerm(
        attributeId: number,
        termId: number,
        termData: WooProductAttributeTermUpdate,
    ): Promise<WooProductAttributeTerm> {
        const response = await fetch(
            buildWooUrl(
                `/products/attributes/${attributeId}/terms/${termId}`,
            ),
            {
                method: "PUT",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(termData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product attribute term
     * @param attributeId - ID of the product attribute
     * @param termId - ID of the term to delete
     * @param force - Whether to bypass trash and force deletion
     */
    static async deleteProductAttributeTerm(
        attributeId: number,
        termId: number,
        force: boolean = false,
    ): Promise<WooProductAttributeTerm> {
        const response = await fetch(
            buildWooUrl(
                `/products/attributes/${attributeId}/terms/${termId}`,
                { force },
            ),
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
     * Batch create, update, and delete product attribute terms
     * @param attributeId - ID of the product attribute
     * @param batchData - Batch operation data
     */
    static async batchProductAttributeTerms(
        attributeId: number,
        batchData: WooProductAttributeTermBatch,
    ): Promise<WooProductAttributeTermBatchResponse> {
        const response = await fetch(
            buildWooUrl(`/products/attributes/${attributeId}/terms/batch`),
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
     * Search product attribute terms by name
     * @param attributeId - ID of the product attribute
     * @param searchTerm - Term to search for in attribute term names
     */
    static async searchProductAttributeTerms(
        attributeId: number,
        searchTerm: string,
    ): Promise<WooProductAttributeTerm[]> {
        return this.getProductAttributeTerms(attributeId, {
            search: searchTerm,
        });
    }

    /**
     * Get product attribute terms sorted by menu order
     * @param attributeId - ID of the product attribute
     * @param order - Sort order (asc or desc)
     */
    static async getProductAttributeTermsSortedByMenuOrder(
        attributeId: number,
        order: "asc" | "desc" = "asc",
    ): Promise<WooProductAttributeTerm[]> {
        return this.getProductAttributeTerms(attributeId, {
            orderby: "term_group",
            order,
        });
    }

    /**
     * Get product attribute terms with products assigned
     * @param attributeId - ID of the product attribute
     */
    static async getProductAttributeTermsWithProducts(
        attributeId: number,
    ): Promise<WooProductAttributeTerm[]> {
        return this.getProductAttributeTerms(attributeId, { hide_empty: true });
    }

    /**
     * Get product attribute terms by slug
     * @param attributeId - ID of the product attribute
     * @param slug - Slug to search for
     */
    static async getProductAttributeTermsBySlug(
        attributeId: number,
        slug: string,
    ): Promise<WooProductAttributeTerm[]> {
        return this.getProductAttributeTerms(attributeId, { slug });
    }

    /**
     * Get product attribute terms for a specific product
     * @param attributeId - ID of the product attribute
     * @param productId - ID of the product
     */
    static async getProductAttributeTermsForProduct(
        attributeId: number,
        productId: number,
    ): Promise<WooProductAttributeTerm[]> {
        return this.getProductAttributeTerms(attributeId, {
            product: productId,
        });
    }
}
