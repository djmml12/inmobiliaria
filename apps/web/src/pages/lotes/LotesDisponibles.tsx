import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, MapPin } from 'lucide-react';
import { useProyectos, type Proyecto } from '../../hooks/useProyectos';
import { useLotes, type Lote } from '../../hooks/useLotes';
import './LotesDisponibles.css';

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

interface LoteStats {
  disponible: number;
  reservado: number;
  vendido: number;
  total: number;
}

function contarLotes(lotes: Proyecto['lotes']): LoteStats {
  return lotes.reduce(
    (acc, l) => {
      acc.total++;
      if (l.estado === 'DISPONIBLE') acc.disponible++;
      else if (l.estado === 'RESERVADO') acc.reservado++;
      else if (l.estado === 'VENDIDO') acc.vendido++;
      return acc;
    },
    { disponible: 0, reservado: 0, vendido: 0, total: 0 }
  );
}

function ProyectoBloque({
  proyecto,
  lotesDisponibles,
}: {
  proyecto: Proyecto;
  lotesDisponibles: Lote[];
}) {
  const { disponible, reservado, vendido, total } = contarLotes(proyecto.lotes);

  return (
    <div className="ld-proyecto">
      {/* Cabecera */}
      <div className="ld-proyecto-header">
        <div className="ld-proyecto-dot" style={{ backgroundColor: proyecto.color }} />
        <div className="ld-proyecto-info">
          <div className="ld-proyecto-nombre">{proyecto.nombre}</div>
          {proyecto.ubicacion && (
            <div className="ld-proyecto-ubicacion">
              <MapPin size={10} />
              {proyecto.ubicacion}
            </div>
          )}
        </div>
        <span className="ld-proyecto-badge">
          {disponible} disp.
        </span>
      </div>

      {/* Barra de progreso */}
      {total > 0 && (
        <div className="ld-barra-wrap">
          <div className="ld-barra">
            {vendido > 0 && (
              <div
                className="ld-barra-seg"
                style={{ width: `${(vendido / total) * 100}%`, background: '#6366f1' }}
                title={`Vendidos: ${vendido}`}
              />
            )}
            {reservado > 0 && (
              <div
                className="ld-barra-seg"
                style={{ width: `${(reservado / total) * 100}%`, background: '#facc15' }}
                title={`Reservados: ${reservado}`}
              />
            )}
            {disponible > 0 && (
              <div
                className="ld-barra-seg"
                style={{ width: `${(disponible / total) * 100}%`, background: '#4ade80' }}
                title={`Disponibles: ${disponible}`}
              />
            )}
          </div>
          <div className="ld-barra-leyenda">
            <span>
              <i className="ld-barra-dot" style={{ background: '#4ade80' }} />
              {disponible} disp.
            </span>
            {reservado > 0 && (
              <span>
                <i className="ld-barra-dot" style={{ background: '#facc15' }} />
                {reservado} res.
              </span>
            )}
            <span>
              <i className="ld-barra-dot" style={{ background: '#6366f1' }} />
              {vendido} vend.
            </span>
            <span className="ld-barra-total">{total} total</span>
          </div>
        </div>
      )}

      <div className="ld-divider" />

      {/* Grid de lotes disponibles — 2 columnas */}
      {lotesDisponibles.length === 0 ? (
        <div className="ld-empty-lotes">Sin lotes disponibles</div>
      ) : (
        <div className="ld-lotes-grid">
          {lotesDisponibles.map((lote) => (
            <div key={lote.id} className="ld-lote">
              <div className="ld-lote-izq">
                <div className="ld-lote-codigo">Lote {lote.codigo}</div>
                {lote.descripcion && (
                  <div className="ld-lote-desc">{lote.descripcion}</div>
                )}
              </div>
              <div className="ld-lote-der">
                <div className="ld-lote-precio">{fmtMonto(lote.precioBase, lote.moneda)}</div>
                <div className="ld-lote-area">
                  {Number(lote.area).toLocaleString('es-GT')} m²
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="ld-skeleton">
      <div className="ld-sk-header">
        <div className="ld-sk-circle" />
        <div className="ld-sk-line" style={{ flex: 1 }} />
        <div className="ld-sk-line" style={{ width: '4rem' }} />
      </div>
      <div className="ld-sk-barra" />
      <div className="ld-sk-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="ld-sk-lote">
            <div className="ld-sk-lote-l" />
            <div className="ld-sk-lote-r" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LotesDisponibles() {
  const navigate = useNavigate();
  const { data: proyectos, isLoading: loadingProyectos } = useProyectos();
  const { data: todosLotes, isLoading: loadingLotes } = useLotes(undefined, 'DISPONIBLE');

  const lotesPorProyecto = useMemo<Record<string, Lote[]>>(() => {
    if (!todosLotes) return {};
    return todosLotes.reduce<Record<string, Lote[]>>((acc, lote) => {
      (acc[lote.proyectoId] ??= []).push(lote);
      return acc;
    }, {});
  }, [todosLotes]);

  const isLoading = loadingProyectos || loadingLotes;

  return (
    <div className="ld-page">
      {/* Encabezado */}
      <div className="ld-header">
        <button className="ld-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="ld-header-title">Lotes disponibles</h1>
          <p className="ld-header-sub">Disponibilidad por proyecto</p>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="ld-proyectos">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : !proyectos?.length ? (
        <div className="ld-empty">
          <Home size={32} />
          <span>No hay proyectos registrados</span>
        </div>
      ) : (
        <div className="ld-proyectos">
          {proyectos.map((proyecto) => (
            <ProyectoBloque
              key={proyecto.id}
              proyecto={proyecto}
              lotesDisponibles={lotesPorProyecto[proyecto.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
