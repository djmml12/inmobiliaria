import { describe, it, expect } from 'vitest';
import { calcularComision } from '../comisiones.js';

describe('Modo ABSORBIDA (default)', () => {
  it('empresa absorbe la comisión — cliente paga el monto original', () => {
    // Q 1,000 con 4.5% comisión
    const r = calcularComision({ monto: 100000, pct: 0.045 });
    expect(r.montoCliente).toBe(100000);
    expect(r.comision).toBe(4500);
    expect(r.netoRecibido).toBe(95500);
    expect(r.modo).toBe('ABSORBIDA');
  });

  it('incluye cargo fijo del procesador', () => {
    // 4.5% + Q 5.00 fijo
    const r = calcularComision({ monto: 100000, pct: 0.045, montoFijo: 500 });
    expect(r.comision).toBe(5000); // 4500 + 500
    expect(r.netoRecibido).toBe(95000);
  });

  it('sin cargo fijo y pct 0 — comisión es cero', () => {
    const r = calcularComision({ monto: 100000, pct: 0 });
    expect(r.comision).toBe(0);
    expect(r.netoRecibido).toBe(100000);
  });
});

describe('Modo RECARGO', () => {
  it('usa (1 - pct) — NUNCA × (1 + pct)', () => {
    // Empresa quiere recibir Q 1,000 neto con 4.5% comisión
    // montoCliente = 100000 / (1 - 0.045) = 104712.04... → 104712
    const r = calcularComision({ monto: 100000, pct: 0.045, modo: 'RECARGO' });
    expect(r.montoCliente).toBe(104712);
    expect(r.netoRecibido).toBe(100000);
    expect(r.modo).toBe('RECARGO');
  });

  it('verifica que × (1 + pct) sub-recupera — RECARGO recupera correctamente', () => {
    const monto = 100000;
    const pct = 0.045;
    const r = calcularComision({ monto, pct, modo: 'RECARGO' });

    // El neto real que recibirías si procesas montoCliente con comision pct:
    const neto = Math.round(r.montoCliente * (1 - pct));
    // Debe ser igual o muy cercano al monto deseado (diferencia máx 1 centavo por redondeo)
    expect(Math.abs(neto - monto)).toBeLessThanOrEqual(1);
  });

  it('modo RECARGO con cargo fijo', () => {
    // Empresa quiere neto de Q 100,000 con 4.5% + Q 5.00 fijo
    const r = calcularComision({ monto: 100000, pct: 0.045, montoFijo: 500, modo: 'RECARGO' });
    expect(r.montoCliente).toBeGreaterThan(100000);
    expect(r.netoRecibido).toBe(100000);
  });
});

describe('Validaciones', () => {
  it('rechaza monto negativo', () => {
    expect(() => calcularComision({ monto: -100, pct: 0.045 })).toThrow();
  });

  it('rechaza pct fuera de rango', () => {
    expect(() => calcularComision({ monto: 100000, pct: 1.5 })).toThrow();
  });

  it('rechaza pct negativo', () => {
    expect(() => calcularComision({ monto: 100000, pct: -0.01 })).toThrow();
  });
});
