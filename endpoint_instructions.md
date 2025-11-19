# Postman Collection Generator Instructions

## Overview
Generate a Postman collection structure for API endpoints based on database schema and controller implementation. Follow the established patterns from the existing "Mommy HAI" collection.

## Input Requirements
Provide:
1. **Database Schema** - The CREATE TABLE statement for the entity
2. **Controller Information** - Details about the API controller and its data interface
3. **Entity Name** - The name of the entity (e.g., "news_categories", "contacts", "users")

## Output Requirements
Generate a JSON structure that can be imported into Postman collections following this exact pattern:

### Collection Structure
```json
{
  "name": "[Entity Name Capitalized]",
  "item": [
    {
      "name": "API",
      "item": [
        // Array of endpoint objects
      ]
    }
  ]
}
```

### Required Endpoints
Generate these 7 endpoints in this exact order:

1. **Get All** - `GET /functions/v1/[entity_name]`
2. **Get by ID** - `GET /functions/v1/[entity_name]/{{[entity]_uuid}}`
3. **Create** - `POST /functions/v1/[entity_name]`
4. **Update** - `PUT /functions/v1/[entity_name]/{{[entity]_uuid}}`
5. **Delete** - `DELETE /functions/v1/[entity_name]/{{[entity]_uuid}}`
6. **Get function status** - `OPTIONS /functions/v1/[entity_name]`
7. **Method not allowed** - `HEAD /functions/v1/[entity_name]`

### Headers Pattern
All requests must include these headers:
```json
[
  {
    "key": "apikey",
    "value": "{{apikey}}",
    "type": "text"
  },
  {
    "key": "Authorization", 
    "value": "Bearer {{token}}",
    "type": "text"
  },
  {
    "key": "Content-Type",
    "value": "application/json", // or " application/json" with leading space for some
    "type": "text"
  },
  {
    "key": "Accept",
    "value": "application/json", // or " application/json" with leading space for some
    "type": "text"
  },
  {
    "key": "x-client-type",
    "value": "api", // or " api" with leading space for some
    "type": "text"
  }
]
```

### Request Body Patterns

#### Create Request Body
- Use actual field names from the database schema
- Provide realistic sample data
- Include all required fields
- Format as raw JSON

#### Update Request Body  
- Use subset of fields that can be updated
- Provide realistic sample data
- Format as raw JSON

#### Other Requests
- GET All: Empty body `""`
- GET by ID: No body
- DELETE: Empty body `""`
- OPTIONS: No body
- HEAD: No body

### Environment Variables
- Use `{{[entity_singular]_uuid}}` for storing entity IDs
- Use `{{url}}` for base API URL
- Use `{{token}}` for authentication token
- Use `{{apikey}}` for API key

### Test Scripts
Include this test script for "Get All" endpoint:
```javascript
"event": [
  {
    "listen": "test",
    "script": {
      "exec": [
        "pm.environment.set(\"[entity_singular]_uuid\", pm.response.json().data[0].id);"
      ],
      "type": "text/javascript",
      "packages": {}
    }
  }
]
```

### URL Structure
- Base: `{{url}}/functions/v1/[entity_name]`
- With ID: `{{url}}/functions/v1/[entity_name]/{{[entity_singular]_uuid}}`
- Path array format: `["functions", "v1", "[entity_name]"]`
- With ID path: `["functions", "v1", "[entity_name]", "{{[entity_singular]_uuid}}"]`

## Field Mapping Rules

### From Database Schema to Request Body:
1. Extract field names (excluding `id`, `created_at`, `deleted_at`)
2. Map database types to appropriate sample values:
   - `character varying` / `varchar` → String samples
   - `text` → Longer string samples
   - `boolean` → true/false
   - `uuid` → Use existing environment variables for foreign keys
   - `timestamp` → Exclude (auto-generated)
   - `integer` / `numeric` → Number samples

### Sample Data Guidelines:
- **Names**: Use realistic person names ("John Doe", "Jane Smith")
- **Emails**: Use example.com domain ("user@example.com")
- **Phone**: Use format "+1234567890"
- **Company**: Use realistic business names
- **Categories**: Use descriptive category names
- **Text fields**: Use meaningful descriptions

## Special Patterns

### Protocol Profile Behavior
Add this to "Get All" requests:
```json
"protocolProfileBehavior": {
  "disableBodyPruning": true
}
```

### Response Handling
- Empty responses: `"response": []`
- All endpoints should have empty response arrays

## Entity Name Conventions
- Collection name: Title Case with spaces ("News Categories")
- URL paths: snake_case ("news_categories")  
- Environment variables: snake_case singular ("[entity]_uuid")
- File names: snake_case ("news_categories")

## Example Usage
Input a schema like:
```sql
create table public.news_categories (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name character varying not null,
  deleted_at timestamp with time zone null
)
```

Output should generate a complete Postman collection structure with appropriate sample data and all 7 endpoints configured correctly.

## Quality Checklist
- [ ] All 7 endpoints included in correct order
- [ ] Headers match the established pattern
- [ ] Environment variables follow naming conventions
- [ ] Sample data is realistic and appropriate
- [ ] URLs use correct path structure
- [ ] Test script included for "Get All" endpoint
- [ ] JSON is properly formatted and valid
- [ ] Request bodies match database schema fields