# Venues API Documentation

This document provides comprehensive documentation for the Venues API endpoints,
including all available filters, gallery functionality, and usage examples.

## Base URL

```
https://your-project.supabase.co/functions/v1/venues
```

## Authentication

All endpoints require authentication. Include the following headers:

```
Authorization: Bearer <your-jwt-token>
apikey: <your-supabase-anon-key>
```

## Endpoints Overview

| Method | Endpoint       | Description                           |
| ------ | -------------- | ------------------------------------- |
| GET    | `/venues`      | List all venues with optional filters |
| GET    | `/venues/{id}` | Get a specific venue by ID            |
| POST   | `/venues`      | Create a new venue                    |
| PUT    | `/venues/{id}` | Update an existing venue              |
| DELETE | `/venues/{id}` | Soft delete a venue                   |

## GET /venues - List Venues

Retrieve a paginated list of venues with optional filtering and gallery support.

### Query Parameters

#### Pagination

- `limit` (integer, default: 20) - Number of items per page
- `offset` (integer, default: 0) - Starting position
- `page` (integer) - Page number (alternative to offset)

#### Basic Filters

- `search` (string) - Search in venue name and description
- `is_active` (boolean) - Filter by active status
- `has_contact` (boolean) - Filter venues that have contact information
- `has_image` (boolean) - Filter venues that have featured images

#### Category Filters

- `venue_category_id` (string) - Filter by specific venue category
- `include_subcategories` (boolean, default: true) - Include subcategories when
  filtering by category

#### Attribute Filters

- `attribute_ids` (string, comma-separated) - Filter by venue attributes
- `attribute_filters` (string, comma-separated) - Filter by venue general
  attributes

#### Location Filters

- `location_latitude` (number) - User's latitude for distance filtering
- `location_longitude` (number) - User's longitude for distance filtering
- `radius_km` (number) - Search radius in kilometers

#### Ordering

- `orderBy` (string) - Order results by specified field
  - `"distance"` - Order by distance from user location (requires
    `location_latitude` and `location_longitude`)
  - Default: Order by creation date (newest first)

#### Gallery Support

- `include_galleries` (boolean, default: false) - Include gallery images in
  response

### Example Requests

#### Basic List

```bash
GET /venues?limit=20&offset=0
```

#### Search with Filters

```bash
GET /venues?search=restaurant&is_active=true&has_contact=true&limit=10
```

#### Category Filtering

```bash
GET /venues?venue_category_id=123&include_subcategories=true
```

#### Location-based Search

```bash
GET /venues?location_latitude=37.7749&location_longitude=-122.4194&radius_km=5
```

#### Distance-ordered Search

```bash
GET /venues?location_latitude=37.7749&location_longitude=-122.4194&orderBy=distance&limit=10
```

#### With Gallery Images

```bash
GET /venues?include_galleries=true&limit=5
```

### Response Format

#### Without Gallery Images (Default)

```json
{
    "success": true,
    "data": [
        {
            "id": "venue-uuid",
            "name": "Venue Name",
            "description": "Venue description",
            "address": "123 Main St",
            "location_latitude": "37.7749",
            "location_longitude": "-122.4194",
            "is_active": true,
            "gallery_id": "gallery-uuid",
            "venue_categories": [
                {
                    "id": "category-uuid",
                    "name": "Restaurant"
                }
            ],
            "attributes": [
                {
                    "id": "attr-uuid",
                    "type": "cuisine",
                    "value": "Italian"
                }
            ]
        }
    ],
    "meta": {
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 100,
            "totalPages": 5,
            "hasNext": true,
            "hasPrev": false
        },
        "filters": {
            "search": "restaurant",
            "is_active": true,
            "include_galleries": false
        }
    }
}
```

#### With Gallery Images

```json
{
  "success": true,
  "data": [
    {
      "id": "venue-uuid",
      "name": "Venue Name",
      "gallery_id": "gallery-uuid",
      "images": [
        {
          "id": "image-uuid",
          "file_name": "venue-photo-1.jpg",
          "url": "https://supabase.co/storage/v1/object/public/venue-galleries/gallery_uuid/venue-photo-1.jpg"
        },
        {
          "id": "image-uuid-2",
          "file_name": "venue-photo-2.jpg",
          "url": "https://supabase.co/storage/v1/object/public/venue-galleries/gallery_uuid/venue-photo-2.jpg"
        }
      ],
      // ... other venue fields
    }
  ],
  "meta": {
    "pagination": { ... },
    "filters": {
      "include_galleries": true
    }
  }
}
```

