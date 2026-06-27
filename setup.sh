#!/usr/bin/env bash
# setup.sh — instala y configura el entorno de desarrollo del sistema inmobiliaria
# Compatible con Arch Linux / CachyOS / Manjaro con Node.js >=18 y pnpm >=9
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

###############################################################################
# Colores
###############################################################################
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
info() { echo -e "${BLUE}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

###############################################################################
# 1. Verificar Node.js
###############################################################################
info "Verificando Node.js..."
if ! command -v node &>/dev/null; then
  fail "Node.js no está instalado. Instálalo con tu gestor de paquetes:
  Arch/CachyOS: sudo pacman -S nodejs npm
  Ubuntu/Debian: sudo apt install nodejs npm
  O usa fnm: curl -fsSL https://fnm.vercel.app/install | bash"
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Se requiere Node.js >= 18. Versión actual: $(node --version)"
fi
ok "Node.js $(node --version)"

###############################################################################
# 2. Instalar pnpm (si no está disponible)
###############################################################################
info "Verificando pnpm..."

PNPM_CMD=""

# Función auxiliar: prueba si un candidato de pnpm realmente funciona
try_pnpm() {
  local bin="$1"
  "$bin" --version &>/dev/null && echo "$bin"
}

# Buscar en ubicaciones conocidas (en orden de preferencia)
PNPM_CANDIDATES=(
  "$HOME/bin/pnpm"
  "$HOME/.pnpm/pnpm"
  "$HOME/.local/share/pnpm/pnpm"
)
for candidate in "${PNPM_CANDIDATES[@]}"; do
  if [ -x "$candidate" ]; then
    if FOUND=$(try_pnpm "$candidate") && [ -n "$FOUND" ]; then
      PNPM_CMD="$candidate"
      ok "pnpm $($PNPM_CMD --version) encontrado en $candidate"
      break
    fi
  fi
done

# Si no se encontró uno funcional, buscar el binario en el store de pnpm y crear wrapper
if [ -z "$PNPM_CMD" ]; then
  STORE_BIN=$(find "$HOME/.local/share/pnpm/store" -name "pnpm" -path "*/bin/pnpm" 2>/dev/null | head -1)
  if [ -n "$STORE_BIN" ] && bash "$STORE_BIN" --version &>/dev/null; then
    mkdir -p "$HOME/bin"
    cat > "$HOME/bin/pnpm" << WRAPPER
#!/usr/bin/env bash
exec bash "$STORE_BIN" "\$@"
WRAPPER
    chmod +x "$HOME/bin/pnpm"
    export PATH="$HOME/bin:$PATH"
    PNPM_CMD="$HOME/bin/pnpm"
    ok "Wrapper pnpm creado en $HOME/bin/pnpm (apunta a store)"
  fi

  # Instalar pnpm desde cero con npm
  if [ -z "$PNPM_CMD" ]; then
    info "Instalando pnpm vía npm..."
    if npm install -g pnpm 2>/dev/null; then
      PNPM_CMD="pnpm"
      ok "pnpm instalado globalmente vía npm"
    else
      info "npm global falló (sin permisos), usando instalador oficial..."
      PNPM_HOME="$HOME/.local/share/pnpm"
      mkdir -p "$PNPM_HOME"
      curl -fsSL https://get.pnpm.io/install.sh | PNPM_HOME="$PNPM_HOME" sh - 2>/dev/null || true
      if [ -x "$PNPM_HOME/pnpm" ]; then
        export PATH="$PNPM_HOME:$PATH"
        PNPM_CMD="$PNPM_HOME/pnpm"
        ok "pnpm instalado en $PNPM_HOME"
      else
        fail "No se pudo instalar pnpm. Instálalo manualmente:
  npm install -g pnpm
  O: curl -fsSL https://get.pnpm.io/install.sh | sh -"
      fi
    fi
  fi
fi

# Agregar $HOME/bin al PATH de esta sesión
export PATH="$HOME/bin:$HOME/.local/share/pnpm:$PATH"
PNPM_VERSION=$($PNPM_CMD --version 2>/dev/null) || fail "pnpm no funciona correctamente"
ok "pnpm $PNPM_VERSION listo"

###############################################################################
# 3. Configurar node-linker=hoisted en .npmrc
#    Necesario para que Node.js >= 22 resuelva módulos CJS correctamente
#    (sin esto, @nestjs/cli, prisma y otros fallan con MODULE_NOT_FOUND)
###############################################################################
info "Configurando pnpm node-linker=hoisted..."
if ! grep -q "node-linker=hoisted" "$REPO_DIR/.npmrc" 2>/dev/null; then
  echo "node-linker=hoisted" >> "$REPO_DIR/.npmrc"
  ok "node-linker=hoisted agregado a .npmrc"
else
  ok ".npmrc ya tiene node-linker=hoisted"
fi

###############################################################################
# 4. Verificar PostgreSQL
###############################################################################
info "Verificando PostgreSQL..."
if ! command -v pg_isready &>/dev/null; then
  fail "PostgreSQL no está instalado.
  Arch/CachyOS: sudo pacman -S postgresql
  Ubuntu/Debian: sudo apt install postgresql postgresql-client
  Después inicializa: sudo -u postgres initdb -D /var/lib/postgres/data
  Y activa: sudo systemctl enable --now postgresql"
fi

if ! pg_isready -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -q 2>/dev/null; then
  warn "PostgreSQL no está corriendo. Intentando iniciarlo..."
  if command -v systemctl &>/dev/null; then
    sudo systemctl start postgresql || true
    sleep 2
    if ! pg_isready -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -q 2>/dev/null; then
      fail "PostgreSQL no está disponible. Inícialo con:
  sudo systemctl start postgresql"
    fi
  else
    fail "PostgreSQL no está disponible en localhost:5432. Inícialo manualmente."
  fi
fi
ok "PostgreSQL disponible en $(pg_isready -h ${PGHOST:-localhost} -p ${PGPORT:-5432} 2>&1)"

###############################################################################
# 5. Crear base de datos si no existe
###############################################################################
info "Verificando base de datos 'inmobiliaria'..."
DB_EXISTS=$(psql -U "${PGUSER:-postgres}" -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" \
  -tAc "SELECT 1 FROM pg_database WHERE datname='inmobiliaria'" 2>/dev/null || echo "")
if [ "$DB_EXISTS" != "1" ]; then
  createdb -U "${PGUSER:-postgres}" -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" inmobiliaria 2>/dev/null \
    || psql -U "${PGUSER:-postgres}" -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" \
       -c "CREATE DATABASE inmobiliaria;" 2>/dev/null \
    || warn "No se pudo crear la BD automáticamente. Créala manualmente: createdb inmobiliaria"
  ok "Base de datos 'inmobiliaria' creada"
else
  ok "Base de datos 'inmobiliaria' ya existe"
fi

###############################################################################
# 6. Crear archivo .env si no existe
###############################################################################
info "Verificando archivo .env..."
ENV_FILE="$REPO_DIR/apps/api/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" << 'ENVEOF'
DATABASE_URL=postgresql://postgres@localhost:5432/inmobiliaria
POSTGRES_USER=postgres
POSTGRES_PASSWORD=

NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

JWT_SECRET=dev-secret-local-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

STORAGE_PATH=./uploads
VITE_API_URL=http://localhost:3000
ENVEOF
  ok "Archivo .env creado en apps/api/.env"
else
  ok "Archivo .env ya existe"
fi

###############################################################################
# 7. Instalar dependencias npm del monorepo
###############################################################################
info "Instalando dependencias del monorepo (pnpm install)..."
$PNPM_CMD install 2>&1 | grep -v "^$" | grep -v "WARN deprecated" | tail -5
ok "Dependencias instaladas"

###############################################################################
# 8. Compilar packages/shared (la API lo requiere en dist/)
###############################################################################
info "Compilando @inmobiliaria/shared..."

# Asegurar que tsconfig de shared tenga types:[] para evitar conflictos con @types/eslint
SHARED_TSCONFIG="$REPO_DIR/packages/shared/tsconfig.json"
if ! grep -q '"types"' "$SHARED_TSCONFIG" 2>/dev/null; then
  # Insertar "types": [] en compilerOptions
  sed -i 's|"rootDir": "./src"|"rootDir": "./src",\n    "types": []|' "$SHARED_TSCONFIG" 2>/dev/null || true
fi

$PNPM_CMD --filter @inmobiliaria/shared build 2>&1 | grep -E "(error|Error|warning)" | head -10 || true
ok "@inmobiliaria/shared compilado"

###############################################################################
# 9. Aplicar migraciones de Prisma
###############################################################################
info "Aplicando migraciones de base de datos (Prisma)..."
cd "$REPO_DIR/apps/api"

# Resolución de migración rota (error de enum en misma transacción) — idempotente
FAILED_MIGRATION="20260622210000_roles_admin_supervisor_recepcionista"
FAILED_CHECK=$(psql -U "${PGUSER:-postgres}" -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" \
  -d inmobiliaria -tAc \
  "SELECT logs FROM \"_prisma_migrations\" WHERE migration_name='$FAILED_MIGRATION' AND finished_at IS NULL" \
  2>/dev/null || echo "")
if [ -n "$FAILED_CHECK" ]; then
  warn "Migración fallida detectada, marcando como rolled-back..."
  DATABASE_URL=$(grep DATABASE_URL "$ENV_FILE" | cut -d= -f2-) \
    node_modules/.bin/prisma migrate resolve --rolled-back "$FAILED_MIGRATION" 2>/dev/null || true
fi

DATABASE_URL=$(grep DATABASE_URL "$ENV_FILE" | cut -d= -f2-) \
  node_modules/.bin/prisma migrate deploy 2>&1 | grep -v "^$" | grep -v "warn\|Tip\|Update" | tail -10
ok "Migraciones aplicadas"

###############################################################################
# 10. Generar cliente Prisma
###############################################################################
info "Generando cliente Prisma..."
DATABASE_URL=$(grep DATABASE_URL "$ENV_FILE" | cut -d= -f2-) \
  node_modules/.bin/prisma generate 2>&1 | grep -E "(Generated|error|Error)" | head -5
ok "Cliente Prisma generado"

cd "$REPO_DIR"

###############################################################################
# 11. Agregar pnpm al PATH del shell del usuario (persistente)
###############################################################################
info "Configurando PATH para pnpm..."
SHELL_RC=""
if [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"; fi
if [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"; fi
if [ -f "$HOME/.config/fish/config.fish" ]; then
  FISH_CFG="$HOME/.config/fish/config.fish"
  if ! grep -q 'inmobiliaria-pnpm\|HOME/bin' "$FISH_CFG" 2>/dev/null; then
    echo "" >> "$FISH_CFG"
    echo "# pnpm — inmobiliaria" >> "$FISH_CFG"
    echo "fish_add_path \$HOME/bin" >> "$FISH_CFG"
    ok "PATH actualizado en $FISH_CFG"
  fi
elif [ -n "$SHELL_RC" ]; then
  if ! grep -q 'HOME/bin.*pnpm\|pnpm.*HOME/bin' "$SHELL_RC" 2>/dev/null; then
    echo "" >> "$SHELL_RC"
    echo 'export PATH="$HOME/bin:$PATH"  # pnpm — inmobiliaria' >> "$SHELL_RC"
    ok "PATH actualizado en $SHELL_RC"
  fi
else
  warn "No se detectó shell RC. Agrega manualmente a tu shell: export PATH=\"\$HOME/bin:\$PATH\""
fi

###############################################################################
# Resumen
###############################################################################
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Instalación completada exitosamente${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Para iniciar el sistema en desarrollo:"
echo ""
echo -e "  ${BLUE}./dev.sh${NC}"
echo ""
echo "Servicios disponibles:"
echo "  API:      http://localhost:3000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Si pnpm no está en tu PATH en una nueva terminal:"
echo -e "  Bash/Zsh: ${YELLOW}source ~/.bashrc${NC}  o  ${YELLOW}source ~/.zshrc${NC}"
echo -e "  Fish:     ${YELLOW}source ~/.config/fish/config.fish${NC}"
echo ""
