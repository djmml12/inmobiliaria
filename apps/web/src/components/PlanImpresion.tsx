import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';

export interface DatosPlan {
  fechaDocumento: string;
  cliente?: {
    nombre: string;
    apellido: string;
    dpi?: string | null;
    nit?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
  };
  lote?: {
    codigo: string;
    area: string;
    proyecto: { nombre: string; ubicacion?: string | null };
  };
  financiero: {
    precioBase: number;
    tipoImpuesto: string;
    tasaImpuesto: number;
    montoImpuesto: number;
    precioTotal: number;
    enganche: number;
    saldoFinanciar: number;
    moneda: string;
    sistema: string;
    plazoMeses: number;
    tasaAnual: number;
    fechaPrimeraCuota: string;
    tabla: {
      filas: Array<{
        numero: number;
        fechaVencimiento: string;
        cuota: number;
        capital: number;
        interes: number;
        saldo: number;
      }>;
      totalPagar: number;
      totalIntereses: number;
    };
  };
}

function fmt(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function FechaCuota({ iso }: { iso: string }) {
  const d = new Date(iso);
  const diaMes = d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
  const anio = d.getFullYear();
  return (
    <span className="leading-tight">
      <span className="block">{diaMes}</span>
      <span className="block text-gray-400">{anio}</span>
    </span>
  );
}

const LABEL_SISTEMA: Record<string, string> = {
  SIN_INTERES: 'Sin interés',
  FRANCES: 'Francés (cuota fija)',
  ALEMAN: 'Alemán (capital constante)',
};

const LABEL_IMPUESTO: Record<string, string> = {
  IVA: 'IVA',
  TIMBRES: 'Timbres fiscales',
  EXENTO: 'Exento',
};

export function PlanImpresion({ datos, onCerrar }: { datos: DatosPlan; onCerrar: () => void }) {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'plan-impresion-css';
    style.textContent = `
      @media print {
        #root { display: none !important; }
        #plan-impresion-portal { position: static !important; overflow: visible !important; }
        .no-print { display: none !important; }
        @page { margin: 1.5cm; size: A4; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById('plan-impresion-css')?.remove(); };
  }, []);

  const { financiero: f, cliente, lote, fechaDocumento } = datos;

  return createPortal(
    <div id="plan-impresion-portal" className="fixed inset-0 z-[100] bg-white overflow-auto">
      {/* Barra de acciones (solo pantalla) */}
      <div className="no-print sticky top-0 z-10 bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Printer size={14} />
          Imprimir / Guardar PDF
        </button>
        <button
          onClick={onCerrar}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-600 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
        >
          <X size={14} />
          Cerrar
        </button>
        <p className="ml-1 text-xs text-gray-400">
          Para descargar como PDF: elige "Guardar como PDF" en el destino de impresión.
        </p>
      </div>

      {/* Documento */}
      <div className="max-w-[780px] mx-auto px-8 py-10 text-gray-800 text-sm">
        {/* Encabezado */}
        <div className="flex items-start justify-between mb-8 pb-5 border-b-2 border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PLAN DE FINANCIAMIENTO</h1>
            <p className="text-xs text-gray-400 mt-1">Documento de control interno — no constituye factura fiscal</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Fecha de emisión</p>
            <p className="font-semibold text-gray-700">{fmtFecha(new Date().toISOString())}</p>
            {fechaDocumento && (
              <>
                <p className="text-xs text-gray-400 mt-1">Fecha de venta</p>
                <p className="font-semibold text-gray-700">{fmtFecha(fechaDocumento)}</p>
              </>
            )}
          </div>
        </div>

        {/* Datos del cliente */}
        {cliente && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 pb-1 border-b border-gray-200">
              Datos del cliente
            </h2>
            <div className="grid grid-cols-2 gap-x-10 gap-y-1.5">
              <div>
                <span className="text-gray-400">Nombre: </span>
                <span className="font-semibold">{cliente.apellido}, {cliente.nombre}</span>
              </div>
              {cliente.dpi && (
                <div>
                  <span className="text-gray-400">DPI: </span>
                  <span>{cliente.dpi}</span>
                </div>
              )}
              {cliente.nit && (
                <div>
                  <span className="text-gray-400">NIT: </span>
                  <span>{cliente.nit}</span>
                </div>
              )}
              {cliente.telefono && (
                <div>
                  <span className="text-gray-400">Teléfono: </span>
                  <span>{cliente.telefono}</span>
                </div>
              )}
              {cliente.email && (
                <div>
                  <span className="text-gray-400">Email: </span>
                  <span>{cliente.email}</span>
                </div>
              )}
              {cliente.direccion && (
                <div className="col-span-2">
                  <span className="text-gray-400">Dirección: </span>
                  <span>{cliente.direccion}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Datos del inmueble */}
        {lote && (
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 pb-1 border-b border-gray-200">
              Datos del inmueble
            </h2>
            <div className="grid grid-cols-2 gap-x-10 gap-y-1.5">
              <div>
                <span className="text-gray-400">Proyecto: </span>
                <span className="font-semibold">{lote.proyecto.nombre}</span>
              </div>
              <div>
                <span className="text-gray-400">Lote: </span>
                <span className="font-semibold">{lote.codigo}</span>
              </div>
              <div>
                <span className="text-gray-400">Área: </span>
                <span>{parseFloat(lote.area).toFixed(2)} m²</span>
              </div>
              {lote.proyecto.ubicacion && (
                <div className="col-span-2">
                  <span className="text-gray-400">Ubicación: </span>
                  <span>{lote.proyecto.ubicacion}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Condiciones de financiamiento */}
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 pb-1 border-b border-gray-200">
            Condiciones de financiamiento
          </h2>

          {/* Resumen de montos */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded border border-gray-200 p-3 bg-gray-50">
              <p className="text-xs text-gray-400 mb-0.5">Precio base</p>
              <p className="font-bold">{fmt(f.precioBase, f.moneda)}</p>
            </div>
            <div className="rounded border border-gray-200 p-3 bg-gray-50">
              <p className="text-xs text-gray-400 mb-0.5">
                {LABEL_IMPUESTO[f.tipoImpuesto] ?? f.tipoImpuesto}
                {f.tipoImpuesto !== 'EXENTO' ? ` (${(f.tasaImpuesto * 100).toFixed(0)}%)` : ''}
              </p>
              <p className="font-bold">{fmt(f.montoImpuesto, f.moneda)}</p>
            </div>
            <div className="rounded border-2 border-gray-800 p-3 bg-gray-800 text-white">
              <p className="text-xs text-gray-300 mb-0.5">Precio total</p>
              <p className="font-bold">{fmt(f.precioTotal, f.moneda)}</p>
            </div>
            <div className="rounded border border-gray-200 p-3 bg-gray-50">
              <p className="text-xs text-gray-400 mb-0.5">Enganche</p>
              <p className="font-bold">{fmt(f.enganche, f.moneda)}</p>
            </div>
            <div className="rounded border border-gray-200 p-3 bg-gray-50">
              <p className="text-xs text-gray-400 mb-0.5">Saldo a financiar</p>
              <p className="font-bold">{fmt(f.saldoFinanciar, f.moneda)}</p>
            </div>
            <div className="rounded border border-green-300 p-3 bg-green-50">
              <p className="text-xs text-green-600 mb-0.5">Total a pagar</p>
              <p className="font-bold text-green-800">{fmt(f.tabla.totalPagar, f.moneda)}</p>
            </div>
          </div>

          {/* Parámetros del plan */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-1.5">
            <div>
              <span className="text-gray-400">Sistema: </span>
              <span className="font-semibold">{LABEL_SISTEMA[f.sistema] ?? f.sistema}</span>
            </div>
            <div>
              <span className="text-gray-400">Plazo: </span>
              <span className="font-semibold">{f.plazoMeses} meses ({(f.plazoMeses / 12).toFixed(1)} años)</span>
            </div>
            <div>
              <span className="text-gray-400">Tasa anual: </span>
              <span className="font-semibold">{(f.tasaAnual * 100).toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-gray-400">Primera cuota: </span>
              <span className="font-semibold">{fmtFecha(f.fechaPrimeraCuota)}</span>
            </div>
            {f.tabla.totalIntereses > 0 && (
              <div>
                <span className="text-gray-400">Total intereses: </span>
                <span className="font-semibold">{fmt(f.tabla.totalIntereses, f.moneda)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Tabla de amortización */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 pb-1 border-b border-gray-200">
            Tabla de amortización — {f.tabla.filas.length} cuotas
          </h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Vencimiento</th>
                <th className="px-3 py-2 text-right font-medium">Cuota</th>
                <th className="px-3 py-2 text-right font-medium">Capital</th>
                <th className="px-3 py-2 text-right font-medium">Interés</th>
                <th className="px-3 py-2 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {f.tabla.filas.map((fila, i) => (
                <tr key={fila.numero} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td className="px-3 py-1.5 text-gray-400">{fila.numero}</td>
                  <td className="px-3 py-1"><FechaCuota iso={String(fila.fechaVencimiento)} /></td>
                  <td className="px-3 py-1.5 text-right font-semibold">{fmt(fila.cuota, f.moneda)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-600">{fmt(fila.capital, f.moneda)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-400">{fmt(fila.interes, f.moneda)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-400">{fmt(fila.saldo, f.moneda)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800 font-bold bg-gray-50">
                <td className="px-3 py-2 text-gray-400" colSpan={2}>Total</td>
                <td className="px-3 py-2 text-right">{fmt(f.tabla.totalPagar, f.moneda)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{fmt(f.saldoFinanciar, f.moneda)}</td>
                <td className="px-3 py-2 text-right text-gray-400">{fmt(f.tabla.totalIntereses, f.moneda)}</td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          </table>
        </section>

        {/* Firmas */}
        <div className="mt-16 grid grid-cols-2 gap-16">
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="text-xs text-gray-500 text-center">Firma del cliente</p>
              {cliente && (
                <p className="text-xs text-gray-400 text-center mt-1">{cliente.apellido}, {cliente.nombre}</p>
              )}
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="text-xs text-gray-500 text-center">Firma del vendedor</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
