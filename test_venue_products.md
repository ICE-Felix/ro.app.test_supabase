# Venue Products API Testing Guide

This document outlines how to test the new venue products functionality with
WooCommerce integration, featured images, and gallery support.

## Prerequisites

1. **Storage Buckets**: Ensure these buckets exist in Supabase Storage:
   - `venue-products-images` (for featured images)
   - `venue-products-galleries` (for gallery images)

2. **Database Schema**: Ensure the `venue_products` table has:
   - `featured_image_path` column
   - `gallery_id` column
   - `woo_product_id` column

3. **WooCommerce Integration**: Ensure WooCommerce API is properly configured

## API Endpoints

### Base URL

```
/functions/v1/venue_products
```

## Test Scenarios

### 1. Create Venue Product with WooCommerce Integration

**POST** `/functions/v1/venue_products`

```json
{
  "venue_id": "venue-uuid-here",
  "max_capacity": 100,
  "price_type": "fixed",
  "ad_hoc_dates": null,
  "blackout_dates": [],
  "venue_product_categoires": ["category1", "category2"],
  "woo_name": "Test Venue Product",
  "woo_description": "A test venue product description",
  "woo_short_description": "Short description",
  "woo_regular_price": "50.00",
  "woo_sale_price": "40.00",
  "woo_sku": "VP-001",
  "woo_stock_quantity": 100,
  "woo_base_price": "45.00",
  "woo_status": "publish",
  "woo_catalog_visibility": "visible",
  "woo_type": "external",
  "woo_featured": true,
  "woo_shop_id": 1,
  "woo_categories": [
    { "id": 1, "name": "Venue Products", "slug": "venue-products" }
  ],
  "woo_tags": [
    { "id": 1, "name": "test", "slug": "test" }
  ],
  "woo_images": [
    {
      "id": 1,
      "src": "https://example.com/image.jpg",
      "name": "test-image.jpg",
      "alt": "Test image",
      "date_created": "2024-01-01T00:00:00Z",
      "date_created_gmt": "2024-01-01T00:00:00Z",
      "date_modified": "2024-01-01T00:00:00Z",
      "date_modified_gmt": "2024-01-01T00:00:00Z",
      "position": 0
    }
  ],
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "gallery_images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  ]
}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "venue-product-uuid",
    "venue_id": "venue-uuid-here",
    "max_capacity": 100,
    "price_type": "fixed",
    "featured_image_path": "venue-product-uuid/featured-image.jpg",
    "featured_image_url": "https://supabase.co/storage/v1/object/public/venue-products-images/venue-product-uuid/featured-image.jpg",
    "gallery_id": "gallery-uuid",
    "woo_product_id": 123,
    "images": [
      {
        "id": "image-uuid-1",
        "file_name": "gallery-image-1.jpg",
        "url": "https://supabase.co/storage/v1/object/public/venue-products-galleries/gallery_123/image-1.jpg"
      }
    ],
    "woo_product": {
      "id": 123,
      "name": "Test Venue Product",
      "description": "A test venue product description",
      "short_description": "Short description",
      "price": "50.00",
      "regular_price": "50.00",
      "sale_price": "40.00",
      "sku": "VP-001",
      "status": "publish",
      "stock_status": "instock",
      "stock_quantity": 100,
      "manage_stock": true,
      "featured": true,
      "catalog_visibility": "visible",
      "type": "external",
      "shop_id": 1,
      "images": [...],
      "categories": [...],
      "tags": [...]
    }
  }
}
```

### 2. Get Venue Product by ID

**GET** `/functions/v1/venue_products/{id}`

**Expected Response:** Same as create response but for existing venue product.

### 3. List Venue Products

**GET** `/functions/v1/venue_products`

**Query Parameters:**

- `venue_id` (optional): Filter by venue ID
- `search` (optional): Search in product names
- `include_galleries` (optional): Include gallery images in response
- `limit` (optional): Number of items per page
- `offset` (optional): Pagination offset

**Example:**

```
GET /functions/v1/venue_products?venue_id=venue-uuid&include_galleries=true&limit=10
```

### 4. Update Venue Product

**PUT** `/functions/v1/venue_products/{id}`

```json
{
  "max_capacity": 150,
  "woo_name": "Updated Venue Product",
  "woo_regular_price": "60.00",
  "woo_stock_quantity": 50,
  "woo_base_price": "55.00",
  "woo_status": "draft",
  "woo_featured": false,
  "woo_shop_id": 2,
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "gallery_images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  ],
  "deleted_images": ["old-image-uuid"]
}
```

### 5. Delete Featured Image

**PUT** `/functions/v1/venue_products/{id}`

```json
{
  "deleteImage": true
}
```

### 6. Delete Venue Product

**DELETE** `/functions/v1/venue_products/{id}`

This will:

- Soft delete the venue product
- Delete the WooCommerce product
- Delete the featured image
- Delete the gallery and all gallery images

## Key Features Tested

### ✅ WooCommerce Integration

- Creates WooCommerce product with `type: "external"`
- Updates WooCommerce product on venue product update
- Deletes WooCommerce product on venue product deletion
- Merges WooCommerce data in GET responses

### ✅ Featured Image Support

- Uploads base64 images to `venue-products-images` bucket
- Generates public URLs for featured images
- Updates featured images on PUT requests
- Deletes featured images with `deleteImage: true`

### ✅ Gallery Support

- Creates galleries with multiple images
- Stores images in `venue-products-galleries` bucket
- Updates galleries (add/remove images)
- Includes gallery images in responses when `include_galleries=true`

### ✅ Bulk WooCommerce Fetching

- Uses WooCommerce `include` parameter for bulk fetching
- Maps WooCommerce products to venue products efficiently
- Handles missing WooCommerce products gracefully

## Error Scenarios to Test

1. **Invalid venue_id**: Should return 400 error
2. **Missing required WooCommerce fields**: Should return 400 error
3. **WooCommerce API failure**: Should handle gracefully and continue with venue
   product creation
4. **Invalid image data**: Should handle gracefully and continue without image
5. **Storage bucket not found**: Should return appropriate error

## Performance Considerations

- **Bulk fetching**: Uses WooCommerce `include` parameter to fetch multiple
  products in one request
- **Image optimization**: Images are stored with timestamped filenames
- **Gallery efficiency**: Gallery images are only fetched when
  `include_galleries=true`
- **Error resilience**: WooCommerce failures don't prevent venue product
  operations

## Storage Structure

```
venue-products-images/
├── {venue_product_id}/
│   └── featured-image.jpg

venue-products-galleries/
└── gallery_{gallery_id}/
    ├── {timestamp}-image-1.jpg
    └── {timestamp}-image-2.png
```

This implementation provides a complete venue products management system with
WooCommerce integration, featured images, and gallery support, following the
same patterns established for service providers and services.
