import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  ubicacion: string | null;
  tipoImpuesto: 'IVA' | 'TIMBRES' | 'EXENTO';
  tasaImpuesto: string;
  moneda: 'GTQ' | 'USD';
  color: string;
  activo: boolean;
  createdAt: string;
  lotes: { estado: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'BLOQUEADO' }[];
}

export interface CreateProyectoData {
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  tipoImpuesto: 'IVA' | 'TIMBRES' | 'EXENTO';
  tasaImpuesto: number;
  moneda: 'GTQ' | 'USD';
  color?: string;
}

export interface UpdateProyectoData extends Partial<CreateProyectoData> {
  activo?: boolean;
}

export function useProyectos() {
  return useQuery<Proyecto[]>({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const { data } = await api.get<Proyecto[]>('/api/proyectos');
      return data;
    },
  });
}

export function useCrearProyecto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateProyectoData) => {
      const { data } = await api.post<Proyecto>('/api/proyectos', datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proyectos'] }),
  });
}

export function useActualizarProyecto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: UpdateProyectoData }) => {
      const { data } = await api.patch<Proyecto>(`/api/proyectos/${id}`, datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proyectos'] }),
  });
}