## GET /venues/{id} - Get Venue by ID

Retrieve a specific venue with all its details and gallery images.

### Example Request

```bash
GET /venues/venue-uuid-123
```

### Response Format

```json
{
    "success": true,
    "data": {
        "id": "venue-uuid-123",
        "name": "Restaurant Name",
        "description": "A great restaurant",
        "address": "123 Main St",
        "location_latitude": "37.7749",
        "location_longitude": "-122.4194",
        "is_active": true,
        "gallery_id": "gallery-uuid",
        "venue_categories": [
            {
                "id": "category-uuid",
                "name": "Restaurant"
            }
        ],
        "attributes": [
            {
                "id": "attr-uuid",
                "type": "cuisine",
                "value": "Italian"
            }
        ],
        "images": [
            {
                "id": "image-uuid",
                "file_name": "restaurant-photo.jpg",
                "url": "https://supabase.co/storage/v1/object/public/venue-galleries/gallery_uuid/restaurant-photo.jpg"
            }
        ]
    }
}
```

## POST /venues - Create Venue

Create a new venue with optional image upload and gallery creation.

### Request Body

#### Basic Venue Data

```json
{
    "name": "New Restaurant",
    "description": "A new restaurant",
    "address": "456 Oak St",
    "location_latitude": "37.7849",
    "location_longitude": "-122.4094",
    "is_active": true,
    "venue_category_id": ["category-uuid-1", "category-uuid-2"],
    "attribute_ids": ["attr-uuid-1", "attr-uuid-2"]
}
```

#### With Featured Image Upload

```json
{
    "name": "New Restaurant",
    "description": "A new restaurant",
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "venue_category_id": ["category-uuid-1"]
}
```

#### With Gallery Images

```json
{
    "name": "New Restaurant",
    "description": "A new restaurant",
    "gallery_images": [
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    ],
    "venue_category_id": ["category-uuid-1"]
}
```

### Response Format

```json
{
    "success": true,
    "data": {
        "id": "new-venue-uuid",
        "name": "New Restaurant",
        "gallery_id": "new-gallery-uuid",
        "images": [
            {
                "id": "image-uuid-1",
                "file_name": "gallery-image-1.jpg",
                "url": "https://supabase.co/storage/v1/object/public/venue-galleries/gallery_uuid/gallery-image-1.jpg"
            }
        ]
        // ... other venue fields
    },
    "meta": {
        "created_id": "new-venue-uuid"
    }
}
```

## PUT /venues/{id} - Update Venue

Update an existing venue with optional image and gallery modifications.

### Request Body

#### Basic Update

```json
{
    "name": "Updated Restaurant Name",
    "description": "Updated description",
    "is_active": false
}
```

#### Update Featured Image

