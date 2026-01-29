#!/usr/bin/env bash
# Fix Docker network connections after reboot
# This handles the case where containers restart but lose external network attachments

set -e

NETWORK="shared_infra"
CONTAINERS=("pg_server")

# Wait for Docker to be fully ready
sleep 5

# Ensure network exists
if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
    echo "Creating network $NETWORK..."
    docker network create --driver bridge "$NETWORK"
fi

# Reconnect containers to network
for container in "${CONTAINERS[@]}"; do
    if docker ps -q -f name="^${container}$" | grep -q .; then
        # Check if already connected
        if ! docker inspect "$container" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -q "$NETWORK"; then
            echo "Connecting $container to $NETWORK..."
            docker network connect "$NETWORK" "$container"
        else
            echo "$container already connected to $NETWORK"
        fi
    else
        echo "Container $container not running, skipping"
    fi
done

echo "Network fix complete"
