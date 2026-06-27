import { useState, useEffect } from 'react';
import { Save, CreditCard, Percent, Info, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, Type, Timer, Users, KeyRound, ShieldCheck, Mail, Eye, EyeOff } from 'lucide-react';
import { useConfiguracion, useActualizarConfiguracion, type Configuracion } from '../../hooks/useConfiguracion';
import {
  useImpuestosConfig, useCrearImpuestoConfig, useActualizarImpuestoConfig, useEliminarImpuestoConfig,
  type ImpuestoConfig, type TipoCalculo, type AplicaEn,
} from '../../hooks/useImpuestosConfig';
import {
  useComisionesConfig, useCrearComisionConfig, useActualizarComisionConfig, useEliminarComisionConfig,
  type ComisionConfig, type ModoComision,
} from '../../hooks/useComisionesConfig';
import {
  useUsuarios, useCrearUsuario, useActualizarUsuario, useDesactivarUsuario, useActivarUsuario,
  type Usuario, type RolNombre,
} from '../../hooks/useUsuarios';
import { useAuthStore } from '../../store/auth.store';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function pctStr(fraccion: string) { return (parseFloat(fraccion) * 100).toFixed(2); }
function montoStr(centavos: string) { return (parseInt(centavos) / 100).toFixed(2); }
function slugify(texto: string) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const LABEL_TIPO: Record<TipoCalculo, string> = { PORCENTAJE: 'Porcentaje (%)', MONTO_FIJO: 'Monto fijo' };
const LABEL_APLICA: Record<AplicaEn, string> = { PRIMERA_VENTA: 'Primera venta', REVENTA: 'Reventa', SIEMPRE: 'Siempre' };
const LABEL_MODO: Record<ModoComision, string> = { ABSORBIDA: 'Absorbida (empresa paga)', RECARGO: 'Recargo (cliente paga)' };

// ─── Sección: Tasas IVA / Timbres ─────────────────────────────────────────────

function SeccionImpuestosBase({
  config, onGuardar, guardando,
}: { config: Configuracion; onGuardar: (e: { clave: string; valor: string }[]) => Promise<void>; guardando: boolean }) {
  const [ivaPct, setIvaPct] = useState(pctStr(config['impuesto.iva.tasa']));
  const [timbresPct, setTimbresPct] = useState(pctStr(config['impuesto.timbres.tasa']));

  useEffect(() => {
    setIvaPct(pctStr(config['impuesto.iva.tasa']));
    setTimbresPct(pctStr(config['impuesto.timbres.tasa']));
  }, [config]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onGuardar([
          { clave: 'impuesto.iva.tasa', valor: String(parseFloat(ivaPct) / 100) },
          { clave: 'impuesto.timbres.tasa', valor: String(parseFloat(timbresPct) / 100) },
        ]);
      }}
      className="card space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
          <Percent size={16} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Tasas de impuesto base</h2>
          <p className="text-xs text-gray-500">Valores por defecto al crear proyectos</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 flex gap-2">
        <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          Los impuestos son <strong>solo informativos</strong>. La facturación fiscal (DTE/FEL) la emite el contador por separado en la SAT.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">IVA</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Primera venta</span>
          </div>
          <div className="flex items-center gap-2">
            <input className="input w-24 text-right" type="number" min="0" max="100" step="0.01" value={ivaPct} onChange={(e) => setIvaPct(e.target.value)} />
            <span className="text-sm text-gray-500">%</span>
            <span className="ml-auto text-xs text-gray-400">= {parseFloat(ivaPct) / 100} fracción</span>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">Timbres fiscales</span>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Reventa</span>
          </div>
          <div className="flex items-center gap-2">
            <input className="input w-24 text-right" type="number" min="0" max="100" step="0.01" value={timbresPct} onChange={(e) => setTimbresPct(e.target.value)} />
            <span className="text-sm text-gray-500">%</span>
            <span className="ml-auto text-xs text-gray-400">= {parseFloat(timbresPct) / 100} fracción</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={guardando}>
          <Save size={15} />
          {guardando ? 'Guardando…' : 'Guardar tasas'}
        </button>
      </div>
    </form>
  );
}

// ─── Form de impuesto personalizado ───────────────────────────────────────────

interface FormImpuesto {
  nombre: string; clave: string; descripcion: string;
  tipo: TipoCalculo; tasa: string; montoFijo: string; aplicaEn: AplicaEn; activo: boolean;
}

const FORM_IMP_INICIAL: FormImpuesto = {
  nombre: '', clave: '', descripcion: '', tipo: 'PORCENTAJE', tasa: '0', montoFijo: '0', aplicaEn: 'SIEMPRE', activo: true,
};

