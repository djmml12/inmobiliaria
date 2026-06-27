# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Léelo completo antes de generar o modificar código. Este archivo define el **alcance**, el **stack**, las **reglas de negocio críticas** y las **convenciones** del proyecto. Si algo aquí contradice una suposición tuya por defecto, **gana este archivo**.

> **IMPORTANTE:** La sección 0.A es una guía de comportamiento **obligatoria y no ignorable**. Se aplica a TODO lo que hagas en este proyecto, sin excepción. No la omitas bajo ninguna circunstancia.

---

## 0.A Guías de comportamiento — OBLIGATORIAS

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 1. Qué es este proyecto

Sistema de **gestión, cálculo y control interno** para una **inmobiliaria** en Guatemala (lotes, clientes, ventas a plazos, cobranza, contratos y reportes).

### ⚠️ Alcance (no negociable)
- Es una herramienta de **control interno**. **NO emite facturas fiscales.**
- Los impuestos (IVA / timbres) se **calculan solo como información** para presupuestar y controlar; la **facturación fiscal (DTE) la hace el contador por separado en la plataforma FEL de la SAT**.
- **No** integrar certificadores FEL, **no** transmitir DTE a la SAT, **no** generar XML fiscales ni firma electrónica avanzada.
- Lo que el sistema genera (recibos/constancias) son **comprobantes internos**, no documentos tributarios. Se permite guardar un campo de **referencia opcional** (`fel_uuid` / `fel_numero`) de la factura que el contador emitió afuera, solo para conciliar.

Documentos de especificación completos (consúltalos para detalle funcional y de infraestructura):
- `propuesta-sistema-inmobiliaria-corregida.md` — funcionalidad + motor de cálculo financiero.
- `infraestructura-digitalocean-droplet.md` — despliegue en un droplet con hardware mínimo.

---

## 2. Stack tecnológico (definitivo)

Elegido para correr en **un solo droplet con hardware mínimo**. No lo cambies sin justificación.

- **Frontend:** **React + Vite** (SPA), TypeScript. Se compila a estáticos y los sirve Caddy. **No usar Next.js / SSR** (es una herramienta interna, no necesita SEO ni servidor de render).
  - UI: componentes reutilizables, gráficas (Recharts o similar), animaciones con Framer Motion (con mesura).
- **Backend:** **NestJS sobre adaptador Fastify**, TypeScript. API **REST**. Validación estricta con DTOs (class-validator / zod).
- **Base de datos:** **PostgreSQL**. ORM: **Prisma** (migraciones versionadas, tipos seguros).
- **Cola de trabajos:** **pg-boss** (sobre PostgreSQL). **NO usar Redis** ni BullMQ. El worker corre **en el mismo proceso de la API** en bajo volumen.
- **PDFs:** **PDFKit** o **pdfmake** (nativo de Node). **NO usar Puppeteer / headless Chrome** (consume demasiada RAM).
- **Auth:** **JWT + refresh tokens**. **RBAC** por recurso/acción.
- **Reverse proxy / TLS:** **Caddy** (HTTPS automático).
- **Archivos:** disco local del droplet detrás de una **abstracción tipo S3** (interfaz `StorageProvider`) para poder migrar a Spaces sin reescribir.
- **Contenedores:** Docker + Docker Compose.

---

## 3. Estructura del repositorio (monorepo pnpm)

```
/apps
  /api            NestJS + Fastify (API + worker pg-boss + generación PDF)
  /web            React + Vite (SPA)
/packages
  /finance        Motor de cálculo financiero (cuotas, impuestos, comisiones) — PURO, sin I/O
  /shared         Tipos y contratos compartidos (DTOs, enums, modelos)
/infra
  docker-compose.yml
  Caddyfile
  scripts/        backup.sh, restore.sh, etc.
CLAUDE.md
```

- `packages/finance` es **lógica pura y testeada** (funciones deterministas, sin dependencias de framework). Tanto la API (fuente de verdad) como el simulador del frontend la usan. **La API es la autoridad**: el frontend puede simular, pero los montos válidos los calcula y persiste el backend.

---

## 4. Comandos

