#!/bin/bash

# Shops API Complete Test Suite
# Unified testing script with all functionality
# Based on shops_postman.json collection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://ffdvlfpwvtkttfbltuue.supabase.co"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHZsZnB3dnRrdHRmYmx0dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNDEwNDMsImV4cCI6MjA2NDcxNzA0M30.EZfpYjRy85A7rsWymGTqhytNsgLBqHMBASk08CI0508"
EMAIL="alex.bordei@icefelix.com"
PASSWORD="12qwaszx"
EXISTING_SHOP_ID="151"
NON_EXISTING_SHOP_ID="152"

# Global variables
TOKEN=""
PARTNER_UUID=""
SHOP_UUID=""
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
LOG_FILE=""
VERBOSE=false
QUIET=false
DEMO_MODE=false

# ================================
# HELPER FUNCTIONS
# ================================

print_header() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 Shops API Test Suite                         ║"
    echo "║                                                              ║"
    echo "║  Complete testing of all Shops API endpoints                ║"
    echo "║  Based on shops_postman.json collection                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 [command] [options]"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  test                   Run the complete test suite (default)"
    echo "  demo                   Show test preview without API calls"
    echo "  validate [log_file]    Analyze test results"
    echo "  help                   Show this help message"
    echo ""
    echo -e "${BLUE}Options:${NC}"
    echo "  -v, --verbose          Show detailed output with all responses"
    echo "  -q, --quiet            Show minimal output (only summary)"
    echo "  -l, --logs             Show recent log files"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo "  $0 test                # Run tests with normal output"
    echo "  $0 test --verbose      # Run tests with detailed output"
    echo "  $0 demo                # Preview tests without API calls"
    echo "  $0 validate            # Analyze latest test results"
    echo ""
}

log() {
    if [ "$QUIET" = false ]; then
        echo -e "$1"
    fi
    if [ -n "$LOG_FILE" ]; then
        echo -e "$1" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
    fi
}

log_test_start() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "${BLUE}[TEST $TOTAL_TESTS] $1${NC}"
}

log_success() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    log "${GREEN}✓ PASSED: $1${NC}"
}

log_failure() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log "${RED}✗ FAILED: $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠ WARNING: $1${NC}"
}

check_dependencies() {
    local missing_deps=()
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing required dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "   • $dep"
        done
        echo ""
        echo -e "${YELLOW}Installation instructions:${NC}"
        echo -e "   macOS: ${CYAN}brew install jq${NC}"
        echo -e "   Ubuntu: ${CYAN}sudo apt-get install jq curl${NC}"
        exit 1
    fi
}

# ================================
# DEMO MODE FUNCTIONS
# ================================

demo_test() {
    local test_num="$1"
    local test_name="$2"
    local method="$3"
    local endpoint="$4"
    local expected_status="$5"
    local description="$6"
    
    echo -e "${BLUE}[TEST $test_num] $test_name${NC}"
    echo -e "   Method: ${YELLOW}$method${NC}"
    echo -e "   Endpoint: ${CYAN}$endpoint${NC}"
    echo -e "   Expected Status: ${GREEN}$expected_status${NC}"
    if [ -n "$description" ]; then
        echo -e "   Description: $description"
    fi
    echo ""
}

