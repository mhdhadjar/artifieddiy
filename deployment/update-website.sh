#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=/var/www/artifieddiy
cd "${APP_ROOT}/deployment"

if [[ ! -f .env ]]; then
  echo "Missing ${APP_ROOT}/deployment/.env" >&2
  exit 1
fi

if [[ ! -f "${APP_ROOT}/website/Dockerfile" ]]; then
  echo "Missing ${APP_ROOT}/website/Dockerfile" >&2
  exit 1
fi

echo "Rebuilding website..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps --wait website
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps website
