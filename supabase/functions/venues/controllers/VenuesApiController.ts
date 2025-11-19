import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import {
  type EnrichedVenue,
  SupabaseVenuesService,
} from "../../_shared/supabase/venues/supabaseVenues.ts";
import { SupabaseGalleryUtils } from "../../_shared/supabase/galleries/supabaseGalleryUtils.ts";
import type {
  Tables as _Tables,
  TablesInsert as _TablesInsert,
  TablesUpdate as _TablesUpdate,
} from "../../_shared/supabase/venues/venues.types.ts";

// Extended venue type with gallery images
interface VenueWithImages extends EnrichedVenue {
  images: Array<{ id: string; file_name: string; url: string }>;
}

// Type for SupabaseClient to avoid type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = any;

// Request payload (subset of DB fields + upload helpers)
type VenueRow = _Tables<"venues">;
type VenueInsertPayload = _TablesInsert<"venues"> & {
  image_file?: File | Blob;
  image_base64?: string;
  venue_category_id?: string[] | string | null;
  attribute_ids?: string[] | string | null;
  // Gallery fields
  gallery_images?: string[];
};
type VenueUpdatePayload = _TablesUpdate<"venues"> & {
  image_file?: File | Blob;
  image_base64?: string;
  venue_category_id?: string[] | string | null;
  attribute_ids?: string[] | string | null;
  // Gallery fields
  gallery_images?: string[];
  deleted_images?: string[];
};

// Query parameter types
interface VenueQueryParams {
  venue_category_id?: string;
  include_subcategories?: boolean;
  attribute_ids?: string[];
  attribute_filters?: string[];
  search?: string;
  is_active?: boolean;
  has_contact?: boolean;
  has_image?: boolean;
  location_latitude?: number;
  location_longitude?: number;
  nearby?: boolean;
  radius_km?: number;
  orderBy?: string;
  limit?: number;
  offset?: number;
  page?: number;
  include_galleries?: boolean;
}

import {
  applyOverrides,
  buildPayloadBase,
  normalizeBoolean,
  toArrayOrNull,
} from "../../_shared/utils/payload.ts";

