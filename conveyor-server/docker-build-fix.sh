#!/bin/bash
# Docker Build Fix Script for Timeout Issues
# Multiple strategies to resolve pip timeout errors

set -e

echo "=== Docker Build Timeout Fix ==="
echo ""
echo "Choose a build strategy:"
echo "1) Use BuildKit with pip cache (Recommended)"
echo "2) Build with increased resources"
echo "3) Build without cache (slower but more reliable)"
echo "4) Use alternative PyPI mirror (faster for some regions)"
echo "5) Install packages in smaller batches"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
  1)
    echo "Building with BuildKit and pip cache..."
    DOCKER_BUILDKIT=1 docker build \
      --build-arg BUILDKIT_INLINE_CACHE=1 \
      --progress=plain \
      -t conveyor-server:latest \
      -f Dockerfile .
    ;;

  2)
    echo "Building with increased resources..."
    docker build \
      --memory="4g" \
      --cpus="2" \
      --network=host \
      -t conveyor-server:latest \
      -f Dockerfile .
    ;;

  3)
    echo "Building without cache..."
    docker build \
      --no-cache \
      --network=host \
      -t conveyor-server:latest \
      -f Dockerfile .
    ;;

  4)
    echo "Building with alternative PyPI mirror..."
    docker build \
      --build-arg PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
      --network=host \
      -t conveyor-server:latest \
      -f Dockerfile.mirror .
    ;;

  5)
    echo "Installing packages in batches..."
    # This requires a special Dockerfile
    docker build \
      -t conveyor-server:latest \
      -f Dockerfile.batched .
    ;;

  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "Build completed successfully!"
