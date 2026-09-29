#!/usr/bin/env bash
set -euo pipefail

APP_ROOT=/var/www/artifieddiy
cd "${APP_ROOT}/deployment"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not on PATH." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Create ${APP_ROOT}/deployment/.env from .env.example and set production values." >&2
  exit 1
fi

for app in api website admin; do
  if [[ ! -f "${APP_ROOT}/${app}/Dockerfile" ]]; then
    echo "Missing ${APP_ROOT}/${app}/Dockerfile" >&2
    exit 1
  fi
done

require_set() {
  local key="$1"
  local line value=""
  while IFS= read -r line || [[ -n "${line}" ]]; do
    [[ "${line}" == "${key}="* ]] || continue
    value="${line#"${key}"=}"
  done < .env
  if [[ -z "${value//[[:space:]]/}" ]]; then
    echo "Set ${key} in ${APP_ROOT}/deployment/.env" >&2
    exit 1
  fi
  printf '%s' "${value}"
}

jwt="$(require_set JWT_SECRET)"
if [[ "${jwt}" == "dev-only-change-me" ]]; then
  echo "Replace the dev JWT_SECRET in ${APP_ROOT}/deployment/.env" >&2
  exit 1
fi

node_env="$(require_set NODE_ENV)"
if [[ "${node_env}" != "production" ]]; then
  echo "Set NODE_ENV=production in ${APP_ROOT}/deployment/.env" >&2
  exit 1
fi

require_set GOOGLE_CLIENT_ID >/dev/null
require_set GOOGLE_CLIENT_SECRET >/dev/null
require_set GOOGLE_CALLBACK_URL >/dev/null
require_set API_PUBLIC_URL >/dev/null
require_set WEB_ORIGIN >/dev/null
require_set ADMIN_ORIGIN >/dev/null
require_set COOKIE_DOMAIN >/dev/null
require_set CORS_ORIGINS >/dev/null
require_set CERTBOT_EMAIL >/dev/null

echo "Building and starting the production stack..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --wait
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
