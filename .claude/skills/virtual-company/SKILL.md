# Virtual Company Management Skill

Guide for managing virtual companies using MyVirtualOffice protocol server.

## Prerequisites

1. **Backend running** on port 8091 (or set `API_URL` env var)
2. **Protocol server** running on port 3001
3. **Remote agents** provisioned and connected (daemons running on VPS)

## Quick Start

```bash
# Login
curl -X POST -d '{"command":"LOGIN email@example.com password"}' http://localhost:3001/cmd

# Check all agents
curl -X POST -d '{"command":"GET_ALL_STATUS"}' http://localhost:3001/cmd
```

## Core Commands

### Agent Management
| Command | Description |
|---------|-------------|
| `LIST_AGENTS` | List all agents |
| `GET_ALL_STATUS` | Dashboard view of all agents (name, status, task) |
| `SELECT_AGENT <id>` | Select agent for direct commands |
| `DELETE_AGENT <id>` | Delete an agent |

### Provisioning Remote Agents
```bash
SSH_PROVISION pi@192.168.1.124 nanobanana-tech-lead ~/nanobanana
SSH_PROVISION pi@192.168.1.124 nanobanana-qa ~/nanobanana
SSH_PROVISION pi@192.168.1.124 nanobanana-ceo ~/nanobanana
SSH_PROVISION pi@192.168.1.124 nanobanana-cto ~/nanobanana
```

### Async Company Workflow

| Command | Description |
|---------|-------------|
| `BROADCAST <prompt>` | Send task to ALL idle agents (async) |
| `DISPATCH <agent> <prompt>` | Send task to specific agent (async) |
| `COLLECT_REPORTS` | Gather latest responses from all agents |

### Persistent Reports

| Command | Description |
|---------|-------------|
| `STANDUP` | Request all agents to write daily standup reports |
| `READ_STANDUPS [date]` | Read and summarize standup reports |
| `SYNC_REPO [message]` | Commit and push all changes in working directory |

### Event Triggers (Automated Handoffs)

```bash
# Add trigger: when tech-lead completes, auto-dispatch QA
ADD_TRIGGER task_complete:nanobanana-tech-lead dispatch:nanobanana-qa:Review the latest code changes

# Add trigger: log when QA completes
ADD_TRIGGER task_complete:nanobanana-qa log:QA review done - ready for CEO

# List all triggers
LIST_TRIGGERS

# Process events (fire matching triggers)
PROCESS_EVENTS

# Remove a trigger
REMOVE_TRIGGER trigger-1
```

**Event types:**
- `task_complete:<agent-name>` - Fires when agent goes idle
- `agent_idle:<agent-name>` - Same as task_complete

**Action types:**
- `dispatch:<agent>:<prompt>` - Send task to another agent
- `log:<message>` - Log a message

### Priority Queue (Interrupts & High-Priority Tasks)

```bash
# URGENT - Interrupt a working agent immediately
URGENT nanobanana-tech-lead CRITICAL - Production issue, fix the auth bug now

# QUEUE - Add high-priority task (dispatched when agent is idle)
QUEUE nanobanana-qa Review the security audit findings

# LIST_QUEUE - See all queued tasks
LIST_QUEUE

# PROCESS_QUEUE - Dispatch pending tasks to idle agents
PROCESS_QUEUE
```

**Priority levels:**
- `URGENT` - Interrupts working agents immediately (🚨 prefix)
- `QUEUE` - High priority, waits for agent to be idle (⚡ prefix)

## Typical Workflow

### 1. Morning Standup
```bash
STANDUP                    # Request standups from all agents
# Wait for completion...
GET_ALL_STATUS             # Check who's done
READ_STANDUPS              # Read the reports
SYNC_REPO "Daily standup"  # Commit reports to git
```

### 2. Assign Sprint Work
```bash
# Dispatch tasks to each role
DISPATCH nanobanana-cto "Review the PRD and create sprint tickets"
DISPATCH nanobanana-tech-lead "Implement the user registration endpoint"

# Set up automated handoffs
ADD_TRIGGER task_complete:nanobanana-tech-lead dispatch:nanobanana-qa:Review the implementation
```

### 3. Monitor Progress
```bash
GET_ALL_STATUS      # Dashboard view
COLLECT_REPORTS     # Get latest outputs
PROCESS_EVENTS      # Fire any pending triggers
```

### 4. End of Day Sync
```bash
SYNC_REPO "EOD: Implementation progress"
```

## Company Structure (NanoBanana Example)

| Role | Agent Name | Responsibilities |
|------|------------|------------------|
| CEO | nanobanana-ceo | Business strategy, market positioning, go-to-market |
| CTO/Product Owner | nanobanana-cto | Technical architecture, product roadmap, sprint planning |
| Tech Lead | nanobanana-tech-lead | Write code, implementation decisions, code quality |
| QA Engineer | nanobanana-qa | Review code, write tests, quality gates |

## Troubleshooting

### Agents Offline
Daemons on VPS may have disconnected. Quick restart all offline agents:
```bash
RESTART_DAEMONS pi@192.168.1.124
```

Or re-provision individually:
```bash
SSH_PROVISION pi@192.168.1.124 nanobanana-tech-lead ~/nanobanana
```

### Check VPS Daemon Logs
```bash
ssh pi@192.168.1.124 "cat ~/.myoffice/daemon_*.log | tail -50"
```

### Restart Protocol Server (Docker)
```bash
docker compose -f docker-compose.dev.yml restart protocol
```

## Daemon Reliability

The daemon now auto-reconnects forever with capped backoff:
- `reconnect_attempts: -1` (infinite retries)
- `reconnect_max_delay: 60` (max 60s between retries)

To install as systemd service on VPS (auto-start on boot):
```bash
ssh pi@192.168.1.124 "sudo cp myoffice-agent.service /etc/systemd/system/ && sudo systemctl enable myoffice-agent"
```
