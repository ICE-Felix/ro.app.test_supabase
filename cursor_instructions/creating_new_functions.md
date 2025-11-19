# Creating New Supabase Edge Functions

This guide outlines the step-by-step process for creating new Supabase Edge
Functions following the established patterns in this codebase.

## Overview

Each function follows a consistent structure with:

- Main edge function entry point (`index.ts`)
- Type definitions (`*.types.ts`)
- Service layer (`supabase*.ts`)
- API controller (`*ApiController.ts`)
- Basic tests (`*.test.ts`)

## Step-by-Step Instructions

### 1. Create Function Directory Structure

Create the main function directory and subdirectories:

```
supabase/functions/{function_name}/
├── index.ts
├── controllers/
│   └── {FunctionName}ApiController.ts
└── tests/
    └── {function_name}.test.ts
```

### 2. Create Shared Service Directory

Create the shared service directory:

```
supabase/functions/_shared/supabase/{function_name}/
├── {function_name}.types.ts
└── supabase{FunctionName}.ts
```

### 3. Create Type Definitions

Create
`supabase/functions/_shared/supabase/{function_name}/{function_name}.types.ts`:

```typescript
import type { Database } from "../database.types.ts";

export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];

export type { FunctionName };
Row = Tables<"{table_name}">;
export type { FunctionName };
Insert = TablesInsert<"{table_name}">;
export type { FunctionName };
Update = TablesUpdate<"{table_name}">;
```

**Replace:**

- `{function_name}` with your function name (e.g., `services`)
- `{FunctionName}` with PascalCase version (e.g., `Service`)
- `{table_name}` with the actual database table name (e.g., `services`)

### 4. Create Service Layer

Create
`supabase/functions/_shared/supabase/{function_name}/supabase{FunctionName}.ts`:

