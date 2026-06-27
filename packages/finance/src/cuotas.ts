export type SistemaAmortizacion = 'SIN_INTERES' | 'FRANCES' | 'ALEMAN';

export interface FilaCuota {
  numero: number;
  fechaVencimiento: Date;
  cuota: number;    // centavos
  capital: number;  // centavos
  interes: number;  // centavos
  saldo: number;    // centavos (saldo DESPUÉS del pago)
}

export interface TablaAmortizacion {
  filas: FilaCuota[];
  totalPagar: number;     // centavos
  totalIntereses: number; // centavos
  totalCapital: number;   // centavos
}

export interface ParamsAmortizacion {
  saldoFinanciar: number;       // centavos (entero positivo)
  sistema: SistemaAmortizacion;
  plazoMeses: number;           // entero positivo
  tasaAnual: number;            // fracción decimal, ej: 0.12 = 12%
  fechaPrimeraCuota: Date;
}

function sumarMeses(fecha: Date, meses: number): Date {
  const d = new Date(fecha);
  d.setMonth(d.getMonth() + meses);
  return d;
}

export function calcularTablaAmortizacion(params: ParamsAmortizacion): TablaAmortizacion {
  const { saldoFinanciar, sistema, plazoMeses: n, tasaAnual, fechaPrimeraCuota } = params;

  if (!Number.isInteger(saldoFinanciar) || saldoFinanciar <= 0)
    throw new Error('saldoFinanciar debe ser un entero positivo (centavos)');
  if (!Number.isInteger(n) || n <= 0)
    throw new Error('plazoMeses debe ser un entero positivo');
  if (tasaAnual < 0)
    throw new Error('tasaAnual no puede ser negativa');

  const filas: FilaCuota[] = [];

  if (sistema === 'SIN_INTERES') {
    const cuotaBase = Math.floor(saldoFinanciar / n);
    let saldo = saldoFinanciar;

    for (let k = 1; k <= n; k++) {
      const capital = k === n ? saldo : cuotaBase;
      saldo -= capital;
      filas.push({
        numero: k,
        fechaVencimiento: sumarMeses(fechaPrimeraCuota, k - 1),
        cuota: capital,
        capital,
        interes: 0,
        saldo,
      });
    }
  } else if (sistema === 'FRANCES') {
    const i = tasaAnual / 12;
    let cuotaFija: number;

    if (i === 0) {
      cuotaFija = Math.round(saldoFinanciar / n);
    } else {
      const factor = Math.pow(1 + i, n);
      cuotaFija = Math.round((saldoFinanciar * i * factor) / (factor - 1));
    }

    let saldo = saldoFinanciar;

    for (let k = 1; k <= n; k++) {
      const interes = Math.round(saldo * i);

      if (k === n) {
        // La última cuota absorbe la diferencia de centavos
        const capital = saldo;
        const cuota = capital + interes;
        saldo = 0;
        filas.push({
          numero: k,
          fechaVencimiento: sumarMeses(fechaPrimeraCuota, k - 1),
          cuota,
          capital,
          interes,
          saldo,
        });
      } else {
        const capital = cuotaFija - interes;
        saldo -= capital;
        filas.push({
          numero: k,
          fechaVencimiento: sumarMeses(fechaPrimeraCuota, k - 1),
          cuota: cuotaFija,
          capital,
          interes,
          saldo,
        });
      }
    }
  } else {
    // ALEMAN: capital constante, interés sobre saldo decreciente
    const i = tasaAnual / 12;
    const capitalBase = Math.floor(saldoFinanciar / n);
    let saldo = saldoFinanciar;

    for (let k = 1; k <= n; k++) {
      const interes = Math.round(saldo * i);
      const capital = k === n ? saldo : capitalBase;
      const cuota = capital + interes;
      saldo -= capital;
      filas.push({
        numero: k,
        fechaVencimiento: sumarMeses(fechaPrimeraCuota, k - 1),
        cuota,
        capital,
        interes,
        saldo,
      });
    }
  }

  const totalCapital = filas.reduce((s, f) => s + f.capital, 0);
  const totalIntereses = filas.reduce((s, f) => s + f.interes, 0);
  const totalPagar = filas.reduce((s, f) => s + f.cuota, 0);

  return { filas, totalPagar, totalIntereses, totalCapital };
}
