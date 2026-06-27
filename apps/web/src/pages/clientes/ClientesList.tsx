import { useState } from 'react';
import { Plus, User, Phone, MapPin, Pencil, Search } from 'lucide-react';
import { useClientes, useCrearCliente, useActualizarCliente, type Cliente, type ClienteData } from '../../hooks/useClientes';
import { useAuthStore } from '../../store/auth.store';

const PUEDE_EDITAR = ['ADMINISTRADOR', 'SUPERVISOR', 'RECEPCIONISTA'];

interface FormState {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
}

const FORM_INICIAL: FormState = {
  nombre: '',
  apellido: '',
  telefono: '',
  direccion: '',
};

function formToDto(form: FormState): ClienteData {
  return {
    nombre: form.nombre.trim(),
    apellido: form.apellido.trim(),
    telefono: form.telefono.trim() || undefined,
    direccion: form.direccion.trim() || undefined,
  };
}

interface ModalClienteProps {
  inicial?: FormState & { id?: string; };
  onCerrar: () => void;
}

function ModalCliente({ inicial, onCerrar }: ModalClienteProps) {
  const editando = !!inicial?.id;
  const [form, setForm] = useState<FormState>(inicial ?? FORM_INICIAL);
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();
  const pendiente = crear.isPending || actualizar.isPending;

  const set = (campo: Partial<FormState>) => setForm((f) => ({ ...f, ...campo }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const dto = formToDto(form);
    if (editando && inicial?.id) {
      await actualizar.mutateAsync({ id: inicial.id, datos: dto });
    } else {
      await crear.mutateAsync(dto);
    }
    onCerrar();
  }

  const error = (crear.error ?? actualizar.error) as { response?: { data?: { message?: string } } } | null;
  const mensajeError = error?.response?.data?.message ?? (error ? 'Ocurrió un error' : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {editando ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
        </div>

        <form onSubmit={enviar} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                className="input w-full"
                required
                value={form.nombre}
                onChange={(e) => set({ nombre: e.target.value })}
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
              <input
                className="input w-full"
                required
                value={form.apellido}
                onChange={(e) => set({ apellido: e.target.value })}
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              className="input w-full"
              value={form.telefono}
              onChange={(e) => set({ telefono: e.target.value })}
              placeholder="5555-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              className="input w-full"
              value={form.direccion}
              onChange={(e) => set({ direccion: e.target.value })}
              placeholder="Zona 10, Ciudad de Guatemala"
            />
          </div>

          {mensajeError && (
            <p className="text-sm text-red-600">{mensajeError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onCerrar} disabled={pendiente}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={pendiente}>
              {pendiente ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function iniciales(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

export function ClientesList() {
  const { data: clientes, isLoading, isError } = useClientes();
  const usuario = useAuthStore((s) => s.usuario);
  const puedeEditar = PUEDE_EDITAR.includes(usuario?.rol ?? '');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  const [busqueda, setBusqueda] = useState('');

  function cerrarModal() {
    setModalAbierto(false);
    setClienteEditar(null);
  }

  const clientesFiltrados = (clientes ?? []).filter((c) => {
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      (c.telefono ?? '').includes(q)
    );
  });

  const formEditar = clienteEditar
    ? {
        id: clienteEditar.id,
        nombre: clienteEditar.nombre,
        apellido: clienteEditar.apellido,
        telefono: clienteEditar.telefono ?? '',
        direccion: clienteEditar.direccion ?? '',
      }
    : undefined;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        {puedeEditar && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setModalAbierto(true)}>
            <Plus size={16} />
            Nuevo cliente
          </button>
        )}
      </div>

      {!isLoading && !isError && (clientes?.length ?? 0) > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input w-full pl-9"
            placeholder="Buscar por nombre o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {isLoading && (
        <div className="card py-12 text-center text-sm text-gray-400">Cargando clientes…</div>
      )}

      {isError && (
        <div className="card py-8 text-center text-sm text-red-500">
          No se pudieron cargar los clientes. Verifica tu conexión.
        </div>
      )}

      {!isLoading && !isError && clientes?.length === 0 && (
        <div className="card py-12 text-center">
          <User size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No hay clientes registrados.</p>
          {puedeEditar && (
            <button className="btn-primary mt-4" onClick={() => setModalAbierto(true)}>
              Registrar el primero
            </button>
          )}
        </div>
      )}

      {clientesFiltrados.length === 0 && busqueda && (
        <div className="card py-8 text-center text-sm text-gray-400">
          Sin resultados para "{busqueda}"
        </div>
      )}

      {clientesFiltrados.length > 0 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Dirección</th>
                {puedeEditar && <th className="px-4 py-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clientesFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                      {iniciales(c.nombre, c.apellido)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {c.nombre} {c.apellido}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.telefono ? (
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} className="shrink-0 text-gray-400" />
                        {c.telefono}
                      </span>
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {c.direccion ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={12} className="shrink-0 text-gray-400" />
                        <span className="truncate">{c.direccion}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300 italic">—</span>
                    )}
                  </td>
                  {puedeEditar && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setClienteEditar(c)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modalAbierto || clienteEditar) && (
        <ModalCliente inicial={formEditar} onCerrar={cerrarModal} />
      )}
    </div>
  );
}