```json
{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

#### Update Gallery

```json
{
    "gallery_images": [
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    ],
    "deleted_images": ["image-uuid-to-delete-1", "image-uuid-to-delete-2"]
}
```

### Gallery Update Behavior

- **Adding Images**: Include new base64 images in `gallery_images`
- **Removing Images**: Include image IDs to delete in `deleted_images`
- **Mixed Operations**: You can add and delete images in the same request
- **Existing Gallery**: Images are added to the existing gallery folder
- **No New Gallery**: A new gallery is not created during updates

### Response Format

```json
{
    "success": true,
    "data": {
        "id": "venue-uuid",
        "name": "Updated Restaurant Name",
        "gallery_id": "existing-gallery-uuid",
        "images": [
            {
                "id": "remaining-image-uuid",
                "file_name": "existing-image.jpg",
                "url": "https://supabase.co/storage/v1/object/public/venue-galleries/gallery_uuid/existing-image.jpg"
            },
            {
                "id": "new-image-uuid",
                "file_name": "gallery-image-1.jpg",
                "url": "https://supabase.co/storage/v1/object/public/venue-galleries/gallery_uuid/gallery-image-1.jpg"
            }
        ]
        // ... other venue fields
    }
}
```

## DELETE /venues/{id} - Delete Venue

Soft delete a venue and its associated gallery.

### Example Request

```bash
DELETE /venues/venue-uuid-123
```

### Response Format

```json
{
    "success": true,
    "data": {
        "id": "venue-uuid-123",
        "deleted_at": "2024-01-15T10:30:00.000Z"
        // ... other venue fields
    }
}
```

## Gallery System

### How Galleries Work

1. **Automatic Creation**: A gallery is automatically created for each venue
2. **Storage Structure**: Images are stored in `venue-galleries` bucket in
   folders named `gallery_{gallery_id}`
3. **Image Processing**: Base64 images are automatically processed and uploaded
4. **URL Generation**: Public URLs are generated for all gallery images
5. **Cleanup**: When a venue is deleted, its gallery and all images are also
   deleted

### Image Upload Process

1. **Base64 Processing**: Raw base64 strings are converted to proper image files
2. **Filename Generation**: Automatic filenames are generated (e.g.,
   `gallery-image-1.jpg`)
3. **Content Type Detection**: Image format is detected from base64 data
4. **Storage Upload**: Images are uploaded to Supabase Storage
5. **Database Records**: `gallery_images` records are created with metadata
6. **URL Construction**: Public URLs are constructed for immediate use

### Gallery Image Structure

```json
{
    "id": "image-uuid",
    "file_name": "gallery-image-1.jpg",
    "url": "https://supabase.co/storage/v1/object/public/venue-galleries/gallery_uuid/gallery-image-1.jpg"
}
```

## Error Handling

### Common Error Responses

#### Validation Error

```json
{
    "success": false,
    "error": {
        "message": "Validation failed",
        "code": "VALIDATION_ERROR",
        "details": {
            "errors": ["Name is required", "Invalid category ID"]
        }
    }
}
```

#### Not Found

```json
{
    "success": false,
    "error": {
        "message": "Venue not found",
        "code": "NOT_FOUND",
        "details": null
    }
}
```

#### Gallery Error

```json
{
    "success": false,
    "error": {
        "message": "Error processing gallery",
        "code": "GALLERY_PROCESSING_ERROR",
        "details": {
            "error": "Invalid base64 image data"
        }
    }
}
```

## Performance Considerations

### Pagination

- Default limit is 20 items per page
- Maximum recommended limit is 50 items
- Use `page` parameter for better UX than `offset`

### Gallery Images

- Only request `include_galleries=true` when needed
- Gallery images are fetched in parallel for better performance
- Individual venue failures don't affect the entire list

### Location Filtering

- Use `radius_km` for efficient location-based searches
- Use `orderBy=distance` with `location_latitude` and `location_longitude` to
  order results by distance
- Results are automatically ordered by distance when `orderBy=distance` is
  specified

## Best Practices

### Request Optimization

1. Use specific filters to reduce response size
2. Only request gallery images when needed
3. Use pagination for large datasets
4. Combine filters for precise results

### Image Handling

1. Compress images before base64 encoding
2. Use appropriate image formats (JPEG for photos, PNG for graphics)
3. Keep individual image sizes reasonable (< 5MB recommended)

### Error Handling

1. Always check the `success` field in responses
2. Handle gallery processing errors gracefully
3. Implement retry logic for transient failures

## Examples

### Complete Workflow Example

```bash
# 1. Create a venue with gallery
curl -X POST /venues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Restaurant",
    "description": "A great place to eat",
    "address": "123 Main St",
    "location_latitude": "37.7749",
    "location_longitude": "-122.4194",
    "venue_category_id": ["restaurant-category-uuid"],
    "gallery_images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    ]
  }'

# 2. List venues with galleries
curl -X GET "/venues?include_galleries=true&limit=10" \
  -H "Authorization: Bearer <token>"

# 3. Update venue gallery
curl -X PUT /venues/venue-uuid \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "gallery_images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    ],
    "deleted_images": ["old-image-uuid"]
  }'

# 4. Search nearby venues ordered by distance
curl -X GET "/venues?location_latitude=37.7749&location_longitude=-122.4194&radius_km=5&orderBy=distance&include_galleries=true" \
  -H "Authorization: Bearer <token>"
```

This documentation covers all aspects of the Venues API, including the
comprehensive gallery system and all available filters.
