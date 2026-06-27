import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, ChevronDown, ChevronUp,
  Banknote, CheckCircle2, Clock, AlertCircle, CircleDot,
  Printer, X, ArrowRight, Check, Calendar,
} from 'lucide-react';
import {
  useHistorialCliente, useRegistrarPago, useActualizarDiaPago,
  type CuotaDetalle, type VentaHistorial, type HistorialCliente as THistorial,
} from '../../hooks/usePagos';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmtMonto(centavos: number, moneda = 'GTQ') {
  return `${moneda} ${(centavos / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function iniciales(n: string, a: string) {
  return `${n[0] ?? ''}${a[0] ?? ''}`.toUpperCase();
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ESTADO_CUOTA: Record<string, { label: string; badge: string; row: string; icon: typeof CheckCircle2 }> = {
  PAGADA:    { label: 'Pagada',    badge: 'bg-green-100 text-green-700', row: 'bg-green-50/40',  icon: CheckCircle2 },
  PARCIAL:   { label: 'Parcial',   badge: 'bg-blue-100 text-blue-700',   row: 'bg-blue-50/40',   icon: CircleDot },
  PENDIENTE: { label: 'Pendiente', badge: 'bg-gray-100 text-gray-600',   row: '',                icon: Clock },
  VENCIDA:   { label: 'Vencida',   badge: 'bg-red-100 text-red-700',     row: 'bg-red-50/50',    icon: AlertCircle },
};

const MEDIO_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia',
  TARJETA_CREDITO: 'T. Crédito', TARJETA_DEBITO: 'T. Débito', CHEQUE: 'Cheque',
};

const SISTEMA_LABEL: Record<string, string> = {
  SIN_INTERES: 'Sin interés', FRANCES: 'Francés (cuota fija)', ALEMAN: 'Alemán (capital constante)',
};

// ─── Imprimir recibo ──────────────────────────────────────────────────────────

function imprimirRecibo(opts: {
  numeroRecibo: string;
  cliente: string;
  lote: string;
  proyecto: string;
  numeroCuota: number;
  fechaVencimiento: string;
  monto: number;
  moneda: string;
  fecha: string;
}) {
  const montoNum = (opts.monto / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 });
  const montoStr = `${opts.moneda} ${montoNum}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Recibo de Pago ${opts.numeroRecibo}</title>
  <style>
    @page { size: letter portrait; margin: 18mm 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
    }

    /* ── Encabezado ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14pt;
      border-bottom: 2.5pt solid #1a1a1a;
      margin-bottom: 18pt;
    }
    .header-left .company {
      font-size: 18pt;
      font-weight: 700;
      letter-spacing: -0.3pt;
      color: #1a1a1a;
      line-height: 1.1;
    }
    .header-left .tagline {
      font-size: 8.5pt;
      color: #555;
      margin-top: 3pt;
      font-style: italic;
    }
    .header-right {
      text-align: right;
    }
    .doc-title {
      font-size: 14pt;
      font-weight: 700;
      letter-spacing: 1.5pt;
      text-transform: uppercase;
      color: #1a1a1a;
    }
    .doc-num {
      font-size: 9pt;
      color: #444;
      margin-top: 4pt;
      font-family: 'Courier New', monospace;
    }
    .doc-fecha {
      font-size: 9pt;
      color: #444;
      margin-top: 2pt;
    }

    /* ── Cuerpo ── */
    .section-title {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: #777;
      border-bottom: 0.75pt solid #ccc;
      padding-bottom: 3pt;
      margin-bottom: 8pt;
    }
    .section { margin-bottom: 16pt; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt 24pt; }
    .field { margin-bottom: 6pt; }
    .field-label { font-size: 8pt; color: #666; text-transform: uppercase; letter-spacing: 0.5pt; }
    .field-value { font-size: 10.5pt; font-weight: 600; color: #111; margin-top: 1pt; }

    /* ── Cuadro de monto ── */
    .amount-box {
      border: 1.5pt solid #1a1a1a;
      padding: 14pt 20pt;
      margin: 16pt 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .amount-label {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1pt;
      color: #333;
    }
    .amount-value {
      font-size: 22pt;
      font-weight: 700;
      color: #1a1a1a;
      font-family: 'Times New Roman', serif;
      letter-spacing: -0.5pt;
    }
    .amount-words {
      font-size: 8.5pt;
      color: #555;
      margin-top: 4pt;
      font-style: italic;
    }

    /* ── Declaración ── */
    .declaration {
      font-size: 9.5pt;
      line-height: 1.6;
      color: #333;
      text-align: justify;
      margin: 14pt 0;
      padding: 10pt 12pt;
      border-left: 3pt solid #1a1a1a;
      background: #f9f9f9;
    }

    /* ── Firmas ── */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40pt;
      margin-top: 48pt;
    }
    .signature-block { text-align: center; }
    .signature-line {
      border-top: 1pt solid #1a1a1a;
      margin-bottom: 5pt;
    }
    .signature-name {
      font-size: 9pt;
      font-weight: 700;
      color: #1a1a1a;
      text-transform: uppercase;
      letter-spacing: 0.3pt;
    }
    .signature-role {
      font-size: 8pt;
      color: #666;
      margin-top: 2pt;
    }
    .signature-id {
      font-size: 7.5pt;
      color: #888;
      margin-top: 1pt;
    }
    .signature-space { height: 40pt; }

    /* ── Pie ── */
    .footer {
      margin-top: 28pt;
      padding-top: 8pt;
      border-top: 0.75pt solid #ccc;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-note {
      font-size: 7.5pt;
      color: #888;
      line-height: 1.5;
      max-width: 340pt;
    }
    .footer-seal {
      width: 64pt;
      height: 64pt;
      border: 1pt dashed #bbb;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6.5pt;
      color: #bbb;
      text-align: center;
      line-height: 1.4;
      flex-shrink: 0;
    }
  </style>
</head>
<body>

  <!-- Encabezado -->
  <div class="header">
    <div class="header-left">
      <div class="company">Sistema Inmobiliario</div>
      <div class="tagline">Gestión y administración de bienes inmuebles</div>
    </div>
    <div class="header-right">
      <div class="doc-title">Recibo de Pago</div>
      <div class="doc-num">N°&nbsp;&nbsp;${opts.numeroRecibo}</div>
      <div class="doc-fecha">Fecha: ${opts.fecha}</div>
    </div>
  </div>

  <!-- Datos del cliente -->
  <div class="section">
    <div class="section-title">Datos del cliente</div>
    <div class="grid-2">
      <div class="field">
        <div class="field-label">Nombre completo</div>
        <div class="field-value">${opts.cliente}</div>
      </div>
      <div class="field">
        <div class="field-label">Medio de pago</div>
        <div class="field-value">Efectivo</div>
      </div>
    </div>
  </div>

  <!-- Datos del inmueble -->
  <div class="section">
    <div class="section-title">Datos del inmueble</div>
    <div class="grid-2">
      <div class="field">
        <div class="field-label">Proyecto</div>
        <div class="field-value">${opts.proyecto}</div>
      </div>
      <div class="field">
        <div class="field-label">Lote</div>
        <div class="field-value">${opts.lote}</div>
      </div>
      <div class="field">
        <div class="field-label">Cuota N°</div>
        <div class="field-value">${opts.numeroCuota}</div>
      </div>
      <div class="field">
        <div class="field-label">Fecha de vencimiento</div>
        <div class="field-value">${opts.fechaVencimiento}</div>
      </div>
    </div>
  </div>

  <!-- Monto -->
  <div class="amount-box">
    <div>
      <div class="amount-label">Total recibido</div>
      <div class="amount-words">Pago de mensualidad correspondiente a cuota #${opts.numeroCuota}</div>
    </div>
    <div style="text-align:right">
      <div class="amount-value">${montoStr}</div>
    </div>
  </div>

  <!-- Declaración -->
  <div class="declaration">
    Por medio del presente recibo, se hace constar que <strong>${opts.cliente}</strong> ha realizado el pago
    correspondiente a la cuota número <strong>${opts.numeroCuota}</strong> con vencimiento el
    <strong>${opts.fechaVencimiento}</strong>, por la cantidad de <strong>${montoStr}</strong>,
    en concepto de abono al financiamiento del lote <strong>${opts.lote}</strong>
    ubicado en el proyecto <strong>${opts.proyecto}</strong>.
    El presente comprobante tiene validez únicamente como constancia interna de pago.
  </div>

  <!-- Firmas -->
  <div class="signatures">
    <div class="signature-block">
      <div class="signature-space"></div>
      <div class="signature-line"></div>
      <div class="signature-name">${opts.cliente}</div>
      <div class="signature-role">Cliente / Comprador</div>
      <div class="signature-id">DPI: _______________________________</div>
    </div>
    <div class="signature-block">
      <div class="signature-space"></div>
      <div class="signature-line"></div>
      <div class="signature-name">Representante Autorizado</div>
      <div class="signature-role">Sistema Inmobiliario</div>
      <div class="signature-id">Nombre: ____________________________</div>
    </div>
  </div>

  <!-- Pie -->
  <div class="footer">
    <div class="footer-note">
      <strong>NOTA:</strong> Este documento es un comprobante interno de pago y <u>no constituye un documento
      fiscal (DTE/FEL)</u>. La factura fiscal correspondiente es emitida por el contador autorizado
      a través de la plataforma FEL de la Superintendencia de Administración Tributaria (SAT).
      Conserve este recibo como respaldo de su pago.
    </div>
    <div class="footer-seal">SELLO<br/>EMPRESA</div>
  </div>

</body>
</html>`;

  const w = window.open('', '_blank', 'width=820,height=1060');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ─── Modal de cobro (3 pasos) ─────────────────────────────────────────────────

type Paso = 'recibo' | 'cobrar' | 'confirmado';

interface ModalCobroProps {
  cuota: CuotaDetalle;
  venta: VentaHistorial;
  cliente: THistorial;
  onCerrar: () => void;
}

function ModalCobro({ cuota, venta, cliente, onCerrar }: ModalCobroProps) {
  const [paso, setPaso] = useState<Paso>('recibo');
  const [numeroRecibo] = useState(
    () => `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`,
  );
  const registrar = useRegistrarPago();
  const pendiente = cuota.montoCuota - cuota.montoPagado;
  const hoy = new Date().toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });

  async function confirmar() {
    await registrar.mutateAsync({
      cuotaId: cuota.id,
      clienteId: cliente.clienteId,
      fecha: new Date().toISOString(),
      monto: pendiente,
      medioPago: 'EFECTIVO',
    });
    setPaso('confirmado');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Indicador de pasos */}
            {(['recibo', 'cobrar', 'confirmado'] as Paso[]).map((p, i) => (
              <div key={p} className="flex items-center gap-1.5">
                {i > 0 && <div className={`h-px w-6 ${paso === 'confirmado' || (paso === 'cobrar' && i === 2) || (paso !== 'recibo' && i <= 1) ? 'bg-primary-400' : 'bg-gray-200'}`} />}
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  p === paso ? 'bg-primary-600 text-white' :
                  (paso === 'cobrar' && i === 0) || paso === 'confirmado' ? 'bg-primary-100 text-primary-700' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {paso === 'confirmado' && i < 2 ? <Check size={12} /> : i + 1}
                </div>
              </div>
            ))}
          </div>
          <button onClick={onCerrar} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* ── Paso 1: Recibo ── */}
        {paso === 'recibo' && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Vista previa del recibo</h2>
              <p className="text-xs text-gray-400 mt-0.5">Revisa los datos antes de imprimir</p>
            </div>

            <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-gray-500">N° Recibo</span>
                <span className="font-mono text-xs font-semibold text-gray-700">{numeroRecibo}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-gray-500">Fecha</span>
                <span className="font-medium text-gray-800">{hoy}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-gray-500">Cliente</span>
                <span className="font-medium text-gray-800">{cliente.nombre} {cliente.apellido}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-gray-500">Proyecto / Lote</span>
                <span className="font-medium text-gray-800">{venta.proyecto} — {venta.lote}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-gray-500">Cuota</span>
                <span className="font-medium text-gray-800">#{cuota.numero} · vence {fmtFecha(cuota.fechaVencimiento)}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 bg-primary-50">
                <span className="font-semibold text-primary-800">Monto a cobrar</span>
                <span className="font-bold text-primary-700 text-base">{fmtMonto(pendiente, venta.moneda)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Este recibo es un comprobante interno. No es un documento fiscal.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => imprimirRecibo({
                  numeroRecibo,
                  cliente: `${cliente.nombre} ${cliente.apellido}`,
                  lote: venta.lote,
                  proyecto: venta.proyecto,
                  numeroCuota: cuota.numero,
                  fechaVencimiento: fmtFecha(cuota.fechaVencimiento),
                  monto: pendiente,
                  moneda: venta.moneda,
                  fecha: hoy,
                })}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Printer size={16} />
                Imprimir recibo
              </button>
              <button
                onClick={() => setPaso('cobrar')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
              >
                Siguiente
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 2: Cobrar ── */}
        {paso === 'cobrar' && (
          <div className="px-6 py-5 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Solicitar efectivo</h2>
              <p className="text-xs text-gray-400 mt-0.5">Cuota #{cuota.numero} — {cliente.nombre} {cliente.apellido}</p>
            </div>

            <div className="rounded-2xl bg-gray-900 text-white px-6 py-8 text-center space-y-2">
              <p className="text-sm text-gray-400">Solicite al cliente</p>
              <p className="text-4xl font-bold tracking-tight">
                {(pendiente / 100).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-lg text-gray-300 font-medium">{venta.moneda}</p>
              <p className="text-xs text-gray-500 mt-2">en efectivo</p>
            </div>

            {registrar.error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {(registrar.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Ocurrió un error al registrar el pago.'}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setPaso('recibo'); registrar.reset(); }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={confirmar}
                disabled={registrar.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                <Check size={16} />
                {registrar.isPending ? 'Registrando…' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 3: Confirmado ── */}
        {paso === 'confirmado' && (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">¡Pago registrado!</h2>
              <p className="text-sm text-gray-500 mt-1">
                Cuota #{cuota.numero} de {cliente.nombre} {cliente.apellido}
              </p>
              <p className="text-sm font-semibold text-green-700 mt-1">
                {fmtMonto(pendiente, venta.moneda)}
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fila de cuota ────────────────────────────────────────────────────────────

interface FilaCuotaProps {
  cuota: CuotaDetalle;
  moneda: string;
  venta: VentaHistorial;
  cliente: THistorial;
}

function FilaCuota({ cuota, moneda, venta, cliente }: FilaCuotaProps) {
  const [expandida, setExpandida] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const cfg = ESTADO_CUOTA[cuota.estado] ?? ESTADO_CUOTA.PENDIENTE;
  const Icon = cfg.icon;
  const pendiente = cuota.montoCuota - cuota.montoPagado;
  const puedeRegistrar = cuota.estado !== 'PAGADA';

  return (
    <>
      <tr
        className={`border-t border-gray-100 text-sm transition-colors ${cfg.row} ${cuota.pagos.length > 0 ? 'cursor-pointer hover:brightness-95' : ''}`}
        onClick={() => cuota.pagos.length > 0 && setExpandida((v) => !v)}
      >
        <td className="py-3 pl-4 pr-3">
          <div className="flex items-center gap-2">
            <Icon size={14} className={
              cuota.estado === 'PAGADA' ? 'text-green-500' :
              cuota.estado === 'VENCIDA' ? 'text-red-500' :
              cuota.estado === 'PARCIAL' ? 'text-blue-500' : 'text-gray-400'
            } />
            <span className="tabular-nums text-gray-600 font-medium">#{cuota.numero}</span>
          </div>
        </td>
        <td className="py-3 px-3 text-gray-600">{fmtFecha(cuota.fechaVencimiento)}</td>
        <td className="py-3 px-3 text-right tabular-nums text-gray-800 font-medium">{fmtMonto(cuota.montoCuota, moneda)}</td>
        <td className="py-3 px-3 text-right tabular-nums text-green-700">
          {cuota.montoPagado > 0 ? fmtMonto(cuota.montoPagado, moneda) : <span className="text-gray-300">—</span>}
        </td>
        <td className="py-3 px-3 text-right tabular-nums text-gray-500">
          {pendiente > 0 ? fmtMonto(pendiente, moneda) : <span className="text-gray-300">—</span>}
        </td>
        <td className="py-3 px-3">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
            {cfg.label}
          </span>
        </td>
        {/* Columna de acción */}
        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
          {puedeRegistrar ? (
            <button
              onClick={() => setModalAbierto(true)}
              title="Registrar pago"
              className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors whitespace-nowrap"
            >
              <Banknote size={13} />
              Cobrar
            </button>
          ) : cuota.estado === 'PAGADA' && cuota.pagos.length > 0 && (
            <button
              onClick={() => {
                const p = cuota.pagos[cuota.pagos.length - 1];
                imprimirRecibo({
                  numeroRecibo: p.comprobante ?? `REC-${p.id.slice(-8).toUpperCase()}`,
                  cliente: `${cliente.nombre} ${cliente.apellido}`,
                  lote: venta.lote,
                  proyecto: venta.proyecto,
                  numeroCuota: cuota.numero,
                  fechaVencimiento: fmtFecha(cuota.fechaVencimiento),
                  monto: p.monto,
                  moneda: moneda,
                  fecha: fmtFecha(p.fecha),
                });
              }}
              title="Ver / reimprimir recibo"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <Printer size={13} />
              Recibo
            </button>
          )}
        </td>
        <td className="py-3 pr-4 text-gray-400 w-8">
          {cuota.pagos.length > 0 && (expandida ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </td>
      </tr>

      {expandida && cuota.pagos.map((p, i) => (
        <tr key={p.id} className={`text-xs ${i === cuota.pagos.length - 1 ? 'border-b border-gray-100' : ''}`}>
          <td className="py-2 pl-10 pr-3 text-gray-400">Pago</td>
          <td className="py-2 px-3 text-gray-500">{fmtFecha(p.fecha)}</td>
          <td className="py-2 px-3 text-right tabular-nums font-semibold text-green-700">{fmtMonto(p.monto, moneda)}</td>
          <td className="py-2 px-3 text-right tabular-nums text-gray-400">{fmtMonto(p.netoRecibido, moneda)}</td>
          <td className="py-2 px-3 text-right" />
          <td className="py-2 px-3 text-gray-500">{MEDIO_PAGO[p.medioPago] ?? p.medioPago}</td>
          <td className="py-2 px-3 text-gray-400 italic">{p.notas ?? ''}</td>
          <td className="py-2 pr-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                imprimirRecibo({
                  numeroRecibo: p.comprobante ?? `REC-${p.id.slice(-8).toUpperCase()}`,
                  cliente: `${cliente.nombre} ${cliente.apellido}`,
                  lote: venta.lote,
                  proyecto: venta.proyecto,
                  numeroCuota: cuota.numero,
                  fechaVencimiento: fmtFecha(cuota.fechaVencimiento),
                  monto: p.monto,
                  moneda: moneda,
                  fecha: fmtFecha(p.fecha),
                });
              }}
              title="Reimprimir recibo"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Printer size={13} />
            </button>
          </td>
        </tr>
      ))}

      {modalAbierto && createPortal(
        <ModalCobro
          cuota={cuota}
          venta={venta}
          cliente={cliente}
          onCerrar={() => setModalAbierto(false)}
        />,
        document.body,
      )}
    </>
  );
}

// ─── Sección por venta ────────────────────────────────────────────────────────

function SelectorDiaPago({ venta, clienteId }: { venta: VentaHistorial; clienteId: string }) {
  const [confirmando, setConfirmando] = useState<1 | 15 | null>(null);
  const actualizar = useActualizarDiaPago(clienteId);
  const diaPagoActual = venta.plan?.diaPago ?? null;

  const cuotasPendientes = (venta.plan?.cuotas ?? []).filter(
    (c) => c.montoPagado === 0 && (c.estado === 'PENDIENTE' || c.estado === 'VENCIDA'),
  ).length;

  async function confirmar() {
    if (!confirmando) return;
    await actualizar.mutateAsync({ ventaId: venta.id, diaPago: confirmando });
    setConfirmando(null);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-gray-400 shrink-0" />
        <span className="text-xs text-gray-500">Día de pago:</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs font-semibold">
          {([1, 15] as const).map((dia) => (
            <button
              key={dia}
              onClick={() => dia !== diaPagoActual && setConfirmando(dia)}
              disabled={actualizar.isPending}
              className={`px-3 py-1 transition-colors ${
                diaPagoActual === dia
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {dia}
            </button>
          ))}
        </div>
      </div>

      {confirmando && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <Calendar size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cambiar día de pago</h3>
                <p className="text-xs text-gray-500">Lote {venta.lote} — {venta.proyecto}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Se moverá el vencimiento de{' '}
              <span className="font-semibold text-gray-900">{cuotasPendientes} cuotas pendientes</span>{' '}
              al día <span className="font-semibold text-primary-700">{confirmando}</span> de cada mes.
              Las cuotas ya pagadas no se modificarán.
            </p>
            {actualizar.error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                Error al actualizar. Intenta de nuevo.
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setConfirmando(null); actualizar.reset(); }}
                className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={actualizar.isPending}
                className="flex-1 rounded-xl bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {actualizar.isPending ? 'Actualizando…' : `Confirmar → día ${confirmando}`}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function SeccionVenta({ venta, cliente }: { venta: VentaHistorial; cliente: THistorial }) {
  const cuotas = venta.plan?.cuotas ?? [];
  const pagadas  = cuotas.filter((c) => c.estado === 'PAGADA').length;
  const vencidas = cuotas.filter((c) => c.estado === 'VENCIDA').length;
  const total    = cuotas.length;
  const progreso = total > 0 ? Math.round((pagadas / total) * 100) : 0;
  const montoPagadoTotal = cuotas.reduce((a, c) => a + c.montoPagado, 0);

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full shrink-0 mt-0.5" style={{ background: venta.color }} />
            <div>
              <p className="font-semibold text-gray-900">Lote {venta.lote} — {venta.proyecto}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Venta: {fmtFecha(venta.fechaVenta)}
                {venta.plan && ` · ${SISTEMA_LABEL[venta.plan.sistema] ?? venta.plan.sistema} · ${venta.plan.plazoMeses} meses`}
                {venta.plan && parseFloat(venta.plan.tasaAnual) > 0 && ` · ${(parseFloat(venta.plan.tasaAnual) * 100).toFixed(2)}% anual`}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-gray-900">{fmtMonto(venta.precioTotal, venta.moneda)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Enganche: {fmtMonto(venta.enganche, venta.moneda)}</p>
          </div>
        </div>

        {venta.plan && (
          <div className="mt-3">
            <SelectorDiaPago venta={venta} clienteId={cliente.clienteId} />
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-xs text-gray-400">Cuotas pagadas</p>
            <p className="text-lg font-bold text-green-600">{pagadas}<span className="text-sm font-normal text-gray-400">/{total}</span></p>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-xs text-gray-400">Cobrado</p>
            <p className="text-sm font-bold text-gray-800">{fmtMonto(montoPagadoTotal, venta.moneda)}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 px-3 py-2">
            <p className="text-xs text-gray-400">Saldo restante</p>
            <p className="text-sm font-bold text-gray-800">{fmtMonto(venta.saldoFinanciar - montoPagadoTotal, venta.moneda)}</p>
          </div>
          <div className={`rounded-lg border px-3 py-2 ${vencidas > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <p className="text-xs text-gray-400">Vencidas</p>
            <p className={`text-lg font-bold ${vencidas > 0 ? 'text-red-600' : 'text-gray-300'}`}>{vencidas}</p>
          </div>
        </div>

        {total > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progreso</span><span>{progreso}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200">
              <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${progreso}%` }} />
            </div>
          </div>
        )}
      </div>

      {cuotas.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-xs text-gray-500 font-medium bg-white border-b border-gray-100">
              <tr>
                <th className="py-2.5 pl-4 pr-3 text-left">#</th>
                <th className="py-2.5 px-3 text-left">Vencimiento</th>
                <th className="py-2.5 px-3 text-right">Cuota</th>
                <th className="py-2.5 px-3 text-right">Pagado</th>
                <th className="py-2.5 px-3 text-right">Pendiente</th>
                <th className="py-2.5 px-3 text-left">Estado</th>
                <th className="py-2.5 px-3 text-left">Acción</th>
                <th className="py-2.5 pr-4 w-8" />
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c) => (
                <FilaCuota key={c.id} cuota={c} moneda={venta.moneda} venta={venta} cliente={cliente} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin plan de financiamiento registrado.</p>
      )}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function HistorialCliente() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useHistorialCliente(clienteId ?? null);

  const todasCuotas   = data?.ventas.flatMap((v) => v.plan?.cuotas ?? []) ?? [];
  const totalPagado   = todasCuotas.reduce((a, c) => a + c.montoPagado, 0);
  const totalDeuda    = todasCuotas.reduce((a, c) => a + c.montoCuota, 0);
  const cuotasVencidas = todasCuotas.filter((c) => c.estado === 'VENCIDA').length;
  const moneda = data?.ventas[0]?.moneda ?? 'GTQ';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/pagos')}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Pagos
        </button>
        {data && <span className="text-sm text-gray-400">/ {data.nombre} {data.apellido}</span>}
      </div>

      {data && (
        <div className="card flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-lg font-bold text-primary-700">
              {iniciales(data.nombre, data.apellido)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{data.nombre} {data.apellido}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {data.telefono && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-400" />{data.telefono}
                  </span>
                )}
                {data.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-gray-400" />{data.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {totalDeuda > 0 && (
            <div className="hidden sm:grid grid-cols-3 gap-4 text-center shrink-0">
              <div>
                <p className="text-xs text-gray-400">Total deuda</p>
                <p className="text-sm font-bold text-gray-800">{fmtMonto(totalDeuda, moneda)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cobrado</p>
                <p className="text-sm font-bold text-green-700">{fmtMonto(totalPagado, moneda)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Pendiente</p>
                <p className={`text-sm font-bold ${cuotasVencidas > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {fmtMonto(totalDeuda - totalPagado, moneda)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && <div className="card py-16 text-center text-sm text-gray-400">Cargando historial…</div>}
      {isError && <div className="card py-10 text-center text-sm text-red-500">No se pudo cargar el historial.</div>}

      {data && data.ventas.length === 0 && (
        <div className="card py-16 text-center">
          <Banknote size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">Este cliente no tiene ventas registradas.</p>
        </div>
      )}

      {data?.ventas.map((v) => (
        <SeccionVenta key={v.id} venta={v} cliente={data} />
      ))}
    </div>
  );
}
