export type ModoComision = 'ABSORBIDA' | 'RECARGO';

export interface ResultadoComision {
  montoCliente: number;  // centavos (lo que paga el cliente)
  comision: number;      // centavos (costo de la comisión)
  netoRecibido: number;  // centavos (lo que recibe la empresa)
  modo: ModoComision;
  pct: number;           // fracción
  montoFijo: number;     // centavos (cargo fijo adicional)
}

export interface ParamsComision {
  monto: number;         // centavos: cuota a cobrar (modo ABSORBIDA) o neto deseado (modo RECARGO)
  pct: number;           // fracción, ej: 0.045
  montoFijo?: number;    // centavos, cargo fijo adicional del procesador
  modo?: ModoComision;   // default: ABSORBIDA
}

/**
 * Modo ABSORBIDA (default): empresa absorbe la comisión.
 *   comision = monto × pct + montoFijo
 *   netoRecibido = monto − comision
 *
 * Modo RECARGO: se traslada al cliente para que la empresa reciba `monto` neto.
 *   montoCliente = (monto + montoFijo) / (1 − pct)
 *   ADVERTENCIA: el Art. 33 de la Ley de Tarjetas de Crédito de Guatemala
 *   restringe trasladar recargos explícitos al tarjetahabiente.
 *   Usar solo con aviso legal y aprobación del administrador.
 *
 * NUNCA usar × (1 + pct) — sub-recupera la comisión.
 */
export function calcularComision(params: ParamsComision): ResultadoComision {
  const { monto, pct, montoFijo = 0, modo = 'ABSORBIDA' } = params;

  if (!Number.isInteger(monto) || monto <= 0)
    throw new Error('monto debe ser un entero positivo (centavos)');
  if (pct < 0 || pct >= 1)
    throw new Error('pct debe estar entre 0 y 1 (exclusivo)');
  if (!Number.isInteger(montoFijo) || montoFijo < 0)
    throw new Error('montoFijo debe ser un entero no negativo (centavos)');

  if (modo === 'ABSORBIDA') {
    const comision = Math.round(monto * pct) + montoFijo;
    const netoRecibido = monto - comision;
    return { montoCliente: monto, comision, netoRecibido, modo, pct, montoFijo };
  } else {
    // RECARGO: montoCliente = (monto + montoFijo) / (1 - pct)
    const montoCliente = Math.round((monto + montoFijo) / (1 - pct));
    const comision = montoCliente - monto;
    return { montoCliente, comision, netoRecibido: monto, modo, pct, montoFijo };
  }
}
