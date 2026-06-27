#!/usr/bin/env bash
# infra/export-db.sh — Exportar la base de datos local para migrarla al servidor
# Uso: bash infra/export-db.sh
set -euo pipefail

GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
info() { echo -e "${BLUE}[INFO]${NC}  $*"; }

DB_NAME="inmobiliaria"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT="inmobiliaria_backup_${TIMESTAMP}.sql.gz"

info "Exportando base de datos '$DB_NAME'..."

# Intenta con el usuario actual, luego con postgres
if pg_dump "$DB_NAME" 2>/dev/null | gzip > "$OUTPUT"; then
  ok "Exportado como usuario: $USER"
elif sudo -u postgres pg_dump "$DB_NAME" 2>/dev/null | gzip > "$OUTPUT"; then
  ok "Exportado como usuario: postgres"
else
  echo "No se pudo exportar. Intenta manualmente:"
  echo "  pg_dump inmobiliaria | gzip > $OUTPUT"
  exit 1
fi

SIZE=$(du -h "$OUTPUT" | cut -f1)
ok "Archivo: $OUTPUT ($SIZE)"

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Próximos pasos para migrar al servidor${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "1. Sube el archivo al servidor (reemplaza IP_DEL_SERVIDOR):"
echo ""
echo -e "   ${BLUE}scp $OUTPUT root@IP_DEL_SERVIDOR:/tmp/${NC}"
echo ""
echo "2. En el servidor, restaura la base de datos:"
echo ""
echo -e "   ${BLUE}ssh root@IP_DEL_SERVIDOR${NC}"
echo -e "   ${BLUE}gunzip -c /tmp/$OUTPUT | sudo -u postgres psql inmobiliaria${NC}"
echo ""
echo "   NOTA: Ejecuta esto ANTES de correr install.sh, o DESPUÉS si ya"
echo "   tienes la base de datos creada en el servidor."
echo ""
echo -e "${YELLOW}   Si la base de datos ya tiene datos del seed, primero límpiala:${NC}"
echo -e "   ${BLUE}sudo -u postgres psql -c 'DROP DATABASE inmobiliaria;'${NC}"
echo -e "   ${BLUE}sudo -u postgres psql -c 'CREATE DATABASE inmobiliaria OWNER inmobiliaria;'${NC}"
echo -e "   ${BLUE}gunzip -c /tmp/$OUTPUT | sudo -u postgres psql inmobiliaria${NC}"
echo ""
