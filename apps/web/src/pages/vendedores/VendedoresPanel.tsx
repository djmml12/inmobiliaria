import { useState } from 'react';
import { UserCheck, Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useVendedores, useCrearVendedor, useActualizarVendedor, useEliminarVendedor,
  type Vendedor, type VendedorData,
} from '../../hooks/useVendedores';

function pctStr(fraccion: string | number) {
  return (parseFloat(String(fraccion)) * 100).toFixed(2);
}

const FORM_VACIO: VendedorData = {
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  cui: '',
  fechaNacimiento: '',
  domicilio: '',
  comisionPct: 0,
};

interface FormState extends VendedorData {
  comisionPctStr: string;
}

function formDesdeVendedor(v: Vendedor): FormState {
  return {
    nombre: v.nombre,
    apellido: v.apellido,
    telefono: v.telefono ?? '',
    email: v.email ?? '',
    cui: v.cui ?? '',
    fechaNacimiento: v.fechaNacimiento ? v.fechaNacimiento.slice(0, 10) : '',
    domicilio: v.domicilio ?? '',
    comisionPct: parseFloat(v.comisionPct),
    comisionPctStr: pctStr(v.comisionPct),
  };
}

const FORM_INICIAL: FormState = { ...FORM_VACIO, comisionPctStr: '0' };

function FilaVendedor({
  vendedor,
  onEditar,
  onToggleActivo,
  onEliminar,
}: {
  vendedor: Vendedor;
  onEditar: () => void;
  onToggleActivo: () => void;
  onEliminar: () => void;
}) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">
          {vendedor.apellido}, {vendedor.nombre}
        </p>
        {vendedor.cui && (
          <p className="text-xs text-gray-500 mt-0.5">CUI: {vendedor.cui}</p>
        )}
        {(vendedor.telefono || vendedor.email) && (
          <p className="text-xs text-gray-400 mt-0.5">
            {[vendedor.telefono, vendedor.email].filter(Boolean).join(' · ')}
          </p>
        )}
        {vendedor.domicilio && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{vendedor.domicilio}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono">
        {pctStr(vendedor.comisionPct)}%
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={onToggleActivo}
          title={vendedor.activo ? 'Desactivar' : 'Activar'}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors"
          style={vendedor.activo
            ? { background: '#dcfce7', color: '#166534' }
            : { background: '#f3f4f6', color: '#6b7280' }}
        >
          {vendedor.activo
            ? <><ToggleRight size={13} /> Activo</>
            : <><ToggleLeft size={13} /> Inactivo</>}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEditar}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onEliminar}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface FormVendedorProps {
  titulo: string;
  form: FormState;
  onChange: (f: Partial<FormState>) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  guardando: boolean;
  error: string | null;
}

