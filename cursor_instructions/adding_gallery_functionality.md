# Adding Gallery Functionality to Supabase Edge Functions

This guide documents the steps required to add gallery functionality to any
Supabase Edge Function, following the pattern established in the venues and
service_providers functions.

## Overview

Gallery functionality allows entities to have associated image galleries with
the following capabilities:

- Upload multiple images via base64 strings
- Automatic gallery creation and management
- Image storage in Supabase Storage with organized folder structure
- Gallery image URLs in API responses
- Update galleries (add/remove images)
- Delete galleries when entity is deleted

## Prerequisites

- Existing Supabase Edge Function with basic CRUD operations
- `SupabaseGalleryUtils` service available
- Supabase Storage bucket configured for the entity type

## Step-by-Step Implementation

### 1. Update Controller Imports

Add the gallery utilities import to your controller:

```typescript
import { SupabaseGalleryUtils } from "../../_shared/supabase/galleries/supabaseGalleryUtils.ts";
```

### 2. Define Extended Types

Create an interface that extends your entity type with gallery images:

```typescript
// Extended entity type with gallery images
interface EntityWithImages {
    id: string;
    // ... all your entity fields
    images: Array<{ id: string; file_name: string; url: string }>;
}

// Type for SupabaseClient to avoid type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = any;
```

### 3. Update Request Payload Types

Extend your existing payload types to include gallery fields:

```typescript
type EntityInsertPayload = EntityInsert & {
    // Gallery fields
    gallery_images?: string[];
    [key: string]: unknown;
};

type EntityUpdatePayload = EntityUpdate & {
    // Gallery fields
    gallery_images?: string[];
    deleted_images?: string[];
    [key: string]: unknown;
};
```

### 4. Update GET Method (Single Item)

Modify the GET method to fetch and include gallery images:

```typescript
override async get(id?: string, _req?: Request): Promise<Response> {
    // ... existing authentication and validation

    if (id) {
        try {
            const row = await EntityService.getById(client, id);
            if (!row) {
                return ResponseService.error(/* ... */);
            }

            // Fetch gallery images if gallery_id exists
            let images: Array<{ id: string; file_name: string; url: string }> = [];
            if (row.gallery_id) {
                try {
                    images = await SupabaseGalleryUtils.getGalleryImagesByContext(
                        client as SupabaseClientType,
                        row.gallery_id,
                        "entity_type", // Replace with your entity type
                    );
                } catch (error) {
                    console.error("Error fetching gallery images:", error);
                    // Continue without gallery images
                }
            }

            const responseData = {
                ...row,
                images: images,
            };

            return ResponseService.success(
                responseData as EntityWithImages,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            // ... error handling
        }
    }
    // ... rest of method
}
```

### 5. Update GET Method (List)

Add support for including galleries in list responses:

```typescript
// In the list method, add include_galleries query parameter
const query = {
    // ... existing query parameters
    include_galleries: url.searchParams.get("include_galleries") === "true",
};

// After fetching data, conditionally include gallery images
let enrichedData: any = data;
if (query.include_galleries) {
    enrichedData = await Promise.all(
        data.map(async (entity) => {
            let images: Array<{ id: string; file_name: string; url: string }> =
                [];
            if (entity.gallery_id) {
                try {
                    images = await SupabaseGalleryUtils
                        .getGalleryImagesByContext(
                            client as SupabaseClientType,
                            entity.gallery_id,
                            "entity_type", // Replace with your entity type
                        );
                } catch (error) {
                    console.error("Error fetching gallery images:", error);
                    // Continue without gallery images for this entity
                }
            }
            return {
                ...entity,
                images: images,
            };
        }),
    );
}
```

### 6. Update POST Method

Add gallery processing to the POST method:

