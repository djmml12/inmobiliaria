import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil, Building2 } from 'lucide-react';
import { useProyectos } from '../../hooks/useProyectos';
import { useAuthStore } from '../../store/auth.store';

// ─── Página ───────────────────────────────────────────────────────────────────

export function ProyectosList() {
  const navigate = useNavigate();
  const { data: proyectos, isLoading, isError } = useProyectos();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  // Si hay un único proyecto, ir directo al plano
  useEffect(() => {
    if (!isLoading && !isError && proyectos?.length === 1) {
      navigate(`/proyectos/${proyectos[0].id}/plano`, { replace: true, state: { proyecto: proyectos[0] } });
    }
  }, [isLoading, isError, proyectos, navigate]);

  if (!isLoading && !isError && proyectos?.length === 1) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          {proyectos && (
            <p className="text-sm text-gray-400 mt-0.5">
              {proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''} registrado{proyectos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="card animate-pulse space-y-3 py-6">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      )}

      {isError && (
        <div className="card py-8 text-center text-sm text-red-500">
          No se pudieron cargar los proyectos.
        </div>
      )}

      {!isLoading && !isError && proyectos?.length === 0 && (
        <div className="card py-16 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm text-gray-500">No hay proyectos registrados.</p>
        </div>
      )}

      {proyectos && proyectos.length > 1 && (
        <div className="flex flex-col gap-2">
          {proyectos.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/proyectos/${p.id}/plano`, { state: { proyecto: p } })}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="h-8 w-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{p.nombre}</p>
                {p.ubicacion && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} /> {p.ubicacion}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {p.activo ? 'Activo' : 'Inactivo'}
              </span>
              {esAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/proyectos/editar', { state: { proyecto: p } }); }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  title="Editar proyecto"
                >
                  <Pencil size={14} />
                </button>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
