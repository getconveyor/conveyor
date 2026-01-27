from django.apps import AppConfig


class IntegrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'integration'

    def ready(self):
        """
        Register connectors when Django app is ready.

        This imports all connector modules which will auto-register
        via the @register_connector decorator.
        """
        # Import connectors to trigger registration
        try:
            from integration.connectors import mysql  # noqa: F401
            from integration.connectors import postgresql  # noqa: F401
            from integration.connectors import rest_api  # noqa: F401
            from integration.connectors import file  # noqa: F401
            from integration.connectors import mongodb  # noqa: F401
            from integration.connectors import snowflake  # noqa: F401
            from integration.connectors import bigquery  # noqa: F401
            from integration.connectors import redshift  # noqa: F401
            from integration.connectors import s3  # noqa: F401
            from integration.connectors import kafka  # noqa: F401
            from integration.connectors import salesforce  # noqa: F401

            # Log registered connectors
            from integration.connectors.factory import ConnectorRegistry
            import logging
            logger = logging.getLogger(__name__)
            registered = ConnectorRegistry.get_registered_types()
            logger.info(f"Registered connectors: {', '.join(registered)}")

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to register some connectors: {str(e)}")
