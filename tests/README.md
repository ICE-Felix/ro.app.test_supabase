# Mommy HAI API Test Suite

A comprehensive Python test suite for the Mommy HAI backend API, covering all endpoints with full CRUD operations, authentication, and validation testing.

## 🚀 Features

- **100% Test Coverage** - All API endpoints tested
- **Authentication Testing** - Login and token validation
- **CRUD Operations** - Create, Read, Update, Delete for all resources
- **Validation Testing** - Input validation and error handling
- **HTTP Method Testing** - OPTIONS, HEAD, and method validation
- **Automated CI/CD** - GitHub Actions integration

## 📋 Test Coverage

| API Endpoint | Tests | Status |
|--------------|-------|--------|
| **Authentication** | 1 test | ✅ 100% |
| **Contacts** | 8 tests | ✅ 100% |
| **Blank** | 7 tests | ✅ 100% |
| **Partners** | 7 tests | ✅ 100% |
| **Users** | 5 tests | ✅ 100% |
| **Notifications** | 7 tests | ✅ 100% |
| **Validation** | 4 tests | ✅ 100% |
| **Total** | **39 tests** | ✅ **100%** |

## 🛠️ Setup

### Prerequisites

- Python 3.11 or higher
- `requests` and `colorama` Python packages
- Valid Supabase API key
- Test user account with admin privileges

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r tests/requirements.txt
   ```

2. **Set environment variables:**
   ```bash
   # Required: Supabase API key
   export SUPABASE_ANON_KEY='your_supabase_anon_key_here'
   
   # Required: Test user credentials (must have admin privileges)
   export TEST_USER_EMAIL='your_test_user@example.com'
   export TEST_USER_PASSWORD='your_test_password'
   ```

3. **Run tests:**
   ```bash
   cd tests
   python main.py
   ```

### GitHub Actions (CI/CD)

The tests run automatically on every push to `main` branch. You need to set these secrets in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following repository secrets:
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `TEST_USER_EMAIL` - Email of test user account
   - `TEST_USER_PASSWORD` - Password of test user account

**Important:** The test user must have admin privileges to access all API endpoints.

## 🔧 GitHub Actions Setup

The repository includes a complete GitHub Actions workflow (`.github/workflows/api-tests.yml`) that:

1. **Triggers automatically** on push to `main` branch
2. **Sets up Python 3.11** environment
3. **Installs dependencies** from `requirements.txt`
4. **Runs the complete test suite** (`python main.py`)
5. **Reports results** with detailed success/failure information

### Setting up GitHub Secrets

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous API key
   - `TEST_USER_EMAIL`: Email of your test user account
   - `TEST_USER_PASSWORD`: Password of your test user account

## 📊 Test Results

When you run `python main.py`, you'll see:

- **Real-time test execution** with colored output
- **Detailed request/response information** for each test
- **Authentication status** and token validation
- **CRUD operation results** for all endpoints
- **Validation testing** with error scenarios
- **Final summary** with success rates and timing

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```
   ❌ Authentication failed! Skipping authenticated tests.
   ```
   - Check your `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
   - Ensure the user account exists and has admin privileges

2. **API Key Invalid**
   ```
   ❌ SUPABASE_ANON_KEY environment variable not set!
   ```
   - Verify your Supabase anonymous key is correct
   - Check the environment variable is properly set

3. **Network/Connection Issues**
   - Verify the Supabase URL is accessible
   - Check your internet connection
   - Ensure Supabase service is running

### Debug Mode

For more detailed debugging, you can modify the test file to increase logging:

```python
# In main.py, change logging level
logging.basicConfig(level=logging.DEBUG)
```

## 🔄 Continuous Integration

The test suite is designed for CI/CD integration:

- **Automated execution** on every push
- **Parallel test execution** for faster results  
- **Detailed reporting** with pass/fail status
- **Artifact collection** for test results
- **Email notifications** on test failures (configurable)

## 📈 Extending the Test Suite

To add new tests:

1. **Add new test methods** following the naming pattern `test_*_api()`
2. **Update the `run_all_tests()`** method to include your new tests
3. **Add validation tests** in the `test_*_validation()` methods
4. **Update documentation** to reflect new test coverage

Example:
```python
def test_new_api(self):
    """Test all New API endpoints"""
    self.print_header("NEW API TESTS")
    # Add your test implementation
```

## 🔍 Test Details

### Authentication
- Tests login with valid credentials
- Validates JWT token generation
- Ensures proper user role assignment

### CRUD Operations
- **Create**: POST requests with valid data
- **Read**: GET requests for collections and individual items
- **Update**: PUT requests with partial data updates
- **Delete**: DELETE requests with proper cleanup

### Validation Testing
- Required field validation
- Email format validation
- Phone number validation
- Invalid data handling

### HTTP Methods
- **OPTIONS**: Function status checks
- **HEAD**: Method not allowed validation
- **Proper Status Codes**: 200, 201, 204, 400, 404, 405

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check `SUPABASE_ANON_KEY` is set correctly
   - Verify user credentials in the test script

2. **Tests Failing**
   - Check network connectivity to Supabase
   - Verify API endpoints are deployed
   - Check for database constraint issues

3. **GitHub Actions Failing**
   - Ensure `SUPABASE_ANON_KEY` secret is added
   - Check workflow file syntax
   - Verify Python version compatibility

## 📈 CI/CD Integration

The test suite integrates seamlessly with GitHub Actions to:

- **Prevent broken deployments** by running tests on every push
- **Validate pull requests** before merging
- **Provide immediate feedback** on API health
- **Generate test artifacts** for debugging
- **Maintain code quality** through automated testing

## 🔄 Continuous Improvement

The test suite is designed to grow with your API:

- Add new tests for new endpoints
- Update validation rules as requirements change
- Extend test coverage for edge cases
- Monitor test performance and reliability 