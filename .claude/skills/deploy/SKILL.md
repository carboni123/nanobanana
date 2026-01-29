---
name: deploy
description: |
  Deploy the meuassistenteia-app to production. Use this skill when:
  (1) User wants to deploy the latest changes
  (2) User mentions "deploy", "update production", or "ship it"
  (3) User wants to update the retail microservice
  (4) User needs to restart infrastructure services
  Handles git pull, docker compose down/up for main app and microservices.
---

# Deploy

Deploy meuassistenteia-app to production on the Linux VPS.

## Usage

```
/deploy              # Deploy main app only
/deploy --retail     # Deploy main app + retail microservice
/deploy --infra      # Restart infrastructure (postgres, cloudflared)
/deploy --all        # Deploy everything
```

---

## Deployment Locations

| Component | Path | Description |
|-----------|------|-------------|
| **Main App** | `/srv/projects/meuassistenteia-app` | Backend + Frontend + Workers |
| **Retail Microservice** | `/srv/projects/meuassistenteia-app/meuassistenteia-retail` | Retail vertical extension |
| **Infrastructure** | `/srv/projects/infra` | PostgreSQL + Cloudflared (rarely updated) |

---

## Deployment Workflow

### Main App Deployment

```bash
cd /srv/projects/meuassistenteia-app
git pull origin master
docker compose down           # Prevent memory crashes during build
docker compose up -d --build  # Rebuild and start

# Run database migrations (already validated in dev)
docker exec crm-backend alembic upgrade head
```

### Retail Microservice Deployment

```bash
cd /srv/projects/meuassistenteia-app/meuassistenteia-retail
docker compose down
docker compose up -d --build
```

### Infrastructure Restart (Rare)

```bash
cd /srv/projects/infra

# PostgreSQL
docker compose -f docker-compose-postgres.yml down
docker compose -f docker-compose-postgres.yml up -d

# Cloudflared tunnel
docker compose -f docker-compose-cloudflared.yml down
docker compose -f docker-compose-cloudflared.yml up -d
```

---

## Agent Instructions

When this skill is invoked:

### 1. Determine Scope

Parse arguments to determine what to deploy:

| Argument | Deploy Main App | Deploy Retail | Restart Infra |
|----------|-----------------|---------------|---------------|
| (none) | Yes | No | No |
| `--retail` | Yes | Yes | No |
| `--infra` | No | No | Yes |
| `--all` | Yes | Yes | Yes |

### 2. Pre-Deployment Checks

Before deploying, run these checks:

```bash
# Check current git status
cd /srv/projects/meuassistenteia-app && git status

# Check for uncommitted changes
git diff --stat
```

If there are uncommitted changes, **warn the user** before proceeding.

### 3. Execute Deployment

#### Main App

```bash
cd /srv/projects/meuassistenteia-app

# Pull latest changes
git pull origin master

# Stop containers (prevents memory issues during build)
docker compose down

# Rebuild and start
docker compose up -d --build

# Run database migrations
docker exec crm-backend alembic upgrade head
```

#### Retail Microservice (if --retail or --all)

```bash
cd /srv/projects/meuassistenteia-app/meuassistenteia-retail

# Stop containers
docker compose down

# Rebuild and start
docker compose up -d --build
```

#### Infrastructure (if --infra or --all)

```bash
cd /srv/projects/infra

# PostgreSQL
docker compose -f docker-compose-postgres.yml down
docker compose -f docker-compose-postgres.yml up -d

# Cloudflared tunnel
docker compose -f docker-compose-cloudflared.yml down
docker compose -f docker-compose-cloudflared.yml up -d
```

### 4. Post-Deployment Verification

After deployment completes:

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
docker compose logs --tail 50
```

Common issues:
- **Port conflicts**: Another service using the same port
- **Memory issues**: Server ran out of memory during build
- **Network issues**: External dependencies unreachable
- **Config errors**: Environment variables missing

---

## Safety Notes

1. **Always `docker compose down` before `up --build`** - Prevents memory crashes on low-memory VPS
2. **Infrastructure rarely needs updates** - Only restart if explicitly requested
3. **Check git status first** - Warn about uncommitted changes
4. **Verify containers after deploy** - Ensure all services started successfully

---

## Example Interaction

**User**: `/deploy`

**Agent**:
```
Deploying main app...

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
   - backend: running
   - frontend: running
   - celery-worker: running
   - celery-beat: running
   - redis: running

Deployment complete!
```

---

**User**: `/deploy --retail`

**Agent**:
```
Deploying main app + retail microservice...

[Main App]
1. Pulling latest changes... done
2. docker compose down... done
3. docker compose up -d --build... done
4. Verification: all containers running

[Retail Microservice]
1. docker compose down... done
2. docker compose up -d --build... done
3. Verification: retail service running

Deployment complete!
```
