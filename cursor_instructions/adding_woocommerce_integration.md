# Adding WooCommerce Integration to Supabase Functions

This guide explains how to integrate WooCommerce product management with
Supabase functions, including product creation, updates, and data flattening.

## Prerequisites

- Existing Supabase function with CRUD operations
- WooCommerce API access configured
- `WooProducts` service available in
  `_shared/woo_commerce/products/wooProducts.ts`

## Database Schema Requirements

### Required Columns

Your Supabase table must include:

```sql
-- Link to WooCommerce product
woo_product_id: number | null

-- Other standard fields
id: string
created_at: string
updated_at: string | null
deleted_at: string | null
```

### Important Notes

- **Use `.is("deleted_at", null)` instead of `.eq("deleted_at", null)`** to
  avoid timestamp parsing errors
- The `woo_product_id` field links your Supabase record to the WooCommerce
  product

## Type Definitions

### 1. Update Types File

Create or update your types file (e.g., `your_entity.types.ts`):

```typescript
import type { Database } from "../database.types.ts";

// Base types from database
export type YourEntityRow = Database["public"]["Tables"]["your_entity"]["Row"];
export type YourEntityInsert =
    Database["public"]["Tables"]["your_entity"]["Insert"];
export type YourEntityUpdate =
    Database["public"]["Tables"]["your_entity"]["Update"];

// Extended type for API responses with flattened WooCommerce fields
export interface YourEntityWithWooCommerce extends YourEntityRow {
    image_url?: string | null; // Featured image URL
    images: Array<{ id: string; file_name: string; url: string }>; // Gallery images

    // Flattened WooCommerce fields (excluding id, categories, images)
    woo_name?: string;
    woo_description?: string;
    woo_short_description?: string;
    woo_price?: string;
    woo_regular_price?: string;
    woo_sale_price?: string;
    woo_sku?: string;
    woo_status?: string;
    woo_stock_status?: string;
    woo_stock_quantity?: number;
    woo_manage_stock?: boolean;
    woo_featured?: boolean;
    woo_date_on_sale_from?: string;
    woo_date_on_sale_to?: string;
    woo_tags?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
}

// Request payload types
export interface YourEntityInsertPayload
    extends Omit<YourEntityInsert, "woo_product_id"> {
    // Image upload fields
    image_file?: File | Blob;
    image_base64?: string;

    // Gallery fields
    gallery_images?: string[];

    // WooCommerce product fields
    woo_name: string;
    woo_description?: string;
    woo_short_description?: string;
    woo_regular_price?: string;
    woo_sale_price?: string;
    woo_sku?: string;
    woo_stock_quantity?: number;
    woo_manage_stock?: boolean;
    woo_base_price?: string;
    woo_status?: string;
    woo_catalog_visibility?: string;
    woo_type?: string;
    woo_featured?: boolean;
    woo_shop_id?: number;
    woo_categories?: Array<{ id: number; name: string; slug: string }>;
    woo_tags?: Array<{ id: number; name: string; slug: string }>;
    woo_date_on_sale_from?: string;
    woo_date_on_sale_to?: string;
    [key: string]: unknown;
}

export interface YourEntityUpdatePayload extends YourEntityUpdate {
    // Image upload fields
    image_file?: File | Blob;
    image_base64?: string;
    deleteImage?: boolean;

    // Gallery fields
    gallery_images?: string[];
    deleted_images?: string[];

    // WooCommerce product fields
    woo_name?: string;
    woo_description?: string;
    woo_short_description?: string;
    woo_regular_price?: string;
    woo_sale_price?: string;
    woo_sku?: string;
    woo_stock_quantity?: number;
    woo_manage_stock?: boolean;
    woo_base_price?: string;
    woo_status?: string;
    woo_catalog_visibility?: string;
    woo_type?: string;
    woo_featured?: boolean;
    woo_shop_id?: number;
    woo_categories?: Array<{ id: number; name: string; slug: string }>;
    woo_tags?: Array<{ id: number; name: string; slug: string }>;
    woo_date_on_sale_from?: string;
    woo_date_on_sale_to?: string;
    [key: string]: unknown;
}
```

