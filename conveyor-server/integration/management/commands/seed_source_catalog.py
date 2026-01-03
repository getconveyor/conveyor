from django.core.management.base import BaseCommand
from integration.models import SourceCatalog


class Command(BaseCommand):
    help = 'Seed the source catalog with available data source types'

    CATALOG_DATA = [
        {
            'id': 'mysql',
            'name': 'MySQL',
            'category': 'database',
            'description': 'Connect to MySQL databases for data ingestion and integration',
            'auth_types': ['username/password'],
            'documentation': 'https://conveyor.dev/docs/sources/mysql',
            'popular': True,
        },
        {
            'id': 'postgresql',
            'name': 'PostgreSQL',
            'category': 'database',
            'description': 'Integrate with PostgreSQL databases',
            'auth_types': ['username/password'],
            'documentation': 'https://conveyor.dev/docs/sources/postgresql',
            'popular': True,
        },
        {
            'id': 'mongodb',
            'name': 'MongoDB',
            'category': 'database',
            'description': 'Connect to MongoDB NoSQL databases',
            'auth_types': ['connection string', 'username/password'],
            'documentation': 'https://conveyor.dev/docs/sources/mongodb',
            'popular': False,
        },
        {
            'id': 'snowflake',
            'name': 'Snowflake',
            'category': 'database',
            'description': 'Connect to Snowflake data warehouses',
            'auth_types': ['username/password', 'oauth'],
            'documentation': 'https://conveyor.dev/docs/sources/snowflake',
            'popular': True,
        },
        {
            'id': 'bigquery',
            'name': 'Google BigQuery',
            'category': 'database',
            'description': 'Integrate with Google BigQuery for large-scale analytics',
            'auth_types': ['service account', 'oauth'],
            'documentation': 'https://conveyor.dev/docs/sources/bigquery',
            'popular': True,
        },
        {
            'id': 'redshift',
            'name': 'Amazon Redshift',
            'category': 'database',
            'description': 'Connect to AWS Redshift data warehouse',
            'auth_types': ['username/password'],
            'documentation': 'https://conveyor.dev/docs/sources/redshift',
            'popular': True,
        },
        {
            'id': 's3',
            'name': 'Amazon S3',
            'category': 'cloud',
            'description': 'Read data from AWS S3 buckets',
            'auth_types': ['access key', 'iam role'],
            'documentation': 'https://conveyor.dev/docs/sources/s3',
            'popular': True,
        },
        {
            'id': 'api',
            'name': 'REST API',
            'category': 'api',
            'description': 'Connect to any REST API endpoint with support for authentication',
            'auth_types': ['api key', 'bearer token', 'basic auth', 'oauth'],
            'documentation': 'https://conveyor.dev/docs/sources/api',
            'popular': True,
        },
        {
            'id': 'kafka',
            'name': 'Apache Kafka',
            'category': 'file',
            'description': 'Stream data from Apache Kafka topics',
            'auth_types': ['sasl', 'ssl'],
            'documentation': 'https://conveyor.dev/docs/sources/kafka',
            'popular': False,
        },
        {
            'id': 'salesforce',
            'name': 'Salesforce',
            'category': 'api',
            'description': 'Access Salesforce CRM data and objects',
            'auth_types': ['oauth'],
            'documentation': 'https://conveyor.dev/docs/sources/salesforce',
            'popular': False,
        },
    ]

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for catalog_item in self.CATALOG_DATA:
            catalog, created = SourceCatalog.objects.update_or_create(
                id=catalog_item['id'],
                defaults={
                    'name': catalog_item['name'],
                    'category': catalog_item['category'],
                    'description': catalog_item['description'],
                    'auth_types': catalog_item['auth_types'],
                    'documentation': catalog_item['documentation'],
                    'popular': catalog_item['popular'],
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {catalog.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated: {catalog.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSeeding complete! Created: {created_count}, Updated: {updated_count}'
            )
        )
