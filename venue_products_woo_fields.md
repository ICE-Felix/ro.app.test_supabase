# Venue Products - Additional WooCommerce Fields

This document outlines the additional WooCommerce fields that have been added to
the venue products functionality.

## New WooCommerce Fields

The following fields have been added to both `VenueProductInsertPayload` and
`VenueProductUpdatePayload`:

### 1. **woo_stock_quantity** (number, optional)

- Controls the stock quantity for the WooCommerce product
- Maps to WooCommerce `stock_quantity` field
- Used for inventory management

### 2. **woo_base_price** (string, optional)

- Alternative to `woo_regular_price` for setting the base price
- Maps to WooCommerce `regular_price` field
- Takes precedence over `woo_regular_price` if both are provided

### 3. **woo_status** (string, optional)

- Controls the publication status of the WooCommerce product
- Maps to WooCommerce `status` field
- Common values: `"publish"`, `"draft"`, `"private"`, `"pending"`
- Defaults to `"publish"` if not specified

### 4. **woo_catalog_visibility** (string, optional)

- Controls how the product appears in the catalog
- Maps to WooCommerce `catalog_visibility` field
- Common values: `"visible"`, `"catalog"`, `"search"`, `"hidden"`

### 5. **woo_type** (string, optional)

- Sets the product type in WooCommerce
- Maps to WooCommerce `type` field
- Common values: `"simple"`, `"grouped"`, `"external"`, `"variable"`
- Defaults to `"external"` for venue products if not specified

### 6. **woo_featured** (boolean, optional)

- Marks the product as featured in WooCommerce
- Maps to WooCommerce `featured` field
- Defaults to `false` if not specified

### 7. **woo_shop_id** (number, optional)

- Associates the product with a specific shop (multi-shop support)
- Maps to WooCommerce `shop_id` field
- Used for multi-shop WooCommerce setups

## Usage Examples

### Creating a Venue Product with All Fields

```json
{
    "venue_id": "venue-uuid",
    "max_capacity": 100,
    "woo_name": "Premium Venue Package",
    "woo_description": "A premium venue package with all amenities",
    "woo_short_description": "Premium package",
    "woo_regular_price": "100.00",
    "woo_sale_price": "80.00",
    "woo_sku": "VP-PREMIUM-001",
    "woo_stock_quantity": 50,
    "woo_base_price": "90.00",
    "woo_status": "publish",
    "woo_catalog_visibility": "visible",
    "woo_type": "external",
    "woo_featured": true,
    "woo_shop_id": 1,
    "woo_categories": [
        { "id": 1, "name": "Venue Packages", "slug": "venue-packages" }
    ],
    "woo_tags": [
        { "id": 1, "name": "premium", "slug": "premium" }
    ]
}
```

### Updating Specific WooCommerce Fields

```json
{
    "woo_stock_quantity": 25,
    "woo_status": "draft",
    "woo_featured": false,
    "woo_shop_id": 2
}
```

## Field Mapping

| Venue Product Field      | WooCommerce Field    | Type    | Notes                              |
| ------------------------ | -------------------- | ------- | ---------------------------------- |
| `woo_stock_quantity`     | `stock_quantity`     | number  | Inventory management               |
| `woo_base_price`         | `regular_price`      | string  | Alternative to `woo_regular_price` |
| `woo_status`             | `status`             | string  | Publication status                 |
| `woo_catalog_visibility` | `catalog_visibility` | string  | Catalog visibility                 |
| `woo_type`               | `type`               | string  | Product type                       |
| `woo_featured`           | `featured`           | boolean | Featured product flag              |
| `woo_shop_id`            | `shop_id`            | number  | Multi-shop support                 |

## Default Values

- **woo_type**: `"external"` (for venue products)
- **woo_status**: `"publish"`
- **woo_featured**: `false`
- **woo_catalog_visibility**: Not set (uses WooCommerce default)

## Validation

- All fields are optional
- `woo_stock_quantity` must be a non-negative number
- `woo_shop_id` must be a positive integer
- `woo_status` should be a valid WooCommerce status
- `woo_catalog_visibility` should be a valid WooCommerce visibility value
- `woo_type` should be a valid WooCommerce product type

## Response Integration

When fetching venue products, the WooCommerce data is automatically merged into
the response:

```json
{
    "id": "venue-product-uuid",
    "venue_id": "venue-uuid",
    "woo_product_id": 123,
    "woo_product": {
        "id": 123,
        "name": "Premium Venue Package",
        "stock_quantity": 50,
        "status": "publish",
        "featured": true,
        "catalog_visibility": "visible",
        "type": "external",
        "shop_id": 1
        // ... other WooCommerce fields
    }
}
```

This enhancement provides complete control over WooCommerce product creation and
management directly from the venue products API, supporting advanced e-commerce
scenarios and multi-shop setups.
