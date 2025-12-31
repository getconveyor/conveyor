# Conveyor - Enterprise Data Platform

A comprehensive, production-ready data platform that unifies data integration, transformation, analytics, and governance. Built with Next.js 16 and modern UI components, delivering an experience comparable to AWS Glue, Microsoft Fabric, BigQuery, and Databricks.

## 🎯 **Investor Demo Ready**

This application is **fully functional** with production-quality UI/UX and realistic mock data. Perfect for demonstrations, investor pitches, and user testing. See [INVESTOR_DEMO_REVIEW.md](./INVESTOR_DEMO_REVIEW.md) for complete details.

## ✨ Key Features

### **Core Platform Services**

- 🔄 **Data Integration** - ETL/ELT pipelines with play/pause controls, scheduling, and monitoring
- ⚡ **Data Transformation** - Jupyter-style notebooks, workflow builder, and job orchestration
- 🗄️ **Data Lake** - File explorer, schema management, and storage configuration
- 🏢 **Data Warehouse** - Interactive SQL editor with query history and CSV export
- 📊 **Real-Time Analytics** - Streaming jobs, event hubs, live dashboards, and alerting
- 📈 **Data Analytics** - Dashboard builder, reports, and workbooks
- 🧠 **Data Science** - ML model management, experiment tracking, and deployments
- 🛡️ **Data Governance** - Data catalog, lineage tracking, and access control
- 📡 **Monitoring** - System health, pipeline runs, and alert management

### **User Experience**

- 🔍 **Global Search** - Keyboard shortcut (⌘K/Ctrl+K) to search across all platform resources
- 🌓 **Dark Mode** - Full dark mode support throughout the application
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Fast Navigation** - Collapsible sidebar with organized sections
- 🎨 **Modern UI** - Professional design using shadcn/ui components
- 🔔 **Notifications** - Notification center with preferences management

### **Demo Capabilities**

- ✅ **Full CRUD Operations** - Create, read, update, and delete for all resources
- ✅ **Interactive Controls** - Play/pause pipelines, enable/disable alerts, run queries
- ✅ **Realistic Mock Data** - Comprehensive sample data for compelling demonstrations
- ✅ **Loading States** - Simulated API calls with proper loading indicators
- ✅ **Form Validation** - Complete forms with validation and error handling
- ✅ **Dialogs & Modals** - Confirmation dialogs, creation wizards, and detail views

## Getting Started

First, install the dependencies:

```bash
yarn install
```

Then, run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. The app will automatically redirect to the dashboard at `/dashboard`.

## 🐳 Docker Deployment

Build and run the application using Docker:

### Using Docker directly:

```bash
# Build the Docker image
docker build -t conveyor-frontend:latest .

# Run the container
docker run -p 3000:3000 conveyor-frontend:latest

# Or run in detached mode
docker run -d -p 3000:3000 --name conveyor-frontend conveyor-frontend:latest
```

### Using Docker Compose:

```bash
# Build and start the container
docker-compose up -d

# Stop the container
docker-compose down

# View logs
docker-compose logs -f
```

### Using the build script:

```bash
# Make the script executable (first time only)
chmod +x docker-build.sh

# Run the build script
./docker-build.sh
```

Access the application at [http://localhost:3000](http://localhost:3000)

## 🎬 Quick Demo Guide

### **Showcase Pipeline Management**
1. Navigate to **Data Integration** → **Pipelines**
2. Click "Create Pipeline" to show the creation flow
3. Use Play/Pause controls on existing pipelines
4. Filter by status and search
5. Edit or duplicate a pipeline

### **Demonstrate SQL Editor**
1. Go to **Data Warehouse** → **SQL Editor**
2. Run the pre-loaded query
3. View results in the table
4. Export results to CSV
5. Save the query and view history

### **Show Real-Time Features**
1. Visit **Real-Time Analytics** → **Live Dashboards**
2. Toggle between Live and Paused modes
3. View real-time charts
4. Check **Streaming Jobs** for active streams
5. Review **Alerts** for triggered notifications

### **Explore Global Search**
1. Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
2. Search for "pipeline", "dashboard", etc.
3. See recent searches and quick links

### **Key Pages for Demo**
- `/dashboard` - Platform overview with metrics
- `/data-integration/pipelines` - Pipeline management
- `/data-warehouse/editor` - SQL query interface
- `/data-transformation/workflows` - Workflow builder
- `/real-time-analytics/dashboards` - Live visualizations
- `/data-analytics/dashboards` - BI dashboards
- `/settings` - Configuration management

## Tech Stack

- **Framework**: Next.js 16.0.10 with Turbopack
- **UI Components**: shadcn/ui
- **Icons**: Tabler Icons
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Project Structure

```
app/
├── (platform)/          # Main platform routes with shared layout
│   ├── dashboard/       # Overview page
│   ├── data-integration/
│   ├── data-transformation/
│   ├── data-lake/
│   ├── data-warehouse/
│   ├── real-time-analytics/
│   ├── data-analytics/
│   ├── data-science/
│   ├── data-governance/
│   ├── monitoring/
│   ├── learning/        # Learning center
│   └── settings/
components/
├── ui/                  # shadcn/ui components
├── app-sidebar.tsx      # Main navigation sidebar
├── nav-platform.tsx     # Platform navigation component
├── nav-secondary.tsx    # Secondary navigation component
└── site-header.tsx      # Top navbar with search and profile
```

## Development

The platform uses:
- Route groups for shared layouts
- Collapsible accordion-style navigation
- Client-side state management for navigation
- Responsive design for all screen sizes

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tabler Icons](https://tabler.io/icons)
