import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useCobrosMes, type CobroMes } from '../../hooks/usePagos';

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

const LABEL_MEDIO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA_CREDITO: 'T. Crédito',
  TARJETA_DEBITO: 'T. Débito',
  CHEQUE: 'Cheque',
};

// Cuenta de 0 hasta `value` al montar
function AnimatedMonto({ centavos, moneda = 'GTQ' }: { centavos: number; moneda?: string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) =>
    `${moneda} ${(v / 100).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  );

  useEffect(() => {
    const ctrl = animate(mv, centavos, { duration: 0.8, ease: 'easeOut' });
    return ctrl.stop;
  }, [centavos, mv]);

  return <motion.span>{display}</motion.span>;
}

function AnimatedCuota({ numero }: { numero: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => `#${Math.round(v)}`);

  useEffect(() => {
    const ctrl = animate(mv, numero, { duration: 0.6, ease: 'easeOut' });
    return ctrl.stop;
  }, [numero, mv]);

  return <motion.span>{display}</motion.span>;
}

// Variantes para entrada escalonada
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

function PagoCard({ cobro }: { cobro: CobroMes }) {
  return (
    <motion.div
      className="card flex flex-col gap-2 hover:shadow-lg transition-shadow duration-200"
      variants={cardVariants}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {cobro.cliente.apellido}, {cobro.cliente.nombre}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Lote <span className="font-medium text-gray-700">{cobro.lote}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          <AnimatedCuota numero={cobro.numeroCuota} />
        </span>
      </div>

      <div className="border-t border-gray-100 pt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400">{fmtFecha(cobro.fecha)}</p>
          <p className="text-xs text-gray-400">{LABEL_MEDIO[cobro.medioPago] ?? cobro.medioPago}</p>
        </div>
        <p className="text-base font-bold text-gray-900">
          <AnimatedMonto centavos={cobro.monto} moneda={cobro.moneda} />
        </p>
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return <div className="animate-pulse rounded-xl bg-gray-200 h-28" />;
}

type OrdenFecha = 'desc' | 'asc';
type OrdenCampo = 'fecha' | 'lote';

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary-600 text-white shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

export function CobrosMes() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCobrosMes();
  const [ordenCampo, setOrdenCampo] = useState<OrdenCampo>('fecha');
  const [ordenFecha, setOrdenFecha] = useState<OrdenFecha>('desc');

  const mesActual = new Date().toLocaleDateString('es-GT', { month: 'long', year: 'numeric' });

  const cobrosOrdenados = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      if (ordenCampo === 'lote') {
        return a.lote.localeCompare(b.lote, 'es', { numeric: true });
      }
      const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      return ordenFecha === 'desc' ? -diff : diff;
    });
  }, [data, ordenCampo, ordenFecha]);

  function toggleFecha() {
    setOrdenCampo('fecha');
    setOrdenFecha((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  }

  function handleLote() {
    setOrdenCampo('lote');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobros del mes</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{mesActual}</p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      )}

      {isError && (
        <div className="card py-12 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
          <p className="text-sm text-red-600">No se pudieron cargar los cobros.</p>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="card py-16 text-center">
          <DollarSign size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No hay cobros registrados este mes.</p>
        </div>
      )}

      {data && data.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-gray-500">
              {data.length} cobro{data.length !== 1 ? 's' : ''} registrado{data.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Ordenar por:</span>
              <SortButton active={ordenCampo === 'lote'} onClick={handleLote}>
                <ArrowUpDown size={13} /> Lote
              </SortButton>
              <SortButton active={ordenCampo === 'fecha'} onClick={toggleFecha}>
                {ordenCampo === 'fecha' && ordenFecha === 'desc'
                  ? <ArrowDown size={13} />
                  : <ArrowUp size={13} />}
                Fecha
              </SortButton>
            </div>
          </div>
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={gridVariants}
            initial="hidden"
            animate="visible"
          >
            {cobrosOrdenados.map((cobro) => (
              <PagoCard key={cobro.id} cobro={cobro} />
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
