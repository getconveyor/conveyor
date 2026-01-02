# Conveyor - Unified Data Platform

Conveyor is a comprehensive **ETL (Extract, Transform, Load) and data management platform** designed for seamless data integration, transformation, analytics, and governance. It provides a modern, scalable architecture for managing data workflows across multiple sources and destinations.

## 🌟 Features

### Core Capabilities

- **Data Integration**: Connect to multiple data sources (MySQL, PostgreSQL, MongoDB, S3, REST APIs, Salesforce, Snowflake, BigQuery, Redshift)
- **Pipeline Management**: Create, schedule, and monitor data pipelines with full lifecycle management
- **Data Transformation**: Apply complex transformations including filtering, mapping, aggregation, joins, pivots, and custom logic
- **Data Lake**: Centralized storage and organization of processed data in multiple formats (Parquet, CSV, JSON, Avro, ORC, Delta Lake)
- **Analytics & Monitoring**: Track pipeline performance, data quality metrics, and system health
- **Multi-Tenancy**: Support for multiple workspaces with workspace-level isolation and user management
- **Real-time Streaming**: WebSocket support for real-time data updates
- **Security & Encryption**: Password encryption, JWT authentication, role-based access control (RBAC)

## 📦 Tech Stack

### Backend

- **Framework**: Django 4.2.27
- **API**: Django REST Framework 3.14.0
- **Database**: PostgreSQL 15 (primary), MySQL support via PyMySQL
- **Caching**: Redis 7
- **Job Queue**: Celery 5.3.4 with Redis backend
- **Real-time**: Django Channels 4.0.0 with channels-redis
- **API Docs**: drf-spectacular 0.27.0 (Swagger UI)
- **Authentication**: JWT tokens (djangorestframework-simplejwt)
- **Storage**: MinIO (S3-compatible), AWS S3 support via boto3
- **Data Processing**: pandas 2.2.2, jsonschema 4.23.0, Pydantic 2.10.3
- **Encryption**: cryptography 46.0.3
- **Task Scheduling**: croniter 2.0.1

### Frontend

- **Framework**: Next.js 15+ with TypeScript
- **UI Components**: Radix UI (comprehensive headless component library)
- **Styling**: Tailwind CSS
- **Drag & Drop**: dnd-kit (sortable, modifiers, utilities)
- **Forms**: react-hook-form with validation
- **State Management**: React Context API
- **HTTP Client**: axios
- **Notifications**: sonner (toast notifications)
- **Code Quality**: ESLint

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Web Server**: Gunicorn (production), Daphne (WebSocket support)
- **Static Files**: WhiteNoise 6.6.0
- **CORS**: django-cors-headers for frontend integration

## 🏗️ Project Structure

