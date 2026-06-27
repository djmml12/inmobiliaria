import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Reserva {
  id: string;
  loteId: string;
  clienteId: string;
  monto: number; // centavos
  moneda: 'GTQ' | 'USD';
  fecha: string;
  estado: 'ACTIVA' | 'CANCELADA' | 'CONVERTIDA';
  notas: string | null;
  ventaId: string | null;
  createdAt: string;
  cliente: { id: string; nombre: string; apellido: string };
  lote: { id: string; codigo: string; moneda: string; proyecto: { nombre: string; color: string } };
}

export interface CreateReservaData {
  loteId: string;
  clienteId: string;
  monto: number; // centavos
  fecha?: string;
  notas?: string;
}

export function useReservas() {
  return useQuery<Reserva[]>({
    queryKey: ['reservas'],
    queryFn: async () => {
      const { data } = await api.get<Reserva[]>('/api/reservas');
      return data;
    },
  });
}

export function useCrearReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateReservaData) => {
      const { data } = await api.post<Reserva>('/api/reservas', datos);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
    },
  });
}

export function useCancelarReserva() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Reserva>(`/api/reservas/${id}/cancelar`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservas'] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
    },
  });
}