## Service Implementation

### 2. Update Service File

Add WooCommerce integration to your service file (e.g.,
`supabaseYourEntity.ts`):

```typescript
import { SupabaseClient } from "../supabaseClient.ts";
import { SupabaseFunctionUtils } from "../supabaseFunctionUtils.ts";
import { SupabaseGalleryUtils } from "../galleries/supabaseGalleryUtils.ts";
import {
    CatalogVisibility,
    ProductStatus,
    ProductType,
    WooProducts,
} from "../../woo_commerce/products/wooProducts.ts";
import type {
    YourEntityInsert,
    YourEntityInsertPayload,
    YourEntityRow,
    YourEntityUpdate,
    YourEntityUpdatePayload,
    YourEntityWithWooCommerce,
} from "./your_entity.types.ts";

export class SupabaseYourEntityService {
    /**
     * Get entity by ID
     */
    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<YourEntityRow | null> {
        try {
            const { data, error } = await client
                .from("your_entity")
                .select("*")
                .eq("id", id)
                .is("deleted_at", null) // Use .is() for null values
                .single();

            if (error) {
                console.error("Error fetching entity:", error);
                return null;
            }

            return data;
        } catch (err) {
            console.error("Caught exception in getById query:", err);
            return null;
        }
    }

    /**
     * List entities
     */
    static async list(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
        } = {},
    ): Promise<YourEntityRow[]> {
        let query = client
            .from("your_entity")
            .select("*")
            .is("deleted_at", null); // Use .is() for null values

        if (options.search) {
            query = query.ilike("name", `%${options.search}%`);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.offset) {
            query = query.range(
                options.offset,
                options.offset + (options.limit || 10) - 1,
            );
        }

        try {
            const { data, error } = await query;

            if (error) {
                console.error("Error listing entities:", error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error("Caught exception in list query:", err);
            return [];
        }
    }

    /**
     * Enrich entity row with image URL and gallery images
     */
    static enrichEntityRow(
        row: YourEntityRow,
        galleryImages: Array<{ id: string; file_name: string; url: string }> =
            [],
    ): YourEntityWithWooCommerce {
        const enriched: YourEntityWithWooCommerce = {
            ...row,
            image_url: row.featured_image_path
                ? SupabaseFunctionUtils.buildPublicImageUrl(
                    "your-entity-images", // Replace with your bucket name
                    row.featured_image_path,
                )
                : null,
            images: galleryImages,
        };

        return enriched;
    }

    /**
     * Create entity with image and WooCommerce integration
     */
    static async createWithImageAndWooCommerce(
        client: SupabaseClient,
        payload: YourEntityInsertPayload,
    ): Promise<YourEntityWithWooCommerce> {
        // First create the entity to get the ID
        const {
            image_file: _image_file,
            image_base64: _image_base64,
            gallery_images: _gallery_images,
            woo_name: _woo_name,
            woo_description: _woo_description,
            woo_short_description: _woo_short_description,
            woo_regular_price: _woo_regular_price,
            woo_sale_price: _woo_sale_price,
            woo_sku: _woo_sku,
            woo_stock_quantity: _woo_stock_quantity,
            woo_manage_stock: _woo_manage_stock,
            woo_base_price: _woo_base_price,
            woo_status: _woo_status,
            woo_catalog_visibility: _woo_catalog_visibility,
            woo_type: _woo_type,
            woo_featured: _woo_featured,
            woo_shop_id: _woo_shop_id,
            woo_categories: _woo_categories,
            woo_tags: _woo_tags,
            woo_date_on_sale_from: _woo_date_on_sale_from,
            woo_date_on_sale_to: _woo_date_on_sale_to,
            ...entityData
        } = payload;

        // Create entity first to get the ID
        const created = await this.create(client, entityData);

        // Handle image upload if provided (now with the actual entity ID)
        let featuredImagePath: string | null = null;
        if (payload.image_file || payload.image_base64) {
            const imageData = payload.image_file || payload.image_base64!;
            const fileName = payload.image_file instanceof File
                ? payload.image_file.name
                : "entity-image.jpg";

            const uploadResult = await SupabaseFunctionUtils
                .handleFeaturedImageUpload(
                    client,
                    imageData,
                    fileName,
                    "your-entity-images", // Replace with your bucket name
                    created.id, // Use the actual entity ID
                    null, // No existing image to delete
                );

            if (uploadResult) {
                featuredImagePath = uploadResult.path;
                // Update the entity with the image path
                await this.update(client, created.id, {
                    featured_image_path: featuredImagePath,
                });
            }
        }

        // Handle gallery processing
        let galleryId: string | null = null;
        let galleryImages: Array<
            { id: string; file_name: string; url: string }
        > = [];

        if (payload.gallery_images && payload.gallery_images.length > 0) {
            try {
                const galleryResult = await SupabaseGalleryUtils
                    .processGalleryDataByContext(
                        client,
                        payload.gallery_images,
                        "your_entity", // Replace with your entity type
                    );
                galleryId = galleryResult.galleryId;
                galleryImages = galleryResult.images;
            } catch (error) {
                console.error("Error processing gallery:", error);
            }
        } else {
            // Create empty gallery
            try {
                const galleryResult = await SupabaseGalleryUtils
                    .processGalleryDataByContext(
                        client,
                        null,
                        "your_entity", // Replace with your entity type
                    );
                galleryId = galleryResult.galleryId;
            } catch (error) {
                console.error("Error creating empty gallery:", error);
            }
        }

        // Create WooCommerce product
        let wooProductId: number | null = null;
        try {
            const wooProductData = {
                name: payload.woo_name,
                type: payload.woo_type
                    ? (payload.woo_type as ProductType)
                    : ProductType.SIMPLE, // Default type
                status: payload.woo_status
                    ? (payload.woo_status as ProductStatus)
                    : ProductStatus.PUBLISH,
                description: payload.woo_description || "",
                short_description: payload.woo_short_description || "",
                regular_price: payload.woo_regular_price ||
                    payload.woo_base_price || "0",
                sale_price: payload.woo_sale_price || "",
                sku: payload.woo_sku || "",
                stock_quantity: payload.woo_stock_quantity,
                manage_stock: payload.woo_manage_stock || false,
                featured: payload.woo_featured || false,
                shop_id: payload.woo_shop_id,
                catalog_visibility: payload.woo_catalog_visibility
                    ? (payload.woo_catalog_visibility as CatalogVisibility)
                    : undefined,
                categories: payload.woo_categories || [],
                tags: payload.woo_tags || [],
                date_on_sale_from: payload.woo_date_on_sale_from,
                date_on_sale_to: payload.woo_date_on_sale_to,
            };

            const wooProduct = await WooProducts.createProduct(wooProductData);
            wooProductId = wooProduct.id;
        } catch (error) {
            console.error("Error creating WooCommerce product:", error);
            throw new Error("Failed to create WooCommerce product");
        }

        // Update entity with gallery and WooCommerce data
        const updated = await this.update(client, created.id, {
            gallery_id: galleryId,
            woo_product_id: wooProductId,
        });

        return this.enrichEntityRow(updated, galleryImages);
    }

    /**
     * Update entity with image and WooCommerce integration
     */
    static async updateWithImageAndWooCommerce(
        client: SupabaseClient,
        id: string,
        payload: YourEntityUpdatePayload,
        imageData?: File | Blob | string,
        fileName?: string,
        shouldDeleteImage?: boolean,
    ): Promise<YourEntityWithWooCommerce> {
        // Get current entity
        const current = await this.getById(client, id);
        if (!current) {
            throw new Error("Entity not found");
        }

        // Filter out WooCommerce fields from entity update
        const {
            image_file: _image_file,
            image_base64: _image_base64,
            gallery_images: _gallery_images,
            deleted_images: _deleted_images,
            deleteImage: _deleteImage,
            woo_name: _woo_name,
            woo_description: _woo_description,
            woo_short_description: _woo_short_description,
            woo_regular_price: _woo_regular_price,
            woo_sale_price: _woo_sale_price,
            woo_sku: _woo_sku,
            woo_stock_quantity: _woo_stock_quantity,
            woo_manage_stock: _woo_manage_stock,
            woo_base_price: _woo_base_price,
            woo_status: _woo_status,
            woo_catalog_visibility: _woo_catalog_visibility,
            woo_type: _woo_type,
            woo_featured: _woo_featured,
            woo_shop_id: _woo_shop_id,
            woo_categories: _woo_categories,
            woo_tags: _woo_tags,
            woo_date_on_sale_from: _woo_date_on_sale_from,
            woo_date_on_sale_to: _woo_date_on_sale_to,
            ...updatePayload
        } = payload;

        // Handle image operations
        if (shouldDeleteImage) {
            // Delete existing image if it exists
            if (current.featured_image_path) {
                await SupabaseFunctionUtils.deleteImage(
                    client,
                    "your-entity-images", // Replace with your bucket name
                    current.featured_image_path,
                );
                updatePayload.featured_image_path = null;
            }
        } else if (imageData && fileName) {
            // Handle new image upload
            const uploadResult = await SupabaseFunctionUtils
                .handleFeaturedImageUpload(
                    client,
                    imageData,
                    fileName,
                    "your-entity-images", // Replace with your bucket name
                    id,
                    current.featured_image_path,
                );

            if (uploadResult) {
                updatePayload.featured_image_path = uploadResult.path;
            }
        }

        // Update WooCommerce product if we have woo_product_id
        if (
            current.woo_product_id && (
                payload.woo_name ||
                payload.woo_description ||
                payload.woo_short_description ||
                payload.woo_regular_price ||
                payload.woo_sale_price ||
                payload.woo_sku ||
                payload.woo_stock_quantity !== undefined ||
                payload.woo_manage_stock !== undefined ||
                payload.woo_base_price ||
                payload.woo_status ||
                payload.woo_catalog_visibility ||
                payload.woo_type ||
                payload.woo_featured !== undefined ||
                payload.woo_shop_id !== undefined ||
                payload.woo_categories ||
                payload.woo_tags ||
                payload.woo_date_on_sale_from !== undefined ||
                payload.woo_date_on_sale_to !== undefined
            )
        ) {
            try {
                const wooUpdateData: Record<string, unknown> = {};

                if (payload.woo_name) wooUpdateData.name = payload.woo_name;
                if (payload.woo_description) {
                    wooUpdateData.description = payload.woo_description;
                }
                if (payload.woo_short_description) {
                    wooUpdateData.short_description =
                        payload.woo_short_description;
                }
                if (payload.woo_regular_price) {
                    wooUpdateData.regular_price = payload.woo_regular_price;
                }
                if (payload.woo_sale_price) {
                    wooUpdateData.sale_price = payload.woo_sale_price;
                }
                if (payload.woo_sku) wooUpdateData.sku = payload.woo_sku;
                if (payload.woo_stock_quantity !== undefined) {
                    wooUpdateData.stock_quantity = payload.woo_stock_quantity;
                }
                if (payload.woo_manage_stock !== undefined) {
                    wooUpdateData.manage_stock = payload.woo_manage_stock;
                }
                if (payload.woo_base_price) {
                    wooUpdateData.regular_price = payload.woo_base_price; // base_price maps to regular_price
                }
                if (payload.woo_status) {
                    wooUpdateData.status = payload.woo_status;
                }
                if (payload.woo_catalog_visibility) {
                    wooUpdateData.catalog_visibility =
                        payload.woo_catalog_visibility;
                }
                if (payload.woo_type) {
                    wooUpdateData.type = payload.woo_type;
                }
                if (payload.woo_featured !== undefined) {
                    wooUpdateData.featured = payload.woo_featured;
                }
                if (payload.woo_shop_id !== undefined) {
                    wooUpdateData.shop_id = payload.woo_shop_id;
                }
                if (payload.woo_categories) {
                    wooUpdateData.categories = payload.woo_categories;
                }
                if (payload.woo_tags) wooUpdateData.tags = payload.woo_tags;
                if (payload.woo_date_on_sale_from !== undefined) {
                    wooUpdateData.date_on_sale_from =
                        payload.woo_date_on_sale_from;
                }
                if (payload.woo_date_on_sale_to !== undefined) {
                    wooUpdateData.date_on_sale_to = payload.woo_date_on_sale_to;
                }

                await WooProducts.updateProduct(
                    current.woo_product_id,
                    wooUpdateData,
                );
            } catch (error) {
                console.error("Error updating WooCommerce product:", error);
                // Continue with entity update even if WooCommerce fails
            }
        }

        // Update the entity
        const updated = await this.update(client, id, updatePayload);

        // Get gallery images for response
        let galleryImages: Array<
            { id: string; file_name: string; url: string }
        > = [];
        if (updated.gallery_id) {
            try {
                galleryImages = await SupabaseGalleryUtils
                    .getGalleryImagesByContext(
                        client,
                        updated.gallery_id,
                        "your_entity", // Replace with your entity type
                    );
            } catch (error) {
                console.error("Error fetching gallery images:", error);
            }
        }

        return this.enrichEntityRow(updated, galleryImages);
    }

    /**
     * Delete entity with cleanup
     */
    static async deleteWithImageAndWooCommerceCleanup(
        client: SupabaseClient,
        id: string,
    ): Promise<YourEntityRow> {
        const entity = await this.getById(client, id);
        if (!entity) {
            throw new Error("Entity not found");
        }

        // Delete WooCommerce product
        if (entity.woo_product_id) {
            try {
                await WooProducts.deleteProduct(
                    entity.woo_product_id,
                    true,
                );
            } catch (error) {
                console.error("Error deleting WooCommerce product:", error);
                // Continue with entity deletion even if WooCommerce fails
            }
        }

        // Delete featured image
        if (entity.featured_image_path) {
            try {
                await SupabaseFunctionUtils.deleteImage(
                    client,
                    "your-entity-images", // Replace with your bucket name
                    entity.featured_image_path,
                );
            } catch (error) {
                console.error("Error deleting featured image:", error);
            }
        }

        // Delete gallery
        if (entity.gallery_id) {
            try {
                await SupabaseGalleryUtils.deleteGallery(
                    client,
                    entity.gallery_id,
                    {
                        bucket: "your-entity-galleries", // Replace with your bucket name
                        folderPrefix: "gallery",
                    },
                );
            } catch (error) {
                console.error("Error deleting gallery:", error);
            }
        }

        return await this.softDelete(client, id);
    }

    /**
     * Get entity with WooCommerce data
     */
    static async getWithWooData(
        client: SupabaseClient,
        id: string,
    ): Promise<YourEntityWithWooCommerce | null> {
        const entity = await this.getById(client, id);
        if (!entity) {
            return null;
        }

        // Get gallery images
        let galleryImages: Array<
            { id: string; file_name: string; url: string }
        > = [];
        if (entity.gallery_id) {
            try {
                galleryImages = await SupabaseGalleryUtils
                    .getGalleryImagesByContext(
                        client,
                        entity.gallery_id,
                        "your_entity", // Replace with your entity type
                    );
            } catch (error) {
                console.error("Error fetching gallery images:", error);
            }
        }

        const enriched = this.enrichEntityRow(entity, galleryImages);

        // Get WooCommerce product data if woo_product_id exists
        if (entity.woo_product_id) {
            try {
                const wooProduct = await WooProducts.getProductById(
                    entity.woo_product_id,
                );
                // Flatten WooCommerce fields (excluding id, categories, images)
                enriched.woo_name = wooProduct.name;
                enriched.woo_description = wooProduct.description;
                enriched.woo_short_description = wooProduct.short_description;
                enriched.woo_price = wooProduct.price;
                enriched.woo_regular_price = wooProduct.regular_price;
                enriched.woo_sale_price = wooProduct.sale_price;
                enriched.woo_sku = wooProduct.sku;
                enriched.woo_status = wooProduct.status;
                enriched.woo_stock_status = wooProduct.stock_status;
                enriched.woo_stock_quantity = wooProduct.stock_quantity;
                enriched.woo_manage_stock = wooProduct.manage_stock;
                enriched.woo_featured = wooProduct.featured;
                enriched.woo_date_on_sale_from = wooProduct.date_on_sale_from;
                enriched.woo_date_on_sale_to = wooProduct.date_on_sale_to;
                enriched.woo_tags = wooProduct.tags;
            } catch (error) {
                console.error("Error fetching WooCommerce product:", error);
            }
        }

        return enriched;
    }

    /**
     * List entities with WooCommerce data
     */
    static async listWithWooData(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
            include_galleries?: boolean;
        } = {},
    ): Promise<YourEntityWithWooCommerce[]> {
        const enrichedData = await this.listEnriched(client, options);

        // Get all WooCommerce product IDs
        const wooProductIds = enrichedData
            .map((entity) => entity.woo_product_id)
            .filter((id): id is number => id !== null);

        if (wooProductIds.length === 0) {
            return enrichedData;
        }

        // Bulk fetch WooCommerce products
        let wooProducts: Array<{
            id: number;
            name: string;
            description: string;
            short_description: string;
            price: string;
            regular_price: string;
            sale_price: string;
            sku: string;
            status: string;
            stock_status: string;
            stock_quantity: number;
            manage_stock: boolean;
            featured: boolean;
            date_on_sale_from: string;
            date_on_sale_to: string;
            tags: Array<{ id: number; name: string; slug: string }>;
        }> = [];
        try {
            wooProducts = await WooProducts.getAllProducts({
                include: wooProductIds,
                per_page: wooProductIds.length,
            });
        } catch (error) {
            console.error("Error fetching WooCommerce products:", error);
            return enrichedData;
        }

        // Create a map of WooCommerce products by ID
        const wooProductMap = new Map(wooProducts.map((p) => [p.id, p]));

        // Merge WooCommerce data with entities
        return enrichedData.map((entity) => {
            if (
                entity.woo_product_id &&
                wooProductMap.has(entity.woo_product_id)
            ) {
                const wooProduct = wooProductMap.get(entity.woo_product_id);
                if (wooProduct) {
                    // Flatten WooCommerce fields (excluding id, categories, images)
                    entity.woo_name = wooProduct.name;
                    entity.woo_description = wooProduct.description;
                    entity.woo_short_description = wooProduct.short_description;
                    entity.woo_price = wooProduct.price;
                    entity.woo_regular_price = wooProduct.regular_price;
                    entity.woo_sale_price = wooProduct.sale_price;
                    entity.woo_sku = wooProduct.sku;
                    entity.woo_status = wooProduct.status;
                    entity.woo_stock_status = wooProduct.stock_status;
                    entity.woo_stock_quantity = wooProduct.stock_quantity;
                    entity.woo_manage_stock = wooProduct.manage_stock;
                    entity.woo_featured = wooProduct.featured;
                    entity.woo_date_on_sale_from = wooProduct.date_on_sale_from;
                    entity.woo_date_on_sale_to = wooProduct.date_on_sale_to;
                    entity.woo_tags = wooProduct.tags;
                }
            }
            return entity;
        });
    }

    // Add your basic CRUD methods here
    static async create(
        client: SupabaseClient,
        payload: YourEntityInsert,
    ): Promise<YourEntityRow> {
        const { data, error } = await client
            .from("your_entity")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create entity: ${error.message}`);
        }

        return data;
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: YourEntityUpdate,
    ): Promise<YourEntityRow> {
        const { data, error } = await client
            .from("your_entity")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update entity: ${error.message}`);
        }

        return data;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<YourEntityRow> {
        const { data, error } = await client
            .from("your_entity")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to delete entity: ${error.message}`);
        }

        return data;
    }

    static async listEnriched(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
            include_galleries?: boolean;
        } = {},
    ): Promise<YourEntityWithWooCommerce[]> {
        const data = await this.list(client, options);
        const enrichedData: YourEntityWithWooCommerce[] = [];

        for (const row of data) {
            let galleryImages: Array<
                { id: string; file_name: string; url: string }
            > = [];

            if (options.include_galleries && row.gallery_id) {
                try {
                    galleryImages = await SupabaseGalleryUtils
                        .getGalleryImagesByContext(
                            client,
                            row.gallery_id,
                            "your_entity", // Replace with your entity type
                        );
                } catch (error) {
                    console.error("Error fetching gallery images:", error);
                }
            }

            const enriched = this.enrichEntityRow(row, galleryImages);
            enrichedData.push(enriched);
        }

        return enrichedData;
    }
}
```

## API Controller Integration

### 3. Update API Controller

Update your API controller to use the new methods:

```typescript
// In your API controller (e.g., YourEntityApiController.ts)

