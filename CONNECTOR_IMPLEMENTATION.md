# Connector Implementation Summary

## Overview

Successfully implemented **7 new data source connectors** to match all entries in the source catalog. All connectors follow the Singer protocol and implement the standard `BaseConnector` interface.

## Implementation Status

### ✅ Completed Connectors (10 Total)

| Connector | Type | File | Size | Features |
|-----------|------|------|------|----------|
| **MySQL** | Database | `mysql.py` | 19K | Full/incremental sync, UPSERT, SSL |
| **PostgreSQL** | Database | `postgresql.py` | 19K | Full/incremental sync, UPSERT, SSL |
| **MongoDB** | Database | `mongodb.py` | 13K | Document sampling, incremental sync |
| **Snowflake** | Database | `snowflake.py` | 14K | MERGE upserts, OAuth support |
| **BigQuery** | Database | `bigquery.py` | 11K | Service account auth, streaming inserts |
| **Redshift** | Database | `redshift.py` | 14K | Temp table upserts, SSL |
| **S3** | Cloud | `s3.py` | 16K | CSV/JSON formats, pattern matching |
| **REST API** | API | `rest_api.py` | 16K | Multiple auth methods |
| **Kafka** | Streaming | `kafka.py` | 12K | Consumer groups, SASL/SSL |
| **Salesforce** | API | `salesforce.py` | 13K | OAuth, SOQL queries |

### Connector Capabilities

All connectors implement these core methods:
- ✅ `test()` - Connection validation
- ✅ `discover()` - Schema discovery
- ✅ `read()` - Data extraction
- ✅ `write()` - Data loading

## Installation

### 1. Install Python Dependencies

```bash
cd conveyor-server
pip install -r requirements.txt
```

### New Dependencies Added:
- `pymongo==4.6.1` - MongoDB driver
- `snowflake-connector-python==3.7.0` - Snowflake driver
- `google-cloud-bigquery==3.17.1` - BigQuery client
- `kafka-python==2.0.2` - Kafka client
- `simple-salesforce==1.12.5` - Salesforce client

### 2. Run Database Migration

```bash
python manage.py migrate
```

### 3. Seed Source Catalog

```bash
python manage.py seed_source_catalog
```

This will populate the `SourceCatalog` table with all 10 available source types.

## Configuration Details

### MongoDB
```python
{
    "host": "mongodb://localhost:27017",  # Or connection string
    "database": "my_database",
    "username": "user",  # Optional
    "password": "pass",  # Optional
    "config": {
        "authSource": "admin",
        "ssl": False,
        "sample_size": 1000
    }
}
```

### Snowflake
```python
{
    "host": "xy12345.us-east-1",  # Account identifier
    "database": "MY_DATABASE",
    "username": "user",
    "password": "pass",
    "config": {
        "warehouse": "MY_WAREHOUSE",
        "role": "MY_ROLE",
        "schema": "PUBLIC"
    }
}
```

### BigQuery
```python
{
    "host": "my-project-id",  # Project ID
    "database": "my_dataset",  # Dataset name
    "config": {
        "credentials_json": "{...}",  # Service account JSON
        "location": "US"
    }
}
```

### Redshift
```python
{
    "host": "my-cluster.region.redshift.amazonaws.com",
    "port": 5439,
    "database": "my_database",
    "username": "user",
    "password": "pass",
    "ssl": True,
    "config": {
        "schema": "public"
    }
}
```

### Amazon S3
```python
{
    "database": "my-bucket-name",  # Bucket name
    "username": "AKIAIOSFODNN7EXAMPLE",  # Access Key
    "password": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",  # Secret Key
    "config": {
        "region": "us-east-1",
        "prefix": "data/",
        "file_format": "json",  # json, csv, parquet
        "file_pattern": "*.json"
    }
}
```

### Kafka
```python
{
    "host": "localhost:9092,localhost:9093",  # Bootstrap servers
    "config": {
        "group_id": "conveyor-consumer",
        "security_protocol": "SASL_SSL",  # PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
        "sasl_mechanism": "PLAIN",
        "message_format": "json"
    }
}
```

### Salesforce
```python
{
    "username": "user@company.com",
    "password": "password+security_token",
    "config": {
        "domain": "login",  # or "test" for sandbox
        "api_version": "57.0",
        # OAuth alternative:
        "client_id": "...",
        "client_secret": "...",
        "access_token": "...",
        "instance_url": "..."
    }
}
```

## Testing

### 1. Start the Django Server

```bash
python manage.py runserver
```

