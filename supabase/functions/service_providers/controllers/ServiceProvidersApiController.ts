/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { SupabaseServiceProvidersService } from "../../_shared/supabase/service_providers/supabaseServiceProviders.ts";
import { SupabaseGalleryUtils } from "../../_shared/supabase/galleries/supabaseGalleryUtils.ts";
import type {
    ServiceProviderInsert,
    ServiceProviderUpdate,
} from "../../_shared/supabase/service_providers/service_providers.types.ts";

// Extended service provider type with gallery images and contact info
interface ServiceProviderWithImages {
    id: string;
    name: string;
    contact_id: string;
    address?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    business_hours?: Record<string, unknown>;
    created_at: string;
    deleted_at?: string | null;
    description?: string | null;
    email?: string | null;
    gallery_id?: string | null;
    featured_image_path?: string | null;
    location_latitude?: string | null;
    location_longitude?: string | null;
    phone?: string | null;
    updated_at?: string | null;
    // Enriched fields
    contact_name?: string;
    image_url?: string;
    images: Array<{ id: string; file_name: string; url: string }>;
}

// Request payload types
type ServiceProviderInsertPayload = ServiceProviderInsert & {
    // Image upload fields
    image_file?: File | Blob;
    image_base64?: string;
    // Gallery fields
    gallery_images?: string[];
    [key: string]: unknown;
};
type ServiceProviderUpdatePayload = ServiceProviderUpdate & {
    // Image upload fields
    image_file?: File | Blob;
    image_base64?: string;
    deleteImage?: boolean;
    // Gallery fields
    gallery_images?: string[];
    deleted_images?: string[];
    [key: string]: unknown;
};

export class ServiceProvidersApiController extends Controller<
    ServiceProviderInsertPayload | ServiceProviderUpdatePayload
