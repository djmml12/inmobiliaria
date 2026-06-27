import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Lote {
  id: string;
  proyectoId: string;
  codigo: string;
  area: string;
  precioBase: number; // centavos
  moneda: 'GTQ' | 'USD';
  estado: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'BLOQUEADO';
  descripcion: string | null;
  proyecto: { nombre: string; tipoImpuesto: string; tasaImpuesto: string };
}

export interface CreateLoteData {
  proyectoId: string;
  codigo: string;
  area?: number;
  precioBase: number; // centavos
  moneda?: 'GTQ' | 'USD';
  descripcion?: string;
}

export interface UpdateLoteData {
  codigo?: string;
  area?: number;
  precioBase?: number; // centavos
  moneda?: 'GTQ' | 'USD';
  estado?: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'BLOQUEADO';
  descripcion?: string;
}

export function useLotes(proyectoId?: string, estado?: string) {
  const params = new URLSearchParams();
  if (proyectoId) params.set('proyectoId', proyectoId);
  if (estado) params.set('estado', estado);
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<Lote[]>({
    queryKey: ['lotes', proyectoId, estado],
    queryFn: async () => {
      const { data } = await api.get<Lote[]>(`/api/lotes${query}`);
      return data;
    },
  });
}

export function useCrearLote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateLoteData) => {
      const { data } = await api.post<Lote>('/api/lotes', datos);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['lotes', vars.proyectoId] });
    },
  });
}

export function useActualizarLote(proyectoId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: UpdateLoteData }) => {
      const { data } = await api.patch<Lote>(`/api/lotes/${id}`, datos);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes', proyectoId] });
    },
  });
}

export function useEliminarLote(proyectoId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/lotes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes', proyectoId] });
    },
  });
}
