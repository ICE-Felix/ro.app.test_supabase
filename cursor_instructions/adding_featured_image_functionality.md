# Adding Featured Image Functionality to Supabase Edge Functions

This guide documents the steps required to add featured image functionality to
any Supabase Edge Function, following the pattern established in the venues and
service_providers functions.

## Overview

Featured image functionality allows entities to have a single primary image with
the following capabilities:

- Upload images via base64 strings or File/Blob objects
- Automatic image processing and storage in Supabase Storage
- Public image URLs in API responses
- Update featured images during entity updates
- Organized storage with timestamped filenames

## Prerequisites

- Existing Supabase Edge Function with basic CRUD operations
- Supabase Storage bucket configured for the entity type
- Entity table with `featured_image_path` field

## Step-by-Step Implementation

### 1. Update Service Layer

Add image upload methods to your entity service file (e.g.,
`supabaseEntityService.ts`):

```typescript
/**
 * Upload entity featured image
 */
static async uploadEntityImage(
    client: SupabaseClient,
    imageData: File | Blob | string,
    fileName: string,
): Promise<{ path: string; url: string; id?: string } | null> {
    try {
        let fileData: File | Blob;
        if (typeof imageData === "string") {
            const base64Data = imageData.replace(
                /^data:image\/[a-z]+;base64,/,
                "",
            );
            const bytes = Uint8Array.from(
                atob(base64Data),
                (c) => c.charCodeAt(0),
            );
            fileData = new Blob([bytes], { type: "image/jpeg" });
        } else {
            fileData = imageData;
        }

        const uploadFileName = `${Date.now()}-${fileName}`;
        const { data: uploadData } = await client.storage
            .from("entity-featured-images") // Replace with your bucket name
            .upload(uploadFileName, fileData);
        if (!uploadData) return null;

        const url = this.buildPublicImageUrl(
            "entity-featured-images", // Replace with your bucket name
            uploadData.path,
        );
        const storageId = (uploadData as { id?: string }).id;
        return { path: uploadData.path, url: url || "", id: storageId };
    } catch {
        return null;
    }
}

/**
 * Build public image URL
 */
static buildPublicImageUrl(bucket: string, path: string): string {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) return "";
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}
```

### 2. Update Controller Payload Types

Extend your existing payload types to include image upload fields:

```typescript
// Request payload types
type EntityInsertPayload = EntityInsert & {
    // Image upload fields
    image_file?: File | Blob;
    image_base64?: string;
    // Gallery fields (if applicable)
    gallery_images?: string[];
    [key: string]: unknown;
};

type EntityUpdatePayload = EntityUpdate & {
    // Image upload fields
    image_file?: File | Blob;
    image_base64?: string;
    // Gallery fields (if applicable)
    gallery_images?: string[];
    deleted_images?: string[];
    [key: string]: unknown;
};
```

### 3. Update POST Method

Add image upload processing to the POST method:

```typescript
override async post(data: EntityInsertPayload, _req?: Request): Promise<Response> {
    this.logAction("EntityAPI POST", { data });
    const { client } = await AuthenticationService.authenticate(_req!);

    // Handle image upload if provided
    let imageStorageId: string | null = null;
    if (data.image_file || data.image_base64) {
        const imageData = data.image_file || data.image_base64!;
        const fileName = data.image_file instanceof File
            ? data.image_file.name
            : "uploaded-image.jpg";
        const uploadResult = await EntityService.uploadEntityImage(
            client as any,
            imageData,
            fileName,
        );
        if (uploadResult) {
            imageStorageId = uploadResult.id || null;
        }
    }

    // Handle gallery processing (if applicable)
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
        // Create empty gallery even if no images provided (if applicable)
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

    // Build payload excluding image and gallery fields
    const { 
        gallery_images: _gallery_images, 
        image_file: _image_file, 
        image_base64: _image_base64, 
        ...entityData 
    } = data;
    const payload = {
        ...entityData,
        gallery_id: galleryId,
        image_featured_id: imageStorageId,
    };

    try {
        const created = await EntityService.create(client, payload);

        // Add gallery images to response (if applicable)
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
        return ResponseService.error(
            "Error creating entity",
            "ENTITY_CREATE_ERROR",
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
```

### 4. Update PUT Method

Add image update functionality to the PUT method:

```typescript
override async put(id: string, data: EntityUpdatePayload, _req?: Request): Promise<Response> {
    this.logAction("EntityAPI PUT", { id, data });
    const { client } = await AuthenticationService.authenticate(_req!);

    // Handle image upload if provided
    let imageStorageId: string | null = null;
    if (data.image_file || data.image_base64) {
        const imageData = data.image_file || data.image_base64!;
        const fileName = data.image_file instanceof File
            ? data.image_file.name
            : "uploaded-image.jpg";
        const uploadResult = await EntityService.uploadEntityImage(
            client as any,
            imageData,
            fileName,
        );
        if (uploadResult) {
            imageStorageId = uploadResult.id || null;
        }
    }

    // Handle gallery updates if provided (if applicable)
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

    // Build payload excluding image and gallery fields
    const {
        gallery_images: _gallery_images,
        deleted_images: _deleted_images,
        image_file: _image_file,
        image_base64: _image_base64,
        ...entityData
    } = data;

    // Add image_featured_id if image was uploaded
    if (imageStorageId !== null) {
        entityData.image_featured_id = imageStorageId;
    }

    try {
        const updated = await EntityService.update(client, id, entityData);

        // Add gallery images to response if we have them (if applicable)
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
        return ResponseService.error(
            "Error updating entity",
            "ENTITY_UPDATE_ERROR",
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
```

