#!/usr/bin/env bash
# infra/deploy.sh — Actualizar la aplicación en el servidor
# Uso: bash /opt/inmobiliaria/infra/deploy.sh  (como root)
set -euo pipefail

APP_DIR="/opt/inmobiliaria"
APP_USER="inmobiliaria"
ENV_FILE="$APP_DIR/apps/api/.env"

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
info() { echo -e "${BLUE}[INFO]${NC}  $*"; }
fail() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Ejecuta como root: sudo bash infra/deploy.sh"
[ -d "$APP_DIR/.git" ] || fail "No se encontró el repositorio en $APP_DIR"
[ -f "$ENV_FILE" ] || fail "No se encontró $ENV_FILE — ejecuta install.sh primero"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Actualizando Sistema Inmobiliaria${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

DB_URL=$(grep DATABASE_URL "$ENV_FILE" | cut -d= -f2-)

# 1. Actualizar código
info "Descargando cambios de GitHub..."
git -C "$APP_DIR" pull --ff-only
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "Código actualizado"

cd "$APP_DIR"

# 2. Instalar dependencias nuevas (si cambió pnpm-lock.yaml)
info "Verificando dependencias..."
pnpm install --frozen-lockfile --silent
ok "Dependencias OK"

# 3. Recompilar
info "Compilando shared..."
pnpm --filter @inmobiliaria/shared build --silent
ok "shared compilado"

info "Compilando API..."
pnpm --filter @inmobiliaria/api build --silent
ok "API compilada"

info "Compilando frontend..."
NODE_OPTIONS="--max-old-space-size=300" \
  pnpm --filter @inmobiliaria/web build --silent
ok "Frontend compilado"

# 4. Migraciones
info "Aplicando migraciones..."
cd "$APP_DIR"
DATABASE_URL="$DB_URL" pnpm --filter @inmobiliaria/api run prisma:deploy \
  2>&1 | grep -v "^$\|warn\|Tip\|Update" | tail -5
ok "Migraciones aplicadas"

cd "$APP_DIR"

# 5. Recargar API (zero-downtime con pm2 reload)
info "Recargando API..."
su - "$APP_USER" -c "pm2 reload inmobiliaria-api" 2>/dev/null
ok "API recargada"

echo ""
echo -e "${GREEN}Deploy completado.${NC}  Verifica con: su - $APP_USER -c 'pm2 status'"
echo ""
