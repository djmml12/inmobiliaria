import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, X, CheckCircle, AlertCircle, Clock, Printer,
} from 'lucide-react';
import {
  useVentas, useVenta,
  type Venta,
} from '../../hooks/useVentas';
import { PlanImpresion, type DatosPlan } from '../../components/PlanImpresion';

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const COLOR_ESTADO: Record<string, string> = {
  ACTIVA: 'bg-blue-100 text-blue-700',
  COMPLETADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-600',
};

const LABEL_SISTEMA: Record<string, string> = {
  SIN_INTERES: 'Sin interés',
  FRANCES: 'Cuota fija',
  ALEMAN: 'Capital cte.',
};

// ─── Detalle de venta ─────────────────────────────────────────────────────────

function ventaDetallada_aDatosPlan(v: NonNullable<ReturnType<typeof useVenta>['data']>): DatosPlan | null {
  const plan = v.planFinanciamiento;
  if (!plan) return null;
  return {
    fechaDocumento: v.fechaVenta,
    cliente: v.cliente,
    lote: {
      codigo: v.lote.codigo,
      area: v.lote.area,
      proyecto: {
        nombre: v.lote.proyecto.nombre,
        ubicacion: v.lote.proyecto.ubicacion,
      },
    },
    financiero: {
      precioBase: v.precioBase,
      tipoImpuesto: v.tipoImpuesto,
      tasaImpuesto: parseFloat(v.tasaImpuesto),
      montoImpuesto: v.montoImpuesto,
      precioTotal: v.precioTotal,
      enganche: v.enganche,
      saldoFinanciar: v.saldoFinanciar,
      moneda: v.moneda,
      sistema: plan.sistema,
      plazoMeses: plan.plazoMeses,
      tasaAnual: parseFloat(plan.tasaAnual),
      fechaPrimeraCuota: plan.fechaPrimeraCuota,
      tabla: {
        filas: plan.cuotas.map((c) => ({
          numero: c.numero,
          fechaVencimiento: c.fechaVencimiento,
          cuota: c.montoCuota,
          capital: c.capital,
          interes: c.interes,
          saldo: c.saldoRestante,
        })),
        totalPagar: plan.cuotas.reduce((s, c) => s + c.montoCuota, 0),
        totalIntereses: plan.cuotas.reduce((s, c) => s + c.interes, 0),
      },
    },
  };
}

