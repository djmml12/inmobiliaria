import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ResumenVenta {
  id: string;
  fechaVenta: string;
  precioTotal: number;
  moneda: string;
  estado: string;
  cliente: { nombre: string; apellido: string };
  lote: { codigo: string; proyecto: { nombre: string } };
  planFinanciamiento: { sistema: string; plazoMeses: number } | null;
}

export interface ResumenDashboard {
  ventas: {
    total: number;
    activas: number;
    completadas: number;
    canceladas: number;
    montoTotalActivas: number;
  };
  lotes: {
    total: number;
    disponibles: number;
    vendidos: number;
    reservados: number;
    bloqueados: number;
  };
  clientes: {
    total: number;
  };
  cuotas: {
    vencidas: number;
    montoVencido: number;
    pendientes: number;
    pagadas: number;
    totalAFinanciar: number;
    totalRecaudado: number;
    saldoPorCobrar: number;
  };
  cobros: {
    mesActual: number;
    mesActualConteo: number;
    mesAnterior: number;
  };
  recientes: ResumenVenta[];
}

export interface CobroMensual {
  mes: string;
  label: string;
  cobros: number;
  conteo: number;
}

export function useCobrosMensuales(meses = 12) {
  return useQuery<CobroMensual[]>({
    queryKey: ['dashboard', 'cobros-mensuales', meses],
    queryFn: async () => {
      const { data } = await api.get<CobroMensual[]>('/api/dashboard/cobros-mensuales', {
        params: { meses },
      });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useDashboard() {
  return useQuery<ResumenDashboard>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<ResumenDashboard>('/api/dashboard/resumen');
      return data;
    },
    staleTime: 60_000, // refresca cada minuto
  });
}
