import { useRef } from 'react';
import { ArrowLeft, Printer, CheckCircle } from 'lucide-react';
import type { SimulacionVenta } from '../hooks/useVentas';
import type { Cliente } from '../hooks/useClientes';
import type { Lote } from '../hooks/useLotes';

// ─── Constantes del negocio ───────────────────────────────────────────────────

const VENDEDOR_NOMBRE   = 'CHRISTIAN JOSUE BARRIOS MEJICANOS';
const VENDEDOR_NOMBRE_T = 'Christian Josué Barrios Mejicanos';
const VENDEDOR_DPI      = '2710 23572 0101';
const VENDEDOR_DPI_LETRAS =
  'DOS MIL SETECIENTOS DIEZ ESPACIO, VEINTITRES MIL QUINIENTOS SESENTA Y DOS ESPACIO, CERO CIENTO UNO';
const MUNICIPIO   = 'Ayutla';
const DEPARTAMENTO = 'San Marcos';
const FINCA       = 'seis mil quinientos noventa y uno (6,591)';
const FOLIO       = 'noventa y uno (91)';
const LIBRO       = 'trescientos catorce E. (314 E)';
const AREA_TOTAL  = 'CUARENTA MIL SETECIENTOS TREINTA Y OCHO PUNTO SESENTA Y SIETE METROS CUADRADOS';
const OFICINA_PAGO = `depósito bancario a la cuenta de la o los representantes legales del propietario del fraccionamiento o en efectivo en oficina central de ICB Inversiones y Desarrollos, ubicada en: ${MUNICIPIO}, del departamento de ${DEPARTAMENTO}`;

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmtQ(centavos: number) {
  return `Q${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFechaCorta(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

const MESES_ES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

const DIAS_ES = [
  'uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez',
  'once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho',
  'diecinueve','veinte','veintiuno','veintidós','veintitrés','veinticuatro',
  'veinticinco','veintiséis','veintisiete','veintiocho','veintinueve','treinta',
  'treinta y uno',
];

function fechaEnLetras(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return `${DIAS_ES[d.getDate() - 1] ?? d.getDate()} de ${MESES_ES[d.getMonth()]} del año ${d.getFullYear()}`;
}

function sumarMeses(iso: string, meses: number): Date {
  const d = new Date(iso + 'T12:00:00');
  d.setMonth(d.getMonth() + meses);
  return d;
}

// ─── Número a letras (para DPI) ───────────────────────────────────────────────

const UNIDADES = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE',
  'DIECIOCHO', 'DIECINUEVE',
];
const DECENAS = [
  '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
];
const CENTENAS = [
  '', 'CIENTO', 'DOCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

function _decenas(n: number): string {
  if (n < 20) return UNIDADES[n];
  if (n === 20) return 'VEINTE';
  if (n < 30) return 'VEINTI' + UNIDADES[n - 20];
  const d = Math.floor(n / 10), u = n % 10;
  return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`;
}

function _cientos(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100), r = n % 100;
  const base = c > 0 ? CENTENAS[c] : '';
  if (r === 0) return base;
  return base ? `${base} ${_decenas(r)}` : _decenas(r);
}

function _miles(n: number): string {
  if (n === 0) return '';
  const miles = Math.floor(n / 1000), r = n % 1000;
  let parte = '';
  if (miles === 1) parte = 'MIL';
  else parte = `${_cientos(miles)} MIL`;
  if (r === 0) return parte;
  return `${parte} ${_cientos(r)}`;
}

function grupoEnLetras(grupo: string): string {
  // Detecta ceros iniciales
  const ceros = grupo.match(/^(0+)/)?.[1].length ?? 0;
  const num = parseInt(grupo, 10);
  if (num === 0) return Array(grupo.length).fill('CERO').join(' ');
  const letras = grupo.length <= 3 ? _cientos(num) : _miles(num);
  if (ceros === 0) return letras;
  return Array(ceros).fill('CERO').join(' ') + ' ' + letras;
}

function dpiEnLetras(dpi: string | null | undefined): string {
  if (!dpi) return '______________________________';
  const grupos = dpi.trim().split(/\s+/);
  return grupos.map(grupoEnLetras).join(' ESPACIO, ');
}

// ─── Estilos CSS para impresión ───────────────────────────────────────────────

