# NanoBanana Production Deployment Guide

This guide provides step-by-step instructions for deploying NanoBanana to a production VPS with Docker and Docker Compose already installed.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Building and Deploying](#building-and-deploying)
5. [Verifying Deployment](#verifying-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure your VPS has:

- **Docker** installed (version 20.10 or higher)
  ```bash
  docker --version
  ```

- **Docker Compose** installed (version 2.0 or higher)
  ```bash
  docker compose version
  ```

- **Git** installed
  ```bash
  git --version
  ```

- **Minimum System Requirements:**
  - 2 CPU cores
  - 4 GB RAM
  - 20 GB disk space
  - Ubuntu 20.04+ or similar Linux distribution

**Infrastructure Status**: See [docs/infrastructure-status.md](docs/infrastructure-status.md) for current Raspberry Pi production environment verification (Docker 29.2.0, 4-core ARM, 3.7GB RAM, verified and ready for deployment).

- **Network Access:**
  - Port 80 open for HTTP traffic (or configured in firewall)
  - Port 8000 for backend API (optional, internal only if using Cloudflare Tunnel)
  - Outbound internet access for pulling Docker images and API calls

- **External Services Configured:**
  - Cloudflare Tunnel token ready (for exposing to internet)
  - Google Gemini API key (for image generation)
  - Cloudflare R2 bucket created with access credentials

---

## Initial Setup

### Step 1: Clone the Repository

```bash
# Navigate to your preferred directory
cd /opt  # or /home/youruser

# Clone the repository
git clone https://github.com/your-org/nanobanana.git

# Navigate to the project directory
cd nanobanana
```

### Step 2: Verify Project Structure

Ensure all necessary files are present:

```bash
ls -la
```

You should see:
- `docker-compose.prod.yml` - Production orchestration file
- `.env.example` - Environment template
- `backend/Dockerfile` - Backend container definition
- `frontend/Dockerfile` - Frontend container definition

---

## Configuration

### Step 3: Create Environment File

Copy the example environment file and edit it with your production values:

```bash
# Copy the template
cp .env.example .env

# Edit with your preferred editor
nano .env
# or
vim .env
```

### Step 4: Configure Environment Variables

Fill in the following required values in `.env`:

#### 🔐 **Database Configuration**

```env
DB_PASSWORD=your_secure_database_password_here
```

Generate a secure password:
```bash
openssl rand -base64 32
```

#### 🔐 **Redis Configuration**

```env
REDIS_PASSWORD=your_secure_redis_password_here
```

Generate a secure password:
```bash
openssl rand -base64 32
```

#### 🔐 **Backend Security**

```env
SECRET_KEY=your_secret_key_minimum_32_characters_random_string
```

Generate a secure secret key:
```bash
openssl rand -hex 32
```

```env
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```
(Default: 7 days = 10,080 minutes)

#### 🌐 **Cloudflare Tunnel**

```env
CLOUDFLARED_TOKEN=your_cloudflare_tunnel_token_here
```

To get your tunnel token:
1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks** → **Tunnels**
3. Create a new tunnel or use existing one
4. Copy the tunnel token (long base64 string)

#### 🤖 **Google Gemini API**

```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

Get your API key from: [Google AI Studio](https://makersuite.google.com/app/apikey)

#### ☁️ **Cloudflare R2 Storage**

```env
R2_ACCESS_KEY=your_r2_access_key_id_here
R2_SECRET_KEY=your_r2_secret_access_key_here
R2_BUCKET=nanobanana-images
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
```

To get R2 credentials:
1. Go to **Cloudflare Dashboard** → **R2**
2. Create a bucket named `nanobanana-images` (or your preferred name)
3. Go to **Manage R2 API Tokens**
4. Create new API token with read/write permissions
5. Copy Access Key ID, Secret Access Key, and endpoint URL

#### 🌐 **Frontend API URL**

```env
VITE_API_URL=http://backend:8000
```

For production with Cloudflare Tunnel, keep this as `http://backend:8000` to use internal Docker networking. The tunnel will handle external access.

### Step 5: Verify Configuration

Double-check that all required variables are set:

```bash
# Check if .env file exists and has content
cat .env | grep -v '^#' | grep -v '^$'
```

Ensure no placeholder values like `your_xxx_here` remain.

**Automated Validation:**

Run the environment validation script to ensure all required variables are properly configured:

```bash
./validate_env.sh
```

This will verify:
- All required variables are set
- Password lengths meet security requirements (32+ chars)
- URL formats are valid
- Token expiration is a valid number

For docker-compose variable coverage check:

```bash
./verify_docker_compose_vars.sh
```

See [TASK3_ENV_VERIFICATION_REPORT.md](TASK3_ENV_VERIFICATION_REPORT.md) for detailed validation specifications.

---

## Building and Deploying

### Step 6: Build Docker Images

Build all services using Docker Compose:

```bash
docker compose -f docker-compose.prod.yml build
```

This will:
- Build the backend FastAPI image with Python 3.11
- Build the frontend React+Vite application and create nginx image
- Pull PostgreSQL, Redis, and Cloudflared images

**Expected time:** 5-15 minutes depending on network speed and server resources.

### Step 7: Start the Application Stack

Launch all services in detached mode:

```bash
docker compose -f docker-compose.prod.yml up -d
```

This will start:
- `nanobanana-db` - PostgreSQL database (port 5432, internal only)
- `nanobanana-redis` - Redis cache (port 6379, internal only)
- `nanobanana-backend` - FastAPI backend (port 8000)
- `nanobanana-frontend` - Nginx serving React app (port 80)
- `nanobanana-cloudflared` - Cloudflare tunnel (no exposed ports)

### Step 8: Wait for Services to Start

Check the startup progress:

```bash
docker compose -f docker-compose.prod.yml ps
```

Wait until all services show `healthy` status. This may take 30-60 seconds.

---

## Verifying Deployment

### Step 9: Check Service Health

Verify all containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME                      STATUS                    PORTS
nanobanana-backend        Up (healthy)              0.0.0.0:8000->8000/tcp
nanobanana-cloudflared    Up
nanobanana-db             Up (healthy)              5432/tcp
nanobanana-frontend       Up (healthy)              0.0.0.0:80->80/tcp
nanobanana-redis          Up (healthy)              6379/tcp
```

### Step 10: Test Backend API

Test the backend health endpoint:

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"healthy"}
```

Check API documentation:
```bash
curl http://localhost:8000/docs
```

Should return HTML for Swagger UI.

### Step 11: Test Frontend

Test the frontend:

```bash
curl http://localhost:80
```

Should return HTML content of the React application.

### Step 12: Verify External Access via Cloudflare Tunnel

Your application should now be accessible via the Cloudflare Tunnel URL.

Check tunnel status:
```bash
docker compose -f docker-compose.prod.yml logs cloudflared
```

Look for a line like:
```
Connection <id> registered connIndex=0 location=<location>
```

Visit your tunnel URL in a browser to confirm external access works.

---

## Monitoring and Maintenance

### View Logs

**View all logs:**
```bash
docker compose -f docker-compose.prod.yml logs
```

**View specific service logs:**
```bash
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs db
docker compose -f docker-compose.prod.yml logs redis
docker compose -f docker-compose.prod.yml logs cloudflared
```

**Follow logs in real-time:**
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

**View last N lines:**
```bash
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Stop Services

**Stop all services (keeps containers):**
```bash
docker compose -f docker-compose.prod.yml stop
```

**Stop specific service:**
```bash
docker compose -f docker-compose.prod.yml stop backend
```

### Restart Services

**Restart all services:**
```bash
docker compose -f docker-compose.prod.yml restart
```

**Restart specific service:**
```bash
docker compose -f docker-compose.prod.yml restart backend
```

### Shut Down and Remove Containers

**Stop and remove all containers:**
```bash
docker compose -f docker-compose.prod.yml down
```

**Remove containers and volumes (⚠️ DELETES ALL DATA):**
```bash
docker compose -f docker-compose.prod.yml down -v
```

### Update Application

To deploy new code changes:

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.prod.yml build

# Restart services with new images
docker compose -f docker-compose.prod.yml up -d

# View logs to verify successful start
docker compose -f docker-compose.prod.yml logs -f
```

### Database Backup

**Create a backup:**
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres nanobanana > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore from backup:**
```bash
cat backup_20260129_120000.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres nanobanana
```

### Monitor Resource Usage

**Check container resource usage:**
```bash
docker stats
```

**Check disk space:**
```bash
df -h
docker system df
```

---

## Troubleshooting

### Problem: Services won't start

**Symptoms:** Containers exit immediately or show unhealthy status

**Solution:**

1. Check logs for the failing service:
   ```bash
   docker compose -f docker-compose.prod.yml logs backend
   ```

2. Common causes:
   - Missing or incorrect environment variables
   - Database not ready (backend depends on db health check)
   - Port conflicts (80 or 8000 already in use)

3. Verify environment variables:
   ```bash
   docker compose -f docker-compose.prod.yml config
   ```

### Problem: Backend can't connect to database

**Symptoms:** Backend logs show connection errors to PostgreSQL

**Solution:**

1. Verify database is healthy:
   ```bash
   docker compose -f docker-compose.prod.yml ps db
   ```

2. Check database logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs db
   ```

3. Verify `DB_PASSWORD` in `.env` matches what PostgreSQL expects

4. Test database connection manually:
   ```bash
   docker compose -f docker-compose.prod.yml exec db psql -U postgres -d nanobanana
   ```

### Problem: Frontend shows API errors

**Symptoms:** Frontend loads but API calls fail with CORS or connection errors

**Solution:**

1. Verify `VITE_API_URL` is set correctly in `.env`:
   - For production: `http://backend:8000`

2. Rebuild frontend with correct API URL:
   ```bash
   docker compose -f docker-compose.prod.yml build frontend
   docker compose -f docker-compose.prod.yml up -d frontend
   ```

3. Check browser console for specific error messages

### Problem: Cloudflare Tunnel not working

**Symptoms:** Cannot access application from external URL

**Solution:**

1. Check cloudflared logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs cloudflared
   ```

2. Verify `CLOUDFLARED_TOKEN` is correct in `.env`

3. Ensure tunnel is configured in Cloudflare Dashboard:
   - Public hostname should point to `http://frontend:80`

4. Restart cloudflared:
   ```bash
   docker compose -f docker-compose.prod.yml restart cloudflared
   ```

### Problem: Out of disk space

**Symptoms:** Services crash, cannot write files

**Solution:**

1. Check disk usage:
   ```bash
   df -h
   docker system df
   ```

2. Clean up unused Docker resources:
   ```bash
   # Remove unused images
   docker image prune -a

   # Remove unused volumes (be careful!)
   docker volume prune

   # Remove all unused resources
   docker system prune -a
   ```

3. Archive and remove old logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs > logs_backup_$(date +%Y%m%d).txt
   docker compose -f docker-compose.prod.yml restart
   ```

### Problem: High memory usage

**Symptoms:** Server becomes slow, OOM errors

**Solution:**

1. Check resource usage:
   ```bash
   docker stats
   ```

2. Reduce backend workers in `backend/Dockerfile`:
   - Change `--workers 4` to `--workers 2`
   - Rebuild: `docker compose -f docker-compose.prod.yml build backend`

3. Restart services to free memory:
   ```bash
   docker compose -f docker-compose.prod.yml restart
   ```

### Problem: Port already in use

**Symptoms:** Error: `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solution:**

1. Identify what's using the port:
   ```bash
   sudo lsof -i :80
   sudo lsof -i :8000
   ```

2. Stop conflicting service or change NanoBanana ports in `docker-compose.prod.yml`:
   ```yaml
   frontend:
     ports:
       - "8080:80"  # Change external port
   ```

### Problem: Database connection pool exhausted

**Symptoms:** Backend logs show "connection pool exhausted" errors

**Solution:**

1. Restart backend to reset connections:
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   ```

2. If problem persists, check for connection leaks in application code

### Problem: Redis authentication failed

**Symptoms:** Backend logs show Redis auth errors

**Solution:**

1. Verify `REDIS_PASSWORD` is set in `.env`

2. Ensure backend and Redis use same password

3. Restart services:
   ```bash
   docker compose -f docker-compose.prod.yml restart redis backend
   ```

---

## Security Best Practices

1. **Keep secrets secure:**
   - Never commit `.env` to version control
   - Use strong, unique passwords for all services
   - Rotate secrets regularly

2. **Update regularly:**
   - Pull and deploy security updates
   - Monitor CVE advisories for dependencies

3. **Firewall configuration:**
   - Only expose port 80 (or 443) publicly
   - Block direct access to ports 8000, 5432, 6379

4. **Backups:**
   - Schedule regular database backups
   - Test backup restoration process

5. **Monitoring:**
   - Set up log aggregation
   - Configure alerts for service failures
   - Monitor resource usage trends

---

## Next Steps

After successful deployment:

1. **Set up monitoring:** Consider using tools like Prometheus, Grafana, or Docker stats
2. **Configure SSL/TLS:** Cloudflare Tunnel provides this automatically
3. **Set up automated backups:** Create cron jobs for database backups
4. **Configure log rotation:** Prevent logs from filling disk space
5. **Review security:** Run security scans, configure firewall rules

---

## Support

For issues and questions:

- **GitHub Issues:** [https://github.com/your-org/nanobanana/issues](https://github.com/your-org/nanobanana/issues)
- **Documentation:** See `README.md` for API reference
- **PRD:** See `docs/PRD.md` for product requirements

---

**Deployment Guide Version:** 1.0
**Last Updated:** 2026-01-29
**Tested On:** Ubuntu 22.04 LTS, Docker 24.0, Docker Compose 2.20
