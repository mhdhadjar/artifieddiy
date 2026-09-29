#!/bin/sh
set -eu

if [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "Set CERTBOT_EMAIL" >&2
  exit 1
fi

issue() {
  certbot certonly \
    --webroot -w /var/www/certbot \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --keep-until-expiring \
    -d artifieddiy.com \
    -d www.artifieddiy.com \
    -d api.artifieddiy.com \
    -d admin.artifieddiy.com
}

echo "Requesting a certificate for artifieddiy.com..."
until issue; do
  echo "Certificate request failed. Retrying in 15 minutes." >&2
  sleep 900
done

echo "Certificate is in place. Renewing twice a day."
while true; do
  certbot renew --webroot -w /var/www/certbot
  sleep 12h
done
