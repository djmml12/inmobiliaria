/**
 * Importa los lotes de la pestaña "PAGOS AL CONTADO" (basedatos.xlsx) al sistema.
 *
 * Modelo elegido (venta al contado con saldo): por cada lote se crea una Venta
 * con enganche = monto pagado y un PlanFinanciamiento SIN_INTERES de 1 cuota por
 * el saldo pendiente. Así el saldo aparece en "Saldo por cobrar" / "% recuperado"
 * del panel financiero, consistente con las ventas financiadas.
 *
 * Dinero en CENTAVOS (Q × 100), igual que el resto del esquema.
 * Idempotente: omite los lotes cuyo código ya exista en Monte Alegre.
 *
 * Ejecutar:  npx tsx --tsconfig tsconfig.seed.json prisma/import-contado.ts
 */
import { PrismaClient, TipoImpuesto, EstadoLote, EstadoVenta, SistemaAmortizacion, EstadoCuota } from '@prisma/client';

const prisma = new PrismaClient();

const PROYECTO_NOMBRE = 'Monte Alegre';
const Q = (quetzales: number) => Math.round(quetzales * 100); // a centavos

// Filas tal cual la pestaña "PAGOS AL CONTADO" (montos en Quetzales)
const FILAS = [
  { lote: '30', cliente: 'PABLO ARTURO MALDONADO BARRIENTOS', precio: 109250, pagado: 94250, saldo: 15000 },
  { lote: '31', cliente: 'OTILIA MERCEDEZ NOLASCO TOMAS', precio: 110000, pagado: 89500, saldo: 20500 },
  { lote: '32', cliente: 'OTILIA MERCEDEZ NOLASCO TOMAS', precio: 110000, pagado: 89500, saldo: 20500 },
  { lote: '33', cliente: 'OTILIA MERCEDEZ NOLASCO TOMAS', precio: 109250, pagado: 0, saldo: 109250 },
  { lote: '8', cliente: 'SANTOS FLORINDA CRUZ PEREZ DE TOJIL', precio: 147000, pagado: 0, saldo: 147000 },
];

// nombre = primer token; apellido = el resto (convención del sistema)
function splitNombre(full: string) {
  const parts = full.trim().split(/\s+/);
  return { nombre: parts[0], apellido: parts.slice(1).join(' ') };
}

async function main() {
  const proyecto = await prisma.proyecto.findFirst({ where: { nombre: PROYECTO_NOMBRE, deletedAt: null } });
  if (!proyecto) throw new Error(`No existe el proyecto "${PROYECTO_NOMBRE}"`);

  // Cache de clientes por nombre completo (OTILIA aparece en 3 lotes -> 1 cliente)
  const clienteCache = new Map<string, string>();
  const hoy = new Date();

  for (const f of FILAS) {
    // Validación de consistencia precio = pagado + saldo
    if (f.precio !== f.pagado + f.saldo) {
      throw new Error(`Lote ${f.lote}: precio ${f.precio} != pagado ${f.pagado} + saldo ${f.saldo}`);
    }

    // 1) Lote (idempotente: si ya existe el código, se omite la fila)
    const loteExistente = await prisma.lote.findFirst({
      where: { proyectoId: proyecto.id, codigo: f.lote },
    });
    if (loteExistente) {
      console.log(`• Lote ${f.lote} ya existe — se omite`);
      continue;
    }

    // 2) Cliente (reutiliza si ya existe por nombre + apellido)
    const { nombre, apellido } = splitNombre(f.cliente);
    let clienteId = clienteCache.get(f.cliente);
    if (!clienteId) {
      const existente = await prisma.cliente.findFirst({ where: { nombre, apellido, deletedAt: null } });
      clienteId = existente?.id
        ?? (await prisma.cliente.create({ data: { nombre, apellido } })).id;
      clienteCache.set(f.cliente, clienteId);
    }

    // 3) Venta + plan + cuota + lote VENDIDO, en una transacción
    await prisma.$transaction(async (tx) => {
      const lote = await tx.lote.create({
        data: {
          proyectoId: proyecto.id,
          codigo: f.lote,
          area: 0, // no disponible en la pestaña de contado
          precioBase: Q(f.precio),
          estado: EstadoLote.VENDIDO,
        },
      });

      const venta = await tx.venta.create({
        data: {
          loteId: lote.id,
          clienteId: clienteId!,
          fechaVenta: hoy,
          precioBase: Q(f.precio),
          tipoImpuesto: TipoImpuesto.IVA,
          tasaImpuesto: 0,
          montoImpuesto: 0,
          precioTotal: Q(f.precio),
          enganche: Q(f.pagado),       // monto pagado al contado
          saldoFinanciar: Q(f.saldo),  // saldo pendiente
          estado: EstadoVenta.ACTIVA,
          notas: 'Venta al contado (importada de basedatos.xlsx)',
        },
      });

      const plan = await tx.planFinanciamiento.create({
        data: {
          ventaId: venta.id,
          sistema: SistemaAmortizacion.SIN_INTERES,
          plazoMeses: 1,
          tasaAnual: 0,
          fechaPrimeraCuota: hoy,
          diaPago: 1,
        },
      });

      await tx.cuota.create({
        data: {
          planId: plan.id,
          numero: 1,
          fechaVencimiento: hoy,
          montoCuota: Q(f.saldo),
          capital: Q(f.saldo),
          interes: 0,
          saldoRestante: 0,
          estado: EstadoCuota.PENDIENTE,
          montoPagado: 0,
        },
      });
    });

    console.log(`✓ Lote ${f.lote} → ${nombre} ${apellido} | precio Q${f.precio} pagado Q${f.pagado} saldo Q${f.saldo}`);
  }

  console.log('\nImportación de contado finalizada.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
