-- AlterTable: agrega dia_pago a planes_financiamiento (columna ya existente en la BD)
ALTER TABLE "planes_financiamiento" ADD COLUMN IF NOT EXISTS "dia_pago" INTEGER NOT NULL DEFAULT 1;