export class VenuesApiController
  extends Controller<VenueInsertPayload | VenueUpdatePayload> {
  /**
   * Parse query parameters from URL
   */
  private parseQueryParams(url: URL): VenueQueryParams {
    const parseCommaSeparated = (
      value: string | null,
    ): string[] | undefined => {
      if (!value) return undefined;
      return value.includes(",")
        ? value.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
        : [value.trim()];
    };

    const parseBoolean = (
      value: string | null,
      defaultValue?: boolean,
    ): boolean | undefined => {
      if (value === null) return defaultValue;
      return value === "true";
    };

    const parseNumber = (value: string | null): number | undefined => {
      return value ? parseFloat(value) : undefined;
    };

    const parseInteger = (value: string | null): number | undefined => {
      return value ? parseInt(value, 10) : undefined;
    };

    return {
      venue_category_id: url.searchParams.get("venue_category_id") || undefined,
      include_subcategories: parseBoolean(
        url.searchParams.get("include_subcategories"),
        true,
      ),
      attribute_ids: parseCommaSeparated(url.searchParams.get("attribute_ids")),
      attribute_filters: parseCommaSeparated(
        url.searchParams.get("attribute_filters"),
      ),
      search: url.searchParams.get("search") || undefined,
      is_active: parseBoolean(url.searchParams.get("is_active")),
      has_contact: parseBoolean(url.searchParams.get("has_contact")),
      has_image: parseBoolean(url.searchParams.get("has_image")),
      location_latitude: parseNumber(url.searchParams.get("location_latitude")),
      location_longitude: parseNumber(
        url.searchParams.get("location_longitude"),
      ),
      nearby: url.searchParams.get("nearby") === "true",
      radius_km: parseNumber(url.searchParams.get("radius_km")) ||
        (url.searchParams.get("nearby") === "true" &&
            !url.searchParams.get("radius_km")
          ? 30
          : undefined),
      orderBy: url.searchParams.get("orderBy") || undefined,
      limit: parseInteger(url.searchParams.get("limit")),
      offset: parseInteger(url.searchParams.get("offset")),
      page: parseInteger(url.searchParams.get("page")),
      include_galleries: url.searchParams.get("include_galleries") === "true",
    };
  }

  /**
   * Fetch gallery images for a venue
   */
  private async fetchGalleryImages(
    client: SupabaseClientType,
    galleryId: string,
    venueId: string,
  ): Promise<Array<{ id: string; file_name: string; url: string }>> {
    try {
      return await SupabaseGalleryUtils.getGalleryImagesByContext(
        client,
        galleryId,
        "venues",
      );
    } catch (error) {
      console.error(
        `Error fetching gallery images for venue ${venueId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Enrich venues with gallery images
   */
  private enrichVenuesWithGalleries(
    client: SupabaseClientType,
    venues: EnrichedVenue[],
    includeGalleries: boolean,
  ): Promise<VenueWithImages[]> {
    if (!includeGalleries) {
      return Promise.resolve(venues.map((venue) => ({ ...venue, images: [] })));
    }

    return Promise.all(
      venues.map(async (venue) => {
        const images = venue.gallery_id
          ? await this.fetchGalleryImages(client, venue.gallery_id, venue.id)
          : [];
        return { ...venue, images };
      }),
    );
  }

  /**
   * Process gallery data for venue creation/update
   */
  private async processGalleryData(
    client: SupabaseClientType,
    galleryImages: string[] | null,
    _venueId?: string,
  ): Promise<
    {
      galleryId: string | null;
      images: Array<{ id: string; file_name: string; url: string }>;
    }
  > {
    if (galleryImages && galleryImages.length > 0) {
      try {
        const galleryResult = await SupabaseGalleryUtils
          .processGalleryDataByContext(
            client,
            galleryImages,
            "venues",
          );
        return {
          galleryId: galleryResult.galleryId,
          images: galleryResult.images,
        };
      } catch (error) {
        console.error("Error processing gallery:", error);
        return { galleryId: null, images: [] };
      }
    } else {
      // Create empty gallery even if no images provided
      try {
        const galleryResult = await SupabaseGalleryUtils
          .processGalleryDataByContext(
            client,
            null,
            "venues",
          );
        return {
          galleryId: galleryResult.galleryId,
          images: [],
        };
      } catch (error) {
        console.error("Error creating empty gallery:", error);
        return { galleryId: null, images: [] };
      }
    }
  }

  /**
   * Handle image upload for venue
   */
  private async handleImageUpload(
    client: SupabaseClientType,
    imageData: File | Blob | string,
    fileName: string,
  ): Promise<{ path: string; id: string | null } | null> {
    try {
      const uploadResult = await SupabaseVenuesService.uploadVenueImage(
        client,
        imageData,
        fileName,
      );
      return uploadResult
        ? { path: uploadResult.path, id: uploadResult.id || null }
        : null;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  }
  override async get(id?: string, _req?: Request): Promise<Response> {
    this.logAction("VenuesAPI GET", { id });
    const { client } = await AuthenticationService.authenticate(_req!);

    if (id) {
      try {
        const row = await SupabaseVenuesService.getById(client, id);
        if (!row) {
          return ResponseService.error(
            "Venue not found",
            "NOT_FOUND",
            404,
            undefined,
            ResponseType.API,
          );
        }

        const enriched = await SupabaseVenuesService.enrichVenueRow(
          client,
          row,
        );
        const images = enriched.gallery_id
          ? await this.fetchGalleryImages(
            client as SupabaseClientType,
            enriched.gallery_id,
            enriched.id,
          )
          : [];

        return ResponseService.success(
          { ...enriched, images } as VenueWithImages,
          200,
          undefined,
          ResponseType.API,
        );
      } catch (error: unknown) {
        return ResponseService.error(
          "Error fetching venue",
          "VENUES_GET_BY_ID_ERROR",
          400,
          { error: error instanceof Error ? error.message : String(error) },
          ResponseType.API,
        );
      }
    }

    // List venues with filters
    const url = new URL(_req!.url);
    const queryParams = this.parseQueryParams(url);

    try {
      const { data, pagination } = await SupabaseVenuesService.listEnriched(
        client,
        {
          venue_category_id: queryParams.venue_category_id,
          include_subcategories: queryParams.include_subcategories,
          attribute_ids: queryParams.attribute_ids,
          attribute_filters: queryParams.attribute_filters,
          search: queryParams.search,
          is_active: queryParams.is_active,
          has_contact: queryParams.has_contact,
          has_image: queryParams.has_image,
          location_latitude: queryParams.location_latitude,
          location_longitude: queryParams.location_longitude,
          radius_km: queryParams.radius_km,
          nearby: queryParams.nearby,
          orderBy: queryParams.orderBy,
          limit: queryParams.limit,
          offset: queryParams.offset,
          page: queryParams.page,
        },
      );

      const enrichedData = await this.enrichVenuesWithGalleries(
        client as SupabaseClientType,
        data,
        queryParams.include_galleries || false,
      );

      return ResponseService.success(
        enrichedData,
        200,
        {
          pagination,
          filters: queryParams,
        },
        ResponseType.API,
      );
    } catch (error: unknown) {
      console.error("Venues list error:", error);
      return ResponseService.error(
        "Error fetching venues",
        "VENUES_GET_LIST_ERROR",
        400,
        {
          error: error instanceof Error ? error.message : String(error),
          details: error instanceof Error ? error.stack : undefined,
        },
        ResponseType.API,
      );
    }
  }

  override async post(
    data: VenueInsertPayload,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("VenuesAPI POST", { data });
    const { client } = await AuthenticationService.authenticate(_req!);

    // Handle image upload if provided
    let imageStoragePath: string | null = null;
    let imageStorageId: string | null = null;
    if (data.image_file || data.image_base64) {
      const imageData = data.image_file || data.image_base64!;
      const fileName = data.image_file instanceof File
        ? data.image_file.name
        : "uploaded-image.jpg";
      const uploadResult = await this.handleImageUpload(
        client,
        imageData,
        fileName,
      );
      if (uploadResult) {
        imageStoragePath = uploadResult.path;
        imageStorageId = uploadResult.id || null;
      }
    }

    // Handle gallery processing
    const { galleryId, images: galleryImages } = await this.processGalleryData(
      client as SupabaseClientType,
      data.gallery_images || null,
    );

    // Build payload
    const payloadBase = buildPayloadBase(data as Record<string, unknown>, {
      exclude: ["image_file", "image_base64", "gallery_images"],
    });

    const payloadWithOverrides = applyOverrides(
      payloadBase,
      data as Record<string, unknown>,
      {
        venue_category_id: (_current, d) =>
          toArrayOrNull(
            d["venue_category_id"] as string[] | string | null | undefined,
          ),
        attribute_ids: (_current, d) =>
          toArrayOrNull(
            d["attribute_ids"] as string[] | string | null | undefined,
          ),
        is_active: (_current, d) =>
          normalizeBoolean(
            d["is_active"] as boolean | string | number | null | undefined,
          ),
        image_featured_id: (_current) =>
          imageStorageId ?? data.image_featured_id ?? null,
        gallery_id: (_current) => galleryId,
        card_details: (_current, d) =>
          d["card_details"] !== undefined
            ? (typeof d["card_details"] === "string" ? d["card_details"] : null)
            : undefined,
      },
    );

    try {
      const created = await SupabaseVenuesService.create(
        client,
        payloadWithOverrides as Partial<_TablesInsert<"venues">>,
      );
      const enriched = await SupabaseVenuesService.enrichVenueRow(
        client,
        created,
        imageStoragePath || undefined,
      );

      return ResponseService.created(
        { ...enriched, images: galleryImages } as VenueWithImages,
        created.id,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error creating venue",
        "VENUES_CREATE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  /**
   * Handle gallery updates for venue
   */
  private async handleGalleryUpdate(
    client: SupabaseClientType,
    venueId: string,
    galleryImages?: string[],
    deletedImages?: string[],
  ): Promise<Array<{ id: string; file_name: string; url: string }>> {
    if (galleryImages === undefined && deletedImages === undefined) {
      return [];
    }

    try {
      const existingVenue = await SupabaseVenuesService.getById(
        client,
        venueId,
      );
      if (existingVenue?.gallery_id) {
        // Update existing gallery
        const context = {
          bucket: "venue-galleries",
          folderPrefix: "gallery",
        };
        return await SupabaseGalleryUtils.updateGalleryWithImages(
          client,
          existingVenue.gallery_id,
          galleryImages || null,
          deletedImages || null,
          context,
        );
      } else if (galleryImages && galleryImages.length > 0) {
        // Create new gallery if venue doesn't have one but new images are provided
        const galleryResult = await SupabaseGalleryUtils
          .processGalleryDataByContext(
            client,
            galleryImages,
            "venues",
          );
        return galleryResult.images;
      }
    } catch (error) {
      console.error("Error processing gallery:", error);
    }
    return [];
  }

  override async put(
    id: string,
    data: VenueUpdatePayload,
    _req?: Request,
  ): Promise<Response> {
    this.logAction("VenuesAPI PUT", { id, data });
    const { client } = await AuthenticationService.authenticate(_req!);

    // Handle image upload if provided
    let imageStoragePath: string | null = null;
    let imageStorageId: string | null = null;
    if (data.image_file || data.image_base64) {
      const imageData = data.image_file || data.image_base64!;
      const fileName = data.image_file instanceof File
        ? data.image_file.name
        : "uploaded-image.jpg";
      const uploadResult = await this.handleImageUpload(
        client,
        imageData,
        fileName,
      );
      if (uploadResult) {
        imageStoragePath = uploadResult.path;
        imageStorageId = uploadResult.id || null;
      }
    }

    // Handle gallery processing
    const galleryImages = await this.handleGalleryUpdate(
      client as SupabaseClientType,
      id,
      data.gallery_images,
      data.deleted_images,
    );

    // Build changes
    const changesBase = buildPayloadBase(data as Record<string, unknown>, {
      exclude: [
        "image_file",
        "image_base64",
        "gallery_images",
        "deleted_images",
      ],
    });
    changesBase["updated_at"] = new Date().toISOString();

    const changesWithOverrides = applyOverrides(
      changesBase,
      data as Record<string, unknown>,
      {
        venue_category_id: (_current, d) =>
          d["venue_category_id"] !== undefined
            ? toArrayOrNull(
              d["venue_category_id"] as string[] | string | null | undefined,
            )
            : undefined,
        attribute_ids: (_current, d) =>
          d["attribute_ids"] !== undefined
            ? toArrayOrNull(
              d["attribute_ids"] as string[] | string | null | undefined,
            )
            : undefined,
        is_active: (_current, d) =>
          d["is_active"] !== undefined
            ? normalizeBoolean(
              d["is_active"] as boolean | string | number | null | undefined,
            )
            : undefined,
        image_featured_id: (_current) =>
          imageStorageId !== null || data.image_featured_id !== undefined
            ? (imageStorageId || data.image_featured_id || null)
            : undefined,
        card_details: (_current, d) =>
          d["card_details"] !== undefined
            ? (typeof d["card_details"] === "string" ? d["card_details"] : null)
            : undefined,
      },
    );

    try {
      const updated = await SupabaseVenuesService.update(
        client,
        id,
        changesWithOverrides as Partial<_TablesUpdate<"venues">>,
      );
      const enriched = await SupabaseVenuesService.enrichVenueRow(
        client,
        updated,
        imageStoragePath || undefined,
      );

      // Determine response images
      let responseImages: Array<{ id: string; file_name: string; url: string }>;
      if (data.gallery_images !== undefined) {
        responseImages = galleryImages;
      } else if (enriched.gallery_id) {
        responseImages = await this.fetchGalleryImages(
          client as SupabaseClientType,
          enriched.gallery_id,
          enriched.id,
        );
      } else {
        responseImages = [];
      }

      return ResponseService.success(
        { ...enriched, images: responseImages } as VenueWithImages,
        200,
        undefined,
        ResponseType.API,
      );
    } catch (error: unknown) {
      return ResponseService.error(
        "Error updating venue",
        "VENUES_UPDATE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }

  override async delete(id: string, _req?: Request): Promise<Response> {
    this.logAction("VenuesAPI DELETE", { id });
    const { client } = await AuthenticationService.authenticate(_req!);

    try {
      // Get venue to check for gallery before deletion
      const venue = await SupabaseVenuesService.getById(client, id);
      if (venue?.gallery_id) {
        try {
          await SupabaseGalleryUtils.deleteGallery(
            client as SupabaseClientType,
            venue.gallery_id,
            { bucket: "venue-galleries", folderPrefix: "gallery" },
          );
        } catch (galleryError) {
          console.error("Error deleting gallery:", galleryError);
          // Continue with venue deletion even if gallery deletion fails
        }
      }

      const result = await SupabaseVenuesService.softDelete(client, id);
      return ResponseService.success(result, 200, undefined, ResponseType.API);
    } catch (error: unknown) {
      return ResponseService.error(
        "Error deleting venue",
        "VENUES_DELETE_ERROR",
        400,
        { error: error instanceof Error ? error.message : String(error) },
        ResponseType.API,
      );
    }
  }
}