> {
    override async get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("ServiceProvidersAPI GET", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        if (id) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const row = await SupabaseServiceProvidersService.getById(
                    client,
                    id,
                );
                if (!row) {
                    return ResponseService.error(
                        "Service provider not found",
                        "NOT_FOUND",
                        404,
                        undefined,
                        ResponseType.API,
                    );
                }

                // Enrich the service provider with contact and image data
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const enriched = await SupabaseServiceProvidersService
                    .enrichServiceProviderRow(
                        client,
                        row,
                    );

                // Fetch gallery images if gallery_id exists
                let images: Array<
                    { id: string; file_name: string; url: string }
                > = [];
                if (enriched.gallery_id) {
                    try {
                        images = await SupabaseGalleryUtils
                            .getGalleryImagesByContext(
                                client,
                                enriched.gallery_id,
                                "service_providers",
                            );
                    } catch (error) {
                        console.error(
                            "Error fetching gallery images for service provider:",
                            enriched.id,
                            error,
                        );
                        // Continue without gallery images
                    }
                }

                const responseData = {
                    ...enriched,
                    images: images,
                };

                return ResponseService.success(
                    responseData as ServiceProviderWithImages,
                    200,
                    undefined,
                    ResponseType.API,
                );
            } catch (error: unknown) {
                return ResponseService.error(
                    "Error fetching service provider",
                    "SERVICE_PROVIDERS_GET_BY_ID_ERROR",
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

        // list with filters
        const url = new URL(_req!.url);
        const query = {
            limit: url.searchParams.get("limit")
                ? parseInt(url.searchParams.get("limit")!, 10)
                : 20,
            offset: url.searchParams.get("offset")
                ? parseInt(url.searchParams.get("offset")!, 10)
                : 0,
            page: url.searchParams.get("page")
                ? parseInt(url.searchParams.get("page")!, 10)
                : undefined,
            search: url.searchParams.get("search") || undefined,
            include_galleries:
                url.searchParams.get("include_galleries") === "true",
        };

        try {
            const finalOffset = query.page
                ? (query.page - 1) * query.limit
                : query.offset;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, count } = await SupabaseServiceProvidersService
                .listEnriched(
                    client as any,
                    {
                        limit: query.limit,
                        offset: finalOffset,
                        search: query.search,
                    },
                );

            // Include gallery images if requested
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let enrichedData: any = data;
            if (query.include_galleries) {
                enrichedData = await Promise.all(
                    data.map(async (serviceProvider) => {
                        let images: Array<
                            { id: string; file_name: string; url: string }
                        > = [];
                        if (serviceProvider.gallery_id) {
                            try {
                                images = await SupabaseGalleryUtils
                                    .getGalleryImagesByContext(
                                        client,
                                        serviceProvider.gallery_id,
                                        "service_providers",
                                    );
                            } catch (error) {
                                console.error(
                                    "Error fetching gallery images for service provider:",
                                    serviceProvider.id,
                                    error,
                                );
                                // Continue without gallery images for this service provider
                            }
                        }
                        return {
                            ...serviceProvider,
                            images: images,
                        };
                    }),
                );
            }

            const totalPages = Math.ceil(count / query.limit);
            const currentPage = query.page ||
                Math.floor(finalOffset / query.limit) + 1;

            return ResponseService.success(
                enrichedData,
                200,
                {
                    pagination: {
                        page: currentPage,
                        limit: query.limit,
                        total: count,
                        totalPages,
                        hasNext: currentPage < totalPages,
                        hasPrev: currentPage > 1,
                    },
                },
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error fetching service providers",
                "SERVICE_PROVIDERS_GET_LIST_ERROR",
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
        data: ServiceProviderInsertPayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("ServiceProvidersAPI POST", { data });
        const { client } = await AuthenticationService.authenticate(_req!);

        // Handle gallery processing
        let galleryId: string | null = null;
        let galleryImages: Array<
            { id: string; file_name: string; url: string }
        > = [];
        if (data.gallery_images && data.gallery_images.length > 0) {
            try {
                const galleryResult = await SupabaseGalleryUtils
                    .processGalleryDataByContext(
                        client,
                        data.gallery_images,
                        "service_providers",
                    );
                galleryId = galleryResult.galleryId;
                galleryImages = galleryResult.images;
            } catch (error) {
                console.error("Error processing gallery:", error);
                // Continue with service provider creation even if gallery fails
            }
        } else {
            // Create empty gallery even if no images provided
            try {
                const galleryResult = await SupabaseGalleryUtils
                    .processGalleryDataByContext(
                        client,
                        null,
                        "service_providers",
                    );
                galleryId = galleryResult.galleryId;
            } catch (error) {
                console.error("Error creating empty gallery:", error);
                // Continue with service provider creation even if gallery fails
            }
        }

        // Build payload excluding image and gallery fields
        const {
            gallery_images: _gallery_images,
            image_file: _image_file,
            image_base64: _image_base64,
            ...serviceProviderData
        } = data;
        const payload = {
            ...serviceProviderData,
            gallery_id: galleryId,
        };

        try {
            // Handle image upload if provided
            let imageData: File | Blob | string | undefined;
            let fileName: string | undefined;

            if (data.image_file || data.image_base64) {
                imageData = data.image_file || data.image_base64!;
                fileName = data.image_file instanceof File
                    ? data.image_file.name
                    : "uploaded-image.jpg";
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const created = await SupabaseServiceProvidersService
                .createWithImage(
                    client,
                    payload,
                    imageData,
                    fileName,
                );

            // Enrich the created service provider with contact and image data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const enriched = await SupabaseServiceProvidersService
                .enrichServiceProviderRow(
                    client,
                    created,
                );

            // Add gallery images to response
            const responseData = {
                ...enriched,
                images: galleryImages,
            };

            return ResponseService.created(
                responseData as ServiceProviderWithImages,
                created.id,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error creating service provider",
                "SERVICE_PROVIDERS_CREATE_ERROR",
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
        data: ServiceProviderUpdatePayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("ServiceProvidersAPI PUT", { id, data });
        const { client } = await AuthenticationService.authenticate(_req!);

        // Handle gallery updates if provided
        let galleryImages: Array<
            { id: string; file_name: string; url: string }
        > = [];
        if (data.gallery_images || data.deleted_images) {
            try {
                // Get existing service provider to find gallery_id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existingProvider = await SupabaseServiceProvidersService
                    .getById(
                        client,
                        id,
                    );

                if (existingProvider?.gallery_id) {
                    // Update existing gallery
                    const updateResult = await SupabaseGalleryUtils
                        .updateGalleryWithImages(
                            client,
                            existingProvider.gallery_id,
                            data.gallery_images || [],
                            data.deleted_images || [],
                            {
                                bucket: "service-providers-galleries",
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
                            client,
                            data.gallery_images,
                            "service_providers",
                        );
                    // Update service provider with new gallery_id
                    const {
                        gallery_images: _,
                        deleted_images: __,
                        ...updateData
                    } = data;
                    const payloadWithGallery = {
                        ...updateData,
                        gallery_id: galleryResult.galleryId,
                    };

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const updated = await SupabaseServiceProvidersService
                        .updateWithImage(
                            client,
                            id,
                            payloadWithGallery,
                        );

                    // Enrich the updated service provider with contact and image data
                    const enriched = await SupabaseServiceProvidersService
                        .enrichServiceProviderRow(
                            client,
                            updated,
                        );

                    return ResponseService.success(
                        {
                            ...enriched,
                            images: galleryResult.images,
                        } as ServiceProviderWithImages,
                        200,
                        undefined,
                        ResponseType.API,
                    );
                }
            } catch (error) {
                console.error("Error updating gallery:", error);
                // Continue with service provider update even if gallery fails
            }
        }

        // Build payload excluding image and gallery fields
        const {
            gallery_images: _gallery_images,
            deleted_images: _deleted_images,
            image_file: _image_file,
            image_base64: _image_base64,
            deleteImage: _deleteImage,
            ...serviceProviderData
        } = data;

        try {
            // Handle image operations
            let imageData: File | Blob | string | undefined;
            let fileName: string | undefined;
            const shouldDeleteImage = data.deleteImage || false;

            if (data.image_file || data.image_base64) {
                imageData = data.image_file || data.image_base64!;
                fileName = data.image_file instanceof File
                    ? data.image_file.name
                    : "uploaded-image.jpg";
            }

            const updated = await SupabaseServiceProvidersService
                .updateWithImage(
                    client,
                    id,
                    serviceProviderData,
                    imageData,
                    fileName,
                    shouldDeleteImage,
                );

            // Enrich the updated service provider with contact and image data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const enriched = await SupabaseServiceProvidersService
                .enrichServiceProviderRow(
                    client,
                    updated,
                );

            // Add gallery images to response if we have them
            const responseData = {
                ...enriched,
                images: galleryImages,
            };

            return ResponseService.success(
                responseData as ServiceProviderWithImages,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error updating service provider",
                "SERVICE_PROVIDERS_UPDATE_ERROR",
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
        this.logAction("ServiceProvidersAPI DELETE", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            // Get service provider to check for gallery_id
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const serviceProvider = await SupabaseServiceProvidersService
                .getById(
                    client,
                    id,
                );

            if (serviceProvider?.gallery_id) {
                try {
                    await SupabaseGalleryUtils.deleteGallery(
                        client,
                        serviceProvider.gallery_id,
                        {
                            bucket: "service-providers-galleries",
                            folderPrefix: "gallery",
                        },
                    );
                } catch (galleryError) {
                    console.error("Error deleting gallery:", galleryError);
                    // Continue with service provider deletion even if gallery deletion fails
                }
            }

            const result = await SupabaseServiceProvidersService
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
                "Error deleting service provider",
                "SERVICE_PROVIDERS_DELETE_ERROR",
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
