import { SupabaseFunctionUtils } from "../supabaseFunctionUtils.ts";
import { SupabaseGalleryUtils } from "../galleries/supabaseGalleryUtils.ts";
import { ProductStatus, ProductType, WooProducts } from "../../woo_commerce/products/wooProducts.ts";

type ListOptions = {
    service_provider_id?: string;
    search?: string;
    include_galleries?: boolean;
    limit?: number;
    offset?: number;

    // Pagination
    page?: number; // 1-based page number (if provided, takes precedence over offset for computing the page)

    // Category filtering
    category_ids?: (string | number)[];
    category_name?: string;        // fuzzy by name (ilike)
    include_descendants?: boolean; // default true

    // Future: orderBy, etc.
    orderBy?: string;
};

export interface PaginationMeta {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export class SupabaseServicesService {
    // ========================
    // Basic CRUD helpers
    // ========================
    static async getById(client: any, id: string | number) {
        try {
            const { data, error } = await client
                .from("services")
                .select("*")
                .eq("id", id)
                .is("deleted_at", null)
                .single();
            if (error) return null;
            return data;
        } catch {
            return null;
        }
    }

    static async create(client: any, payload: any) {
        const { data, error } = await client
            .from("services")
            .insert(payload)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to create service: ${error.message}`);
        }
        return data;
    }

    static async update(client: any, id: string | number, payload: any) {
        const { data, error } = await client
            .from("services")
            .update(payload)
            .eq("id", id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update service: ${error.message}`);
        }
        return data;
    }

    static async softDelete(client: any, id: string | number) {
        const { data, error } = await client
            .from("services")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to delete service: ${error.message}`);
        }
        return data;
    }

    // ========================
    // Category helpers
    // ========================
    static async findCategoryIdsByName(client: any, name: string): Promise<(string | number)[]> {
        if (!name?.trim()) return [];
        const { data, error } = await client
            .from("service_categories")
            .select("id")
            .ilike("name", `%${name.trim()}%`)
            .is("deleted_at", null);

        if (error || !data) return [];
        return data.map((r: { id: string | number }) => r.id);
    }

    /**
     * Expands a list of category ids to include all their descendants.
     * Assumes `service_categories.parent_ids` is an array containing the full ancestor chain.
     */
    static async expandDescendants(client: any, rootIds: (string | number)[]): Promise<(string | number)[]> {
        if (!rootIds?.length) return [];

        const uniqueRoots = Array.from(new Set(rootIds));

        // Direct ids (safety)
        const { data: direct, error: e1 } = await client
            .from("service_categories")
            .select("id")
            .in("id", uniqueRoots)
            .is("deleted_at", null);

        const directIds: (string | number)[] = e1 || !direct ? [] : direct.map((r: any) => r.id);

        // All descendants where parent_ids overlaps any root
        const { data: desc, error: e2 } = await client
            .from("service_categories")
            .select("id, parent_ids")
            .overlaps("parent_ids", uniqueRoots)
            .is("deleted_at", null);

        const descIds: (string | number)[] = e2 || !desc ? [] : desc.map((r: any) => r.id);

        return Array.from(new Set([...directIds, ...descIds]));
    }

    // ========================
    // Listing with filters + pagination
    // ========================
    static async list(
        client: any,
        options: ListOptions = {},
    ): Promise<{ data: any[]; pagination: PaginationMeta }> {
        // Pagination setup
        const limit = options.limit && options.limit > 0 && options.limit <= 100 ? options.limit : 20;
        const page =
            options.page && options.page >= 1
                ? options.page
                : (options.offset !== undefined ? Math.floor(options.offset / limit) + 1 : 1);
        const offset = options.offset !== undefined ? options.offset : (page - 1) * limit;

        // Build base queries
        let dataQuery = client.from("services").select("*").is("deleted_at", null);
        let countQuery = client.from("services").select("*", { count: "exact", head: true }).is("deleted_at", null);

        // Filters
        if (options.service_provider_id) {
            dataQuery = dataQuery.eq("service_provider_id", options.service_provider_id);
            countQuery = countQuery.eq("service_provider_id", options.service_provider_id);
        }

        if (options.search && options.search.trim()) {
            const pattern = `%${options.search.trim()}%`;
            dataQuery = dataQuery.ilike("name", pattern);
            countQuery = countQuery.ilike("name", pattern);
        }

        // Category filtering
        const includeDesc = options.include_descendants !== false; // default true
        let wantedCategoryIds: (string | number)[] = [];

        if (options.category_name) {
            const byName = await this.findCategoryIdsByName(client, options.category_name);
            wantedCategoryIds.push(...byName);
        }
        if (options.category_ids?.length) {
            wantedCategoryIds.push(...options.category_ids);
        }

        wantedCategoryIds = Array.from(new Set(wantedCategoryIds));

        if (wantedCategoryIds.length) {
            const effectiveIds = includeDesc
                ? await this.expandDescendants(client, wantedCategoryIds)
                : wantedCategoryIds;

            if (effectiveIds.length) {
                // services.service_category_id is an array; match ANY-of via overlaps (&&)
                dataQuery = dataQuery.overlaps("service_category_id", effectiveIds);
                countQuery = countQuery.overlaps("service_category_id", effectiveIds);
            }
        }

        // Default ordering
        dataQuery = dataQuery.order("created_at", { ascending: false });

        // Count
        const countRes = await countQuery;
        const total = countRes.count || 0;

        // Page slice
        const { data, error } = await dataQuery.range(offset, offset + limit - 1);
        if (error) throw error;

        const rows = (data || []) as any[];

        const pagination: PaginationMeta = {
            total,
            limit,
            offset,
            page,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrevious: offset > 0,
        };

        return { data: rows, pagination };
    }

    static enrichServiceRow(row: any, galleryImages: any[] = []) {
        const enriched = {
            ...row,
            image_url: row.featured_image_path
                ? SupabaseFunctionUtils.buildPublicImageUrl("services-images", row.featured_image_path)
                : null,
            images: galleryImages,
        };
        return enriched;
    }

    static async enrichServiceRowWithRelatedData(client: any, row: any, galleryImages: any[] = []) {
        const enriched = this.enrichServiceRow(row, galleryImages);

        let providerName: string | null = null;
        if (row.service_provider_id) {
            try {
                const { data, error } = await client
                    .from("service_providers")
                    .select("name")
                    .eq("id", row.service_provider_id)
                    .is("deleted_at", null)
                    .single();
                if (!error && data) providerName = data.name;
            } catch {}
        }

        let categoryNames: string[] = [];
        if (row.service_category_id && Array.isArray(row.service_category_id)) {
            try {
                const { data, error } = await client
                    .from("service_categories")
                    .select("id, name")
                    .in("id", row.service_category_id)
                    .is("deleted_at", null);
                if (!error && data) {
                    const map = new Map(data.map((c: any) => [c.id, c.name]));
                    categoryNames = row.service_category_id.map((id: any) => map.get(id)).filter((n: any) => !!n);
                }
            } catch {}
        }

        (enriched as any).service_provider_name = providerName;
        (enriched as any).service_category_titles = categoryNames;
        return enriched;
    }

    static async listEnriched(
        client: any,
        options: ListOptions = {},
    ): Promise<{ data: any[]; pagination: PaginationMeta }> {
        const { data, pagination } = await this.list(client, options);
        const enrichedData: any[] = [];

        for (const row of data) {
            let galleryImages: any[] = [];
            if (options.include_galleries !== false && row.gallery_id) {
                try {
                    galleryImages = await SupabaseGalleryUtils.getGalleryImagesByContext(client, row.gallery_id, "services");
                } catch {}
            }
            const enriched = await this.enrichServiceRowWithRelatedData(client, row, galleryImages);
            enrichedData.push(enriched);
        }
        return { data: enrichedData, pagination };
    }

    // ========================
    // Woo + Galleries helpers
    // ========================
    static async resolveWooShopIdForService(client: any, service_provider_id: string | number) {
        try {
            const { data: sp, error: spErr } = await client
                .from("service_providers")
                .select("contact_id")
                .eq("id", service_provider_id)
                .is("deleted_at", null)
                .single();
            if (spErr || !sp?.contact_id) return undefined;

            const { data: partner, error: pErr } = await client
                .from("partners")
                .select("id")
                .eq("administrator_contact_id", sp.contact_id)
                .is("deleted_at", null)
                .limit(1)
                .single();
            if (pErr || !partner?.id) return undefined;

            const { data: shop, error: sErr } = await client
                .from("shops")
                .select("woo_shop_id")
                .eq("partner_id", partner.id)
                .is("deleted_at", null)
                .limit(1)
                .single();
            if (sErr || !shop?.woo_shop_id) return undefined;

            return shop.woo_shop_id ?? undefined;
        } catch {
            return undefined;
        }
    }

    static getIncomingGallery(payload: any) {
        return payload?.gallery_images ?? payload?.["gallery-images"] ?? null;
    }

    // ========================
    // Create + Upload + Woo
    // ========================
    static async createWithImage(client: any, payload: any) {
        const {
            image_file: _image_file,
            image_base64: _image_base64,
            gallery_images: _gallery_images,

            // Woo-only fields (strip before inserting into services)
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
            ...serviceData
        } = payload;

        // 1) Create service row
        const created = await this.create(client, serviceData);

        // 2) Featured image upload
        let featuredImagePath: string | null = null;
        if (payload.image_file || payload.image_base64) {
            const imageData = payload.image_file || payload.image_base64;
            const fileName = payload.image_file instanceof File ? payload.image_file.name : "service-image.jpg";
            const uploadResult = await SupabaseFunctionUtils.handleFeaturedImageUpload(
                client,
                imageData,
                fileName,
                "services-images",
                created.id,
                null,
            );
            if (uploadResult) {
                featuredImagePath = uploadResult.path;
                await this.update(client, created.id, { featured_image_path: featuredImagePath });
            }
        }

        // 3) Gallery creation / linking
        let galleryId: string | null = null;
        let galleryImages: any[] = [];
        const incomingGallery = this.getIncomingGallery(payload);
        if (incomingGallery && incomingGallery.length > 0) {
            try {
                const galleryResult = await SupabaseGalleryUtils.processGalleryDataByContext(client, incomingGallery, "services");
                galleryId = galleryResult.galleryId;
                galleryImages = galleryResult.images;
            } catch {}
        } else {
            try {
                const galleryResult = await SupabaseGalleryUtils.processGalleryDataByContext(client, null, "services");
                galleryId = galleryResult.galleryId;
            } catch {}
        }

        // 4) Create Woo product
        let wooProductId: number | null = null;
        try {
            let resolvedShopId = payload.woo_shop_id;
            if (resolvedShopId == null && created.service_provider_id) {
                resolvedShopId = await this.resolveWooShopIdForService(client, created.service_provider_id);
            }

            const wooProductData: any = {
                name: payload.woo_name,
                type: payload.woo_type ? payload.woo_type : ProductType.SIMPLE,
                status: payload.woo_status ? payload.woo_status : ProductStatus.DRAFT,
                description: payload.woo_description || "",
                short_description: payload.woo_short_description || "",
                regular_price:
                    payload.woo_regular_price ||
                    payload.woo_base_price ||
                    (created.price != null ? String(created.price) : "0"),
                sale_price: payload.woo_sale_price || "",
                shop_id: resolvedShopId,
                catalog_visibility: payload.woo_catalog_visibility ? payload.woo_catalog_visibility : undefined,
                featured: !!payload.woo_featured,
                categories: payload.woo_categories || [],
                tags: payload.woo_tags || [],
                date_on_sale_from: payload.woo_date_on_sale_from,
                date_on_sale_to: payload.woo_date_on_sale_to,
            };

            if (payload.woo_sku) wooProductData.sku = payload.woo_sku;
            if (payload.woo_stock_quantity !== undefined) wooProductData.stock_quantity = payload.woo_stock_quantity;
            if (payload.woo_manage_stock !== undefined) wooProductData.manage_stock = payload.woo_manage_stock;

            const wooProduct = await WooProducts.createProduct(wooProductData);
            wooProductId = wooProduct.id;
        } catch (error: any) {
            const msg = error?.message || "Unknown Woo error";
            throw new Error(`Failed to create WooCommerce product: ${msg}`);
        }

        // 5) Update service with gallery + woo id
        const updated = await this.update(client, created.id, {
            gallery_id: galleryId,
            woo_product_id: wooProductId,
        });

        return await this.enrichServiceRowWithRelatedData(client, updated, galleryImages);
    }

    // ========================
    // Update + Upload + Woo
    // ========================
    static async updateWithImage(
        client: any,
        id: string | number,
        payload: any,
        imageData?: File | Blob | string,
        fileName?: string,
        shouldDeleteImage?: boolean,
    ) {
        const current = await this.getById(client, id);
        if (!current) throw new Error("Service not found");

        const {
            image_file: _image_file,
            image_base64: _image_base64,
            gallery_images: _gallery_images,
            ["gallery-images"]: _gallery_images_dashed,
            deleted_images: _deleted_images,
            deleteImage: _deleteImage,

            // Woo-only (strip from update payload)
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

        // Featured image delete/replace
        if (shouldDeleteImage) {
            if (current.featured_image_path) {
                await SupabaseFunctionUtils.deleteImage(client, "services-images", current.featured_image_path);
                updatePayload.featured_image_path = null;
            }
        } else if (imageData && fileName) {
            const uploadResult = await SupabaseFunctionUtils.handleFeaturedImageUpload(
                client,
                imageData,
                fileName,
                "services-images",
                id,
                current.featured_image_path,
            );
            if (uploadResult) {
                updatePayload.featured_image_path = uploadResult.path;
            }
        }

        // Update Woo if needed
        if (
            current.woo_product_id &&
            (
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
                const wooUpdateData: any = {};
                if (payload.woo_name) wooUpdateData.name = payload.woo_name;
                if (payload.woo_description) wooUpdateData.description = payload.woo_description;
                if (payload.woo_short_description) wooUpdateData.short_description = payload.woo_short_description;
                if (payload.woo_regular_price) wooUpdateData.regular_price = payload.woo_regular_price;
                if (payload.woo_sale_price) wooUpdateData.sale_price = payload.woo_sale_price;
                if (payload.woo_sku) wooUpdateData.sku = payload.woo_sku;
                if (payload.woo_stock_quantity !== undefined) wooUpdateData.stock_quantity = payload.woo_stock_quantity;
                if (payload.woo_manage_stock !== undefined) wooUpdateData.manage_stock = payload.woo_manage_stock;
                if (payload.woo_base_price) wooUpdateData.regular_price = payload.woo_base_price;
                if (payload.woo_status) wooUpdateData.status = payload.woo_status;
                if (payload.woo_catalog_visibility) wooUpdateData.catalog_visibility = payload.woo_catalog_visibility;
                if (payload.woo_type) wooUpdateData.type = payload.woo_type;
                if (payload.woo_featured !== undefined) wooUpdateData.featured = payload.woo_featured;
                if (payload.woo_shop_id !== undefined) wooUpdateData.shop_id = payload.woo_shop_id;
                if (payload.woo_categories) wooUpdateData.categories = payload.woo_categories;
                if (payload.woo_tags) wooUpdateData.tags = payload.woo_tags;
                if (payload.woo_date_on_sale_from !== undefined) wooUpdateData.date_on_sale_from = payload.woo_date_on_sale_from;
                if (payload.woo_date_on_sale_to !== undefined) wooUpdateData.date_on_sale_to = payload.woo_date_on_sale_to;

                await WooProducts.updateProduct(current.woo_product_id, wooUpdateData);
            } catch {}
        }

        // Update service row
        const updated = await this.update(client, id, updatePayload);

        // Resolve latest gallery images for response
        let galleryImages: any[] = [];
        if (updated.gallery_id) {
            try {
                galleryImages = await SupabaseGalleryUtils.getGalleryImagesByContext(client, updated.gallery_id, "services");
            } catch {}
        }

        return await this.enrichServiceRowWithRelatedData(client, updated, galleryImages);
    }

    // ========================
    // Delete + cleanup
    // ========================
    static async deleteWithImageCleanup(client: any, id: string | number) {
        const service = await this.getById(client, id);
        if (!service) {
            throw new Error("Service not found");
        }

        if (service.woo_product_id) {
            try {
                await WooProducts.deleteProduct(service.woo_product_id, true);
            } catch {}
        }

        if (service.featured_image_path) {
            try {
                await SupabaseFunctionUtils.deleteImage(client, "services-images", service.featured_image_path);
            } catch {}
        }

        if (service.gallery_id) {
            try {
                await SupabaseGalleryUtils.deleteGallery(client, service.gallery_id, {
                    bucket: "services-galleries",
                    folderPrefix: "gallery",
                });
            } catch {}
        }

        return await this.softDelete(client, id);
    }

    // ========================
    // Read single with Woo data
    // ========================
    static async getWithWooData(client: any, id: string | number) {
        const service = await this.getById(client, id);
        if (!service) return null;

        let galleryImages: any[] = [];
        if (service.gallery_id) {
            try {
                galleryImages = await SupabaseGalleryUtils.getGalleryImagesByContext(client, service.gallery_id, "services");
            } catch {}
        }

        const enriched = await this.enrichServiceRowWithRelatedData(client, service, galleryImages);

        if (service.woo_product_id) {
            try {
                const wooProduct = await WooProducts.getProductById(service.woo_product_id);
                (enriched as any).woo_name = wooProduct.name;
                (enriched as any).woo_description = wooProduct.description;
                (enriched as any).woo_short_description = wooProduct.short_description;
                (enriched as any).woo_price = wooProduct.price;
                (enriched as any).woo_regular_price = wooProduct.regular_price;
                (enriched as any).woo_sale_price = wooProduct.sale_price;
                (enriched as any).woo_sku = wooProduct.sku;
                (enriched as any).woo_status = wooProduct.status;
                (enriched as any).woo_stock_status = wooProduct.stock_status;
                (enriched as any).woo_stock_quantity = wooProduct.stock_quantity;
                (enriched as any).woo_manage_stock = wooProduct.manage_stock;
                (enriched as any).woo_featured = wooProduct.featured;
                (enriched as any).woo_date_on_sale_from = wooProduct.date_on_sale_from;
                (enriched as any).woo_date_on_sale_to = wooProduct.date_on_sale_to;
                (enriched as any).woo_tags = wooProduct.tags;
            } catch {}
        }

        return enriched;
    }

    // ========================
    // List with Woo data (with pagination)
    // ========================
    static async listWithWooData(
        client: any,
        options: ListOptions = {},
    ): Promise<{ data: any[]; pagination: PaginationMeta }> {
        const { data: enrichedData, pagination } = await this.listEnriched(client, options);

        const wooProductIds = enrichedData
            .map((s: any) => s.woo_product_id)
            .filter((id: any) => id !== null && id !== undefined);

        if (wooProductIds.length === 0) {
            return { data: enrichedData, pagination };
        }

        const wooProducts: any[] = [];
        for (const productId of wooProductIds) {
            try {
                const wooProduct = await WooProducts.getProductById(productId);
                wooProducts.push(wooProduct);
            } catch {}
        }

        const wooProductMap = new Map(wooProducts.map((p: any) => [p.id, p]));

        const merged = enrichedData.map((service: any) => {
            const wid = service.woo_product_id;
            if (wid && wooProductMap.has(wid)) {
                const wooProduct = wooProductMap.get(wid);
                service.woo_name = wooProduct.name;
                service.woo_description = wooProduct.description;
                service.woo_short_description = wooProduct.short_description;
                service.woo_price = wooProduct.price;
                service.woo_regular_price = wooProduct.regular_price;
                service.woo_sale_price = wooProduct.sale_price;
                service.woo_sku = wooProduct.sku;
                service.woo_status = wooProduct.status;
                service.woo_stock_status = wooProduct.stock_status;
                service.woo_stock_quantity = wooProduct.stock_quantity;
                service.woo_manage_stock = wooProduct.manage_stock;
                service.woo_featured = wooProduct.featured;
                service.woo_date_on_sale_from = wooProduct.date_on_sale_from;
                service.woo_date_on_sale_to = wooProduct.date_on_sale_to;
                service.woo_tags = wooProduct.tags;
            }
            return service;
        });

        return { data: merged, pagination };
    }

    // ========================
    // Galleries
    // ========================
    static async updateGallery(client: any, galleryId: string, newImages?: string[], deletedImageIds?: string[]) {
        return await SupabaseGalleryUtils.updateGalleryWithImages(
            client,
            galleryId,
            newImages || [],
            deletedImageIds || [],
            { bucket: "services-galleries", folderPrefix: "gallery" },
        );
    }

    static async createGallery(client: any, galleryImages?: string[]) {
        return await SupabaseGalleryUtils.processGalleryDataByContext(client, galleryImages, "services");
    }
}
