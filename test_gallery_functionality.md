# Gallery Functionality Test Guide

## Overview
This guide demonstrates how to test the complete gallery functionality for venues, including image upload, management, and integration with the venues API.

## Prerequisites
- Supabase Storage bucket `venue-galleries` must be created
- Database tables: `galleries`, `gallery_images`, `venues` (with `gallery_id` field)
- Authentication token for API requests

## API Endpoints

### 1. Upload Images to Gallery
**POST** `/functions/v1/gallery/upload`

#### Request Body:
```json
{
  "venue_id": "venue-uuid-here",
  "images": [
    {
      "file_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
      "file_name": "venue-image-1.jpg",
      "mime_type": "image/jpeg",
      "is_primary": true,
      "display_order": 1
    },
    {
      "file_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "file_name": "venue-image-2.png",
      "mime_type": "image/png",
      "is_primary": false,
      "display_order": 2
    }
  ]
}
```

#### Response:
```json
{
  "success": true,
  "data": {
    "gallery_id": "gallery-uuid-here",
    "uploaded_images": [
      {
        "id": "image-uuid-1",
        "path": "gallery-uuid/timestamp-venue-image-1.jpg",
        "url": "https://supabase-storage-url/venue-galleries/gallery-uuid/timestamp-venue-image-1.jpg",
        "file_name": "venue-image-1.jpg",
        "display_order": 1,
        "is_primary": true
      },
      {
        "id": "image-uuid-2",
        "path": "gallery-uuid/timestamp-venue-image-2.png",
        "url": "https://supabase-storage-url/venue-galleries/gallery-uuid/timestamp-venue-image-2.png",
        "file_name": "venue-image-2.png",
        "display_order": 2,
        "is_primary": false
      }
    ],
    "total_images": 2
  }
}
```

### 2. List Gallery Images
**GET** `/functions/v1/gallery/{galleryId}/images`

#### Response:
```json
{
  "success": true,
  "data": {
    "gallery_id": "gallery-uuid-here",
    "name": "Venue gallery-uuid Gallery",
    "description": null,
    "venue_id": "venue-uuid-here",
    "images": [
      {
        "id": "image-uuid-1",
        "file_name": "venue-image-1.jpg",
        "file_path": "gallery-uuid/timestamp-venue-image-1.jpg",
        "file_size": 12345,
        "mime_type": "image/jpeg",
        "display_order": 1,
        "is_primary": true,
        "url": "https://supabase-storage-url/venue-galleries/gallery-uuid/timestamp-venue-image-1.jpg",
        "created_at": "2023-10-01T12:00:00.000Z",
        "updated_at": "2023-10-01T12:00:00.000Z"
      },
      {
        "id": "image-uuid-2",
        "file_name": "venue-image-2.png",
        "file_path": "gallery-uuid/timestamp-venue-image-2.png",
        "file_size": 6789,
        "mime_type": "image/png",
        "display_order": 2,
        "is_primary": false,
        "url": "https://supabase-storage-url/venue-galleries/gallery-uuid/timestamp-venue-image-2.png",
        "created_at": "2023-10-01T12:00:00.000Z",
        "updated_at": "2023-10-01T12:00:00.000Z"
      }
    ],
    "total_images": 2,
    "created_at": "2023-10-01T12:00:00.000Z",
    "updated_at": "2023-10-01T12:00:00.000Z"
  }
}
```

### 3. Delete Images from Gallery
**DELETE** `/functions/v1/gallery/delete`

#### Request Body:
```json
{
  "gallery_id": "gallery-uuid-here",
  "image_ids": ["image-uuid-2"]
}
```

#### Response:
```json
{
  "success": true,
  "data": {
    "deleted_images": 1,
    "remaining_images": 1,
    "gallery_id": "gallery-uuid-here"
  }
}
```

### 4. Create Venue with Gallery
**POST** `/functions/v1/venues`

#### Request Body:
```json
{
  "name": "Test Restaurant",
  "city": "New York",
  "address": "123 Main Street",
  "gallery_id": "gallery-uuid-here",
  "is_active": true
}
```

### 5. Update Venue Gallery
**PUT** `/functions/v1/venues/{venueId}`

#### Request Body:
```json
{
  "gallery_id": "new-gallery-uuid-here"
}
```

## Testing Workflow

### Step 1: Create Gallery and Upload Images
```bash
curl -X POST "http://localhost:54321/functions/v1/gallery/upload" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "venue_id": "venue-uuid-here",
    "images": [
      {
        "file_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
        "file_name": "main-image.jpg",
        "mime_type": "image/jpeg",
        "is_primary": true,
        "display_order": 1
      }
    ]
  }'
```

