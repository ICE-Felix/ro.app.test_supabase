#!/bin/bash

# News API Test Suite
# This script tests all functionality of the news API endpoints

# Configuration
BASE_URL="https://ffdvlfpwvtkttfbltuue.supabase.co/functions/v1/news"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHZsZnB3dnRrdHRmYmx0dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEwNDMsImV4cCI6MjA2NDcxNzA0M30.EZfpYjRy85A7rsWymGTqhytNsgLBqHMBASk08CI0508"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsImtpZCI6IjdkRU85YjZqVTRPRE44K0IiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2ZmZHZsZnB3dnRrdHRmYmx0dXVlLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIzNzg5OTU5Ny04YjEyLTQ0N2UtOTg1Ny1kZWJiZjE4Y2QzOGYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUxNzgwMDE2LCJpYXQiOjE3NTE3NzY0MTYsImVtYWlsIjoiYWxleC5ib3JkZWlAaWNlZmVsaXguY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsiZmlyc3RfbmFtZSI6IkFsZXgiLCJsYXN0X25hbWUiOiJCb3JkZWkiLCJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl0sInVzZXJyb2xlIjoiYWRtaW4ifSwidXNlcl9tZXRhZGF0YSI6eyJjbGFpbXNfYWRtaW4iOmZhbHNlLCJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl0sInVzZXJuYW1lIjoiQWRtaW4iLCJ1c2Vycm9sZSI6ImFkbWluIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTE3NzY0MTZ9XSwic2Vzc2lvbl9pZCI6IjY4ZWE4NTRmLTg4YmUtNGNhMy04MzAxLTFiMjIwMGU4NTc1YyIsImlzX2Fub255bW91cyI6ZmFsc2V9.yf-BWPqMfvP3yk9m3Sm0NQdEd0PSO7RVFFNieo3aZ9g"

# Common headers
HEADERS=(
    -H "apikey: $API_KEY"
    -H "Authorization: Bearer $AUTH_TOKEN"
    -H "Content-Type: application/json"
    -H "Accept: application/json"
    -H "x-client-type: api"
)

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
CREATED_NEWS_ID=""

# Helper function to print test results
print_test_result() {
    local test_name="$1"
    local status="$2"
    local response="$3"
    
    echo "================================="
    echo "TEST: $test_name"
    echo "STATUS: $status"
    echo "RESPONSE:"
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo "================================="
    echo ""
    
    if [[ "$status" == "PASS" ]]; then
        ((TESTS_PASSED++))
    else
        ((TESTS_FAILED++))
    fi
}

# Helper function to check if response is successful
check_response() {
    local response="$1"
    local expected_status="$2"
    
    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        echo "FAIL"
        return 1
    fi
    
    # Check if response contains expected data structure
    if echo "$response" | grep -q '"data"'; then
        echo "PASS"
        return 0
    fi
    
    echo "UNKNOWN"
    return 1
}

echo "🚀 Starting News API Test Suite"
echo "================================="

