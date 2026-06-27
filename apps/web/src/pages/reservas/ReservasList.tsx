import { useState } from 'react';
import { BookMarked, Plus, X, Check, Ban, MapPin } from 'lucide-react';
import {
  useReservas, useCrearReserva, useCancelarReserva, type Reserva,
} from '../../hooks/useReservas';
import { useClientes } from '../../hooks/useClientes';
import { useLotes } from '../../hooks/useLotes';

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADO_BADGE: Record<Reserva['estado'], { texto: string; bg: string; color: string }> = {
  ACTIVA: { texto: 'Activa', bg: '#dcfce7', color: '#166534' },
  CONVERTIDA: { texto: 'Convertida en venta', bg: '#e0e7ff', color: '#3730a3' },
  CANCELADA: { texto: 'Cancelada', bg: '#f3f4f6', color: '#6b7280' },
};

interface FormReserva {
  clienteId: string;
  loteId: string;
  montoQ: string;
  notas: string;
}

const FORM_INICIAL: FormReserva = { clienteId: '', loteId: '', montoQ: '', notas: '' };

export function ReservasList() {
  const { data: reservas, isLoading } = useReservas();
  const { data: clientes } = useClientes();
  const { data: lotes } = useLotes(undefined, 'DISPONIBLE');
  const crear = useCrearReserva();
  const cancelar = useCancelarReserva();

  const [modoCrear, setModoCrear] = useState(false);
  const [form, setForm] = useState<FormReserva>(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);

  const loteSeleccionado = lotes?.find((l) => l.id === form.loteId);
  const moneda = loteSeleccionado?.moneda ?? 'GTQ';
  const montoCentavos = Math.round(parseFloat(form.montoQ || '0') * 100);
  const puedeGuardar = !!form.clienteId && !!form.loteId && montoCentavos > 0;

  function set(campo: Partial<FormReserva>) {
    setForm((f) => ({ ...f, ...campo }));
  }

  function abrirCrear() {
    setForm(FORM_INICIAL);
    setError(null);
    setModoCrear(true);
  }

  async function guardar() {
    setError(null);
    try {
      await crear.mutateAsync({
        clienteId: form.clienteId,
        loteId: form.loteId,
        monto: montoCentavos,
        notas: form.notas.trim() || undefined,
      });
      setModoCrear(false);
      setForm(FORM_INICIAL);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar la reserva'));
    }
  }

  async function confirmarCancelar(r: Reserva) {
    if (!confirm(`¿Cancelar la reserva del lote ${r.lote.codigo}? El lote volverá a estar disponible.`)) return;
    await cancelar.mutateAsync(r.id);
  }

  const clientesOrdenados = clientes?.slice().sort((a, b) => {
    const na = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nb = `${b.nombre} ${b.apellido}`.toLowerCase();
    return na.localeCompare(nb, 'es');
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
            <BookMarked size={18} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Reservas de lotes</h1>
            <p className="text-xs text-gray-500">Aparta un lote para un cliente con un monto de reserva</p>
          </div>
        </div>
        {!modoCrear && (
          <button onClick={abrirCrear} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Nueva reserva
          </button>
        )}
      </div>

      {modoCrear && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-primary-800">Nueva reserva</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                className="input w-full"
                value={form.clienteId}
                onChange={(e) => set({ clienteId: e.target.value })}
              >
                <option value="">— Selecciona —</option>
                {clientesOrdenados?.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lote *</label>
              <select
                className="input w-full"
                value={form.loteId}
                onChange={(e) => set({ loteId: e.target.value })}
              >
                <option value="">— Selecciona —</option>
                {lotes?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.proyecto.nombre} — {l.codigo} ({fmtMonto(l.precioBase, l.moneda)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Monto de la reserva ({moneda}) *
              </label>
              <input
                className="input w-full"
                type="number"
                min="0"
                step="0.01"
                value={form.montoQ}
                onChange={(e) => set({ montoQ: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
              <input
                className="input w-full"
                value={form.notas}
                onChange={(e) => set({ notas: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 rounded bg-red-50 px-3 py-2">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setModoCrear(false); setError(null); }}
              className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
            >
              <X size={13} /> Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!puedeGuardar || crear.isPending}
              className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
            >
              <Check size={13} />
              {crear.isPending ? 'Guardando…' : 'Reservar lote'}
            </button>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">Cargando…</p>
        ) : !reservas?.length ? (
          <div className="px-4 py-10 text-center">
            <BookMarked size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Aún no hay reservas registradas</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Lote / Cliente</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Monto</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Fecha</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => {
                const badge = ESTADO_BADGE[r.estado];
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <MapPin size={13} style={{ color: r.lote.proyecto.color }} />
                        {r.lote.proyecto.nombre} — {r.lote.codigo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.cliente.nombre} {r.cliente.apellido}</p>
                      {r.notas && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{r.notas}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-gray-800">
                      {fmtMonto(r.monto, r.moneda)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtFecha(r.fecha)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.texto}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.estado === 'ACTIVA' && (
                        <button
                          onClick={() => confirmarCancelar(r)}
                          disabled={cancelar.isPending}
                          className="inline-flex items-center gap-1 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Cancelar reserva"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        Al reservar, el lote queda como <strong>RESERVADO</strong> y deja de aparecer como disponible. Cuando se concrete la
        venta de ese lote, el <strong>monto reservado se aplicará al enganche</strong> y la reserva se marcará como convertida.
      </div>
    </div>
  );
}