import { SupabaseYourEntityService } from "../_shared/supabase/your_entity/supabaseYourEntity.ts";
import type { YourEntityWithWooCommerce } from "../_shared/supabase/your_entity/your_entity.types.ts";

export class YourEntityApiController {
    /**
     * GET - Single entity with WooCommerce data
     */
    static async get(req: Request): Promise<Response> {
        try {
            const { id } = req.params;

            const entity = await SupabaseYourEntityService.getWithWooData(
                client,
                id,
            );

            if (!entity) {
                return ResponseService.error("Entity not found", 404);
            }

            return ResponseService.success(entity);
        } catch (error) {
            console.error("Error fetching entity:", error);
            return ResponseService.error("Internal server error", 500);
        }
    }

    /**
     * GET - List entities with WooCommerce data
     */
    static async list(req: Request): Promise<Response> {
        try {
            const query = new URL(req.url).searchParams;
            const options = {
                limit: query.get("limit")
                    ? parseInt(query.get("limit")!)
                    : undefined,
                offset: query.get("offset")
                    ? parseInt(query.get("offset")!)
                    : undefined,
                search: query.get("search") || undefined,
                include_galleries: query.get("include_galleries") === "true",
            };

            const entities = await SupabaseYourEntityService.listWithWooData(
                client,
                options,
            );

            return ResponseService.success(entities);
        } catch (error) {
            console.error("Error listing entities:", error);
            return ResponseService.error("Internal server error", 500);
        }
    }

