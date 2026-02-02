#!/bin/bash

echo "========================================="
echo "Docker Compose Variable Coverage Check"
echo "========================================="
echo ""

# Extract all variables referenced in docker-compose.prod.yml
echo "Variables referenced in docker-compose.prod.yml:"
echo "-------------------------------------------------"
grep -oE '\$\{[A-Z_]+[:-]?[^}]*\}' docker-compose.prod.yml | sed 's/\${//g' | sed 's/[:-].*}//g' | sed 's/}//g' | sort -u

echo ""
echo "Variables defined in .env:"
echo "--------------------------"
grep -v '^#' .env | grep -v '^$' | cut -d'=' -f1 | sort

echo ""
echo "Cross-reference check:"
echo "----------------------"

# Load .env
set -a
source .env
set +a

# Check each variable from docker-compose
for var in $(grep -oE '\$\{[A-Z_]+[:-]?[^}]*\}' docker-compose.prod.yml | sed 's/\${//g' | sed 's/[:-].*}//g' | sed 's/}//g' | sort -u); do
    # Special handling for variables with defaults
    if grep -q "\${${var}:-" docker-compose.prod.yml; then
        echo "✓ $var (has default in docker-compose)"
    elif [ -z "${!var}" ]; then
        echo "✗ $var: NOT SET in .env"
    else
        echo "✓ $var: SET in .env"
    fi
done