```typescript
override async post(data: EntityInsertPayload, _req?: Request): Promise<Response> {
    // ... existing authentication

    // Handle gallery processing
    let galleryId: string | null = null;
    let galleryImages: Array<{ id: string; file_name: string; url: string }> = [];
    
    if (data.gallery_images && data.gallery_images.length > 0) {
        try {
            const galleryResult = await SupabaseGalleryUtils.processGalleryDataByContext(
                client as SupabaseClientType,
                data.gallery_images,
                "entity_type", // Replace with your entity type
            );
            galleryId = galleryResult.galleryId;
            galleryImages = galleryResult.images;
        } catch (error) {
            console.error("Error processing gallery:", error);
            // Continue with entity creation even if gallery fails
        }
    } else {
        // Create empty gallery even if no images provided
        try {
            const galleryResult = await SupabaseGalleryUtils.processGalleryDataByContext(
                client as SupabaseClientType,
                null,
                "entity_type", // Replace with your entity type
            );
            galleryId = galleryResult.galleryId;
        } catch (error) {
            console.error("Error creating empty gallery:", error);
            // Continue with entity creation even if gallery fails
        }
    }

    // Build payload excluding gallery fields
    const { gallery_images: _gallery_images, ...entityData } = data;
    const payload = {
        ...entityData,
        gallery_id: galleryId,
    };

    try {
        const created = await EntityService.create(client, payload);

        // Add gallery images to response
        const responseData = {
            ...created,
            images: galleryImages,
        };

        return ResponseService.created(
            responseData as EntityWithImages,
            created.id,
            ResponseType.API,
        );
    } catch (error: unknown) {
        // ... error handling
    }
}
```

### 7. Update PUT Method

Add gallery update functionality to the PUT method:

```typescript
override async put(id: string, data: EntityUpdatePayload, _req?: Request): Promise<Response> {
    // ... existing authentication

    // Handle gallery updates if provided
    let galleryImages: Array<{ id: string; file_name: string; url: string }> = [];
    
    if (data.gallery_images || data.deleted_images) {
        try {
            // Get existing entity to find gallery_id
            const existingEntity = await EntityService.getById(client, id);
            
            if (existingEntity?.gallery_id) {
                // Update existing gallery
                const updateResult = await SupabaseGalleryUtils.updateGalleryWithImages(
                    client as SupabaseClientType,
                    existingEntity.gallery_id,
                    data.gallery_images || [],
                    data.deleted_images || [],
                    { bucket: "entity-galleries", folderPrefix: "gallery" }, // Replace bucket name
                );
                galleryImages = updateResult;
            } else if (data.gallery_images && data.gallery_images.length > 0) {
                // Create new gallery if none exists
                const galleryResult = await SupabaseGalleryUtils.processGalleryDataByContext(
                    client as SupabaseClientType,
                    data.gallery_images,
                    "entity_type", // Replace with your entity type
                );
                
                // Update entity with new gallery_id
                const { gallery_images: _, deleted_images: __, ...updateData } = data;
                const payloadWithGallery = {
                    ...updateData,
                    gallery_id: galleryResult.galleryId,
                };
                
                const updated = await EntityService.update(client, id, payloadWithGallery);
                
                return ResponseService.success(
                    {
                        ...updated,
                        images: galleryResult.images,
                    } as EntityWithImages,
                    200,
                    undefined,
                    ResponseType.API,
                );
            }
        } catch (error) {
            console.error("Error updating gallery:", error);
            // Continue with entity update even if gallery fails
        }
    }

    // Build payload excluding gallery fields
    const { gallery_images: _gallery_images, deleted_images: _deleted_images, ...entityData } = data;

    try {
        const updated = await EntityService.update(client, id, entityData);

        // Add gallery images to response if we have them
        const responseData = {
            ...updated,
            images: galleryImages,
        };

        return ResponseService.success(
            responseData as EntityWithImages,
            200,
            undefined,
            ResponseType.API,
        );
    } catch (error: unknown) {
        // ... error handling
    }
}
```

### 8. Update DELETE Method

Add gallery cleanup to the DELETE method:

```typescript
override async delete(id: string, _req?: Request): Promise<Response> {
    // ... existing authentication

    try {
        // Get entity to check for gallery_id
        const entity = await EntityService.getById(client, id);

        if (entity?.gallery_id) {
            try {
                await SupabaseGalleryUtils.deleteGallery(
                    client as SupabaseClientType,
                    entity.gallery_id,
                    { bucket: "entity-galleries", folderPrefix: "gallery" }, // Replace bucket name
                );
            } catch (galleryError) {
                console.error("Error deleting gallery:", galleryError);
                // Continue with entity deletion even if gallery deletion fails
            }
        }

        const result = await EntityService.softDelete(client, id);
        return ResponseService.success(
            result,
            200,
            undefined,
            ResponseType.API,
        );
    } catch (error: unknown) {
        // ... error handling
    }
}
```