    /**
     * POST - Create entity with WooCommerce integration
     */
    static async post(req: Request): Promise<Response> {
        try {
            const payload = await req.json();

            const entity = await SupabaseYourEntityService
                .createWithImageAndWooCommerce(
                    client,
                    payload,
                );

            return ResponseService.success(entity, 201);
        } catch (error) {
            console.error("Error creating entity:", error);
            return ResponseService.error("Failed to create entity", 400);
        }
    }

    /**
     * PUT - Update entity with WooCommerce integration
     */
    static async put(req: Request): Promise<Response> {
        try {
            const { id } = req.params;
            const payload = await req.json();

            // Handle image data
            let imageData: File | Blob | string | undefined;
            let fileName: string | undefined;

            if (payload.image_file) {
                imageData = payload.image_file;
                fileName = payload.image_file.name;
            } else if (payload.image_base64) {
                imageData = payload.image_base64;
                fileName = "entity-image.jpg";
            }

            const shouldDeleteImage = payload.deleteImage || false;

            const entity = await SupabaseYourEntityService
                .updateWithImageAndWooCommerce(
                    client,
                    id,
                    payload,
                    imageData,
                    fileName,
                    shouldDeleteImage,
                );

            return ResponseService.success(entity);
        } catch (error) {
            console.error("Error updating entity:", error);
            return ResponseService.error("Failed to update entity", 400);
        }
    }

