#!/bin/bash

# Database initialization script for local development
# This script helps set up the PostgreSQL database and run migrations

set -e  # Exit on error

echo "🍌 NanoBanana Database Initialization"
echo "===================================="
echo ""

# Configuration
DB_NAME="${DATABASE_NAME:-nanobanana}"
DB_USER="${DATABASE_USER:-postgres}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"

# Function to check if PostgreSQL is running
check_postgres() {
    echo "📡 Checking PostgreSQL connection..."
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
        echo "❌ Error: PostgreSQL is not running on $DB_HOST:$DB_PORT"
        echo ""
        echo "Please start PostgreSQL first. Options:"
        echo "  - Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16"
        echo "  - Local: brew services start postgresql (macOS)"
        echo "  - Local: sudo systemctl start postgresql (Linux)"
        echo ""
        exit 1
    fi
    echo "✅ PostgreSQL is running"
}

# Function to create database if it doesn't exist
create_database() {
    echo ""
    echo "🔨 Creating database '$DB_NAME' if it doesn't exist..."

    # Check if database exists
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo "✅ Database '$DB_NAME' already exists"
    else
        # Create database
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>&1
        echo "✅ Database '$DB_NAME' created successfully"
    fi
}

# Function to run Alembic migrations
run_migrations() {
    echo ""
    echo "🚀 Running Alembic migrations..."
    cd "$(dirname "$0")/.."  # Go to backend directory

    # Show current revision
    echo "Current database revision:"
    alembic current || echo "No migrations applied yet"

    echo ""
    echo "Upgrading to latest revision..."
    alembic upgrade head

    echo ""
    echo "✅ Migrations completed!"
    echo ""
    echo "Current database revision:"
    alembic current
}

# Function to show database info
show_info() {
    echo ""
    echo "📊 Database Information"
    echo "======================"
    echo "Database: $DB_NAME"
    echo "Host: $DB_HOST:$DB_PORT"
    echo "User: $DB_USER"
    echo ""
    echo "Connection String:"
    echo "postgresql+asyncpg://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
    echo "Add this to your .env file:"
    echo "DATABASE_URL=postgresql+asyncpg://$DB_USER:YOUR_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
}

# Main execution
main() {
    check_postgres
    create_database
    run_migrations
    show_info

    echo "🎉 Database initialization complete!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with the DATABASE_URL above"
    echo "2. Run the application: uvicorn app.main:app --reload"
    echo ""
}

# Run main function
main
