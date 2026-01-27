"""
Connector factory and registration system.

This module provides a registry pattern for connectors, allowing:
- Registration of connector classes via decorator
- Dynamic instantiation based on connection type
- Connector discovery and listing
"""

from typing import Dict, Type, Optional
from integration.connectors.base import BaseConnector
from integration.exceptions import ConnectorNotFoundError


class ConnectorRegistry:
    """
    Registry for managing connector implementations.

    Connectors register themselves using the @register_connector decorator.
    The registry creates appropriate connector instances based on connection type.
    """

    # Class-level registry mapping connector_type -> connector class
    _registry: Dict[str, Type[BaseConnector]] = {}

    @classmethod
    def register(cls, connector_type: str):
        """
        Decorator to register a connector class.

        Args:
            connector_type: Unique identifier for the connector (e.g., 'postgresql', 'mysql')

        Returns:
            Decorator function

        Example:
            >>> @ConnectorRegistry.register('postgresql')
            ... class PostgreSQLConnector(BaseConnector):
            ...     pass
        """
        def decorator(connector_class: Type[BaseConnector]):
            if connector_type in cls._registry:
                raise ValueError(
                    f"Connector type '{connector_type}' is already registered "
                    f"by {cls._registry[connector_type].__name__}"
                )

            if not issubclass(connector_class, BaseConnector):
                raise TypeError(
                    f"Connector class {connector_class.__name__} must inherit from BaseConnector"
                )

            cls._registry[connector_type] = connector_class
            return connector_class

        return decorator

    @classmethod
    def create(cls, source: 'Source') -> BaseConnector:
        """
        Create a connector instance for a given source.

        Args:
            source: Django Source model instance

        Returns:
            Instantiated connector

        Raises:
            ConnectorNotFoundError: If no connector is registered for the source type

        Example:
            >>> from integration.models import Source
            >>> source = Source.objects.get(id=123)
            >>> connector = ConnectorRegistry.create(source)
            >>> result = connector.test()
        """
        connector_type = source.connector_type

        if connector_type not in cls._registry:
            available = ', '.join(cls._registry.keys()) or 'none'
            raise ConnectorNotFoundError(
                f"No connector registered for type '{connector_type}'. "
                f"Available connectors: {available}"
            )

        connector_class = cls._registry[connector_type]
        return connector_class(source)

    @classmethod
    def get_registered_types(cls) -> list:
        """
        Get list of all registered connector types.

        Returns:
            List of connector type strings

        Example:
            >>> ConnectorRegistry.get_registered_types()
            ['postgresql', 'mysql', 'rest_api', 'file']
        """
        return list(cls._registry.keys())

    @classmethod
    def is_registered(cls, connector_type: str) -> bool:
        """
        Check if a connector type is registered.

        Args:
            connector_type: Connector type to check

        Returns:
            True if registered, False otherwise

        Example:
            >>> ConnectorRegistry.is_registered('postgresql')
            True
        """
        return connector_type in cls._registry

    @classmethod
    def get_connector_class(cls, connector_type: str) -> Optional[Type[BaseConnector]]:
        """
        Get the connector class for a given type.

        Args:
            connector_type: Connector type

        Returns:
            Connector class or None if not registered

        Example:
            >>> cls = ConnectorRegistry.get_connector_class('postgresql')
            >>> cls.__name__
            'PostgreSQLConnector'
        """
        return cls._registry.get(connector_type)

    @classmethod
    def clear_registry(cls):
        """
        Clear all registered connectors.

        Primarily used for testing purposes.
        """
        cls._registry.clear()


# Convenience decorator alias
register_connector = ConnectorRegistry.register


# Register connector metadata for introspection
class ConnectorMetadata:
    """
    Metadata about available connectors.

    Provides information about connector capabilities, supported features,
    and configuration requirements.
    """

    # Connector metadata registry
    _metadata: Dict[str, Dict[str, any]] = {}

    @classmethod
    def register_metadata(
        cls,
        connector_type: str,
        name: str,
        description: str,
        source: bool = True,
        destination: bool = True,
        incremental_support: bool = False,
        required_config: Optional[list] = None,
        optional_config: Optional[list] = None
    ):
        """
        Register metadata for a connector.

        Args:
            connector_type: Connector type identifier
            name: Human-readable name
            description: Connector description
            source: Whether connector can be used as a source
            destination: Whether connector can be used as a destination
            incremental_support: Whether connector supports incremental syncs
            required_config: List of required config keys
            optional_config: List of optional config keys

        Example:
            >>> ConnectorMetadata.register_metadata(
            ...     'postgresql',
            ...     name='PostgreSQL',
            ...     description='PostgreSQL database connector',
            ...     source=True,
            ...     destination=True,
            ...     incremental_support=True,
            ...     required_config=['host', 'port', 'database', 'user', 'password']
            ... )
        """
        cls._metadata[connector_type] = {
            'type': connector_type,
            'name': name,
            'description': description,
            'source': source,
            'destination': destination,
            'incremental_support': incremental_support,
            'required_config': required_config or [],
            'optional_config': optional_config or []
        }

    @classmethod
    def get_metadata(cls, connector_type: str) -> Optional[Dict[str, any]]:
        """
        Get metadata for a connector type.

        Args:
            connector_type: Connector type

        Returns:
            Metadata dictionary or None

        Example:
            >>> meta = ConnectorMetadata.get_metadata('postgresql')
            >>> meta['name']
            'PostgreSQL'
        """
        return cls._metadata.get(connector_type)

    @classmethod
    def get_all_metadata(cls) -> Dict[str, Dict[str, any]]:
        """
        Get metadata for all registered connectors.

        Returns:
            Dictionary mapping connector types to metadata

        Example:
            >>> all_meta = ConnectorMetadata.get_all_metadata()
            >>> list(all_meta.keys())
            ['postgresql', 'mysql', 'rest_api', 'file']
        """
        return cls._metadata.copy()

    @classmethod
    def get_sources(cls) -> list:
        """
        Get list of connectors that can be used as sources.

        Returns:
            List of connector type strings

        Example:
            >>> ConnectorMetadata.get_sources()
            ['postgresql', 'mysql', 'rest_api', 'file']
        """
        return [
            connector_type
            for connector_type, meta in cls._metadata.items()
            if meta.get('source', False)
        ]

    @classmethod
    def get_destinations(cls) -> list:
        """
        Get list of connectors that can be used as destinations.

        Returns:
            List of connector type strings

        Example:
            >>> ConnectorMetadata.get_destinations()
            ['postgresql', 'mysql', 'file']
        """
        return [
            connector_type
            for connector_type, meta in cls._metadata.items()
            if meta.get('destination', False)
        ]
