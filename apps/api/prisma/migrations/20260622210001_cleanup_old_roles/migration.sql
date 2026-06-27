-- Paso 2: Convertir usuarios con roles eliminados (en transacción separada porque
-- PostgreSQL requiere que los nuevos valores de enum estén committed antes de usarlos).
UPDATE "usuarios"
SET rol = 'SUPERVISOR'
WHERE rol IN ('SECRETARIA', 'COBRANZA', 'CONTABILIDAD', 'VENTAS');

-- Paso 3: Recrear el enum sin los roles viejos.
-- PostgreSQL no permite DROP VALUE, así que convertimos a TEXT, eliminamos y recreamos.
ALTER TABLE "usuarios" ALTER COLUMN "rol" TYPE TEXT;

DROP TYPE "RolNombre";

CREATE TYPE "RolNombre" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'RECEPCIONISTA');

-- Paso 4: Restaurar la columna con el nuevo tipo
ALTER TABLE "usuarios" ALTER COLUMN "rol" TYPE "RolNombre" USING "rol"::"RolNombre";
