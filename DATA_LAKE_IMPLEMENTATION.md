# Data Lake Implementation Summary

## Overview
The Data Lake module provides a comprehensive file storage and management system integrated with MinIO (S3-compatible) object storage. It supports multiple file formats, schema management, and tiered storage.

## Components Implemented

### 1. Database Models
**Location:** `conveyor-server/data_lake/models.py`

#### File
- Stores metadata for files in the data lake
- Supports formats: Parquet, CSV, JSON, Avro, ORC, Delta Lake, Table
- Tracks size, rows, columns, storage URL
- Links to folders and schemas

#### Folder
- Hierarchical organization of files
- Parent-child relationships
- Auto-calculates total size

#### Schema
- JSON schema definitions for data validation
- Version tracking
- Tracks associated tables/files

#### StorageZone
- Tiered storage management (Hot, Warm, Cold)
- Capacity and usage tracking
- Status monitoring

### 2. S3/MinIO Storage Integration
**Location:** `conveyor-server/data_lake/storage.py`

The `S3Storage` class provides:
- File upload with metadata
- Presigned URL generation for secure downloads
- File deletion
- File listing and metadata retrieval
- File copying within workspace
- Automatic bucket creation
- Workspace-based file organization

**Configuration:** `conveyor-server/conveyor_server/settings.py:306-321`
```python
AWS_S3_ENDPOINT_URL = 'http://minio:9000'
AWS_ACCESS_KEY_ID = 'minioadmin'
AWS_SECRET_ACCESS_KEY = 'minioadmin'
AWS_STORAGE_BUCKET_NAME = 'conveyor-storage'
```

### 3. REST API Endpoints

#### Files (`/api/data-lake/files/`)
- **GET** - List files with search and filters
  - Query params: `search`, `format`, `folder`
- **POST** - Create file record
- **PUT/PATCH** - Update file metadata
- **DELETE** - Delete file (removes from S3 and database)
- **POST** `/upload/` - Upload file to MinIO
  - Body: `file`, `name`, `folder`, `format`, `schema`
- **GET** `/{id}/download/` - Get presigned download URL
  - Returns URL valid for 1 hour
- **GET** `/{id}/preview/` - Preview file contents

#### Folders (`/api/data-lake/folders/`)
- **GET** - List folders
- **POST** - Create folder
- **PUT/PATCH** - Update folder
- **DELETE** - Delete folder
- **GET** `/{id}/contents/` - Get folder contents (files & subfolders)

#### Schemas (`/api/data-lake/schemas/`)
- **GET** - List schemas with search
- **POST** - Create schema
- **PUT/PATCH** - Update schema
- **DELETE** - Delete schema
- **POST** `/{id}/duplicate/` - Duplicate schema
- **GET** `/{id}/tables/` - Get files using schema

#### Storage Zones (`/api/data-lake/storage-zones/`)
- **GET** - List storage zones
- **POST** - Create storage zone
- **PUT/PATCH** - Update zone
- **DELETE** - Delete zone
- **POST** `/{id}/update_metrics/` - Update usage metrics

#### Statistics (`/api/data-lake/stats/`)
- **GET** `/` - Overall storage statistics
  - Total files, folders, size
  - Files by format
  - Recent files
- **GET** `/dashboard/` - Dashboard statistics
  - Storage distribution by format
  - Storage zones status
  - Recent activity

### 4. Frontend Integration

The frontend pages are ready to consume these APIs:
- `/data-lake/` - Dashboard with stats and quick actions
- `/data-lake/explorer/` - File browser with upload/download
- `/data-lake/files/` - File management
- `/data-lake/schemas/` - Schema management
- `/data-lake/storage/` - Storage zone monitoring

## Docker Infrastructure

### MinIO Service (docker-compose.yml:43-63)
```yaml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"    # API
    - "9001:9001"    # Console
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
```

**Access:**
- API: http://localhost:9000
- Console: http://localhost:9001
- Credentials: minioadmin / minioadmin

### Server Configuration (docker-compose.yml:66-121)
Environment variables for S3 integration:
```yaml
S3_ENDPOINT: http://minio:9000
S3_ACCESS_KEY: minioadmin
S3_SECRET_KEY: minioadmin
S3_BUCKET: conveyor-storage
```

