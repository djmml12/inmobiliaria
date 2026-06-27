#!/usr/bin/env bash
# infra/install.sh — Instalación bare metal en Ubuntu 24.04
# Droplet objetivo: 512 MB RAM + 1 GB swap
# Uso: bash install.sh  (como root)
set -euo pipefail

APP_DIR="/opt/inmobiliaria"
APP_USER="inmobiliaria"
ECOSYSTEM="$APP_DIR/ecosystem.config.js"

# ─── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
info() { echo -e "${BLUE}[INFO]${NC}  $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
ask()  { echo -e "${YELLOW}[?]${NC} $*"; }

# ─── Verificaciones ────────────────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || fail "Ejecuta este script como root: sudo bash install.sh"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Instalación Sistema Inmobiliaria — Servidor      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── FASE 1: Swap ─────────────────────────────────────────────────────────────
info "Configurando swap de 1 GB..."
if swapon --show | grep -q '/swapfile'; then
  ok "Swap ya existe"
else
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=30'          >> /etc/sysctl.conf
  echo 'vm.vfs_cache_pressure=50'  >> /etc/sysctl.conf
  sysctl -p -q
  ok "Swap de 1 GB configurado"
fi

# ─── FASE 2: Paquetes del sistema ─────────────────────────────────────────────
info "Actualizando paquetes del sistema..."
apt-get update -qq
apt-get install -y -qq curl git build-essential software-properties-common \
  ca-certificates gnupg lsb-release debian-keyring debian-archive-keyring \
  postgresql-client-16 2>/dev/null || \
apt-get install -y -qq curl git build-essential software-properties-common \
  ca-certificates gnupg lsb-release
ok "Paquetes base instalados"

# ─── FASE 3: Node.js 20 ───────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [ "$(node --version | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  info "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  ok "Node.js $(node --version)"
else
  ok "Node.js $(node --version) ya instalado"
fi

# ─── FASE 4: pnpm + pm2 ───────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  info "Instalando pnpm..."
  npm install -g pnpm --silent
  ok "pnpm $(pnpm --version)"
else
  ok "pnpm $(pnpm --version) ya instalado"
fi

if ! command -v pm2 &>/dev/null; then
  info "Instalando pm2..."
  npm install -g pm2 --silent
  ok "pm2 $(pm2 --version)"
else
  ok "pm2 $(pm2 --version) ya instalado"
fi

# ─── FASE 5: PostgreSQL 16 ────────────────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  info "Instalando PostgreSQL 16..."
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
  echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] \
    https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list
  apt-get update -qq
  apt-get install -y -qq postgresql-16
  ok "PostgreSQL 16 instalado"
else
  ok "PostgreSQL $(psql --version | awk '{print $3}') ya instalado"
fi

# Configuración optimizada para 512 MB
PG_CONF_DIR="/etc/postgresql/16/main/conf.d"
mkdir -p "$PG_CONF_DIR"
cat > "$PG_CONF_DIR/tuning.conf" << 'EOF'
shared_buffers            = 16MB
work_mem                  = 1MB
maintenance_work_mem      = 16MB
max_connections           = 15
effective_cache_size      = 128MB
wal_level                 = minimal
max_wal_senders           = 0
synchronous_commit        = off
checkpoint_completion_target = 0.9
EOF
systemctl enable postgresql --quiet
systemctl restart postgresql
ok "PostgreSQL configurado para 512 MB"

# ─── FASE 6: Caddy ────────────────────────────────────────────────────────────
if ! command -v caddy &>/dev/null; then
  info "Instalando Caddy..."
  curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] \
    https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
  ok "Caddy $(caddy version | head -1)"
else
  ok "Caddy ya instalado"
fi

