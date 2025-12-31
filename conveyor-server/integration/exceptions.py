"""
Custom exceptions for the Conveyor ETL engine.

This module defines the exception hierarchy for all ETL-related errors,
providing clear error handling and debugging capabilities.
"""


class ConveyorETLException(Exception):
    """Base exception for all ETL errors"""
    pass


class ConnectorError(ConveyorETLException):
    """Base exception for connector errors"""
    pass


class ConnectorNotFoundError(ConnectorError):
    """Raised when connector is not found for a connection type"""
    pass


class ConnectionError(ConnectorError):
    """Raised when connection to data source fails"""
    pass


class AuthenticationError(ConnectionError):
    """Raised when authentication fails"""
    pass


class ReadError(ConnectorError):
    """Raised when error occurs while reading from source"""
    pass


class WriteError(ConnectorError):
    """Raised when error occurs while writing to destination"""
    pass


class SchemaError(ConnectorError):
    """Raised for schema-related errors"""
    pass


class DiscoveryError(ConnectorError):
    """Raised when schema discovery fails"""
    pass


# Specific error aliases for clearer semantics
class SchemaDiscoveryError(DiscoveryError):
    """Raised when schema discovery fails"""
    pass


class DataReadError(ReadError):
    """Raised when error occurs while reading data from source"""
    pass


class DataWriteError(WriteError):
    """Raised when error occurs while writing data to destination"""
    pass


class TransformationError(ConveyorETLException):
    """Raised when transformation fails"""
    pass


class ValidationError(ConveyorETLException):
    """Raised when validation fails"""
    pass


class StateError(ConveyorETLException):
    """Raised when state management fails"""
    pass


class PipelineExecutionError(ConveyorETLException):
    """Raised when pipeline execution fails"""
    pass


class ConfigurationError(ConveyorETLException):
    """Raised when configuration is invalid"""
    pass
