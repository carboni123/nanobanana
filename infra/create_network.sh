#!/usr/bin/env bash

set -e

NETWORK_NAME="shared_infra"

echo "Checking if Docker network '$NETWORK_NAME' exists..."

if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  echo "Docker network '$NETWORK_NAME' already exists. ✅"
else
  echo "Docker network '$NETWORK_NAME' not found. Creating it..."
  docker network create --driver bridge "$NETWORK_NAME"
  echo "Docker network '$NETWORK_NAME' created. ✅"
fi
