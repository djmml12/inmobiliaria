export type TipoImpuesto = 'IVA' | 'TIMBRES' | 'EXENTO';

export interface ResultadoImpuesto {
  tipo: TipoImpuesto;
  tasa: number;    // fracción (ej: 0.12)
  base: number;    // centavos
  monto: number;   // centavos (informativo — NO es un documento fiscal)
  total: number;   // centavos (base + monto)
}

export interface ParamsImpuesto {
  base: number;         // centavos (entero positivo)
  tipo: TipoImpuesto;
  tasa: number;         // fracción configurable, ej: 0.12 o 0.03
}

/**
 * Calcula el impuesto de forma informativa.
 * Este sistema NO emite documentos fiscales. El cálculo es solo para control interno.
 */
export function calcularImpuesto(params: ParamsImpuesto): ResultadoImpuesto {
  const { base, tipo, tasa } = params;

  if (!Number.isInteger(base) || base < 0)
    throw new Error('base debe ser un entero no negativo (centavos)');
  if (tasa < 0 || tasa > 1)
    throw new Error('tasa debe estar entre 0 y 1');

  if (tipo === 'EXENTO') {
    return { tipo, tasa: 0, base, monto: 0, total: base };
  }

  const monto = Math.round(base * tasa);
  return { tipo, tasa, base, monto, total: base + monto };
}

export function calcularPrecioTotal(params: {
  precioBase: number;   // centavos
  tipo: TipoImpuesto;
  tasa: number;
  otrosCargos?: number; // centavos
}): ResultadoImpuesto & { otrosCargos: number } {
  const { precioBase, tipo, tasa, otrosCargos = 0 } = params;
  const resultado = calcularImpuesto({ base: precioBase, tipo, tasa });
  return {
    ...resultado,
    total: resultado.total + otrosCargos,
    otrosCargos,
  };
}
