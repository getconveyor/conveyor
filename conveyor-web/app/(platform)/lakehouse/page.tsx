export default function LakehousePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Lakehouse</h1>
        <p className="text-sm text-muted-foreground">
          Unified data platform with Iceberg tables on MinIO storage
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🥉</span>
            <h3 className="font-medium">Bronze Layer</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Raw data ingested from sources without transformations
          </p>
          <a
            href="/lakehouse/bronze"
            className="text-sm text-primary hover:underline"
          >
            View Bronze Tables →
          </a>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🥈</span>
            <h3 className="font-medium">Silver Layer</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Cleaned and validated data ready for analysis
          </p>
          <a
            href="/lakehouse/silver"
            className="text-sm text-primary hover:underline"
          >
            View Silver Tables →
          </a>
        </div>

        <div className="rounded-lg border p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🥇</span>
            <h3 className="font-medium">Gold Layer</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Business-ready aggregated data for reporting
          </p>
          <a
            href="/lakehouse/gold"
            className="text-sm text-primary hover:underline"
          >
            View Gold Tables →
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h3 className="font-medium mb-2">SQL Editor (Trino)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Query Iceberg tables using Trino SQL engine
          </p>
          <a
            href="/lakehouse/sql-editor"
            className="text-sm text-primary hover:underline"
          >
            Open SQL Editor →
          </a>
        </div>

        <div className="rounded-lg border p-5">
          <h3 className="font-medium mb-2">Table Explorer</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse and manage Iceberg tables across all layers
          </p>
          <a
            href="/lakehouse/tables"
            className="text-sm text-primary hover:underline"
          >
            Explore Tables →
          </a>
        </div>
      </div>

      <div className="rounded-lg border p-5">
        <h3 className="font-medium mb-2">Architecture</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Lakehouse combines the flexibility of data lakes with the performance
          and ACID guarantees of data warehouses using Apache Iceberg table
          format.
        </p>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Storage:</span>
            <span className="text-muted-foreground">MinIO (S3-compatible)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Table Format:</span>
            <span className="text-muted-foreground">Apache Iceberg</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Query Engine:</span>
            <span className="text-muted-foreground">Trino</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Catalog:</span>
            <span className="text-muted-foreground">Hive Metastore</span>
          </div>
        </div>
      </div>
    </div>
  );
}
