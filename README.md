# Mommy HAI Backend

A Supabase Edge Functions backend for the Mommy HAI application.

## 🚀 Features

- **Complete API Coverage** - All CRUD operations for all resources
- **Authentication & Authorization** - Secure user management with role-based access
- **Automated Testing** - Comprehensive test suite with 100% coverage
- **CI/CD Integration** - GitHub Actions for automated testing on every push
- **Production Ready** - Robust error handling and validation

## Project Structure

```
backend/
├── .github/
│   └── workflows/
│       └── api-tests.yml         # GitHub Actions CI/CD workflow
├── supabase/
│   ├── functions/
│   │   ├── _shared/              # Shared utilities and services
│   │   ├── notifications/        # Notifications API endpoints
│   │   ├── contacts/             # Contacts API endpoints
│   │   ├── partners/             # Partners API endpoints
│   │   ├── users/                # Users API endpoints
│   │   └── blank/               # Template/example endpoints
│   ├── config.toml              # Supabase configuration
│   └── package.json             # Dependencies
├── tests/
│   ├── contacts.py              # Comprehensive API test suite
│   ├── requirements.txt         # Test dependencies
│   └── README.md               # Testing documentation
├── postman/                     # Postman collection and environment
└── README.md
```

## 🧪 Testing & Quality Assurance

### Automated Test Suite
- **39 comprehensive tests** covering all API endpoints
- **100% success rate** with full CRUD validation
- **Authentication testing** with role-based access control
- **Input validation** and error handling verification
- **HTTP method validation** (OPTIONS, HEAD, etc.)

### CI/CD Pipeline
- **Automatic testing** on every push to main branch
- **Pull request validation** before merging
- **Test artifacts** uploaded for debugging
- **Detailed reporting** with success/failure notifications

### Test Coverage
| Component | Tests | Coverage |
|-----------|-------|----------|
| Authentication | 1 test | ✅ 100% |
| Contacts API | 8 tests | ✅ 100% |
| Partners API | 7 tests | ✅ 100% |
| Users API | 5 tests | ✅ 100% |
| Notifications API | 7 tests | ✅ 100% |
| Locale API | 7 tests | ✅ 100% |
| Blank API | 7 tests | ✅ 100% |
| Validation Tests | 4 tests | ✅ 100% |

## 🛠️ Quick Start

### Prerequisites
- Python 3.11+ (for testing)
- Supabase account and project
- GitHub repository (for CI/CD)

### 🧪 Testing

The project includes a comprehensive test suite with 100% API coverage:

```bash
# Install test dependencies
pip install -r tests/requirements.txt

# Set environment variables
export SUPABASE_ANON_KEY='your_supabase_anon_key'
export TEST_USER_EMAIL='your_test_user@example.com'
export TEST_USER_PASSWORD='your_test_password'

# Run tests
cd tests
python main.py
```

**Test Coverage:**
- ✅ 39 comprehensive tests
- ✅ All CRUD operations for every endpoint
- ✅ Authentication & authorization
- ✅ Input validation & error handling
- ✅ HTTP method validation (OPTIONS, HEAD, etc.)

### 🔄 CI/CD Pipeline

GitHub Actions automatically runs the full test suite on every push to `main`:

1. **Automated Testing** - Complete API validation
2. **Environment Setup** - Python 3.11 with dependency caching  
3. **Security** - Credentials via GitHub Secrets
4. **Reporting** - Detailed test results and artifacts

**Required GitHub Secrets:**
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `TEST_USER_EMAIL` - Test user email (admin privileges required)
- `TEST_USER_PASSWORD` - Test user password

## API Endpoints

### Notifications API

The notifications API provides full CRUD operations for managing global notifications with user information integration.

#### Base URL
```
https://your-project.supabase.co/functions/v1/notifications
```

#### Endpoints

- `GET /notifications` - List all global notifications
- `GET /notifications/{id}` - Get a specific notification
- `POST /notifications` - Create a new notification
- `PUT /notifications/{id}` - Update a notification (partial updates supported)
- `DELETE /notifications/{id}` - Soft delete a notification

#### Notification Schema