function FormImpuesto({
  inicial, onGuardar, onCancelar, guardando, error, esEdicion,
}: {
  inicial: FormImpuesto; onGuardar: (f: FormImpuesto) => void;
  onCancelar: () => void; guardando: boolean; error: string | null; esEdicion: boolean;
}) {
  const [form, setForm] = useState(inicial);
  const set = (p: Partial<FormImpuesto>) => setForm((f) => ({ ...f, ...p }));

  function handleNombre(nombre: string) {
    set({ nombre, ...(!esEdicion ? { clave: slugify(nombre) } : {}) });
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-800">{esEdicion ? 'Editar impuesto' : 'Nuevo impuesto'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nombre *</label>
          <input className="input w-full" value={form.nombre} onChange={(e) => handleNombre(e.target.value)} placeholder="Ej: ISR Retenido" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Clave única *</label>
          <input
            className="input w-full font-mono text-sm disabled:bg-gray-50 disabled:text-gray-400"
            value={form.clave}
            onChange={(e) => set({ clave: slugify(e.target.value) })}
            placeholder="isr_retenido"
            disabled={esEdicion}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Descripción</label>
        <input className="input w-full" value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} placeholder="Opcional" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Tipo de cálculo</label>
          <select className="input w-full" value={form.tipo} onChange={(e) => set({ tipo: e.target.value as TipoCalculo })}>
            <option value="PORCENTAJE">Porcentaje (%)</option>
            <option value="MONTO_FIJO">Monto fijo (Q)</option>
          </select>
        </div>

        {form.tipo === 'PORCENTAJE' ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Tasa (%)</label>
            <div className="flex items-center gap-1">
              <input className="input w-full text-right" type="number" min="0" max="100" step="0.01" value={form.tasa} onChange={(e) => set({ tasa: e.target.value })} />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Monto fijo (Q)</label>
            <input className="input w-full text-right" type="number" min="0" step="0.01" value={form.montoFijo} onChange={(e) => set({ montoFijo: e.target.value })} />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Aplica en</label>
          <select className="input w-full" value={form.aplicaEn} onChange={(e) => set({ aplicaEn: e.target.value as AplicaEn })}>
            <option value="SIEMPRE">Siempre</option>
            <option value="PRIMERA_VENTA">Primera venta</option>
            <option value="REVENTA">Reventa</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <label className="mb-1 block text-xs font-medium text-gray-700">Estado</label>
          <button
            type="button"
            onClick={() => set({ activo: !form.activo })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
              form.activo ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            {form.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {form.activo ? 'Activo' : 'Inactivo'}
          </button>
        </div>
      </div>

      {form.tipo === 'PORCENTAJE' && parseFloat(form.tasa) > 0 && (
        <p className="text-xs text-gray-500">
          Sobre Q 10,000 → <span className="font-semibold text-gray-700">Q {(10000 * parseFloat(form.tasa) / 100).toFixed(2)}</span> de impuesto
        </p>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1 flex items-center justify-center gap-1" onClick={onCancelar} disabled={guardando}>
          <X size={13} /> Cancelar
        </button>
        <button
          type="button"
          className="btn-primary flex-1 flex items-center justify-center gap-1"
          onClick={() => onGuardar(form)}
          disabled={guardando || !form.nombre.trim() || !form.clave.trim()}
        >
          <Check size={13} />
          {guardando ? 'Guardando…' : esEdicion ? 'Actualizar' : 'Crear impuesto'}
        </button>
      </div>
    </div>
  );
}

// ─── Sección: Impuestos personalizados ───────────────────────────────────────

function SeccionImpuestosPersonalizados() {
  const { data: impuestos, isLoading } = useImpuestosConfig();
  const crear = useCrearImpuestoConfig();
  const actualizar = useActualizarImpuestoConfig();
  const eliminar = useEliminarImpuestoConfig();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<ImpuestoConfig | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function errorMsg(mutation: { error: unknown }) {
    const e = mutation.error as { response?: { data?: { message?: string } } } | null;
    return e?.response?.data?.message ?? (e ? 'Error al guardar' : null);
  }

  async function handleCrear(form: FormImpuesto) {
    await crear.mutateAsync({
      nombre: form.nombre,
      clave: form.clave,
      descripcion: form.descripcion || undefined,
      tipo: form.tipo,
      tasa: parseFloat(form.tasa) / 100,
      montoFijo: form.tipo === 'MONTO_FIJO' ? Math.round(parseFloat(form.montoFijo) * 100) : 0,
      aplicaEn: form.aplicaEn,
      activo: form.activo,
    });
    setMostrarForm(false);
  }

  async function handleActualizar(form: FormImpuesto) {
    if (!editando) return;
    await actualizar.mutateAsync({
      id: editando.id,
      datos: {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        tipo: form.tipo,
        tasa: parseFloat(form.tasa) / 100,
        montoFijo: form.tipo === 'MONTO_FIJO' ? Math.round(parseFloat(form.montoFijo) * 100) : 0,
        aplicaEn: form.aplicaEn,
        activo: form.activo,
      },
    });
    setEditando(null);
  }

  async function toggleActivo(imp: ImpuestoConfig) {
    await actualizar.mutateAsync({ id: imp.id, datos: { activo: !imp.activo } });
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <Percent size={16} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Impuestos personalizados</h2>
            <p className="text-xs text-gray-500">Crea y gestiona impuestos adicionales para tus proyectos</p>
          </div>
        </div>
        {!mostrarForm && !editando && (
          <button className="btn-primary flex items-center gap-1.5 text-xs" onClick={() => setMostrarForm(true)}>
            <Plus size={13} /> Nuevo impuesto
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormImpuesto
          inicial={FORM_IMP_INICIAL}
          onGuardar={handleCrear}
          onCancelar={() => { setMostrarForm(false); crear.reset(); }}
          guardando={crear.isPending}
          error={errorMsg(crear)}
          esEdicion={false}
        />
      )}

      {isLoading && <p className="text-sm text-gray-400 text-center py-4">Cargando…</p>}

      {!isLoading && impuestos?.length === 0 && !mostrarForm && (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <Percent size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No hay impuestos personalizados.</p>
          <button className="mt-3 btn-secondary text-xs" onClick={() => setMostrarForm(true)}>Crear el primero</button>
        </div>
      )}

      {impuestos && impuestos.length > 0 && (
        <div className="divide-y divide-gray-100">
          {impuestos.map((imp) => (
            <div key={imp.id}>
              {editando?.id === imp.id ? (
                <div className="py-3">
                  <FormImpuesto
                    inicial={{
                      nombre: imp.nombre,
                      clave: imp.clave,
                      descripcion: imp.descripcion ?? '',
                      tipo: imp.tipo,
                      tasa: (parseFloat(imp.tasa) * 100).toFixed(2),
                      montoFijo: (imp.montoFijo / 100).toFixed(2),
                      aplicaEn: imp.aplicaEn,
                      activo: imp.activo,
                    }}
                    onGuardar={handleActualizar}
                    onCancelar={() => { setEditando(null); actualizar.reset(); }}
                    guardando={actualizar.isPending}
                    error={errorMsg(actualizar)}
                    esEdicion
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{imp.nombre}</span>
                      <span className="font-mono text-xs text-gray-400">{imp.clave}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${imp.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {imp.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      <span>{LABEL_TIPO[imp.tipo]}: {imp.tipo === 'PORCENTAJE' ? `${(parseFloat(imp.tasa) * 100).toFixed(2)}%` : `Q ${(imp.montoFijo / 100).toFixed(2)}`}</span>
                      <span>·</span>
                      <span>{LABEL_APLICA[imp.aplicaEn]}</span>
                      {imp.descripcion && <><span>·</span><span className="truncate max-w-xs">{imp.descripcion}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      title={imp.activo ? 'Desactivar' : 'Activar'}
                      onClick={() => toggleActivo(imp)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      {imp.activo ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      title="Editar"
                      onClick={() => { setEditando(imp); setMostrarForm(false); }}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmDelete === imp.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">¿Eliminar?</span>
                        <button
                          className="rounded px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700"
                          onClick={async () => { await eliminar.mutateAsync(imp.id); setConfirmDelete(null); }}
                          disabled={eliminar.isPending}
                        >Sí</button>
                        <button className="rounded px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200" onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        title="Eliminar"
                        onClick={() => setConfirmDelete(imp.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sección: Comisiones base ─────────────────────────────────────────────────

function SeccionComisionesBase({
  config, onGuardar, guardando,
}: { config: Configuracion; onGuardar: (e: { clave: string; valor: string }[]) => Promise<void>; guardando: boolean }) {
  const [creditoPct, setCreditoPct] = useState(pctStr(config['comision.credito.pct']));
  const [creditoFijo, setCreditoFijo] = useState(montoStr(config['comision.credito.fijo']));
  const [debitoPct, setDebitoPct] = useState(pctStr(config['comision.debito.pct']));
  const [debitoFijo, setDebitoFijo] = useState(montoStr(config['comision.debito.fijo']));

  useEffect(() => {
    setCreditoPct(pctStr(config['comision.credito.pct']));
    setCreditoFijo(montoStr(config['comision.credito.fijo']));
    setDebitoPct(pctStr(config['comision.debito.pct']));
    setDebitoFijo(montoStr(config['comision.debito.fijo']));
  }, [config]);

  function netoEjemplo(pct: string, fijo: string) {
    const cuota = 100000;
    const comision = Math.round(cuota * (parseFloat(pct) / 100)) + Math.round(parseFloat(fijo) * 100);
    return `Q ${((cuota - comision) / 100).toFixed(2)}`;
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onGuardar([
          { clave: 'comision.credito.pct', valor: String(parseFloat(creditoPct) / 100) },
          { clave: 'comision.credito.fijo', valor: String(Math.round(parseFloat(creditoFijo) * 100)) },
          { clave: 'comision.debito.pct', valor: String(parseFloat(debitoPct) / 100) },
          { clave: 'comision.debito.fijo', valor: String(Math.round(parseFloat(debitoFijo) * 100)) },
        ]);
      }}
      className="card space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
          <CreditCard size={16} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Comisiones base por tarjeta</h2>
          <p className="text-xs text-gray-500">Crédito y débito — valores aplicados al registrar pagos</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 flex gap-2">
        <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">
          Por defecto la comisión es <strong>absorbida</strong> por la empresa (Modo A). El Art. 33 de la Ley de Tarjetas de Crédito restringe trasladar recargos explícitos al tarjetahabiente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Tarjeta de crédito', pct: creditoPct, setPct: setCreditoPct, fijo: creditoFijo, setFijo: setCreditoFijo },
          { label: 'Tarjeta de débito', pct: debitoPct, setPct: setDebitoPct, fijo: debitoFijo, setFijo: setDebitoFijo },
        ].map(({ label, pct, setPct, fijo, setFijo }) => (
          <div key={label} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <span className="text-sm font-medium text-gray-800">{label}</span>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Comisión (%)</label>
                <div className="flex items-center gap-2">
                  <input className="input w-24 text-right" type="number" min="0" max="100" step="0.01" value={pct} onChange={(e) => setPct(e.target.value)} />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cargo fijo (Q)</label>
                <div className="flex items-center gap-2">
                  <input className="input w-24 text-right" type="number" min="0" step="0.01" value={fijo} onChange={(e) => setFijo(e.target.value)} />
                  <span className="text-sm text-gray-500">Q</span>
                </div>
              </div>
              <div className="rounded bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Neto por Q 1,000: <span className="font-semibold text-gray-700">{netoEjemplo(pct, fijo)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={guardando}>
          <Save size={15} />
          {guardando ? 'Guardando…' : 'Guardar comisiones'}
        </button>
      </div>
    </form>
  );
}

// ─── Form de comisión personalizada ──────────────────────────────────────────

interface FormComision {
  nombre: string; clave: string; descripcion: string; procesador: string;
  pct: string; fijo: string; modo: ModoComision; activo: boolean;
}

const FORM_COM_INICIAL: FormComision = {
  nombre: '', clave: '', descripcion: '', procesador: '', pct: '0', fijo: '0', modo: 'ABSORBIDA', activo: true,
};

function FormComision({
  inicial, onGuardar, onCancelar, guardando, error, esEdicion,
}: {
  inicial: FormComision; onGuardar: (f: FormComision) => void;
  onCancelar: () => void; guardando: boolean; error: string | null; esEdicion: boolean;
}) {
  const [form, setForm] = useState(inicial);
  const set = (p: Partial<FormComision>) => setForm((f) => ({ ...f, ...p }));

  function handleNombre(nombre: string) {
    set({ nombre, ...(!esEdicion ? { clave: slugify(nombre) } : {}) });
  }

  const pctNum = parseFloat(form.pct) || 0;
  const fijoNum = parseFloat(form.fijo) || 0;
  const cuotaEjemplo = 100000;
  const comisionEjemplo = Math.round(cuotaEjemplo * pctNum / 100) + Math.round(fijoNum * 100);
  const netoEjemplo = cuotaEjemplo - comisionEjemplo;

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-800">{esEdicion ? 'Editar comisión' : 'Nueva comisión'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nombre *</label>
          <input className="input w-full" value={form.nombre} onChange={(e) => handleNombre(e.target.value)} placeholder="Ej: Visa Cuotas Sin Interés" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Clave única *</label>
          <input
            className="input w-full font-mono text-sm disabled:bg-gray-50 disabled:text-gray-400"
            value={form.clave}
            onChange={(e) => set({ clave: slugify(e.target.value) })}
            placeholder="visa_csi"
            disabled={esEdicion}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Procesador / Banco</label>
          <input className="input w-full" value={form.procesador} onChange={(e) => set({ procesador: e.target.value })} placeholder="Ej: Banco Industrial, Visanet" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Descripción</label>
          <input className="input w-full" value={form.descripcion} onChange={(e) => set({ descripcion: e.target.value })} placeholder="Opcional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Comisión (%)</label>
          <div className="flex items-center gap-1">
            <input className="input w-full text-right" type="number" min="0" max="100" step="0.01" value={form.pct} onChange={(e) => set({ pct: e.target.value })} />
            <span className="text-xs text-gray-400">%</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Cargo fijo (Q)</label>
          <input className="input w-full text-right" type="number" min="0" step="0.01" value={form.fijo} onChange={(e) => set({ fijo: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Modo</label>
          <select className="input w-full" value={form.modo} onChange={(e) => set({ modo: e.target.value as ModoComision })}>
            <option value="ABSORBIDA">Absorbida (empresa)</option>
            <option value="RECARGO">Recargo (cliente)</option>
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className="mb-1 block text-xs font-medium text-gray-700">Estado</label>
          <button
            type="button"
            onClick={() => set({ activo: !form.activo })}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
              form.activo ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            {form.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {form.activo ? 'Activo' : 'Inactivo'}
          </button>
        </div>
      </div>

      {(pctNum > 0 || fijoNum > 0) && (
        <div className="rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-600 flex gap-4">
          <span>Sobre Q 1,000 → comisión <span className="font-semibold text-gray-800">Q {(comisionEjemplo / 100).toFixed(2)}</span></span>
          <span>· neto recibido <span className="font-semibold text-gray-800">Q {(netoEjemplo / 100).toFixed(2)}</span></span>
          {form.modo === 'RECARGO' && <span className="text-amber-600">· cliente pagaría <span className="font-semibold">Q {(cuotaEjemplo / (1 - pctNum / 100) / 100).toFixed(2)}</span></span>}
        </div>
      )}

      {form.modo === 'RECARGO' && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 flex gap-2">
          <Info size={13} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Modo <strong>Recargo</strong>: el cargo se traslada al cliente usando <code>monto / (1 − c)</code>. Verifica la Ley de Tarjetas de Crédito antes de aplicar.
          </p>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1 flex items-center justify-center gap-1" onClick={onCancelar} disabled={guardando}>
          <X size={13} /> Cancelar
        </button>
        <button
          type="button"
          className="btn-primary flex-1 flex items-center justify-center gap-1"
          onClick={() => onGuardar(form)}
          disabled={guardando || !form.nombre.trim() || !form.clave.trim()}
        >
          <Check size={13} />
          {guardando ? 'Guardando…' : esEdicion ? 'Actualizar' : 'Crear comisión'}
        </button>
      </div>
    </div>
  );
}

// ─── Sección: Comisiones personalizadas ──────────────────────────────────────

function SeccionComisionesPersonalizadas() {
  const { data: comisiones, isLoading } = useComisionesConfig();
  const crear = useCrearComisionConfig();
  const actualizar = useActualizarComisionConfig();
  const eliminar = useEliminarComisionConfig();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<ComisionConfig | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function errorMsg(mutation: { error: unknown }) {
    const e = mutation.error as { response?: { data?: { message?: string } } } | null;
    return e?.response?.data?.message ?? (e ? 'Error al guardar' : null);
  }

  async function handleCrear(form: FormComision) {
    await crear.mutateAsync({
      nombre: form.nombre,
      clave: form.clave,
      descripcion: form.descripcion || undefined,
      procesador: form.procesador || undefined,
      pct: parseFloat(form.pct) / 100,
      fijo: Math.round(parseFloat(form.fijo) * 100),
      modo: form.modo,
      activo: form.activo,
    });
    setMostrarForm(false);
  }

  async function handleActualizar(form: FormComision) {
    if (!editando) return;
    await actualizar.mutateAsync({
      id: editando.id,
      datos: {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        procesador: form.procesador || undefined,
        pct: parseFloat(form.pct) / 100,
        fijo: Math.round(parseFloat(form.fijo) * 100),
        modo: form.modo,
        activo: form.activo,
      },
    });
    setEditando(null);
  }

  async function toggleActivo(com: ComisionConfig) {
    await actualizar.mutateAsync({ id: com.id, datos: { activo: !com.activo } });
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
            <CreditCard size={16} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Comisiones personalizadas</h2>
            <p className="text-xs text-gray-500">Configura procesadores, bancos o métodos adicionales</p>
          </div>
        </div>
        {!mostrarForm && !editando && (
          <button className="btn-primary flex items-center gap-1.5 text-xs" onClick={() => setMostrarForm(true)}>
            <Plus size={13} /> Nueva comisión
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormComision
          inicial={FORM_COM_INICIAL}
          onGuardar={handleCrear}
          onCancelar={() => { setMostrarForm(false); crear.reset(); }}
          guardando={crear.isPending}
          error={errorMsg(crear)}
          esEdicion={false}
        />
      )}

      {isLoading && <p className="text-sm text-gray-400 text-center py-4">Cargando…</p>}

      {!isLoading && comisiones?.length === 0 && !mostrarForm && (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <CreditCard size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No hay comisiones personalizadas.</p>
          <button className="mt-3 btn-secondary text-xs" onClick={() => setMostrarForm(true)}>Crear la primera</button>
        </div>
      )}

      {comisiones && comisiones.length > 0 && (
        <div className="divide-y divide-gray-100">
          {comisiones.map((com) => (
            <div key={com.id}>
              {editando?.id === com.id ? (
                <div className="py-3">
                  <FormComision
                    inicial={{
                      nombre: com.nombre,
                      clave: com.clave,
                      descripcion: com.descripcion ?? '',
                      procesador: com.procesador ?? '',
                      pct: (parseFloat(com.pct) * 100).toFixed(2),
                      fijo: (com.fijo / 100).toFixed(2),
                      modo: com.modo,
                      activo: com.activo,
                    }}
                    onGuardar={handleActualizar}
                    onCancelar={() => { setEditando(null); actualizar.reset(); }}
                    guardando={actualizar.isPending}
                    error={errorMsg(actualizar)}
                    esEdicion
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{com.nombre}</span>
                      <span className="font-mono text-xs text-gray-400">{com.clave}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${com.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {com.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${com.modo === 'ABSORBIDA' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>
                        {LABEL_MODO[com.modo]}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      {parseFloat(com.pct) > 0 && <span>{(parseFloat(com.pct) * 100).toFixed(2)}%</span>}
                      {com.fijo > 0 && <><span>+</span><span>Q {(com.fijo / 100).toFixed(2)} fijo</span></>}
                      {com.procesador && <><span>·</span><span>{com.procesador}</span></>}
                      {com.descripcion && <><span>·</span><span className="truncate max-w-xs">{com.descripcion}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button title={com.activo ? 'Desactivar' : 'Activar'} onClick={() => toggleActivo(com)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      {com.activo ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                    </button>
                    <button title="Editar" onClick={() => { setEditando(com); setMostrarForm(false); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <Pencil size={14} />
                    </button>
                    {confirmDelete === com.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">¿Eliminar?</span>
                        <button className="rounded px-2 py-1 text-xs bg-red-600 text-white hover:bg-red-700" onClick={async () => { await eliminar.mutateAsync(com.id); setConfirmDelete(null); }} disabled={eliminar.isPending}>Sí</button>
                        <button className="rounded px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200" onClick={() => setConfirmDelete(null)}>No</button>
                      </div>
                    ) : (
                      <button title="Eliminar" onClick={() => setConfirmDelete(com.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sección: Apariencia ──────────────────────────────────────────────────────

const ESCALA_MIN = 80;
const ESCALA_MAX = 130;
const ESCALA_DEFAULT = 100;
const ESCALA_PASO = 2;
const ESCALA_KEY = 'ui.escala_texto';
const ESCALA_MODO_KEY = 'ui.escala_modo';

type EscalaModo = 'texto' | 'completo';

function aplicarEscalaDOM(valor: number, modo: EscalaModo) {
  if (modo === 'completo') {
    document.documentElement.style.fontSize = `${valor}%`;
    document.documentElement.removeAttribute('data-scale-mode');
    document.documentElement.style.removeProperty('--text-scale');
  } else {
    document.documentElement.style.fontSize = '';
    document.documentElement.setAttribute('data-scale-mode', 'text');
    document.documentElement.style.setProperty('--text-scale', String(valor / 100));
  }
}

function SeccionApariencia() {
  const [escala, setEscala] = useState<number>(() => {
    const saved = localStorage.getItem(ESCALA_KEY);
    return saved ? parseInt(saved, 10) : ESCALA_DEFAULT;
  });
  const [modo, setModo] = useState<EscalaModo>(() => {
    return (localStorage.getItem(ESCALA_MODO_KEY) as EscalaModo) ?? 'completo';
  });

  function aplicarEscala(valor: number, m: EscalaModo = modo) {
    setEscala(valor);
    localStorage.setItem(ESCALA_KEY, String(valor));
    aplicarEscalaDOM(valor, m);
  }

  function cambiarModo(m: EscalaModo) {
    setModo(m);
    localStorage.setItem(ESCALA_MODO_KEY, m);
    aplicarEscalaDOM(escala, m);
  }

  function restablecer() {
    aplicarEscala(ESCALA_DEFAULT);
  }

  const presets = [80, 90, 100, 110, 120];

  const modos: { value: EscalaModo; label: string; desc: string }[] = [
    { value: 'texto',    label: 'Solo texto',          desc: 'El tamaño de letra cambia; padding y layout quedan igual.' },
    { value: 'completo', label: 'Texto e interfaz',    desc: 'Todo escala proporcionalmente (botones, espaciado, texto).' },
  ];

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
          <Type size={16} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Apariencia</h2>
          <p className="text-xs text-gray-500">Ajusta la escala visual de la interfaz</p>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-gray-600">Qué escalar</span>
        <div className="grid grid-cols-2 gap-2">
          {modos.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => cambiarModo(m.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                modo === m.value
                  ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-400'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={`block text-xs font-semibold ${modo === m.value ? 'text-violet-700' : 'text-gray-800'}`}>
                {m.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500 leading-snug">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Escala</span>
          <div className="flex items-center gap-2">
            <span className="w-12 text-right text-sm font-semibold tabular-nums text-gray-900">{escala}%</span>
            {escala !== ESCALA_DEFAULT && (
              <button
                onClick={restablecer}
                className="text-xs text-primary-600 hover:text-primary-700 underline underline-offset-2"
              >
                Restablecer
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="select-none text-gray-400" style={{ fontSize: '11px' }}>A</span>
          <input
            type="range"
            min={ESCALA_MIN}
            max={ESCALA_MAX}
            step={ESCALA_PASO}
            value={escala}
            onChange={(e) => aplicarEscala(parseInt(e.target.value, 10))}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-violet-600"
          />
          <span className="select-none text-gray-400" style={{ fontSize: '20px', lineHeight: 1 }}>A</span>
        </div>

        <div className="flex gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => aplicarEscala(p)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                escala === p
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}%
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          El cambio se aplica de inmediato y se recuerda en este navegador.
        </p>
      </div>
    </div>
  );
}

// ─── Sección: Semáforo de pagos ───────────────────────────────────────────────

function SeccionSemaforoPagos({
  config, onGuardar, guardando,
}: { config: Configuracion; onGuardar: (e: { clave: string; valor: string }[]) => Promise<void>; guardando: boolean }) {
  const [diasAviso, setDiasAviso] = useState(config['pagos.dias_aviso'] ?? '7');
  const [diasGracia, setDiasGracia] = useState(config['pagos.dias_gracia'] ?? '0');

  useEffect(() => {
    setDiasAviso(config['pagos.dias_aviso'] ?? '7');
    setDiasGracia(config['pagos.dias_gracia'] ?? '0');
  }, [config]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onGuardar([
          { clave: 'pagos.dias_aviso', valor: String(parseInt(diasAviso, 10)) },
          { clave: 'pagos.dias_gracia', valor: String(parseInt(diasGracia, 10)) },
        ]);
      }}
      className="card space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
          <Timer size={16} className="text-orange-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Semáforo de pagos</h2>
          <p className="text-xs text-gray-500">Controla cuándo una cuota cambia de color en la vista de pagos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Amarillo */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="text-sm font-medium text-yellow-800">Por vencer (amarillo)</span>
          </div>
          <p className="text-xs text-yellow-700">
            Marca la cuota en amarillo cuando faltan X días o menos para su vencimiento.
          </p>
          <div className="flex items-center gap-2">
            <input
              className="input w-24 text-right"
              type="number"
              min="0"
              max="90"
              step="1"
              value={diasAviso}
              onChange={(e) => setDiasAviso(e.target.value)}
            />
            <span className="text-sm text-yellow-700">días antes</span>
          </div>
          {parseInt(diasAviso) > 0 && (
            <p className="text-xs text-yellow-600">
              Cuotas que vencen en los próximos <strong>{diasAviso} días</strong> aparecerán en amarillo.
            </p>
          )}
        </div>

        {/* Rojo */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-800">Vencida (rojo)</span>
          </div>
          <p className="text-xs text-red-700">
            Días de gracia después del vencimiento antes de marcar la cuota en rojo. Con 0, se marca rojo el mismo día que vence.
          </p>
          <div className="flex items-center gap-2">
            <input
              className="input w-24 text-right"
              type="number"
              min="0"
              max="30"
              step="1"
              value={diasGracia}
              onChange={(e) => setDiasGracia(e.target.value)}
            />
            <span className="text-sm text-red-700">días de gracia</span>
          </div>
          {parseInt(diasGracia) > 0 && (
            <p className="text-xs text-red-600">
              Se marcará rojo <strong>{diasGracia} días después</strong> del vencimiento.
            </p>
          )}
          {parseInt(diasGracia) === 0 && (
            <p className="text-xs text-red-600">
              Se marca rojo <strong>el mismo día</strong> del vencimiento.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={guardando}>
          <Save size={15} />
          {guardando ? 'Guardando…' : 'Guardar semáforo'}
        </button>
      </div>
    </form>
  );
}

// ─── Sección: Usuarios ────────────────────────────────────────────────────────

const ROLES: { value: RolNombre; label: string; color: string }[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador', color: 'bg-red-100 text-red-700' },
  { value: 'SECRETARIA',    label: 'Secretaria',    color: 'bg-blue-100 text-blue-700' },
  { value: 'COBRANZA',      label: 'Cobranza',      color: 'bg-orange-100 text-orange-700' },
  { value: 'CONTABILIDAD',  label: 'Contabilidad',  color: 'bg-purple-100 text-purple-700' },
  { value: 'VENTAS',        label: 'Ventas',         color: 'bg-green-100 text-green-700' },
];

function rolInfo(rol: RolNombre) {
  return ROLES.find((r) => r.value === rol) ?? { label: rol, color: 'bg-gray-100 text-gray-600' };
}

interface FormUsuario {
  username: string;
  nombre: string;
  email: string;
  password: string;
  rol: RolNombre;
}

const FORM_USR_INICIAL: FormUsuario = { username: '', nombre: '', email: '', password: '', rol: 'SECRETARIA' };

function FormUsuario({
  inicial, onGuardar, onCancelar, guardando, error, esEdicion,
}: {
  inicial: FormUsuario; onGuardar: (f: FormUsuario) => void;
  onCancelar: () => void; guardando: boolean; error: string | null; esEdicion: boolean;
}) {
  const [form, setForm] = useState(inicial);
  const set = (p: Partial<FormUsuario>) => setForm((f) => ({ ...f, ...p }));
  const [mostrarPass, setMostrarPass] = useState(false);

  const valido = form.nombre.trim().length > 0 &&
    (esEdicion || (form.username.trim().length >= 3 && form.password.length >= 8));

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-800">{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nombre completo *</label>
          <input
            className="input w-full"
            value={form.nombre}
            onChange={(e) => set({ nombre: e.target.value })}
            placeholder="Ej: Ana García"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Usuario *{esEdicion && <span className="ml-1 text-gray-400">(no editable)</span>}
          </label>
          <input
            className="input w-full font-mono text-sm disabled:bg-gray-50 disabled:text-gray-400"
            value={form.username}
            onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/\s/g, '') })}
            placeholder="ana.garcia"
            disabled={esEdicion}
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Correo electrónico
          <span className="ml-1 text-gray-400 font-normal">(necesario para recuperación de contraseña)</span>
        </label>
        <input
          className="input w-full"
          type="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="usuario@ejemplo.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Rol *</label>
          <select className="input w-full" value={form.rol} onChange={(e) => set({ rol: e.target.value as RolNombre })}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            {esEdicion ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña * (mín. 8 caracteres)'}
          </label>
          <div className="relative">
            <input
              className="input w-full pr-10"
              type={mostrarPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder={esEdicion ? '••••••••' : 'Mínimo 8 caracteres'}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setMostrarPass((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <KeyRound size={14} />
            </button>
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1 flex items-center justify-center gap-1" onClick={onCancelar} disabled={guardando}>
          <X size={13} /> Cancelar
        </button>
        <button
          type="button"
          className="btn-primary flex-1 flex items-center justify-center gap-1"
          onClick={() => onGuardar(form)}
          disabled={guardando || !valido}
        >
          <Check size={13} />
          {guardando ? 'Guardando…' : esEdicion ? 'Actualizar' : 'Crear usuario'}
        </button>
      </div>
    </div>
  );
}

function SeccionUsuarios() {
  const { data: usuarios, isLoading } = useUsuarios();
  const usuarioActual = useAuthStore((s) => s.usuario);
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();
  const desactivar = useDesactivarUsuario();
  const activar = useActivarUsuario();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<string | null>(null);

  function errorMsg(mutation: { error: unknown }) {
    const e = mutation.error as { response?: { data?: { message?: string } } } | null;
    return e?.response?.data?.message ?? (e ? 'Error al guardar' : null);
  }

  async function handleCrear(form: FormUsuario) {
    await crear.mutateAsync({ username: form.username, nombre: form.nombre, email: form.email || undefined, password: form.password, rol: form.rol });
    setMostrarForm(false);
  }

  async function handleActualizar(form: FormUsuario) {
    if (!editando) return;
    const datos: { nombre?: string; rol?: RolNombre; password?: string; email?: string } = { nombre: form.nombre, rol: form.rol, email: form.email || undefined };
    if (form.password) datos.password = form.password;
    await actualizar.mutateAsync({ id: editando.id, datos });
    setEditando(null);
  }

  async function toggleActivo(u: Usuario) {
    if (u.activo) await desactivar.mutateAsync(u.id);
    else await activar.mutateAsync(u.id);
    setConfirmToggle(null);
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <Users size={16} className="text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Usuarios del sistema</h2>
            <p className="text-xs text-gray-500">Crea y gestiona cuentas con sus roles de acceso</p>
          </div>
        </div>
        {!mostrarForm && !editando && (
          <button className="btn-primary flex items-center gap-1.5 text-xs" onClick={() => setMostrarForm(true)}>
            <Plus size={13} /> Nuevo usuario
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormUsuario
          inicial={FORM_USR_INICIAL}
          onGuardar={handleCrear}
          onCancelar={() => { setMostrarForm(false); crear.reset(); }}
          guardando={crear.isPending}
          error={errorMsg(crear)}
          esEdicion={false}
        />
      )}

      {isLoading && <p className="text-sm text-gray-400 text-center py-4">Cargando…</p>}

      {!isLoading && usuarios?.length === 0 && !mostrarForm && (
        <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <Users size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No hay usuarios registrados.</p>
          <button className="mt-3 btn-secondary text-xs" onClick={() => setMostrarForm(true)}>Crear el primero</button>
        </div>
      )}

      {usuarios && usuarios.length > 0 && (
        <div className="divide-y divide-gray-100">
          {usuarios.map((u) => {
            const ri = rolInfo(u.rol);
            const esSelf = u.id === usuarioActual?.id;
            return (
              <div key={u.id}>
                {editando?.id === u.id ? (
                  <div className="py-3">
                    <FormUsuario
                      inicial={{ username: u.username, nombre: u.nombre, email: u.email ?? '', password: '', rol: u.rol }}
                      onGuardar={handleActualizar}
                      onCancelar={() => { setEditando(null); actualizar.reset(); }}
                      guardando={actualizar.isPending}
                      error={errorMsg(actualizar)}
                      esEdicion
                    />
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 py-3 ${!u.activo ? 'opacity-50' : ''}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <ShieldCheck size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{u.nombre}</span>
                        <span className="font-mono text-xs text-gray-400">@{u.username}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ri.color}`}>{ri.label}</span>
                        {!u.activo && <span className="rounded-full px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-400">Inactivo</span>}
                        {esSelf && <span className="rounded-full px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700">Tú</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Creado {new Date(u.createdAt).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Editar"
                        onClick={() => { setEditando(u); setMostrarForm(false); }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil size={14} />
                      </button>
                      {!esSelf && (
                        confirmToggle === u.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">{u.activo ? '¿Desactivar?' : '¿Activar?'}</span>
                            <button
                              className={`rounded px-2 py-1 text-xs text-white ${u.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                              onClick={() => toggleActivo(u)}
                              disabled={desactivar.isPending || activar.isPending}
                            >Sí</button>
                            <button className="rounded px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200" onClick={() => setConfirmToggle(null)}>No</button>
                          </div>
                        ) : (
                          <button
                            title={u.activo ? 'Desactivar' : 'Activar'}
                            onClick={() => setConfirmToggle(u.id)}
                            className={`rounded-lg p-1.5 hover:bg-gray-100 ${u.activo ? 'text-gray-400 hover:text-red-500' : 'text-green-500 hover:text-green-600'}`}
                          >
                            {u.activo ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 flex gap-2">
        <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Solo los <strong>Administradores</strong> pueden crear y gestionar usuarios. No puedes desactivar tu propia cuenta.
        </p>
      </div>
    </div>
  );
}

// ─── Sección: SMTP ────────────────────────────────────────────────────────────

function SeccionSmtp({
  config, onGuardar, guardando,
}: { config: Configuracion; onGuardar: (e: { clave: string; valor: string }[]) => Promise<void>; guardando: boolean }) {
  const [host, setHost] = useState(config['smtp.host'] ?? '');
  const [port, setPort] = useState(config['smtp.port'] ?? '587');
  const [secure, setSecure] = useState(config['smtp.secure'] ?? 'false');
  const [user, setUser] = useState(config['smtp.user'] ?? '');
  const [pass, setPass] = useState(config['smtp.pass'] ?? '');
  const [from, setFrom] = useState(config['smtp.from'] ?? '');
  const [mostrarPass, setMostrarPass] = useState(false);

  useEffect(() => {
    setHost(config['smtp.host'] ?? '');
    setPort(config['smtp.port'] ?? '587');
    setSecure(config['smtp.secure'] ?? 'false');
    setUser(config['smtp.user'] ?? '');
    setPass(config['smtp.pass'] ?? '');
    setFrom(config['smtp.from'] ?? '');
  }, [config]);

  const configurado = !!(config['smtp.host'] && config['smtp.user'] && config['smtp.pass']);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onGuardar([
          { clave: 'smtp.host', valor: host },
          { clave: 'smtp.port', valor: port },
          { clave: 'smtp.secure', valor: secure },
          { clave: 'smtp.user', valor: user },
          { clave: 'smtp.pass', valor: pass },
          { clave: 'smtp.from', valor: from },
        ]);
      }}
      className="card space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <Mail size={16} className="text-sky-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Servidor de correo (SMTP)</h2>
            <p className="text-xs text-gray-500">Necesario para enviar contraseñas temporales cuando un usuario las olvida</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${configurado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
          {configurado ? 'Configurado' : 'Sin configurar'}
        </span>
      </div>

      <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 flex gap-2">
        <Info size={14} className="text-sky-600 mt-0.5 shrink-0" />
        <div className="text-xs text-sky-700 space-y-1">
          <p><strong>Gmail:</strong> usa <code>smtp.gmail.com</code>, puerto <code>587</code>, y genera un <strong>App Password</strong> en tu cuenta Google (Seguridad → Contraseñas de aplicación).</p>
          <p>La contraseña se guarda cifrada en la base de datos y nunca se muestra de nuevo en pantalla.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">Servidor SMTP</label>
          <input
            className="input w-full"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.gmail.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Puerto</label>
          <select className="input w-full" value={port} onChange={(e) => { setPort(e.target.value); setSecure(e.target.value === '465' ? 'true' : 'false'); }}>
            <option value="587">587 — STARTTLS (recomendado)</option>
            <option value="465">465 — SSL</option>
            <option value="25">25 — Sin cifrado</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Usuario / Email remitente</label>
          <input
            className="input w-full"
            type="email"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="sistema@gmail.com"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Contraseña / App Password
            {pass === '***' && <span className="ml-2 text-gray-400 font-normal">(ya configurada — deja en blanco para no cambiar o escribe una nueva)</span>}
          </label>
          <div className="relative">
            <input
              className="input w-full pr-10"
              type={mostrarPass ? 'text' : 'password'}
              value={pass === '***' ? '' : pass}
              onChange={(e) => setPass(e.target.value || '***')}
              placeholder={pass === '***' ? '••••••••••••••••' : 'App Password de Google (16 caracteres)'}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setMostrarPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {mostrarPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700">Nombre del remitente (opcional)</label>
          <input
            className="input w-full"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder='Sistema Inmobiliario <sistema@gmail.com>'
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={guardando}>
          <Save size={15} />
          {guardando ? 'Guardando…' : 'Guardar configuración SMTP'}
        </button>
      </div>
    </form>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function ConfiguracionPanel() {
  const { data: config, isLoading, isError } = useConfiguracion();
  const actualizar = useActualizarConfiguracion();

  if (isLoading) return <div className="card py-12 text-center text-sm text-gray-400">Cargando configuración…</div>;
  if (isError || !config) return <div className="card py-8 text-center text-sm text-red-500">No se pudo cargar la configuración.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del sistema</h1>
        <p className="mt-1 text-sm text-gray-500">
          Impuestos, comisiones y reglas financieras aplicadas a nuevos proyectos y pagos.
        </p>
      </div>

      <SeccionUsuarios />
      <SeccionSmtp config={config} onGuardar={async (e) => { await actualizar.mutateAsync(e); }} guardando={actualizar.isPending} />
      <SeccionApariencia />
      <SeccionSemaforoPagos config={config} onGuardar={async (e) => { await actualizar.mutateAsync(e); }} guardando={actualizar.isPending} />
      <SeccionImpuestosBase config={config} onGuardar={async (e) => { await actualizar.mutateAsync(e); }} guardando={actualizar.isPending} />
      <SeccionImpuestosPersonalizados />
      <SeccionComisionesBase config={config} onGuardar={async (e) => { await actualizar.mutateAsync(e); }} guardando={actualizar.isPending} />
      <SeccionComisionesPersonalizadas />
    </div>
  );
}
