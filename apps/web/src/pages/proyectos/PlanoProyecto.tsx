import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Pencil, X } from 'lucide-react';
import { useLotes, useActualizarLote, type Lote } from '../../hooks/useLotes';
import type { Proyecto } from '../../hooks/useProyectos';
import { useAuthStore } from '../../store/auth.store';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

// ─── Generador aleatorio con semilla (FNV-1a) ─────────────────────────────────

function mkRng(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return () => {
    h ^= h >>> 16;
    h = Math.imul(h, 2246822519) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 3266489917) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
}

// ─── Tipos del layout ─────────────────────────────────────────────────────────

interface LotRect {
  lote: Lote;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Road {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  horizontal: boolean;
}

interface Layout {
  terrenoPoints: string;    // SVG polygon points del contorno
  rects: LotRect[];
  roads: Road[];
  entradaX: number;
}

// ─── Generación del layout (seeded) ──────────────────────────────────────────

const SVG_W = 920;
const SVG_H = 500;
const MARGIN = 52;

function generarLayout(proyectoId: string, lotes: Lote[]): Layout {
  const rng = mkRng(proyectoId);
  const n = lotes.length;

  // Área útil
  const ax = MARGIN;
  const ay = MARGIN;
  const aw = SVG_W - 2 * MARGIN;
  const ah = SVG_H - 2 * MARGIN;

  // Contorno del terreno: rectángulo con esquinas irregulares
  const jit = () => (rng() - 0.5) * 36;
  const pts = [
    [ax + jit(), ay + jit()],
    [ax + aw + jit(), ay + jit()],
    [ax + aw + jit(), ay + ah + jit()],
    [ax + jit(), ay + ah + jit()],
  ];
  const terrenoPoints = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Elegir modo de layout según semilla
  const modeSeed = rng();
  const roads: Road[] = [];
  const rects: LotRect[] = [];
  const LOT_PAD = 6;
  const ROAD_W = 24;

  if (modeSeed < 0.38 || n <= 3) {
    // ─── MODO A: una calle horizontal central ─────────────────────────────
    const roadY = ay + ah * (0.40 + rng() * 0.20);
    roads.push({ x: ax, y: roadY, w: aw, h: ROAD_W, label: 'CALLE PRINCIPAL', horizontal: true });

    const topH = roadY - ay;
    const botH = ay + ah - (roadY + ROAD_W);
    const topCount = Math.ceil(n / 2);

    const placeSingle = (
      items: Lote[],
      zoneX: number, zoneY: number, zoneW: number, zoneH: number,
    ) => {
      const count = items.length;
      if (count === 0) return;
      const cols = Math.min(count, Math.max(1, Math.round(Math.sqrt(count * (zoneW / zoneH)))));
      const rows = Math.ceil(count / cols);
      const lw = (zoneW - (cols + 1) * LOT_PAD) / cols;
      const lh = (zoneH - (rows + 1) * LOT_PAD) / rows;
      items.forEach((lote, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const sv = (rng() - 0.5) * 10;
        rects.push({
          lote,
          x: zoneX + LOT_PAD + col * (lw + LOT_PAD),
          y: zoneY + LOT_PAD + row * (lh + LOT_PAD),
          w: Math.max(40, lw + sv),
          h: Math.max(30, lh),
        });
      });
    };

    placeSingle(lotes.slice(0, topCount), ax, ay, aw, topH);
    placeSingle(lotes.slice(topCount), ax, roadY + ROAD_W, aw, botH);

  } else if (modeSeed < 0.72) {
    // ─── MODO B: calle horizontal + avenida vertical ──────────────────────
    const roadY = ay + ah * (0.40 + rng() * 0.20);
    const roadX = ax + aw * (0.40 + rng() * 0.20);
    roads.push({ x: ax, y: roadY, w: aw, h: ROAD_W, label: 'CALLE PRINCIPAL', horizontal: true });
    roads.push({ x: roadX, y: ay, w: ROAD_W, h: ah, label: 'AV. CENTRAL', horizontal: false });

    // 4 cuadrantes
    const quads = [
      { x: ax, y: ay, w: roadX - ax, h: roadY - ay },
      { x: roadX + ROAD_W, y: ay, w: ax + aw - roadX - ROAD_W, h: roadY - ay },
      { x: ax, y: roadY + ROAD_W, w: roadX - ax, h: ay + ah - roadY - ROAD_W },
      { x: roadX + ROAD_W, y: roadY + ROAD_W, w: ax + aw - roadX - ROAD_W, h: ay + ah - roadY - ROAD_W },
    ];

    const counts = distribuirEnCuadrantes(n, 4);
    let idx = 0;
    quads.forEach((q, qi) => {
      const cnt = counts[qi];
      const cols = Math.max(1, Math.ceil(Math.sqrt(cnt)));
      const rows = Math.ceil(cnt / cols);
      const lw = (q.w - (cols + 1) * LOT_PAD) / cols;
      const lh = (q.h - (rows + 1) * LOT_PAD) / rows;
      for (let i = 0; i < cnt && idx < lotes.length; i++, idx++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const sv = (rng() - 0.5) * 8;
        rects.push({
          lote: lotes[idx],
          x: q.x + LOT_PAD + col * (lw + LOT_PAD),
          y: q.y + LOT_PAD + row * (lh + LOT_PAD),
          w: Math.max(38, lw + sv),
          h: Math.max(28, lh),
        });
      }
    });

  } else {
    // ─── MODO C: dos calles horizontales, 3 franjas ───────────────────────
    const road1Y = ay + ah * (0.30 + rng() * 0.10);
    const road2Y = ay + ah * (0.62 + rng() * 0.10);
    roads.push({ x: ax, y: road1Y, w: aw, h: ROAD_W, label: 'CALLE PRIMERA', horizontal: true });
    roads.push({ x: ax, y: road2Y, w: aw, h: ROAD_W, label: 'CALLE SEGUNDA', horizontal: true });

    const zonas = [
      { y: ay, h: road1Y - ay },
      { y: road1Y + ROAD_W, h: road2Y - road1Y - ROAD_W },
      { y: road2Y + ROAD_W, h: ay + ah - road2Y - ROAD_W },
    ];

    const counts = distribuirEnCuadrantes(n, 3);
    let idx = 0;
    zonas.forEach((z, zi) => {
      const cnt = counts[zi];
      if (cnt === 0) return;
      const cols = Math.min(cnt, Math.max(1, Math.round(Math.sqrt(cnt * (aw / z.h)))));
      const rows = Math.ceil(cnt / cols);
      const lw = (aw - (cols + 1) * LOT_PAD) / cols;
      const lh = (z.h - (rows + 1) * LOT_PAD) / rows;
      for (let i = 0; i < cnt && idx < lotes.length; i++, idx++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const sv = (rng() - 0.5) * 10;
        rects.push({
          lote: lotes[idx],
          x: ax + LOT_PAD + col * (lw + LOT_PAD),
          y: z.y + LOT_PAD + row * (lh + LOT_PAD),
          w: Math.max(40, lw + sv),
          h: Math.max(28, lh),
        });
      }
    });
  }

  return {
    terrenoPoints,
    rects,
    roads,
    entradaX: ax + aw * (0.35 + rng() * 0.3),
  };
}

function distribuirEnCuadrantes(n: number, k: number): number[] {
  const base = Math.floor(n / k);
  const rem = n % k;
  return Array.from({ length: k }, (_, i) => base + (i < rem ? 1 : 0));
}

// ─── SVG del plano ────────────────────────────────────────────────────────────

function colorLote(estado: string) {
  if (estado === 'VENDIDO') return { fill: '#4ade80', stroke: '#16a34a', text: '#14532d' };
  if (estado === 'RESERVADO') return { fill: '#fef08a', stroke: '#ca8a04', text: '#713f12' };
  if (estado === 'BLOQUEADO') return { fill: '#fca5a5', stroke: '#dc2626', text: '#7f1d1d' };
  return { fill: '#f1f5f9', stroke: '#94a3b8', text: '#374151' }; // DISPONIBLE
}

function NorthArrow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r={18} fill="white" stroke="#64748b" strokeWidth={1} />
      <polygon points="0,-14 4,4 0,0 -4,4" fill="#1e293b" />
      <polygon points="0,14 4,-4 0,0 -4,-4" fill="#94a3b8" />
      <text y={-18} textAnchor="middle" fontSize={9} fontWeight="700" fill="#1e293b">N</text>
    </g>
  );
}

