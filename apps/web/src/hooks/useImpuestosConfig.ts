import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export type TipoCalculo = 'PORCENTAJE' | 'MONTO_FIJO';
export type AplicaEn = 'PRIMERA_VENTA' | 'REVENTA' | 'SIEMPRE';

export interface ImpuestoConfig {
  id: string;
  nombre: string;
  clave: string;
  descripcion: string | null;
  tipo: TipoCalculo;
  tasa: string;
  montoFijo: number;
  aplicaEn: AplicaEn;
  activo: boolean;
  createdAt: string;
}

export interface CreateImpuestoConfigData {
  nombre: string;
  clave: string;
  descripcion?: string;
  tipo: TipoCalculo;
  tasa: number;
  montoFijo?: number;
  aplicaEn: AplicaEn;
  activo?: boolean;
}

export type UpdateImpuestoConfigData = Partial<Omit<CreateImpuestoConfigData, 'clave'>>;

const QK = ['impuestos-config'] as const;

export function useImpuestosConfig() {
  return useQuery<ImpuestoConfig[]>({
    queryKey: QK,
    queryFn: async () => {
      const { data } = await api.get<ImpuestoConfig[]>('/api/impuestos-config');
      return data;
    },
  });
}

export function useCrearImpuestoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateImpuestoConfigData) => {
      const { data } = await api.post<ImpuestoConfig>('/api/impuestos-config', datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useActualizarImpuestoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: UpdateImpuestoConfigData }) => {
      const { data } = await api.patch<ImpuestoConfig>(`/api/impuestos-config/${id}`, datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useEliminarImpuestoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/impuestos-config/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}
