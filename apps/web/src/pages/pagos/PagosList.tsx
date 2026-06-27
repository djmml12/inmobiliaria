import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, Mail, Search, CreditCard, Calendar } from 'lucide-react';
import { useResumenPagos, type Semaforo, type ResumenCliente } from '../../hooks/usePagos';

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function iniciales(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

const SEMAFORO_CONFIG: Record<Semaforo, { card: string; avatar: string; badge: string; divider: string; label: string }> = {
  verde: {
    card: 'bg-green-200 border border-green-400 shadow-green-200',
    avatar: 'bg-green-500 text-white',
    badge: 'bg-green-300 text-green-900 ring-green-500',
    divider: 'border-green-300',
    label: 'Al día',
  },
  amarillo: {
    card: 'bg-yellow-200 border border-yellow-400 shadow-yellow-200',
    avatar: 'bg-yellow-500 text-white',
    badge: 'bg-yellow-300 text-yellow-900 ring-yellow-500',
    divider: 'border-yellow-300',
    label: 'Por vencer',
  },
  rojo: {
    card: 'bg-red-200 border border-red-400 shadow-red-200',
    avatar: 'bg-red-500 text-white',
    badge: 'bg-red-300 text-red-900 ring-red-500',
    divider: 'border-red-300',
    label: 'Vencido',
  },
};

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'rojo', label: 'Vencidos' },
  { key: 'amarillo', label: 'Por vencer' },
  { key: 'verde', label: 'Al día' },
] as const;

type Filtro = (typeof FILTROS)[number]['key'];

function TarjetaCliente({ c, onClick }: { c: ResumenCliente; onClick: () => void }) {
  const cfg = c.semaforo ? SEMAFORO_CONFIG[c.semaforo] : null;

  const cardClass = cfg
    ? `rounded-xl p-4 shadow-sm flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-md ${cfg.card}`
    : 'card flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-md';

  return (
    <div className={cardClass} onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              cfg ? cfg.avatar : 'bg-primary-100 text-primary-700'
            }`}
          >
            {iniciales(c.nombre, c.apellido)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">
              {c.nombre} {c.apellido}
            </p>
            {c.ventas.length > 0 && (
              <p className="text-xs text-gray-500">
                {c.ventas.map((v) => v.proyecto).join(', ')}
              </p>
            )}
          </div>
        </div>

        {cfg ? (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.badge}`}>
            {cfg.label}
          </span>
        ) : (
          <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-400 ring-1 ring-gray-200">
            Sin ventas
          </span>
        )}
      </div>

      {c.proximaCuota && (
        <div className="rounded-lg bg-white/60 px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Cuota #{c.proximaCuota.numero}
              {c.diasHastaProxima !== null && c.diasHastaProxima >= 0
                ? ` · vence en ${c.diasHastaProxima}d`
                : ' · vencida'}
            </span>
            <span className="font-semibold text-gray-800">
              {fmtMonto(c.proximaCuota.monto, c.proximaCuota.moneda)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{fmtFecha(c.proximaCuota.fecha)}</p>
        </div>
      )}

      {c.cuotasVencidas > 1 && (
        <p className="text-xs font-semibold text-red-700">
          {c.cuotasVencidas} cuotas vencidas
        </p>
      )}

      {c.ventas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {c.ventas.map((v) =>
            v.diaPago != null ? (
              <span
                key={v.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200"
              >
                <Calendar size={10} className="text-gray-400" />
                Día {v.diaPago} · Lote {v.lote}
              </span>
            ) : null,
          )}
        </div>
      )}

      <div className={`border-t pt-3 space-y-1.5 text-sm text-gray-600 ${cfg ? cfg.divider : 'border-gray-100'}`}>
        {c.telefono && (
          <div className="flex items-center gap-2">
            <Phone size={13} className="shrink-0 text-gray-400" />
            {c.telefono}
          </div>
        )}
        {c.email && (
          <div className="flex items-center gap-2">
            <Mail size={13} className="shrink-0 text-gray-400" />
            <span className="truncate">{c.email}</span>
          </div>
        )}
        {c.saldoTotal > 0 && c.ventas.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500">Saldo pendiente</span>
            <span className="text-xs font-semibold text-gray-700">
              {fmtMonto(c.saldoTotal, c.ventas[0]?.moneda)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PagosList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filtroInicial = (searchParams.get('filtro') as Filtro | null) ?? 'todos';
  const { data, isLoading, isError } = useResumenPagos();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(
    FILTROS.some((f) => f.key === filtroInicial) ? filtroInicial : 'todos',
  );

  const clientes = (data ?? []).filter((c) => {
    if (filtro !== 'todos' && c.semaforo !== filtro) return false;
    const q = busqueda.toLowerCase();
    if (!q) return true;
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      (c.telefono ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  const conteos = {
    rojo: (data ?? []).filter((c) => c.semaforo === 'rojo').length,
    amarillo: (data ?? []).filter((c) => c.semaforo === 'amarillo').length,
    verde: (data ?? []).filter((c) => c.semaforo === 'verde').length,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        {!isLoading && data && (
          <div className="flex items-center gap-3 text-sm">
            {conteos.rojo > 0 && (
              <span className="flex items-center gap-1.5 font-medium text-red-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                {conteos.rojo} vencido{conteos.rojo !== 1 ? 's' : ''}
              </span>
            )}
            {conteos.amarillo > 0 && (
              <span className="flex items-center gap-1.5 font-medium text-yellow-600">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                {conteos.amarillo} por vencer
              </span>
            )}
            {conteos.verde > 0 && (
              <span className="flex items-center gap-1.5 text-green-600">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                {conteos.verde} al día
              </span>
            )}
          </div>
        )}
      </div>

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                filtro === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
              {f.key !== 'todos' && conteos[f.key as Semaforo] > 0 && (
                <span className="ml-1.5 opacity-75">({conteos[f.key as Semaforo]})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {!isLoading && !isError && (data?.length ?? 0) > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input w-full pl-9"
            placeholder="Buscar por nombre, teléfono o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {isLoading && <div className="card py-12 text-center text-sm text-gray-400">Cargando…</div>}
      {isError && <div className="card py-8 text-center text-sm text-red-500">No se pudo cargar el resumen de pagos.</div>}

      {!isLoading && !isError && data?.length === 0 && (
        <div className="card py-12 text-center">
          <CreditCard size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No hay clientes registrados.</p>
        </div>
      )}

      {!isLoading && !isError && clientes.length === 0 && (busqueda || filtro !== 'todos') && (
        <div className="card py-8 text-center text-sm text-gray-400">
          Sin resultados para el filtro seleccionado.
        </div>
      )}

      {clientes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientes.map((c) => (
            <TarjetaCliente
              key={c.clienteId}
              c={c}
              onClick={() => navigate(`/pagos/${c.clienteId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
