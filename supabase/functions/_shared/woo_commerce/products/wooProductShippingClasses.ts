/**
 * WooCommerce Product Shipping Classes API
 * Handles product shipping classes management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#product-shipping-classes
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Base Product Shipping Class Interface
export interface WooProductShippingClass {
    /** Unique identifier for the shipping class */
    id: number;
    /** Shipping class name */
    name: string;
    /** An alphanumeric identifier for the shipping class unique to its type */
    slug: string;
    /** HTML description of the shipping class */
    description: string;
    /** Number of published products for the shipping class */
    count: number;
    /** Shipping class archive URL */
    _links: {
        self: Array<{ href: string }>;
        collection: Array<{ href: string }>;
    };
}

// Interface for creating/updating product shipping classes
export interface WooProductShippingClassCreate {
    /** Shipping class name */
    name: string;
    /** An alphanumeric identifier for the shipping class unique to its type */
    slug?: string;
    /** HTML description of the shipping class */
    description?: string;
}

// Interface for updating product shipping classes
export interface WooProductShippingClassUpdate {
    /** Shipping class name */
    name?: string;
    /** An alphanumeric identifier for the shipping class unique to its type */
    slug?: string;
    /** HTML description of the shipping class */
    description?: string;
}

// Interface for querying product shipping classes
export interface WooProductShippingClassQuery {
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
    /** Sort collection by shipping class attribute */
    orderby?:
        | "id"
        | "include"
        | "name"
        | "slug"
        | "term_group"
        | "description"
        | "count";
    /** Whether to hide shipping classes not assigned to any products */
    hide_empty?: boolean;
    /** Limit result set to shipping classes with a specific product */
    product?: number;
    /** Limit result set to shipping classes with a specific slug */
    slug?: string;
}

// Interface for batch operations
export interface WooProductShippingClassBatch {
    /** Product shipping classes to be created */
    create?: WooProductShippingClassCreate[];
    /** Product shipping classes to be updated */
    update?: Array<WooProductShippingClassUpdate & { id: number }>;
    /** Product shipping classes to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductShippingClassBatchResponse {
    /** Created product shipping classes */
    create?: WooProductShippingClass[];
    /** Updated product shipping classes */
    update?: WooProductShippingClass[];
    /** Deleted product shipping classes */
    delete?: WooProductShippingClass[];
}

export class WooProductShippingClasses {
    /**
     * Create a new product shipping class
     * @param shippingClassData - Data for the new shipping class
     * @returns Created shipping class data
     */
    static async createProductShippingClass(
        shippingClassData: WooProductShippingClassCreate,
    ): Promise<WooProductShippingClass> {
        const response = await fetch(
            buildWooUrl("/products/shipping_classes"),
            {
                method: "POST",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(shippingClassData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific product shipping class by ID
     * @param shippingClassId - ID of the shipping class to retrieve
     * @param query - Optional query parameters
     * @returns Shipping class data
     */
    static async getProductShippingClass(
        shippingClassId: number,
        query?: WooProductShippingClassQuery,
    ): Promise<WooProductShippingClass> {
        const response = await fetch(
            buildWooUrl(`/products/shipping_classes/${shippingClassId}`, query),
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
     * Get all product shipping classes
     * @param query - Optional query parameters
     * @returns Array of shipping classes
     */
    static async getProductShippingClasses(
        query?: WooProductShippingClassQuery,
    ): Promise<WooProductShippingClass[]> {
        const response = await fetch(
            buildWooUrl("/products/shipping_classes", query),
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
     * Update a product shipping class
     * @param shippingClassId - ID of the shipping class to update
     * @param shippingClassData - Data to update the shipping class with
     * @returns Updated shipping class data
     */
    static async updateProductShippingClass(
        shippingClassId: number,
        shippingClassData: WooProductShippingClassUpdate,
    ): Promise<WooProductShippingClass> {
        const response = await fetch(
            buildWooUrl(`/products/shipping_classes/${shippingClassId}`),
            {
                method: "PUT",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(shippingClassData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product shipping class
     * @param shippingClassId - ID of the shipping class to delete
     * @param force - Whether to bypass trash and force deletion
     * @returns Deleted shipping class data
     */
    static async deleteProductShippingClass(
        shippingClassId: number,
        force: boolean = false,
    ): Promise<WooProductShippingClass> {
        const response = await fetch(
            buildWooUrl(`/products/shipping_classes/${shippingClassId}`, {
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
     * Batch create, update, and delete product shipping classes
     * @param batchData - Batch operation data
     * @returns Batch operation results
     */
    static async batchProductShippingClasses(
        batchData: WooProductShippingClassBatch,
    ): Promise<WooProductShippingClassBatchResponse> {
        const response = await fetch(
            buildWooUrl("/products/shipping_classes/batch"),
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
     * Search product shipping classes by name
     * @param searchTerm - Term to search for in shipping class names
     */
    static async searchProductShippingClasses(
        searchTerm: string,
    ): Promise<WooProductShippingClass[]> {
        return this.getProductShippingClasses({ search: searchTerm });
    }

    /**
     * Get product shipping classes with products assigned
     */
    static async getShippingClassesWithProducts(): Promise<
        WooProductShippingClass[]
    > {
        return this.getProductShippingClasses({ hide_empty: true });
    }

    /**
     * Get product shipping classes by slug
     * @param slug - Slug to search for
     */
    static async getProductShippingClassesBySlug(
        slug: string,
    ): Promise<WooProductShippingClass[]> {
        return this.getProductShippingClasses({ slug });
    }

    /**
     * Get product shipping classes for a specific product
     * @param productId - ID of the product
     */
    static async getProductShippingClassesForProduct(
        productId: number,
    ): Promise<WooProductShippingClass[]> {
        return this.getProductShippingClasses({ product: productId });
    }

    /**
     * Get product shipping classes sorted by name
     * @param order - Sort order (asc or desc)
     */
    static async getProductShippingClassesSortedByName(
        order: "asc" | "desc" = "asc",
    ): Promise<WooProductShippingClass[]> {
        return this.getProductShippingClasses({ orderby: "name", order });
    }

    /**
     * Get product shipping classes sorted by count
     * @param order - Sort order (asc or desc)
     */
    static async getProductShippingClassesSortedByCount(
        order: "asc" | "desc" = "desc",
    ): Promise<WooProductShippingClass[]> {
        return this.getProductShippingClasses({ orderby: "count", order });
    }

    /**
     * Get the default shipping class (usually the first one or most used)
     */
    static async getDefaultShippingClass(): Promise<
        WooProductShippingClass | null
    > {
        const shippingClasses = await this.getProductShippingClasses({
            orderby: "count",
            order: "desc",
            per_page: 1,
        });
        return shippingClasses.length > 0 ? shippingClasses[0] : null;
    }

    /**
     * Check if a shipping class exists by name
     * @param name - Name of the shipping class to check
     */
    static async shippingClassExistsByName(name: string): Promise<boolean> {
        const shippingClasses = await this.searchProductShippingClasses(name);
        return shippingClasses.some((sc) =>
            sc.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Check if a shipping class exists by slug
     * @param slug - Slug of the shipping class to check
     */
    static async shippingClassExistsBySlug(slug: string): Promise<boolean> {
        const shippingClasses = await this.getProductShippingClassesBySlug(
            slug,
        );
        return shippingClasses.length > 0;
    }
}
