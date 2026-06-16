#!/usr/bin/env bash
# ============================================================
# GS SoftTech — Ubuntu VPS one-time setup script
# Run as root or sudo user on a fresh Ubuntu 22.04 / 24.04
# Usage: sudo bash setup.sh
#
# Handles Docker containers occupying port 80 by remapping
# them to port 8080 before starting Nginx on 80/443.
# ============================================================
set -euo pipefail

DOMAIN="gssofttech.com"
WEBROOT="/var/www/${DOMAIN}/html"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
DEPLOY_USER="${SUDO_USER:-ubuntu}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GS SoftTech VPS Setup — ${DOMAIN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. System update ─────────────────────────────────────────
echo "[1/8] Updating packages..."
apt update -qq && apt upgrade -y -qq

# ── 2. Install Nginx & Certbot ───────────────────────────────
echo "[2/8] Installing Nginx and Certbot..."
apt install -y -qq nginx certbot python3-certbot-nginx ufw rsync

# ── 3. Free port 80 from Docker ──────────────────────────────
echo "[3/8] Checking port 80 for conflicts..."

PORT80_PID=$(ss -tlnp | awk '/:80 /{match($0,/pid=([0-9]+)/,a); print a[1]}' | head -1)

if [ -n "${PORT80_PID}" ]; then
  PROCESS=$(ps -p "${PORT80_PID}" -o comm= 2>/dev/null || echo "unknown")
  echo "  ⚠  Port 80 is held by: ${PROCESS} (PID ${PORT80_PID})"

  if command -v docker &>/dev/null; then
    # Find Docker containers mapped to host port 80
    CONTAINERS=$(docker ps --format '{{.ID}} {{.Names}} {{.Ports}}' \
                 | grep '0.0.0.0:80->' | awk '{print $1}')

    if [ -n "${CONTAINERS}" ]; then
      echo "  Found Docker container(s) on port 80 — remapping to 8080..."

      for CID in ${CONTAINERS}; do
        CNAME=$(docker inspect --format '{{.Name}}' "${CID}" | sed 's|/||')
        IMAGE=$(docker inspect --format '{{.Config.Image}}' "${CID}")
        ENV_FLAGS=$(docker inspect --format \
          '{{range .Config.Env}}--env {{.}} {{end}}' "${CID}")
        VOL_FLAGS=$(docker inspect --format \
          '{{range .Mounts}}-v {{.Source}}:{{.Destination}} {{end}}' "${CID}")
        RESTART=$(docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' "${CID}")

        echo "  Stopping container: ${CNAME} (${IMAGE})"
        docker stop "${CID}"
        docker rm "${CID}"

        echo "  Restarting ${CNAME} on port 8080..."
        # shellcheck disable=SC2086
        docker run -d \
          --name "${CNAME}" \
          --restart "${RESTART:-always}" \
          -p 8080:80 \
          ${ENV_FLAGS} \
          ${VOL_FLAGS} \
          "${IMAGE}"

        echo "  ✅ ${CNAME} now reachable on http://localhost:8080"
      done
    else
      echo "  Non-Docker process on port 80 — killing PID ${PORT80_PID}..."
      kill "${PORT80_PID}" || true
      sleep 1
    fi
  else
    echo "  Killing PID ${PORT80_PID}..."
    kill "${PORT80_PID}" || true
    sleep 1
  fi
else
  echo "  Port 80 is free."
fi

# ── 4. Firewall ──────────────────────────────────────────────
echo "[4/8] Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 8080/tcp   # Docker app still accessible directly if needed
ufw --force enable

# ── 5. Web root ──────────────────────────────────────────────
echo "[5/8] Creating web root..."
mkdir -p "${WEBROOT}"
chown -R www-data:www-data /var/www/${DOMAIN}
chmod -R 755 /var/www/${DOMAIN}

# Allow deploy user to rsync and reload nginx without password
usermod -aG www-data "${DEPLOY_USER}" || true
SUDOERS_FILE="/etc/sudoers.d/github-deploy"
if [ ! -f "${SUDOERS_FILE}" ]; then
  echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/chown, /usr/bin/chmod, /usr/sbin/nginx, /bin/systemctl reload nginx" \
    > "${SUDOERS_FILE}"
  chmod 440 "${SUDOERS_FILE}"
fi

# ── 6. Nginx config (HTTP) ───────────────────────────────────
echo "[6/8] Installing Nginx config..."
cat > "${NGINX_CONF}" << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name gssofttech.com www.gssofttech.com;

    root /var/www/gssofttech.com/html;
    index index.html;

    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/gssofttech.com/html;
    }

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    location ~ /\.(?!well-known) { deny all; }
}
NGINXCONF

ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/${DOMAIN}
rm -f /etc/nginx/sites-enabled/default

# Start / reload Nginx
systemctl enable nginx
systemctl start nginx || systemctl reload nginx
echo "  ✅ Nginx is running on port 80"

# ── 7. SSL via Let's Encrypt ─────────────────────────────────
echo "[7/8] Issuing SSL certificate..."
echo ""
echo "  ⚠  Make sure GoDaddy DNS A records point to this server's IP."
echo "     Press ENTER when DNS is ready (or Ctrl+C to skip SSL for now)."
read -r

certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "info@${DOMAIN}" \
  --redirect

# Auto-renew
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") \
  | sort -u | crontab -

# ── 8. Apply hardened Nginx config ───────────────────────────
echo "[8/8] Applying hardened Nginx config with security headers..."
cp "${WEBROOT}/server/nginx.conf" "${NGINX_CONF}"
nginx -t && systemctl reload nginx

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Setup complete!"
echo ""
echo "  Website : https://${DOMAIN}"
echo "  Web root: ${WEBROOT}"
if command -v docker &>/dev/null && docker ps | grep -q 8080; then
  echo "  Docker  : http://$(hostname -I | awk '{print $1}'):8080"
fi
echo ""
echo "  Push to master branch to deploy via GitHub Actions."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
