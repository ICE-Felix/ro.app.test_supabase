import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseVenueProductsService } from "../../_shared/supabase/venue_products/supabaseVenueProducts.ts";
import { SupabaseGalleryUtils } from "../../_shared/supabase/galleries/supabaseGalleryUtils.ts";
import type {
    VenueProductInsertPayload,
    VenueProductUpdatePayload,
    VenueProductWithImages,
} from "../../_shared/supabase/venue_products/venue_products.types.ts";
import { extractPaginationParams } from "../../_shared/utils/pagination.ts";

// Type for SupabaseClient to avoid type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = any;

export class VenueProductsApiController
    extends Controller<VenueProductInsertPayload | VenueProductUpdatePayload> {
    override async get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("VenueProductsAPI GET", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        if (id) {
            try {
                const venueProduct = await SupabaseVenueProductsService
                    .getWithWooData(
                        client,
                        id,
                    );

                if (!venueProduct) {
                    return ResponseService.error(
                        "Venue product not found",
                        "NOT_FOUND",
                        404,
                        undefined,
                        ResponseType.API,
                    );
                }

                return ResponseService.success(
                    venueProduct as VenueProductWithImages,
                    200,
                    undefined,
                    ResponseType.API,
                );
            } catch (error: unknown) {
                return ResponseService.error(
                    "Error fetching venue product",
                    "VENUE_PRODUCTS_GET_BY_ID_ERROR",
                    400,
                    {
                        error: error instanceof Error
                            ? error.message
                            : String(error),
                    },
                    ResponseType.API,
                );
            }
        }

        // List venue products
        const url = new URL(_req!.url);
        const venue_id = url.searchParams.get("venue_id") || undefined;
        const search = url.searchParams.get("search") || undefined;
        const include_galleries =
            url.searchParams.get("include_galleries") !== "false";
        const pageParams = extractPaginationParams(url.searchParams);

        try {
            const data = await SupabaseVenueProductsService.listWithWooData(
                client,
                {
                    venue_id,
                    search,
                    include_galleries,
                    ...pageParams,
                },
            );

            return ResponseService.success(
                data as VenueProductWithImages[],
                200,
                { filters: { venue_id, search, include_galleries } },
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error fetching venue products",
                "VENUE_PRODUCTS_GET_LIST_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }

    override async post(
        data: VenueProductInsertPayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("VenueProductsAPI POST", { data });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            const created = await SupabaseVenueProductsService.createWithImage(
                client,
                data,
            );

            return ResponseService.created(
                created as VenueProductWithImages,
                created.id,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error creating venue product",
                "VENUE_PRODUCTS_CREATE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }

    override async put(
        id: string,
        data: VenueProductUpdatePayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("VenueProductsAPI PUT", { id, data });
        const { client } = await AuthenticationService.authenticate(_req!);

        // Handle image upload if provided
        let imageData: File | Blob | string | undefined;
        let fileName: string | undefined;
        const shouldDeleteImage = data.deleteImage || false;

        if (data.image_file || data.image_base64) {
            imageData = data.image_file || data.image_base64!;
            fileName = data.image_file instanceof File
                ? data.image_file.name
                : "venue-product-image.jpg";
        }

        // Handle gallery updates if provided
        let galleryImages: Array<
            { id: string; file_name: string; url: string }
        > = [];
        if (data.gallery_images || data.deleted_images) {
            try {
                // Get existing venue product to find gallery_id
                const existingVenueProduct = await SupabaseVenueProductsService
                    .getById(client, id);

                if (existingVenueProduct?.gallery_id) {
                    // Update existing gallery
                    const updateResult = await SupabaseGalleryUtils
                        .updateGalleryWithImages(
                            client as SupabaseClientType,
                            existingVenueProduct.gallery_id,
                            data.gallery_images || [],
                            data.deleted_images || [],
                            {
                                bucket: "venue-products-galleries",
                                folderPrefix: "gallery",
                            },
                        );
                    galleryImages = updateResult;
                } else if (
                    data.gallery_images && data.gallery_images.length > 0
                ) {
                    // Create new gallery if none exists
                    const galleryResult = await SupabaseGalleryUtils
                        .processGalleryDataByContext(
                            client as SupabaseClientType,
                            data.gallery_images,
                            "venue_products",
                        );

                    // Update venue product with new gallery_id
                    const {
                        gallery_images: _gallery_images,
                        deleted_images: _deleted_images,
                        image_file: _image_file,
                        image_base64: _image_base64,
                        deleteImage: _deleteImage,
                        ...updateData
                    } = data;
                    const payloadWithGallery = {
                        ...updateData,
                        gallery_id: galleryResult.galleryId,
                    };

                    const updated = await SupabaseVenueProductsService
                        .updateWithImage(
                            client,
                            id,
                            payloadWithGallery,
                            imageData,
                            fileName,
                            shouldDeleteImage,
                        );

                    return ResponseService.success(
                        {
                            ...updated,
                            images: galleryResult.images,
                        } as VenueProductWithImages,
                        200,
                        undefined,
                        ResponseType.API,
                    );
                }
            } catch (error) {
                console.error("Error updating gallery:", error);
                // Continue with venue product update even if gallery fails
            }
        }

        // Build payload excluding image and gallery fields
        const {
            gallery_images: _gallery_images,
            deleted_images: _deleted_images,
            image_file: _image_file,
            image_base64: _image_base64,
            deleteImage: _deleteImage,
            ...venueProductData
        } = data;

        try {
            const updated = await SupabaseVenueProductsService.updateWithImage(
                client,
                id,
                venueProductData,
                imageData,
                fileName,
                shouldDeleteImage,
            );

            // Add gallery images to response if we have them
            const responseData = {
                ...updated,
                images: galleryImages,
            };

            return ResponseService.success(
                responseData as VenueProductWithImages,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error updating venue product",
                "VENUE_PRODUCTS_UPDATE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }

    override async delete(id: string, _req?: Request): Promise<Response> {
        this.logAction("VenueProductsAPI DELETE", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            const result = await SupabaseVenueProductsService
                .deleteWithImageCleanup(
                    client,
                    id,
                );

            return ResponseService.success(
                result,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error deleting venue product",
                "VENUE_PRODUCTS_DELETE_ERROR",
                400,
                {
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                },
                ResponseType.API,
            );
        }
    }
}
