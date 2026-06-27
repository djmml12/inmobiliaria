import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface PagoRegistrado {
  id: string;
  fecha: string;
  monto: number;
  medioPago: string;
  netoRecibido: number;
  notas: string | null;
  comprobante: string | null;
}

export interface CuotaDetalle {
  id: string;
  numero: number;
  fechaVencimiento: string;
  montoCuota: number;
  capital: number;
  interes: number;
  saldoRestante: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'VENCIDA';
  montoPagado: number;
  pagos: PagoRegistrado[];
}

export interface VentaHistorial {
  id: string;
  fechaVenta: string;
  estado: string;
  moneda: string;
  precioTotal: number;
  enganche: number;
  saldoFinanciar: number;
  lote: string;
  proyecto: string;
  color: string;
  plan: {
    sistema: string;
    plazoMeses: number;
    tasaAnual: string;
    diaPago: number;
    cuotas: CuotaDetalle[];
  } | null;
}

export interface HistorialCliente {
  clienteId: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  ventas: VentaHistorial[];
}

export type Semaforo = 'verde' | 'amarillo' | 'rojo';

export interface ResumenCliente {
  clienteId: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  semaforo: Semaforo | null;
  cuotasVencidas: number;
  proximaCuota: {
    numero: number;
    fecha: string;
    monto: number;
    montoPagado: number;
    moneda: string;
  } | null;
  diasHastaProxima: number | null;
  saldoTotal: number;
  ventas: Array<{
    id: string;
    lote: string;
    proyecto: string;
    color: string;
    moneda: string;
    diaPago: number | null;
  }>;
}

export function useHistorialCliente(clienteId: string | null) {
  return useQuery<HistorialCliente>({
    queryKey: ['pagos', 'historial', clienteId],
    queryFn: async () => {
      const { data } = await api.get<HistorialCliente>(`/api/pagos/historial/${clienteId}`);
      return data;
    },
    enabled: !!clienteId,
  });
}

export interface RegistrarPagoData {
  cuotaId: string;
  clienteId: string;
  fecha: string;
  monto: number;
  medioPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'CHEQUE';
  notas?: string;
}

export function useRegistrarPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cuotaId, clienteId: _cid, ...dto }: RegistrarPagoData) => {
      const { data } = await api.post(`/api/pagos/cuota/${cuotaId}`, dto);
      return data as { comprobante: { numero: string }; cuotaEstado: string };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pagos', 'historial', vars.clienteId] });
      qc.invalidateQueries({ queryKey: ['pagos', 'resumen-clientes'] });
    },
  });
}

export interface CobroMes {
  id: string;
  fecha: string;
  monto: number;
  moneda: string;
  medioPago: string;
  netoRecibido: number;
  numeroCuota: number;
  cliente: { nombre: string; apellido: string };
  lote: string;
}

export function useCobrosMes() {
  return useQuery<CobroMes[]>({
    queryKey: ['pagos', 'cobros-mes'],
    queryFn: async () => {
      const { data } = await api.get<CobroMes[]>('/api/pagos/cobros-mes');
      return data;
    },
  });
}

export function useResumenPagos() {
  return useQuery<ResumenCliente[]>({
    queryKey: ['pagos', 'resumen-clientes'],
    queryFn: async () => {
      const { data } = await api.get<ResumenCliente[]>('/api/pagos/resumen-clientes');
      return data;
    },
    refetchInterval: 60_000,
  });
}

export function useActualizarDiaPago(clienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ventaId, diaPago }: { ventaId: string; diaPago: 1 | 15 }) => {
      const { data } = await api.patch(`/api/ventas/${ventaId}/dia-pago`, { diaPago });
      return data as { diaPago: number; cuotasRedatadas: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pagos', 'historial', clienteId] });
      qc.invalidateQueries({ queryKey: ['pagos', 'resumen-clientes'] });
    },
  });
}
