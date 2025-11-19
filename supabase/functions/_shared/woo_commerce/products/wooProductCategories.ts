/**
 * WooCommerce Product Categories API
 * Handles product categories management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#product-categories
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Product Category Image Interface
export interface CategoryImage {
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
}

// Base Product Category Interface
export interface WooProductCategory {
    /** Unique identifier for the category */
    id: number;
    /** Category name */
    name: string;
    /** An alphanumeric identifier for the category unique to its type */
    slug: string;
    /** The ID for the parent of the category */
    parent: number;
    /** HTML description of the category */
    description: string;
    /** Category archive display type. Options: default, products, subcategories and both */
    display: "default" | "products" | "subcategories" | "both";
    /** Image data */
    image: CategoryImage | null;
    /** Menu order, used to custom sort categories */
    menu_order: number;
    /** Number of published products for the category */
    count: number;
    /** Category archive URL */
    _links: {
        self: Array<{ href: string }>;
        collection: Array<{ href: string }>;
    };
}

// Interface for creating/updating product categories
export interface WooProductCategoryCreate {
    /** Category name */
    name: string;
    /** An alphanumeric identifier for the category unique to its type */
    slug?: string;
    /** The ID for the parent of the category */
    parent?: number;
    /** HTML description of the category */
    description?: string;
    /** Category archive display type. Options: default, products, subcategories and both */
    display?: "default" | "products" | "subcategories" | "both";
    /** Image data */
    image?: {
        /** Image ID */
        id?: number;
        /** Image URL */
        src?: string;
        /** Image name */
        name?: string;
        /** Image alternative text */
        alt?: string;
    };
    /** Menu order, used to custom sort categories */
    menu_order?: number;
}

// Interface for updating product categories
export interface WooProductCategoryUpdate {
    /** Category name */
    name?: string;
    /** An alphanumeric identifier for the category unique to its type */
    slug?: string;
    /** The ID for the parent of the category */
    parent?: number;
    /** HTML description of the category */
    description?: string;
    /** Category archive display type. Options: default, products, subcategories and both */
    display?: "default" | "products" | "subcategories" | "both";
    /** Image data */
    image?: {
        /** Image ID */
        id?: number;
        /** Image URL */
        src?: string;
        /** Image name */
        name?: string;
        /** Image alternative text */
        alt?: string;
    };
    /** Menu order, used to custom sort categories */
    menu_order?: number;
}

// Interface for querying product categories
export interface WooProductCategoryQuery {
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
    /** Sort collection by category attribute */
    orderby?:
        | "id"
        | "include"
        | "name"
        | "slug"
        | "term_group"
        | "description"
        | "count";
    /** Whether to hide categories not assigned to any products */
    hide_empty?: boolean;
    /** Limit result set to categories assigned to a specific parent */
    parent?: number;
    /** Limit result set to categories with a specific product */
    product?: number;
    /** Limit result set to categories with a specific slug */
    slug?: string;
}

// Interface for batch operations
export interface WooProductCategoryBatch {
    /** Product categories to be created */
    create?: WooProductCategoryCreate[];
    /** Product categories to be updated */
    update?: Array<WooProductCategoryUpdate & { id: number }>;
    /** Product categories to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductCategoryBatchResponse {
    /** Created product categories */
    create?: WooProductCategory[];
    /** Updated product categories */
    update?: WooProductCategory[];
    /** Deleted product categories */
    delete?: WooProductCategory[];
}

export class WooProductCategories {
    /**
     * Create a new product category
     * @param categoryData - Data for the new category
     * @returns Created category data
     */
    static async createProductCategory(
        categoryData: WooProductCategoryCreate,
    ): Promise<WooProductCategory> {
        const response = await fetch(buildWooUrl("/products/categories"), {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific product category by ID
     * @param categoryId - ID of the category to retrieve
     * @param query - Optional query parameters
     * @returns Category data
     */
    static async getProductCategory(
        categoryId: number,
        query?: WooProductCategoryQuery,
    ): Promise<WooProductCategory> {
        const response = await fetch(
            buildWooUrl(`/products/categories/${categoryId}`, query),
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
     * Get all product categories
     * @param query - Optional query parameters
     * @returns Array of categories
     */
    static async getProductCategories(
        query?: WooProductCategoryQuery,
    ): Promise<WooProductCategory[]> {
        const response = await fetch(
            buildWooUrl("/products/categories", query),
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
     * Update a product category
     * @param categoryId - ID of the category to update
     * @param categoryData - Data to update the category with
     * @returns Updated category data
     */
    static async updateProductCategory(
        categoryId: number,
        categoryData: WooProductCategoryUpdate,
    ): Promise<WooProductCategory> {
        const response = await fetch(
            buildWooUrl(`/products/categories/${categoryId}`),
            {
                method: "PUT",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(categoryData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product category
     * @param categoryId - ID of the category to delete
     * @param force - Whether to bypass trash and force deletion
     * @returns Deleted category data
     */
    static async deleteProductCategory(
        categoryId: number,
        force: boolean = false,
    ): Promise<WooProductCategory> {
        const response = await fetch(
            buildWooUrl(`/products/categories/${categoryId}`, { force }),
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
     * Batch create, update, and delete product categories
     * @param batchData - Batch operation data
     * @returns Batch operation results
     */
    static async batchProductCategories(
        batchData: WooProductCategoryBatch,
    ): Promise<WooProductCategoryBatchResponse> {
        const response = await fetch(
            buildWooUrl("/products/categories/batch"),
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
     * Search product categories by name
     * @param searchTerm - Term to search for in category names
     */
    static async searchProductCategories(
        searchTerm: string,
    ): Promise<WooProductCategory[]> {
        return this.getProductCategories({ search: searchTerm });
    }

    /**
     * Get top-level product categories (no parent)
     */
    static async getTopLevelCategories(): Promise<WooProductCategory[]> {
        return this.getProductCategories({ parent: 0 });
    }

    /**
     * Get child categories of a specific parent category
     * @param parentId - ID of the parent category
     */
    static async getChildCategories(
        parentId: number,
    ): Promise<WooProductCategory[]> {
        return this.getProductCategories({ parent: parentId });
    }

    /**
     * Get product categories with products assigned
     */
    static async getCategoriesWithProducts(): Promise<WooProductCategory[]> {
        return this.getProductCategories({ hide_empty: true });
    }

    /**
     * Get product categories by slug
     * @param slug - Slug to search for
     */
    static async getProductCategoriesBySlug(
        slug: string,
    ): Promise<WooProductCategory[]> {
        return this.getProductCategories({ slug });
    }

    /**
     * Get product categories for a specific product
     * @param productId - ID of the product
     */
    static async getProductCategoriesForProduct(
        productId: number,
    ): Promise<WooProductCategory[]> {
        return this.getProductCategories({ product: productId });
    }

    /**
     * Get product categories sorted by menu order
     * @param order - Sort order (asc or desc)
     */
    static async getProductCategoriesSortedByMenuOrder(
        order: "asc" | "desc" = "asc",
    ): Promise<WooProductCategory[]> {
        return this.getProductCategories({ orderby: "term_group", order });
    }

    /**
     * Get product categories with specific display type
     * @param displayType - Display type to filter by
     */
    static async getProductCategoriesByDisplay(
        displayType: "default" | "products" | "subcategories" | "both",
    ): Promise<WooProductCategory[]> {
        const categories = await this.getProductCategories();
        return categories.filter((cat) => cat.display === displayType);
    }
}