```json
{
  "id": "uuid",
  "title": "string (required)",
  "body": "string (required)",
  "is_global": "boolean (default: true)",
  "created_by": "uuid (auto-set to current user)",
  "created_by_email": "string (populated from user data)",
  "created_by_name": "string (populated from user metadata)",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted_at": "timestamp (null for active records)"
}
```

#### Example Requests

**Create Notification:**
```json
POST /notifications
{
  "title": "System Maintenance",
  "body": "Scheduled maintenance will occur tonight from 2-4 AM",
  "is_global": true
}
```

### Partners API

The partners API provides full CRUD operations for managing business partners with flexible boolean handling and administrator contact integration.

#### Base URL
```
https://your-project.supabase.co/functions/v1/partners
```

#### Endpoints

- `GET /partners` - List all partners with administrator contact details
- `GET /partners/{id}` - Get a specific partner
- `POST /partners` - Create a new partner
- `PUT /partners/{id}` - Update a partner (partial updates supported)
- `DELETE /partners/{id}` - Soft delete a partner

#### Partner Schema

```json
{
  "id": "uuid",
  "company_name": "string (required)",
  "tax_id": "string (required)",
  "registration_number": "string (optional)",
  "address": "string (optional)",
  "bank_account": "string (optional)",
  "bank_name": "string (optional)",
  "administrator_contact_id": "uuid (optional, references contacts table)",
  "is_active": "boolean (default: true, accepts boolean/'1'/'0'/1/0)",
  "business_email": "string (optional, validated email format)",
  "orders_email": "string (optional, validated email format)",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted_at": "timestamp (null for active records)",
  "administrator_contact": "object (populated contact details)",
  "administrator_name": "string (computed full name)"
}
```

### Contacts API

The contacts API provides full CRUD operations for managing contact information with comprehensive validation.

#### Base URL
```
https://your-project.supabase.co/functions/v1/contacts
```

#### Endpoints

- `GET /contacts` - List all contacts
- `GET /contacts/{id}` - Get a specific contact
- `POST /contacts` - Create a new contact
- `PUT /contacts/{id}` - Update a contact (partial updates supported)
- `DELETE /contacts/{id}` - Soft delete a contact

#### Contact Schema

```json
{
  "id": "uuid",
  "first_name": "string (required)",
  "last_name": "string (required)",
  "phone_no": "string (optional)",
  "email": "string (optional, validated email format)",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted_at": "timestamp (null for active records)"
}
```

### Locale API

The locale API provides complete CRUD operations for managing application locales with comprehensive validation and error handling.

#### Base URL
```
https://your-project.supabase.co/functions/v1/locale
```

#### Endpoints

- `GET /locale` - List all locales
- `GET /locale/{id}` - Get a specific locale
- `POST /locale` - Create a new locale
- `PUT /locale/{id}` - Update a locale (partial updates supported)
- `DELETE /locale/{id}` - Soft delete a locale

#### Locale Schema

```json
{
  "id": "uuid",
  "code": "string (required, unique locale code)",
  "label": "string (required, display name)",
  "created_at": "timestamp",
  "updated_at": "timestamp",
  "deleted_at": "timestamp (null for active records)"
}
```

#### Example Requests

**Create Locale:**
```json
POST /locale
{
  "code": "en-US",
  "label": "English (United States)"
}
```

**Update Locale:**
```json
PUT /locale/{id}
{
  "label": "English (US)"
}
```

#### Features

- **Comprehensive Validation** - Required field validation with detailed error messages
- **404 Error Handling** - Proper resource not found responses for GET, PUT, and DELETE operations
- **Existence Validation** - Pre-operation checks to ensure resources exist before modifications
- **Soft Delete** - Non-destructive deletion with `deleted_at` timestamp
- **String Trimming** - Automatic whitespace trimming for code and label fields
- **Partial Updates** - PUT operations only update provided fields
- **Consistent Error Responses** - Standardized error format across all operations

### Users API

The users API provides comprehensive user management with role-based access control and administrative functions.

#### Base URL
```
https://your-project.supabase.co/functions/v1/users
```

#### Endpoints

- `GET /users` - List all users (admin only)
- 
