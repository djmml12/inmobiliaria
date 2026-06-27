import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import {
  useCrearProyecto, useActualizarProyecto,
  type Proyecto, type CreateProyectoData,
} from '../../hooks/useProyectos';
import { useConfiguracion } from '../../hooks/useConfiguracion';
import { useAuthStore } from '../../store/auth.store';

// ─── Colores ──────────────────────────────────────────────────────────────────

const COLORES = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6',
  '#22c55e', '#84cc16', '#eab308', '#f97316',
  '#ef4444', '#f43f5e', '#a855f7', '#ec4899',
];

function SelectorColor({ valor, onChange }: { valor: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {COLORES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${
            valor === c ? 'border-gray-700 scale-125 shadow' : 'border-transparent hover:scale-110'
          }`}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );
}

// ─── Opción de impuesto ───────────────────────────────────────────────────────

interface OpcionImpuestoProps {
  tipo: 'IVA' | 'TIMBRES' | 'EXENTO';
  etiqueta: string;
  subtitulo: string;
  tasaConfigurada: number;
  seleccionado: boolean;
  tasaActual: string;
  onSeleccionar: () => void;
  onCambiarTasa: (v: string) => void;
}

function OpcionImpuesto({
  tipo, etiqueta, subtitulo, tasaConfigurada, seleccionado, tasaActual, onSeleccionar, onCambiarTasa,
}: OpcionImpuestoProps) {
  const esExento = tipo === 'EXENTO';
  const tasaConfig = (tasaConfigurada * 100).toFixed(2);
  const difiere = !esExento && Math.abs(parseFloat(tasaActual) - tasaConfigurada * 100) > 0.001;

  return (
    <div className={`rounded-xl border-2 transition-all ${
      seleccionado ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="p-4 cursor-pointer" onClick={onSeleccionar}>
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${seleccionado ? 'text-primary-700' : 'text-gray-700'}`}>
            {etiqueta}
          </span>
          {!esExento && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              seleccionado ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
            }`}>
              Sistema: {tasaConfig}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-0.5">{subtitulo}</p>
      </div>

      {seleccionado && !esExento && (
        <div className="px-4 pb-4 pt-0 flex items-center gap-3 border-t border-primary-100">
          <span className="text-sm text-gray-500">Tasa para este proyecto:</span>
          <input
            className="input w-24 py-1.5 text-right text-sm"
            type="number" min="0" max="100" step="0.01"
            value={tasaActual}
            onChange={(e) => onCambiarTasa(e.target.value)}
          />
          <span className="text-sm text-gray-500">%</span>
          {difiere && (
            <span
              className="text-sm text-primary-600 hover:underline cursor-pointer ml-1"
              onClick={() => onCambiarTasa(tasaConfig)}
            >
              Usar {tasaConfig}%
            </span>
          )}
        </div>
      )}
      {seleccionado && esExento && (
        <p className="px-4 pb-4 text-sm text-gray-400">Sin impuesto calculado.</p>
      )}
    </div>
  );
}

// ─── Formulario ───────────────────────────────────────────────────────────────

interface FormProyecto {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  tipoImpuesto: 'IVA' | 'TIMBRES' | 'EXENTO';
  tasaPct: string;
  moneda: 'GTQ' | 'USD';
  color: string;
  activo: boolean;
}

function formToDto(form: FormProyecto): CreateProyectoData {
  return {
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim() || undefined,
    ubicacion: form.ubicacion.trim() || undefined,
    tipoImpuesto: form.tipoImpuesto,
    tasaImpuesto: form.tipoImpuesto === 'EXENTO' ? 0 : parseFloat(form.tasaPct) / 100,
    moneda: form.moneda,
    color: form.color,
  };
}

export function NuevoProyecto() {
  const navigate = useNavigate();
  const location = useLocation();
  const proyectoEditar = (location.state as { proyecto?: Proyecto } | null)?.proyecto ?? null;
  const esEdicion = proyectoEditar !== null;

  const { data: config } = useConfiguracion();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdmin = usuario?.rol === 'ADMINISTRADOR';

  const crear = useCrearProyecto();
  const actualizar = useActualizarProyecto();
  const pendiente = crear.isPending || actualizar.isPending;

  const tasaIva = parseFloat(config?.['impuesto.iva.tasa'] ?? '0.12');
  const tasaTimbres = parseFloat(config?.['impuesto.timbres.tasa'] ?? '0.03');

  const [form, setForm] = useState<FormProyecto>({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    tipoImpuesto: 'IVA',
    tasaPct: (tasaIva * 100).toFixed(2),
    moneda: 'GTQ',
    color: COLORES[0],
    activo: true,
  });

  useEffect(() => {
    if (proyectoEditar) {
      const tasa = parseFloat(proyectoEditar.tasaImpuesto);
      setForm({
        nombre: proyectoEditar.nombre,
        descripcion: proyectoEditar.descripcion ?? '',
        ubicacion: proyectoEditar.ubicacion ?? '',
        tipoImpuesto: proyectoEditar.tipoImpuesto,
        tasaPct: proyectoEditar.tipoImpuesto === 'EXENTO' ? '0' : (tasa * 100).toFixed(2),
        moneda: proyectoEditar.moneda,
        color: proyectoEditar.color,
        activo: proyectoEditar.activo,
      });
    } else {
      setForm((f) => ({ ...f, tasaPct: (tasaIva * 100).toFixed(2) }));
    }
  }, [proyectoEditar, tasaIva]);

  const set = (campo: Partial<FormProyecto>) => setForm((f) => ({ ...f, ...campo }));

  function seleccionarTipo(tipo: FormProyecto['tipoImpuesto']) {
    const tasaDefault = tipo === 'IVA' ? tasaIva : tipo === 'TIMBRES' ? tasaTimbres : 0;
    set({ tipoImpuesto: tipo, tasaPct: (tasaDefault * 100).toFixed(2) });
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!esAdmin) return;
    const dto = formToDto(form);
    if (esEdicion && proyectoEditar) {
      await actualizar.mutateAsync({ id: proyectoEditar.id, datos: { ...dto, activo: form.activo } });
    } else {
      await crear.mutateAsync(dto);
    }
    navigate('/proyectos');
  }

  const error = (crear.error ?? actualizar.error) as { response?: { data?: { message?: string } } } | null;
  const mensajeError = error?.response?.data?.message ?? (error ? 'Ocurrió un error' : null);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/proyectos')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {esEdicion ? `Editar: ${proyectoEditar!.nombre}` : 'Nuevo proyecto'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {esEdicion ? 'Modifica los datos del proyecto' : 'Ingresa los datos para registrar el proyecto'}
          </p>
        </div>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-5">
        {/* Datos generales */}
        <section className="card space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Datos generales</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del proyecto *</label>
            <input
              className="input w-full"
              required
              value={form.nombre}
              onChange={(e) => set({ nombre: e.target.value })}
              placeholder="Residencial Las Flores"
              disabled={!esAdmin}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input
                className="input w-full"
                value={form.ubicacion}
                onChange={(e) => set({ ubicacion: e.target.value })}
                placeholder="Ciudad de Guatemala"
                disabled={!esAdmin}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select
                className="input w-full"
                value={form.moneda}
                onChange={(e) => set({ moneda: e.target.value as 'GTQ' | 'USD' })}
                disabled={!esAdmin}
              >
                <option value="GTQ">Quetzales (GTQ)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              value={form.descripcion}
              onChange={(e) => set({ descripcion: e.target.value })}
              placeholder="Descripción opcional del proyecto"
              disabled={!esAdmin}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color del proyecto</label>
            <SelectorColor valor={form.color} onChange={(c) => set({ color: c })} />
            <div className="mt-3 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: form.color }} />
              <span className="text-sm text-gray-500">Vista previa del color seleccionado</span>
            </div>
          </div>
        </section>

        {/* Impuesto */}
        <section className="card space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tipo de impuesto</p>
          <div className="space-y-3">
            <OpcionImpuesto
              tipo="IVA"
              etiqueta="IVA — 12%"
              subtitulo="Primera venta de inmueble"
              tasaConfigurada={tasaIva}
              seleccionado={form.tipoImpuesto === 'IVA'}
              tasaActual={form.tipoImpuesto === 'IVA' ? form.tasaPct : (tasaIva * 100).toFixed(2)}
              onSeleccionar={() => seleccionarTipo('IVA')}
              onCambiarTasa={(v) => set({ tasaPct: v })}
            />
            <OpcionImpuesto
              tipo="TIMBRES"
              etiqueta="Timbres fiscales — 3%"
              subtitulo="Traspaso o reventa de inmueble"
              tasaConfigurada={tasaTimbres}
              seleccionado={form.tipoImpuesto === 'TIMBRES'}
              tasaActual={form.tipoImpuesto === 'TIMBRES' ? form.tasaPct : (tasaTimbres * 100).toFixed(2)}
              onSeleccionar={() => seleccionarTipo('TIMBRES')}
              onCambiarTasa={(v) => set({ tasaPct: v })}
            />
            <OpcionImpuesto
              tipo="EXENTO"
              etiqueta="Exento"
              subtitulo="Sin impuesto aplicable"
              tasaConfigurada={0}
              seleccionado={form.tipoImpuesto === 'EXENTO'}
              tasaActual="0"
              onSeleccionar={() => seleccionarTipo('EXENTO')}
              onCambiarTasa={() => {}}
            />
          </div>
        </section>

        {/* Estado (solo edición) */}
        {esEdicion && esAdmin && (
          <section className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">Estado del proyecto</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set({ activo: true })}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  form.activo
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Activo
              </button>
              <button
                type="button"
                onClick={() => set({ activo: false })}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  !form.activo
                    ? 'border-gray-500 bg-gray-50 text-gray-700'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                Inactivo
              </button>
            </div>
          </section>
        )}

        {mensajeError && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {mensajeError}
          </p>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => navigate('/proyectos')}
            disabled={pendiente}
          >
            Cancelar
          </button>
          {esAdmin && (
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={pendiente}
            >
              {esEdicion ? <Save size={14} /> : <Plus size={14} />}
              {pendiente ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
