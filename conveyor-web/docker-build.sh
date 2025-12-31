#!/bin/bash

# Build the Docker image
echo "Building Docker image..."
docker build -t conveyor-frontend:latest .

echo ""
echo "Build complete!"
echo ""
echo "To run the container, use:"
echo "  docker run -p 3000:3000 conveyor-frontend:latest"
echo ""
echo "Or run in detached mode:"
echo "  docker run -d -p 3000:3000 --name conveyor-frontend conveyor-frontend:latest"
echo ""
echo "Access the application at: http://localhost:3000"
