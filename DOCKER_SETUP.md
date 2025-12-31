# Conveyor Platform - Docker Setup Guide

This guide explains how to run the entire Conveyor platform using Docker and Docker Compose.

## Architecture Overview

The platform consists of the following services:

- **web** - Next.js frontend application (port 3000)
- **server** - Django REST API backend (port 8000)
- **postgres** - PostgreSQL database (port 5432)
- **redis** - Redis cache & Celery broker (port 6379)
- **minio** - MinIO object storage (ports 9000, 9001)
- **celery-worker** - Background task worker
- **celery-beat** - Scheduled task scheduler

## Prerequisites

- Docker 20.10 or higher
- Docker Compose 2.0 or higher
- At least 4GB of available RAM

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd conveyor-web
```

### 2. Create Environment File

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

**Important:** Update the following values in `.env`:

- `SECRET_KEY` - Generate a secure random key for Django
- `POSTGRES_PASSWORD` - Set a strong database password
- `MINIO_ROOT_PASSWORD` - Set a strong MinIO password

To generate a secure Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Build and Start Services

Build all Docker images and start the services:

```bash
docker-compose up --build
```

Or run in detached mode:

```bash
docker-compose up -d --build
```

### 4. Initialize the Database

The database will be automatically migrated on first run. To create a superuser:

```bash
docker-compose exec server python manage.py createsuperuser
```

### 5. Access the Platform

- **Frontend (Next.js):** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Django Admin:** http://localhost:8000/admin
- **API Documentation:** http://localhost:8000/api-auth
- **MinIO Console:** http://localhost:9001

## Development Workflow

### View Running Services

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f web
docker-compose logs -f celery-worker
```

### Stop Services

```bash
docker-compose stop
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart server
```

### Stop and Remove Containers

```bash
docker-compose down
```

### Stop and Remove Everything (including volumes)

```bash
docker-compose down -v
```

## Running Django Management Commands

### Run Migrations

```bash
docker-compose exec server python manage.py migrate
```

### Create Superuser

```bash
docker-compose exec server python manage.py createsuperuser
```

### Collect Static Files

```bash
docker-compose exec server python manage.py collectstatic --noinput
```

### Open Django Shell

```bash
docker-compose exec server python manage.py shell
```

### Create New Django App

```bash
docker-compose exec server python manage.py startapp <app_name>
```

## Database Management

### Access PostgreSQL CLI

```bash
docker-compose exec postgres psql -U conveyor -d conveyor
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U conveyor conveyor > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U conveyor conveyor < backup.sql
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm conveyor-web_postgres_data

# Start services (will create fresh database)
docker-compose up -d

# Run migrations
docker-compose exec server python manage.py migrate

# Create superuser
docker-compose exec server python manage.py createsuperuser
```

## Redis Management

### Access Redis CLI

```bash
docker-compose exec redis redis-cli
```

### Clear Redis Cache

```bash
docker-compose exec redis redis-cli FLUSHALL
```

## MinIO Object Storage

### Access MinIO Console

1. Open http://localhost:9001
2. Login with:
   - Username: `minioadmin` (or value from MINIO_ROOT_USER)
   - Password: `minioadmin` (or value from MINIO_ROOT_PASSWORD)

### Create Initial Bucket

MinIO bucket can be created via the console or using the Django shell:

```python
# In Django shell
from django.conf import settings
import boto3

s3_client = boto3.client(
    's3',
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY
)

s3_client.create_bucket(Bucket='conveyor-storage')
```

## Celery Tasks

### View Celery Worker Logs

```bash
docker-compose logs -f celery-worker
```

### View Celery Beat Logs

```bash
docker-compose logs -f celery-beat
```

### Restart Celery Worker

```bash
docker-compose restart celery-worker
```

## Troubleshooting

### Service Won't Start

Check logs for the specific service:

```bash
docker-compose logs <service-name>
```

### Database Connection Issues

Ensure PostgreSQL is healthy:

```bash
docker-compose ps postgres
```

Check logs:

```bash
docker-compose logs postgres
```

### Port Already in Use

If you get a port conflict, update the port mapping in `.env`:

```bash
WEB_PORT=3001
SERVER_PORT=8001
POSTGRES_PORT=5433
```

### Rebuild After Code Changes

For Django server:

```bash
docker-compose up -d --build server
```

For Next.js web:

```bash
docker-compose up -d --build web
```

### Clear Everything and Start Fresh

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all Docker images for the project
docker-compose rm -f
docker rmi conveyor-web-server conveyor-web-web

# Rebuild and start
docker-compose up --build -d
```

## Production Deployment

### Environment Variables

Update `.env` with production values:

```bash
DEBUG=False
NODE_ENV=production
SECRET_KEY=<your-production-secret-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Use Production Database

Update database credentials in `.env`:

```bash
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_DB=conveyor_prod
POSTGRES_USER=conveyor_prod
POSTGRES_PASSWORD=<strong-password>
```

### SSL/TLS

Add a reverse proxy (nginx or Traefik) in front of the services to handle SSL termination.

### Health Checks

Monitor service health:

```bash
docker-compose ps
```

Check individual service health:

```bash
# Server health
curl http://localhost:8000/admin/

# PostgreSQL
docker-compose exec postgres pg_isready -U conveyor

# Redis
docker-compose exec redis redis-cli ping
```

## Performance Optimization

### Scale Services

Scale Celery workers:

```bash
docker-compose up -d --scale celery-worker=3
```

### Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Celery Documentation](https://docs.celeryq.dev/)
- [MinIO Documentation](https://min.io/docs/)
