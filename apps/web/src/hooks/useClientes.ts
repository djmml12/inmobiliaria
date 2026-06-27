import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dpi: string | null;
  nit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  createdAt: string;
}

export interface ClienteData {
  nombre: string;
  apellido: string;
  dpi?: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export function useClientes() {
  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await api.get<Cliente[]>('/api/clientes');
      return data;
    },
  });
}

export function useCrearCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: ClienteData) => {
      const { data } = await api.post<Cliente>('/api/clientes', datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}

export function useActualizarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<ClienteData> }) => {
      const { data } = await api.patch<Cliente>(`/api/clientes/${id}`, datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes'] }),
  });
}
