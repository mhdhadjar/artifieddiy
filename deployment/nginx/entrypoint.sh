#!/bin/sh
set -eu

CERT=/etc/letsencrypt/live/artifieddiy.com/fullchain.pem
ACTIVE=/etc/nginx/conf.d/site.conf
pid=""

shutdown() {
  if [ -n "$pid" ]; then
    kill -TERM "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
  exit 0
}
trap shutdown TERM INT

rm -f /etc/nginx/conf.d/default.conf

apply() {
  if [ -f "$CERT" ]; then
    cp /opt/nginx/ssl.conf "$ACTIVE"
  else
    cp /opt/nginx/http.conf "$ACTIVE"
  fi
}

fingerprint() {
  cert_sum="none"
  if [ -f "$CERT" ]; then
    cert_sum="$(sha256sum "$CERT" | awk '{print $1}')"
  fi
  conf_sum="$(sha256sum /opt/nginx/http.conf /opt/nginx/ssl.conf /etc/nginx/nginx.conf /opt/nginx/proxy-params.conf | sha256sum | awk '{print $1}')"
  printf '%s:%s' "$cert_sum" "$conf_sum"
}

apply
nginx -t
nginx -g 'daemon off;' &
pid=$!
last="$(fingerprint)"

while kill -0 "$pid" 2>/dev/null; do
  sleep 5
  sum="$(fingerprint)"
  if [ "$sum" = "$last" ]; then
    continue
  fi
  cp "$ACTIVE" "${ACTIVE}.bak"
  apply
  if nginx -t; then
    nginx -s reload
    last="$sum"
  else
    echo "nginx config test failed; keeping the previous config" >&2
    cp "${ACTIVE}.bak" "$ACTIVE"
  fi
done

wait "$pid"
