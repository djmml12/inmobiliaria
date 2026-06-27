import { motion } from 'framer-motion';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CobroMensual } from '../../../hooks/useDashboard';

function regresionLineal(data: CobroMensual[]): number[] {
  const n = data.length;
  if (n === 0) return [];
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.cobros);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return ys.map(() => sumY / n);
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return xs.map((x) => Math.max(0, Math.round(m * x + b)));
}

function fmtQ(centavos: number) {
  return `Q ${(centavos / 100).toLocaleString('es-GT', { maximumFractionDigits: 0 })}`;
}

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-900">{fmtQ(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  data: CobroMensual[];
  isLoading?: boolean;
}

export function GraficaVentas({ data, isLoading }: Props) {
  const tendencia = regresionLineal(data);
  const maxCobro = Math.max(...data.map((d) => d.cobros), 1);
  const chartData = data.map((d, i) => ({ ...d, tendencia: tendencia[i] }));

  if (isLoading) {
    return (
      <div className="card h-80 flex flex-col gap-4 animate-pulse">
        <div className="h-5 w-48 rounded-lg bg-gray-200" />
        <div className="flex-1 flex items-end gap-2 px-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-lg bg-gray-200"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="card"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Cobros mensuales</h2>
          <p className="text-sm text-gray-400 mt-0.5">Últimos 12 meses · neto recibido</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Cobros
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-amber-400 inline-block" /> Tendencia
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `Q${(v / 100000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Bar
            dataKey="cobros"
            name="Cobros"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={44}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.cobros === maxCobro ? '#a5b4fc' : 'url(#barGradient)'}
              />
            ))}
          </Bar>
          <Line
            dataKey="tendencia"
            name="Tendencia"
            type="monotone"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={false}
            strokeDasharray="6 4"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
