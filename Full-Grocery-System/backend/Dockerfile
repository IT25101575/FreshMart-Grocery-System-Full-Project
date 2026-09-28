# ==============================================================================
# FreshMart Grocery System - Java Backend Dockerfile
# Multi-stage build: compiles Java source inside container and runs on lean JRE
# ==============================================================================

FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy libraries and source code
COPY lib /app/lib
COPY src /app/src

# Create output directory and compile all Java classes
RUN mkdir -p /app/bin && \
    javac -cp "lib/mssql-jdbc.jar" -sourcepath src -d bin $(find src -name "*.java")

# Runtime container
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy compiled classes and JDBC driver from builder stage
COPY --from=builder /app/bin /app/bin
COPY --from=builder /app/lib /app/lib

# Expose backend REST API port
EXPOSE 8080

# Default database host is the docker compose database service
ENV DB_HOST=database

# Run FreshMart Java HTTP Server
CMD ["java", "-cp", "bin:lib/mssql-jdbc.jar", "com.grocery.FreshMartServer"]
