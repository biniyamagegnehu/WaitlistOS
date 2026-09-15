#!/usr/bin/env bash
set -e

# Wait for PostgreSQL database to be ready
echo "==> Waiting for database to be ready..."
if [ -n "$DATABASE_HOST" ]; then
  /opt/wait-for-it.sh "${DATABASE_HOST}:${DATABASE_PORT:-5432}" --timeout=60 --strict -- echo "Database is ready"
fi

# Ensure uploads/files directory exists
mkdir -p /usr/src/app/files /usr/src/app/uploads

# Run prisma migration / db push
echo "==> Applying database schema..."
npx prisma migrate deploy || npx prisma db push --skip-generate

# Start production server
echo "==> Starting NestJS API server on port ${PORT:-3000}..."
exec node dist/main.js