### 5. Update GET Method (Optional)

If you want to include the featured image URL in responses, you can enhance the
GET method:

```typescript
override async get(id?: string, _req?: Request): Promise<Response> {
    // ... existing authentication and validation

    if (id) {
        try {
            const row = await EntityService.getById(client, id);
            if (!row) {
                return ResponseService.error(/* ... */);
            }

            // Build featured image URL if image_featured_id exists
            let featuredImageUrl: string | null = null;
            if (row.image_featured_id) {
                featuredImageUrl = EntityService.buildPublicImageUrl(
                    "entity-featured-images", // Replace with your bucket name
                    row.image_featured_id,
                );
            }

            // Fetch gallery images if gallery_id exists (if applicable)
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
                featured_image_url: featuredImageUrl,
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

## Configuration

### Storage Bucket Setup

1. Create a Supabase Storage bucket named `{entity-type}-featured-images`
2. Configure public access if needed
3. Set up proper RLS policies

### Database Schema

Ensure your entity table has an `image_featured_id` field:

```sql
ALTER TABLE your_entity_table 
ADD COLUMN image_featured_id UUID;
```

## API Usage Examples

### Create Entity with Featured Image

```bash
curl -X POST /functions/v1/your_entity \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entity Name",
    "description": "Entity description",
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'
```

### Update Entity with New Featured Image

```bash
curl -X PUT /functions/v1/your_entity/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Entity Name",
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'
```

### Create Entity with Both Featured Image and Gallery

```bash
curl -X POST /functions/v1/your_entity \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entity Name",
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "gallery_images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    ]
  }'
```

## Response Format

Entities with featured images will include the `image_featured_id` and
optionally `featured_image_url` in the response:

```json
{
    "success": true,
    "data": {
        "id": "entity-uuid",
        "name": "Entity Name",
        "image_featured_id": "storage-uuid",
        "featured_image_url": "https://supabase.co/storage/v1/object/public/entity-featured-images/1760620006359-uploaded-image.jpg",
        "gallery_id": "gallery-uuid",
        "images": [
            {
                "id": "image-uuid-1",
                "file_name": "gallery-image-1.jpg",
                "url": "https://supabase.co/storage/v1/object/public/entity-galleries/gallery_123/image-1.jpg"
            }
        ]
    }
}
```

## Storage Structure

Images are stored in the following structure:

```
entity-featured-images/
├── 1760620006359-uploaded-image.jpg
├── 1760620006450-company-logo.png
└── 1760620006550-featured-photo.jpeg

entity-galleries/ (if applicable)
└── gallery_{gallery_id}/
    ├── {timestamp}-gallery-image-1.jpg
    └── ...
```

## Key Features

- ✅ **Base64 Support**: Handles base64 strings from frontend
- ✅ **File Upload Support**: Also supports File/Blob objects
- ✅ **Automatic Processing**: Converts base64 to Blob for upload
- ✅ **Timestamped Filenames**: Generates unique filenames with timestamps
- ✅ **Public URLs**: Constructs accessible image URLs
- ✅ **Error Handling**: Graceful fallback if image upload fails
- ✅ **Storage Organization**: Separate buckets for featured images and
  galleries
- ✅ **Update Support**: Can update featured images during entity updates

## Error Handling

The implementation includes comprehensive error handling:

- Image processing failures don't prevent entity creation/updates
- Missing images are handled gracefully
- Storage errors are logged but don't break the main functionality
- Individual image failures don't affect other operations

## Testing

Test the following scenarios:

1. **Create with featured image**: POST with `image_base64` field
2. **Create without image**: POST without image fields (should work normally)
3. **Update with new image**: PUT with `image_base64` field
4. **Update without image**: PUT without image fields (keeps existing image)
5. **Delete image**: PUT with `deleteImage: true` field
6. **Get entity**: Should include `featured_image_path` and `image_url`
7. **Combined with gallery**: Test both featured image and gallery functionality
   together

## Notes

- Always use consistent bucket naming: `{entity-type}-images`
- Featured images are stored separately from gallery images
- URLs are constructed to be publicly accessible
- The implementation is resilient to image-related failures
- Works seamlessly with gallery functionality if implemented
- Supports both base64 strings and File/Blob objects

This pattern ensures consistent featured image functionality across all entities
in your Supabase Edge Functions, providing a clean separation between featured
images and gallery images while maintaining full CRUD capabilities.

## Services-specific notes

- Bucket: use `services-images` for featured images.
- Images are stored in the bucket under the entity ID folder (e.g.,
  `{entity-id}/image-name.jpg`)
- Controller should include `image_url` in both GET by id and list responses
- POST/PUT accept `image_file` or `image_base64`; on upload success set
  `featured_image_path` and return `image_url`

## Service providers-specific notes

- Bucket: use `service-providers-images` for featured images.
- Images are stored in the bucket under the entity ID folder (e.g.,
  `{entity-id}/image-name.jpg`)
- Controllers should include `image_url` in both GET by id and list responses
- POST/PUT accept `image_file` or `image_base64`; on upload success set
  `featured_image_path` and return `image_url`