### 9. Update SupabaseGalleryUtils

Add your entity type to the gallery utilities:

```typescript
// In supabaseGalleryUtils.ts, update the context maps:

// In getGalleryImagesByContext method:
entityType: "venues" | "events" | "partners" | "shops" | "your_entity_type" = "venues"

const contextMap: Record<string, GalleryContext> = {
    venues: { bucket: "venue-galleries", folderPrefix: "gallery" },
    events: { bucket: "event-galleries", folderPrefix: "gallery" },
    partners: { bucket: "partner-galleries", folderPrefix: "gallery" },
    shops: { bucket: "shop-galleries", folderPrefix: "gallery" },
    your_entity_type: { bucket: "your-entity-galleries", folderPrefix: "gallery" },
};

// In processGalleryDataByContext method:
entityType: "venues" | "events" | "partners" | "shops" | "your_entity_type" = "venues"

const contextMap: Record<string, GalleryContext> = {
    venues: { bucket: "venue-galleries", folderPrefix: "gallery" },
    events: { bucket: "event-galleries", folderPrefix: "gallery" },
    partners: { bucket: "partner-galleries", folderPrefix: "gallery" },
    shops: { bucket: "shop-galleries", folderPrefix: "gallery" },
    your_entity_type: { bucket: "your-entity-galleries", folderPrefix: "gallery" },
};
```

## Configuration

### Storage Bucket Setup

1. Create a Supabase Storage bucket named `{entity-type}-galleries`
2. Configure public access if needed
3. Set up proper RLS policies

### Database Schema

Ensure your entity table has a `gallery_id` field:

```sql
ALTER TABLE your_entity_table 
ADD COLUMN gallery_id UUID REFERENCES galleries(id);
```

## API Usage Examples

### Create Entity with Gallery

```bash
curl -X POST /functions/v1/your_entity \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entity Name",
    "gallery_images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ]
  }'
```

### Update Entity Gallery

```bash
curl -X PUT /functions/v1/your_entity/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "gallery_images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    ],
    "deleted_images": ["image-uuid-1", "image-uuid-2"]
  }'
```

### Get Entity with Gallery

```bash
curl -X GET /functions/v1/your_entity/{id}
```

### List Entities with Galleries

```bash
curl -X GET "/functions/v1/your_entity?include_galleries=true"
```

## Response Format

Entities with galleries will include an `images` array in the response:

```json
{
    "success": true,
    "data": {
        "id": "entity-uuid",
        "name": "Entity Name",
        "gallery_id": "gallery-uuid",
        "images": [
            {
                "id": "image-uuid-1",
                "file_name": "gallery-image-1.jpg",
                "url": "https://supabase.co/storage/v1/object/public/your-entity-galleries/gallery_123/image-1.jpg"
            }
        ]
    }
}
```

## Storage Structure

Images are stored in the following structure:

```
your-entity-galleries/
└── gallery_{gallery_id}/
    ├── {timestamp}-gallery-image-1.jpg
    ├── {timestamp}-gallery-image-2.png
    └── ...
```

## Error Handling

The implementation includes comprehensive error handling:

- Gallery processing failures don't prevent entity creation/updates
- Missing galleries are handled gracefully
- Storage errors are logged but don't break the main functionality
- Individual image failures don't affect other images

## Testing

Test the following scenarios:

1. **Create with images**: POST with `gallery_images` array
2. **Create without images**: POST without `gallery_images` (should create empty
   gallery)
3. **Update with new images**: PUT with `gallery_images`
4. **Update with deletions**: PUT with `deleted_images`
5. **Get single item**: GET by ID should include images
6. **Get list with galleries**: GET with `include_galleries=true`
7. **Delete entity**: Should clean up gallery and images

## Notes

- Always create a gallery, even if no images are provided
- Use consistent bucket naming: `{entity-type}-galleries`
- Gallery images are automatically processed and uploaded
- URLs are constructed to be publicly accessible
- Gallery cleanup happens automatically on entity deletion
- The implementation is resilient to gallery-related failures

This pattern ensures consistent gallery functionality across all entities in
your Supabase Edge Functions.
