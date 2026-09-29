# Deploy and update

Compose files live in this directory. Each app still builds from its own Dockerfile:

| Service | Image context | Prod process | Port |
| --- | --- | --- | --- |
| API | `api/Dockerfile` | `node dist/main.js` | 2201 |
| Website | `website/Dockerfile` | Next.js standalone | 2202 |
| Admin | `admin/Dockerfile` | nginx serving the Vite build | 2203 |
| MongoDB | `mongo:7` | data in the `mongo_data` volume | internal |
| nginx | `nginx:1.27-alpine` | public HTTP and HTTPS | 80, 443 |
| Certbot | `certbot/certbot` | Let's Encrypt certificates | internal |

Public hostnames are set in `nginx/http.conf` and `nginx/ssl.conf`:

- `artifieddiy.com` and `www.artifieddiy.com` → website
- `api.artifieddiy.com` → API (request body up to 110MB; project files are capped at 100MB)
- `admin.artifieddiy.com` → admin

Uploaded project files are stored in the `uploads` volume, mounted at `/data/uploads` in the API container.

## Requirements

Ubuntu server. The host packages are Docker Engine and the Compose plugin. Node, MongoDB, and nginx come from the images in this directory.

```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

Allow your user to run Docker without `sudo`, then log in again:

```bash
sudo usermod -aG docker "$USER"
docker compose version
```

Also required before the first deploy:

- DNS A or AAAA records for `artifieddiy.com`, `www.artifieddiy.com`, `api.artifieddiy.com`, and `admin.artifieddiy.com` pointing at that server
- Ports 80 and 443 open. Certbot obtains certificates once those names resolve to the server, and nginx reloads onto HTTPS
- A Google OAuth client (Web application)

Copy these directories onto the server so they sit next to each other:

```text
/var/www/artifieddiy/api
/var/www/artifieddiy/website
/var/www/artifieddiy/admin
/var/www/artifieddiy/deployment
```

Scripts in `deployment/` always run against that path.

## First deploy

On the server:

```bash
cd /var/www/artifieddiy/deployment
cp .env.example .env
```

Edit `.env` before the first start. Production values:

```bash
JWT_SECRET=<long random string>
GOOGLE_CLIENT_ID=<from Google Cloud>
GOOGLE_CLIENT_SECRET=<from Google Cloud>
GOOGLE_CALLBACK_URL=https://api.artifieddiy.com/auth/google/callback
ADMIN_EMAILS=artifieddiy@gmail.com,mhdhadjar@gmail.com
YOUTUBE_API_KEY=<YouTube Data API key>
COOKIE_DOMAIN=.artifieddiy.com
WEB_ORIGIN=https://artifieddiy.com
ADMIN_ORIGIN=https://admin.artifieddiy.com
API_PUBLIC_URL=https://api.artifieddiy.com
CORS_ORIGINS=https://artifieddiy.com,https://www.artifieddiy.com,https://admin.artifieddiy.com
NODE_ENV=production
CERTBOT_EMAIL=artifieddiy@gmail.com
```

`MONGODB_URI` stays `mongodb://mongo:27017/artifieddiy`. Compose injects that hostname; do not point it at localhost inside the stack.

In Google Cloud, for the same OAuth client:

- Authorized JavaScript origins: `https://artifieddiy.com` and `https://admin.artifieddiy.com`
- Authorized redirect URI: `https://api.artifieddiy.com/auth/google/callback`

`ADMIN_EMAILS` is the allowlist for admin access. Anyone else who signs in with Google is a regular user.

`API_PUBLIC_URL`, `WEB_ORIGIN`, and `ADMIN_ORIGIN` are baked into the website and admin images at build time. Set them before the first build.

Start the stack:

```bash
./deploy.sh
```

`deploy.sh` checks that `.env` is filled in for production, builds every image, and waits until the containers are up. MongoDB data, uploads, and Let's Encrypt certificates are stored in named volumes (`mongo_data`, `uploads`, `letsencrypt`).

nginx starts on port 80 and proxies the apps immediately. The certbot container requests one certificate for all four hostnames. When that certificate is stored, nginx switches those hostnames to HTTPS and redirects port 80. Renewal runs twice a day. Follow the request with:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f certbot
```

Check that it came up:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f api
```

The API is ready when `GET /health` succeeds. From the server, after certbot has stored the certificate:

```bash
curl -fsS https://api.artifieddiy.com/health
```

## Update

Copy the changed directory over the matching path under `/var/www/artifieddiy/`, then run the matching script:

```bash
cd /var/www/artifieddiy/deployment
./update-api.sh        # after replacing api/
./update-website.sh    # after replacing website/
./update-admin.sh      # after replacing admin/
```

Each script rebuilds only that app and leaves MongoDB, uploads, and certificates in their volumes (`mongo_data`, `uploads`, `letsencrypt`). Do not run `docker compose down -v`.

Run `./deploy.sh` again when Compose files, the `deployment` directory, or several apps changed together. nginx reloads itself within a few seconds when files inside the running `deployment/nginx/` directory change.

After changing `.env`:

- API, cookies, CORS, and Mongo settings are read when the API container starts. Run `./update-api.sh`.
- `API_PUBLIC_URL`, `WEB_ORIGIN`, and `ADMIN_ORIGIN` are compiled into the website and admin images. Run `./update-website.sh` and `./update-admin.sh` after changing them.

Follow logs if a container restarts:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail 100
```

## Local stack

For a full stack on your machine, from this directory:

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Published ports: API `2201`, website `2202`, admin `2203`, MongoDB `27017`. Source directories are mounted into the containers, so edits reload without a rebuild. The dev stack does not run nginx or certbot.

The website and admin dev servers read public URLs from the environment (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_SITE_URL`, `VITE_API_URL`, `VITE_WEB_URL`). Defaults in `docker-compose.dev.yml` point at localhost.

Running the API with `nodemon` outside Docker still reads `api/.env`. Copy `.env.example` there and set `MONGODB_URI` to `mongodb://127.0.0.1:27017/artifieddiy` when MongoDB is on the host.
