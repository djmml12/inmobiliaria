import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface FilaCuota {
  numero: number;
  fechaVencimiento: string;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

export interface TablaAmortizacion {
  filas: FilaCuota[];
  totalPagar: number;
  totalIntereses: number;
  totalCapital: number;
}

export interface SimulacionVenta {
  precioBase: number;
  tipoImpuesto: string;
  tasaImpuesto: number;
  montoImpuesto: number;
  precioTotal: number;
  enganche: number;
  saldoFinanciar: number;
  moneda: string;
  tabla: TablaAmortizacion;
}

export interface Venta {
  id: string;
  fechaVenta: string;
  precioBase: number;
  montoImpuesto: number;
  precioTotal: number;
  enganche: number;
  saldoFinanciar: number;
  moneda: string;
  estado: 'ACTIVA' | 'CANCELADA' | 'COMPLETADA';
  notas: string | null;
  cliente: { nombre: string; apellido: string };
  lote: { codigo: string; proyecto: { nombre: string; color: string } };
  vendedor: { nombre: string; apellido: string } | null;
  comisionPct: string | null;
  comisionMonto: number | null;
  planFinanciamiento: {
    sistema: string;
    plazoMeses: number;
    tasaAnual: string;
    cuotas?: Array<{
      id: string;
      numero: number;
      fechaVencimiento: string;
      montoCuota: number;
      capital: number;
      interes: number;
      saldoRestante: number;
      estado: string;
      montoPagado: number;
    }>;
  } | null;
}

export interface VentaDetallada {
  id: string;
  fechaVenta: string;
  precioBase: number;
  tipoImpuesto: string;
  tasaImpuesto: string;
  montoImpuesto: number;
  precioTotal: number;
  enganche: number;
  saldoFinanciar: number;
  moneda: string;
  estado: 'ACTIVA' | 'CANCELADA' | 'COMPLETADA';
  notas: string | null;
  cliente: {
    nombre: string;
    apellido: string;
    dpi: string | null;
    nit: string | null;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
  };
  lote: {
    codigo: string;
    area: string;
    precioBase: number;
    moneda: string;
    proyecto: {
      nombre: string;
      color: string;
      ubicacion: string | null;
      tipoImpuesto: string;
      tasaImpuesto: string;
    };
  };
  planFinanciamiento: {
    sistema: string;
    plazoMeses: number;
    tasaAnual: string;
    fechaPrimeraCuota: string;
    cuotas: Array<{
      id: string;
      numero: number;
      fechaVencimiento: string;
      montoCuota: number;
      capital: number;
      interes: number;
      saldoRestante: number;
      estado: string;
    }>;
  } | null;
}

export interface CreateVentaData {
  loteId: string;
  clienteId: string;
  vendedorId?: string;
  fechaVenta: string;
  enganche: number; // centavos
  moneda?: string;
  notas?: string;
  plan: {
    sistema: string;
    plazoMeses: number;
    tasaAnual: number; // fracción decimal
    fechaPrimeraCuota: string;
  };
}

export function useVentas() {
  return useQuery<Venta[]>({
    queryKey: ['ventas'],
    queryFn: async () => {
      const { data } = await api.get<Venta[]>('/api/ventas');
      return data;
    },
  });
}

export function useVenta(id: string) {
  return useQuery<VentaDetallada>({
    queryKey: ['ventas', id],
    queryFn: async () => {
      const { data } = await api.get<VentaDetallada>(`/api/ventas/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useSimularVenta() {
  return useMutation({
    mutationFn: async (datos: { loteId: string; enganche: number; plan: CreateVentaData['plan'] }) => {
      const { data } = await api.post<SimulacionVenta>('/api/ventas/simular', datos);
      return data;
    },
  });
}

export function useCrearVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: CreateVentaData) => {
      const { data } = await api.post<Venta>('/api/ventas', datos);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] });
      qc.invalidateQueries({ queryKey: ['lotes'] });
      qc.invalidateQueries({ queryKey: ['reservas'] });
    },
  });
}
