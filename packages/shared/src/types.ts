import type {
  Moneda,
  TipoImpuesto,
  SistemaAmortizacion,
  EstadoLote,
  EstadoVenta,
  EstadoCuota,
  MedioPago,
  RolNombre,
} from './enums.js';

export interface UsuarioPayload {
  sub: string;
  username: string;
  nombre: string;
  rol: RolNombre;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    pagina?: number;
    porPagina?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface ProyectoBase {
  id: string;
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  tipoImpuesto: TipoImpuesto;
  tasaImpuesto: string;
  moneda: Moneda;
  activo: boolean;
  createdAt: string;
}

export interface LoteBase {
  id: string;
  proyectoId: string;
  codigo: string;
  area: string;
  precioBase: number;
  moneda: Moneda;
  estado: EstadoLote;
  descripcion?: string | null;
}

export interface ClienteBase {
  id: string;
  nombre: string;
  apellido: string;
  nit?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  createdAt: string;
}

export interface VentaBase {
  id: string;
  loteId: string;
  clienteId: string;
  fechaVenta: string;
  precioBase: number;
  tipoImpuesto: TipoImpuesto;
  tasaImpuesto: string;
  montoImpuesto: number;
  precioTotal: number;
  enganche: number;
  saldoFinanciar: number;
  moneda: Moneda;
  estado: EstadoVenta;
  createdAt: string;
}

export interface CuotaBase {
  id: string;
  planId: string;
  numero: number;
  fechaVencimiento: string;
  montoCuota: number;
  capital: number;
  interes: number;
  saldoRestante: number;
  estado: EstadoCuota;
  montoPagado: number;
}

export interface PagoBase {
  id: string;
  cuotaId: string;
  fecha: string;
  monto: number;
  moneda: Moneda;
  medioPago: MedioPago;
  procesador?: string | null;
  comisionPct?: string | null;
  comisionMonto?: number | null;
  netoRecibido: number;
  notas?: string | null;
  createdAt: string;
}

export interface PlanFinanciamientoBase {
  id: string;
  ventaId: string;
  sistema: SistemaAmortizacion;
  plazoMeses: number;
  tasaAnual: string;
  fechaPrimeraCuota: string;
}
