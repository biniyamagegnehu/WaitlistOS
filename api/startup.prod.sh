#!/usr/bin/env bash
set -e

# Wait for PostgreSQL database to be ready
echo "==> Waiting for database to be ready..."
if [ -n "$DATABASE_HOST" ]; then
  /opt/wait-for-it.sh "${DATABASE_HOST}:${DATABASE_PORT:-5432}" --timeout=60 --strict -- echo "Database is ready"
fi

# Ensure uploads/files directory exists
mkdir -p /usr/src/app/files /usr/src/app/uploads

# Apply database migrations
echo "==> Applying database migrations..."
npx prisma migrate resolve --rolled-back 20260916090000_sync_schema 2>/dev/null || true
npx prisma migrate deploy

# Seed initial database records (Subscription plans: Free, Starter, Pro)
echo "==> Seeding initial database records..."
npm run seed || true

# Start production server
echo "==> Starting NestJS API server on port ${PORT:-3000}..."
exec node dist/main.js
