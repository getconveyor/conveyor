# Connector Quick Reference

## Installation

```bash
./install-connectors.sh
# Or manually:
cd conveyor-server
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_source_catalog
```

## Connector Configuration Cheat Sheet

### MySQL / PostgreSQL
```json
{
  "host": "localhost",
  "port": 3306,
  "database": "mydb",
  "username": "user",
  "password": "pass",
  "ssl": false
}
```

### MongoDB
```json
{
  "host": "mongodb://localhost:27017",
  "database": "mydb",
  "username": "user",
  "password": "pass",
  "config": {
    "authSource": "admin"
  }
}
```

### Snowflake
```json
{
  "host": "xy12345.us-east-1",
  "database": "MY_DB",
  "username": "user",
  "password": "pass",
  "config": {
    "warehouse": "MY_WH",
    "schema": "PUBLIC"
  }
}
```

### BigQuery
```json
{
  "host": "my-project-id",
  "database": "my_dataset",
  "config": {
    "credentials_json": "{...service account JSON...}"
  }
}
```

### Redshift
```json
{
  "host": "cluster.region.redshift.amazonaws.com",
  "port": 5439,
  "database": "mydb",
  "username": "user",
  "password": "pass",
  "ssl": true
}
```

### Amazon S3
```json
{
  "database": "my-bucket",
  "username": "AWS_ACCESS_KEY",
  "password": "AWS_SECRET_KEY",
  "config": {
    "region": "us-east-1",
    "prefix": "data/",
    "file_format": "json"
  }
}
```

### Kafka
```json
{
  "host": "localhost:9092",
  "config": {
    "group_id": "conveyor",
    "security_protocol": "PLAINTEXT"
  }
}
```

### Salesforce
```json
{
  "username": "user@company.com",
  "password": "password+security_token",
  "config": {
    "domain": "login",
    "api_version": "57.0"
  }
}
```

### REST API
```json
{
  "host": "https://api.example.com",
  "config": {
    "auth_type": "bearer",
    "auth_token": "your_token"
  }
}
```

## Testing Connectors

### Via Django Shell
```python
python manage.py shell

from integration.models import Source
from integration.connectors.factory import ConnectorRegistry

source = Source.objects.get(id='...')
connector = ConnectorRegistry.create(source)

# Test connection
result = connector.test()
print(result.success, result.message)

# Discover schemas
discovery = connector.discover()
for stream in discovery.streams:
    print(stream['name'])
```

### Via API
```bash
# List catalog
curl http://localhost:8000/api/integration/sources/catalog/

# Create source
curl -X POST http://localhost:8000/api/integration/sources/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d @source.json

# Test connection
curl -X POST http://localhost:8000/api/integration/sources/{id}/test/ \
  -H "Authorization: Bearer TOKEN"
```

## Common Issues

### Import Error
```
ModuleNotFoundError: No module named 'pymongo'
```
**Solution**: Run `pip install -r requirements.txt`

### Connection Failed
```
ConnectionError: Failed to connect to MongoDB
```
**Solution**:
- Check host/port
- Verify firewall rules
- Test credentials
- Check network connectivity

### Connector Not Found
```
ConnectorNotFoundError: No connector registered for type 'mongodb'
```
**Solution**:
- Check `apps.py` imports connector
- Verify `@register_connector` decorator exists
- Restart Django server

## Dependency Matrix

| Connector   | Package                       | Version |
|-------------|-------------------------------|---------|
| MySQL       | PyMySQL                       | 1.1.0   |
| PostgreSQL  | psycopg2-binary               | 2.9.9   |
| MongoDB     | pymongo                       | 4.6.1   |
| Snowflake   | snowflake-connector-python    | 3.7.0   |
| BigQuery    | google-cloud-bigquery         | 3.17.1  |
| Redshift    | psycopg2-binary               | 2.9.9   |
| S3          | boto3                         | 1.34.8  |
| Kafka       | kafka-python                  | 2.0.2   |
| Salesforce  | simple-salesforce             | 1.12.5  |
| REST API    | requests                      | 2.31.0  |

## Connector Capabilities

| Connector   | Read | Write | Incremental | Batch |
|-------------|------|-------|-------------|-------|
| MySQL       | ✅   | ✅    | ✅          | ✅    |
| PostgreSQL  | ✅   | ✅    | ✅          | ✅    |
| MongoDB     | ✅   | ✅    | ✅          | ✅    |
| Snowflake   | ✅   | ✅    | ✅          | ✅    |
| BigQuery    | ✅   | ✅    | ✅          | ✅    |
| Redshift    | ✅   | ✅    | ✅          | ✅    |
| S3          | ✅   | ✅    | ❌          | ✅    |
| Kafka       | ✅   | ✅    | ✅          | ✅    |
| Salesforce  | ✅   | ✅    | ✅          | ❌    |
| REST API    | ✅   | ✅    | ⚠️          | ⚠️    |

✅ Fully Supported | ⚠️ Partial | ❌ Not Supported