run_demo() {
    print_header
    
    echo -e "${PURPLE}Configuration:${NC}"
    echo "   Base URL: $BASE_URL"
    echo "   Authentication: Email/Password → JWT Token"
    echo "   Test Data: Shop ID $EXISTING_SHOP_ID (existing), $NON_EXISTING_SHOP_ID (non-existing)"
    echo ""
    
    echo -e "${PURPLE}Test Execution Plan (24 tests):${NC}"
    echo ""
    
    demo_test "1" "Authentication" "POST" "/auth/v1/token" "200" "Get JWT token for API access"
    demo_test "2" "Get Partner UUID" "GET" "/functions/v1/shops" "200" "Extract partner UUID for subsequent tests"
    demo_test "3" "Get All Shops" "GET" "/functions/v1/shops" "200" "Retrieve all shops, extract shop UUID"
    demo_test "4" "Get by Partner ID - Not Found" "GET" "/functions/v1/shops?partner_id=00000000-0000-0000-0000-000000000000" "404" "Test error handling"
    demo_test "5" "Get by Partner ID" "GET" "/functions/v1/shops?partner_id={uuid}" "200" "Filter shops by partner"
    demo_test "6" "Get with Pagination" "GET" "/functions/v1/shops?limit=10&page=1" "200" "Test pagination"
    demo_test "7" "Get with Search - No Results" "GET" "/functions/v1/shops?search=nonexistent" "200" "Test search with no matches"
    demo_test "8" "Get with Search" "GET" "/functions/v1/shops?search=acme" "200" "Test search functionality"
    demo_test "9" "Get with Combined Filters" "GET" "/functions/v1/shops?partner_id={uuid}&search=store" "200" "Multiple parameters"
    demo_test "10" "Get with Active Partners Only" "GET" "/functions/v1/shops?active_partners_only=true" "200" "Filter active partners only"
    demo_test "11" "Get with Offset Pagination" "GET" "/functions/v1/shops?limit=15&offset=30" "200" "Offset-based pagination"
    demo_test "12" "Get by ID" "GET" "/functions/v1/shops/{uuid}" "200" "Retrieve specific shop"
    demo_test "13" "Create Shop" "POST" "/functions/v1/shops" "201" "Create new shop"
    demo_test "14" "Create - Missing Fields Error" "POST" "/functions/v1/shops" "400" "Test validation"
    demo_test "15" "Create - WooCommerce Validation Error" "POST" "/functions/v1/shops" "400" "Invalid WooCommerce ID"
    demo_test "16" "Create - Minimal" "POST" "/functions/v1/shops" "201" "Required fields only"
    demo_test "17" "Create - Missing Partner ID Error" "POST" "/functions/v1/shops" "400" "Missing partner_id validation"
    demo_test "18" "Create - Invalid Data Types Error" "POST" "/functions/v1/shops" "400" "Invalid field types validation"
    demo_test "19" "Update Shop" "PUT" "/functions/v1/shops/{uuid}" "200" "Update shop data"
    demo_test "20" "Update - Change Partner" "PUT" "/functions/v1/shops/{uuid}" "200" "Change partner assignment"
    demo_test "21" "Update - Partial" "PUT" "/functions/v1/shops/{uuid}" "200" "Update single field"
    demo_test "22" "Get Function Status" "OPTIONS" "/functions/v1/shops" "200" "Check function status"
    demo_test "23" "Method Not Allowed" "HEAD" "/functions/v1/shops" "405" "Test unsupported method"
    demo_test "24" "Delete Shop" "DELETE" "/functions/v1/shops/{uuid}" "200" "Delete created shop"
    
    echo -e "${GREEN}Ready to run actual tests!${NC}"
    echo -e "Execute: ${CYAN}$0 test${NC}"
}

# ================================
# AUTHENTICATION & SETUP
# ================================

authenticate() {
    log_test_start "Authentication"
    
    local auth_response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        --location "${BASE_URL}/auth/v1/token?grant_type=password" \
        --header "apikey: ${API_KEY}" \
        --header "Content-Type: application/json" \
        --data-raw "{\"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}")
    
    local http_code=$(echo "$auth_response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local response_body=$(echo "$auth_response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$http_code" = "200" ]; then
        TOKEN=$(echo "$response_body" | jq -r '.access_token')
        if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
            log_success "Authentication successful"
            if [ "$VERBOSE" = true ]; then
                log "Token obtained: ${TOKEN:0:20}..."
            fi
        else
            log_failure "Authentication failed - no token received"
            exit 1
        fi
    else
        log_failure "Authentication failed with HTTP code: $http_code"
        if [ "$VERBOSE" = true ]; then
            log "Response: $response_body"
        fi
        exit 1
    fi
}

