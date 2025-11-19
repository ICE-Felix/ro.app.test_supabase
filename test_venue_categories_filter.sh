#!/bin/bash

# Test script for venue categories filtering functionality
# This script demonstrates the new parent_id filtering capability

echo "=== Testing Venue Categories API Filtering ==="
echo ""

# Set your Supabase URL and anon key
SUPABASE_URL="https://your-project-id.supabase.co"
ANON_KEY="your-anon-key"

# Base URL for the API
BASE_URL="$SUPABASE_URL/functions/v1/venue_categories"

echo "1. Testing: Get all venue categories (no filter)"
echo "GET $BASE_URL"
echo ""

echo "2. Testing: Get top-level venue categories (parent_id IS NULL)"
echo "GET $BASE_URL?parent_id=is.null"
echo ""

echo "3. Testing: Get venue categories with specific parent_id"
echo "GET $BASE_URL?parent_id=123e4567-e89b-12d3-a456-426614174000"
echo ""

echo "4. Testing: Get venue categories with search term"
echo "GET $BASE_URL?search=food"
echo ""

echo "5. Testing: Get venue categories with pagination"
echo "GET $BASE_URL?limit=5&page=1"
echo ""

echo "6. Testing: Combined filters - top-level categories with search"
echo "GET $BASE_URL?parent_id=is.null&search=restaurant&limit=10"
echo ""

echo "=== Sample curl commands ==="
echo ""

echo "# Get all venue categories:"
echo "curl -X GET '$BASE_URL' \\"
echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

echo "# Get top-level categories only:"
echo "curl -X GET '$BASE_URL?parent_id=is.null' \\"
echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

echo "# Get categories with specific parent:"
echo "curl -X GET '$BASE_URL?parent_id=123e4567-e89b-12d3-a456-426614174000' \\"
echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

echo "# Search in categories:"
echo "curl -X GET '$BASE_URL?search=food&limit=5' \\"
echo "  -H 'Authorization: Bearer $ANON_KEY' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

echo "=== Expected Response Format ==="
echo "{"
echo "  \"data\": ["
echo "    {"
echo "      \"id\": \"uuid\","
echo "      \"name\": \"Category Name\","
echo "      \"parent_id\": null,"
echo "      \"active\": true,"
echo "      \"created_at\": \"2024-01-01T00:00:00Z\","
echo "      \"updated_at\": \"2024-01-01T00:00:00Z\","
echo "      \"deleted_at\": null,"
echo "      \"parent_name\": null"
echo "    }"
echo "  ],"
echo "  \"meta\": {"
echo "    \"pagination\": {"
echo "      \"total\": 10,"
echo "      \"limit\": 20,"
echo "      \"offset\": 0,"
echo "      \"page\": 1,"
echo "      \"totalPages\": 1,"
echo "      \"hasNext\": false,"
echo "      \"hasPrevious\": false"
echo "    },"
echo "    \"filters\": {"
echo "      \"parent_id\": \"is.null\","
echo "      \"search\": null"
echo "    }"
echo "  }"
echo "}"
echo ""

echo "=== Query Parameter Options ==="
echo "• parent_id=is.null         - Get categories where parent_id IS NULL (top-level)"
echo "• parent_id=<uuid>          - Get categories with specific parent_id"
echo "• search=<term>             - Search categories by name (case insensitive)"
echo "• limit=<number>            - Limit results (default: 20, max: 100)"
echo "• offset=<number>           - Skip first N results"
echo "• page=<number>             - Page number (alternative to offset)"
echo ""

echo "=== Filter Combinations ==="
echo "• parent_id=is.null&search=food    - Top-level categories containing 'food'"
echo "• parent_id=<uuid>&limit=5          - First 5 subcategories of parent"
echo "• search=restaurant&page=2          - Second page of restaurant categories"
echo ""

echo "Script completed. Update SUPABASE_URL and ANON_KEY variables to test with your project." 