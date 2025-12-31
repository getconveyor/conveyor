# Docker Compose Run Guide

This guide explains how to run the Conveyor application using Docker Compose. The stack includes:
- **Web**: Next.js frontend (Port 3000)
- **Server**: Django backend (Port 8000)
- **Postgres**: Database (Port 5432)
- **Redis**: Caching (Port 6379)
- **MinIO**: Object Storage (Port 9000/9001)

## Prerequisites
- Docker and Docker Compose installed.

## Starting the Application
To start all services, run:
```bash
docker compose up --build
```

- `--build` ensures that the latest changes in the code are rebuilt into the containers.
> **Note**: The Frontend (`web`) is configured for production-like performance. It does not hot-reload code changes. You must rebuild (`docker compose up -d --build web`) to see frontend changes. The Backend (`server`) is configured to reload changes automatically.

## Access Points
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin**: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001)

## Environment Variables
The application uses default environment variables suitable for local development.
- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000` (Browser -> Backend Communication)
- `DEBUG` in backend defaults to `False`. To enable debug mode (and local media serving), you can set `DEBUG=True` in `docker-compose.yml`.

## Troubleshooting
- **Static Files**: If the admin panel looks broken, static files might not be served correctly. We have enabled `whitenoise` to serve static files even when `DEBUG=False`.
- **Database Connectivity**: The services wait for the database to be healthy before starting.
- **Client Connectivity**: The frontend communicates with the backend via the browser at `http://localhost:8000`. Ensure port 8000 is not blocked.

## Architecture Links
- **Web -> Server**: linked via client-side requests to `localhost:8000`.
- **Server -> Postgres**: linked internally via `postgres` hostname.
- **Server -> Redis**: linked internally via `redis` hostname.
- **Server -> MinIO**: linked internally via `minio` hostname (configuration ready, usage pending support in app).