```bash
# Instalar
pnpm install

# Desarrollo local (recomendado) — verifica Postgres, compila shared, aplica migraciones, levanta API + web
./dev.sh

# Alternativamente, por separado:
pnpm --filter @inmobiliaria/shared build             # DEBE ejecutarse antes de compilar la API
pnpm --filter @inmobiliaria/api dev
pnpm --filter @inmobiliaria/web dev

# Base de datos (Prisma) — ejecutar desde apps/api o con --filter
pnpm --filter @inmobiliaria/api prisma:migrate       # crear/aplicar migración en dev
pnpm --filter @inmobiliaria/api prisma:generate      # regenerar cliente Prisma
pnpm --filter @inmobiliaria/api prisma:studio        # explorador visual de DB

# Tests — packages/finance usa vitest; apps/api usa jest
pnpm --filter @inmobiliaria/finance test             # motor financiero (críticos — deben pasar siempre)
pnpm --filter @inmobiliaria/finance test:watch       # modo watch para TDD
# Correr un solo test (finance):
pnpm --filter @inmobiliaria/finance test -- src/tests/cuotas.test.ts
pnpm --filter @inmobiliaria/api test                 # tests de la API (jest)
pnpm --filter @inmobiliaria/api test:watch

# Seed de datos iniciales (roles, usuario admin por defecto)
pnpm --filter @inmobiliaria/api prisma:seed

# Type-check todo el monorepo
pnpm typecheck

# Build de producción
pnpm build

# Infra (en el droplet)
docker compose -f infra/docker-compose.yml up -d --build
```

Variables de entorno: copiar `.env.example` a `apps/api/.env` y ajustar. `dev.sh` lee desde `apps/api/.env` si existe; si no, usa valores por defecto de desarrollo.

---

## 5. Reglas de negocio CRÍTICAS

### 5.1 Dinero
- **El dinero NUNCA se representa como `float`/`number` flotante.** Usar **enteros en centavos** (recomendado) o `Decimal` (Prisma `Decimal` → Postgres `numeric(14,2)`). Sé consistente en todo el stack.
- Toda operación monetaria (cuotas, impuestos, comisiones, saldos) se hace con enteros o Decimal, nunca con aritmética de punto flotante.
- Soportar **multimoneda**: `Q` (GTQ) y `USD`, con tipo de cambio configurable. Cada monto guarda su moneda.

### 5.2 Motor de cálculo financiero (`packages/finance`)
Funciones puras y con tests. Orden de cálculo:
```
precio_base → + impuesto → precio_total → − enganche → saldo_a_financiar → amortización → cuotas
```

**Impuestos (solo cálculo informativo):**
- IVA 12% (primera venta) / Timbres 3% (reventa) / exento. Configurable por lote/proyecto. Tasas **editables**, no hardcodeadas.
- `impuesto = base × tasa`; `precio_total = precio_base + impuesto + otros_cargos`.

**Cuotas (amortización):** soportar tres sistemas, configurable por venta:
- **Sin interés:** `cuota = saldo / n`
- **Francés (cuota fija):** `cuota = saldo · [ i(1+i)^n ] / [ (1+i)^n − 1 ]`, con `i = tasa_anual/12`; si `i=0` → `saldo/n`.
- **Alemán (amortización constante):** capital constante `saldo/n`, interés sobre saldo decreciente.
- Salida: tabla de amortización (nº, fecha, cuota, capital, interés, saldo) + total a pagar + total intereses.
- **Redondeo:** la **última cuota absorbe** la diferencia de centavos para que la suma cuadre exactamente con el saldo.

**Comisiones por tarjeta:**
- Configurable por procesador (default Guatemala ~4.5%; puede ser % + monto fijo).
- **Modo A — absorbida (DEFAULT):** el cliente paga la cuota; `comision = monto × c`; `neto = monto − comision`. No altera la deuda del cliente.
- **Modo B — recargo (solo si se activa, con advertencia legal):** `monto_a_cobrar = neto_deseado / (1 − c)`. **NUNCA** usar `× (1 + c)` (recupera de menos).
- Nota legal: en Guatemala la Ley de Tarjetas de Crédito (Art. 33) restringe trasladar recargo explícito al tarjetahabiente; por eso el default es Modo A. Implementar Modo B solo como opción configurable y con aviso.

