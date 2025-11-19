import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseServicesService } from "../../_shared/supabase/services/supabaseServices.ts";
import { extractPaginationParams } from "../../_shared/utils/pagination.ts";
export class ServicesApiController extends Controller {
    normalizePayload(raw) {
        const d = {
            ...raw
        };
        if (d["gallery-images"] && !d.gallery_images) d.gallery_images = d["gallery-images"];
        if (typeof d.woo_regular_price === "number") d.woo_regular_price = String(d.woo_regular_price);
        if (typeof d.woo_sale_price === "number") d.woo_sale_price = String(d.woo_sale_price);
        if (typeof d.woo_featured === "string") d.woo_featured = d.woo_featured === "true";
        if (typeof d.woo_manage_stock === "string") d.woo_manage_stock = d.woo_manage_stock === "true";
        return d;
    }
    async get(id: string | null, _req: Request) {
        this.logAction("ServicesAPI GET", { id });
        const { client } = await AuthenticationService.authenticate(_req);

        if (id) {
            try {
                const service = await SupabaseServicesService.getWithWooData(client, id);
                if (!service) {
                    return ResponseService.error("Service not found", "NOT_FOUND", 404, undefined, ResponseType.API);
                }
                return ResponseService.success(service, 200, undefined, ResponseType.API);
            } catch (error) {
                return ResponseService.error("Error fetching service", "SERVICES_GET_BY_ID_ERROR", 400, {
                    error: error instanceof Error ? error.message : String(error),
                }, ResponseType.API);
            }
        }

        const url = new URL(_req.url);

        const service_provider_id = url.searchParams.get("service_provider_id") || undefined;
        const search = url.searchParams.get("search") || undefined;
        const include_galleries = url.searchParams.get("include_galleries") !== "false";

        // NEW: category filtering
        const category_id = url.searchParams.get("category_id") || undefined;
        const category_ids = url.searchParams.get("category_ids") || undefined;
        const subcategory_id = url.searchParams.get("subcategory_id") || undefined;
        const subcategory_ids = url.searchParams.get("subcategory_ids") || undefined;
        const category_name = url.searchParams.get("category_name") || undefined;
        const include_descendants = url.searchParams.get("include_descendants") !== "false";

        const parseCsv = (v?: string | null) =>
            (v && v.trim().length ? v.split(",").map(s => s.trim()).filter(Boolean) : undefined);

        const mergedCategoryIds = [
            ...(category_id ? [category_id] : []),
            ...(subcategory_id ? [subcategory_id] : []),
            ...(parseCsv(category_ids) ?? []),
            ...(parseCsv(subcategory_ids) ?? []),
        ];

        const pageParams = extractPaginationParams(url.searchParams);

        try {
            const data = await SupabaseServicesService.listWithWooData(client, {
                service_provider_id,
                search,
                include_galleries,
                include_descendants,
                category_ids: mergedCategoryIds.length ? mergedCategoryIds : undefined,
                category_name,
                ...pageParams,
            });

            return ResponseService.success(
                data,
                200,
                {
                    filters: {
                        service_provider_id,
                        search,
                        include_galleries,
                        include_descendants,
                        category_ids: mergedCategoryIds.length ? mergedCategoryIds : undefined,
                        category_name,
                    },
                },
                ResponseType.API
            );
        } catch (error) {
            return ResponseService.error("Error fetching services", "SERVICES_GET_LIST_ERROR", 400, {
                error: error instanceof Error ? error.message : String(error),
            }, ResponseType.API);
        }
    }
    async post(data, _req) {
        this.logAction("ServicesAPI POST", {
            data
        });
        const { client } = await AuthenticationService.authenticate(_req);
        try {
            const payload = this.normalizePayload(data);
            const created = await SupabaseServicesService.createWithImage(client, payload);
            return ResponseService.created(created, created.id, ResponseType.API);
        } catch (error) {
            return ResponseService.error("Error creating service", "SERVICES_CREATE_ERROR", 400, {
                error: error instanceof Error ? error.message : String(error)
            }, ResponseType.API);
        }
    }
    async put(id, data, _req) {
        this.logAction("ServicesAPI PUT", {
            id,
            data
        });
        const { client } = await AuthenticationService.authenticate(_req);
        const norm = this.normalizePayload(data);
        let imageData;
        let fileName;
        const shouldDeleteImage = norm.deleteImage || false;
        if (norm.image_file || norm.image_base64) {
            imageData = norm.image_file || norm.image_base64;
            fileName = norm.image_file instanceof File ? norm.image_file.name : "service-image.jpg";
        }
        const incomingGalleryImages = norm.gallery_images ?? norm["gallery-images"] ?? undefined;
        let galleryImages = [];
        if (incomingGalleryImages || norm.deleted_images) {
            try {
                const existing = await SupabaseServicesService.getById(client, id);
                if (existing?.gallery_id) {
                    const updateResult = await SupabaseServicesService.updateGallery(client, existing.gallery_id, incomingGalleryImages || [], norm.deleted_images || []);
                    galleryImages = updateResult;
                } else if (incomingGalleryImages && incomingGalleryImages.length > 0) {
                    const galleryResult = await SupabaseServicesService.createGallery(client, incomingGalleryImages);
                    const { gallery_images: _gallery_images, ["gallery-images"]: _gallery_images_dashed, deleted_images: _deleted_images, image_file: _image_file, image_base64: _image_base64, deleteImage: _deleteImage, ...updateData } = norm;
                    const payloadWithGallery = {
                        ...updateData,
                        gallery_id: galleryResult.galleryId
                    };
                    const updated = await SupabaseServicesService.updateWithImage(client, id, payloadWithGallery, imageData, fileName, shouldDeleteImage);
                    return ResponseService.success({
                        ...updated,
                        images: galleryResult.images
                    }, 200, undefined, ResponseType.API);
                }
            } catch  {}
        }
        const { gallery_images: _gallery_images, ["gallery-images"]: _gallery_images_dashed, deleted_images: _deleted_images, image_file: _image_file, image_base64: _image_base64, deleteImage: _deleteImage, ...serviceData } = norm;
        try {
            const updated = await SupabaseServicesService.updateWithImage(client, id, serviceData, imageData, fileName, shouldDeleteImage);
            return ResponseService.success({
                ...updated,
                images: galleryImages
            }, 200, undefined, ResponseType.API);
        } catch (error) {
            return ResponseService.error("Error updating service", "SERVICES_UPDATE_ERROR", 400, {
                error: error instanceof Error ? error.message : String(error)
            }, ResponseType.API);
        }
    }
    async delete(id, _req) {
        this.logAction("ServicesAPI DELETE", {
            id
        });
        const { client } = await AuthenticationService.authenticate(_req);
        try {
            const result = await SupabaseServicesService.deleteWithImageCleanup(client, id);
            return ResponseService.success(result, 200, undefined, ResponseType.API);
        } catch (error) {
            return ResponseService.error("Error deleting service", "SERVICES_DELETE_ERROR", 400, {
                error: error instanceof Error ? error.message : String(error)
            }, ResponseType.API);
        }
    }
}
