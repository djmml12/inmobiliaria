import { describe, it, expect } from 'vitest';
import { calcularTablaAmortizacion } from '../cuotas.js';

describe('SIN_INTERES', () => {
  it('divide el saldo exactamente cuando es divisible', () => {
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 120000,
      sistema: 'SIN_INTERES',
      plazoMeses: 12,
      tasaAnual: 0,
      fechaPrimeraCuota: new Date('2024-01-01'),
    });

    expect(tabla.filas).toHaveLength(12);
    for (const fila of tabla.filas) {
      expect(fila.cuota).toBe(10000);
      expect(fila.interes).toBe(0);
    }
    expect(tabla.totalCapital).toBe(120000);
    expect(tabla.totalIntereses).toBe(0);
    expect(tabla.filas.at(-1)!.saldo).toBe(0);
  });

  it('la última cuota absorbe el resto de centavos', () => {
    // 100001 / 3 = 33333.66... → 33333, 33333, 33335
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 100001,
      sistema: 'SIN_INTERES',
      plazoMeses: 3,
      tasaAnual: 0,
      fechaPrimeraCuota: new Date('2024-01-01'),
    });

    expect(tabla.filas[0].cuota).toBe(33333);
    expect(tabla.filas[1].cuota).toBe(33333);
    expect(tabla.filas[2].cuota).toBe(33335);
    expect(tabla.totalCapital).toBe(100001);
    expect(tabla.filas.at(-1)!.saldo).toBe(0);
  });

  it('genera las fechas correctamente mes a mes (incrementos de 1 mes)', () => {
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 30000,
      sistema: 'SIN_INTERES',
      plazoMeses: 3,
      tasaAnual: 0,
      fechaPrimeraCuota: new Date(2024, 2, 1), // 1 marzo 2024 en hora local
    });

    const mesBase = tabla.filas[0].fechaVencimiento.getMonth();
    expect(tabla.filas[1].fechaVencimiento.getMonth()).toBe((mesBase + 1) % 12);
    expect(tabla.filas[2].fechaVencimiento.getMonth()).toBe((mesBase + 2) % 12);
  });
});

describe('FRANCES', () => {
  it('cuota fija es igual en todos los períodos excepto el último', () => {
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 1000000,
      sistema: 'FRANCES',
      plazoMeses: 12,
      tasaAnual: 0.12,
      fechaPrimeraCuota: new Date('2024-01-01'),
    });

    expect(tabla.filas).toHaveLength(12);
    const cuotaBase = tabla.filas[0].cuota;
    for (let i = 0; i < 11; i++) {
      expect(tabla.filas[i].cuota).toBe(cuotaBase);
    }
    expect(tabla.totalCapital).toBe(1000000);
    expect(tabla.filas.at(-1)!.saldo).toBe(0);
  });

  it('el interés decrece y el capital aumenta con el tiempo', () => {
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 500000,
      sistema: 'FRANCES',
      plazoMeses: 6,
      tasaAnual: 0.12,
      fechaPrimeraCuota: new Date('2024-01-01'),
    });

    for (let i = 0; i < 5; i++) {
      expect(tabla.filas[i].interes).toBeGreaterThan(tabla.filas[i + 1].interes);
      expect(tabla.filas[i].capital).toBeLessThan(tabla.filas[i + 1].capital);
    }
  });

  it('con tasa cero se comporta como SIN_INTERES', () => {
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 120000,
      sistema: 'FRANCES',
      plazoMeses: 12,
      tasaAnual: 0,
      fechaPrimeraCuota: new Date('2024-01-01'),
    });

    expect(tabla.totalIntereses).toBe(0);
    expect(tabla.totalCapital).toBe(120000);
    expect(tabla.filas.at(-1)!.saldo).toBe(0);
  });
});

describe('ALEMAN', () => {
  it('capital constante con interés decreciente', () => {
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 120000,
      sistema: 'ALEMAN',
      plazoMeses: 3,
      tasaAnual: 0.12,
      fechaPrimeraCuota: new Date('2024-01-01'),
    });

    expect(tabla.filas).toHaveLength(3);
    expect(tabla.filas[0].capital).toBe(40000);
    expect(tabla.filas[1].capital).toBe(40000);
    // Las cuotas deben ser decrecientes
    expect(tabla.filas[0].cuota).toBeGreaterThan(tabla.filas[1].cuota);
    expect(tabla.filas[1].cuota).toBeGreaterThan(tabla.filas[2].cuota);
    // Los intereses deben decrecer
    expect(tabla.filas[0].interes).toBeGreaterThan(tabla.filas[1].interes);
    expect(tabla.filas[1].interes).toBeGreaterThan(tabla.filas[2].interes);
    expect(tabla.totalCapital).toBe(120000);
    expect(tabla.filas.at(-1)!.saldo).toBe(0);
  });

  it('la última cuota absorbe el resto cuando el saldo no es divisible', () => {
    // 100001 / 3 = 33333.66... → capital: 33333, 33333, 33335
    const tabla = calcularTablaAmortizacion({
      saldoFinanciar: 100001,
      sistema: 'ALEMAN',
      plazoMeses: 3,
      tasaAnual: 0,
      fechaPrimeraCuota: new Date('2024-01-01'),
    });

    expect(tabla.filas[0].capital).toBe(33333);
    expect(tabla.filas[1].capital).toBe(33333);
    expect(tabla.filas[2].capital).toBe(33335);
    expect(tabla.totalCapital).toBe(100001);
  });
});

describe('Invariantes (todos los sistemas)', () => {
  const casos = [
    { saldoFinanciar: 999999, plazoMeses: 7, tasaAnual: 0.18 },
    { saldoFinanciar: 500000, plazoMeses: 24, tasaAnual: 0.0 },
    { saldoFinanciar: 1, plazoMeses: 1, tasaAnual: 0.12 },
    { saldoFinanciar: 100000000, plazoMeses: 360, tasaAnual: 0.06 },
  ];

  for (const params of casos) {
    for (const sistema of ['SIN_INTERES', 'FRANCES', 'ALEMAN'] as const) {
      it(`sum(capital) === saldoFinanciar y saldo final === 0 — ${sistema} ${JSON.stringify(params)}`, () => {
        const tabla = calcularTablaAmortizacion({
          ...params,
          sistema,
          fechaPrimeraCuota: new Date('2024-01-01'),
        });

        expect(tabla.totalCapital).toBe(params.saldoFinanciar);
        expect(tabla.filas.at(-1)!.saldo).toBe(0);
        expect(tabla.filas).toHaveLength(params.plazoMeses);
      });
    }
  }

  it('rechaza saldoFinanciar no entero', () => {
    expect(() =>
      calcularTablaAmortizacion({
        saldoFinanciar: 100.5,
        sistema: 'SIN_INTERES',
        plazoMeses: 3,
        tasaAnual: 0,
        fechaPrimeraCuota: new Date(),
      }),
    ).toThrow();
  });
});
