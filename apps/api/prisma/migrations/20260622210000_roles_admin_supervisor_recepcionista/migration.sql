-- Migración: reemplaza los 5 roles anteriores (SECRETARIA, COBRANZA, CONTABILIDAD, VENTAS)
-- por la nueva jerarquía de 3 roles (ADMINISTRADOR, SUPERVISOR, RECEPCIONISTA).

-- Paso 1: Agregar los nuevos valores al enum (deben estar en transacciones separadas para que
-- PostgreSQL los pueda usar inmediatamente después).
ALTER TYPE "RolNombre" ADD VALUE IF NOT EXISTS 'SUPERVISOR';
ALTER TYPE "RolNombre" ADD VALUE IF NOT EXISTS 'RECEPCIONISTA';

-- Forzar commit de los nuevos valores del enum antes de usarlos.
-- En Prisma/psql, cada statement DDL se auto-commitea cuando no están en un bloque de transacción.
-- Para asegurar disponibilidad, usamos un bloque separado.
