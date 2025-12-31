"""
Connectors package for Conveyor ETL engine.

This package provides connector implementations for various data sources
and destinations, following the Singer protocol.
"""

from integration.connectors.base import (
    BaseConnector,
    ConnectionTestResult,
    DiscoveryResult
)
from integration.connectors.factory import (
    ConnectorRegistry,
    ConnectorMetadata,
    register_connector
)

__all__ = [
    'BaseConnector',
    'ConnectionTestResult',
    'DiscoveryResult',
    'ConnectorRegistry',
    'ConnectorMetadata',
    'register_connector',
]