const CSS_IMPRESION = `
  @page {
    size: letter portrait;
    margin: 14mm 16mm;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 9.5pt; color: #000; }
  .pagina {
    width: 100%;
    page-break-after: always;
    page-break-inside: avoid-column;
  }
  .pagina:last-child { page-break-after: auto; }
  h1 { font-size: 11.5pt; text-align: center; text-transform: uppercase; letter-spacing: 1pt; margin-bottom: 8pt; font-weight: bold; }
  p { margin-bottom: 5pt; text-align: justify; line-height: 1.38; }
  .clausula-titulo { font-weight: bold; text-transform: uppercase; }
  .firma-row { display: flex; justify-content: space-between; gap: 30pt; margin-top: 30pt; }
  .firma { flex: 1; text-align: center; }
  .firma-linea { border-bottom: 1pt solid #000; margin-bottom: 4pt; height: 28pt; }
  .firma-nombre { font-weight: bold; font-size: 9pt; text-transform: uppercase; }
  .monto { font-weight: bold; }
  .inline-dato { font-weight: bold; text-decoration: underline; }
  .p1-espaciado { margin-top: 40pt; }
`;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DatosContrato {
  fechaVenta: string;
  cliente: Cliente;
  lote: Lote;
  simulacion: SimulacionVenta;
  sistema: string;
  plazoMeses: number;
  tasaAnualPct: number;
  fechaPrimeraCuota: string;
  medioPago: string;
  notas?: string;
}

interface Props {
  datos: DatosContrato;
  onVolver: () => void;
  onConfirmar: () => void;
  confirmando: boolean;
  error?: string | null;
}

// ─── Generador del HTML de impresión ─────────────────────────────────────────

