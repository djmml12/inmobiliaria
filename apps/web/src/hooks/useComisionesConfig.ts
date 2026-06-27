import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type ModoComision = 'ABSORBIDA' | 'RECARGO';

export interface ComisionConfig {
  id: string;
  nombre: string;
  clave: string;
  descripcion: string | null;
  procesador: string | null;
  pct: string;
  fijo: number;
  modo: ModoComision;
  activo: boolean;
  createdAt: string;
}

export interface CreateComisionConfigData {
  nombre: string;
  clave: string;
  descripcion?: string;
  procesador?: string;
  pct: number;
  fijo?: number;
  modo: ModoComision;
  activo?: boolean;
}

export type UpdateComisionConfigData = Partial<Omit<CreateComisionConfigData, 'clave'>>;

const QK = ['comisiones-config'] as const;

export function useComisionesConfig() {
  return useQuery<ComisionConfig[]>({
    queryKey: QK,
    queryFn: async () => {
      const { data } = await api.get<ComisionConfig[]>('/api/comisiones-config');
      return data;
    },
  });
}

export function useCrearComisionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateComisionConfigData) => {
      const { data } = await api.post<ComisionConfig>('/api/comisiones-config', datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useActualizarComisionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: UpdateComisionConfigData }) => {
      const { data } = await api.patch<ComisionConfig>(`/api/comisiones-config/${id}`, datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useEliminarComisionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/comisiones-config/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