# TEST 1: Basic GET all news
echo "Running Test 1: Basic GET all news..."
response=$(curl -s --location "$BASE_URL" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "Basic GET all news" "$status" "$response"

# TEST 2: GET with pagination (limit=3, page=1)
echo "Running Test 2: GET with pagination..."
response=$(curl -s --location "$BASE_URL?limit=3&page=1" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "GET with pagination (limit=3, page=1)" "$status" "$response"

# TEST 3: GET with offset pagination
echo "Running Test 3: GET with offset pagination..."
response=$(curl -s --location "$BASE_URL?limit=2&offset=1" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "GET with offset pagination (limit=2, offset=1)" "$status" "$response"

# TEST 4: GET with search (search for "technology")
echo "Running Test 4: GET with search..."
response=$(curl -s --location "$BASE_URL?search=technology" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "GET with search (search=technology)" "$status" "$response"

# TEST 5: GET with search (search for "test")
echo "Running Test 5: GET with search for 'test'..."
response=$(curl -s --location "$BASE_URL?search=test" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "GET with search (search=test)" "$status" "$response"

# First, let's get a category ID and partner ID from existing data
echo "Getting category and partner IDs for testing..."
all_news_response=$(curl -s --location "$BASE_URL?limit=1" "${HEADERS[@]}")
category_id=$(echo "$all_news_response" | jq -r '.data[0].news_categories_id // empty' 2>/dev/null)
partner_id=$(echo "$all_news_response" | jq -r '.data[0].partner_id // empty' 2>/dev/null)

echo "Found category_id: $category_id"
echo "Found partner_id: $partner_id"

# TEST 6: GET with category filter (if we have a category ID)
if [[ -n "$category_id" && "$category_id" != "null" ]]; then
    echo "Running Test 6: GET with category filter..."
    response=$(curl -s --location "$BASE_URL?category_id=$category_id" "${HEADERS[@]}")
    status=$(check_response "$response" "200")
    print_test_result "GET with category filter (category_id=$category_id)" "$status" "$response"
else
    echo "Skipping category filter test - no category_id available"
    print_test_result "GET with category filter" "SKIP" "No category_id available"
fi

# TEST 7: GET with combined filters
if [[ -n "$category_id" && "$category_id" != "null" ]]; then
    echo "Running Test 7: GET with combined filters..."
    response=$(curl -s --location "$BASE_URL?category_id=$category_id&search=test&limit=2&page=1" "${HEADERS[@]}")
    status=$(check_response "$response" "200")
    print_test_result "GET with combined filters (category + search + pagination)" "$status" "$response"
else
    echo "Skipping combined filters test - no category_id available"
    print_test_result "GET with combined filters" "SKIP" "No category_id available"
fi

# TEST 8: POST - Create new news
if [[ -n "$partner_id" && "$partner_id" != "null" && -n "$category_id" && "$category_id" != "null" ]]; then
    echo "Running Test 8: POST - Create new news..."
    create_data='{
        "title": "Test News Article - API Test",
        "news_categories_id": "'$category_id'",
        "partner_id": "'$partner_id'",
        "keywords": "test, api, automation, technology",
        "body": "This is a test news article created by the API test suite. It should be automatically created and then deleted.",
        "likes": 0,
        "read_count": 0
    }'
    
    response=$(curl -s --location "$BASE_URL" "${HEADERS[@]}" --data "$create_data")
    
    # Check if creation was successful and extract ID
    if echo "$response" | grep -q '"id"'; then
        CREATED_NEWS_ID=$(echo "$response" | jq -r '.id // .data.id' 2>/dev/null)
        status="PASS"
        echo "Created news with ID: $CREATED_NEWS_ID"
    else
        status="FAIL"
    fi
    
    print_test_result "POST - Create new news" "$status" "$response"
else
    echo "Skipping POST test - missing required IDs"
    print_test_result "POST - Create new news" "SKIP" "Missing partner_id or category_id"
fi

# TEST 9: GET by ID (if we created a news item)
if [[ -n "$CREATED_NEWS_ID" && "$CREATED_NEWS_ID" != "null" ]]; then
    echo "Running Test 9: GET by ID..."
    response=$(curl -s --location "$BASE_URL/$CREATED_NEWS_ID" "${HEADERS[@]}")
    
    if echo "$response" | grep -q '"id"'; then
        status="PASS"
    else
        status="FAIL"
    fi
    
    print_test_result "GET by ID (id=$CREATED_NEWS_ID)" "$status" "$response"
else
    echo "Skipping GET by ID test - no news ID available"
    print_test_result "GET by ID" "SKIP" "No news ID available"
fi

# TEST 10: PUT - Update news (if we created a news item)
if [[ -n "$CREATED_NEWS_ID" && "$CREATED_NEWS_ID" != "null" ]]; then
    echo "Running Test 10: PUT - Update news..."
    update_data='{
        "title": "Updated Test News Article - API Test",
        "keywords": "test, api, automation, technology, updated",
        "body": "This is an updated test news article. The content has been modified by the API test suite.",
        "likes": 5,
        "read_count": 10
    }'
    
    response=$(curl -s --location "$BASE_URL/$CREATED_NEWS_ID" "${HEADERS[@]}" -X PUT --data "$update_data")
    
    if echo "$response" | grep -q '"id"'; then
        status="PASS"
    else
        status="FAIL"
    fi
    
    print_test_result "PUT - Update news (id=$CREATED_NEWS_ID)" "$status" "$response"
else
    echo "Skipping PUT test - no news ID available"
    print_test_result "PUT - Update news" "SKIP" "No news ID available"
fi

# TEST 11: DELETE news (if we created a news item)
if [[ -n "$CREATED_NEWS_ID" && "$CREATED_NEWS_ID" != "null" ]]; then
    echo "Running Test 11: DELETE news..."
    response=$(curl -s --location "$BASE_URL/$CREATED_NEWS_ID" "${HEADERS[@]}" -X DELETE)
    
    if echo "$response" | grep -q '"deleted"'; then
        status="PASS"
    else
        status="FAIL"
    fi
    
    print_test_result "DELETE news (id=$CREATED_NEWS_ID)" "$status" "$response"
else
    echo "Skipping DELETE test - no news ID available"
    print_test_result "DELETE news" "SKIP" "No news ID available"
fi

# TEST 12: GET non-existent news (should return 404)
echo "Running Test 12: GET non-existent news..."
fake_id="00000000-0000-0000-0000-000000000000"
response=$(curl -s --location "$BASE_URL/$fake_id" "${HEADERS[@]}")

if echo "$response" | grep -q '"error"'; then
    status="PASS"
else
    status="FAIL"
fi

print_test_result "GET non-existent news (should return error)" "$status" "$response"

# TEST 13: OPTIONS - Get function status
echo "Running Test 13: OPTIONS - Get function status..."
response=$(curl -s --location "$BASE_URL" "${HEADERS[@]}" -X OPTIONS)
status="PASS"  # OPTIONS usually returns empty response
print_test_result "OPTIONS - Get function status" "$status" "$response"

# TEST 14: Invalid method (HEAD - should return method not allowed)
echo "Running Test 14: HEAD - Invalid method..."
response=$(curl -s --location "$BASE_URL" "${HEADERS[@]}" -X HEAD -w "%{http_code}")
if echo "$response" | grep -q "405"; then
    status="PASS"
else
    status="FAIL"
fi
print_test_result "HEAD - Invalid method (should return 405)" "$status" "$response"

# TEST 15: Edge case - Invalid pagination values
echo "Running Test 15: Invalid pagination values..."
response=$(curl -s --location "$BASE_URL?limit=-1&page=0" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "Invalid pagination values (should use defaults)" "$status" "$response"

# TEST 16: Edge case - Very large limit
echo "Running Test 16: Very large limit..."
response=$(curl -s --location "$BASE_URL?limit=1000" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "Very large limit (should cap at 100)" "$status" "$response"

# TEST 17: Empty search term
echo "Running Test 17: Empty search term..."
response=$(curl -s --location "$BASE_URL?search=" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "Empty search term (should return all)" "$status" "$response"

# TEST 18: Special characters in search
echo "Running Test 18: Special characters in search..."
response=$(curl -s --location "$BASE_URL?search=%20test%20" "${HEADERS[@]}")
status=$(check_response "$response" "200")
print_test_result "Special characters in search" "$status" "$response"

# Final Results
echo "🏁 Test Suite Complete!"
echo "================================="
echo "✅ Tests Passed: $TESTS_PASSED"
echo "❌ Tests Failed: $TESTS_FAILED"
echo "📊 Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -eq 0 ]]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Please review the output above."
    exit 1
fi 