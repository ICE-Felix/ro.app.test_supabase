/**
 * WooCommerce Product Reviews API
 * Handles product reviews management in WooCommerce
 *
 * API Documentation: https://woocommerce.github.io/woocommerce-rest-api-docs/#product-reviews
 */

import { buildWooUrl, getWooAuthHeaders } from "../wooUtils.ts";

// Review status enum
export enum ReviewStatus {
    APPROVED = "approved",
    HOLD = "hold",
    SPAM = "spam",
    UNSPAM = "unspam",
    TRASH = "trash",
    UNTRASH = "untrash",
}

// Base Product Review Interface
export interface WooProductReview {
    /** Unique identifier for the review */
    id: number;
    /** The date the review was created, in the site's timezone */
    date_created: string;
    /** The date the review was created, as GMT */
    date_created_gmt: string;
    /** Unique identifier for the product that the review belongs to */
    product_id: number;
    /** Product name */
    product_name: string;
    /** Product permalink */
    product_permalink: string;
    /** Status of the review */
    status: ReviewStatus;
    /** Reviewer name */
    reviewer: string;
    /** Reviewer email */
    reviewer_email: string;
    /** Review content */
    review: string;
    /** Review rating (0 to 5) */
    rating: number;
    /** Shows if the reviewer bought the product or not */
    verified: boolean;
    /** Avatar URLs for the reviewer */
    reviewer_avatar_urls: {
        "24": string;
        "48": string;
        "96": string;
    };
    /** Review archive URL */
    _links: {
        self: Array<{ href: string }>;
        collection: Array<{ href: string }>;
        up: Array<{ href: string }>;
    };
}

// Interface for creating/updating product reviews
export interface WooProductReviewCreate {
    /** Unique identifier for the product that the review belongs to */
    product_id: number;
    /** Status of the review */
    status?: ReviewStatus;
    /** Reviewer name */
    reviewer: string;
    /** Reviewer email */
    reviewer_email: string;
    /** Review content */
    review: string;
    /** Review rating (0 to 5) */
    rating: number;
}

// Interface for updating product reviews
export interface WooProductReviewUpdate {
    /** Unique identifier for the product that the review belongs to */
    product_id?: number;
    /** Status of the review */
    status?: ReviewStatus;
    /** Reviewer name */
    reviewer?: string;
    /** Reviewer email */
    reviewer_email?: string;
    /** Review content */
    review?: string;
    /** Review rating (0 to 5) */
    rating?: number;
}

// Interface for querying product reviews
export interface WooProductReviewQuery {
    /** Scope under which the request is made; determines fields present in response */
    context?: "view" | "edit";
    /** Current page of the collection */
    page?: number;
    /** Maximum number of items to be returned in result set */
    per_page?: number;
    /** Limit results to those matching a string */
    search?: string;
    /** Limit response to reviews published after a given ISO8601 compliant date */
    after?: string;
    /** Limit response to reviews published before a given ISO8601 compliant date */
    before?: string;
    /** Ensure result set excludes specific IDs */
    exclude?: number[];
    /** Limit result set to specific IDs */
    include?: number[];
    /** Offset the result set by a specific number of items */
    offset?: number;
    /** Order sort attribute ascending or descending */
    order?: "asc" | "desc";
    /** Sort collection by review attribute */
    orderby?: "date" | "date_gmt" | "id" | "include" | "product";
    /** Limit result set to reviews assigned to specific reviewer emails */
    reviewer_email?: string;
    /** Limit result set to reviews assigned to specific reviewer IDs */
    reviewer?: number[];
    /** Limit result set to reviews assigned to specific products */
    product?: number[];
    /** Limit result set to reviews assigned a specific status */
    status?: ReviewStatus;
}

// Interface for batch operations
export interface WooProductReviewBatch {
    /** Product reviews to be created */
    create?: WooProductReviewCreate[];
    /** Product reviews to be updated */
    update?: Array<WooProductReviewUpdate & { id: number }>;
    /** Product reviews to be deleted */
    delete?: number[];
}