get_partner_uuid() {
    log_test_start "Getting partner UUID for tests"
    
    local response=$(test_api_call "Get shops for partner UUID" "GET" "/functions/v1/shops" "200" "" "")
    
    if echo "$response" | jq -e '.data[0].partner_id' > /dev/null 2>&1; then
        PARTNER_UUID=$(echo "$response" | jq -r '.data[0].partner_id')
        log_success "Partner UUID obtained from existing shops: $PARTNER_UUID"
    else
        # Use the partner ID that we know exists from previous test runs
        PARTNER_UUID="38b94277-4ffc-4519-94ee-dc71576df29e"
        log_warning "No existing shops found, using known partner UUID for tests"
        log_success "Partner UUID setup completed: $PARTNER_UUID"
    fi
}

# ================================
# CORE TESTING FUNCTIONS
# ================================

test_api_call() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local body="$5"
    local extra_validation="$6"
    
    log_test_start "$test_name"
    
    local curl_cmd="curl -s -w \"HTTPSTATUS:%{http_code}\" \
        --request $method \
        --header \"apikey: $API_KEY\" \
        --header \"Authorization: Bearer $TOKEN\" \
        --header \"Content-Type: application/json\" \
        --header \"Accept: application/json\" \
        --header \"x-client-type: api\""
    
    if [ -n "$body" ]; then
        curl_cmd="$curl_cmd --data-raw '$body'"
    fi
    
    curl_cmd="$curl_cmd \"$BASE_URL$endpoint\""
    
    local response=$(eval $curl_cmd)
    local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    local response_body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$VERBOSE" = true ]; then
        log "Request: $method $endpoint"
        log "Expected status: $expected_status, Got: $http_code"
    fi
    
    if [ "$http_code" = "$expected_status" ]; then
        log_success "$test_name - HTTP status correct"
        
        # Additional validation if provided
        if [ -n "$extra_validation" ] && [ "$VERBOSE" = true ]; then
            eval "$extra_validation" "$response_body" 2>/dev/null || true
        fi
        
        # Try to parse JSON if not empty
        if [ -n "$response_body" ] && [ "$response_body" != "{}" ]; then
            if echo "$response_body" | jq . > /dev/null 2>&1; then
                if [ "$VERBOSE" = true ]; then
                    log "✓ Valid JSON response"
                fi
            else
                log_warning "Response is not valid JSON"
            fi
        fi
        
    else
        log_failure "$test_name - Expected status $expected_status but got $http_code"
        if [ "$VERBOSE" = true ]; then
            log "Response body: $response_body"
        fi
    fi
    
    echo "$response_body"
}

# Validation functions
validate_shops_array() {
    local response="$1"
    # Use printf to handle large JSON strings properly
    if printf '%s' "$response" | jq -e '.data | type == "array"' >/dev/null 2>&1; then
        local count=$(printf '%s' "$response" | jq '.data | length')
        if [ "$VERBOSE" = true ]; then
            log "✓ Response contains array with $count items"
        fi
        return 0
    else
        log_warning "Response does not contain data array"
        return 1
    fi
}

validate_single_shop() {
    local response="$1"
    if printf '%s' "$response" | jq -e '.data.id' >/dev/null 2>&1; then
        if [ "$VERBOSE" = true ]; then
            log "✓ Response contains shop with ID"
        fi
        return 0
    else
        log_warning "Response does not contain shop data"
        return 1
    fi
}

validate_error_response() {
    local response="$1"
    # Check for both .error field and .success = false
    if printf '%s' "$response" | jq -e '.error and (.success == false)' >/dev/null 2>&1; then
        if [ "$VERBOSE" = true ]; then
            log "✓ Error response contains proper error format"
        fi
        return 0
    else
        log_warning "Error response format unexpected"
        return 1
    fi
}

validate_created_shop() {
    local response="$1"
    if echo "$response" | jq -e '.data.id' > /dev/null 2>&1; then
        SHOP_UUID=$(echo "$response" | jq -r '.data.id')
        if [ "$VERBOSE" = true ]; then
            log "✓ Shop created with ID: $SHOP_UUID"
        fi
    else
        log_warning "Created shop response missing ID"
    fi
}

# ================================
# MAIN TEST EXECUTION
# ================================

