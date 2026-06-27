export enum Moneda {
  GTQ = 'GTQ',
  USD = 'USD',
}

export enum TipoImpuesto {
  IVA = 'IVA',
  TIMBRES = 'TIMBRES',
  EXENTO = 'EXENTO',
}

export enum SistemaAmortizacion {
  SIN_INTERES = 'SIN_INTERES',
  FRANCES = 'FRANCES',
  ALEMAN = 'ALEMAN',
}

export enum EstadoLote {
  DISPONIBLE = 'DISPONIBLE',
  RESERVADO = 'RESERVADO',
  VENDIDO = 'VENDIDO',
  BLOQUEADO = 'BLOQUEADO',
}

export enum EstadoVenta {
  ACTIVA = 'ACTIVA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
}

export enum EstadoReserva {
  ACTIVA = 'ACTIVA',
  CANCELADA = 'CANCELADA',
  CONVERTIDA = 'CONVERTIDA',
}

export enum EstadoCuota {
  PENDIENTE = 'PENDIENTE',
  PARCIAL = 'PARCIAL',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
}

export enum MedioPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  CHEQUE = 'CHEQUE',
}

export enum RolNombre {
  ADMINISTRADOR = 'ADMINISTRADOR',
  SUPERVISOR = 'SUPERVISOR',
  RECEPCIONISTA = 'RECEPCIONISTA',
}

export enum ModoComision {
  ABSORBIDA = 'ABSORBIDA',
  RECARGO = 'RECARGO',
}
