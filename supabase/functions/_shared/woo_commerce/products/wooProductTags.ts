/**
 * WooCommerce Product Tags API
 * Handles product tags management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#product-tags
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Base Product Tag Interface
export interface WooProductTag {
    /** Unique identifier for the tag */
    id: number;
    /** Tag name */
    name: string;
    /** An alphanumeric identifier for the tag unique to its type */
    slug: string;
    /** HTML description of the tag */
    description: string;
    /** Number of published products for the tag */
    count: number;
    /** Tag archive URL */
    _links: {
        self: Array<{ href: string }>;
        collection: Array<{ href: string }>;
    };
}

// Interface for creating/updating product tags
export interface WooProductTagCreate {
    /** Tag name */
    name: string;
    /** An alphanumeric identifier for the tag unique to its type */
    slug?: string;
    /** HTML description of the tag */
    description?: string;
}

// Interface for updating product tags
export interface WooProductTagUpdate {
    /** Tag name */
    name?: string;
    /** An alphanumeric identifier for the tag unique to its type */
    slug?: string;
    /** HTML description of the tag */
    description?: string;
}

// Interface for querying product tags
export interface WooProductTagQuery {
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
    /** Sort collection by tag attribute */
    orderby?:
        | "id"
        | "include"
        | "name"
        | "slug"
        | "term_group"
        | "description"
        | "count";
    /** Whether to hide tags not assigned to any products */
    hide_empty?: boolean;
    /** Limit result set to tags with a specific product */
    product?: number;
    /** Limit result set to tags with a specific slug */
    slug?: string;
    /** Limit result set to tags with a specific category */
    category?: string;
}

// Interface for batch operations
export interface WooProductTagBatch {
    /** Product tags to be created */
    create?: WooProductTagCreate[];
    /** Product tags to be updated */
    update?: Array<WooProductTagUpdate & { id: number }>;
    /** Product tags to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductTagBatchResponse {
    /** Created product tags */
    create?: WooProductTag[];
    /** Updated product tags */
    update?: WooProductTag[];
    /** Deleted product tags */
    delete?: WooProductTag[];
}

