import { describe, it, expect } from 'vitest';
import { calcularImpuesto, calcularPrecioTotal } from '../impuestos.js';

describe('calcularImpuesto', () => {
  it('IVA 12% sobre precio base', () => {
    const r = calcularImpuesto({ base: 10000, tipo: 'IVA', tasa: 0.12 });
    expect(r.monto).toBe(1200);
    expect(r.total).toBe(11200);
    expect(r.tipo).toBe('IVA');
  });

  it('Timbres 3% sobre precio base', () => {
    const r = calcularImpuesto({ base: 10000, tipo: 'TIMBRES', tasa: 0.03 });
    expect(r.monto).toBe(300);
    expect(r.total).toBe(10300);
  });

  it('EXENTO no aplica impuesto sin importar la tasa', () => {
    const r = calcularImpuesto({ base: 10000, tipo: 'EXENTO', tasa: 0.12 });
    expect(r.monto).toBe(0);
    expect(r.tasa).toBe(0);
    expect(r.total).toBe(10000);
  });

  it('la tasa es configurable (no hardcodeada)', () => {
    const r = calcularImpuesto({ base: 100000, tipo: 'IVA', tasa: 0.15 });
    expect(r.monto).toBe(15000);
    expect(r.total).toBe(115000);
  });

  it('redondea correctamente al centavo más cercano', () => {
    // 10001 × 0.12 = 1200.12 → redondea a 1200
    const r = calcularImpuesto({ base: 10001, tipo: 'IVA', tasa: 0.12 });
    expect(r.monto).toBe(1200);
  });

  it('rechaza base negativa', () => {
    expect(() => calcularImpuesto({ base: -100, tipo: 'IVA', tasa: 0.12 })).toThrow();
  });
});

describe('calcularPrecioTotal', () => {
  it('incluye otros cargos en el total', () => {
    const r = calcularPrecioTotal({
      precioBase: 100000,
      tipo: 'IVA',
      tasa: 0.12,
      otrosCargos: 5000,
    });
    expect(r.monto).toBe(12000);
    expect(r.total).toBe(117000); // 100000 + 12000 + 5000
    expect(r.otrosCargos).toBe(5000);
  });

  it('sin otros cargos total es base + impuesto', () => {
    const r = calcularPrecioTotal({ precioBase: 50000, tipo: 'IVA', tasa: 0.12 });
    expect(r.total).toBe(56000);
    expect(r.otrosCargos).toBe(0);
  });
});
