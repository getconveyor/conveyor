FROM apache/hive:4.0.0

# Download PostgreSQL JDBC driver and install netcat for health checks
USER root
ADD https://jdbc.postgresql.org/download/postgresql-42.7.1.jar /opt/hive/lib/postgresql-jdbc.jar
RUN chmod 644 /opt/hive/lib/postgresql-jdbc.jar && \
    apt-get update && \
    apt-get install -y netcat-openbsd && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Switch back to hive user
USER hive

# Set environment variables for PostgreSQL connection
ENV METASTORE_DB_HOSTNAME=postgres
ENV METASTORE_TYPE=postgres
