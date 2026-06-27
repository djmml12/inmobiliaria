import { useNavigate } from 'react-router-dom';
import { TrendingUp, Home, Users, AlertCircle, DollarSign, CheckCircle, Clock, BarChart2, Medal, ChevronRight } from 'lucide-react';
import { useDashboard, type ResumenVenta } from '../../hooks/useDashboard';
import { useReporteVendedores } from '../../hooks/useVendedores';
import { useAuthStore } from '../../store/auth.store';

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const LABEL_SISTEMA: Record<string, string> = {
  SIN_INTERES: 'Sin interés',
  FRANCES: 'Cuota fija',
  ALEMAN: 'Capital cte.',
};

const COLOR_ESTADO: Record<string, string> = {
  ACTIVA: 'bg-blue-100 text-blue-700',
  COMPLETADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-red-100 text-red-600',
};

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string; // clases de color para el icono/fondo
  alerta?: boolean;
  onClick?: () => void;
}

function StatCard({ label, value, sub, icon, color, alerta, onClick }: StatCardProps) {
  return (
    <div
      className={`card flex items-start gap-4 ${alerta ? 'border-red-200 bg-red-50' : ''} ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className={`rounded-xl p-2.5 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold ${alerta ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Barra de progreso de lotes ───────────────────────────────────────────────

function LotesBar({ disponibles, vendidos, reservados, total }: {
  disponibles: number; vendidos: number; reservados: number; total: number;
}) {
  if (total === 0) return null;
  const pDisp = (disponibles / total) * 100;
  const pVend = (vendidos / total) * 100;
  const pRes = (reservados / total) * 100;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <BarChart2 size={15} className="text-gray-400" /> Ocupación de lotes
        </h3>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 gap-0.5">
        {pVend > 0 && <div className="h-full bg-primary-500 transition-all" style={{ width: `${pVend}%` }} title={`Vendidos: ${vendidos}`} />}
        {pRes > 0 && <div className="h-full bg-yellow-400 transition-all" style={{ width: `${pRes}%` }} title={`Reservados: ${reservados}`} />}
        {pDisp > 0 && <div className="h-full bg-green-400 transition-all" style={{ width: `${pDisp}%` }} title={`Disponibles: ${disponibles}`} />}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary-500 inline-block" /> Vendidos: <strong>{vendidos}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" /> Reservados: <strong>{reservados}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400 inline-block" /> Disponibles: <strong>{disponibles}</strong>
        </span>
      </div>
    </div>
  );
}

// ─── Cobros: comparativa mes ──────────────────────────────────────────────────

function CobrosComparativa({ mesActual, mesAnterior, conteo, onClick }: {
  mesActual: number; mesAnterior: number; conteo: number; onClick?: () => void;
}) {
  const diff = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : null;
  const mejora = diff !== null && diff >= 0;

  return (
    <div
      className={`card ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <DollarSign size={15} className="text-gray-400" /> Cobros del mes
        </h3>
        <span className="text-xs text-gray-400">{conteo} pago{conteo !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{fmtMonto(mesActual)}</p>
      {diff !== null && (
        <p className={`mt-1 text-xs font-medium ${mejora ? 'text-green-600' : 'text-red-500'}`}>
          {mejora ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}% vs mes anterior
          <span className="font-normal text-gray-400 ml-1">({fmtMonto(mesAnterior)})</span>
        </p>
      )}
      {diff === null && mesAnterior === 0 && (
        <p className="mt-1 text-xs text-gray-400">Sin cobros el mes anterior</p>
      )}
    </div>
  );
}

// ─── Cuotas: resumen ──────────────────────────────────────────────────────────

function CuotasResumen({ vencidas, pendientes, pagadas, montoVencido }: {
  vencidas: number; pendientes: number; pagadas: number; montoVencido: number;
}) {
  const total = vencidas + pendientes + pagadas;
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
        <Clock size={15} className="text-gray-400" /> Estado de cuotas
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-lg bg-green-50 p-3 text-center">
          <p className="text-lg font-bold text-green-700">{pagadas}</p>
          <p className="text-xs text-green-600">Pagadas</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-lg font-bold text-gray-700">{pendientes}</p>
          <p className="text-xs text-gray-500">Pendientes</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${vencidas > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className={`text-lg font-bold ${vencidas > 0 ? 'text-red-700' : 'text-gray-400'}`}>{vencidas}</p>
          <p className={`text-xs ${vencidas > 0 ? 'text-red-500' : 'text-gray-400'}`}>Vencidas</p>
        </div>
      </div>
      {total > 0 && (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 gap-0.5 mb-2">
          {pagadas > 0 && <div className="h-full bg-green-400" style={{ width: `${(pagadas / total) * 100}%` }} />}
          {pendientes > 0 && <div className="h-full bg-gray-300" style={{ width: `${(pendientes / total) * 100}%` }} />}
          {vencidas > 0 && <div className="h-full bg-red-400" style={{ width: `${(vencidas / total) * 100}%` }} />}
        </div>
      )}
      {vencidas > 0 && (
        <p className="text-xs text-red-600 font-medium">
          Monto vencido pendiente: {fmtMonto(montoVencido)}
        </p>
      )}
    </div>
  );
}

// ─── Ventas recientes ─────────────────────────────────────────────────────────

function VentasRecientes({ ventas }: { ventas: ResumenVenta[] }) {
  if (ventas.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <TrendingUp size={15} className="text-gray-400" /> Ventas recientes
      </h3>
      <div className="divide-y divide-gray-100">
        {ventas.map((v) => (
          <div key={v.id} className="flex items-center justify-between py-2.5 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {v.cliente.apellido}, {v.cliente.nombre}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {v.lote.proyecto.nombre} · Lote {v.lote.codigo}
                {v.planFinanciamiento && (
                  <> · {LABEL_SISTEMA[v.planFinanciamiento.sistema]} {v.planFinanciamiento.plazoMeses}m</>
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">{fmtMonto(v.precioTotal, v.moneda)}</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                <span className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${COLOR_ESTADO[v.estado]}`}>
                  {v.estado}
                </span>
                <span className="text-xs text-gray-400">{fmtFecha(v.fechaVenta)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comisiones resumen ───────────────────────────────────────────────────────

function MedallaPos({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-sm">🥇</span>;
  if (pos === 2) return <span className="text-sm">🥈</span>;
  if (pos === 3) return <span className="text-sm">🥉</span>;
  return null;
}

function ComisionesResumen({ onClick }: { onClick: () => void }) {
  const { data, isLoading } = useReporteVendedores();

  const totalPendiente = data?.resumen.totalPendiente ?? 0;
  const totalPagado = data?.resumen.totalPagado ?? 0;
  const totalGeneral = totalPendiente + totalPagado;
  const top3 = data?.ranking.slice(0, 3) ?? [];

  return (
    <div
      className="card cursor-pointer hover:shadow-md hover:border-gray-300 transition-shadow"
      onClick={onClick}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Medal size={15} className="text-indigo-500" />
          Comisiones de asesores
        </h3>
        <span className="flex items-center gap-0.5 text-xs text-indigo-600 font-medium">
          Ver detalle <ChevronRight size={13} />
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 rounded bg-gray-100 animate-pulse" />
          <div className="h-4 rounded bg-gray-100 animate-pulse w-3/4" />
        </div>
      ) : (
        <>
          {/* Tres cifras clave */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg bg-amber-50 p-2.5 text-center">
              <p className="text-sm font-bold text-amber-700">{fmtMonto(totalPendiente)}</p>
              <p className="text-xs text-amber-600 mt-0.5">Pendientes</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5 text-center">
              <p className="text-sm font-bold text-green-700">{fmtMonto(totalPagado)}</p>
              <p className="text-xs text-green-600 mt-0.5">Pagadas</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2.5 text-center">
              <p className="text-sm font-bold text-indigo-700">{fmtMonto(totalGeneral)}</p>
              <p className="text-xs text-indigo-600 mt-0.5">Total</p>
            </div>
          </div>

          {/* Ranking top 3 */}
          {top3.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {top3.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between py-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MedallaPos pos={i + 1} />
                    <span className="text-sm text-gray-800 font-medium truncate">
                      {v.apellido}, {v.nombre}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-gray-900">{fmtMonto(v.comisionTotal)}</p>
                    <p className="text-xs text-gray-400">{v.totalVentas} venta{v.totalVentas !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">Sin asesores con ventas aún</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="card py-12 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-sm text-red-600">No se pudo cargar el panel. Verifica que la API esté en línea.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel principal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bienvenido, {usuario?.nombre}</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Lotes disponibles"
          value={data.lotes.disponibles}
          sub={`de ${data.lotes.total} en total`}
          icon={<Home size={18} className="text-green-600" />}
          color="bg-green-100"
          onClick={() => navigate('/lotes-disponibles')}
        />
        <StatCard
          label="Ventas activas"
          value={data.ventas.activas}
          sub={fmtMonto(data.ventas.montoTotalActivas)}
          icon={<TrendingUp size={18} className="text-blue-600" />}
          color="bg-blue-100"
          onClick={() => navigate('/ventas')}
        />
        <StatCard
          label="Cuotas vencidas"
          value={data.cuotas.vencidas}
          sub={data.cuotas.vencidas > 0 ? fmtMonto(data.cuotas.montoVencido) : 'Al día'}
          icon={<AlertCircle size={18} className={data.cuotas.vencidas > 0 ? 'text-red-600' : 'text-gray-400'} />}
          color={data.cuotas.vencidas > 0 ? 'bg-red-100' : 'bg-gray-100'}
          alerta={data.cuotas.vencidas > 0}
          onClick={() => navigate('/pagos?filtro=rojo')}
        />
      </div>

      {/* Segunda fila: clientes + ocupación + cobros comparativa */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Resumen rápido */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Users size={15} className="text-gray-400" /> Resumen general
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-800">{data.clientes.total}</p>
              <p className="text-xs text-gray-500">Clientes</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-800">{data.ventas.total}</p>
              <p className="text-xs text-gray-500">Ventas</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-xl font-bold text-green-700">{data.ventas.completadas}</p>
              <p className="text-xs text-green-600 flex items-center justify-center gap-0.5">
                <CheckCircle size={10} /> Completadas
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-xl font-bold text-gray-500">{data.ventas.canceladas}</p>
              <p className="text-xs text-gray-400">Canceladas</p>
            </div>
          </div>
        </div>

        <CobrosComparativa
          mesActual={data.cobros.mesActual}
          mesAnterior={data.cobros.mesAnterior}
          conteo={data.cobros.mesActualConteo}
          onClick={() => navigate('/cobros-mes')}
        />

        <CuotasResumen
          vencidas={data.cuotas.vencidas}
          pendientes={data.cuotas.pendientes}
          pagadas={data.cuotas.pagadas}
          montoVencido={data.cuotas.montoVencido}
        />
      </div>

      {/* Ocupación de lotes */}
      <LotesBar
        disponibles={data.lotes.disponibles}
        vendidos={data.lotes.vendidos}
        reservados={data.lotes.reservados}
        total={data.lotes.total}
      />

      {/* Comisiones resumen */}
      <ComisionesResumen onClick={() => navigate('/comisiones')} />

      {/* Ventas recientes */}
      <VentasRecientes ventas={data.recientes} />
    </div>
  );
}