function generarHtmlContrato(datos: DatosContrato): string {
  const { fechaVenta, cliente, lote, simulacion, plazoMeses, fechaPrimeraCuota } = datos;

  const nombreCompletoT = `${cliente.nombre} ${cliente.apellido}`;
  const dpiNum  = cliente.dpi ?? '______________________';
  const dpiLetras = dpiEnLetras(cliente.dpi);
  const cuotaMensual = simulacion.tabla.filas[0]?.cuota ?? 0;
  const precioBase = simulacion.precioBase;
  const enganche   = simulacion.enganche;
  const saldo      = simulacion.saldoFinanciar;
  const area       = parseFloat(String(lote.area)).toLocaleString('es-GT', { minimumFractionDigits: 2 });

  const fechaFin = sumarMeses(fechaPrimeraCuota, plazoMeses - 1);
  const fechaFinStr = `${String(fechaFin.getDate()).padStart(2,'0')}/${String(fechaFin.getMonth()+1).padStart(2,'0')}/${fechaFin.getFullYear()}`;

  // ── PÁGINA 1: Legalización de firmas ──────────────────────────────────────
  const pagina1 = `
<div class="pagina">
  <p>EN EL MUNICIPIO DE ${MUNICIPIO.toUpperCase()} DEL DEPARTAMENTO DE ${DEPARTAMENTO.toUpperCase()} EL DIA DE
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${fmtFechaCorta(fechaVenta)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  YO, COMO NOTARIO DOY FE: A) QUE LAS FIRMAS QUE ANTECEDEN, SON AUTENTICAS, POR HABER SIDO PUESTAS EL DIA DE HOY
  POR: &nbsp;&nbsp;<span class="inline-dato">${nombreCompletoT}</span></p>

  <p>${dpiNum}&nbsp;&nbsp;&nbsp;${dpiLetras}.</p>

  <p>Y POR: ${VENDEDOR_NOMBRE}, QUIEN SE IDENTIFICA CON DOCUMENTO PERSONAL DE IDENTIFICACION CON CODIGO UNICO
  NUMERO: ${VENDEDOR_DPI_LETRAS} (${VENDEDOR_DPI}) EXTENDIDO POR EL REGISTRO NACIONAL DE LAS PERSONAS DE LA
  REPUBLICA DE GUATEMALA. B) QUE LAS FIRMAS QUE CALZAN EN ESTE DOCUMENTO DE PAGO, COMO UN ACTO DE BUENA FE
  DE AMBAS PARTES, PARA LA COMPRA DE UNA FRACCION DE TERRENO EN LA PROPIEDAD DE ${VENDEDOR_NOMBRE},
  CONTENIDO EN UNA HOJA DE PAPEL BOND EN SU LADO ANVERSO, CONTINUANDO LA PRESENTE LEGALIZACION DE FIRMAS
  DE ESTA MISMA HOJA. C) QUIENES VUELVEN A FIRMAR LA PRESENTE ACTA DE LEGALIZACION DE FIRMAS,
  JUNTAMENTE CON EL NOTARIO QUE AUTORIZA.</p>

  <div class="firma-row p1-espaciado">
    <div class="firma">
      <div class="firma-linea"></div>
      <div class="firma-nombre">COMPRADOR: ${nombreCompletoT}</div>
    </div>
    <div class="firma">
      <div class="firma-linea"></div>
      <div class="firma-nombre">REPRESENTANTE LEGAL: ${VENDEDOR_NOMBRE_T}</div>
    </div>
  </div>
</div>`;

  // ── PÁGINA 2: Promesa de Venta ─────────────────────────────────────────────
  const pagina2 = `
<div class="pagina">
  <h1>Promesa de Venta</h1>

  <p><span class="clausula-titulo">Condiciones Generales de la Compraventa:</span>
  El comprador con el presente contrato se obliga a comprar el inmueble en el precio, plazo y condiciones
  establecidas, siendo el día <span class="inline-dato">${fechaEnLetras(fechaVenta)}</span>.</p>

  <p><span class="clausula-titulo">De las Cuotas:</span>
  El comprador se obliga a pagar el saldo pendiente de pago a partir de la fecha indicada en forma mensual,
  vencida y consecutiva. Las cuotas de pago mensual únicamente deberán realizarse a través de
  ${OFICINA_PAGO}. No se acepta ni nos responsabilizamos por pagos realizados a terceras personas,
  incluyendo vendedores o supervisores de ventas.</p>

  <p><span class="clausula-titulo">Del Inmueble:</span>
  La parte promitente vendedora declara ser legítima propietaria de un bien inmueble, ubicado
  Colonia la Verde, del Municipio de ${MUNICIPIO}, del Departamento de ${DEPARTAMENTO},
  inmueble que cuenta con una extensión superficial de: ${AREA_TOTAL}, comprendido dentro de las
  medidas y colindancias que le aparecen en su respectiva escritura, con sus mojones y esquineros
  bien reconocidos en sus cuatro costados, inscritas en el Registro de La Propiedad con la finca
  Matriz con el numero: ${FINCA}; folio número: ${FOLIO}; libro número: ${LIBRO}.
  Finca sobre la cual no pesa ningún tipo de gravamen, anotación o limitación.</p>

  <p><span class="clausula-titulo">De la Promesa de Venta:</span>
  El promitente vendedor, declara que por el precio de:
  &nbsp;&nbsp;<span class="monto">${fmtQ(precioBase)}&nbsp;&nbsp;Quetzales Guatemaltecos.</span>
  promete en venta al señor:&nbsp;&nbsp;<span class="inline-dato">${nombreCompletoT}</span>
  &nbsp;&nbsp;una fracción de:&nbsp;&nbsp;<span class="monto">${area}&nbsp;&nbsp;M²</span>
  los cuales se desmembraran de la finca identificada anteriormente para formar una nueva,
  precio por el cual el día de hoy el vendedor declara que recibe en calidad de anticipo
  del promitente comprador la cantidad de&nbsp;&nbsp;<span class="monto">${fmtQ(enganche)}</span>
  &nbsp;&nbsp;quedando con esto un saldo de
  &nbsp;&nbsp;<span class="monto">${fmtQ(saldo)}</span>
  &nbsp;&nbsp;los cuales el promitente comprador se compromete a cancelar al finalizar el plazo convenido.</p>

  <p><span class="clausula-titulo">Del Plazo:</span>
  El promitente comprador se compromete a cancelar el saldo pendiente, dentro del plazo de:
  &nbsp;&nbsp;<span class="monto">${plazoMeses}&nbsp;&nbsp;meses</span>
  en cuotas mensuales que ascienden a la cantidad de:
  &nbsp;&nbsp;<span class="monto">${fmtQ(cuotaMensual)}</span>
  &nbsp;&nbsp;finalizando en la siguiente fecha:&nbsp;&nbsp;<span class="inline-dato">${fechaFinStr}</span></p>

  <p><span class="clausula-titulo">De los Beneficios:</span>
  El proyecto contará con 6 calles balastradas de 6 metros de ancho, una avenida principal de 8 metros de
  ancho; el cual contará con agua, electricidad y drenaje (sujeto a condiciones), además contará con una
  área recreativa y de convivencia dentro del mismo.</p>

  <p><span class="clausula-titulo">De los Desastres Naturales:</span>
  La empresa no se hará responsable por daños ocasionados a la infraestructura del proyecto ya realizado
  por desastres naturales (terremotos, inundaciones, incendios, huracanes, ciclones, entre otros
  catalogados como desastres naturales).</p>

  <p><span class="clausula-titulo">De los Pagos Extraordinarios:</span>
  El comprador podrá hacer pagos extraordinarios los cuales serán abonados al capital, siempre que no
  sean sobre saldos vencidos, el propósito de este pago será de reducir el plazo pactado, pero no para
  reducir el monto de cada cuota nivelada.</p>

  <p><span class="clausula-titulo">De los Recargos por Mora:</span>
  En caso de que el comprador no haga efectivo el pago el día de que le corresponde tendrá un margen
  para pagar como máximo de 8 días calendario. Después de esa fecha deberá pagar el concepto de
  recargo por mora un 5% mensual sobre la cuota atrasada por el tiempo que tenga vencida la
  obligación, en caso de atrasarse en el plazo ininterrumpido de un mes, al comprador no se le
  devolverá el enganche que dejó para adquirir la propiedad.</p>

  <p><span class="clausula-titulo">De los Cargos no Incluidos en el Precio del Lote:</span>
  El comprador manifiesta que conoce el inmueble objeto de este contrato y está enterado que el precio
  consignado no incluye los impuestos fiscales o municipales, tales como el IUSI, el IVA y otros que
  correspondan; esto será cancelado por el comprador en su debido momento. El comprador acepta desde ya
  pagar cualquier impuesto, tasa o arbitrio que la municipalidad respectiva o estado puede optar sobre
  el inmueble. Sí le incluye los gastos de escrituración, inscripción al registro de la propiedad y
  honorarios del notario. El proyecto cuenta con su bufete de abogados los cuales realizan las
  escrituras correspondientes.</p>

  <p><span class="clausula-titulo">De los Traspasos:</span>
  El comprador podrá ceder sus derechos de prominente a un tercero siempre que el proyecto dé su
  autorización escrita y evalúe el estado de este si se encuentra al día con sus pagos y manifieste
  compromiso de pago puntual por parte del interesado. Los gastos de la operación de traspaso que
  origine corren por cuenta del comprador.</p>

  <p><span class="clausula-titulo">Del Tiempo a Escriturar:</span>
  El comprador tiene un lapso de 30 días luego de cancelada la última cuota del contrato o saldo para
  realizar su escritura; de lo contrario se cobrará una sanción por el retraso de esta
  (un valor de Q.75.00 por mes luego de concluida la ocupación).</p>

  <p><span class="clausula-titulo">De los Casos en los que el Proyecto Puede Dejar sin Efecto este Contrato:</span>
  El comprador acepta que el proyecto puede dejar sin efecto la presente opción de compraventa y
  disponer libremente del inmueble: a) Por el incumplimiento en el pago total del enganche.
  b) En caso de que su contrato tenga 2 meses ininterrumpidos sin pago y aún exista saldo pendiente
  en la presente promesa de compraventa. No se devolverá el enganche del inmueble y solo se analizará
  la devolución de un 25% de las cuotas ya abonadas y el presente contrato se dará por finalizado.
  La empresa se exime de la responsabilidad de la entrega del bien inmueble y hará libre uso del mismo.</p>

  <p><span class="clausula-titulo">Del Domicilio y Aceptación:</span>
  El comprador acepta expresamente las condiciones contenidas en el presente contrato de compraventa
  para su interpretación, cumplimiento y ejecución. Aceptando como buenas y válidas las notificaciones,
  citaciones o avisos, que se les haga en las direcciones señaladas en el presente documento.</p>

  <p style="margin-top:14pt;"><strong>CONFORME:</strong></p>

  <div class="firma-row">
    <div class="firma">
      <div class="firma-linea"></div>
      <div class="firma-nombre">COMPRADOR: ${nombreCompletoT}</div>
    </div>
    <div class="firma">
      <div class="firma-linea"></div>
      <div class="firma-nombre">REPRESENTANTE LEGAL: ${VENDEDOR_NOMBRE_T}</div>
    </div>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Contrato de Compraventa — Lote ${lote.codigo}</title>
  <style>${CSS_IMPRESION}</style>
</head>
<body>
  ${pagina1}
  ${pagina2}
</body>
</html>`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ContratoCompraventa({ datos, onVolver, onConfirmar, confirmando, error }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);

  function imprimir() {
    const html = generarHtmlContrato(datos);
    const w = window.open('', '_blank', 'width=880,height=1100');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  const { fechaVenta, cliente, lote, simulacion, plazoMeses, fechaPrimeraCuota } = datos;
  const nombreCompletoT = `${cliente.nombre} ${cliente.apellido}`;
  const cuotaMensual    = simulacion.tabla.filas[0]?.cuota ?? 0;
  const precioBase = simulacion.precioBase;
  const enganche   = simulacion.enganche;
  const saldo      = simulacion.saldoFinanciar;
  const area       = parseFloat(String(lote.area)).toLocaleString('es-GT', { minimumFractionDigits: 2 });
  const dpiLetras  = dpiEnLetras(cliente.dpi);

  const fechaFin = sumarMeses(fechaPrimeraCuota, plazoMeses - 1);
  const fechaFinStr = `${String(fechaFin.getDate()).padStart(2,'0')}/${String(fechaFin.getMonth()+1).padStart(2,'0')}/${fechaFin.getFullYear()}`;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between gap-4 sticky top-0 bg-gray-50 py-3 z-10 border-b border-gray-200 -mx-4 px-4">
        <button
          onClick={onVolver}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al formulario
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={imprimir}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer size={14} />
            Imprimir / PDF
          </button>
          <button
            onClick={onConfirmar}
            disabled={confirmando}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <CheckCircle size={14} />
            {confirmando ? 'Registrando…' : 'Confirmar y registrar venta'}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* ── Vista previa en pantalla ── */}
      <div ref={previewRef} className="space-y-6">

        {/* Página 1: Legalización */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-gray-900"
             style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.5', fontSize: '10pt',
                      padding: '14mm 16mm', minHeight: '27.9cm', width: '21.6cm', margin: '0 auto' }}>
          <p className="mb-4 text-justify">
            EN EL MUNICIPIO DE {MUNICIPIO.toUpperCase()} DEL DEPARTAMENTO DE {DEPARTAMENTO.toUpperCase()} EL DIA DE
            &nbsp;&nbsp;&nbsp;<strong>{fmtFechaCorta(fechaVenta)}</strong>&nbsp;&nbsp;&nbsp;
            YO, COMO NOTARIO DOY FE: A) QUE LAS FIRMAS QUE ANTECEDEN, SON AUTENTICAS, POR HABER SIDO PUESTAS EL DIA DE HOY
            POR: &nbsp;&nbsp;<strong className="underline">{nombreCompletoT}</strong>
          </p>
          <p className="mb-4 text-justify">
            {cliente.dpi ?? '______________________'}&nbsp;&nbsp;&nbsp;{dpiLetras}.
          </p>
          <p className="mb-6 text-justify">
            Y POR: {VENDEDOR_NOMBRE}, QUIEN SE IDENTIFICA CON DOCUMENTO PERSONAL DE IDENTIFICACION CON CODIGO UNICO
            NUMERO: {VENDEDOR_DPI_LETRAS} ({VENDEDOR_DPI}) EXTENDIDO POR EL REGISTRO NACIONAL DE LAS PERSONAS
            DE LA REPUBLICA DE GUATEMALA. B) QUE LAS FIRMAS QUE CALZAN EN ESTE DOCUMENTO DE PAGO, COMO UN ACTO
            DE BUENA FE DE AMBAS PARTES, PARA LA COMPRA DE UNA FRACCION DE TERRENO EN LA PROPIEDAD DE {VENDEDOR_NOMBRE},
            CONTENIDO EN UNA HOJA DE PAPEL BOND EN SU LADO ANVERSO, CONTINUANDO LA PRESENTE LEGALIZACION DE FIRMAS
            DE ESTA MISMA HOJA. C) QUIENES VUELVEN A FIRMAR LA PRESENTE ACTA DE LEGALIZACION DE FIRMAS,
            JUNTAMENTE CON EL NOTARIO QUE AUTORIZA.
          </p>
          <div className="mt-20 grid grid-cols-2 gap-16">
            <div className="text-center">
              <div className="border-b border-gray-600 mb-2 h-10" />
              <p className="text-xs font-bold uppercase">COMPRADOR: {nombreCompletoT}</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-600 mb-2 h-10" />
              <p className="text-xs font-bold uppercase">REPRESENTANTE LEGAL: {VENDEDOR_NOMBRE_T}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-8">— Página 1 de 2 —</p>
        </div>

        {/* Página 2: Promesa de Venta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-gray-900"
             style={{ fontFamily: "'Times New Roman', Times, serif", lineHeight: '1.38', fontSize: '9.5pt',
                      padding: '14mm 16mm', minHeight: '27.9cm', width: '21.6cm', margin: '0 auto' }}>
          <h2 className="text-center font-bold text-base uppercase tracking-widest mb-6">
            Promesa de Venta
          </h2>

          {[
            {
              titulo: 'Condiciones Generales de la Compraventa:',
              texto: `El comprador con el presente contrato se obliga a comprar el inmueble en el precio, plazo y condiciones establecidas, siendo el día ${fechaEnLetras(fechaVenta)}.`,
            },
            {
              titulo: 'De las Cuotas:',
              texto: `El comprador se obliga a pagar el saldo pendiente de pago a partir de la fecha indicada en forma mensual, vencida y consecutiva. Las cuotas de pago mensual únicamente deberán realizarse a través de ${OFICINA_PAGO}. No se acepta ni nos responsabilizamos por pagos realizados a terceras personas, incluyendo vendedores o supervisores de ventas.`,
            },
            {
              titulo: 'Del Inmueble:',
              texto: `La parte promitente vendedora declara ser legítima propietaria de un bien inmueble, ubicado Colonia la Verde, del Municipio de ${MUNICIPIO}, del Departamento de ${DEPARTAMENTO}, inmueble que cuenta con una extensión superficial de: ${AREA_TOTAL}, comprendido dentro de las medidas y colindancias que le aparecen en su respectiva escritura, con sus mojones y esquineros bien reconocidos en sus cuatro costados, inscritas en el Registro de La Propiedad con la finca Matriz con el numero: ${FINCA}; folio número: ${FOLIO}; libro número: ${LIBRO}. Finca sobre la cual no pesa ningún tipo de gravamen, anotación o limitación.`,
            },
            {
              titulo: 'De los Desastres Naturales:',
              texto: 'La empresa no se hará responsable por daños ocasionados a la infraestructura del proyecto ya realizado por desastres naturales (terremotos, inundaciones, incendios, huracanes, ciclones, entre otros catalogados como desastres naturales).',
            },
            {
              titulo: 'De los Pagos Extraordinarios:',
              texto: 'El comprador podrá hacer pagos extraordinarios los cuales serán abonados al capital, siempre que no sean sobre saldos vencidos, el propósito de este pago será de reducir el plazo pactado, pero no para reducir el monto de cada cuota nivelada.',
            },
            {
              titulo: 'De los Recargos por Mora:',
              texto: 'En caso de que el comprador no haga efectivo el pago el día de que le corresponde tendrá un margen para pagar como máximo de 8 días calendario. Después de esa fecha deberá pagar el concepto de recargo por mora un 5% mensual sobre la cuota atrasada por el tiempo que tenga vencida la obligación, en caso de atrasarse en el plazo ininterrumpido de un mes, al comprador no se le devolverá el enganche que dejó para adquirir la propiedad.',
            },
            {
              titulo: 'De los Cargos no Incluidos en el Precio del Lote:',
              texto: 'El comprador manifiesta que conoce el inmueble objeto de este contrato y está enterado que el precio consignado no incluye los impuestos fiscales o municipales, tales como el IUSI, el IVA y otros que correspondan; esto será cancelado por el comprador en su debido momento. El comprador acepta desde ya pagar cualquier impuesto, tasa o arbitrio que la municipalidad respectiva o estado puede optar sobre el inmueble. Sí le incluye los gastos de escrituración, inscripción al registro de la propiedad y honorarios del notario. El proyecto cuenta con su bufete de abogados los cuales realizan las escrituras correspondientes.',
            },
            {
              titulo: 'De los Traspasos:',
              texto: 'El comprador podrá ceder sus derechos de prominente a un tercero siempre que el proyecto dé su autorización escrita y evalúe el estado de este si se encuentra al día con sus pagos y manifieste compromiso de pago puntual por parte del interesado. Los gastos de la operación de traspaso que origine corren por cuenta del comprador.',
            },
            {
              titulo: 'Del Tiempo a Escriturar:',
              texto: 'El comprador tiene un lapso de 30 días luego de cancelada la última cuota del contrato o saldo para realizar su escritura; de lo contrario se cobrará una sanción por el retraso de esta (un valor de Q.75.00 por mes luego de concluida la ocupación).',
            },
            {
              titulo: 'De los Casos en los que el Proyecto Puede Dejar sin Efecto este Contrato:',
              texto: 'El comprador acepta que el proyecto puede dejar sin efecto la presente opción de compraventa y disponer libremente del inmueble: a) Por el incumplimiento en el pago total del enganche. b) En caso de que su contrato tenga 2 meses ininterrumpidos sin pago y aún exista saldo pendiente en la presente promesa de compraventa. No se devolverá el enganche del inmueble y solo se analizará la devolución de un 25% de las cuotas ya abonadas y el presente contrato se dará por finalizado. La empresa se exime de la responsabilidad de la entrega del bien inmueble y hará libre uso del mismo.',
            },
            {
              titulo: 'Del Domicilio y Aceptación:',
              texto: 'El comprador acepta expresamente las condiciones contenidas en el presente contrato de compraventa para su interpretación, cumplimiento y ejecución. Aceptando como buenas y válidas las notificaciones, citaciones o avisos, que se les haga en las direcciones señaladas en el presente documento.',
            },
          ].map(({ titulo, texto }) => (
            <p key={titulo} className="mb-3 text-justify text-sm">
              <strong>{titulo}</strong>{' '}{texto}
            </p>
          ))}

          {/* Cláusula De la Promesa (con montos inline) */}
          <p className="mb-3 text-justify text-sm">
            <strong>De la Promesa de Venta:</strong>{' '}
            El promitente vendedor, declara que por el precio de:{' '}
            <strong>{fmtQ(precioBase)}&nbsp;&nbsp;Quetzales Guatemaltecos.</strong>
            {' '}promete en venta al señor:{' '}
            <strong className="underline">{nombreCompletoT}</strong>{' '}
            una fracción de:{' '}
            <strong>{area}&nbsp;M²</strong>{' '}
            los cuales se desmembraran de la finca identificada anteriormente para formar una nueva,
            precio por el cual el día de hoy el vendedor declara que recibe en calidad de anticipo
            del promitente comprador la cantidad de{' '}
            <strong>{fmtQ(enganche)}</strong>{' '}
            quedando con esto un saldo de{' '}
            <strong>{fmtQ(saldo)}</strong>{' '}
            los cuales el promitente comprador se compromete a cancelar al finalizar el plazo convenido.
          </p>

          {/* Cláusula Del Plazo (con montos inline) */}
          <p className="mb-3 text-justify text-sm">
            <strong>Del Plazo:</strong>{' '}
            El promitente comprador se compromete a cancelar el saldo pendiente, dentro del plazo de:{' '}
            <strong>{plazoMeses}&nbsp;meses</strong>{' '}
            en cuotas mensuales que ascienden a la cantidad de:{' '}
            <strong>{fmtQ(cuotaMensual)}</strong>{' '}
            finalizando en la siguiente fecha:{' '}
            <strong className="underline">{fechaFinStr}</strong>
          </p>

          <p className="mt-5 font-bold text-sm">CONFORME:</p>

          <div className="mt-16 grid grid-cols-2 gap-16">
            <div className="text-center">
              <div className="border-b border-gray-600 mb-2 h-10" />
              <p className="text-xs font-bold uppercase">COMPRADOR: {nombreCompletoT}</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-600 mb-2 h-10" />
              <p className="text-xs font-bold uppercase">REPRESENTANTE LEGAL: {VENDEDOR_NOMBRE_T}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-8">— Página 2 de 2 —</p>
        </div>

      </div>
    </div>
  );
}