// Interface for batch response
export interface WooProductReviewBatchResponse {
    /** Created product reviews */
    create?: WooProductReview[];
    /** Updated product reviews */
    update?: WooProductReview[];
    /** Deleted product reviews */
    delete?: WooProductReview[];
}

// Interface for review statistics
export interface WooProductReviewStats {
    /** Total number of reviews */
    total_reviews: number;
    /** Average rating */
    average_rating: number;
    /** Rating distribution */
    rating_distribution: {
        "5": number;
        "4": number;
        "3": number;
        "2": number;
        "1": number;
    };
    /** Number of verified reviews */
    verified_reviews: number;
    /** Number of unverified reviews */
    unverified_reviews: number;
}

export class WooProductReviews {
    /**
     * Create a new product review
     * @param reviewData - Data for the new review
     * @returns Created review data
     */
    static async createProductReview(
        reviewData: WooProductReviewCreate,
    ): Promise<WooProductReview> {
        const response = await fetch(buildWooUrl("/products/reviews"), {
            method: "POST",
            headers: getWooAuthHeaders(),
            body: JSON.stringify(reviewData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get a specific product review by ID
     * @param reviewId - ID of the review to retrieve
     * @param query - Optional query parameters
     * @returns Review data
     */
    static async getProductReview(
        reviewId: number,
        query?: WooProductReviewQuery,
    ): Promise<WooProductReview> {
        const response = await fetch(
            buildWooUrl(`/products/reviews/${reviewId}`, query),
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
     * Get all product reviews
     * @param query - Optional query parameters
     * @returns Array of reviews
     */
    static async getProductReviews(
        query?: WooProductReviewQuery,
    ): Promise<WooProductReview[]> {
        const response = await fetch(buildWooUrl("/products/reviews", query), {
            method: "GET",
            headers: getWooAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Update a product review
     * @param reviewId - ID of the review to update
     * @param reviewData - Data to update the review with
     * @returns Updated review data
     */
    static async updateProductReview(
        reviewId: number,
        reviewData: WooProductReviewUpdate,
    ): Promise<WooProductReview> {
        const response = await fetch(
            buildWooUrl(`/products/reviews/${reviewId}`),
            {
                method: "PUT",
                headers: getWooAuthHeaders(),
                body: JSON.stringify(reviewData),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Delete a product review
     * @param reviewId - ID of the review to delete
     * @param force - Whether to bypass trash and force deletion
     * @returns Deleted review data
     */
    static async deleteProductReview(
        reviewId: number,
        force: boolean = false,
    ): Promise<WooProductReview> {
        const response = await fetch(
            buildWooUrl(`/products/reviews/${reviewId}`, { force }),
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
     * Batch create, update, and delete product reviews
     * @param batchData - Batch operation data
     * @returns Batch operation results
     */
    static async batchProductReviews(
        batchData: WooProductReviewBatch,
    ): Promise<WooProductReviewBatchResponse> {
        const response = await fetch(buildWooUrl("/products/reviews/batch"), {
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
     * Get product reviews for a specific product
     * @param productId - ID of the product
     * @param query - Optional query parameters
     */
    static async getProductReviewsForProduct(
        productId: number,
        query?: Omit<WooProductReviewQuery, "product">,
    ): Promise<WooProductReview[]> {
        return this.getProductReviews({ ...query, product: [productId] });
    }

    /**
     * Get product reviews by status
     * @param status - Review status to filter by
     * @param query - Optional query parameters
     */
    static async getProductReviewsByStatus(
        status: ReviewStatus,
        query?: Omit<WooProductReviewQuery, "status">,
    ): Promise<WooProductReview[]> {
        return this.getProductReviews({ ...query, status });
    }

    /**
     * Get verified product reviews
     * @param query - Optional query parameters
     */
    static async getVerifiedProductReviews(
        query?: WooProductReviewQuery,
    ): Promise<WooProductReview[]> {
        const reviews = await this.getProductReviews(query);
        return reviews.filter((review) => review.verified);
    }

    /**
     * Get unverified product reviews
     * @param query - Optional query parameters
     */
    static async getUnverifiedProductReviews(
        query?: WooProductReviewQuery,
    ): Promise<WooProductReview[]> {
        const reviews = await this.getProductReviews(query);
        return reviews.filter((review) => !review.verified);
    }

    /**
     * Get product reviews by rating
     * @param rating - Rating to filter by (1-5)
     * @param query - Optional query parameters
     */
    static async getProductReviewsByRating(
        rating: number,
        query?: WooProductReviewQuery,
    ): Promise<WooProductReview[]> {
        const reviews = await this.getProductReviews(query);
        return reviews.filter((review) => review.rating === rating);
    }

    /**
     * Get product reviews by minimum rating
     * @param minRating - Minimum rating to filter by (1-5)
     * @param query - Optional query parameters
     */
    static async getProductReviewsByMinRating(
        minRating: number,
        query?: WooProductReviewQuery,
    ): Promise<WooProductReview[]> {
        const reviews = await this.getProductReviews(query);
        return reviews.filter((review) => review.rating >= minRating);
    }

    /**
     * Get product reviews by reviewer email
     * @param email - Reviewer email to filter by
     * @param query - Optional query parameters
     */
    static async getProductReviewsByReviewerEmail(
        email: string,
        query?: Omit<WooProductReviewQuery, "reviewer_email">,
    ): Promise<WooProductReview[]> {
        return this.getProductReviews({ ...query, reviewer_email: email });
    }

    /**
     * Search product reviews by content
     * @param searchTerm - Term to search for in review content
     * @param query - Optional query parameters
     */
    static async searchProductReviews(
        searchTerm: string,
        query?: Omit<WooProductReviewQuery, "search">,
    ): Promise<WooProductReview[]> {
        return this.getProductReviews({ ...query, search: searchTerm });
    }

    /**
     * Get recent product reviews
     * @param days - Number of days to look back
     * @param query - Optional query parameters
     */
    static async getRecentProductReviews(
        days: number = 7,
        query?: Omit<WooProductReviewQuery, "after">,
    ): Promise<WooProductReview[]> {
        const afterDate = new Date();
        afterDate.setDate(afterDate.getDate() - days);
        return this.getProductReviews({
            ...query,
            after: afterDate.toISOString(),
        });
    }

    /**
     * Approve a product review
     * @param reviewId - ID of the review to approve
     */
    static async approveProductReview(
        reviewId: number,
    ): Promise<WooProductReview> {
        return this.updateProductReview(reviewId, {
            status: ReviewStatus.APPROVED,
        });
    }

    /**
     * Hold a product review (pending approval)
     * @param reviewId - ID of the review to hold
     */
    static async holdProductReview(
        reviewId: number,
    ): Promise<WooProductReview> {
        return this.updateProductReview(reviewId, {
            status: ReviewStatus.HOLD,
        });
    }

    /**
     * Mark a product review as spam
     * @param reviewId - ID of the review to mark as spam
     */
    static async spamProductReview(
        reviewId: number,
    ): Promise<WooProductReview> {
        return this.updateProductReview(reviewId, {
            status: ReviewStatus.SPAM,
        });
    }

    /**
     * Calculate review statistics for a product
     * @param productId - ID of the product
     */
    static async getProductReviewStats(
        productId: number,
    ): Promise<WooProductReviewStats> {
        const reviews = await this.getProductReviewsForProduct(productId);

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                totalReviews
            : 0;

        const ratingDistribution = {
            "5": reviews.filter((r) => r.rating === 5).length,
            "4": reviews.filter((r) => r.rating === 4).length,
            "3": reviews.filter((r) => r.rating === 3).length,
            "2": reviews.filter((r) => r.rating === 2).length,
            "1": reviews.filter((r) => r.rating === 1).length,
        };

        const verifiedReviews = reviews.filter((r) => r.verified).length;
        const unverifiedReviews = totalReviews - verifiedReviews;

        return {
            total_reviews: totalReviews,
            average_rating: Math.round(averageRating * 100) / 100,
            rating_distribution: ratingDistribution,
            verified_reviews: verifiedReviews,
            unverified_reviews: unverifiedReviews,
        };
    }
}
