#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/apps/api/.env"

# Resolver pnpm aunque no esté en el PATH del shell (busca wrapper en ~/bin y store)
if ! command -v pnpm &>/dev/null; then
  for _candidate in "$HOME/bin/pnpm" "$HOME/.local/share/pnpm/pnpm" "$HOME/.pnpm/pnpm"; do
    if [ -x "$_candidate" ] && "$_candidate" --version &>/dev/null; then
      export PATH="$(dirname "$_candidate"):$PATH"
      break
    fi
  done
  if ! command -v pnpm &>/dev/null; then
    # Último recurso: buscar en el store y crear wrapper
    _store_bin=$(find "$HOME/.local/share/pnpm/store" -name "pnpm" -path "*/bin/pnpm" 2>/dev/null | head -1)
    if [ -n "$_store_bin" ] && bash "$_store_bin" --version &>/dev/null; then
      mkdir -p "$HOME/bin"
      printf '#!/usr/bin/env bash\nexec bash "%s" "$@"\n' "$_store_bin" > "$HOME/bin/pnpm"
      chmod +x "$HOME/bin/pnpm"
      export PATH="$HOME/bin:$PATH"
    else
      echo "ERROR: pnpm no encontrado. Ejecuta ./setup.sh primero." >&2
      exit 1
    fi
  fi
fi

# Cargar variables de entorno si existe el archivo
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  # Valores por defecto para desarrollo local
  export DATABASE_URL="postgresql://postgres@localhost:5432/inmobiliaria"
  export NODE_ENV="development"
  export PORT="3000"
  export CORS_ORIGIN="http://localhost:5173"
  export JWT_SECRET="dev-secret-local-change-in-production"
  export JWT_EXPIRES_IN="15m"
  export REFRESH_TOKEN_EXPIRES_IN="7d"
  export STORAGE_PATH="$SCRIPT_DIR/apps/api/uploads"
  export VITE_API_URL="http://localhost:3000"
fi

# Verificar que PostgreSQL esté corriendo
if ! pg_isready -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -q; then
  echo "ERROR: PostgreSQL no está disponible en localhost:5432"
  echo "Inicialo con: sudo systemctl start postgresql"
  exit 1
fi

# Compilar paquetes compartidos (la API los necesita en dist/)
echo "Compilando paquetes compartidos..."
pnpm --filter @inmobiliaria/shared build 2>&1 | grep -v "^$" || true

# Aplicar migraciones pendientes
echo "Aplicando migraciones de base de datos..."
cd "$SCRIPT_DIR/apps/api"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy 2>&1 | grep -v "^$" || true
cd "$SCRIPT_DIR"

# Limpiar procesos hijos al salir
cleanup() {
  echo ""
  echo "Deteniendo servicios..."
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
  wait "$API_PID" "$WEB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Iniciar API
echo "Iniciando API en puerto ${PORT:-3000}..."
pnpm --filter @inmobiliaria/api dev &
API_PID=$!

# Iniciar frontend
echo "Iniciando frontend en puerto 5173..."
pnpm --filter @inmobiliaria/web dev &
WEB_PID=$!

echo ""
echo "Sistema iniciado:"
echo "  API:      http://localhost:${PORT:-3000}"
echo "  Frontend: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener."

wait
