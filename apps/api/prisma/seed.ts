import { PrismaClient, TipoImpuesto, SistemaAmortizacion, EstadoLote, MedioPago, Moneda } from '@prisma/client';
import { calcularTablaAmortizacion } from '@inmobiliaria/finance';

const prisma = new PrismaClient();

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rndInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fechaFutura(mesesDesdeHoy: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + mesesDesdeHoy);
  d.setDate(1);
  return d;
}

async function main() {
  console.log('🌱 Limpiando datos existentes (excepto usuarios)...');
  // Borrar en orden para respetar FKs
  await prisma.reserva.deleteMany();
  await prisma.comprobante.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.cuota.deleteMany();
  await prisma.planFinanciamiento.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.proyecto.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.impuestoConfig.deleteMany();
  await prisma.comisionConfig.deleteMany();

  // ── Configuración de impuestos y comisiones ───────────────────────────────
  console.log('⚙️  Creando configuración de impuestos y comisiones...');

  await prisma.impuestoConfig.create({
    data: {
      nombre: 'IVA 12%',
      clave: 'IVA_12',
      descripcion: 'IVA 12% primera venta (informativo)',
      tipo: 'PORCENTAJE',
      tasa: 0.12,
      aplicaEn: 'PRIMERA_VENTA',
      activo: true,
    },
  });

  await prisma.impuestoConfig.create({
    data: {
      nombre: 'Timbres 3%',
      clave: 'TIMBRES_3',
      descripcion: 'Timbres 3% reventa (informativo)',
      tipo: 'PORCENTAJE',
      tasa: 0.03,
      aplicaEn: 'REVENTA',
      activo: true,
    },
  });

  await prisma.comisionConfig.create({
    data: {
      nombre: 'Tarjeta de Crédito 10%',
      clave: 'TARJETA_CREDITO_10',
      descripcion: 'Comisión tarjeta de crédito absorbida por empresa',
      procesador: 'VISA/MASTERCARD',
      pct: 0.10,
      fijo: 0,
      modo: 'ABSORBIDA',
      activo: true,
    },
  });

  await prisma.comisionConfig.create({
    data: {
      nombre: 'Tarjeta de Débito 2.5%',
      clave: 'TARJETA_DEBITO_25',
      descripcion: 'Comisión tarjeta de débito',
      procesador: 'VISA/MASTERCARD',
      pct: 0.025,
      fijo: 0,
      modo: 'ABSORBIDA',
      activo: true,
    },
  });

  // ── Proyectos ─────────────────────────────────────────────────────────────
  console.log('🏗️  Creando 3 proyectos...');

  const proyectosDef = [
    {
      nombre: 'Residencial Las Palmas',
      descripcion: 'Proyecto residencial en zona norte, lotes con todos los servicios',
      ubicacion: 'Km 45 Carretera al Atlántico, Zacapa, Guatemala',
      tipoImpuesto: 'IVA' as TipoImpuesto,
      tasaImpuesto: 0.12,
      prefijo: 'LP',
      numLotes: 15,
      precioMinQ: 15000000,  // Q150,000 en centavos
      precioMaxQ: 35000000,
    },
    {
      nombre: 'Villa Jardines del Sur',
      descripcion: 'Lotes residenciales con áreas verdes y acceso controlado',
      ubicacion: 'Carretera a Escuintla Km 30, Palín, Escuintla',
      tipoImpuesto: 'TIMBRES' as TipoImpuesto,
      tasaImpuesto: 0.03,
      prefijo: 'JS',
      numLotes: 12,
      precioMinQ: 20000000,
      precioMaxQ: 50000000,
    },
    {
      nombre: 'Parcelamiento El Roble',
      descripcion: 'Terrenos agrícolas y residenciales en área semi-urbana',
      ubicacion: 'Aldea El Roble, Chiquimula, Guatemala',
      tipoImpuesto: 'IVA' as TipoImpuesto,
      tasaImpuesto: 0.12,
      prefijo: 'ER',
      numLotes: 10,
      precioMinQ: 8000000,
      precioMaxQ: 22000000,
    },
  ];

  const proyectos = [];
  for (const def of proyectosDef) {
    const p = await prisma.proyecto.create({
      data: {
        nombre: def.nombre,
        descripcion: def.descripcion,
        ubicacion: def.ubicacion,
        tipoImpuesto: def.tipoImpuesto,
        tasaImpuesto: def.tasaImpuesto,
        moneda: 'GTQ',
        activo: true,
      },
    });
    proyectos.push({ ...p, ...def });
  }

  // ── Lotes ─────────────────────────────────────────────────────────────────
  console.log('🏠 Creando lotes...');

  const todosLotes: { id: string; proyectoId: string; precioBase: number; tipoImpuesto: TipoImpuesto; tasaImpuesto: number }[] = [];
  for (const proy of proyectos) {
    for (let i = 1; i <= proy.numLotes; i++) {
      const area = rndInt(80, 400);
      const precioBase = rndInt(proy.precioMinQ, proy.precioMaxQ);
      const lote = await prisma.lote.create({
        data: {
          proyectoId: proy.id,
          codigo: `${proy.prefijo}-${String(i).padStart(3, '0')}`,
          area: area,
          precioBase: precioBase,
          moneda: 'GTQ',
          estado: 'DISPONIBLE',
          descripcion: `Lote ${i} — ${area} m²`,
        },
      });
      todosLotes.push({
        id: lote.id,
        proyectoId: proy.id,
        precioBase: precioBase,
        tipoImpuesto: proy.tipoImpuesto,
        tasaImpuesto: proy.tasaImpuesto,
      });
    }
  }

  // ── Clientes ──────────────────────────────────────────────────────────────
  console.log('👥 Creando 25 clientes...');

  const nombres = [
    'Carlos', 'María', 'José', 'Ana', 'Luis', 'Sofia', 'Miguel', 'Laura',
    'Jorge', 'Carmen', 'Roberto', 'Patricia', 'Fernando', 'Gloria', 'Ricardo',
    'Sandra', 'Eduardo', 'Mónica', 'Héctor', 'Claudia', 'Alejandro', 'Beatriz',
    'Marcos', 'Elena', 'Gustavo',
  ];
  const apellidos = [
    'García', 'López', 'Martínez', 'Rodríguez', 'Hernández', 'González',
    'Pérez', 'Sánchez', 'Torres', 'Flores', 'Ramírez', 'Díaz', 'Reyes',
    'Morales', 'Cruz', 'Ortiz', 'Castillo', 'Jiménez', 'Vargas', 'Ramos',
    'Aguilar', 'Mejía', 'Fuentes', 'Lemus', 'Cifuentes',
  ];

  const clientes = [];
  for (let i = 0; i < 25; i++) {
    const nombre = nombres[i];
    const apellido = apellidos[i];
    const dpi = `${rndInt(1000, 9999)} ${rndInt(10000, 99999)} ${rndInt(10000, 99999)}`;
    const c = await prisma.cliente.create({
      data: {
        nombre,
        apellido,
        dpi,
        nit: `${rndInt(1000000, 9999999)}-${rndInt(0, 9)}`,
        telefono: `+502 ${rndInt(3000, 5999)}-${rndInt(1000, 9999)}`,
        email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@email.com`,
        direccion: `${rndInt(1, 20)} Calle ${rndInt(1, 30)}-${rndInt(1, 50)}, Zona ${rndInt(1, 21)}, Guatemala`,
      },
    });
    clientes.push(c);
  }

  // ── Ventas + Planes + Cuotas ──────────────────────────────────────────────
  console.log('💰 Creando 20 ventas con planes de financiamiento y cuotas...');

  const sistemas: SistemaAmortizacion[] = ['SIN_INTERES', 'FRANCES', 'ALEMAN'];
  const tasasAnuales = [0, 0.06, 0.08, 0.10, 0.12, 0.15];
  const plazos = [12, 18, 24, 36, 48, 60];

  // Mezclar lotes y tomar 20
  const lotesDisponibles = [...todosLotes].sort(() => Math.random() - 0.5).slice(0, 20);
  const clientesMezclados = [...clientes].sort(() => Math.random() - 0.5);

  for (let i = 0; i < 20; i++) {
    const loteInfo = lotesDisponibles[i];
    const cliente = clientesMezclados[i % clientes.length];

    const precioBase = loteInfo.precioBase;
    const tasaImp = loteInfo.tasaImpuesto;
    const montoImpuesto = Math.round(precioBase * tasaImp);
    const precioTotal = precioBase + montoImpuesto;
    const enganchePct = rndInt(10, 30) / 100;
    const enganche = Math.round(precioTotal * enganchePct);
    const saldoFinanciar = precioTotal - enganche;

    const sistema = rnd(sistemas);
    const plazoMeses = rnd(plazos);
    // Sin interés → tasa 0; otros → tasa aleatoria
    const tasaAnual = sistema === 'SIN_INTERES' ? 0 : rnd(tasasAnuales.filter(t => t > 0));

    const fechaVenta = new Date(Date.now() - rndInt(0, 180) * 24 * 60 * 60 * 1000);
    const fechaPrimeraCuota = new Date(fechaVenta);
    fechaPrimeraCuota.setMonth(fechaPrimeraCuota.getMonth() + 1);
    fechaPrimeraCuota.setDate(1);

    // Calcular tabla de amortización con el motor financiero
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar,
      sistema,
      plazoMeses,
      tasaAnual,
      fechaPrimeraCuota,
    });

    // Crear venta
    const venta = await prisma.venta.create({
      data: {
        loteId: loteInfo.id,
        clienteId: cliente.id,
        fechaVenta,
        precioBase,
        tipoImpuesto: loteInfo.tipoImpuesto,
        tasaImpuesto: tasaImp,
        montoImpuesto,
        precioTotal,
        enganche,
        saldoFinanciar,
        moneda: 'GTQ',
        estado: 'ACTIVA',
        notas: `Venta con ${sistema.toLowerCase().replace('_', ' ')}, ${plazoMeses} meses, enganche ${Math.round(enganchePct * 100)}%`,
      },
    });

    // Marcar lote como VENDIDO
    await prisma.lote.update({
      where: { id: loteInfo.id },
      data: { estado: 'VENDIDO' },
    });

    // Crear plan de financiamiento
    const plan = await prisma.planFinanciamiento.create({
      data: {
        ventaId: venta.id,
        sistema,
        plazoMeses,
        tasaAnual,
        fechaPrimeraCuota,
      },
    });

    // Crear cuotas desde la tabla calculada
    for (const fila of tabla.filas) {
      // Determinar si esta cuota ya está "pagada" (ventas pasadas)
      const vencida = fila.fechaVencimiento < new Date();
      const esPagada = vencida && Math.random() > 0.3; // 70% de cuotas vencidas están pagadas

      let estadoCuota: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' = 'PENDIENTE';
      let montoPagado = 0;

      if (vencida) {
        estadoCuota = esPagada ? 'PAGADA' : 'VENCIDA';
        montoPagado = esPagada ? fila.cuota : 0;
      }

      const cuota = await prisma.cuota.create({
        data: {
          planId: plan.id,
          numero: fila.numero,
          fechaVencimiento: fila.fechaVencimiento,
          montoCuota: fila.cuota,
          capital: fila.capital,
          interes: fila.interes,
          saldoRestante: fila.saldo,
          estado: estadoCuota,
          montoPagado,
        },
      });

      // Si la cuota está pagada, registrar un pago
      if (estadoCuota === 'PAGADA') {
        const usaTarjeta = Math.random() > 0.5;
        const medioPago: MedioPago = usaTarjeta
          ? rnd(['TARJETA_CREDITO', 'TARJETA_DEBITO'] as MedioPago[])
          : rnd(['EFECTIVO', 'TRANSFERENCIA'] as MedioPago[]);

        const comisionPct = medioPago === 'TARJETA_CREDITO' ? 0.10 :
                            medioPago === 'TARJETA_DEBITO' ? 0.025 : 0;
        const comisionMonto = Math.round(fila.cuota * comisionPct);
        const netoRecibido = fila.cuota - comisionMonto;

        await prisma.pago.create({
          data: {
            cuotaId: cuota.id,
            fecha: new Date(fila.fechaVencimiento.getTime() - rndInt(0, 5) * 24 * 60 * 60 * 1000),
            monto: fila.cuota,
            moneda: 'GTQ',
            medioPago,
            procesador: comisionPct > 0 ? 'VISA/MASTERCARD' : null,
            comisionPct: comisionPct > 0 ? comisionPct : null,
            comisionMonto: comisionPct > 0 ? comisionMonto : null,
            netoRecibido,
            notas: comisionPct > 0 ? `Comisión ${(comisionPct * 100).toFixed(1)}% absorbida` : null,
          },
        });
      }
    }

    const precioQ = (precioTotal / 100).toLocaleString('es-GT', { style: 'currency', currency: 'GTQ' });
    console.log(`  ✓ Venta ${i + 1}/20 — ${cliente.nombre} ${cliente.apellido} | ${precioQ} | ${sistema} | ${plazoMeses}m`);
  }

  console.log('\n✅ Seed completado:');
  console.log(`  • 3 proyectos`);
  console.log(`  • ${todosLotes.length} lotes (37 total)`);
  console.log(`  • 25 clientes`);
  console.log(`  • 20 ventas con planes de financiamiento y cuotas`);
  console.log(`  • Impuestos: IVA 12% y Timbres 3%`);
  console.log(`  • Comisiones: Tarjeta crédito 10%, débito 2.5%`);
  console.log(`  • Pagos registrados en cuotas vencidas (~70%)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