export class WooProductTags {
    /**
     * Create a new product tag
     * @param tagData - Data for the new product tag
     */
    static async createProductTag(
        tagData: WooProductTagCreate,
    ): Promise<WooProductTag> {
        const response = await fetch(buildWooUrl("/products/tags"), {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(tagData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific product tag by ID
     * @param tagId - ID of the product tag to retrieve
     * @param query - Optional query parameters
     */
    static async getProductTag(
        tagId: number,
        query?: WooProductTagQuery,
    ): Promise<WooProductTag> {
        const response = await fetch(
            buildWooUrl(`/products/tags/${tagId}`, query),
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
     * Get all product tags
     * @param query - Optional query parameters
     * @returns Array of tags
     */
    static async getProductTags(
        query?: WooProductTagQuery,
    ): Promise<WooProductTag[]> {
        const response = await fetch(buildWooUrl("/products/tags", query), {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update a product tag
     * @param tagId - ID of the product tag to update
     * @param tagData - Data to update the product tag with
     * @returns Updated tag data
     */
    static async updateProductTag(
        tagId: number,
        tagData: WooProductTagUpdate,
    ): Promise<WooProductTag> {
        const response = await fetch(buildWooUrl(`/products/tags/${tagId}`), {
            method: "PUT",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(tagData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product tag
     * @param tagId - ID of the product tag to delete
     * @param force - Whether to bypass trash and force deletion
     * @returns Deleted tag data
     */
    static async deleteProductTag(
        tagId: number,
        force: boolean = false,
    ): Promise<WooProductTag> {
        const response = await fetch(
            buildWooUrl(`/products/tags/${tagId}`, { force }),
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
     * Batch create, update, and delete product tags
     * @param batchData - Batch operation data
     * @returns Batch operation results
     */
    static async batchProductTags(
        batchData: WooProductTagBatch,
    ): Promise<WooProductTagBatchResponse> {
        const response = await fetch(buildWooUrl("/products/tags/batch"), {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(batchData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Search product tags by name
     * @param searchTerm - Term to search for in tag names
     */
    static async searchProductTags(
        searchTerm: string,
    ): Promise<WooProductTag[]> {
        return this.getProductTags({ search: searchTerm });
    }

    /**
     * Get product tags with products assigned
     */
    static async getTagsWithProducts(): Promise<WooProductTag[]> {
        return this.getProductTags({ hide_empty: true });
    }

    /**
     * Get product tags by slug
     * @param slug - Slug to search for
     */
    static async getProductTagsBySlug(slug: string): Promise<WooProductTag[]> {
        return this.getProductTags({ slug });
    }

    /**
     * Get product tags for a specific product
     * @param productId - ID of the product
     */
    static async getProductTagsForProduct(
        productId: number,
    ): Promise<WooProductTag[]> {
        return this.getProductTags({ product: productId });
    }

    /**
     * Get most popular product tags (sorted by count)
     * @param limit - Maximum number of tags to return
     */
    static async getMostPopularProductTags(
        limit: number = 10,
    ): Promise<WooProductTag[]> {
        return this.getProductTags({
            orderby: "count",
            order: "desc",
            per_page: limit,
        });
    }

    /**
     * Get product tags sorted by name
     * @param order - Sort order (asc or desc)
     */
    static async getProductTagsSortedByName(
        order: "asc" | "desc" = "asc",
    ): Promise<WooProductTag[]> {
        return this.getProductTags({ orderby: "name", order });
    }

    /**
     * Get product tags sorted by count
     * @param order - Sort order (asc or desc)
     */
    static async getProductTagsSortedByCount(
        order: "asc" | "desc" = "desc",
    ): Promise<WooProductTag[]> {
        return this.getProductTags({ orderby: "count", order });
    }

    /**
     * Get unused product tags (tags with no products assigned)
     */
    static async getUnusedProductTags(): Promise<WooProductTag[]> {
        const allTags = await this.getProductTags();
        return allTags.filter((tag) => tag.count === 0);
    }

    /**
     * Check if a tag exists by name
     * @param name - Name of the tag to check
     */
    static async tagExistsByName(name: string): Promise<boolean> {
        const tags = await this.searchProductTags(name);
        return tags.some((tag) =>
            tag.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Check if a tag exists by slug
     * @param slug - Slug of the tag to check
     */
    static async tagExistsBySlug(slug: string): Promise<boolean> {
        const tags = await this.getProductTagsBySlug(slug);
        return tags.length > 0;
    }

    /**
     * Get or create a product tag by name
     * @param name - Name of the tag to get or create
     * @param description - Optional description for the tag if it needs to be created
     */
    static async getOrCreateProductTag(
        name: string,
        description?: string,
    ): Promise<WooProductTag> {
        // First try to find existing tag
        const existingTags = await this.searchProductTags(name);
        const existingTag = existingTags.find((tag) =>
            tag.name.toLowerCase() === name.toLowerCase()
        );

        if (existingTag) {
            return existingTag;
        }

        // Create new tag if it doesn't exist
        return this.createProductTag({ name, description });
    }

    /**
     * Bulk create product tags from an array of names
     * @param tagNames - Array of tag names to create
     */
    static async bulkCreateProductTags(
        tagNames: string[],
    ): Promise<WooProductTag[]> {
        const createData = tagNames.map((name) => ({ name }));
        const batchResponse = await this.batchProductTags({
            create: createData,
        });
        return batchResponse.create || [];
    }

    /**
     * Get product tags by partial name match
     * @param partialName - Partial name to match
     */
    static async getProductTagsByPartialName(
        partialName: string,
    ): Promise<WooProductTag[]> {
        const allTags = await this.getProductTags();
        return allTags.filter((tag) =>
            tag.name.toLowerCase().includes(partialName.toLowerCase()) ||
            tag.slug.toLowerCase().includes(partialName.toLowerCase())
        );
    }
}