    /**
     * DELETE - Delete entity with cleanup
     */
    static async delete(req: Request): Promise<Response> {
        try {
            const { id } = req.params;

            const entity = await SupabaseYourEntityService
                .deleteWithImageAndWooCommerceCleanup(
                    client,
                    id,
                );

            return ResponseService.success(entity);
        } catch (error) {
            console.error("Error deleting entity:", error);
            return ResponseService.error("Failed to delete entity", 400);
        }
    }
}
```

## Important Notes

### Database Queries

- **Always use `.is("deleted_at", null)` instead of `.eq("deleted_at", null)`**
  to avoid timestamp parsing errors
- Use `.select("*")` for full schema support

### WooCommerce Integration

- Products are created in WooCommerce first, then linked via `woo_product_id`
- WooCommerce fields are flattened to the same level as entity fields
- Excluded fields: `woo_product.id`, `woo_product.categories`,
  `woo_product.images`

### Image Handling

- Featured images use `image_url` field (not `featured_image_url`)
- Gallery images are handled separately
- Images are uploaded to entity-specific buckets

### Error Handling

- WooCommerce failures don't stop entity operations
- Graceful degradation for missing WooCommerce data
- Comprehensive error logging

## Testing

### Sample Request Payloads

**Create Entity:**

```json
{
    "name": "Test Entity",
    "description": "Test description",
    "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
    "gallery_images": ["data:image/jpeg;base64,/9j/4AAQ..."],
    "woo_name": "WooCommerce Product",
    "woo_description": "WooCommerce description",
    "woo_regular_price": "100.00",
    "woo_sale_price": "90.00",
    "woo_status": "publish",
    "woo_manage_stock": true,
    "woo_stock_quantity": 10,
    "woo_date_on_sale_from": "2024-01-01T00:00:00Z",
    "woo_date_on_sale_to": "2024-12-31T23:59:59Z"
}
```

**Update Entity:**

```json
{
    "name": "Updated Entity",
    "woo_name": "Updated WooCommerce Product",
    "woo_regular_price": "150.00",
    "deleteImage": false
}
```

### Expected Response Structure

```json
{
    "success": true,
    "data": {
        "id": "entity-id",
        "name": "Entity Name",
        "image_url": "https://storage.url/image.jpg",
        "images": [
            {
                "id": "gallery-image-id",
                "file_name": "image.jpg",
                "url": "https://storage.url/gallery/image.jpg"
            }
        ],
        "woo_name": "WooCommerce Product Name",
        "woo_description": "WooCommerce description",
        "woo_price": "100.00",
        "woo_regular_price": "100.00",
        "woo_sale_price": "90.00",
        "woo_sku": "SKU123",
        "woo_status": "publish",
        "woo_stock_status": "instock",
        "woo_stock_quantity": 10,
        "woo_manage_stock": true,
        "woo_featured": true,
        "woo_date_on_sale_from": "2024-01-01T00:00:00Z",
        "woo_date_on_sale_to": "2024-12-31T23:59:59Z",
        "woo_tags": [
            {
                "id": 1,
                "name": "Tag Name",
                "slug": "tag-name"
            }
        ]
    }
}
```

This guide provides a complete template for adding WooCommerce integration to
any Supabase function. Simply replace the placeholder values with your specific
entity details and you'll have a fully functional WooCommerce-integrated API! 🚀
