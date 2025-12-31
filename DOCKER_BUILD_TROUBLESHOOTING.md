# Docker Build Timeout Troubleshooting

## Problem
Docker build fails with `ReadTimeoutError` when downloading Python packages from PyPI.

## Quick Fixes

### Solution 1: Use BuildKit with Cache (Recommended)
```bash
# Export BuildKit environment variable
export DOCKER_BUILDKIT=1

# Build using docker-compose
docker-compose build

# Or build directly with cache
DOCKER_BUILDKIT=1 docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --progress=plain \
  -t conveyor-server \
  -f conveyor-server/Dockerfile \
  conveyor-server/
```

### Solution 2: Use the Optimized Dockerfile
```bash
# Use the optimized Dockerfile with cache mounts
cd conveyor-server
DOCKER_BUILDKIT=1 docker build \
  -f Dockerfile.optimized \
  -t conveyor-server:latest .
```

### Solution 3: Increase Docker Resources
Go to Docker Desktop → Settings → Resources:
- **Memory**: Increase to 4GB+
- **CPUs**: Increase to 2+
- **Network**: Ensure stable internet connection

Then rebuild:
```bash
docker-compose build --no-cache
```

### Solution 4: Build with Host Network
```bash
# Use host network for faster downloads
docker build \
  --network=host \
  -f conveyor-server/Dockerfile \
  -t conveyor-server:latest \
  conveyor-server/
```

### Solution 5: Split Requirements Install
Split the requirements.txt into multiple smaller batches:

**requirements-core.txt:**
```txt
Django==4.2.27
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
psycopg2-binary==2.9.9
```

**requirements-additional.txt:**
```txt
celery==5.3.4
redis==5.0.1
django-redis==5.4.0
# ... rest
```

Then install in stages in Dockerfile:
```dockerfile
RUN pip install --timeout=1000 -r requirements-core.txt
RUN pip install --timeout=1000 -r requirements-additional.txt
```

### Solution 6: Use a Mirror (For slow regions)
```bash
# Chinese PyPI mirror (faster in Asia)
docker build \
  --build-arg PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple \
  -t conveyor-server:latest \
  conveyor-server/
```

## Already Applied Fixes

The Dockerfile has been updated with:
- `--timeout=1000`: Increased timeout from default 15s to 1000s
- `--retries=10`: Retry up to 10 times on failure
- `--default-timeout=1000`: Set default timeout for all operations

## Recommended Approach

**Step 1:** Use BuildKit (fastest, uses cache)
```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

**Step 2:** If still failing, use the optimized Dockerfile:
```bash
cd conveyor-server
chmod +x docker-build-fix.sh
./docker-build-fix.sh
# Choose option 1
```

**Step 3:** If still issues, check:
- Internet connection stability
- Docker resources (memory/CPU)
- Firewall/VPN settings
- PyPI availability: https://status.python.org/

## Alternative: Pull Pre-built Image

If building locally continues to fail, you can:

1. Build on a server with better internet
2. Push to Docker Hub
3. Pull on local machine

```bash
# On server
docker build -t your-registry/conveyor-server:latest .
docker push your-registry/conveyor-server:latest

# On local machine
docker pull your-registry/conveyor-server:latest
docker tag your-registry/conveyor-server:latest conveyor-server:latest
```

## Docker Compose Quick Fix

Update docker-compose.yml to use the optimized Dockerfile:

```yaml
services:
  server:
    build:
      context: ./conveyor-server
      dockerfile: Dockerfile.optimized  # Use optimized version
    # ... rest of config
```

## Debugging Commands

```bash
# Check Docker BuildKit status
docker buildx version

# Enable BuildKit globally
echo '{"features": {"buildkit": true}}' > ~/.docker/daemon.json
# Restart Docker Desktop

# Check available disk space
df -h

# Check Docker system
docker system df

# Clean up to free space
docker system prune -a
```

## Network-Specific Issues

### Behind Corporate Firewall
```dockerfile
# Add to Dockerfile before pip install
ENV HTTP_PROXY="http://proxy.company.com:8080"
ENV HTTPS_PROXY="http://proxy.company.com:8080"
```

### Using VPN
- Try disabling VPN during build
- Or configure Docker to use VPN DNS

## Success Indicators

Build should complete successfully when you see:
```
Successfully built <hash>
Successfully tagged conveyor-server:latest
```

Then you can run:
```bash
docker-compose up -d
```

## Still Having Issues?

1. Check this log file: `/Users/jahlom/code/jahlom/conveyor/docker-build.log`
2. Run with verbose logging:
   ```bash
   DOCKER_BUILDKIT=1 docker-compose build --progress=plain 2>&1 | tee docker-build.log
   ```
3. Share the log for further troubleshooting

## Performance Tips

After successful build:
- Use `docker-compose up -d` instead of `--build` unless changes made
- Use `.dockerignore` to exclude unnecessary files
- Layer caching will speed up subsequent builds
- BuildKit cache significantly improves rebuild times
