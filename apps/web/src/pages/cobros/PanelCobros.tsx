import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, CreditCard, AlertCircle, CheckCircle2, Wallet, Percent } from 'lucide-react';
import { useCobrosMensuales, useDashboard } from '../../hooks/useDashboard';
import { GraficaVentas } from './components/GraficaVentas';

// ─── Contador animado ────────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 1.4) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    from.current = display;
    start.current = null;
    const animate = (ts: number) => {
      if (!start.current) start.current = ts;
      const elapsed = (ts - start.current) / (duration * 1000);
      const t = Math.min(elapsed, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from.current + (target - from.current) * ease));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return display;
}

function fmtQ(centavos: number) {
  return (centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 });
}

// ─── Tarjeta KPI animada ─────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  sub?: string;
  trend?: number | null;
  icon: React.ReactNode;
  iconBg: string;
  delay?: number;
  isMoney?: boolean;
}

function KpiCard({ label, value, prefix = '', suffix = '', sub, trend, icon, iconBg, delay = 0, isMoney = false }: KpiCardProps) {
  const animated = useAnimatedNumber(value, 1.2);
  const display = isMoney ? fmtQ(animated) : animated.toLocaleString('es-GT');

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="card flex items-start gap-4"
    >
      <div className={`rounded-xl p-2.5 shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900 leading-none">
          {prefix}{display}{suffix}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        {trend !== null && trend !== undefined && (
          <div className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend).toFixed(1)}% vs mes anterior
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Barra de distribución ───────────────────────────────────────────────────

function DistribucionCuotas({ pagadas, pendientes, vencidas }: {
  pagadas: number; pendientes: number; vencidas: number;
}) {
  const total = pagadas + pendientes + vencidas;
  const pPag = total > 0 ? (pagadas / total) * 100 : 0;
  const pPen = total > 0 ? (pendientes / total) * 100 : 0;
  const pVen = total > 0 ? (vencidas / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
      className="card"
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <CheckCircle2 size={15} className="text-emerald-500" />
        Distribución de cuotas
      </h3>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 gap-0.5 mb-4">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pPag}%` }}
          transition={{ duration: 0.7, delay: 0.65, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-gray-300 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pPen}%` }}
          transition={{ duration: 0.7, delay: 0.7, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-red-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pVen}%` }}
          transition={{ duration: 0.7, delay: 0.75, ease: 'easeOut' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Pagadas', value: pagadas, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Pendientes', value: pendientes, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: 'Vencidas', value: vencidas, color: vencidas > 0 ? 'text-red-700' : 'text-gray-400', bg: vencidas > 0 ? 'bg-red-50' : 'bg-gray-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl ${bg} py-3`}>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Panel cobros ────────────────────────────────────────────────────────────

export function PanelCobros() {
  const navigate = useNavigate();
  const { data: cobros = [], isLoading: loadingCobros } = useCobrosMensuales(12);
  const { data, isLoading: loadingDash } = useDashboard();

  const isLoading = loadingCobros || loadingDash;

  const mesActual = data?.cobros.mesActual ?? 0;
  const mesAnterior = data?.cobros.mesAnterior ?? 0;
  const tendencia = mesAnterior > 0
    ? ((mesActual - mesAnterior) / mesAnterior) * 100
    : null;

  const totalCobradoAnio = cobros.reduce((s, m) => s + m.cobros, 0);
  const mejorMes = cobros.reduce((best, m) => (m.cobros > best.cobros ? m : best), cobros[0] ?? { cobros: 0, label: '—' });

  // Salud de la cartera financiada
  const totalAFinanciar = data?.cuotas.totalAFinanciar ?? 0;
  const totalRecaudado = data?.cuotas.totalRecaudado ?? 0;
  const saldoPorCobrar = data?.cuotas.saldoPorCobrar ?? 0;
  const pctRecuperado = totalAFinanciar > 0 ? (totalRecaudado / totalAFinanciar) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de cobros</h1>
          <p className="text-sm text-gray-500 mt-0.5">Estado financiero del período</p>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Saldo por cobrar"
          value={saldoPorCobrar}
          prefix="Q "
          isMoney
          sub="Cartera financiada pendiente"
          icon={<Wallet size={18} className="text-violet-600" />}
          iconBg="bg-violet-100"
          delay={0.05}
        />
        <KpiCard
          label="Recuperado de cartera"
          value={Math.round(pctRecuperado)}
          suffix="%"
          sub={`Q ${fmtQ(totalRecaudado)} de Q ${fmtQ(totalAFinanciar)}`}
          icon={<Percent size={18} className="text-amber-600" />}
          iconBg="bg-amber-100"
          delay={0.1}
        />
        <KpiCard
          label="Cobros este mes"
          value={mesActual}
          prefix="Q "
          isMoney
          trend={tendencia}
          icon={<DollarSign size={18} className="text-indigo-600" />}
          iconBg="bg-indigo-100"
          delay={0.15}
        />
        <KpiCard
          label="Total cobrado (12m)"
          value={totalCobradoAnio}
          prefix="Q "
          isMoney
          sub="Neto recibido acumulado"
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-100"
          delay={0.2}
        />
        <KpiCard
          label="Pagos este mes"
          value={data?.cobros.mesActualConteo ?? 0}
          suffix=" pagos"
          sub="Transacciones registradas"
          icon={<CreditCard size={18} className="text-sky-600" />}
          iconBg="bg-sky-100"
          delay={0.3}
        />
        <KpiCard
          label="Cuotas vencidas"
          value={data?.cuotas.vencidas ?? 0}
          sub={data && data.cuotas.vencidas > 0 ? `Q ${fmtQ(data.cuotas.montoVencido)} pendiente` : 'Al día'}
          icon={<AlertCircle size={18} className={data && data.cuotas.vencidas > 0 ? 'text-red-600' : 'text-gray-400'} />}
          iconBg={data && data.cuotas.vencidas > 0 ? 'bg-red-100' : 'bg-gray-100'}
          delay={0.4}
        />
      </div>

      {/* Gráfica */}
      <GraficaVentas data={cobros} isLoading={isLoading} />

      {/* Fila inferior */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistribucionCuotas
          pagadas={data?.cuotas.pagadas ?? 0}
          pendientes={data?.cuotas.pendientes ?? 0}
          vencidas={data?.cuotas.vencidas ?? 0}
        />

        {/* Mejor mes */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease: 'easeOut' }}
          className="card"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-amber-500" />
            Mejor mes del período
          </h3>
          <div className="flex items-end gap-4">
            <div>
              <p className="text-4xl font-bold text-amber-500">{mejorMes?.label ?? '—'}</p>
              <p className="text-sm text-gray-400 mt-1">Mes con mayor recaudación</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">Q {fmtQ(mejorMes?.cobros ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">neto recibido</p>
            </div>
          </div>

          {cobros.length > 0 && (
            <div className="mt-5 space-y-2">
              {[...cobros]
                .sort((a, b) => b.cobros - a.cobros)
                .slice(0, 3)
                .map((m, i) => (
                  <div key={m.mes} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm text-gray-600">{m.label}</span>
                      <span className="text-sm font-semibold text-gray-900">Q {fmtQ(m.cobros)}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
