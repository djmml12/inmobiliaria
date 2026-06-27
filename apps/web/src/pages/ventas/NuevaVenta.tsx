import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, Home, User, TrendingUp, Calendar,
  FileSignature, ArrowLeft, Printer,
} from 'lucide-react';
import {
  useSimularVenta, useCrearVenta,
  type SimulacionVenta, type CreateVentaData,
} from '../../hooks/useVentas';
import { useProyectos } from '../../hooks/useProyectos';
import { useLotes, type Lote } from '../../hooks/useLotes';
import { useClientes, type Cliente } from '../../hooks/useClientes';
import { useVendedores } from '../../hooks/useVendedores';
import { useReservas } from '../../hooks/useReservas';
import { PlanImpresion, type DatosPlan } from '../../components/PlanImpresion';
import { ContratoCompraventa } from '../../components/ContratoCompraventa';

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PLAZOS_SUGERIDOS = [
  { label: '1 año', meses: 12 },
  { label: '2 años', meses: 24 },
  { label: '3 años', meses: 36 },
  { label: '4 años', meses: 48 },
];

function TablaAmortizacion({ sim }: { sim: SimulacionVenta }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-primary-50 border border-primary-100 p-3">
          <p className="text-xs text-primary-600 font-medium">Precio total</p>
          <p className="mt-0.5 text-base font-bold text-primary-800">{fmtMonto(sim.precioTotal, sim.moneda)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Enganche</p>
          <p className="mt-0.5 text-base font-semibold text-gray-800">{fmtMonto(sim.enganche, sim.moneda)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">Saldo a financiar</p>
          <p className="mt-0.5 text-base font-semibold text-gray-800">{fmtMonto(sim.saldoFinanciar, sim.moneda)}</p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-100 p-3">
          <p className="text-xs text-green-600 font-medium">Total a pagar</p>
          <p className="mt-0.5 text-base font-bold text-green-800">{fmtMonto(sim.tabla.totalPagar, sim.moneda)}</p>
        </div>
      </div>

      {sim.tabla.totalIntereses > 0 && (
        <p className="text-xs text-gray-500 text-right">
          Intereses totales: <span className="font-medium">{fmtMonto(sim.tabla.totalIntereses, sim.moneda)}</span>
        </p>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Tabla de amortización — {sim.tabla.filas.length} cuotas
        </p>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-right">Cuota</th>
                  <th className="px-3 py-2 text-right">Capital</th>
                  <th className="px-3 py-2 text-right">Interés</th>
                  <th className="px-3 py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sim.tabla.filas.map((f) => (
                  <tr key={f.numero} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-400">{f.numero}</td>
                    <td className="px-3 py-1.5 text-gray-500">{fmtFecha(f.fechaVencimiento.toString())}</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-800">{fmtMonto(f.cuota, sim.moneda)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-600">{fmtMonto(f.capital, sim.moneda)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-400">{fmtMonto(f.interes, sim.moneda)}</td>
                    <td className="px-3 py-1.5 text-right text-gray-400">{fmtMonto(f.saldo, sim.moneda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormVenta {
  proyectoId: string;
  loteId: string;
  clienteId: string;
  vendedorId: string;
  fechaVenta: string;
  engancheQ: string;
  medioPago: string;
  notas: string;
  sistema: string;
  plazoMeses: string;
  tasaAnualPct: string;
  fechaPrimeraCuota: string;
}

const hoy = () => new Date().toISOString().slice(0, 10);
const mesProximo = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

const FORM_INICIAL: FormVenta = {
  proyectoId: '',
  loteId: '',
  clienteId: '',
  vendedorId: '',
  fechaVenta: hoy(),
  engancheQ: '0',
  medioPago: 'EFECTIVO',
  notas: '',
  sistema: 'FRANCES',
  plazoMeses: '48',
  tasaAnualPct: '12',
  fechaPrimeraCuota: mesProximo(),
};

function simulacion_aDatosPlan(
  sim: SimulacionVenta,
  form: FormVenta,
  lote: Lote | undefined,
  cliente: Cliente | undefined,
): DatosPlan {
  return {
    fechaDocumento: form.fechaVenta,
    cliente: cliente
      ? {
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          dpi: cliente.dpi,
          nit: cliente.nit,
          telefono: cliente.telefono,
          email: cliente.email,
          direccion: cliente.direccion,
        }
      : undefined,
    lote: lote
      ? {
          codigo: lote.codigo,
          area: lote.area,
          proyecto: { nombre: lote.proyecto.nombre },
        }
      : undefined,
    financiero: {
      precioBase: sim.precioBase,
      tipoImpuesto: sim.tipoImpuesto,
      tasaImpuesto: sim.tasaImpuesto,
      montoImpuesto: sim.montoImpuesto,
      precioTotal: sim.precioTotal,
      enganche: sim.enganche,
      saldoFinanciar: sim.saldoFinanciar,
      moneda: sim.moneda,
      sistema: form.sistema,
      plazoMeses: parseInt(form.plazoMeses) || 0,
      tasaAnual: parseFloat(form.tasaAnualPct) / 100,
      fechaPrimeraCuota: form.fechaPrimeraCuota,
      tabla: {
        filas: sim.tabla.filas,
        totalPagar: sim.tabla.totalPagar,
        totalIntereses: sim.tabla.totalIntereses,
      },
    },
  };
}

type Paso = 'formulario' | 'contrato';

export function NuevaVenta() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormVenta>(FORM_INICIAL);
  const [simulacion, setSimulacion] = useState<SimulacionVenta | null>(null);
  const [mostrarImpresion, setMostrarImpresion] = useState(false);
  const [paso, setPaso] = useState<Paso>('formulario');

  const set = (campo: Partial<FormVenta>) =>
    setForm((f) => {
      const nuevo = { ...f, ...campo };
      if ('proyectoId' in campo) nuevo.loteId = '';
      if ('sistema' in campo && campo.sistema === 'SIN_INTERES') nuevo.tasaAnualPct = '0';
      return nuevo;
    });

  const setConReset = (campo: Partial<FormVenta>) => {
    setSimulacion(null);
    set(campo);
  };

  const { data: proyectos } = useProyectos();
  const monteAlegre = proyectos?.find((p) => p.nombre.toLowerCase().includes('monte alegre'));

  useEffect(() => {
    if (monteAlegre && !form.proyectoId) {
      set({ proyectoId: monteAlegre.id });
    }
  }, [monteAlegre]);

  const { data: lotes } = useLotes(form.proyectoId || undefined);
  const { data: clientes } = useClientes();
  const { data: vendedores } = useVendedores();
  const { data: reservas } = useReservas();
  const simular = useSimularVenta();
  const crear = useCrearVenta();

  // Lotes vendibles: disponibles + reservados (estos se concretan en venta y
  // su monto de reserva se aplica al enganche).
  const lotesVendibles = lotes?.filter((l) => l.estado === 'DISPONIBLE' || l.estado === 'RESERVADO');
  const loteSeleccionado = lotesVendibles?.find((l) => l.id === form.loteId);
  const reservaDelLote = reservas?.find((r) => r.loteId === form.loteId && r.estado === 'ACTIVA');

  // Al seleccionar un lote reservado, precargamos su cliente y el monto de la
  // reserva como enganche.
  function seleccionarLote(loteId: string) {
    const reserva = reservas?.find((r) => r.loteId === loteId && r.estado === 'ACTIVA');
    setSimulacion(null);
    setForm((f) => ({
      ...f,
      loteId,
      ...(reserva
        ? { clienteId: reserva.clienteId, engancheQ: (reserva.monto / 100).toString() }
        : {}),
    }));
  }
  const plazoNum = parseInt(form.plazoMeses) || 0;
  const puedeSimular = !!form.loteId && plazoNum > 0;
  const puedeConfirmar = !!simulacion && !!form.clienteId && !!form.fechaVenta;
  const clienteSeleccionado = clientes?.find((c) => c.id === form.clienteId);

  async function calcularPlan() {
    if (!puedeSimular) return;
    const resultado = await simular.mutateAsync({
      loteId: form.loteId,
      enganche: Math.round(parseFloat(form.engancheQ || '0') * 100),
      plan: {
        sistema: form.sistema,
        plazoMeses: plazoNum,
        tasaAnual: parseFloat(form.tasaAnualPct) / 100,
        fechaPrimeraCuota: form.fechaPrimeraCuota,
      },
    });
    setSimulacion(resultado);
  }

  async function confirmar() {
    const dto: CreateVentaData = {
      loteId: form.loteId,
      clienteId: form.clienteId,
      vendedorId: form.vendedorId || undefined,
      fechaVenta: form.fechaVenta,
      enganche: Math.round(parseFloat(form.engancheQ || '0') * 100),
      notas: form.notas.trim() || undefined,
      plan: {
        sistema: form.sistema,
        plazoMeses: plazoNum,
        tasaAnual: parseFloat(form.tasaAnualPct) / 100,
        fechaPrimeraCuota: form.fechaPrimeraCuota,
      },
    };
    const venta = await crear.mutateAsync(dto);
    navigate(`/ventas?highlight=${venta.id}`, { replace: true });
  }

  const errorMsg =
    (crear.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message ??
    (simular.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message ??
    ((crear.error ?? simular.error) ? 'Ocurrió un error' : null);

  // ─── Paso: contrato ──────────────────────────────────────────────────────────

  if (paso === 'contrato' && simulacion && clienteSeleccionado && loteSeleccionado) {
    return (
      <ContratoCompraventa
        datos={{
          fechaVenta: form.fechaVenta,
          cliente: clienteSeleccionado,
          lote: loteSeleccionado,
          simulacion,
          sistema: form.sistema,
          plazoMeses: parseInt(form.plazoMeses) || 0,
          tasaAnualPct: parseFloat(form.tasaAnualPct) || 0,
          fechaPrimeraCuota: form.fechaPrimeraCuota,
          medioPago: form.medioPago,
          notas: form.notas.trim() || undefined,
        }}
        onVolver={() => setPaso('formulario')}
        onConfirmar={confirmar}
        confirmando={crear.isPending}
        error={errorMsg}
      />
    );
  }

  // ─── Paso: formulario ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nueva venta</h1>
          <p className="text-sm text-gray-400 mt-0.5">Completa los datos y calcula el plan de financiamiento</p>
        </div>
      </div>

      {/* Propiedad */}
      <section className="card">
        <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Home size={12} /> Propiedad
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Lote *</label>
          <select className="input w-full" value={form.loteId} onChange={(e) => seleccionarLote(e.target.value)} disabled={!form.proyectoId}>
            <option value="">— Selecciona —</option>
            {lotesVendibles?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo} — {fmtMonto(l.precioBase, l.moneda)}
                {l.estado === 'RESERVADO' ? ' (Reservado)' : ''}
              </option>
            ))}
          </select>
        </div>
        {reservaDelLote && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Este lote tiene una reserva activa de{' '}
            <strong>{fmtMonto(reservaDelLote.monto, reservaDelLote.moneda)}</strong> a nombre de{' '}
            <strong>{reservaDelLote.cliente.nombre} {reservaDelLote.cliente.apellido}</strong>. El monto se aplicó al
            enganche; al concretar la venta la reserva se marcará como convertida.
          </div>
        )}
        {loteSeleccionado && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span>Área: {parseFloat(loteSeleccionado.area).toFixed(0)} m²</span>
            <span>Precio base: {fmtMonto(loteSeleccionado.precioBase, loteSeleccionado.moneda)}</span>
            <span>Impuesto: {loteSeleccionado.proyecto.tipoImpuesto} {(parseFloat(loteSeleccionado.proyecto.tasaImpuesto) * 100).toFixed(0)}%</span>
          </div>
        )}
      </section>

      {/* Cliente y condiciones */}
      <section className="card">
        <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <User size={12} /> Cliente y condiciones
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cliente *</label>
            <select className="input w-full" value={form.clienteId} onChange={(e) => set({ clienteId: e.target.value })}>
              <option value="">— Selecciona —</option>
              {clientes?.slice().sort((a, b) => {
                const na = `${a.nombre} ${a.apellido}`.toLowerCase();
                const nb = `${b.nombre} ${b.apellido}`.toLowerCase();
                return na.localeCompare(nb, 'es');
              }).map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Fecha de venta *</label>
            <input className="input w-full" type="date" value={form.fechaVenta} onChange={(e) => set({ fechaVenta: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Vendedor</label>
            <select
              className="input w-full"
              value={form.vendedorId}
              onChange={(e) => set({ vendedorId: e.target.value })}
            >
              <option value="">— Sin asignar —</option>
              {vendedores?.filter((v) => v.activo).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.apellido}, {v.nombre}
                </option>
              ))}
            </select>
          </div>
          <div />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Enganche {loteSeleccionado ? `(${loteSeleccionado.moneda})` : ''}
            </label>
            <input
              className="input w-full"
              type="number"
              min="0"
              step="0.01"
              value={form.engancheQ}
              onChange={(e) => setConReset({ engancheQ: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Método de pago del enganche</label>
            <select className="input w-full" value={form.medioPago} onChange={(e) => set({ medioPago: e.target.value })}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="CHEQUE">Cheque</option>
              <option value="TRANSFERENCIA">Transferencia bancaria</option>
              <option value="TARJETA">Tarjeta de crédito/débito</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
          <input className="input w-full" value={form.notas} onChange={(e) => set({ notas: e.target.value })} placeholder="Opcional" />
        </div>
      </section>

      {/* Plan de financiamiento */}
      <section className="card">
        <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <TrendingUp size={12} /> Plan de financiamiento
        </p>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Método de pago</label>
          <select className="input w-full" value={form.sistema} onChange={(e) => setConReset({ sistema: e.target.value })}>
            <option value="FRANCES">Cuota fija mensual</option>
          </select>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Número de cuotas (meses)</label>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PLAZOS_SUGERIDOS.map(({ label, meses }) => {
              const activo = form.plazoMeses === String(meses);
              return (
                <button
                  key={meses}
                  type="button"
                  onClick={() => setConReset({ plazoMeses: String(meses) })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    activo ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                  <span className={`ml-1 ${activo ? 'text-primary-200' : 'text-gray-400'}`}>({meses})</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                className="input w-full text-center text-lg font-bold"
                type="number"
                min="1"
                max="48"
                value={form.plazoMeses}
                onChange={(e) => setConReset({ plazoMeses: e.target.value })}
                placeholder="Ej: 120"
              />
            </div>
            {plazoNum > 0 && (
              <p className="text-sm text-gray-500">
                = <span className="font-medium text-gray-700">{(plazoNum / 12).toFixed(1)} años</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <Calendar size={12} className="inline mr-1" />Primera cuota
            </label>
            <input className="input w-full" type="date" value={form.fechaPrimeraCuota} onChange={(e) => setConReset({ fechaPrimeraCuota: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-secondary w-full flex items-center justify-center gap-2"
              onClick={calcularPlan}
              disabled={!puedeSimular || simular.isPending}
            >
              <Calculator size={14} />
              {simular.isPending ? 'Calculando…' : 'Calcular plan'}
            </button>
          </div>
        </div>
      </section>

      {/* Simulación */}
      {simulacion && (
        <>
          {mostrarImpresion && (
            <PlanImpresion
              datos={simulacion_aDatosPlan(
                simulacion,
                form,
                loteSeleccionado,
                clientes?.find((c) => c.id === form.clienteId),
              )}
              onCerrar={() => setMostrarImpresion(false)}
            />
          )}
          <section className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Simulación — {plazoNum} cuotas
              </p>
              <button
                type="button"
                onClick={() => setMostrarImpresion(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <Printer size={12} />
                Imprimir / Guardar PDF
              </button>
            </div>
            <TablaAmortizacion sim={simulacion} />
          </section>
        </>
      )}

      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pb-8">
        <button
          className="btn-secondary flex-1"
          onClick={() => navigate('/')}
        >
          Cancelar
        </button>
        <button
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          onClick={() => setPaso('contrato')}
          disabled={!puedeConfirmar}
        >
          <FileSignature size={14} />
          Ver contrato
        </button>
      </div>
    </div>
  );
}
