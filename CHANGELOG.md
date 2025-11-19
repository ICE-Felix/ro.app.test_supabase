# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **Banners crud functionality** - Complete CRUD operations for banners management
  - **Full CRUD Operations**: Create, read, update, and delete banners with comprehensive validation
  - **Display Order Management**: Configurable image ordering with automatic sequencing
  - **Supabase Storage Integration**: Automatic file upload to `banners-images` bucket with unique naming
  - **Public URL Generation**: Automatic public URL generation for all uploaded images

### Added
- **Gallery Management System** - Complete image management for venues with Supabase Storage integration
  - **Full CRUD Operations**: Upload, list, and delete images with comprehensive validation
  - **Gallery-Venue Integration**: Seamless integration with venues table via `gallery_id` foreign key
  - **Multi-Image Support**: Upload 1-6 images per gallery with configurable limits
  - **Image Validation**: File size limits (5MB), MIME type validation (JPEG, PNG, WebP), and base64 format support
  - **Primary Image Designation**: Automatic primary image selection with one-per-gallery constraint
  - **Display Order Management**: Configurable image ordering with automatic sequencing
  - **Supabase Storage Integration**: Automatic file upload to `venue-galleries` bucket with unique naming
  - **Public URL Generation**: Automatic public URL generation for all uploaded images
  - **Smart Gallery Creation**: Automatic gallery creation when uploading to new venue
  - **Gallery Capacity Management**: Prevents empty galleries and enforces maximum image limits
  - **Enhanced Error Handling**: Detailed validation feedback with field-specific error messages
  - **Storage Test Endpoint**: Diagnostic endpoint for verifying storage configuration and bucket setup
  - **Comprehensive API Documentation**: Complete testing guide with cURL examples and troubleshooting
  - **New Files Created**:
    - `supabase/functions/_shared/controllers/GalleryController.ts` - Complete gallery management controller
    - `supabase/functions/gallery/index.ts` - Gallery API endpoints and routing
    - `supabase/functions/test-storage/index.ts` - Storage diagnostic and setup utility
    - `GALLERY_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
    - `setup_gallery_schema.sql` - Database schema setup script
- **Venue Categories Hierarchical Support** - Complete hierarchical filtering and display functionality
  - Enhanced parent-child relationship support with `parent_id` parameter filtering
  - Added `parent_id=is.null` support for querying top-level categories (WHERE parent_id IS NULL)
  - Added `parent_id=eq.{uuid}` and direct UUID format support for subcategory querying
  - Implemented `hierarchy=true` parameter for full nested structure responses with children arrays
  - Added comprehensive boolean conversion supporting multiple input formats (boolean, "1"/"0", 1/0)
  - Enhanced pagination support with `limit`, `offset`, and `page` parameters
  - Added search functionality across category names with case-insensitive matching
  - Implemented hierarchical data building with recursive parent-child relationships
  - Added response metadata including pagination info, filters, and hierarchy indicators
  - Created flattened hierarchy display option for indented list views
- **Venues Business Hours Management** - Comprehensive business hours scheduling system
  - **Complete Schedule Management**: Full weekly schedule support with individual day configurations
  - **Flexible Input Formats**: Supports both JSON object and JSON string formats for business hours
  - **Comprehensive Validation**: Time format validation (HH:MM), business logic validation, and structure validation
  - **Full CRUD Operations**: Create, read, update, and delete business hours with venue data
  - **Day-by-Day Configuration**: Individual scheduling for all 7 days of the week with enable/disable options
  - **Time Range Validation**: Ensures closing time is after opening time, supports 24-hour operations
  - **Rich Data Structure**: Structured business hours with enabled flag, opening time, and closing time per day
  - **Error Handling**: Detailed validation errors with specific field-level feedback
  - **Optional Field Support**: Venues can exist without business hours (field is optional)
  - **Database Integration**: Proper JSON storage and retrieval with automatic format conversion
- **Venues Hierarchical Category Filtering** - Advanced filtering system for venue-category relationships
  - Implemented `include_subcategories` parameter (defaults to `true` for intuitive UX)
  - Added recursive subcategory lookup functionality using `getAllSubcategoryIds()` method
  - Enhanced filtering logic to include parent category + all descendant categories
  - Implemented efficient SQL filtering using `IN` operator for hierarchical queries
  - Added comprehensive debug logging for troubleshooting filtering operations
  - Created response metadata showing applied filters and subcategory inclusion status
  - Fixed "Error loading subcategories" issue by ensuring venues from child categories appear when parent is selected
- **Enhanced API Documentation** - Comprehensive guides and examples
  - Created detailed hierarchical API usage examples with React implementation patterns
  - Added troubleshooting guides for common hierarchical filtering issues
  - Documented expected response structures for both flat and nested category data
  - Created comprehensive test scripts for validating hierarchical functionality
- **Venues API** - Complete CRUD operations for venue management
  - Full venue management with comprehensive field support
  - Location data handling (latitude, longitude, city, address)
  - Relationship management with contacts, venue categories, countries, and regions
  - Boolean field validation for `is_active` and `is_online` status
  - Automatic related data population (contact names, category names, etc.)
  - Comprehensive validation for all field types (strings, UUIDs, booleans)
  - Support for partial updates with selective field validation
  - Soft delete functionality with proper timestamp management
- **Venue General Attributes API Enhancements** - Improved validation methods
  - Added `validateVenueGeneralAttributesDataForUpdate()` method for partial updates
  - Enhanced validation for `type` and `value` fields during updates
  - Improved error handling and validation consistency
- **Countries API Enhancements** - Added missing validation methods
  - Added `validateCountriesDataForUpdate()` method for partial updates
  - Enhanced validation for `name` field during updates
  - Improved consistency with other API controllers
- **Regions API Implementation** - Complete regional management system
  - Full CRUD operations with country relationship support
  - UUID validation for `country_id` foreign key references
  - Automatic country name population in responses
  - Comprehensive validation for both create and update operations
  - Soft delete functionality with proper error handling
- **Postman Collections** - Complete API testing suites
  - **Venue General Attributes Postman Collection** - Full CRUD testing with venue-specific examples
  - **Venues Postman Collection** - Comprehensive testing with relationship support
  - **Authentication sections** with login and permission checking
  - **Environment variables** for UUID management and chaining requests
  - **Realistic test data** with venue-appropriate examples (hotels, restaurants, educational centers)
  - **Validation testing** scenarios for error handling
  - **Web interface testing** with HTML Accept headers
- **Contracts Management System** - Complete contract lifecycle management with partner and type relationships
  - **Full CRUD Operations**: Create, read, update, and delete contracts with comprehensive validation
  - **Contract Type Integration**: Seamless integration with contract_types table via `type_id` foreign key
  - **Partner Relationship Support**: Automatic partner name population through `partner_id` references
  - **Data Enrichment**: Automatic population of contract type names and partner names in responses
  - **Comprehensive Validation**: Contract number validation, UUID validation for foreign keys, and field-specific error messages
  - **File URL Management**: Support for contract document storage with URL validation
  - **Status Management**: Boolean `is_active` field with flexible input format support (boolean, string, number)
  - **Soft Delete Functionality**: Proper soft deletion with `deleted_at` timestamp management
  - **Enhanced Error Handling**: Detailed validation feedback with field-specific error messages
  - **Response Data Enrichment**: Automatic inclusion of related contract type and partner information
  - **Async/Await Support**: Proper asynchronous data processing for related entity lookups
  - **Interface Design**: Clean separation between ContractsData (input) and ContractsResponseData (output)
  - **UUID Validation**: Robust UUID validation for all foreign key relationships
  - **Comment Support**: Full text comments field for contract notes and documentation
  - **Contract Numbering**: Required contract number field with string validation
  - **API Endpoints**: Complete REST API with GET, POST, PUT, DELETE operations
  - **Web Interface Support**: Dual API/Web controller architecture for different client needs

### Fixed
- **Gallery Storage Upload Issues** - Resolved "No response received while uploading to storage" error
  - Fixed missing `venue-galleries` storage bucket configuration
  - Enhanced GalleryController with detailed error logging and debugging information
  - Added comprehensive storage validation and automatic bucket creation
  - Fixed Supabase client type casting issues in storage operations
  - Added proper error handling for storage upload failures with detailed error messages
  - Fixed public URL generation for uploaded images
  - Enhanced storage deletion operations with proper error handling
- **Venues API Type Annotations** - Resolved Supabase client type compatibility issues
  - Fixed missing `SupabaseAdmin` import causing runtime errors in image upload functionality
  - Resolved type annotation conflicts between custom `SupabaseClient` and global `SupabaseClient` types
  - Fixed Promise.all array typing issues in `getRelatedData()` method
  - Corrected async/await usage in `.then()` callback functions for proper data enrichment
  - Fixed variable type declarations for `imageStoragePath` and `imageStorageId` to handle undefined values
- **Frontend API Endpoint Mismatch** - Identified critical endpoint routing issue
  - Discovered frontend calling `/api/subcategories/venue_categories` instead of `/functions/v1/venue_categories`
  - Root cause of "Error loading subcategories" was incorrect API endpoint paths
  - Frontend expecting different API structure than implemented Supabase Edge Functions
- **Venue Categories Boolean Conversion** - Enhanced field validation and type handling
  - Implemented flexible boolean conversion for `active` field supporting multiple input formats
  - Added `convertBooleanValue()` helper method for consistent boolean handling
  - Fixed validation to accept boolean, string ("1"/"0"), and number (1/0) inputs
  - Enhanced error messages for invalid boolean values with specific format requirements
- **VenueGeneralAttributesApiController** - Resolved missing validation method error
  - Fixed `validateVenueGeneralAttributesDataForUpdate` method not found on line 159
  - Added proper partial update validation for `type` and `value` fields
- **CountriesApiController** - Resolved missing validation method error
  - Fixed `validateCountriesDataForUpdate` method not found
  - Added proper partial update validation for `name` field
- **RegionsApiController** - Resolved missing UUID validation method
  - Fixed `isValidUUID` method not found error
  - Added proper UUID validation with regex pattern for foreign key references
- **Validation Consistency** - Improved validation patterns across all controllers
  - Standardized validation method signatures and return types
  - Enhanced error message consistency and clarity
  - Fixed validation logic for optional fields and partial updates

### Changed
- **Venues Data Structure** - Enhanced venue management capabilities with gallery support
  - **Gallery Integration**: Added `gallery_id` field to venues table and VenuesData interface
  - **Gallery Validation**: Enhanced validation methods to support gallery UUID references
  - **Gallery Response Data**: Added `gallery_info` to VenueResponseData interface for image metadata
  - **Gallery Relationship**: Automatic gallery information population in venue responses
- **Venues Data Structure** - Enhanced venue management capabilities
  - Updated venue interface to support all database fields
  - Added comprehensive relationship support (contacts, categories, countries, regions)
  - Enhanced boolean field handling with multiple input format support
  - Improved response structure with automatic related name population
  - **Added Business Hours Support**: Extended VenuesData interface with business_hours field
  - **Enhanced Validation Architecture**: Integrated business hours validation into create and update operations
  - **Flexible Data Types**: Support for BusinessHours object type and JSON string formats
  - **Database Schema Integration**: Automatic JSON conversion for business_hours field storage
- **Contracts Data Structure** - Simplified and standardized contract management schema
  - **Field Renaming**: Changed `contract_type_id` to `type_id` for consistency with other controllers
  - **Interface Simplification**: Updated ContractsData interface with streamlined field naming
  - **Validation Optimization**: Simplified validation logic by removing redundant field checks
  - **CRUD Operations Update**: Updated all create, read, update, delete operations to use new field names
  - **Database Schema Alignment**: Aligned API field names with updated database schema structure
- **Contacts Data Structure** - Enhanced contact management with department type support
  - **Department Type Field**: Added `type` field to ContactsData interface for department categorization
  - **Department Validation**: Added validation for department type field with string validation
  - **CRUD Operations Enhancement**: Updated create, read, update, delete operations with department type support
  - **Department Examples**: Support for department types like "Management", "Sales", "Support", "HR", "IT"
  - **Optional Field Support**: Department type is optional and can be null or omitted
- **Venue Categories URL Field** - Enhanced dropdown support with dynamic URL generation
  - **URL Field Addition**: Added `url` field to VenueCategoryResponseData interface for dropdown navigation
  - **Smart URL Generation**: Automatic URL generation based on category level and child relationships
  - **Cascading Dropdown Support**: URLs point to child categories for building dynamic dropdown interfaces
  - **Level-Based URLs**: Level 1 categories get URLs for Level 2, Level 2 categories get URLs for Level 3
  - **Conditional URL Population**: URLs only generated for categories that have children (`has_children: true`)
- **Validation Architecture** - Standardized validation across all APIs
  - Unified validation method patterns for create vs update operations
  - Enhanced error reporting with detailed field-specific messages
  - Improved UUID validation consistency across all controllers
  - **Business Hours Validation**: Added comprehensive time and schedule validation methods
  - **Multi-format Support**: Enhanced validation to handle both object and string inputs
- **Postman Collection Structure** - Enhanced testing capabilities
  - Added comprehensive environment variable management
  - Improved test data with realistic venue examples
  - Enhanced relationship testing with foreign key support
  - Added comprehensive error scenario testing

### Technical Details - Venue Categories Hierarchical Support
- **Hierarchical Query Implementation**: Advanced parent-child relationship handling
  - `buildHierarchicalData()` method for recursive category tree construction
  - `flattenHierarchy()` method for indented flat list display
  - Efficient category mapping using `Map<string, VenueCategoryResponseData>` for O(1) lookups
  - Recursive level calculation and `has_children` flag setting
  - Sorting children recursively by name for consistent ordering
- **Parameter Processing**: Flexible input format support
  - PostgREST format: `parent_id=eq.{uuid}` for direct API compatibility
  - Direct UUID format: `parent_id={uuid}` for simplified usage
  - Special null handling: `parent_id=is.null` for top-level categories
  - Boolean parameter parsing: `hierarchy=true` or `hierarchy=1` for nested responses
- **Response Structure Enhancement**: Rich metadata and hierarchy indicators
  - Added `children[]` array for nested category structures
  - Added `level` field indicating depth in hierarchy (0 = root, 1 = child, etc.)
  - Added `has_children` boolean flag for UI expansion logic
  - Enhanced pagination metadata with total counts and navigation info
  - Filter information showing applied parameters and hierarchy status

### Technical Details - Venues Hierarchical Filtering
- **Recursive Subcategory Lookup**: Efficient hierarchical category resolution
  - `getAllSubcategoryIds()` method with recursive descendant discovery
  - Single database query to fetch all categories for hierarchy building
  - `getAllDescendants()` recursive function for complete category tree traversal
  - Optimized SQL queries using `IN` operator instead of multiple `OR` conditions
- **Filtering Logic Enhancement**: Smart category inclusion system
  - Default `include_subcategories=true` for intuitive user experience
  - Fallback to exact matching when `include_subcategories=false` or `include_subcategories=0`
  - Dynamic category ID array construction: `[parent_id, child1_id, child2_id, ...]`
  - Conditional query building: single `eq` for exact match, `in` for hierarchical
- **Debug Logging System**: Comprehensive troubleshooting support
  - Parameter parsing debug logs showing raw and processed values
  - Subcategory discovery logs with parent and found child IDs
  - SQL query construction logs showing final filter arrays
  - Performance tracking with query execution details
- **Response Metadata**: Enhanced filtering transparency
  - `include_subcategories` flag showing applied filtering mode
  - `venue_category_id` showing the root category being filtered
  - Debug information for troubleshooting hierarchical queries

### Technical Details - API Endpoint Architecture
- **Supabase Edge Functions**: Serverless function implementation at `/functions/v1/` endpoints
  - `venue_categories` endpoint with hierarchical parameter support
  - `venues` endpoint with advanced category filtering capabilities
  - Proper authentication integration via `AuthenticationService`
  - Consistent error handling and response formatting
- **Frontend Integration Discovery**: API endpoint routing analysis
  - Frontend expecting traditional REST API at `/api/subcategories/` paths
  - Supabase implementation using Edge Functions at `/functions/v1/` paths
  - Identified need for endpoint mapping or frontend updates
  - Created comprehensive troubleshooting guides for endpoint verification

### Technical Details - Venues API
- **Database Schema Integration**: Full support for venues table with all fields
  - `id` (UUID, primary key)
  - `name`, `city`, `address` (text fields with validation)
  - `latitude`, `longitude` (location coordinates as text)
  - `contact_id`, `venue_category_id`, `country_id`, `region_id` (UUID foreign keys)
  - `is_active`, `is_online` (boolean fields with flexible input handling)
  - `created_at`, `updated_at`, `deleted_at` (timestamp management)
- **Relationship Management**: Advanced join queries for related data
  - Contact information with automatic name concatenation
  - Venue category integration with name population
  - Country and region data with automatic name resolution
  - Comprehensive select queries with nested relationship data
- **Validation System**: Multi-layered validation architecture
  - String field validation with trimming and empty string detection
  - UUID validation with regex pattern matching
  - Boolean field validation supporting multiple input formats (boolean, "1"/"0", 1/0)
  - Partial update validation for selective field updates
  - Comprehensive error reporting with field-specific messages

### Technical Details - Gallery Management System
- **Database Schema Design**: Comprehensive two-table architecture for gallery and image management
  - `galleries` table with venue relationship, metadata, and soft deletion support
  - `gallery_images` table with file information, display ordering, and primary image designation
  - Foreign key relationships: `venues.gallery_id` → `galleries.id` → `gallery_images.gallery_id`
  - Automatic triggers for `updated_at` timestamp management and single primary image enforcement
  - Comprehensive indexing for performance optimization (gallery_id, display_order, is_primary)
- **Supabase Storage Integration**: Enterprise-grade file storage with proper security policies
  - `venue-galleries` bucket with public access and authenticated user upload permissions
  - Unique file naming: `{gallery_id}/{timestamp}-{original_filename}` pattern
  - Automatic blob conversion from base64 with proper MIME type handling
  - Public URL generation for immediate image access
  - Automatic cleanup on image deletion with storage and database synchronization
- **Upload Processing Pipeline**: Multi-stage validation and processing system
  - Base64 validation and size calculation before upload
  - MIME type validation (image/jpeg, image/png, image/webp)
  - File size limits (5MB) with detailed error reporting
  - Automatic gallery creation when uploading to new venue
  - Display order management with automatic sequencing
  - Primary image designation with single-image-per-gallery constraint
- **API Endpoint Architecture**: RESTful design with specialized endpoints
  - `POST /functions/v1/gallery/upload` - Multi-image upload with validation
  - `GET /functions/v1/gallery/{galleryId}/images` - Gallery image listing with metadata
  - `DELETE /functions/v1/gallery/delete` - Selective image deletion with constraints
  - `GET /functions/v1/test-storage` - Storage configuration diagnostic endpoint
  - Comprehensive CORS handling and authentication integration
- **Error Handling and Logging**: Production-ready debugging and monitoring
  - Detailed console logging for upload process tracking
  - Storage operation error capture with specific error codes
  - Field-level validation errors with user-friendly messages
  - Storage bucket existence validation with automatic creation
  - Upload failure diagnostics with file size, MIME type, and network information

### Technical Details - Enhanced Validation Methods
- **VenueGeneralAttributesApiController**: Added missing validation methods
  - `validateVenueGeneralAttributesDataForUpdate()` for partial updates
  - Enhanced validation for `type` and `value` fields
  - Improved error handling consistency
- **CountriesApiController**: Added missing validation methods
  - `validateCountriesDataForUpdate()` for partial updates
  - Enhanced validation for `name` field
  - Improved validation consistency
- **RegionsApiController**: Added missing UUID validation
  - `isValidUUID()` method with proper regex pattern
  - Enhanced foreign key validation for `country_id`
  - Improved error handling for invalid UUID formats

### Technical Details - Venues Business Hours Management
- **Data Structure Design**: Comprehensive business hours architecture
  - **DaySchedule Interface**: `{enabled: boolean, open: string, close: string}` structure for each day
  - **BusinessHours Interface**: Complete weekly schedule with all 7 days (monday through sunday)
  - **VenuesData Interface**: Extended with `business_hours?: BusinessHours | string | null` field
  - **Database Storage**: JSON string format in `business_hours` column with automatic conversion
  - **Flexible Input Support**: Accepts both structured objects and JSON strings for maximum compatibility
- **Validation System**: Multi-layered validation architecture for business hours
  - **Time Format Validation**: `isValidTimeFormat()` method validates HH:MM format (00:00-23:59)
  - **Structure Validation**: `validateBusinessHours()` method ensures all required fields and days are present
  - **Business Logic Validation**: Verifies closing time is after opening time for enabled days
  - **Day Completeness**: Validates all 7 days are specified with proper lowercase names
  - **Type Flexibility**: Handles JSON object, JSON string, and null inputs with proper error handling
- **Processing Methods**: Automatic data conversion and validation
  - **processBusinessHours()**: Converts between object and string formats for database storage
  - **JSON Parsing**: Safe JSON parsing with comprehensive error handling and validation
  - **Database Integration**: Automatic conversion to JSON string for storage, object for validation
  - **Error Propagation**: Detailed error messages with field-specific validation feedback
- **CRUD Operations Enhancement**: Integrated business hours support across all operations
  - **POST /venues**: Create venues with business hours validation and storage
  - **PUT /venues/:id**: Update business hours with partial validation support
  - **GET /venues**: Retrieve venues with business hours data (existing functionality)
  - **DELETE /venues/:id**: Soft delete preserves business hours data (existing functionality)
  - **Validation Integration**: Business hours validation in both create and update validation methods
- **Time Management Features**: Comprehensive scheduling support
  - **24-Hour Support**: Handles 00:00 to 23:59 time ranges including midnight operations
  - **Day Enable/Disable**: Individual day control with enabled flag for flexible schedules
  - **Cross-Day Validation**: Prevents invalid time ranges (close before open)
  - **Flexible Scheduling**: Supports various business models (restaurants, 24-hour services, weekend-only)
  - **Optional Implementation**: Venues can exist without business hours (fully optional field)
- **API Interface Design**: User-friendly business hours management
  - **Multiple Input Formats**: Accepts `{"monday": {...}}` objects or JSON strings
  - **Comprehensive Error Messages**: Detailed field-level validation feedback
  - **Response Consistency**: Business hours returned in consistent object format
  - **Validation Feedback**: Clear error messages for invalid times, missing days, or malformed data
- **Common Use Cases Support**: Pre-validated scheduling patterns
  - **Standard Business Hours**: 9-5 weekdays with weekend disable support
  - **Restaurant Hours**: Different weekday/weekend hours with late night support
  - **24-Hour Operations**: Full day scheduling with 00:00-23:59 support
  - **Weekend Only**: Flexible scheduling for seasonal or event-based businesses
  - **Custom Schedules**: Complete flexibility for unique business requirements

### Technical Details - Postman Collections
- **Venue General Attributes Collection**: Complete testing suite
  - Authentication with login and permission checking
  - CRUD operations with venue-specific examples (parking, wifi attributes)
  - Environment variables for UUID management
  - Error scenario testing for validation
- **Venues Collection**: Comprehensive venue testing
  - Full CRUD operations with realistic venue data
  - Relationship testing with foreign key support
  - Location data testing with coordinates
  - Boolean field testing with multiple input formats
  - Advanced scenarios with related entity creation
  - Web interface testing with HTML responses
  - **Business Hours Testing**: Comprehensive business hours validation and operations
    - Create venue with business hours (JSON object format)
    - Create venue with business hours (JSON string format)
    - Update venue business hours with partial data
    - Validation testing for invalid time formats
    - Validation testing for missing days
    - Validation testing for invalid time ranges
    - 24-hour operation testing
    - Weekend-only business testing

### Files Added
- `supabase/functions/venues/` - Complete venues API implementation
  - `supabase/functions/venues/index.ts` - Main entry point with routing
  - `supabase/functions/venues/controllers/VenuesApiController.ts` - Full CRUD API controller
  - `supabase/functions/venues/controllers/VenuesWebController.ts` - Web interface controller
  - `supabase/functions/venues/tests/blank.test.ts` - Comprehensive test suite
- `venue_general_attributes_postman.json` - Complete Postman collection for venue attributes
- `venues_postman.json` - Complete Postman collection for venues API

### Files Modified
- `supabase/functions/venue_categories/controllers/VenueCategoriesApiController.ts`
  - Enhanced with hierarchical filtering support (`parent_id`, `hierarchy` parameters)
  - Added `buildHierarchicalData()` and `flattenHierarchy()` methods for tree structures
  - Implemented `convertBooleanValue()` helper for flexible boolean field handling
  - Added comprehensive pagination and search functionality
  - Enhanced response metadata with filter and hierarchy information
- `supabase/functions/venues/controllers/VenuesApiController.ts`
  - Added `getAllSubcategoryIds()` method for recursive subcategory lookup
  - Implemented `include_subcategories` parameter for hierarchical venue filtering
  - Enhanced filtering logic to include parent + all descendant categories
  - Added comprehensive debug logging for troubleshooting
  - Fixed type annotation issues and Supabase client imports
  - Enhanced response metadata with subcategory filtering information
  - **Business Hours Management Implementation**: Complete business hours functionality
    - **Extended VenuesData Interface**: Added `business_hours?: BusinessHours | string | null` field
    - **Added Type Definitions**: Created `DaySchedule` and `BusinessHours` interfaces
    - **Time Validation**: Implemented `isValidTimeFormat()` method for HH:MM format validation
    - **Business Hours Validation**: Added `validateBusinessHours()` method with comprehensive checks
    - **Data Processing**: Implemented `processBusinessHours()` method for format conversion
    - **CRUD Integration**: Enhanced POST and PUT methods with business hours support
    - **Validation Integration**: Added business hours validation to both create and update validation methods
    - **Error Handling**: Comprehensive error handling with detailed field-specific feedback
    - **Database Integration**: Automatic JSON string conversion for database storage
    - **Flexible Input Support**: Handles both JSON object and JSON string inputs
- `supabase/functions/venue_general_attributes/controllers/VenueGeneralAttributesApiController.ts`
  - Added `validateVenueGeneralAttributesDataForUpdate()` method
  - Enhanced validation consistency and error handling
- `supabase/functions/countries/controllers/CountriesApiController.ts`
  - Added `validateCountriesDataForUpdate()` method
  - Enhanced validation for partial updates
- `supabase/functions/regions/controllers/RegionsApiController.ts`
  - Added `isValidUUID()` method for proper UUID validation
  - Enhanced foreign key validation and error handling
- `CHANGELOG.md` - This comprehensive changelog update including business hours functionality

### Database Schema
- **Venues Table**: Complete venue management schema
  - Primary key: `id` (UUID with auto-generation)
  - Required fields: None (all fields optional for maximum flexibility)
  - Location fields: `latitude`, `longitude`, `city`, `address`
  - Relationship fields: `contact_id`, `venue_category_id`, `country_id`, `region_id`
  - Status fields: `is_active`, `is_online` (boolean with flexible input)
  - Audit fields: `created_at`, `updated_at`, `deleted_at`
  - **Business Hours Field**: `business_hours` (JSON column storing weekly schedule)
    - **Data Type**: JSON string with automatic object conversion
    - **Structure**: Weekly schedule with 7 days (monday through sunday)
    - **Day Format**: `{enabled: boolean, open: "HH:MM", close: "HH:MM"}` per day
    - **Validation**: Time format (00:00-23:59), close after open, all days required
    - **Flexibility**: Supports 24-hour operations, weekend-only, custom schedules
    - **Optional**: Venues can exist without business hours (NULL allowed)
  - Foreign key constraints to contacts, venue_categories, countries, regions tables
- **Enhanced Validation**: Improved validation across all existing tables
  - Better UUID validation patterns
  - Enhanced partial update support
  - Improved error handling and reporting
  - **Business Hours Validation**: Comprehensive time and schedule validation

## [Previous Versions]

### Added
=======
- **News API Enhancement** - Complete filtering, pagination, and search functionality
  - Category filtering by `category_id` parameter for news by category
  - Full pagination support with `limit`, `offset`, and `page` parameters
  - Text search across `title`, `keywords`, and `body` fields with `search` parameter
  - Combined filters support (category + search + pagination)
  - Comprehensive parameter validation (limit 1-100, offset ≥0, page ≥1)
  - Enhanced response metadata with pagination info and applied filters
  - Extensive debug logging for troubleshooting and development
- **News API Test Suite** - Comprehensive bash test script with 18 test cases
  - Basic GET operations and single item retrieval
  - Pagination testing (both page-based and offset-based)
  - Search functionality across multiple fields
  - Category filtering validation
  - Combined filters testing
  - CRUD operations (POST, PUT, DELETE)
  - Error handling and edge case validation
  - Invalid parameters and unsupported methods testing
  
- **Locale API Enhancement** - Complete CRUD operations implementation for locale management
  - Proper 404 error handling for not found resources with PGRST116 error code detection
  - Resource existence validation for PUT and DELETE operations before attempting modifications
  - Full soft delete functionality implementation with `deleted_at` and `updated_at` timestamp management
  - Improved error messaging consistency across all operations

### Fixed
- **News API Response Structure** - Fixed redundant `data.data` nesting in API responses
  - Removed double nesting where news items were wrapped in `{ data: { data: [...] } }`
  - Restructured response to match other APIs: `{ success: true, data: [...], meta: {...} }`
  - Moved pagination and filters metadata to `meta` field using ResponseService properly
  - Consistent response structure across all API endpoints
  - Fixed ResponseService.success() usage to prevent redundant data wrapping
- **Locale API Controller** - Fixed route configuration from "blank" to "locale" in RouteService
- **Error Handling** - Enhanced GET operation with proper not found response (404 status)
- **Data Validation** - Added existence checks before PUT and DELETE operations to prevent operations on non-existent resources
- **Console Logging** - Fixed log messages from "locale" to "locales" for consistency
- **Delete Operation** - Replaced mock delete response with actual soft delete implementation
- **Code Quality** - Improved indentation and removed debug logging statements

### Technical Details - News API
- **Filtering Implementation**: Added category filtering using `news_categories_id` field with proper UUID validation
- **Pagination System**: Implemented dual pagination approach supporting both offset-based and page-based navigation
- **Search Functionality**: Multi-field text search using PostgreSQL `ilike` operator with OR conditions across title, keywords, and body
- **Parameter Validation**: Comprehensive validation with proper limits (1-100 for limit, ≥0 for offset, ≥1 for page)
- **Response Structure**: Clean response format with direct data access and metadata separation
- **Query Optimization**: Efficient counting with `count: "exact"` option and proper range queries
- **Error Handling**: Fallback mechanisms for search failures and comprehensive debug logging
- **Database Integration**: Uses Supabase PostgREST syntax for filtering, pagination, and text search

### Technical Details - Locale API
- Implemented proper PGRST116 error code handling for PostgreSQL "not found" responses
- Added comprehensive existence validation using `is('deleted_at', null)` filters
- Enhanced soft delete with proper timestamp management for audit trails
- Improved error response consistency with appropriate HTTP status codes
- Fixed route configuration to properly handle locale-specific requests
- Complete Notifications API implementation with full CRUD operations
- User Notifications API for managing notification assignments to users
- Support for both global notifications and user-specific notifications
- Comprehensive notification data validation with detailed error messages
- User existence validation using Supabase Admin client
- Notification existence validation for assignment operations
- Support for creating new notifications or assigning existing ones
- Mark as read functionality for individual and all user notifications
- Flattened response structure combining notification and assignment data
- Complete Partners API implementation with full CRUD operations
- Flexible boolean handling for `is_active` field - accepts boolean values, string "1"/"0", or number 1/0
- Administrator contact integration with automatic name concatenation
- Comprehensive partner data validation with detailed error messages
- Email format validation for business_email and orders_email fields
- UUID validation for administrator_contact_id references
- Support for partial updates (PUT requests only update provided fields)
- Soft delete functionality using `deleted_at` timestamp
- Complete Contacts API implementation with full CRUD operations
- Input validation for contact data with detailed error messages
- Email format validation using regex
- Support for partial updates (PUT requests only update provided fields)
- Soft delete functionality using `deleted_at` timestamp
- Proper authentication integration via AuthenticationService
- Comprehensive error handling and response formatting
- Database integration with Supabase client
- Contact schema validation for required fields (`first_name`, `last_name`)
- Optional field validation for `phone_no` and `email`
- String trimming and null value handling
- Automatic `updated_at` timestamp management

### Fixed
- **Critical**: Resolved "Cannot read properties of undefined (reading 'title')" errors in validation methods
- Added robust null/undefined checks in RouteService request body parsing
- Enhanced request body parsing to never return undefined values
- Improved error handling for malformed or empty request bodies
- Added defensive validation checks in all API controllers
- Fixed edge cases where JSON parsing could return null/undefined values

### Changed
- Enhanced RouteService.parseRequestBody() with better null handling and fallback values
- Updated all validation methods to handle undefined/null data gracefully
- Improved error logging and debugging information for request parsing issues
- Enhanced Partners API to support flexible boolean conversion for `is_active` field
- Updated ContactsApiController interface from generic `BlankResourceData` to specific `ContactsData`
- Modified PUT method to accept `Partial<ContactsData>` for selective field updates
- Enhanced validation to distinguish between create and update operations

### Technical Details - Notifications API
- Implemented dual-mode notifications: global notifications and user-specific assignments
- Added comprehensive validation for notification creation vs assignment scenarios
- Integrated with Supabase Admin client for user validation across authentication boundaries
- Support for notification status tracking (read/unread) with timestamps
- Flattened response structure for easier frontend consumption
- Duplicate assignment prevention with proper error handling
- Bulk operations for marking all notifications as read

### Technical Details - User Notifications API
- Created user_notifications junction table linking users to notifications
- Support for both creating new notifications and assigning existing ones
- User-scoped operations ensuring users can only access their own notifications
- Advanced query joining with notifications table for complete data retrieval
- Timestamp management for read status tracking

### Technical Details - RouteService Improvements
- Enhanced parseRequestBody() to handle edge cases with null/undefined JSON parsing
- Added explicit checks before passing data to controllers
- Improved error messages and logging for debugging request parsing issues
- Fallback mechanisms to ensure consistent data structure returned to controllers
- Better handling of different content types (JSON, form data, multipart)

### Technical Details - Partners API
- Implemented flexible boolean conversion: `convertIsActiveToBoolean()` method
- Added comprehensive partner data validation with support for multiple data types
- Integrated administrator contact information with automatic name generation
- Enhanced validation for business and financial data (tax_id, bank_account, etc.)
- Proper UUID validation for contact references
- Support for string trimming and null value handling across all fields

### Technical Details - Contacts API
- Implemented proper TypeScript interfaces matching database schema
- Added separate validation methods for create vs update operations
- Integrated with shared services (ResponseService, AuthenticationService, ErrorsService)
- Proper error codes and HTTP status management
- Database queries with proper filtering for soft-deleted records

### Files Modified
- `supabase/functions/news/controllers/NewsApiController.ts` - Enhanced with filtering, pagination, and search functionality
- `news_postman.json` - Updated Postman collection with comprehensive test cases
- `test_news_api.sh` - Created comprehensive test suite for news API validation

### Database Schema
- Created `public.notifications` table for global notification management
- Created `public.user_notifications` junction table for user-specific notification assignments
- Added proper foreign key relationships and unique constraints
- Implemented soft delete functionality across all tables
- Created `public.partners` table with comprehensive business information
- Added required fields: `company_name`, `tax_id`
- Added optional fields: `registration_number`, `address`, `bank_account`, `bank_name`, `business_email`, `orders_email`
- Implemented foreign key relationship to contacts table via `administrator_contact_id`
- Added `is_active` boolean field with flexible input handling
- Created `public.contacts` table with UUID primary key
- Added required fields: `first_name`, `last_name`
- Added optional fields: `phone_no`, `email`
- Implemented soft delete with `deleted_at` timestamp
- Auto-managed timestamps for `created_at` and `updated_at`

## [1.2.0] - 2025-06-22

### Added
- **Comprehensive API Test Suite** - Complete Python test suite with 100% coverage (39 tests)
  - Full CRUD testing for all endpoints (Contacts, Partners, Users, Notifications, Blank)
  - Authentication and authorization testing
  - Input validation and error handling verification
  - HTTP method validation (OPTIONS, HEAD, etc.)
  - Automated test data generation with unique timestamps
- **GitHub Actions CI/CD Integration** - Automated testing workflow
  - Runs on every push to main branch
  - Validates pull requests before merging
  - Python 3.11 environment with dependency caching
  - Test artifact upload and retention
  - Detailed success/failure reporting
- **Enhanced Documentation**
  - Comprehensive test suite documentation (`tests/README.md`)
  - Updated main README with CI/CD setup instructions
  - Test coverage metrics and status reporting
  - Troubleshooting guides and setup instructions

### Improved
- **Users API** - Fixed user creation with unique email/phone validation
- **Test Reliability** - Dynamic data generation prevents conflicts
- **Error Handling** - Better validation and response formatting
- **Status Code Validation** - Proper HTTP status codes for all endpoints

### Technical Details
- **Test Coverage**: 39 tests across 7 API modules
- **Success Rate**: 100% (39/39 tests passing)
- **CI/CD**: GitHub Actions workflow with Python 3.11
- **Dependencies**: requests>=2.31.0, colorama>=0.4.6
- **Authentication**: Supabase JWT token validation
- **Validation**: Comprehensive input validation for all endpoints

### Files Added
- `.github/workflows/api-tests.yml` - GitHub Actions workflow
- `tests/main.py` - Comprehensive API test suite
- `tests/requirements.txt` - Python dependencies
- `tests/README.md` - Testing documentation

### Files Modified
- `README.md` - Added CI/CD integration and testing sections
- `CHANGELOG.md` - This changelog update

## [1.1.0] - 2025-06-19

### Added
- **Notifications API** - Complete CRUD operations for global notifications
  - Create, read, update, delete notifications
  - User information integration with automatic name/email population
  - Soft delete functionality
  - Authentication and user-scoped access control
- **Partners API** - Full business partner management
  - Complete CRUD operations with administrator contact integration
  - Flexible boolean handling for is_active field
  - Comprehensive validation for business data
  - UUID validation for contact references
  - Email format validation for business and orders emails
- **Users API** - Comprehensive user management system
  - Role-based access control (admin/user/moderator)
  - User creation, updates, and administrative functions
  - Password reset capabilities
  - Self-service profile updates with restrictions
- **Contacts API** - Enhanced contact management
  - Full CRUD operations with validation
  - Email format validation
  - Soft delete functionality
  - Partial updates support

### Technical Features
- **Authentication** - Supabase JWT token validation across all endpoints
- **Validation** - Comprehensive input validation with detailed error messages
- **Error Handling** - Proper HTTP status codes and error responses
- **Database Integration** - Full Supabase integration with proper relationships
- **Soft Deletes** - Non-destructive deletion across all resources

## [1.0.0] - 2025-06-09

### Added
- **Initial Backend Setup** - Supabase Edge Functions foundation
- **Basic API Structure** - Controller pattern with shared services
- **Authentication Service** - JWT token validation
- **Response Service** - Standardized API responses
- **Error Handling** - Centralized error management
- **CORS Support** - Cross-origin request handling
- **Blank API Template** - Example implementation for new endpoints

### Infrastructure
- **Supabase Configuration** - Edge Functions deployment setup
- **TypeScript Support** - Full TypeScript implementation
- **Shared Services** - Reusable authentication, validation, and response services
- **Project Structure** - Organized codebase with separation of concerns

---

## Version History Summary

- **v1.2.0** - Complete test automation and CI/CD integration
- **v1.1.0** - Full API implementation with all CRUD operations
- **v1.0.0** - Initial backend foundation and architecture 