function DetalleVenta({ venta, onCerrar }: { venta: Venta; onCerrar: () => void }) {
  const cuotas = venta.planFinanciamiento?.cuotas ?? [];
  const pagadas = cuotas.filter((c) => c.estado === 'PAGADA').length;
  const vencidas = cuotas.filter((c) => c.estado === 'VENCIDA').length;
  const progreso = cuotas.length > 0 ? (pagadas / cuotas.length) * 100 : 0;
  const [mostrarImpresion, setMostrarImpresion] = useState(false);
  const { data: ventaCompleta } = useVenta(venta.id);
  const datosPlan = ventaCompleta ? ventaDetallada_aDatosPlan(ventaCompleta) : null;

  return (
    <div className="flex flex-col h-full">
      {mostrarImpresion && datosPlan && (
        <PlanImpresion datos={datosPlan} onCerrar={() => setMostrarImpresion(false)} />
      )}

      {/* Encabezado */}
      <div className="flex items-start justify-between mb-5 shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            {venta.cliente.apellido}, {venta.cliente.nombre}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {venta.lote.proyecto.nombre} · Lote {venta.lote.codigo}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{fmtFecha(venta.fechaVenta)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_ESTADO[venta.estado]}`}>
            {venta.estado}
          </span>
          {datosPlan && (
            <button
              onClick={() => setMostrarImpresion(true)}
              title="Imprimir / Guardar PDF"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition-colors"
            >
              <Printer size={16} />
            </button>
          )}
          <button onClick={onCerrar} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Montos */}
      <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
        <div className="rounded-lg bg-primary-50 border border-primary-100 p-3">
          <p className="text-xs text-primary-600 font-medium">Precio total</p>
          <p className="font-bold text-primary-800">{fmtMonto(venta.precioTotal, venta.moneda)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Enganche</p>
          <p className="font-semibold text-gray-800">{fmtMonto(venta.enganche, venta.moneda)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Saldo financiado</p>
          <p className="font-semibold text-gray-800">{fmtMonto(venta.saldoFinanciar, venta.moneda)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Impuesto</p>
          <p className="font-semibold text-gray-800">{fmtMonto(venta.montoImpuesto, venta.moneda)}</p>
        </div>
      </div>

      {/* Plan */}
      {venta.planFinanciamiento && (
        <div className="mb-4 rounded-lg border border-gray-200 p-3 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Plan de financiamiento</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
            <span>{LABEL_SISTEMA[venta.planFinanciamiento.sistema] ?? venta.planFinanciamiento.sistema}</span>
            <span>{venta.planFinanciamiento.plazoMeses} meses</span>
            <span>{(parseFloat(venta.planFinanciamiento.tasaAnual) * 100).toFixed(1)}% anual</span>
          </div>
          {cuotas.length > 0 && (
            <>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden mb-1.5">
                <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${progreso}%` }} />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-600 font-medium flex items-center gap-0.5">
                  <CheckCircle size={10} /> {pagadas} pagadas
                </span>
                {vencidas > 0 && (
                  <span className="text-red-600 font-medium flex items-center gap-0.5">
                    <AlertCircle size={10} /> {vencidas} vencidas
                  </span>
                )}
                <span className="text-gray-400 flex items-center gap-0.5">
                  <Clock size={10} /> {cuotas.length - pagadas - vencidas} pendientes
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Cuotas */}
      {cuotas.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 shrink-0">Cuotas</p>
          <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Vencimiento</th>
                  <th className="px-3 py-2 text-right">Cuota</th>
                  <th className="px-3 py-2 text-right">Saldo</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cuotas.map((c) => (
                  <tr key={c.id} className={c.estado === 'VENCIDA' ? 'bg-red-50' : ''}>
                    <td className="px-3 py-1.5 text-gray-400">{c.numero}</td>
                    <td className="px-3 py-1.5 text-gray-500">{fmtFecha(c.fechaVencimiento)}</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-800">{fmtMonto(c.montoCuota, venta.moneda)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-500">{fmtMonto(c.saldoRestante, venta.moneda)}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`rounded-full px-1.5 py-0.5 font-medium ${
                        c.estado === 'PAGADA' ? 'bg-green-100 text-green-700' :
                        c.estado === 'VENCIDA' ? 'bg-red-100 text-red-600' :
                        c.estado === 'PARCIAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{c.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de venta ─────────────────────────────────────────────────────────

function TarjetaVenta({ venta, activa, onClick }: { venta: Venta; activa: boolean; onClick: () => void }) {
  const cuotas = venta.planFinanciamiento?.cuotas ?? [];
  const pagadas = cuotas.filter((c) => c.estado === 'PAGADA').length;
  const vencidas = cuotas.filter((c) => c.estado === 'VENCIDA').length;
  const progreso = cuotas.length > 0 ? (pagadas / cuotas.length) * 100 : 0;

  const color = venta.lote.proyecto.color;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`w-full text-left rounded-xl border p-5 flex flex-col gap-3 ${
        activa
          ? 'border-primary-300 bg-primary-50 shadow-md ring-1 ring-primary-200'
          : ''
      }`}
      style={activa ? undefined : {
        backgroundColor: color + '14',
        borderColor: color + '50',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">
            {venta.cliente.apellido}, {venta.cliente.nombre}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {venta.lote.proyecto.nombre}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${COLOR_ESTADO[venta.estado]}`}>
          {venta.estado}
        </span>
      </div>

      {/* Lote + fecha */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 font-medium">
          Lote {venta.lote.codigo}
        </span>
        <span>{fmtFecha(venta.fechaVenta)}</span>
      </div>

      {/* Monto */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-lg font-bold text-gray-900">{fmtMonto(venta.precioTotal, venta.moneda)}</p>
        </div>
        {venta.planFinanciamiento && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Plan</p>
            <p className="text-xs font-medium text-gray-600">
              {LABEL_SISTEMA[venta.planFinanciamiento.sistema] ?? venta.planFinanciamiento.sistema}
            </p>
            <p className="text-xs text-gray-400">{venta.planFinanciamiento.plazoMeses} meses</p>
          </div>
        )}
      </div>

      {/* Progreso de cuotas */}
      {cuotas.length > 0 && (
        <div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${vencidas > 0 ? 'bg-orange-400' : 'bg-green-400'}`}
              style={{ width: `${progreso}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="text-green-600 font-medium">{pagadas}/{cuotas.length} pagadas</span>
            {vencidas > 0 && (
              <span className="text-red-500 font-medium flex items-center gap-0.5">
                <AlertCircle size={10} /> {vencidas} vencida{vencidas > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.button>
  );
}

// ─── Drawer lateral ───────────────────────────────────────────────────────────

function Drawer({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]" />
      )}
      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-40 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

type PanelDerecho =
  | { tipo: 'vacia' }
  | { tipo: 'detalle'; venta: Venta };

export function VentasList() {
  const { data: ventas, isLoading, isError } = useVentas();
  const [panel, setPanel] = useState<PanelDerecho>({ tipo: 'vacia' });

  function abrirVenta(venta: Venta) {
    setPanel({ tipo: 'detalle', venta });
  }

  function cerrarPanel() {
    setPanel({ tipo: 'vacia' });
  }

  const ventaActiva = panel.tipo === 'detalle' ? panel.venta : null;
  const drawerAbierto = panel.tipo !== 'vacia';

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ventas</h1>
        {ventas && (
          <p className="text-sm text-gray-400 mt-0.5">{ventas.length} registros</p>
        )}
      </div>

      {/* Estados de carga */}
      {isLoading && (
        <div className="card py-10 text-center text-sm text-gray-400">Cargando ventas…</div>
      )}
      {isError && (
        <div className="card py-8 text-center text-sm text-red-500">No se pudieron cargar las ventas.</div>
      )}

      {/* Sin datos */}
      {!isLoading && !isError && ventas?.length === 0 && (
        <div className="card py-16 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-500">No hay ventas registradas.</p>
        </div>
      )}

      {/* Grilla 3 columnas */}
      {ventas && ventas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ventas.map((v) => (
            <TarjetaVenta
              key={v.id}
              venta={v}
              activa={ventaActiva?.id === v.id}
              onClick={() => abrirVenta(v)}
            />
          ))}
        </div>
      )}

      {/* Drawer lateral — solo para detalle de venta */}
      <Drawer open={drawerAbierto}>
        {panel.tipo === 'detalle' && (
          <DetalleVenta venta={panel.venta} onCerrar={cerrarPanel} />
        )}
      </Drawer>
    </div>
  );
}
