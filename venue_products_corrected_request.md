# Corrected Venue Products Request

## Issues in Your Original Request:

1. **Template variables**: `{{base_64_image_test}}` - These need to be actual
   base64 strings
2. **Data type issues**: `"woo_stock_quantity": 5.0` should be `5` (integer, not
   float)

## Corrected Request Payload:

```json
{
    "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
    "woo_name": "Camera Dubla",
    "venue_id": "c696a756-de8a-4560-9b8e-8d73b8c38f44",
    "venue_product_categories": ["double_room"],
    "woo_description": "<div>TEST</div>",
    "woo_short_description": "TEST",
    "woo_regular_price": "12.0",
    "woo_sale_price": "15.0",
    "price_type": "per_day",
    "woo_stock_quantity": 5,
    "woo_manage_stock": true,
    "max_capacity": 2,
    "ad_hoc_dates": [
        {
            "date": "2025-10-23",
            "windows": [
                {
                    "start_time": "15:35",
                    "end_time": "19:41"
                }
            ]
        },
        {
            "date": "2025-10-24",
            "windows": [
                {
                    "start_time": "15:35",
                    "end_time": "19:41"
                }
            ]
        }
    ],
    "gallery_images": [
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    ],
    "woo_status": "draft",
    "woo_catalog_visibility": "catalog",
    "woo_type": "simple",
    "woo_featured": false
}
```

## Key Changes Made:

1. ✅ **Fixed data types**:
   - `"woo_stock_quantity": 5.0` → `"woo_stock_quantity": 5`
   - `"max_capacity": 2.0` → `"max_capacity": 2`
2. ✅ **Replaced template variables**: `{{base_64_image_test}}` → actual base64
   strings
3. ✅ **Added `woo_manage_stock` field**: Now supported in the API
4. ✅ **Ensured all required fields are present**

## Required Fields for Venue Products:

- `woo_name` (string) - ✅ Present
- `venue_id` (string) - ✅ Present
- `venue_product_categories` (string[]) - ✅ Present

## Optional Fields:

- `image_base64` (string) - ✅ Present
- `gallery_images` (string[]) - ✅ Present
- All `woo_*` fields - ✅ Present
- `ad_hoc_dates` (Json) - ✅ Present

This corrected payload should resolve the "Invalid request payload" error! 🚀