## Usage Examples

### 1. Upload a File
```bash
curl -X POST http://localhost:8000/api/data-lake/files/upload/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID" \
  -F "file=@/path/to/file.csv" \
  -F "name=customer_data.csv" \
  -F "format=csv"
```

### 2. Get Download URL
```bash
curl -X GET http://localhost:8000/api/data-lake/files/{file_id}/download/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID"
```

### 3. List Files
```bash
curl -X GET "http://localhost:8000/api/data-lake/files/?search=customer&format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID"
```

### 4. Create Schema
```bash
curl -X POST http://localhost:8000/api/data-lake/schemas/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "customer_schema",
    "version": "v1.0",
    "description": "Customer data schema",
    "schema_definition": {
      "type": "object",
      "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"},
        "email": {"type": "string"}
      }
    }
  }'
```

### 5. Get Storage Statistics
```bash
curl -X GET http://localhost:8000/api/data-lake/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Workspace-ID: YOUR_WORKSPACE_ID"
```

## File Organization in S3/MinIO

Files are organized by workspace:
```
conveyor-storage/
├── workspace_{workspace_id}/
│   ├── customer_data.csv
│   ├── sales_data.parquet
│   └── events.json
```

## Security Features

1. **Workspace Isolation**: All files are organized by workspace ID
2. **Presigned URLs**: Temporary download URLs with 1-hour expiration
3. **JWT Authentication**: All endpoints require valid JWT token
4. **Workspace Header**: `X-Workspace-ID` header required for all requests
5. **Permission Checks**: WorkspacePermission ensures users can only access their workspace data

## Database Migrations

Run migrations to create the database tables:
```bash
cd conveyor-server
python manage.py makemigrations data_lake
python manage.py migrate
```

## Starting the Stack

```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f server

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Environment Variables

All environment variables are documented in `.env.example`. Copy to `.env` and customize:

```bash
cp .env.example .env
```

Key variables for Data Lake:
- `S3_ENDPOINT` - MinIO endpoint URL
- `S3_ACCESS_KEY` - MinIO access key
- `S3_SECRET_KEY` - MinIO secret key
- `S3_BUCKET` - Storage bucket name
- `S3_REGION` - AWS region (for compatibility)

## Admin Interface

All models are registered in Django admin:
- Access: http://localhost:8000/admin/
- Navigate to "Data Lake" section
- Manage files, folders, schemas, and storage zones

## Next Steps

1. **File Preview**: Implement preview functionality for CSV/Parquet/JSON files
2. **Schema Validation**: Add automatic schema validation on file upload
3. **Data Transformation**: Integrate with transformation module for ETL
4. **Analytics**: Connect to analytics module for data analysis
5. **Lifecycle Policies**: Implement automatic tiering (hot → warm → cold)
6. **Compression**: Add automatic file compression for long-term storage

## Troubleshooting

### MinIO Connection Issues
- Ensure MinIO container is running: `docker-compose ps`
- Check MinIO logs: `docker-compose logs minio`
- Access MinIO console: http://localhost:9001

### File Upload Failures
- Check server logs: `docker-compose logs server`
- Verify workspace ID header is set
- Ensure bucket exists (auto-created on first upload)
- Check file size limits

### Database Issues
- Run migrations: `docker-compose exec server python manage.py migrate`
- Check PostgreSQL: `docker-compose exec postgres psql -U conveyor`

## API Documentation

Full API documentation available at:
- Browsable API: http://localhost:8000/api/data-lake/
- Swagger/OpenAPI: (can be added with drf-spectacular)

## Performance Considerations

1. **Large Files**: Use chunked uploads for files > 100MB
2. **Presigned URLs**: Cache URLs and reuse within expiration window
3. **Pagination**: Use pagination for large file listings
4. **Indexing**: Database indexes on workspace_id, format, created_at
5. **Caching**: Redis cache for frequently accessed metadata

## Monitoring

Monitor via:
- Django Admin: http://localhost:8000/admin/data_lake/
- MinIO Console: http://localhost:9001
- Storage Zones API: `/api/data-lake/storage-zones/`
- Statistics API: `/api/data-lake/stats/dashboard/`
