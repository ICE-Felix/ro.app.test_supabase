#!/bin/bash

# Postman Collection Import Script
# Usage: ./import-to-postman.sh [API_KEY] [COLLECTION_FILE]

API_KEY=${1:-$POSTMAN_API_KEY}
COLLECTION_FILE=${2:-"supabase/functions/venue_categories/postman/venue_categories_postman.json"}

if [ -z "$API_KEY" ]; then
    echo "❌ Error: Postman API key required"
    echo "Usage: ./import-to-postman.sh YOUR_API_KEY [collection_file]"
    echo "Or set POSTMAN_API_KEY environment variable"
    exit 1
fi

if [ ! -f "$COLLECTION_FILE" ]; then
    echo "❌ Error: Collection file not found: $COLLECTION_FILE"
    exit 1
fi

echo "🚀 Importing collection to Postman..."
echo "📁 File: $COLLECTION_FILE"

# Import collection
response=$(curl -s -X POST \
  https://api.getpostman.com/collections \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @"$COLLECTION_FILE")

# Check if successful
if echo "$response" | grep -q '"collection"'; then
    collection_id=$(echo "$response" | grep -o '"uid":"[^"]*' | cut -d'"' -f4)
    echo "✅ Successfully imported collection!"
    echo "🆔 Collection ID: $collection_id"
    echo "🌐 View in Postman: https://web.postman.co/workspace/~/collection/$collection_id"
else
    echo "❌ Import failed:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
fi
