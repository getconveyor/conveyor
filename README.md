# Conveyor

A unified **ETL and data management platform** for seamless data integration, transformation, and governance. Connect to multiple data sources, build scalable pipelines, apply transformations, and manage data workflows with a modern web-based interface.

## Features

- **Data Integration**: Connect to databases (MySQL, PostgreSQL, MongoDB), cloud storage (S3, MinIO), REST APIs, and data warehouses
- **Pipeline Management**: Create, schedule, and monitor data workflows with full lifecycle management
- **Data Transformation**: Filtering, mapping, aggregation, joins, pivots, and custom logic
- **Data Lake**: Centralized storage and organization in multiple formats (Parquet, CSV, JSON, Avro, ORC, Delta Lake)
- **Multi-Tenancy**: Workspace-level isolation and user management
- **Real-time Streaming**: WebSocket support for real-time updates
- **Security**: JWT authentication, password encryption, role-based access control (RBAC)

## Tech Stack

**Backend**: Django 4.2 | **API**: Django REST Framework | **Database**: PostgreSQL 15 | **Caching**: Redis 7 | **Task Queue**: Celery 5 | **Real-time**: Django Channels

**Frontend**: Next.js 15 | **UI**: Radix UI + Tailwind CSS | **Forms**: React Hook Form | **HTTP**: axios

**Infrastructure**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Python 3.10+ (for local development)
- Node.js 18+ (for frontend development)

### Docker Setup (Recommended)

```bash
git clone <repository-url>
cd conveyor

# Create .env in conveyor-server/
cp conveyor-server/.env.example conveyor-server/.env
# Edit conveyor-server/.env with your configuration

# Start all services
docker compose up -d

# Run migrations
docker compose exec server python manage.py migrate

# Create superuser
docker compose exec server python manage.py createsuperuser
```

Access the application:

- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

## Documentation

- **API Reference**: Available at `/api/docs/` (Swagger UI)
- **Deployment**: See [DEPLOYMENT_GUIDE.md](conveyor-server/DEPLOYMENT_GUIDE.md)
- **Frontend**: See [conveyor-web/README.md](conveyor-web/README.md)

## Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request.

## License

Licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

---

**Backend**: Django 4.2 | **Frontend**: Next.js 15 | **Database**: PostgreSQL 15