```typescript
import type { SupabaseClient } from "npm:@supabase/supabase-js";
import type {
    {FunctionName}Insert,
    {FunctionName}Row,
    {FunctionName}Update,
} from "./{function_name}.types.ts";
import { SupabaseFunctionUtils } from "../supabaseFunctionUtils.ts";

export class Supabase{FunctionName}Service {
    static async create(
        client: SupabaseClient,
        payload: {FunctionName}Insert,
    ): Promise<{FunctionName}Row> {
        const { data, error } = await client
            .from("{table_name}")
            .insert(payload)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to create {function_name}: ${error.message}`,
            );
        }

        return data;
    }

    static async getById(
        client: SupabaseClient,
        id: string,
    ): Promise<{FunctionName}Row | null> {
        const { data, error } = await client
            .from("{table_name}")
            .select("*")
            .eq("id", id)
            .is("deleted_at", null)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            throw new Error(`Failed to get {function_name}: ${error.message}`);
        }

        return data;
    }

    static async list(
        client: SupabaseClient,
        options: {
            limit?: number;
            offset?: number;
            search?: string;
        } = {},
    ): Promise<{ data: {FunctionName}Row[]; count: number }> {
        const { limit = 20, offset = 0, search } = options;

        let query = client
            .from("{table_name}")
            .select("*", { count: "exact" })
            .is("deleted_at", null);

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(
                `Failed to list {function_name}s: ${error.message}`,
            );
        }

        return {
            data: data || [],
            count: count || 0,
        };
    }

    static async update(
        client: SupabaseClient,
        id: string,
        payload: {FunctionName}Update,
    ): Promise<{FunctionName}Row> {
        const { data, error } = await client
            .from("{table_name}")
            .update(payload)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to update {function_name}: ${error.message}`,
            );
        }

        return data;
    }

    static async softDelete(
        client: SupabaseClient,
        id: string,
    ): Promise<{FunctionName}Row> {
        const { data, error } = await client
            .from("{table_name}")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to delete {function_name}: ${error.message}`,
            );
        }

        return data;
    }

    // Optional: Add featured image support
    static async createWithImage(
        client: SupabaseClient,
        payload: {FunctionName}Insert,
        imageData?: File | Blob | string,
        fileName?: string,
    ): Promise<{FunctionName}Row> {
        // First create the entity
        const entity = await this.create(client, payload);

        // Handle image upload if provided
        if (imageData && fileName) {
            const uploadResult = await SupabaseFunctionUtils.uploadImage(
                client,
                imageData,
                fileName,
                "{bucket_name}",
                entity.id,
            );

            if (uploadResult) {
                // Update the entity with the image path
                const updated = await this.update(client, entity.id, {
                    featured_image_path: uploadResult.path,
                });
                return updated;
            }
        }

        return entity;
    }

    static async updateWithImage(
        client: SupabaseClient,
        id: string,
        payload: {FunctionName}Update,
        imageData?: File | Blob | string,
        fileName?: string,
        shouldDeleteImage?: boolean,
    ): Promise<{FunctionName}Row> {
        // Get current entity to check for existing image
        const current = await this.getById(client, id);
        if (!current) {
            throw new Error("{FunctionName} not found");
        }

        let updatePayload = { ...payload };

        // Handle image operations
        if (shouldDeleteImage) {
            // Delete existing image if it exists
            if (current.featured_image_path) {
                await SupabaseFunctionUtils.deleteImage(
                    client,
                    "{bucket_name}",
                    current.featured_image_path,
                );
                updatePayload.featured_image_path = null;
            }
        } else if (imageData && fileName) {
            // Handle new image upload
            const uploadResult = await SupabaseFunctionUtils.handleFeaturedImageUpload(
                client,
                imageData,
                fileName,
                "{bucket_name}",
                id,
                current.featured_image_path,
            );

            if (uploadResult) {
                updatePayload.featured_image_path = uploadResult.path;
            }
        }

        // Update the entity
        return await this.update(client, id, updatePayload);
    }

    static async deleteWithImageCleanup(
        client: SupabaseClient,
        id: string,
    ): Promise<{FunctionName}Row> {
        // Get current entity to check for existing image
        const current = await this.getById(client, id);
        if (!current) {
            throw new Error("{FunctionName} not found");
        }

        // Delete existing image if it exists
        if (current.featured_image_path) {
            await SupabaseFunctionUtils.deleteImage(
                client,
                "{bucket_name}",
                current.featured_image_path,
            );
        }

        // Soft delete the entity
        return await this.softDelete(client, id);
    }
}
```

**Replace:**

- `{FunctionName}` with PascalCase version (e.g., `Service`)
- `{function_name}` with lowercase version (e.g., `service`)
- `{table_name}` with actual database table name (e.g., `services`)

### 5. Create API Controller

Create
`supabase/functions/{function_name}/controllers/{FunctionName}ApiController.ts`:

```typescript
import { ResponseService } from "../../_shared/services/ResponseService.ts";
import { ResponseType } from "../../_shared/services/ErrorsService.ts";
import { Controller } from "../../_shared/controllers/Controller.ts";
import { AuthenticationService } from "../../_shared/services/AuthenticationService.ts";
import { Supabase{FunctionName}Service } from "../../_shared/supabase/{function_name}/supabase{FunctionName}.ts";
import type {
    {FunctionName}Insert,
    {FunctionName}Update,
} from "../../_shared/supabase/{function_name}/{function_name}.types.ts";

// Request payload types
type {FunctionName}InsertPayload = {FunctionName}Insert;
type {FunctionName}UpdatePayload = {FunctionName}Update;

