-- CreateEnum
CREATE TYPE "TipoCalculoImpuesto" AS ENUM ('PORCENTAJE', 'MONTO_FIJO');

-- CreateEnum
CREATE TYPE "AplicaEn" AS ENUM ('PRIMERA_VENTA', 'REVENTA', 'SIEMPRE');

-- CreateEnum
CREATE TYPE "ModoComision" AS ENUM ('ABSORBIDA', 'RECARGO');

-- CreateTable
CREATE TABLE "impuestos_config" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoCalculoImpuesto" NOT NULL DEFAULT 'PORCENTAJE',
    "tasa" DECIMAL(7,6) NOT NULL,
    "monto_fijo" INTEGER NOT NULL DEFAULT 0,
    "aplica_en" "AplicaEn" NOT NULL DEFAULT 'SIEMPRE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impuestos_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comisiones_config" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT,
    "procesador" TEXT,
    "pct" DECIMAL(7,6) NOT NULL,
    "fijo" INTEGER NOT NULL DEFAULT 0,
    "modo" "ModoComision" NOT NULL DEFAULT 'ABSORBIDA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comisiones_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "impuestos_config_clave_key" ON "impuestos_config"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "comisiones_config_clave_key" ON "comisiones_config"("clave");

-- RenameIndex
ALTER INDEX "usuarios_email_key" RENAME TO "usuarios_username_key";