function PlanoSVG({ layout, proyecto }: { layout: Layout; proyecto: Proyecto }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-auto rounded-xl border border-gray-200 shadow-sm bg-slate-100"
      style={{ maxHeight: 520, fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Fondo exterior */}
      <rect width={SVG_W} height={SVG_H} fill="#e2e8f0" />

      {/* Terreno (hierba) */}
      <polygon points={layout.terrenoPoints} fill="#dcfce7" stroke="#166534" strokeWidth={2.5} />

      {/* Calles */}
      {layout.roads.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#cbd5e1" />
          {/* Línea central punteada */}
          {r.horizontal ? (
            <line
              x1={r.x + 4} y1={r.y + r.h / 2} x2={r.x + r.w - 4} y2={r.y + r.h / 2}
              stroke="white" strokeWidth={1.5} strokeDasharray="16,10"
            />
          ) : (
            <line
              x1={r.x + r.w / 2} y1={r.y + 4} x2={r.x + r.w / 2} y2={r.y + r.h - 4}
              stroke="white" strokeWidth={1.5} strokeDasharray="16,10"
            />
          )}
          {/* Nombre de calle */}
          {r.horizontal ? (
            <text
              x={r.x + r.w / 2} y={r.y + r.h / 2 + 4}
              textAnchor="middle" fontSize={8} fill="#475569" fontWeight="600" letterSpacing={1.5}
            >
              {r.label}
            </text>
          ) : (
            <text
              x={r.x + r.w / 2} y={r.y + r.h / 2}
              textAnchor="middle" fontSize={8} fill="#475569" fontWeight="600" letterSpacing={1.5}
              transform={`rotate(-90, ${r.x + r.w / 2}, ${r.y + r.h / 2})`}
            >
              {r.label}
            </text>
          )}
        </g>
      ))}

      {/* Lotes */}
      {layout.rects.map(({ lote, x, y, w, h }) => {
        const c = colorLote(lote.estado);
        const isHov = hovered === lote.id;
        const fontSize = Math.min(11, Math.max(7, w / 6));
        const subFontSize = Math.max(6, fontSize - 2);
        return (
          <g
            key={lote.id}
            onMouseEnter={() => setHovered(lote.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={x} y={y} width={w} height={h}
              fill={isHov ? (lote.estado === 'VENDIDO' ? '#86efac' : '#e2e8f0') : c.fill}
              stroke={c.stroke}
              strokeWidth={isHov ? 2 : 1.5}
              rx={2}
            />
            {/* Código del lote */}
            <text
              x={x + w / 2} y={y + h / 2 - (h > 45 ? 6 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight="700"
              fill={c.text}
            >
              {lote.codigo}
            </text>
            {/* Área (solo si hay espacio) */}
            {h > 45 && (
              <text
                x={x + w / 2} y={y + h / 2 + fontSize + 1}
                textAnchor="middle"
                fontSize={subFontSize}
                fill={c.text}
                opacity={0.8}
              >
                {parseFloat(lote.area).toFixed(0)} m²
              </text>
            )}
          </g>
        );
      })}

      {/* Entrada principal */}
      <g transform={`translate(${layout.entradaX}, ${SVG_H - MARGIN + 16})`}>
        <rect x={-40} y={-10} width={80} height={18} fill="#1e293b" rx={3} />
        <text textAnchor="middle" y={3} fontSize={8} fill="white" fontWeight="700" letterSpacing={1.5}>
          ENTRADA
        </text>
      </g>

      {/* Brújula */}
      <NorthArrow x={SVG_W - MARGIN + 14} y={MARGIN - 14} />

      {/* Nombre del proyecto */}
      <text x={MARGIN} y={MARGIN - 18} fontSize={12} fontWeight="700" fill="#1e293b">
        {proyecto.nombre}
      </text>

      {/* Escala */}
      <g transform={`translate(${SVG_W - MARGIN - 80}, ${SVG_H - 18})`}>
        <line x1={0} y1={0} x2={60} y2={0} stroke="#475569" strokeWidth={1.5} />
        <line x1={0} y1={-4} x2={0} y2={4} stroke="#475569" strokeWidth={1.5} />
        <line x1={60} y1={-4} x2={60} y2={4} stroke="#475569" strokeWidth={1.5} />
        <text x={30} y={-5} textAnchor="middle" fontSize={7} fill="#64748b">ESCALA REFERENCIAL</text>
      </g>

      {/* Leyenda */}
      <g transform={`translate(${MARGIN}, ${SVG_H - 18})`}>
        <rect x={0} y={-8} width={12} height={10} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1} rx={1} />
        <text x={16} y={0} fontSize={8} fill="#475569">Disponible</text>
        <rect x={62} y={-8} width={12} height={10} fill="#4ade80" stroke="#16a34a" strokeWidth={1} rx={1} />
        <text x={78} y={0} fontSize={8} fill="#475569">Vendido</text>
        <rect x={118} y={-8} width={12} height={10} fill="#fef08a" stroke="#ca8a04" strokeWidth={1} rx={1} />
        <text x={134} y={0} fontSize={8} fill="#475569">Reservado</text>
      </g>
    </svg>
  );
}

// ─── Lista de lotes ───────────────────────────────────────────────────────────

const BADGE: Record<string, string> = {
  DISPONIBLE: 'bg-green-100 text-green-700',
  RESERVADO: 'bg-yellow-100 text-yellow-700',
  VENDIDO: 'bg-gray-100 text-gray-500',
  BLOQUEADO: 'bg-red-100 text-red-600',
};

// ─── Modal de edición ─────────────────────────────────────────────────────────

interface FormLote {
  codigo: string;
  area: string;
  precioBase: string; // en quetzales/dólares, para la UI
  moneda: 'GTQ' | 'USD';
  estado: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'BLOQUEADO';
  descripcion: string;
}

function ModalEditarLote({
  lote,
  proyectoId,
  onCerrar,
}: {
  lote: Lote;
  proyectoId: string;
  onCerrar: () => void;
}) {
  const actualizar = useActualizarLote(proyectoId);

  const [form, setForm] = useState<FormLote>({
    codigo: lote.codigo,
    area: parseFloat(lote.area).toString(),
    precioBase: (lote.precioBase / 100).toFixed(2),
    moneda: lote.moneda,
    estado: lote.estado,
    descripcion: lote.descripcion ?? '',
  });

  const set = (campo: Partial<FormLote>) => setForm((f) => ({ ...f, ...campo }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    await actualizar.mutateAsync({
      id: lote.id,
      datos: {
        codigo: form.codigo.trim(),
        area: parseFloat(form.area),
        precioBase: Math.round(parseFloat(form.precioBase) * 100),
        moneda: form.moneda,
        estado: form.estado,
        descripcion: form.descripcion.trim() || undefined,
      },
    });
    onCerrar();
  }

  const error = actualizar.error as { response?: { data?: { message?: string } } } | null;
  const mensajeError = error?.response?.data?.message ?? (error ? 'Ocurrió un error' : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Editar lote {lote.codigo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={enviar} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                className="input w-full font-mono"
                required
                value={form.codigo}
                onChange={(e) => set({ codigo: e.target.value })}
                placeholder="L-01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área (m²) *</label>
              <input
                className="input w-full"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.area}
                onChange={(e) => set({ area: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio base *</label>
              <input
                className="input w-full"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.precioBase}
                onChange={(e) => set({ precioBase: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select
                className="input w-full"
                value={form.moneda}
                onChange={(e) => set({ moneda: e.target.value as 'GTQ' | 'USD' })}
              >
                <option value="GTQ">GTQ</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              className="input w-full"
              value={form.estado}
              onChange={(e) => set({ estado: e.target.value as FormLote['estado'] })}
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="RESERVADO">Reservado</option>
              <option value="VENDIDO">Vendido</option>
              <option value="BLOQUEADO">Bloqueado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              value={form.descripcion}
              onChange={(e) => set({ descripcion: e.target.value })}
              placeholder="Descripción opcional"
            />
          </div>

          {mensajeError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {mensajeError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={onCerrar}
              disabled={actualizar.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={actualizar.isPending}
            >
              {actualizar.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FilaLote({
  lote,
  moneda,
  puedeEditar,
  onEditar,
}: {
  lote: Lote;
  moneda: string;
  puedeEditar: boolean;
  onEditar: (lote: Lote) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-2.5 px-4 hover:bg-gray-50 transition-colors">
      <span className="w-20 shrink-0 font-mono text-sm font-semibold text-gray-800">{lote.codigo}</span>
      <span className="w-20 shrink-0 text-sm text-gray-500">{parseFloat(lote.area).toFixed(0)} m²</span>
      <span className="flex-1 text-sm text-gray-700">{fmtMonto(lote.precioBase, moneda)}</span>
      {lote.descripcion && (
        <span className="hidden md:block text-xs text-gray-400 truncate max-w-xs">{lote.descripcion}</span>
      )}
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[lote.estado]}`}>
        {lote.estado}
      </span>
      {puedeEditar && (
        <button
          type="button"
          onClick={() => onEditar(lote)}
          className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="Editar lote"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function PlanoProyecto() {
  const navigate = useNavigate();
  const location = useLocation();
  const proyecto = (location.state as { proyecto?: Proyecto } | null)?.proyecto;
  const usuario = useAuthStore((s) => s.usuario);
  const puedeEditar = usuario?.rol === 'ADMINISTRADOR';

  const [loteEditando, setLoteEditando] = useState<Lote | null>(null);

  const { data: lotes, isLoading } = useLotes(proyecto?.id);

  const layout = useMemo(() => {
    if (!proyecto || !lotes || lotes.length === 0) return null;
    return generarLayout(proyecto.id, lotes);
  }, [proyecto?.id, lotes]);

  if (!proyecto) {
    return (
      <div className="card py-16 text-center">
        <p className="text-sm text-gray-400">Proyecto no encontrado.</p>
        <button className="btn-secondary mt-4 text-sm" onClick={() => navigate('/proyectos')}>
          Volver a proyectos
        </button>
      </div>
    );
  }

  const noVendidos = lotes?.filter((l) => l.estado !== 'VENDIDO') ?? [];
  const vendidos = lotes?.filter((l) => l.estado === 'VENDIDO') ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Modal edición de lote */}
      {loteEditando && proyecto && (
        <ModalEditarLote
          lote={loteEditando}
          proyectoId={proyecto.id}
          onCerrar={() => setLoteEditando(null)}
        />
      )}

      {/* Encabezado */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/proyectos')}
          className="mt-0.5 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proyecto.color }} />
            <h1 className="text-xl font-bold text-gray-900">{proyecto.nombre}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              proyecto.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {proyecto.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {proyecto.ubicacion && (
            <p className="mt-0.5 text-sm text-gray-400 flex items-center gap-1">
              <MapPin size={13} /> {proyecto.ubicacion}
            </p>
          )}
        </div>

        {/* Resumen rápido */}
        {lotes && (
          <div className="ml-auto flex gap-3 shrink-0">
            {[
              { label: 'Disponibles', count: lotes.filter(l => l.estado === 'DISPONIBLE').length, cls: 'text-green-700 bg-green-50' },
              { label: 'Reservados', count: lotes.filter(l => l.estado === 'RESERVADO').length, cls: 'text-yellow-700 bg-yellow-50' },
              { label: 'Vendidos', count: lotes.filter(l => l.estado === 'VENDIDO').length, cls: 'text-gray-600 bg-gray-100' },
            ].map(({ label, count, cls }) => count > 0 && (
              <div key={label} className={`rounded-lg px-3 py-1.5 text-center ${cls}`}>
                <p className="text-lg font-bold leading-none">{count}</p>
                <p className="text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plano SVG */}
      {isLoading && (
        <div className="card py-20 text-center animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2" />
          <div className="h-3 bg-gray-100 rounded w-32 mx-auto" />
        </div>
      )}

      {!isLoading && lotes?.length === 0 && (
        <div className="card py-12 text-center">
          <p className="text-sm text-gray-400">Este proyecto no tiene lotes registrados.</p>
        </div>
      )}

      {layout && proyecto && (
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Vista en planta — distribución referencial
          </p>
          <PlanoSVG layout={layout} proyecto={proyecto} />
        </div>
      )}

      {/* Lista de lotes */}
      {lotes && lotes.length > 0 && (
        <div className="flex flex-col gap-4">
          {/* No vendidos */}
          {noVendidos.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Lotes disponibles
                </h2>
                <span className="text-xs text-gray-400">{noVendidos.length} lote{noVendidos.length !== 1 ? 's' : ''}</span>
              </div>
              {/* Header tabla */}
              <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span className="w-20 shrink-0">Código</span>
                <span className="w-20 shrink-0">Área</span>
                <span className="flex-1">Precio base</span>
                <span className="shrink-0 pr-1">Estado</span>
              </div>
              <div className="divide-y divide-gray-100">
                {noVendidos
                  .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true }))
                  .map((l) => (
                    <FilaLote key={l.id} lote={l} moneda={proyecto.moneda} puedeEditar={puedeEditar} onEditar={setLoteEditando} />
                  ))}
              </div>
            </div>
          )}

          {/* Vendidos */}
          {vendidos.length > 0 && (
            <div className="card overflow-hidden p-0">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-500">
                  Lotes vendidos
                </h2>
                <span className="text-xs text-gray-400">{vendidos.length} lote{vendidos.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <span className="w-20 shrink-0">Código</span>
                <span className="w-20 shrink-0">Área</span>
                <span className="flex-1">Precio base</span>
                <span className="shrink-0 pr-1">Estado</span>
              </div>
              <div className="divide-y divide-gray-100 opacity-70">
                {vendidos
                  .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true }))
                  .map((l) => (
                    <FilaLote key={l.id} lote={l} moneda={proyecto.moneda} puedeEditar={puedeEditar} onEditar={setLoteEditando} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
