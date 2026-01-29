---
name: deploy
description: |
  Deploy NanoBanana to production. Use this skill when:
  (1) User wants to deploy the latest changes
  (2) User mentions "deploy", "update production", or "ship it"
  (3) User needs to restart infrastructure services
  Handles git pull, docker compose down/up for app and shared infrastructure.
---

# Deploy

Deploy NanoBanana to production on the Raspberry Pi.

## Usage

```
/deploy              # Deploy app only (backend, frontend, redis, cloudflared)
/deploy --infra      # Restart shared infrastructure (postgres)
/deploy --all        # Deploy everything
```

---

## Architecture

NanoBanana uses a **shared_infra** Docker network for PostgreSQL, which is shared across multiple projects on the same machine.

| Component | Path | Network | Description |
|-----------|------|---------|-------------|
| **App** | `/home/pi/nanobanana` | `default` + `shared_infra` | Backend, Frontend, Redis, Cloudflared |
| **PostgreSQL** | `/home/pi/nanobanana/infra` | `shared_infra` | Shared database server (pg_server) |

The backend container connects to both the project-local `default` network (for Redis) and the external `shared_infra` network (for PostgreSQL).

---

## Deployment Workflow

### App Deployment (default)

```bash
cd /home/pi/nanobanana
git pull origin master
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker exec nanobanana-backend alembic upgrade head
```

### Infrastructure (if --infra or --all)

```bash
# Ensure shared_infra network exists
cd /home/pi/nanobanana/infra
bash create_network.sh

# PostgreSQL
docker compose -f docker-compose-postgres.yml down
docker compose -f docker-compose-postgres.yml up -d
```

---

## Agent Instructions

When this skill is invoked:

### 1. Determine Scope

Parse arguments to determine what to deploy:

| Argument | Deploy App | Restart Infra |
|----------|------------|---------------|
| (none)   | Yes        | No            |
| `--infra`| No         | Yes           |
| `--all`  | Yes        | Yes           |

### 2. Pre-Deployment Checks

```bash
# Check current git status
cd /home/pi/nanobanana && git status

# Check for uncommitted changes
git diff --stat
```

If there are uncommitted changes, **warn the user** before proceeding.

### 3. Execute Deployment

#### Shared Infrastructure (if --infra or --all)

Run this **before** the app deployment so PostgreSQL is available.

```bash
cd /home/pi/nanobanana/infra

# Ensure shared_infra network exists
bash create_network.sh

# PostgreSQL
docker compose -f docker-compose-postgres.yml down
docker compose -f docker-compose-postgres.yml up -d
```

Wait for PostgreSQL to be healthy before continuing:

```bash
docker exec pg_server pg_isready -U postgres
```

#### App Deployment (default or --all)

```bash
cd /home/pi/nanobanana

# Pull latest changes
git pull origin master

# Stop containers (prevents memory issues during build on Pi)
docker compose -f docker-compose.prod.yml down

# Rebuild and start
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker exec nanobanana-backend alembic upgrade head
```

### 4. Post-Deployment Verification

```bash
# Check all containers are running
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check for any failed containers
docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
```

Report status to user:
- List running containers
- Note any containers that failed to start
- Show recent logs if any containers failed

### 5. Troubleshooting

If containers fail to start:

```bash
# View logs for failed container
docker logs <container_name> --tail 50

# Check docker compose logs
docker compose -f docker-compose.prod.yml logs --tail 50
```

Common issues:
- **shared_infra network missing**: Run `bash /home/pi/nanobanana/infra/create_network.sh`
- **pg_server not running**: Start infra first with `/deploy --infra`
- **Port conflicts**: Another service using the same port
- **Memory issues**: Pi ran out of memory during build (use `docker compose down` first)
- **Config errors**: Environment variables missing in `.env`

---

## Safety Notes

1. **Always `docker compose down` before `up --build`** - Prevents memory crashes on low-memory Pi
2. **Infrastructure rarely needs updates** - Only restart if explicitly requested
3. **Check git status first** - Warn about uncommitted changes
4. **Verify containers after deploy** - Ensure all services started successfully
5. **shared_infra network must exist** before starting the app - the `create_network.sh` script handles this

---

## Expected Containers

After a full deployment, these containers should be running:

| Container | Service | Network |
|-----------|---------|---------|
| `pg_server` | PostgreSQL | `shared_infra` |
| `nanobanana-redis` | Redis | `default` |
| `nanobanana-backend` | FastAPI | `default` + `shared_infra` |
| `nanobanana-frontend` | Nginx (SPA) | `default` |
| `nanobanana-cloudflared` | Cloudflare Tunnel | `default` |

---

## Example Interaction

**User**: `/deploy`

**Agent**:
```
Deploying NanoBanana app...

1. Checking git status...
   - Branch: master
   - No uncommitted changes

2. Pulling latest changes...
   - 3 commits pulled

3. Stopping containers...
   - docker compose down completed

4. Building and starting...
   - docker compose up -d --build completed

5. Running migrations...
   - alembic upgrade head completed

6. Verifying deployment...
   - nanobanana-backend: running
   - nanobanana-frontend: running
   - nanobanana-redis: running
   - nanobanana-cloudflared: running

Deployment complete!
```

---

**User**: `/deploy --all`

**Agent**:
```
Deploying infrastructure + NanoBanana app...

[Infrastructure]
1. Ensuring shared_infra network exists... done
2. Starting PostgreSQL... done
3. Waiting for pg_server healthy... done

[App]
1. Pulling latest changes... done
2. docker compose down... done
3. docker compose up -d --build... done
4. Running migrations... done
5. Verification: all containers running

Deployment complete!
```