Check logs for connector registration:
```
INFO: Registered connectors: mysql, postgresql, mongodb, snowflake, bigquery, redshift, s3, rest_api, kafka, salesforce
```

### 2. Test Individual Connector

```python
# In Django shell
python manage.py shell

from integration.models import Source, Workspace
from integration.connectors.factory import ConnectorRegistry

# Create a test source
workspace = Workspace.objects.first()
source = Source.objects.create(
    workspace=workspace,
    name="Test MongoDB",
    type="mongodb",
    host="localhost:27017",
    database="test_db"
)

# Test connection
connector = ConnectorRegistry.create(source)
result = connector.test()
print(result.success, result.message)

# Discover schemas
discovery = connector.discover()
print(f"Found {len(discovery.streams)} streams")
```

### 3. Test via API

```bash
# Get source catalog
curl http://localhost:8000/api/integration/sources/catalog/

# Create a source
curl -X POST http://localhost:8000/api/integration/sources/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My MongoDB",
    "type": "mongodb",
    "host": "localhost:27017",
    "database": "test_db"
  }'

# Test connection
curl -X POST http://localhost:8000/api/integration/sources/{id}/test/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Architecture

### Connector Registry Pattern

```
┌─────────────────────────────────────────────┐
│          ConnectorRegistry                   │
│  (Factory for creating connectors)          │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  @register_connector    _registry: Dict
    (decorator)          (type → class)
        │
        └──> Registers connector classes
                    │
        ┌───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼
    MongoDB    Snowflake   BigQuery    Kafka ...
   Connector   Connector   Connector   Connector
```

### Data Flow

```
Source Model (Django)
    │
    ├─► connector_type property
    │       │
    │       └─► Maps type → connector name
    │
    └─► ConnectorRegistry.create(source)
            │
            └─► Returns connector instance
                    │
                    ├─► test() → ConnectionTestResult
                    ├─► discover() → DiscoveryResult
                    ├─► read() → Iterator[RecordMessage]
                    └─► write() → Dict[str, Any]
```

## Files Modified/Created

### Created Files (7 new connectors)
- `integration/connectors/mongodb.py`
- `integration/connectors/snowflake.py`
- `integration/connectors/bigquery.py`
- `integration/connectors/redshift.py`
- `integration/connectors/s3.py`
- `integration/connectors/kafka.py`
- `integration/connectors/salesforce.py`

### Modified Files
- `integration/apps.py` - Added connector imports
- `integration/models.py` - Updated `connector_type` mapping
- `requirements.txt` - Added new dependencies

## Known Limitations

1. **Authentication Storage**: Passwords are stored encrypted, but service account JSONs and OAuth tokens should be handled securely
2. **BigQuery**: Requires service account JSON - consider using secret manager
3. **S3**: Limited to JSON/CSV formats - Parquet support requires additional implementation
4. **Kafka**: Consumer offset management is basic - may need enhancement for production
5. **Salesforce**: API rate limits apply - implement backoff/retry logic
6. **Snowflake**: Warehouse auto-suspend/resume should be configured

## Next Steps

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Run migrations: `python manage.py migrate`
3. ✅ Seed catalog: `python manage.py seed_source_catalog`
4. 🔄 Test each connector with real credentials
5. 🔄 Add error handling and retry logic
6. 🔄 Implement connection pooling where applicable
7. 🔄 Add monitoring and metrics collection
8. 🔄 Write integration tests
9. 🔄 Add rate limiting for API-based connectors
10. 🔄 Document connector-specific troubleshooting

## Troubleshooting

### Import Errors
If you see "No module named 'X'" errors:
```bash
pip install -r requirements.txt
```

### Connection Errors
- Check firewall rules
- Verify credentials
- Check network connectivity
- Review connector-specific logs

### Registration Issues
Check Django logs on startup. You should see:
```
INFO: Registered connectors: mysql, postgresql, mongodb, snowflake, bigquery, redshift, s3, rest_api, kafka, salesforce
```

If connectors are missing, check:
1. `integration/apps.py` imports all connector modules
2. Each connector has `@register_connector('name')` decorator
3. No syntax errors in connector files

## Support

For connector-specific issues, refer to:
- MongoDB: https://pymongo.readthedocs.io/
- Snowflake: https://docs.snowflake.com/en/user-guide/python-connector.html
- BigQuery: https://cloud.google.com/bigquery/docs/reference/libraries
- Kafka: https://kafka-python.readthedocs.io/
- Salesforce: https://github.com/simple-salesforce/simple-salesforce