```
conveyor/
├── conveyor-server/              # Django backend application
│   ├── authentication/           # User & workspace management
│   │   ├── models.py            # User, Workspace models
│   │   ├── serializers.py       # REST serializers
│   │   ├── views.py             # Authentication endpoints
│   │   ├── permissions.py       # Custom permissions
│   │   └── urls.py              # URL routing
│   │
│   ├── integration/              # Data source & pipeline management
│   │   ├── models.py            # Source, Pipeline, PipelineRun, Schedule
│   │   ├── views.py             # REST endpoints for sources/pipelines
│   │   ├── tasks.py             # Celery tasks for pipeline execution
│   │   ├── connectors/          # Database and API connectors
│   │   │   ├── base.py          # Base connector interface
│   │   │   ├── mysql.py         # MySQL connector
│   │   │   ├── postgresql.py    # PostgreSQL connector
│   │   │   ├── rest_api.py      # REST API connector
│   │   │   ├── file.py          # S3/file connector
│   │   │   └── factory.py       # Connector factory
│   │   ├── utils/               # Encryption, validation utilities
│   │   ├── exceptions.py        # Custom exceptions
│   │   └── urls.py              # API routes
│   │
│   ├── transformation/           # Data transformation logic
│   │   ├── models.py            # Transformation, TransformationRule
│   │   ├── views.py             # Transformation endpoints
│   │   └── serializers.py       # Transformation serializers
│   │
│   ├── data_lake/               # Data storage & organization
│   │   ├── models.py            # Folder, File, Dataset models
│   │   ├── views.py             # Data lake endpoints
│   │   ├── storage.py           # Storage backend (S3, MinIO)
│   │   └── serializers.py       # Data lake serializers
│   │
│   ├── warehouse/               # Data warehouse (future expansion)
│   ├── streaming/               # Real-time streaming (future)
│   ├── analytics/               # Analytics & metrics
│   ├── data_science/            # ML/AI features (future)
│   ├── governance/              # Data governance policies
│   ├── monitoring/              # System monitoring
│   │
│   ├── conveyor_server/         # Core Django configuration
│   │   ├── settings.py          # Django settings
│   │   ├── urls.py              # Root URL configuration
│   │   ├── wsgi.py              # WSGI entry point
│   │   ├── asgi.py              # ASGI entry point (WebSockets)
│   │   ├── celery.py            # Celery configuration
│   │   ├── routing.py           # WebSocket routing
│   │   ├── exception_handler.py # Custom exception handling
│   │   └── json_error_middleware.py # JSON error responses
│   │
│   ├── requirements.txt         # Python dependencies
│   ├── manage.py                # Django management script
│   ├── db.sqlite3               # Development database
│   └── Dockerfile               # Production Docker image
│
├── conveyor-web/                # Next.js frontend application
│   ├── app/                     # Next.js 13+ app directory
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Home page with auth redirect
│   │   ├── globals.css          # Global styles
│   │   ├── (auth)/              # Authentication routes
│   │   └── (platform)/          # Platform routes
│   │
│   ├── components/              # Reusable React components
│   │   ├── app-sidebar.tsx      # Main sidebar navigation
│   │   ├── global-search.tsx    # Global search component
│   │   └── ui/                  # Radix UI component wrappers
│   │
│   ├── contexts/                # React Context providers
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── WorkspaceContext.tsx # Workspace state
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions
│   │
│   ├── package.json             # Node dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── next.config.ts           # Next.js configuration
│   ├── middleware.ts            # Next.js middleware
│   ├── eslint.config.mjs        # ESLint configuration
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── Dockerfile               # Docker image for frontend
│   └── README.md                # Frontend documentation
│
├── docker-compose.yml           # Container orchestration
├── env/                         # Python virtual environment
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.10+ (for local development)
- Node.js 18+ (for frontend development)
- PostgreSQL 15 (included in Docker Compose)
- Redis 7 (included in Docker Compose)

### Setup with Docker Compose

1. **Clone the repository**

```bash
git clone <repository-url>
cd conveyor
```

2. **Create environment configuration**
   Create a `.env` file in the `conveyor-server/` directory:

```bash
# Django settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com

# Database
POSTGRES_DB=conveyor
POSTGRES_USER=conveyor
POSTGRES_PASSWORD=secure_password
DATABASE_URL=postgresql://conveyor:secure_password@postgres:5432/conveyor

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET=your-jwt-secret

# Encryption
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")

# MinIO/S3
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
AWS_STORAGE_BUCKET_NAME=conveyor
AWS_S3_ENDPOINT_URL=http://minio:9000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Start the services**

```bash
docker compose up -d
```

4. **Run migrations**

```bash
docker compose exec server python manage.py migrate
```

5. **Create a superuser**

```bash
docker compose exec server python manage.py createsuperuser
```

6. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs/
- Django Admin: http://localhost:8000/admin/

### Local Development Setup

#### Backend Setup