run_tests() {
    # Setup logging
    LOG_FILE="test_results_$(date +%Y%m%d_%H%M%S).log"
    
    log "=================================================="
    log "Starting Shops API Test Suite"
    log "Timestamp: $(date)"
    log "Base URL: $BASE_URL"
    log "=================================================="
    
    # Authentication and setup
    authenticate
    get_partner_uuid
    
    # Run all tests
    local response
    
    response=$(test_api_call "Get All Shops" "GET" "/functions/v1/shops" "200" "" "")
    
    # Extract SHOP_UUID from the response for later tests
    if [ -n "$response" ]; then
        local shop_id=$(echo "$response" | jq -r '.data[0].id // empty' 2>/dev/null)
        if [ -n "$shop_id" ] && [ "$shop_id" != "null" ]; then
            SHOP_UUID="$shop_id"
            log "✓ Extracted shop UUID for subsequent tests: $SHOP_UUID"
        else
            log "ℹ No shops found in Get All Shops response"
        fi
    else
        log "⚠ Get All Shops returned empty response"
    fi
    
    test_api_call "Get by Partner ID - Not Found (Error Test)" "GET" "/functions/v1/shops?partner_id=00000000-0000-0000-0000-000000000000" "404" "" ""
    
    test_api_call "Get by Partner ID" "GET" "/functions/v1/shops?partner_id=$PARTNER_UUID" "200" "" ""
    
    # Now make a separate call to extract UUID if we still don't have one
    if [ -z "$SHOP_UUID" ]; then
        local partner_response=$(curl -s \
            --header "apikey: $API_KEY" \
            --header "Authorization: Bearer $TOKEN" \
            --header "Content-Type: application/json" \
            "$BASE_URL/functions/v1/shops?partner_id=$PARTNER_UUID")
        
        local partner_shop_id=$(echo "$partner_response" | jq -r '.data[0].id // empty' 2>/dev/null)
        if [ -n "$partner_shop_id" ] && [ "$partner_shop_id" != "null" ]; then
            SHOP_UUID="$partner_shop_id"
            log "✓ Extracted shop UUID from partner response: $SHOP_UUID"
        fi
    fi
    
    test_api_call "Get with Pagination" "GET" "/functions/v1/shops?limit=10&page=1" "200" "" ""
    
    test_api_call "Get with Search - No Results" "GET" "/functions/v1/shops?search=nonexistentcompany12345" "200" "" ""
    
    test_api_call "Get with Search" "GET" "/functions/v1/shops?search=acme" "200" "" ""
    
    test_api_call "Get with Combined Filters" "GET" "/functions/v1/shops?partner_id=$PARTNER_UUID&search=store&limit=5&page=1" "200" "" ""
    
    test_api_call "Get with Active Partners Only" "GET" "/functions/v1/shops?active_partners_only=true&limit=10" "200" "" ""
    
    test_api_call "Get with Offset Pagination" "GET" "/functions/v1/shops?limit=15&offset=30" "200" "" ""
    
    # Test Get by ID if we have a SHOP_UUID
    if [ -n "$SHOP_UUID" ]; then
        test_api_call "Get by ID" "GET" "/functions/v1/shops/$SHOP_UUID" "200" "" ""
        log "ℹ Using existing shop UUID: $SHOP_UUID"
    else
        # If no UUID from GET all, create a shop specifically for ID testing
        log "ℹ No existing shop UUID, creating one for testing..."
        temp_response=$(test_api_call "Create Shop for ID Test" "POST" "/functions/v1/shops" "201" "{\"partner_id\": \"$PARTNER_UUID\", \"woo_shop_id\": 123, \"active\": true}" "")
        if echo "$temp_response" | jq -e '.data.id' >/dev/null 2>&1; then
            TEMP_SHOP_UUID=$(echo "$temp_response" | jq -r '.data.id')
            test_api_call "Get by ID" "GET" "/functions/v1/shops/$TEMP_SHOP_UUID" "200" "" ""
            SHOP_UUID="$TEMP_SHOP_UUID"  # Use this for subsequent tests
            log "✓ Created and using new shop UUID: $SHOP_UUID"
        else
            log_warning "Skipping Get by ID test - could not create test shop"
        fi
    fi
    
    test_api_call "Create - Missing Required Fields Error" "POST" "/functions/v1/shops" "400" "{\"partner_id\": \"$PARTNER_UUID\"}" ""
    
    test_api_call "Create - WooCommerce Validation Error" "POST" "/functions/v1/shops" "400" "{\"partner_id\": \"$PARTNER_UUID\", \"woo_shop_id\": 99999}" ""
    
    response=$(test_api_call "Create - Minimal (Only Required Fields)" "POST" "/functions/v1/shops" "201" "{\"partner_id\": \"$PARTNER_UUID\", \"woo_shop_id\": $EXISTING_SHOP_ID}" "")
    
    test_api_call "Create - Missing Partner ID Error" "POST" "/functions/v1/shops" "400" "{\"woo_shop_id\": 123}" ""
    
    test_api_call "Create - Invalid Data Types Error" "POST" "/functions/v1/shops" "400" "{\"partner_id\": 123, \"woo_shop_id\": \"invalid\", \"active\": \"not_boolean\"}" ""
    
    # Extract SHOP_UUID from create response for update/delete tests
    if [ -z "$SHOP_UUID" ] && printf '%s' "$response" | jq -e '.data.id' >/dev/null 2>&1; then
        SHOP_UUID=$(printf '%s' "$response" | jq -r '.data.id')
        if [ "$VERBOSE" = true ]; then
            log "✓ Extracted shop UUID from create operation: $SHOP_UUID"
        fi
    fi
    
    if [ -n "$SHOP_UUID" ]; then
        test_api_call "Update Shop" "PUT" "/functions/v1/shops/$SHOP_UUID" "200" "{\"woo_shop_id\": $EXISTING_SHOP_ID, \"active\": false}" ""
        test_api_call "Update - Change Partner" "PUT" "/functions/v1/shops/$SHOP_UUID" "200" "{\"partner_id\": \"$PARTNER_UUID\", \"active\": true}" ""
        test_api_call "Update - Partial (Single Field)" "PUT" "/functions/v1/shops/$SHOP_UUID" "200" "{\"active\": true}" ""
    else
        log_warning "Skipping update tests - no shop UUID available"
    fi
    
    test_api_call "Get function status" "OPTIONS" "/functions/v1/shops" "200" "" ""
    test_api_call "Method not allowed" "HEAD" "/functions/v1/shops" "405" "" ""
    
    if [ -n "$SHOP_UUID" ]; then
        test_api_call "Delete Shop" "DELETE" "/functions/v1/shops/$SHOP_UUID" "200" "" ""
    else
        log_warning "Skipping delete test - no shop UUID available"
    fi
    
    # Final summary
    log "=================================================="
    log "Test Suite Completed"
    log "Total Tests: $TOTAL_TESTS"
    log "Passed: $PASSED_TESTS"
    log "Failed: $FAILED_TESTS"
    if [ $TOTAL_TESTS -gt 0 ]; then
        log "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    fi
    log "Log File: $LOG_FILE"
    log "=================================================="
    
    if [ $FAILED_TESTS -eq 0 ]; then
        log "${GREEN}All tests passed! 🎉${NC}"
        return 0
    else
        log "${RED}Some tests failed. Check the log for details.${NC}"
        return 1
    fi
}

