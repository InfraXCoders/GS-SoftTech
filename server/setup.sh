#!/usr/bin/env bash
# ============================================================
# GS SoftTech — Ubuntu VPS one-time setup script
# Run as root or sudo user on a fresh Ubuntu 22.04 / 24.04
# Usage: sudo bash setup.sh
# ============================================================
set -euo pipefail

DOMAIN="gssofttech.com"
WEBROOT="/var/www/${DOMAIN}/html"
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
DEPLOY_USER="${SUDO_USER:-ubuntu}"   # the user GitHub Actions SSH's in as

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  GS SoftTech VPS Setup — ${DOMAIN}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. System update ─────────────────────────────────────────
echo "[1/7] Updating packages..."
apt update -qq && apt upgrade -y -qq

# ── 2. Install Nginx & Certbot ───────────────────────────────
echo "[2/7] Installing Nginx and Certbot..."
apt install -y -qq nginx certbot python3-certbot-nginx ufw rsync

# ── 3. Firewall ──────────────────────────────────────────────
echo "[3/7] Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── 4. Web root ──────────────────────────────────────────────
echo "[4/7] Creating web root..."
mkdir -p "${WEBROOT}"
chown -R www-data:www-data /var/www/${DOMAIN}
chmod -R 755 /var/www/${DOMAIN}

# Allow deploy user to write to webroot via rsync (GitHub Actions)
usermod -aG www-data "${DEPLOY_USER}"
echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/chown, /usr/bin/chmod, /usr/sbin/nginx, /usr/bin/systemctl reload nginx" \
  >> /etc/sudoers.d/github-deploy
chmod 440 /etc/sudoers.d/github-deploy

# ── 5. Nginx config ──────────────────────────────────────────
echo "[5/7] Installing Nginx config (HTTP only for now)..."
cat > "${NGINX_CONF}" << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name gssofttech.com www.gssofttech.com;

    root /var/www/gssofttech.com/html;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    location ~ /\. { deny all; }
}
NGINXCONF

ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/${DOMAIN}
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 6. SSL via Let's Encrypt ─────────────────────────────────
echo "[6/7] Issuing SSL certificate..."
echo ""
echo "  ⚠  Make sure your GoDaddy DNS A records point to this"
echo "     server's IP before continuing. Press ENTER when ready."
read -r

certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "info@${DOMAIN}" \
  --redirect

# Auto-renew cron (certbot installs its own timer, but add a fallback)
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -

# ── 7. Copy final nginx config with SSL headers ──────────────
echo "[7/7] Applying hardened Nginx SSL config..."
# (Copy the nginx.conf from the repo after first cert issuance)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Push to master — GitHub Actions will deploy the site."
echo "  2. Visit https://${DOMAIN} to confirm."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