```bash
cd conveyor-server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

#### Frontend Setup

```bash
cd conveyor-web

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/token/` - Obtain JWT tokens
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `POST /api/auth/token/verify/` - Verify JWT token
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login user

### Sources (Data Integration)

- `GET /api/integration/sources/` - List sources
- `POST /api/integration/sources/` - Create source
- `GET /api/integration/sources/{id}/` - Get source details
- `POST /api/integration/sources/{id}/test/` - Test source connectivity
- `GET /api/integration/sources/{id}/schema/` - Get source schema

### Pipelines

- `GET /api/integration/pipelines/` - List pipelines
- `POST /api/integration/pipelines/` - Create pipeline
- `GET /api/integration/pipelines/{id}/` - Get pipeline
- `POST /api/integration/pipelines/{id}/run/` - Execute pipeline
- `GET /api/integration/pipelines/{id}/runs/` - Pipeline run history

### Transformations

- `GET /api/transformation/` - List transformations
- `POST /api/transformation/` - Create transformation
- `GET /api/transformation/{id}/` - Get transformation
- `PATCH /api/transformation/{id}/` - Update transformation

### Data Lake

- `GET /api/data-lake/files/` - List files
- `POST /api/data-lake/files/` - Upload file
- `GET /api/data-lake/folders/` - List folders

### API Documentation

- Swagger UI: `GET /api/docs/`
- ReDoc: `GET /api/redoc/`
- OpenAPI Schema: `GET /api/schema/`

## 🔐 Security Features

- **JWT Authentication**: Token-based API authentication
- **Password Encryption**: Encrypted storage for database passwords
- **RBAC**: Role-based access control (Admin, Developer, Analyst, Viewer)
- **Multi-Tenancy**: Workspace-level isolation
- **Workspace Headers**: `X-Workspace-ID` header for multi-tenant routing
- **CORS**: Configured for frontend origin
- **CSRF Protection**: Django CSRF middleware enabled
- **SQLi Prevention**: Django ORM parameterized queries

## 🗂️ Database Models

### Core Models

**User**

- UUID primary key
- Email-based authentication
- Role-based permissions (admin, developer, analyst, viewer)
- Status tracking (active, inactive, suspended)

**Workspace**

- Multi-tenant workspace model
- Owner and member management
- Workspace-scoped resources

**Source**

- Data source connections (MySQL, PostgreSQL, MongoDB, S3, APIs, etc.)
- Encrypted credentials storage
- Connection testing and status tracking

**Pipeline**

- Data workflow definition
- Source-to-destination mapping
- Schedule and trigger configuration
- Run history and metrics

**Transformation**

- Transformation steps within pipelines
- Multiple types (filter, map, aggregate, join, pivot, custom)
- Execution order and statistics

**DataLake/File**

- Organized file storage with folder structure
- Multiple format support (Parquet, CSV, JSON, Avro, ORC, Delta)
- Workspace-scoped organization

## 🎯 Key Features by Module

### Authentication Module

- User registration and login
- JWT token management
- Workspace membership
- User roles and permissions
- Profile management

### Integration Module

- Source management (create, test, delete)
- Pipeline orchestration
- Schedule management (cron-based)
- Real-time pipeline execution
- Source schema discovery
- Connector factory pattern for extensibility

### Transformation Module

- Transformation rule engine
- Type casting and field calculations
- Row filtering and value replacement
- Column splitting and renaming
- Custom transformation support

### Data Lake Module

- Hierarchical folder structure
- File management and versioning
- Multi-format support
- Storage backend abstraction (S3, MinIO)
- Data discovery and search

### Monitoring Module

- Pipeline execution metrics
- Error tracking and alerts
- System health monitoring
- Performance analytics

## 🔄 Workflow Example

1. **Create a Source**: Connect to your database/API
2. **Test Connection**: Verify source accessibility
3. **Create a Pipeline**: Define data flow from source to destination
4. **Add Transformations**: Apply data transformations
5. **Configure Schedule**: Set execution frequency
6. **Monitor Runs**: Track pipeline execution and metrics
7. **Access Data Lake**: Retrieve processed data

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd conveyor-server
python manage.py test

# Frontend tests
cd conveyor-web
npm test
```

### Code Quality

```bash
# Backend linting
cd conveyor-server
flake8 .

# Frontend linting
cd conveyor-web
npm run lint
```

### Django Shell

```bash
docker compose exec server python manage.py shell
```

### Database Migrations

```bash
# Create migration
docker compose exec server python manage.py makemigrations

# Apply migration
docker compose exec server python manage.py migrate
```

## 📋 Environment Variables

### Backend (.env in conveyor-server/)

```env
# Core
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/conveyor
POSTGRES_DB=conveyor
POSTGRES_USER=conveyor
POSTGRES_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ALGORITHM=HS256

# Encryption
ENCRYPTION_KEY=your-encryption-key

# Storage
AWS_STORAGE_BUCKET_NAME=conveyor
AWS_S3_ENDPOINT_URL=http://minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local in conveyor-web/)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🚢 Deployment

See [conveyor-server/DEPLOYMENT_GUIDE.md](conveyor-server/DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions.

### Docker Production Build

```bash
docker build -f conveyor-server/Dockerfile -t conveyor-server:latest .
docker build -f conveyor-web/Dockerfile -t conveyor-web:latest ./conveyor-web
docker compose up -d
```

## 📚 Documentation

- **API Documentation**: Available at `/api/docs/` (Swagger UI)
- **Backend Guide**: See `conveyor-server/DEPLOYMENT_GUIDE.md`
- **Frontend README**: See `conveyor-web/README.md`

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**

```bash
# Check database service
docker compose ps postgres

# View database logs
docker compose logs postgres
```

**Redis Connection Error**

```bash
# Check Redis service
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping
```

**Migration Issues**

```bash
# Check migration status
docker compose exec server python manage.py showmigrations

# Rollback migration
docker compose exec server python manage.py migrate app_name 0001
```

**Static Files Not Loading**

```bash
# Collect static files
docker compose exec server python manage.py collectstatic --noinput
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 📞 Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Last Updated**: January 2, 2026
**Backend**: Django 4.2.27 | **Frontend**: Next.js 15+ | **Database**: PostgreSQL 15
