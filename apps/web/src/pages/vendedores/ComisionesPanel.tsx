import { useState } from 'react';
import { TrendingUp, Clock, CheckCircle, ChevronDown, ChevronRight, Medal, Unlock } from 'lucide-react';
import {
  useReporteVendedores, useMarcarComisionPagada,
  type VendedorRanking, type VentaResumen,
} from '../../hooks/useVendedores';

function fmt(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Tarjeta resumen ──────────────────────────────────────────────────────────

function TarjetaResumen({
  label, monto, icono, colorBg, colorText, colorMonto,
}: {
  label: string;
  monto: number;
  icono: React.ReactNode;
  colorBg: string;
  colorText: string;
  colorMonto: string;
}) {
  return (
    <div className={`card flex items-center gap-4`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorBg}`}>
        {icono}
      </div>
      <div>
        <p className={`text-xs font-medium ${colorText}`}>{label}</p>
        <p className={`mt-0.5 text-xl font-bold ${colorMonto}`}>{fmt(monto)}</p>
      </div>
    </div>
  );
}

// ─── Medalla de ranking ───────────────────────────────────────────────────────

function Medalla({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-base">🥇</span>;
  if (pos === 2) return <span className="text-base">🥈</span>;
  if (pos === 3) return <span className="text-base">🥉</span>;
  return <span className="text-sm font-bold text-gray-400">#{pos}</span>;
}

// ─── Fila de venta dentro del detalle ─────────────────────────────────────────

function FilaVenta({ venta, onToggle, toggling }: {
  venta: VentaResumen;
  onToggle: (pagada: boolean) => void;
  toggling: boolean;
}) {
  const monto = venta.comisionMonto ?? 0;
  const pctMostrado = `${(venta.pctPagado * 100).toFixed(1)}%`;

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-3 py-2.5 text-xs text-gray-500">{fmtFecha(venta.fechaVenta)}</td>
      <td className="px-3 py-2.5">
        <p className="text-xs font-medium text-gray-800">
          {venta.cliente.apellido}, {venta.cliente.nombre}
        </p>
        <p className="text-xs text-gray-400">
          {venta.lote.proyecto.nombre} · Lote {venta.lote.codigo}
        </p>
      </td>
      <td className="px-3 py-2.5 text-right text-xs font-mono text-gray-700">
        {fmt(venta.precioBase, venta.moneda)}
      </td>
      <td className="px-3 py-2.5 text-right text-xs font-mono font-semibold text-gray-900">
        {monto > 0 ? fmt(monto, venta.moneda) : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-3 py-2.5 text-center">
        {venta.comisionElegible ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5">
            <Unlock size={10} /> Elegible ({pctMostrado})
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 text-xs px-2 py-0.5"
            title={`Pagado: ${pctMostrado} — se requiere mínimo 10%`}
          >
            <Clock size={10} /> {pctMostrado} / 10%
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center">
        <button
          disabled={toggling || monto === 0 || !venta.comisionElegible}
          onClick={() => onToggle(!venta.comisionPagada)}
          title={!venta.comisionElegible ? 'El cliente aún no ha cancelado el 10% mínimo' : undefined}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-40 ${
            venta.comisionPagada
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          {venta.comisionPagada
            ? <><CheckCircle size={11} /> Pagada</>
            : <><Clock size={11} /> Pendiente</>}
        </button>
      </td>
    </tr>
  );
}

// ─── Fila de vendedor en el ranking ──────────────────────────────────────────

function FilaVendedor({
  vendedor, pos, marcar,
}: {
  vendedor: VendedorRanking;
  pos: number;
  marcar: ReturnType<typeof useMarcarComisionPagada>;
}) {
  const [abierto, setAbierto] = useState(false);
  const tieneComisiones = vendedor.comisionTotal > 0;

  return (
    <>
      <tr
        className={`border-t border-gray-100 transition-colors ${tieneComisiones ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={() => tieneComisiones && setAbierto((o) => !o)}
      >
        <td className="px-4 py-3 w-10">
          <div className="flex items-center justify-center">
            <Medalla pos={pos} />
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {tieneComisiones && (
              <span className="text-gray-400">
                {abierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {vendedor.apellido}, {vendedor.nombre}
              </p>
              {vendedor.telefono && (
                <p className="text-xs text-gray-400">{vendedor.telefono}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold w-7 h-7">
            {vendedor.totalVentas}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          {vendedor.comisionElegible > 0 ? (
            <span className="text-sm font-medium text-emerald-700">
              {fmt(vendedor.comisionElegible)}
            </span>
          ) : (
            <span className="text-sm text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          {vendedor.comisionPendiente > 0 ? (
            <span className="text-sm font-medium text-amber-700">
              {fmt(vendedor.comisionPendiente)}
            </span>
          ) : (
            <span className="text-sm text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          {vendedor.comisionPagada > 0 ? (
            <span className="text-sm font-medium text-green-700">
              {fmt(vendedor.comisionPagada)}
            </span>
          ) : (
            <span className="text-sm text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-sm font-bold text-gray-900">
            {vendedor.comisionTotal > 0 ? fmt(vendedor.comisionTotal) : '—'}
          </span>
        </td>
      </tr>

      {abierto && vendedor.ventas.length > 0 && (
        <tr>
          <td colSpan={7} className="bg-gray-50 px-4 pb-3 pt-0">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente / Lote</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Precio base</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Comisión</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Elegible</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedor.ventas.map((v) => (
                    <FilaVenta
                      key={v.id}
                      venta={v}
                      onToggle={(pagada) => marcar.mutate({ ventaId: v.id, pagada })}
                      toggling={marcar.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

export function ComisionesPanel() {
  const { data, isLoading } = useReporteVendedores();
  const marcar = useMarcarComisionPagada();

  const totalComisiones = (data?.resumen.totalPendiente ?? 0) + (data?.resumen.totalPagado ?? 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
          <Medal size={18} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Comisiones de asesores de ventas</h1>
          <p className="text-xs text-gray-500">Ranking, seguimiento y pago de comisiones</p>
        </div>
      </div>

      {/* Regla de negocio */}
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-700 space-y-0.5">
        <p><span className="font-semibold">Comisión:</span> 5% del precio base del lote vendido, por asesor asignado.</p>
        <p><span className="font-semibold">Condición de pago:</span> La comisión se habilita para pago cuando el cliente haya cancelado al menos el <span className="font-semibold">10%</span> del precio total de la venta.</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaResumen
          label="Total comisiones generadas"
          monto={totalComisiones}
          icono={<TrendingUp size={20} className="text-indigo-600" />}
          colorBg="bg-indigo-100"
          colorText="text-indigo-600"
          colorMonto="text-indigo-800"
        />
        <TarjetaResumen
          label="Elegibles para pago"
          monto={data?.resumen.totalElegible ?? 0}
          icono={<Unlock size={20} className="text-emerald-600" />}
          colorBg="bg-emerald-100"
          colorText="text-emerald-600"
          colorMonto="text-emerald-800"
        />
        <TarjetaResumen
          label="Pendientes de pago"
          monto={data?.resumen.totalPendiente ?? 0}
          icono={<Clock size={20} className="text-amber-600" />}
          colorBg="bg-amber-100"
          colorText="text-amber-600"
          colorMonto="text-amber-800"
        />
        <TarjetaResumen
          label="Comisiones pagadas"
          monto={data?.resumen.totalPagado ?? 0}
          icono={<CheckCircle size={20} className="text-green-600" />}
          colorBg="bg-green-100"
          colorText="text-green-600"
          colorMonto="text-green-800"
        />
      </div>

      {/* Ranking */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ranking de asesores de ventas
          </p>
        </div>

        {isLoading ? (
          <p className="px-4 py-8 text-sm text-gray-400 text-center">Cargando…</p>
        ) : !data?.ranking.length ? (
          <div className="px-4 py-12 text-center">
            <Medal size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No hay asesores de ventas registrados aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 w-10">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Asesor de ventas</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Ventas</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">Elegible</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-amber-500">Pendiente</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-green-600">Pagada</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.ranking.map((v, i) => (
                <FilaVendedor
                  key={v.id}
                  vendedor={v}
                  pos={i + 1}
                  marcar={marcar}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Haz clic en un asesor para ver sus ventas y marcar comisiones como pagadas.
        Las comisiones se calculan sobre el precio base del lote.
      </p>
    </div>
  );
}