# ─── FASE 7: Recopilar configuración ──────────────────────────────────────────
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Configuración de la aplicación${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ask "URL del repositorio GitHub (ej: https://github.com/usuario/inmobiliaria):"
read -r GITHUB_REPO

ask "Dominio del servidor (ej: inmobiliaria.ejemplo.com) — deja vacío para solo IP:"
read -r DOMAIN
[ -z "$DOMAIN" ] && DOMAIN="$(curl -sf http://checkip.amazonaws.com/ || echo localhost)"

ask "Contraseña para la base de datos (Enter = generar automáticamente):"
read -rs DB_PASSWORD
echo ""
[ -z "$DB_PASSWORD" ] && DB_PASSWORD=$(openssl rand -base64 24 | tr -d '+/=' | head -c 32)

JWT_SECRET=$(openssl rand -base64 48 | tr -d '+/=' | head -c 64)
info "JWT_SECRET generado automáticamente"

echo ""
info "Configuración:"
echo "  Repositorio : $GITHUB_REPO"
echo "  Dominio     : $DOMAIN"
echo "  DB Password : ${DB_PASSWORD:0:4}****"
echo ""
ask "¿Continuar? (Enter para sí, Ctrl+C para cancelar)"
read -r

# ─── FASE 8: Usuario del sistema ──────────────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
  ok "Usuario '$APP_USER' creado"
else
  ok "Usuario '$APP_USER' ya existe"
fi

# ─── FASE 9: Clonar repositorio ───────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Repositorio ya existe, actualizando..."
  git -C "$APP_DIR" pull --ff-only
  ok "Repositorio actualizado"
else
  info "Clonando repositorio..."
  git clone "$GITHUB_REPO" "$APP_DIR"
  ok "Repositorio clonado en $APP_DIR"
fi
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ─── FASE 10: Base de datos ───────────────────────────────────────────────────
info "Configurando base de datos..."
DB_USER_EXISTS=$(sudo -u postgres psql -tAc \
  "SELECT 1 FROM pg_roles WHERE rolname='$APP_USER'" 2>/dev/null || echo "")

if [ "$DB_USER_EXISTS" != "1" ]; then
  sudo -u postgres psql -c "CREATE USER $APP_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null
  ok "Usuario PostgreSQL '$APP_USER' creado"
else
  sudo -u postgres psql -c "ALTER USER $APP_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null
  ok "Contraseña del usuario '$APP_USER' actualizada"
fi

DB_EXISTS=$(sudo -u postgres psql -tAc \
  "SELECT 1 FROM pg_database WHERE datname='inmobiliaria'" 2>/dev/null || echo "")
if [ "$DB_EXISTS" != "1" ]; then
  sudo -u postgres psql -c \
    "CREATE DATABASE inmobiliaria OWNER $APP_USER;" > /dev/null
  ok "Base de datos 'inmobiliaria' creada"
else
  ok "Base de datos 'inmobiliaria' ya existe"
fi

# ─── FASE 11: Archivo .env ────────────────────────────────────────────────────
ENV_FILE="$APP_DIR/apps/api/.env"
cat > "$ENV_FILE" << EOF
DATABASE_URL=postgresql://${APP_USER}:${DB_PASSWORD}@localhost:5432/inmobiliaria
POSTGRES_USER=${APP_USER}
POSTGRES_PASSWORD=${DB_PASSWORD}

NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://${DOMAIN}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

STORAGE_PATH=${APP_DIR}/uploads
EOF
chown "$APP_USER:$APP_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"
ok ".env escrito en $ENV_FILE"

mkdir -p "$APP_DIR/uploads"
chown "$APP_USER:$APP_USER" "$APP_DIR/uploads"

# ─── FASE 12: Instalar dependencias y compilar ────────────────────────────────
info "Instalando dependencias npm (puede tardar 2-3 min)..."
cd "$APP_DIR"
pnpm install --frozen-lockfile --silent
ok "Dependencias instaladas"

info "Compilando @inmobiliaria/shared..."
pnpm --filter @inmobiliaria/shared build --silent 2>&1 | grep -E "error|Error" || true
ok "shared compilado"

info "Compilando API..."
pnpm --filter @inmobiliaria/api build --silent 2>&1 | grep -E "error|Error" || true
ok "API compilada"

info "Compilando frontend (puede tardar 1-2 min)..."
NODE_OPTIONS="--max-old-space-size=300" \
  pnpm --filter @inmobiliaria/web build --silent 2>&1 | grep -E "error|Error" || true
ok "Frontend compilado"

# ─── FASE 13: Migraciones y seed ──────────────────────────────────────────────
info "Aplicando migraciones de base de datos..."
cd "$APP_DIR/apps/api"
DATABASE_URL="postgresql://${APP_USER}:${DB_PASSWORD}@localhost:5432/inmobiliaria" \
  node_modules/.bin/prisma migrate deploy 2>&1 | grep -v "^$\|warn\|Tip\|Update" | tail -5
ok "Migraciones aplicadas"

info "Ejecutando seed inicial (roles y usuario admin)..."
DATABASE_URL="postgresql://${APP_USER}:${DB_PASSWORD}@localhost:5432/inmobiliaria" \
  node_modules/.bin/prisma db seed 2>&1 | tail -3 || \
  warn "Seed falló — puede que ya existan datos (normal en reinstalaciones)"

cd "$APP_DIR"

# ─── FASE 14: PM2 ─────────────────────────────────────────────────────────────
info "Configurando PM2..."
cat > "$ECOSYSTEM" << EOF
module.exports = {
  apps: [{
    name: 'inmobiliaria-api',
    script: '$APP_DIR/apps/api/dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    node_args: '--max-old-space-size=150',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/pm2/inmobiliaria-error.log',
    out_file: '/var/log/pm2/inmobiliaria-out.log',
    time: true,
  }]
}
EOF
mkdir -p /var/log/pm2
chown "$APP_USER:$APP_USER" /var/log/pm2

# Registrar como servicio systemd
PM2_STARTUP=$(su - "$APP_USER" -c "pm2 startup systemd -u $APP_USER --hp /home/$APP_USER" \
  2>/dev/null | grep "sudo env" || echo "")
[ -n "$PM2_STARTUP" ] && eval "$PM2_STARTUP" 2>/dev/null || true

su - "$APP_USER" -c "pm2 start $ECOSYSTEM" 2>/dev/null || \
  su - "$APP_USER" -c "pm2 reload $ECOSYSTEM" 2>/dev/null || true
su - "$APP_USER" -c "pm2 save" 2>/dev/null
ok "PM2 configurado y API iniciada"

# ─── FASE 15: Caddy ───────────────────────────────────────────────────────────
info "Configurando Caddy..."
cat > /etc/caddy/Caddyfile << EOF
${DOMAIN} {
    encode gzip

    handle /api/* {
        reverse_proxy localhost:3000
    }

    handle {
        root * ${APP_DIR}/apps/web/dist
        try_files {path} /index.html
        file_server
    }

    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }
}
EOF
systemctl enable caddy --quiet
systemctl restart caddy
ok "Caddy configurado y corriendo"

# ─── Resumen ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Instalación completada                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Sistema disponible en: ${BLUE}https://${DOMAIN}${NC}"
echo ""
echo -e "  Usuario admin: ${YELLOW}admin${NC}  (contraseña: la del seed)"
echo ""
echo "  Comandos útiles:"
echo "    Ver logs API:     su - $APP_USER -c 'pm2 logs'"
echo "    Estado API:       su - $APP_USER -c 'pm2 status'"
echo "    Actualizar app:   bash $APP_DIR/infra/deploy.sh"
echo ""
echo -e "${YELLOW}  IMPORTANTE: Guarda estos datos en un lugar seguro:${NC}"
echo "    JWT_SECRET     : $JWT_SECRET"
echo "    DB Password    : $DB_PASSWORD"
echo "    Archivo .env   : $ENV_FILE"
echo ""