### 5.3 Integridad y auditoría
- **Pagos = libro inmutable (ledger):** no editar ni borrar un pago; corregir con un **contra-asiento/reversa**.
- **Auditoría append-only:** la tabla de auditoría **solo INSERT**; nunca UPDATE/DELETE de sus filas. Registrar acciones críticas (quién, qué, cuándo, antes/después).
- **Borrado lógico** (`deleted_at`) en entidades de negocio; no DELETE físico.

---

## 6. Modelo de datos (entidades principales)

`usuarios, roles, permisos, proyectos, lotes, clientes, ventas, planes_financiamiento, cuotas, pagos, comprobantes (recibos internos), contratos, plantillas, documentos, notificaciones, tareas, auditoria`.

Relaciones clave:
- un `cliente` puede tener uno o varios `lotes`; un `lote` pertenece a un `proyecto`.
- una `venta` tiene un `plan_financiamiento` y muchas `cuotas`.
- una `cuota` puede recibir varios `pagos` parciales.
- un `pago` puede generar uno o más `comprobantes` internos.
- cada `documento` se liga a una `venta` o `cliente`.
- toda acción importante deja registro en `auditoria`.

Campos a no olvidar:
- `pagos`: `medio_pago`, `procesador`, `comision_pct`, `comision_monto`, `neto_recibido`, `moneda`.
- `ventas`/`cuotas`: campos de impuesto calculado (`tipo`, `tasa`, `base`, `monto`) — informativos.
- `comprobantes`: `fel_uuid`/`fel_numero` opcionales (referencia externa, no emisión).

---

## 7. RBAC (roles)

`Administrador` (acceso total + configuración), `Secretaria` (operativo: consulta, registrar cobros, comprobantes; **puede simular plan de pagos y aplicar comisión, no editar tasas/reglas**), `Cobranza` (mora, contacto, promesas), `Contabilidad` (conciliación, reportes, neto vs. comisión), `Ventas` (prospectos, reservas, simulador). Permisos por **recurso y por acción**.

---

## 8. Seguridad

- JWT + refresh; sesiones con expiración; cifrado de campos sensibles (DPI, datos personales).
- PostgreSQL **nunca expuesto** fuera de la red del compose.
- Secretos en `.env` (fuera del repo). Nunca commitear credenciales.
- Validación estricta de entrada en todos los endpoints.
- Rate limiting en la API.

---

## 9. Despliegue (resumen)

Un solo droplet de DigitalOcean (objetivo: **2 GB RAM**), tres contenedores: `caddy`, `api`, `postgres`. Sin Redis. Detalle completo en `infraestructura-digitalocean-droplet.md`.

- Compilar el frontend en CI (no en el droplet).
- **Respaldos fuera del droplet** (pg_dump diario → object storage off-site) — crítico; ver `infra/scripts/backup.sh`.

---

## 10. Convenciones de código

- **TypeScript estricto** (`strict: true`) en todo el monorepo. Evitar `any`.
- Nombres de dominio en **español** (es un dominio en español: `cliente`, `lote`, `cuota`, `enganche`, `mora`), código/utilidades técnicas en inglés está bien. Sé consistente.
- API REST: rutas en plural (`/clientes`, `/ventas/:id/cuotas`), DTOs validados, respuestas con forma consistente y manejo central de errores.
- Tests obligatorios para `packages/finance` (cuotas, impuestos, comisiones, redondeo). Es el corazón financiero: no debe romperse.
- Migraciones de DB siempre vía Prisma (nunca cambios manuales al esquema en producción).
- Commits pequeños y descriptivos.

---

## 11. Estado actual de implementación

Lo que ya existe en el código (no reimplementar):