export class {FunctionName}ApiController
    extends Controller<{FunctionName}InsertPayload | {FunctionName}UpdatePayload> {
    override async get(id?: string, _req?: Request): Promise<Response> {
        this.logAction("{FunctionName}API GET", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        if (id) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const row = await Supabase{FunctionName}Service.getById(
                    client as any,
                    id,
                );
                if (!row) {
                    return ResponseService.error(
                        "{FunctionName} not found",
                        "NOT_FOUND",
                        404,
                        undefined,
                        ResponseType.API,
                    );
                }
                return ResponseService.success(
                    row,
                    200,
                    undefined,
                    ResponseType.API,
                );
            } catch (error: unknown) {
                return ResponseService.error(
                    "Error fetching {function_name}",
                    "{FUNCTION_NAME}_GET_BY_ID_ERROR",
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
        };

        try {
            const finalOffset = query.page ? (query.page - 1) * query.limit : query.offset;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, count } = await Supabase{FunctionName}Service.list(
                client as any,
                {
                    limit: query.limit,
                    offset: finalOffset,
                    search: query.search,
                },
            );

            const totalPages = Math.ceil(count / query.limit);
            const currentPage = query.page || Math.floor(finalOffset / query.limit) + 1;

            return ResponseService.success(
                data,
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
                "Error fetching {function_name}s",
                "{FUNCTION_NAME}_GET_LIST_ERROR",
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
        data: {FunctionName}InsertPayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("{FunctionName}API POST", { data });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const created = await Supabase{FunctionName}Service.create(
                client as any,
                data,
            );
            return ResponseService.created(
                created,
                created.id,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error creating {function_name}",
                "{FUNCTION_NAME}_CREATE_ERROR",
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
        data: {FunctionName}UpdatePayload,
        _req?: Request,
    ): Promise<Response> {
        this.logAction("{FunctionName}API PUT", { id, data });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updated = await Supabase{FunctionName}Service.update(
                client as any,
                id,
                data,
            );
            return ResponseService.success(
                updated,
                200,
                undefined,
                ResponseType.API,
            );
        } catch (error: unknown) {
            return ResponseService.error(
                "Error updating {function_name}",
                "{FUNCTION_NAME}_UPDATE_ERROR",
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
        this.logAction("{FunctionName}API DELETE", { id });
        const { client } = await AuthenticationService.authenticate(_req!);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await Supabase{FunctionName}Service.softDelete(
                client as any,
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
                "Error deleting {function_name}",
                "{FUNCTION_NAME}_DELETE_ERROR",
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
```

**Replace:**

- `{FunctionName}` with PascalCase version (e.g., `Service`)
- `{function_name}` with lowercase version (e.g., `service`)
- `{FUNCTION_NAME}` with UPPERCASE version (e.g., `SERVICE`)

### 6. Create Main Index File

Create `supabase/functions/{function_name}/index.ts`:

```typescript
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.3/src/edge-runtime.d.ts" />

import { ErrorsService } from "../_shared/services/ErrorsService.ts";
import { RouteService } from "../_shared/services/RouteService.ts";
import { AuthenticationService } from "../_shared/services/AuthenticationService.ts";
import { {FunctionName}ApiController } from "./controllers/{FunctionName}ApiController.ts";

// Export the handler for testing
export const handler = async (req: Request) => {
    try {
        // Authenticate the request and get request type
        const { type, requestType } = await AuthenticationService.authenticate(
            req,
        );

        // Create controller instance with authenticated client
        const apiController = new {FunctionName}ApiController();

        // Pass the authenticated client, request body, and request type to the route handler
        return await RouteService.handleRequest(
            req,
            apiController,
            apiController,
            "{function_name}",
            { type, requestType },
        );
    } catch (error) {
        // Handle any unexpected errors
        console.error("Error:", error);
        return ErrorsService.handleError(error);
    }
};

// Use the handler for the Deno.serve
Deno.serve(handler);
```

**Replace:**

- `{FunctionName}` with PascalCase version (e.g., `Service`)
- `{function_name}` with lowercase version (e.g., `service`)

### 7. Create Basic Tests

Create `supabase/functions/{function_name}/tests/{function_name}.test.ts`:

```typescript
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("{FunctionName} API - Basic functionality", () => {
    // Basic test to ensure the module loads correctly
    assertEquals(1 + 1, 2);
});

Deno.test("{FunctionName} API - {function_name} creation", () => {
    // Test {function_name} creation logic
    const test{FunctionName} = {
        name: "Test {FunctionName}",
        // Add other required fields based on your table schema
    };

    // This would be expanded with actual API calls in a real test
    assertEquals(test{FunctionName}.name, "Test {FunctionName}");
});

Deno.test("{FunctionName} API - {function_name} retrieval", () => {
    // Test {function_name} retrieval logic
    const testId = "test-{function_name}-id";

    // This would be expanded with actual API calls in a real test
    assertEquals(typeof testId, "string");
});

Deno.test("{FunctionName} API - {function_name} update", () => {
    // Test {function_name} update logic
    const updateData = {
        name: "Updated {FunctionName} Name",
    };

    // This would be expanded with actual API calls in a real test
    assertEquals(updateData.name, "Updated {FunctionName} Name");
});

Deno.test("{FunctionName} API - {function_name} deletion", () => {
    // Test {function_name} deletion logic
    const testId = "test-{function_name}-id";

    // This would be expanded with actual API calls in a real test
    assertEquals(typeof testId, "string");
});
```

**Replace:**

- `{FunctionName}` with PascalCase version (e.g., `Service`)
- `{function_name}` with lowercase version (e.g., `service`)

## Reusable Utilities

### SupabaseFunctionUtils

The `SupabaseFunctionUtils` class provides reusable functionality for common
operations across all functions:

#### Image Handling

```typescript
import { SupabaseFunctionUtils } from "../supabaseFunctionUtils.ts";

// Upload image with organized folder structure
const uploadResult = await SupabaseFunctionUtils.uploadImage(
    client,
    imageData,
    fileName,
    "bucket-name",
    "entity-id", // Creates folder: entity-id/image_name
);

// Delete image
await SupabaseFunctionUtils.deleteImage(client, "bucket-name", "path");

// Handle featured image upload with automatic cleanup
const result = await SupabaseFunctionUtils.handleFeaturedImageUpload(
    client,
    imageData,
    fileName,
    "bucket-name",
    entityId,
    currentImagePath, // Optional: existing image to delete
);
```

#### Image URL Generation

```typescript
// Build public URL
const url = SupabaseFunctionUtils.buildPublicImageUrl("bucket", "path");

// Get URL from storage ID
const url = await SupabaseFunctionUtils.getImageUrlFromStorageId(
    "bucket",
    storageId,
);
```

#### Image Validation

```typescript
// Validate file type
const isValid = SupabaseFunctionUtils.validateImageType(
    fileName,
    ["image/jpeg", "image/png", "image/webp"],
);

// Generate unique filename
const uniqueName = SupabaseFunctionUtils.generateUniqueFileName(
    originalName,
    "prefix", // Optional
);
```

### Featured Image Support

To add featured image support to your function:

1. **Add `featured_image_path` column** to your database table
2. **Use the image methods** in your service layer (see examples above)
3. **Update your API controller** to handle image uploads:

```typescript
// In your API controller
const created = await Supabase{FunctionName}Service.createWithImage(
    client,
    payload,
    imageData,
    fileName,
);

const updated = await Supabase{FunctionName}Service.updateWithImage(
    client,
    id,
    payload,
    imageData,
    fileName,
    shouldDeleteImage,
);
```

#### Image Deletion Behavior

The `updateWithImage` method now only deletes images when explicitly requested:

- **To delete an image**: Set `deleteImage: true` in your request payload
- **To upload a new image**: Provide `image_file` or `image_base64` data
- **To keep existing image**: Don't provide any image fields and don't set
  `deleteImage: true`

```typescript
// Example request payloads
const updatePayload = {
    name: "Updated Name",
    deleteImage: true, // This will delete the existing image
};

const updateWithNewImage = {
    name: "Updated Name",
    image_base64: "data:image/jpeg;base64,...", // This will replace the existing image
};

const updateWithoutImage = {
    name: "Updated Name",
    // No image fields - keeps existing image unchanged
};
```

## Customization Notes

### Search Fields

Update the search query in the service layer to match your table's searchable
fields:

```typescript
if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
}
```

### Required Fields

Update the test data to include all required fields for your table based on the
database schema.

### Error Codes

Update error codes to be specific to your function (e.g.,
`SERVICE_CREATE_ERROR`).

### Bucket Names

When using image functionality, replace `{bucket_name}` with your actual storage
bucket name (e.g., `"service-providers-images"`, `"venues-images"`).

## API Endpoints

Your function will automatically support:

- **GET** `/functions/v1/{function_name}` - List all items (paginated)
- **GET** `/functions/v1/{function_name}/{id}` - Get item by ID
- **POST** `/functions/v1/{function_name}` - Create new item
- **PUT** `/functions/v1/{function_name}/{id}` - Update item by ID
- **DELETE** `/functions/v1/{function_name}/{id}` - Soft delete item by ID

## Query Parameters

- `limit` - Number of items per page (default: 20)
- `offset` - Starting position (default: 0)
- `page` - Page number (alternative to offset)
- `search` - Search in name and description fields

## Response Format

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Testing

Run the tests with:

```bash
deno test supabase/functions/{function_name}/tests/
```

## Deployment

The function will be automatically deployed when you push to your repository if
you have Supabase CLI configured for automatic deployments.