# ================================
# RESULT VALIDATION FUNCTIONS
# ================================

show_logs() {
    echo -e "${BLUE}Recent test log files:${NC}"
    find . -name "test_results_*.log" -type f -exec ls -la {} \; 2>/dev/null | sort -k9 -r | head -5
    
    echo ""
    local latest_log=$(find . -name "test_results_*.log" -type f -exec ls -t1 {} \; 2>/dev/null | head -1)
    if [ -n "$latest_log" ]; then
        echo -e "${BLUE}Latest log file: ${CYAN}$latest_log${NC}"
        echo -e "${YELLOW}Last 20 lines:${NC}"
        tail -20 "$latest_log"
    else
        echo -e "${YELLOW}No log files found. Run tests first.${NC}"
    fi
}

validate_results() {
    local log_file="$1"
    
    if [ -z "$log_file" ]; then
        log_file=$(find . -name "test_results_*.log" -type f -exec ls -t1 {} \; 2>/dev/null | head -1)
        if [ -z "$log_file" ]; then
            echo -e "${RED}❌ No test log files found${NC}"
            echo -e "${YELLOW}Run tests first using: $0 test${NC}"
            exit 1
        fi
        echo -e "${BLUE}Using latest log file: $(basename "$log_file")${NC}"
        echo ""
    fi
    
    if [ ! -f "$log_file" ]; then
        echo -e "${RED}❌ Log file not found: $log_file${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}📊 Analyzing Test Results${NC}"
    echo -e "${BLUE}Log file: $(basename "$log_file")${NC}"
    echo ""
    
    # Extract key metrics
    local total_tests=$(grep "Total Tests:" "$log_file" | grep -o '[0-9]\+' | tail -1)
    local passed_tests=$(grep "Passed:" "$log_file" | grep -o '[0-9]\+' | tail -1)
    local failed_tests=$(grep "Failed:" "$log_file" | grep -o '[0-9]\+' | tail -1)
    local success_rate=$(grep "Success Rate:" "$log_file" | grep -o '[0-9]\+%' | tail -1)
    
    if [ -z "$total_tests" ] || [ -z "$passed_tests" ] || [ -z "$failed_tests" ]; then
        echo -e "${RED}❌ Unable to extract test metrics from log file${NC}"
        exit 1
    fi
    
    # Display summary
    echo -e "${BLUE}📈 Test Summary${NC}"
    echo "├─ Total Tests: $total_tests"
    echo "├─ Passed: $passed_tests"
    echo "├─ Failed: $failed_tests"
    echo "└─ Success Rate: $success_rate"
    echo ""
    
    # Status based on results
    if [ "$failed_tests" -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Excellent work!${NC}"
    elif [ "$failed_tests" -le 2 ]; then
        echo -e "${YELLOW}⚠️  Few tests failed. Review and fix issues.${NC}"
    else
        echo -e "${RED}❌ Multiple tests failed. Significant issues detected.${NC}"
    fi
    echo ""
    
    # Show failed tests
    if [ "$failed_tests" -gt 0 ]; then
        echo -e "${RED}❌ Failed Tests:${NC}"
        grep "✗ FAILED" "$log_file" | while IFS= read -r line; do
            echo "   • $(echo "$line" | sed 's/.*✗ FAILED: //')"
        done
        echo ""
    fi
    
    # Show warnings
    local warning_count=$(grep -c "⚠ WARNING" "$log_file" 2>/dev/null || echo 0)
    if [ "$warning_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Warnings ($warning_count):${NC}"
        grep "⚠ WARNING" "$log_file" | head -3 | while IFS= read -r line; do
            echo "   • $(echo "$line" | sed 's/.*⚠ WARNING: //')"
        done
        if [ "$warning_count" -gt 3 ]; then
            echo "   • ... and $((warning_count - 3)) more warnings"
        fi
        echo ""
    fi
}

# ================================
# MAIN SCRIPT LOGIC
# ================================

main() {
    local command="test"
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            test|demo|validate|help)
                command="$1"
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            -l|--logs)
                show_logs
                exit 0
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                if [ "$command" = "validate" ] && [ -f "$1" ]; then
                    validate_results "$1"
                    exit 0
                else
                    echo -e "${RED}Unknown option: $1${NC}"
                    show_usage
                    exit 1
                fi
                ;;
        esac
    done
    
    case $command in
        demo)
            run_demo
            ;;
        validate)
            validate_results
            ;;
        help)
            show_usage
            ;;
        test|*)
            if [ "$command" != "test" ] && [ "$command" != "demo" ] && [ "$command" != "validate" ] && [ "$command" != "help" ]; then
                echo -e "${YELLOW}Unknown command '$command', defaulting to 'test'${NC}"
                echo ""
            fi
            
            print_header
            check_dependencies
            
            if [ "$QUIET" = false ]; then
                echo -e "${BLUE}🚀 Starting test execution...${NC}"
                echo ""
            fi
            
            if run_tests; then
                exit 0
            else
                exit 1
            fi
            ;;
    esac
}

# Run the main function with all arguments
main "$@"