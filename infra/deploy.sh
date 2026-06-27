#!/usr/bin/env bash
# infra/deploy.sh — Actualizar la aplicación en el servidor
# Uso: bash /opt/inmobiliaria/infra/deploy.sh  (como root)
#
# IMPORTANTE: Los dist (API y web) se compilan en tu PC, no en el servidor.
# Antes de correr este script ejecuta en tu PC:
#   pnpm --filter @inmobiliaria/shared build
#   pnpm --filter @inmobiliaria/finance build
#   pnpm --filter @inmobiliaria/api build
#   pnpm --filter @inmobiliaria/web build
#   scp -r apps/api/dist root@SERVIDOR:/opt/inmobiliaria/apps/api/
#   scp -r apps/web/dist root@SERVIDOR:/opt/inmobiliaria/apps/web/
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

# 1. Actualizar código (solo para tener migraciones y configs nuevas)
info "Descargando cambios de GitHub..."
git -C "$APP_DIR" pull --ff-only
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "Código actualizado"

cd "$APP_DIR"

# 2. Migraciones (si hay nuevas)
info "Aplicando migraciones..."
DATABASE_URL="$DB_URL" pnpm --filter @inmobiliaria/api run prisma:deploy \
  2>&1 | grep -v "^$\|warn\|Tip\|Update" | tail -5
ok "Migraciones aplicadas"

# 3. Recargar API con el nuevo dist (subido desde la PC)
info "Recargando API..."
pm2 reload inmobiliaria-api
ok "API recargada"

echo ""
echo -e "${GREEN}Deploy completado.${NC}"
echo "  pm2 status  — para ver el estado de la API"
echo ""
