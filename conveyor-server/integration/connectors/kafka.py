"""
Apache Kafka connector implementation.

This connector provides support for streaming data from/to Apache Kafka topics.
"""

from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError, NoBrokersAvailable
from typing import Dict, Any, Optional, Iterator, List
from datetime import datetime
import logging
import json

from integration.connectors.base import (
    BaseConnector,
    ConnectionTestResult,
    DiscoveryResult
)
from integration.connectors.factory import register_connector, ConnectorMetadata
from integration.singer.messages import RecordMessage, SchemaMessage
from integration.exceptions import (
    ConnectionError,
    SchemaDiscoveryError,
    DataReadError,
    DataWriteError
)

logger = logging.getLogger(__name__)


@register_connector('kafka')
class KafkaConnector(BaseConnector):
    """
    Apache Kafka streaming connector.

    Supports:
    - Consuming messages from Kafka topics
    - Producing messages to Kafka topics
    - Consumer groups for parallel processing
    - SASL and SSL authentication
    - JSON and Avro message formats
    """

    def __init__(self, source: 'Source'):
        """
        Initialize Kafka connector.

        Config options from Source model:
        - host: Kafka bootstrap servers (comma-separated)
        - config: Additional config (group_id, auto_offset_reset, sasl_*, ssl_*, etc.)
        """
        super().__init__(source)

        # Parse bootstrap servers
        self.bootstrap_servers = source.host.split(',') if source.host else ['localhost:9092']

        self.group_id = self.config.get('group_id', 'conveyor-consumer')
        self.auto_offset_reset = self.config.get('auto_offset_reset', 'earliest')
        self.message_format = self.config.get('message_format', 'json')  # json or avro

        # Security settings
        self.security_protocol = self.config.get('security_protocol', 'PLAINTEXT')  # PLAINTEXT, SSL, SASL_PLAINTEXT, SASL_SSL
        self.sasl_mechanism = self.config.get('sasl_mechanism')
        self.sasl_username = source.username
        self.sasl_password = source.get_password() if source.username else None

        self._consumer = None
        self._producer = None

    def _get_consumer_config(self) -> Dict[str, Any]:
        """Build Kafka consumer configuration."""
        config = {
            'bootstrap_servers': self.bootstrap_servers,
            'group_id': self.group_id,
            'auto_offset_reset': self.auto_offset_reset,
            'enable_auto_commit': True,
            'value_deserializer': lambda m: json.loads(m.decode('utf-8')) if m else None,
        }

        # Add security config
        if self.security_protocol != 'PLAINTEXT':
            config['security_protocol'] = self.security_protocol

        if self.sasl_mechanism:
            config['sasl_mechanism'] = self.sasl_mechanism
            config['sasl_plain_username'] = self.sasl_username
            config['sasl_plain_password'] = self.sasl_password

        return config

    def _get_producer_config(self) -> Dict[str, Any]:
        """Build Kafka producer configuration."""
        config = {
            'bootstrap_servers': self.bootstrap_servers,
            'value_serializer': lambda m: json.dumps(m).encode('utf-8'),
        }

        # Add security config
        if self.security_protocol != 'PLAINTEXT':
            config['security_protocol'] = self.security_protocol

        if self.sasl_mechanism:
            config['sasl_mechanism'] = self.sasl_mechanism
            config['sasl_plain_username'] = self.sasl_username
            config['sasl_plain_password'] = self.sasl_password

        return config

    def _get_consumer(self, topics: Optional[List[str]] = None):
        """Get or create Kafka consumer."""
        if self._consumer is None:
            try:
                config = self._get_consumer_config()

                if topics:
                    self._consumer = KafkaConsumer(*topics, **config)
                else:
                    self._consumer = KafkaConsumer(**config)

                logger.info(f"Connected to Kafka cluster: {self.bootstrap_servers}")

            except NoBrokersAvailable as e:
                raise ConnectionError(f"No Kafka brokers available: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Failed to connect to Kafka: {str(e)}")

        return self._consumer

    def _get_producer(self):
        """Get or create Kafka producer."""
        if self._producer is None:
            try:
                config = self._get_producer_config()
                self._producer = KafkaProducer(**config)

                logger.info(f"Connected Kafka producer to: {self.bootstrap_servers}")

            except NoBrokersAvailable as e:
                raise ConnectionError(f"No Kafka brokers available: {str(e)}")
            except Exception as e:
                raise ConnectionError(f"Failed to connect to Kafka: {str(e)}")

        return self._producer

    def test(self) -> ConnectionTestResult:
        """
        Test Kafka connection.

        Returns:
            ConnectionTestResult with success status and cluster info
        """
        try:
            # Try to create consumer and get metadata
            consumer = self._get_consumer()

            # Get cluster metadata
            topics = consumer.topics()

            # Get broker info
            cluster_metadata = consumer._client.cluster
            broker_count = len(cluster_metadata.brokers())

            return ConnectionTestResult(
                success=True,
                message=f"Successfully connected to Kafka cluster",
                details={
                    'bootstrap_servers': self.bootstrap_servers,
                    'broker_count': broker_count,
                    'topics_count': len(topics),
                    'group_id': self.group_id
                }
            )

        except ConnectionError as e:
            return ConnectionTestResult(
                success=False,
                message=str(e),
                details={'error_type': 'ConnectionError'}
            )
        except Exception as e:
            return ConnectionTestResult(
                success=False,
                message=f"Connection test failed: {str(e)}",
                details={'error_type': type(e).__name__}
            )
        finally:
            self.close()

    def discover(self) -> DiscoveryResult:
        """
        Discover Kafka topics.

        Returns:
            DiscoveryResult with streams (topics) and schemas
        """
        try:
            consumer = self._get_consumer()

            # Get all topics
            topics = consumer.topics()

            streams = []
            schemas = {}

            for topic in topics:
                # Skip internal topics
                if topic.startswith('__'):
                    continue

                # Get topic partitions
                partitions = consumer.partitions_for_topic(topic)
                partition_count = len(partitions) if partitions else 0

                stream = {
                    'name': topic,
                    'namespace': 'kafka',
                    'metadata': {
                        'partition_count': partition_count,
                        'message_format': self.message_format
                    }
                }

                # Generic schema for Kafka messages
                schema = {
                    'type': 'object',
                    'properties': {
                        'key': {'type': ['string', 'null']},
                        'value': {'type': 'object', 'additionalProperties': True},
                        'timestamp': {'type': 'string'},
                        'partition': {'type': 'number'},
                        'offset': {'type': 'number'}
                    }
                }

                streams.append(stream)
                schemas[topic] = schema

            return DiscoveryResult(streams=streams, schemas=schemas)

        except Exception as e:
            raise SchemaDiscoveryError(f"Failed to discover Kafka topics: {str(e)}")
        finally:
            self.close()

    def read(
        self,
        stream: str,
        schema: Dict[str, Any],
        state: Optional[Dict[str, Any]] = None
    ) -> Iterator[RecordMessage]:
        """
        Read messages from a Kafka topic.

        Args:
            stream: Topic name
            schema: JSON schema
            state: State for offset management

        Yields:
            RecordMessage objects
        """
        try:
            # Subscribe to topic
            consumer = self._get_consumer([stream])

            # Seek to offset from state if provided
            if state and stream in state and 'offsets' in state[stream]:
                offsets = state[stream]['offsets']
                for partition, offset in offsets.items():
                    from kafka import TopicPartition
                    tp = TopicPartition(stream, int(partition))
                    consumer.seek(tp, offset)

            # Consume messages
            message_count = 0
            max_messages = self.config.get('max_messages', 1000)

            for message in consumer:
                # Build record with message metadata
                record = {
                    'key': message.key.decode('utf-8') if message.key else None,
                    'value': message.value,  # Already deserialized by consumer
                    'timestamp': datetime.fromtimestamp(message.timestamp / 1000).isoformat(),
                    'partition': message.partition,
                    'offset': message.offset,
                    'topic': message.topic
                }

                yield RecordMessage(
                    stream=stream,
                    record=record,
                    time_extracted=datetime.utcnow()
                )

                message_count += 1

                # Limit messages per poll to avoid infinite streaming
                if message_count >= max_messages:
                    break

        except Exception as e:
            raise DataReadError(f"Failed to read from Kafka topic {stream}: {str(e)}")
        finally:
            self.close()

    def write(
        self,
        stream: str,
        schema: Dict[str, Any],
        records: Iterator[RecordMessage],
        key_properties: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Write messages to a Kafka topic.

        Args:
            stream: Topic name
            schema: JSON schema
            records: Iterator of RecordMessage objects
            key_properties: Fields to use as message key

        Returns:
            Write statistics
        """
        try:
            producer = self._get_producer()

            records_written = 0

            for record_msg in records:
                record = record_msg.record

                # Extract key if key_properties specified
                key = None
                if key_properties:
                    key_values = [str(record.get(k, '')) for k in key_properties]
                    key = '_'.join(key_values).encode('utf-8')

                # Send message
                future = producer.send(stream, value=record, key=key)

                # Wait for send to complete
                try:
                    future.get(timeout=10)
                    records_written += 1
                except KafkaError as e:
                    logger.error(f"Failed to send message to Kafka: {str(e)}")
                    raise DataWriteError(f"Failed to send message: {str(e)}")

            # Flush pending messages
            producer.flush()

            return {
                'records_written': records_written,
                'stream': stream
            }

        except Exception as e:
            raise DataWriteError(f"Failed to write to Kafka topic {stream}: {str(e)}")
        finally:
            self.close()

    def close(self):
        """Close Kafka connections."""
        if self._consumer:
            self._consumer.close()
            self._consumer = None

        if self._producer:
            self._producer.close()
            self._producer = None


# Register metadata
ConnectorMetadata.register_metadata(
    'kafka',
    name='Apache Kafka',
    description='Streaming data platform connector',
    source=True,
    destination=True,
    incremental_support=True,
    required_config=['bootstrap_servers'],
    optional_config=['group_id', 'security_protocol', 'sasl_mechanism', 'sasl_username', 'sasl_password']
)
