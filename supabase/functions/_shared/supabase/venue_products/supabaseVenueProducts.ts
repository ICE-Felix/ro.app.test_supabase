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
    VenueProductInsert,
    VenueProductInsertPayload,
    VenueProductRow,
    VenueProductUpdate,
    VenueProductUpdatePayload,
    VenueProductWithImages,
} from "./venue_products.types.ts";

export class SupabaseVenueProductsService {
    /**
     * Get venue product by ID
     */
    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueProductRow | null> {
        try {
            const { data, error } = await client
                .from("venue_products")
                .select("*")
                .eq("id", id)
                .is("deleted_at", null)
                .single();

            if (error) {
                console.error("Error fetching venue product:", error);
                return null;
            }

            return data;
        } catch (err) {
            console.error("Caught exception in getById query:", err);
            return null;
        }
    }

    /**
     * List venue products with pagination and search
     */
    static async list(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
            venue_id?: string;
        } = {},
    ): Promise<VenueProductRow[]> {
        let query = client
            .from("venue_products")
            .select("*")
            .is("deleted_at", null);

        if (options.venue_id) {
            query = query.eq("venue_id", options.venue_id);
        }

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
                console.error("Error listing venue products:", error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error("Caught exception in list query:", err);
            return [];
        }
    }

    /**
     * Create venue product
     */
    static async create(
        client: SupabaseClient,
        payload: VenueProductInsert,
    ): Promise<VenueProductRow> {
        const { data, error } = await client
            .from("venue_products")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create venue product: ${error.message}`);
        }

        return data;
    }

    /**
     * Update venue product
     */
    static async update(
        client: SupabaseClient,
        id: string,
        payload: VenueProductUpdate,
    ): Promise<VenueProductRow> {
        const { data, error } = await client
            .from("venue_products")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update venue product: ${error.message}`);
        }

        return data;
    }

    /**
     * Soft delete venue product
     */
    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueProductRow> {
        const { data, error } = await client
            .from("venue_products")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to delete venue product: ${error.message}`);
        }

        return data;
    }

    /**
     * Enrich venue product row with image URL and gallery images
     */
    static enrichVenueProductRow(
        row: VenueProductRow,
        galleryImages: Array<{ id: string; file_name: string; url: string }> =
            [],
    ): VenueProductWithImages {
        const enriched: VenueProductWithImages = {
            ...row,
            image_url: row.featured_image_path
                ? SupabaseFunctionUtils.buildPublicImageUrl(
                    "venue-products-images",
                    row.featured_image_path,
                )
                : null,
            images: galleryImages,
        };

        return enriched;
    }

    /**
     * Enrich venue product row with related data (venue name and venue product categories)
     */
    static async enrichVenueProductRowWithRelatedData(
        client: SupabaseClient,
        row: VenueProductRow,
        galleryImages: Array<{ id: string; file_name: string; url: string }> =
            [],
    ): Promise<VenueProductWithImages> {
        const enriched = this.enrichVenueProductRow(row, galleryImages);

        // Fetch venue name
        let venueName: string | null = null;
        if (row.venue_id) {
            try {
                const { data: venueData, error: venueError } = await client
                    .from("venues")
                    .select("name")
                    .eq("id", row.venue_id)
                    .is("deleted_at", null)
                    .single();

                if (!venueError && venueData) {
                    venueName = venueData.name;
                }
            } catch (error) {
                console.error("Error fetching venue name:", error);
            }
        }

        // Fetch venue product categories names
        let venueProductCategoriesNames: string[] = [];
        console.log(
            `Fetching venue product categories for venue product ${row.id}`,
        );
        console.log(
            `venue_product_categories field:`,
            row.venue_product_categories,
        );
        console.log(
            `venue_product_categories type:`,
            typeof row.venue_product_categories,
        );
        console.log(
            `venue_product_categories is array:`,
            Array.isArray(row.venue_product_categories),
        );

        if (
            row.venue_product_categories &&
            Array.isArray(row.venue_product_categories)
        ) {
            console.log(
                `venue_product_categories is array with ${row.venue_product_categories.length} items:`,
                row.venue_product_categories,
            );
            try {
                // First, let's check if there are any venue product categories at all
                const { data: allCategories, error: _allCategoriesError } =
                    await client
                        .from("venue_product_categories")
                        .select("id, name")
                        .is("deleted_at", null);
                console.log(
                    `All venue product categories in database:`,
                    allCategories,
                );

                const { data: categoriesData, error: categoriesError } =
                    await client
                        .from("venue_product_categories")
                        .select("id, name")
                        .in("id", row.venue_product_categories)
                        .is("deleted_at", null);

                console.log(`Categories query result:`, {
                    categoriesData,
                    categoriesError,
                });

                if (!categoriesError && categoriesData) {
                    console.log(
                        `Found ${categoriesData.length} categories:`,
                        categoriesData,
                    );
                    // Create a map for quick lookup
                    const categoryMap = new Map(
                        categoriesData.map((cat) => [cat.id, cat.name]),
                    );

                    // Maintain the order from the original array
                    venueProductCategoriesNames = row.venue_product_categories
                        .map((id) => categoryMap.get(id))
                        .filter((name) => name !== undefined) as string[];

                    console.log(
                        `Final venue_product_categories_names:`,
                        venueProductCategoriesNames,
                    );
                } else {
                    console.log(
                        `Categories query failed or returned no data:`,
                        { categoriesError, categoriesData },
                    );
                }
            } catch (error) {
                console.error(
                    "Error fetching venue product categories:",
                    error,
                );
            }
        } else {
            console.log(
                `venue_product_categories is not an array or is null/undefined:`,
                row.venue_product_categories,
            );
        }

        enriched.venue_name = venueName;
        enriched.venue_product_categories_name = venueProductCategoriesNames;

        return enriched;
    }

    /**
     * List enriched venue products
     */
    static async listEnriched(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
            venue_id?: string;
            include_galleries?: boolean;
        } = {},
    ): Promise<VenueProductWithImages[]> {
        const data = await this.list(client, options);
        const enrichedData: VenueProductWithImages[] = [];

        for (const row of data) {
            let galleryImages: Array<
                { id: string; file_name: string; url: string }
            > = [];

            if (options.include_galleries !== false && row.gallery_id) {
                console.log(
                    `[DEBUG] Fetching gallery images for venue product ${row.id}, gallery_id: ${row.gallery_id}`,
                );
                try {
                    galleryImages = await SupabaseGalleryUtils
                        .getGalleryImagesByContext(
                            client,
                            row.gallery_id,
                            "venue_products",
                        );
                    console.log(
                        `[DEBUG] Found ${galleryImages.length} gallery images for venue product ${row.id}`,
                    );
                } catch (error) {
                    console.error("Error fetching gallery images:", error);
                }
            } else {
                console.log(
                    `[DEBUG] Skipping gallery images for venue product ${row.id} (include_galleries: ${options.include_galleries}, gallery_id: ${row.gallery_id})`,
                );
            }

            const enriched = await this.enrichVenueProductRowWithRelatedData(
                client,
                row,
                galleryImages,
            );
            enrichedData.push(enriched);
        }

        return enrichedData;
    }

    /**
     * Create venue product with image and WooCommerce integration
     */
    static async createWithImage(
        client: SupabaseClient,
        payload: VenueProductInsertPayload,
    ): Promise<VenueProductWithImages> {
        // First create the venue product to get the ID
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
            ...venueProductData
        } = payload;

        // Create venue product first to get the ID
        const created = await this.create(client, venueProductData);

        // Handle image upload if provided (now with the actual venue product ID)
        let featuredImagePath: string | null = null;
        if (payload.image_file || payload.image_base64) {
            const imageData = payload.image_file || payload.image_base64!;
            const fileName = payload.image_file instanceof File
                ? payload.image_file.name
                : "venue-product-image.jpg";

            const uploadResult = await SupabaseFunctionUtils
                .handleFeaturedImageUpload(
                    client,
                    imageData,
                    fileName,
                    "venue-products-images",
                    created.id, // Use the actual venue product ID
                    null, // No existing image to delete
                );

            if (uploadResult) {
                featuredImagePath = uploadResult.path;
                // Update the venue product with the image path
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
                        "venue_products",
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
                        "venue_products",
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
                    : ProductType.SIMPLE, // Default to grouped for venue products
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

        // Update venue product with gallery and WooCommerce data
        const updated = await this.update(client, created.id, {
            gallery_id: galleryId,
            woo_product_id: wooProductId,
        });

        return await this.enrichVenueProductRowWithRelatedData(
            client,
            updated,
            galleryImages,
        );
    }

    /**
     * Update venue product with image and WooCommerce integration
     */
    static async updateWithImage(
        client: SupabaseClient,
        id: string,
        payload: VenueProductUpdatePayload,
        imageData?: File | Blob | string,
        fileName?: string,
        shouldDeleteImage?: boolean,
    ): Promise<VenueProductWithImages> {
        // Get current venue product
        const current = await this.getById(client, id);
        if (!current) {
            throw new Error("Venue product not found");
        }

        // Filter out WooCommerce fields from venue product update
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
                    "venue-products-images",
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
                    "venue-products-images",
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
                // Continue with venue product update even if WooCommerce fails
            }
        }

        // Update the venue product
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
                        "venue_products",
                    );
            } catch (error) {
                console.error("Error fetching gallery images:", error);
            }
        }

        return await this.enrichVenueProductRowWithRelatedData(
            client,
            updated,
            galleryImages,
        );
    }

    /**
     * Delete venue product with cleanup
     */
    static async deleteWithImageCleanup(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueProductRow> {
        const venueProduct = await this.getById(client, id);
        if (!venueProduct) {
            throw new Error("Venue product not found");
        }

        // Delete WooCommerce product
        if (venueProduct.woo_product_id) {
            try {
                await WooProducts.deleteProduct(
                    venueProduct.woo_product_id,
                    true,
                );
            } catch (error) {
                console.error("Error deleting WooCommerce product:", error);
                // Continue with venue product deletion even if WooCommerce fails
            }
        }

        // Delete featured image
        if (venueProduct.featured_image_path) {
            try {
                await SupabaseFunctionUtils.deleteImage(
                    client,
                    "venue-products-images",
                    venueProduct.featured_image_path,
                );
            } catch (error) {
                console.error("Error deleting featured image:", error);
            }
        }

        // Delete gallery
        if (venueProduct.gallery_id) {
            try {
                await SupabaseGalleryUtils.deleteGallery(
                    client,
                    venueProduct.gallery_id,
                    {
                        bucket: "venue-products-galleries",
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
     * Get venue products with WooCommerce data
     */
    static async getWithWooData(
        client: SupabaseClient,
        id: string,
    ): Promise<VenueProductWithImages | null> {
        const venueProduct = await this.getById(client, id);
        if (!venueProduct) {
            return null;
        }

        // Get gallery images
        let galleryImages: Array<
            { id: string; file_name: string; url: string }
        > = [];
        if (venueProduct.gallery_id) {
            console.log(
                `[DEBUG] Venue product ${id} has gallery_id: ${venueProduct.gallery_id}`,
            );
            try {
                galleryImages = await SupabaseGalleryUtils
                    .getGalleryImagesByContext(
                        client,
                        venueProduct.gallery_id,
                        "venue_products",
                    );
                console.log(
                    `[DEBUG] Retrieved ${galleryImages.length} gallery images for venue product ${id}`,
                );
            } catch (error) {
                console.error("Error fetching gallery images:", error);
            }
        } else {
            console.log(`[DEBUG] Venue product ${id} has no gallery_id`);
        }

        const enriched = await this.enrichVenueProductRowWithRelatedData(
            client,
            venueProduct,
            galleryImages,
        );

        // Get WooCommerce product data if woo_product_id exists
        if (venueProduct.woo_product_id) {
            try {
                const wooProduct = await WooProducts.getProductById(
                    venueProduct.woo_product_id,
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
     * List venue products with WooCommerce data
     */
    static async listWithWooData(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
            venue_id?: string;
            include_galleries?: boolean;
        } = {},
    ): Promise<VenueProductWithImages[]> {
        const enrichedData = await this.listEnriched(client, options);

        // Get all WooCommerce product IDs
        const wooProductIds = enrichedData
            .map((vp) => vp.woo_product_id)
            .filter((id): id is number => id !== null);

        console.log("WooCommerce product IDs found:", wooProductIds);
        console.log("Total venue products:", enrichedData.length);

        if (wooProductIds.length === 0) {
            console.log(
                "No WooCommerce product IDs found, returning enriched data without WooCommerce fields",
            );
            return enrichedData;
        }

        // Fetch WooCommerce products individually (like getWithWooData does)
        const wooProducts: Array<{
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
            images: Array<
                { id: number; src: string; name: string; alt: string }
            >;
            categories: Array<{ id: number; name: string; slug: string }>;
            tags: Array<{ id: number; name: string; slug: string }>;
        }> = [];

        console.log(
            "Fetching WooCommerce products individually for IDs:",
            wooProductIds,
        );

        // Fetch each product individually (same approach as getWithWooData)
        for (const productId of wooProductIds) {
            try {
                console.log(`Fetching WooCommerce product ${productId}`);
                const wooProduct = await WooProducts.getProductById(productId);
                wooProducts.push(wooProduct);
                console.log(
                    `Successfully fetched WooCommerce product ${productId}`,
                );
            } catch (error) {
                console.error(
                    `Error fetching WooCommerce product ${productId}:`,
                    error,
                );
                // Continue with other products even if one fails
            }
        }

        console.log("WooCommerce products fetched:", wooProducts.length);
        console.log(
            "WooCommerce product IDs returned:",
            wooProducts.map((p) => p.id),
        );

        // Create a map of WooCommerce products by ID
        const wooProductMap = new Map(wooProducts.map((p) => [p.id, p]));
        console.log(
            "WooCommerce product map created with",
            wooProductMap.size,
            "products",
        );

        // Merge WooCommerce data with venue products
        return enrichedData.map((venueProduct) => {
            console.log(
                `Processing venue product ${venueProduct.id}, woo_product_id: ${venueProduct.woo_product_id}`,
            );
            if (
                venueProduct.woo_product_id &&
                wooProductMap.has(venueProduct.woo_product_id)
            ) {
                const wooProduct = wooProductMap.get(
                    venueProduct.woo_product_id,
                );
                if (wooProduct) {
                    console.log(
                        `Merging WooCommerce data for venue product ${venueProduct.id}`,
                    );
                    // Flatten WooCommerce fields (excluding id, categories, images)
                    venueProduct.woo_name = wooProduct.name;
                    venueProduct.woo_description = wooProduct.description;
                    venueProduct.woo_short_description =
                        wooProduct.short_description;
                    venueProduct.woo_price = wooProduct.price;
                    venueProduct.woo_regular_price = wooProduct.regular_price;
                    venueProduct.woo_sale_price = wooProduct.sale_price;
                    venueProduct.woo_sku = wooProduct.sku;
                    venueProduct.woo_status = wooProduct.status;
                    venueProduct.woo_stock_status = wooProduct.stock_status;
                    venueProduct.woo_stock_quantity = wooProduct.stock_quantity;
                    venueProduct.woo_manage_stock = wooProduct.manage_stock;
                    venueProduct.woo_featured = wooProduct.featured;
                    venueProduct.woo_date_on_sale_from =
                        wooProduct.date_on_sale_from;
                    venueProduct.woo_date_on_sale_to =
                        wooProduct.date_on_sale_to;
                    venueProduct.woo_tags = wooProduct.tags;
                }
            } else {
                console.log(
                    `No WooCommerce data found for venue product ${venueProduct.id} (woo_product_id: ${venueProduct.woo_product_id})`,
                );
            }
            return venueProduct;
        });
    }
}
