import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Vendedor {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  cui: string | null;
  fechaNacimiento: string | null;
  domicilio: string | null;
  comisionPct: string; // Prisma Decimal llega como string
  activo: boolean;
  createdAt: string;
}

export interface VendedorData {
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  cui?: string;
  fechaNacimiento?: string;
  domicilio?: string;
  comisionPct: number;
}

export function useVendedores() {
  return useQuery<Vendedor[]>({
    queryKey: ['vendedores'],
    queryFn: async () => {
      const { data } = await api.get<Vendedor[]>('/api/vendedores');
      return data;
    },
  });
}

export function useCrearVendedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: VendedorData) => {
      const { data } = await api.post<Vendedor>('/api/vendedores', datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendedores'] }),
  });
}

export function useActualizarVendedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id: string; datos: Partial<VendedorData & { activo: boolean }> }) => {
      const { data } = await api.patch<Vendedor>(`/api/vendedores/${id}`, datos);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendedores'] }),
  });
}

export function useEliminarVendedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/vendedores/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendedores'] }),
  });
}

export interface VentaResumen {
  id: string;
  fechaVenta: string;
  precioBase: number;
  precioTotal: number;
  moneda: string;
  comisionMonto: number | null;
  comisionPagada: boolean;
  comisionElegible: boolean;
  pctPagado: number;
  estado: string;
  cliente: { nombre: string; apellido: string };
  lote: { codigo: string; proyecto: { nombre: string; color: string } };
}

export interface VendedorRanking {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  cui: string | null;
  fechaNacimiento: string | null;
  domicilio: string | null;
  comisionPct: string;
  activo: boolean;
  totalVentas: number;
  comisionPendiente: number;
  comisionPagada: number;
  comisionElegible: number;
  comisionTotal: number;
  ventas: VentaResumen[];
}

export interface ReporteVendedores {
  resumen: { totalPendiente: number; totalPagado: number; totalElegible: number };
  ranking: VendedorRanking[];
}

export function useReporteVendedores() {
  return useQuery<ReporteVendedores>({
    queryKey: ['vendedores', 'reporte'],
    queryFn: async () => {
      const { data } = await api.get<ReporteVendedores>('/api/vendedores/reporte');
      return data;
    },
  });
}

export function useMarcarComisionPagada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ventaId, pagada }: { ventaId: string; pagada: boolean }) => {
      await api.patch(`/api/ventas/${ventaId}/comision`, { pagada });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendedores', 'reporte'] }),
  });
}