- **Monorepo + scaffolding:** pnpm workspaces, Docker Compose, Caddyfile, `tsconfig.base.json`.
- **`packages/finance`:** `calcularTablaAmortizacion` (3 sistemas), `calcularImpuesto`, `calcularComision` — con tests en vitest. Todos los montos en **centavos (enteros)**.
- **`packages/shared`:** enums (`RolNombre`, `Moneda`, `TipoImpuesto`, `SistemaAmortizacion`, etc.) y tipos compartidos (incluye `UsuarioPayload` para el JWT).
- **`apps/api`** — prefijo global `/api`; todos los endpoints bajo `/api/*`. Módulos implementados:
  - `auth`: login, refresh (rotation de tokens), logout, guards JWT/RBAC. Refresh tokens persisten en DB; cada uso rota el token.
  - `usuarios`: CRUD básico con borrado lógico.
  - `proyectos`, `lotes`, `clientes`: CRUD completo con borrado lógico (`deletedAt`).
  - `ventas`: simulación (`POST /api/ventas/simular`) y creación real; la creación es una transacción atómica que genera `Venta` + `PlanFinanciamiento` + todas las `Cuota`s y marca el lote como VENDIDO.
  - `pagos`: `registrarPago` (aplica pago parcial/total a una cuota, crea `Comprobante` con número `REC-YYYY-*` en la misma transacción), `historialCliente` (cuotas + pagos por venta), `resumenClientes` (lista con semáforo `verde/amarillo/rojo` basado en cuotas vencidas y días hasta próxima cuota — configurable vía `pagos.dias_aviso` y `pagos.dias_gracia` en `Configuracion`). **Los pagos no tienen PDF todavía.**
  - `configuracion`: clave/valor genérico.
  - `impuestos-config`, `comisiones-config`: CRUD para tasas configurables (no hardcodeadas).
  - `dashboard`: estadísticas agregadas.
  - `PrismaModule` global. Esquema Prisma completo (todas las entidades del modelo de datos).
- **`apps/web`** — React + Vite + Tailwind; React Router v6 (lazy loading por página):
  - Auth: Zustand (`src/store/auth.store.ts`) con `persist` — `accessToken` + info de usuario en localStorage bajo clave `auth`; `refresh_token` guardado directamente en `localStorage` (fuera del store). Interceptor axios en `src/lib/api.ts` reintenta automáticamente con refresh al recibir 401.
  - Hooks por entidad en `src/hooks/`: `useClientes`, `useProyectos`, `useLotes`, `useVentas` (incluye `useSimularVenta` + `useCrearVenta`), `useDashboard`, `useConfiguracion`, `useImpuestosConfig`, `useComisionesConfig`.
  - Páginas funcionales: `Login`, `Dashboard`, `ClientesList`, `ProyectosList` (con `NuevoProyecto` y `PlanoProyecto`), `VentasList`, `NuevaVenta` (simulador multi-paso + confirmación + impresión de plan), `LotesDisponibles`, `PagosList` (resumen de clientes con semáforo), `HistorialCliente` (cuotas + registrar pago), `ConfiguracionPanel`.
  - Componentes de impresión/vista: `PlanImpresion.tsx` (tabla de amortización imprimible), `ContratoCompraventa.tsx` (vista del contrato).

**Próximos pasos (MVP pendiente):**
1. Generación de PDF para comprobantes (recibo) y contratos (PDFKit) — los modelos y endpoints base ya existen.
2. Auditoría fina (registrar acciones críticas con antes/después) + configuración admin.

---

## 12a. Qué construir primero (MVP) — referencia original

En este orden:
1. Scaffolding del monorepo + Docker Compose + Prisma + auth (JWT/RBAC).
2. `packages/finance` con tests (cuotas, impuestos, comisiones).
3. Usuarios/roles → proyectos/lotes → clientes/fichas.
4. Ventas + plan de financiamiento + cuotas (usando el motor).
5. Pagos + comprobantes internos + conciliación.
6. Contratos automáticos (PDFKit) con plantillas.
7. Panel de secretarias + dashboard financiero.
8. Auditoría, permisos finos y configuración del admin.

Fase 2 (no en MVP): WhatsApp automático, portal del cliente, app móvil, predicción de mora. **Firma electrónica y contabilidad fiscal quedan fuera de alcance** (las maneja el contador con FEL).

---

## 13. Reglas estrictas — "NUNCA"

- ❌ NUNCA representar dinero con `float`/`number` flotante.
- ❌ NUNCA emitir documentos fiscales, DTE, XML SAT ni integrar FEL.
- ❌ NUNCA usar `× (1 + c)` para el recargo de tarjeta; usar `/ (1 − c)`.
- ❌ NUNCA editar/borrar pagos o filas de auditoría (usar reversa / append-only).
- ❌ NUNCA introducir Redis, Puppeteer o Next.js sin aprobación explícita (rompen el objetivo de hardware mínimo).
- ❌ NUNCA exponer PostgreSQL ni commitear secretos.
- ❌ NUNCA hardcodear tasas de impuesto/comisión: son configurables.