### Step 2: List Gallery Images
```bash
curl -X GET "http://localhost:54321/functions/v1/gallery/GALLERY_ID/images" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Step 3: Create Venue with Gallery
```bash
curl -X POST "http://localhost:54321/functions/v1/venues" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Restaurant",
    "city": "New York",
    "address": "123 Main Street",
    "gallery_id": "GALLERY_ID_FROM_STEP_1",
    "is_active": true
  }'
```

### Step 4: Get Venue with Gallery Info
```bash
curl -X GET "http://localhost:54321/functions/v1/venues/VENUE_ID" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Step 5: Add More Images to Gallery
```bash
curl -X POST "http://localhost:54321/functions/v1/gallery/upload" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gallery_id": "GALLERY_ID_FROM_STEP_1",
    "images": [
      {
        "file_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        "file_name": "additional-image.png",
        "mime_type": "image/png",
        "is_primary": false,
        "display_order": 2
      }
    ]
  }'
```

### Step 6: Delete an Image
```bash
curl -X DELETE "http://localhost:54321/functions/v1/gallery/delete" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gallery_id": "GALLERY_ID",
    "image_ids": ["IMAGE_ID_TO_DELETE"]
  }'
```

## Database Tables

### galleries table
```sql
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  description TEXT,
  venue_id UUID REFERENCES venues(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### gallery_images table
```sql
CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES galleries(id),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### venues table (updated)
```sql
ALTER TABLE venues ADD COLUMN gallery_id UUID REFERENCES galleries(id);
```

## Validation Rules

### Upload Validation
- **Minimum images**: 1 (at least one image required)
- **Maximum images**: 6 (per gallery)
- **File size**: Maximum 5MB per image
- **File types**: JPEG, PNG, WebP only
- **Primary image**: Only one image can be marked as primary
- **Display order**: Must be positive numbers

### Delete Validation
- **Minimum images**: Cannot delete all images (at least 1 must remain)
- **Gallery existence**: Gallery must exist
- **Image existence**: Images must exist in the specified gallery

## Error Handling

### Common Errors

#### 1. Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      "At least 1 image is required",
      "Image 1: file_data is required and must be a base64 string",
      "Image 2: mime_type must be one of: image/jpeg, image/png, image/webp"
    ]
  }
}
```

#### 2. File Too Large
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      "Image 1: File size must be less than 5MB"
    ]
  }
}
```

#### 3. Gallery Full
```json
{
  "success": false,
  "error": "Cannot upload 3 images. Gallery already has 4 images. Maximum allowed: 6",
  "code": "VALIDATION_ERROR",
  "details": {
    "current_count": 4,
    "max_allowed": 6
  }
}
```

#### 4. Cannot Delete All Images
```json
{
  "success": false,
  "error": "Cannot delete all images. At least one image must remain in the gallery",
  "code": "VALIDATION_ERROR",
  "details": {
    "min_images": 1
  }
}
```

## Frontend Integration

### React Component Example
```jsx
import React, { useState } from 'react';

const GalleryUpload = ({ venueId, onUploadComplete }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        setImages(prev => [...prev, {
          file_data: base64Data,
          file_name: file.name,
          mime_type: file.type,
          is_primary: index === 0,
          display_order: index + 1
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (images.length === 0) return;
    
    setUploading(true);
    
    try {
      const response = await fetch('/functions/v1/gallery/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venue_id: venueId,
          images: images
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        onUploadComplete(result.data);
        setImages([]);
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <button onClick={handleUpload} disabled={uploading || images.length === 0}>
        {uploading ? 'Uploading...' : `Upload ${images.length} Images`}
      </button>
    </div>
  );
};
```

## Best Practices

### 1. Image Optimization
- Compress images before upload
- Use appropriate formats (JPEG for photos, PNG for graphics)
- Consider WebP for better compression

### 2. Error Handling
- Always validate file types and sizes on frontend
- Provide clear error messages to users
- Handle network failures gracefully

### 3. UX Considerations
- Show upload progress
- Allow drag-and-drop image upload
- Provide image preview before upload
- Enable image reordering

### 4. Performance
- Implement lazy loading for gallery images
- Use image thumbnails for list views
- Consider image CDN for production

## Testing Checklist

- [ ] Upload single image to new gallery
- [ ] Upload multiple images to new gallery
- [ ] Upload images to existing gallery
- [ ] List gallery images
- [ ] Delete single image from gallery
- [ ] Delete multiple images from gallery
- [ ] Try to delete all images (should fail)
- [ ] Upload images exceeding max limit (should fail)
- [ ] Upload file too large (should fail)
- [ ] Upload unsupported file type (should fail)
- [ ] Create venue with gallery_id
- [ ] Update venue gallery_id
- [ ] Get venue with gallery info
- [ ] Handle authentication errors
- [ ] Handle network errors 