function FormVendedor({ titulo, form, onChange, onGuardar, onCancelar, guardando, error }: FormVendedorProps) {
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 space-y-4">
      <p className="text-sm font-semibold text-primary-800">{titulo}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            className="input w-full"
            value={form.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            placeholder="Juan"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Apellido *</label>
          <input
            className="input w-full"
            value={form.apellido}
            onChange={(e) => onChange({ apellido: e.target.value })}
            placeholder="Pérez"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">CUI</label>
          <input
            className="input w-full"
            value={form.cui}
            onChange={(e) => onChange({ cui: e.target.value })}
            placeholder="1234567890101"
            maxLength={13}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
          <input
            className="input w-full"
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => onChange({ fechaNacimiento: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            className="input w-full"
            value={form.telefono}
            onChange={(e) => onChange({ telefono: e.target.value })}
            placeholder="5555-0000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input
            className="input w-full"
            type="email"
            value={form.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="asesor@empresa.com"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Domicilio</label>
          <input
            className="input w-full"
            value={form.domicilio}
            onChange={(e) => onChange({ domicilio: e.target.value })}
            placeholder="Dirección completa"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Comisión (%)</label>
          <div className="relative">
            <input
              className="input w-full pr-8"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.comisionPctStr}
              onChange={(e) => {
                const str = e.target.value;
                onChange({ comisionPctStr: str, comisionPct: parseFloat(str) / 100 || 0 });
              }}
              placeholder="5.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 rounded bg-red-50 px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancelar}
          className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
        >
          <X size={13} /> Cancelar
        </button>
        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando || !form.nombre.trim() || !form.apellido.trim()}
          className="btn-primary flex items-center gap-1.5 text-sm py-1.5"
        >
          <Check size={13} />
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

export function VendedoresPanel() {
  const { data: vendedores, isLoading } = useVendedores();
  const crear = useCrearVendedor();
  const actualizar = useActualizarVendedor();
  const eliminar = useEliminarVendedor();

  const [modoCrear, setModoCrear] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formCrear, setFormCrear] = useState<FormState>(FORM_INICIAL);
  const [formEditar, setFormEditar] = useState<FormState>(FORM_INICIAL);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [errorEditar, setErrorEditar] = useState<string | null>(null);

  function abrirEditar(v: Vendedor) {
    setEditandoId(v.id);
    setFormEditar(formDesdeVendedor(v));
    setErrorEditar(null);
    setModoCrear(false);
  }

  function cerrarEditar() {
    setEditandoId(null);
    setErrorEditar(null);
  }

  async function guardarNuevo() {
    setErrorCrear(null);
    try {
      await crear.mutateAsync({
        nombre: formCrear.nombre.trim(),
        apellido: formCrear.apellido.trim(),
        telefono: formCrear.telefono?.trim() || undefined,
        email: formCrear.email?.trim() || undefined,
        cui: formCrear.cui?.trim() || undefined,
        fechaNacimiento: formCrear.fechaNacimiento?.trim() || undefined,
        domicilio: formCrear.domicilio?.trim() || undefined,
        comisionPct: formCrear.comisionPct,
      });
      setModoCrear(false);
      setFormCrear(FORM_INICIAL);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorCrear(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar'));
    }
  }

  async function guardarEdicion() {
    if (!editandoId) return;
    setErrorEditar(null);
    try {
      await actualizar.mutateAsync({
        id: editandoId,
        datos: {
          nombre: formEditar.nombre.trim(),
          apellido: formEditar.apellido.trim(),
          telefono: formEditar.telefono?.trim() || undefined,
          email: formEditar.email?.trim() || undefined,
          cui: formEditar.cui?.trim() || undefined,
          fechaNacimiento: formEditar.fechaNacimiento?.trim() || undefined,
          domicilio: formEditar.domicilio?.trim() || undefined,
          comisionPct: formEditar.comisionPct,
        },
      });
      cerrarEditar();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorEditar(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar'));
    }
  }

  async function toggleActivo(v: Vendedor) {
    await actualizar.mutateAsync({ id: v.id, datos: { activo: !v.activo } });
  }

  async function confirmarEliminar(v: Vendedor) {
    if (!confirm(`¿Eliminar al asesor ${v.nombre} ${v.apellido}?`)) return;
    await eliminar.mutateAsync(v.id);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
            <UserCheck size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Asesores de ventas</h1>
            <p className="text-xs text-gray-500">Configura el equipo de ventas y sus comisiones</p>
          </div>
        </div>
        {!modoCrear && (
          <button
            onClick={() => { setModoCrear(true); setFormCrear(FORM_INICIAL); setErrorCrear(null); setEditandoId(null); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={14} /> Nuevo asesor
          </button>
        )}
      </div>

      {modoCrear && (
        <FormVendedor
          titulo="Nuevo asesor de ventas"
          form={formCrear}
          onChange={(f) => setFormCrear((prev) => ({ ...prev, ...f }))}
          onGuardar={guardarNuevo}
          onCancelar={() => { setModoCrear(false); setErrorCrear(null); }}
          guardando={crear.isPending}
          error={errorCrear}
        />
      )}

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">Cargando…</p>
        ) : !vendedores?.length ? (
          <div className="px-4 py-10 text-center">
            <UserCheck size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Aún no hay asesores de ventas registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Asesor de ventas</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Comisión</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {vendedores.map((v) => (
                <>
                  <FilaVendedor
                    key={v.id}
                    vendedor={v}
                    onEditar={() => abrirEditar(v)}
                    onToggleActivo={() => toggleActivo(v)}
                    onEliminar={() => confirmarEliminar(v)}
                  />
                  {editandoId === v.id && (
                    <tr key={`edit-${v.id}`}>
                      <td colSpan={4} className="px-4 py-3 bg-gray-50">
                        <FormVendedor
                          titulo={`Editar — ${v.nombre} ${v.apellido}`}
                          form={formEditar}
                          onChange={(f) => setFormEditar((prev) => ({ ...prev, ...f }))}
                          onGuardar={guardarEdicion}
                          onCancelar={cerrarEditar}
                          guardando={actualizar.isPending}
                          error={errorEditar}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        La comisión se calcula sobre el <strong>precio base</strong> del lote (sin impuestos) y se registra como dato informativo en cada venta.
      </div>
    </div>
  );
}
