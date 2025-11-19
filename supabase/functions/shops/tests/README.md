# Shops API Test Suite

This test suite validates all endpoints from the Shops API based on the Postman collection.

**Location**: `supabase/functions/shops/tests/`
**Postman Collection**: `../shops_postman.json`

## Prerequisites

1. **curl** - for making HTTP requests
2. **jq** - for JSON parsing
   - macOS: `brew install jq`
   - Ubuntu: `apt-get install jq`

## Test Configuration

The script is configured with:
- **Base URL**: `https://ffdvlfpwvtkttfbltuue.supabase.co`
- **Authentication**: Uses email/password authentication
- **Test Data**: 
  - Existing shop ID: 151
  - Non-existing shop ID: 152

## Running Tests

### Basic Usage
```bash
./test_shops_api.sh
```

### View Results
Test results are saved to timestamped log files in the same directory:
```bash
# View the latest test results
cat test_results_*.log | tail -50

# View all log files
ls -la test_results_*.log
```

## Test Coverage

The script tests all endpoints from the Postman collection:

### GET Endpoints
- ✅ Get All Shops
- ✅ Get by Partner ID (success & error cases)
- ✅ Get with Pagination
- ✅ Get with Search (success & error cases)
- ✅ Get with Combined Filters  
- ✅ Get with Offset Pagination
- ✅ Get by ID

### POST Endpoints
- ✅ Create Shop (success)
- ✅ Create with Missing Fields (error)
- ✅ Create with Invalid WooCommerce ID (error)
- ✅ Create Minimal (only required fields)

### PUT Endpoints
- ✅ Update Shop
- ✅ Update Partner Assignment
- ✅ Partial Update (single field)

### DELETE Endpoints
- ✅ Delete Shop

### Other Endpoints
- ✅ OPTIONS (function status)
- ✅ HEAD (method not allowed test)

## Test Validations

Each test validates:
1. **HTTP Status Code** - Expected vs actual response codes
2. **JSON Structure** - Valid JSON parsing
3. **Response Data** - Presence of required fields
4. **Error Handling** - Proper error responses for invalid requests

## Output Format

- 🟢 **Green**: Passed tests
- 🔴 **Red**: Failed tests  
- 🟡 **Yellow**: Warnings
- 🔵 **Blue**: Test execution info

## Example Output

```
==================================================
Starting Shops API Test Suite
Timestamp: 2024-01-15 14:30:00
Base URL: https://ffdvlfpwvtkttfbltuue.supabase.co
==================================================

[TEST 1] Authentication
✓ PASSED: Authentication successful
Token obtained: eyJhbGciOiJIUzI1NiIs...

[TEST 2] Get All Shops
Request: GET /functions/v1/shops
Expected status: 200, Got: 200
✓ PASSED: Get All Shops - HTTP status correct
✓ Valid JSON response
✓ Response contains array with 5 items

==================================================
Test Suite Completed
Total Tests: 18
Passed: 17
Failed: 1
Success Rate: 94%
==================================================
```

## Troubleshooting

### Authentication Issues
- Verify email/password credentials are correct
- Check if the API key is still valid
- Ensure the Supabase URL is accessible

### jq Not Found
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq
```

### Permission Denied
```bash
chmod +x test_shops_api.sh
```

### Network Issues
- Check internet connectivity
- Verify Supabase endpoint is accessible
- Check firewall settings

## Customization

To modify test parameters, edit the configuration section in `test_shops_api.sh`:

```bash
# Test configuration
BASE_URL="https://your-supabase-url.supabase.co"
API_KEY="your-api-key"
EMAIL="your-email@domain.com"
PASSWORD="your-password"
```