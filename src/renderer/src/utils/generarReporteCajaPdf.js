import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAjustesStore } from '../store/useAjustesStore'

function formatearFechaHora(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const anio = d.getFullYear()
    const horas = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${anio} ${horas}:${mins}`
  } catch {
    return isoString
  }
}

function formatearHora(isoString) {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    const horas = String(d.getHours()).padStart(2, '0')
    const mins = String(d.getMinutes()).padStart(2, '0')
    return `${horas}:${mins}`
  } catch {
    return isoString
  }
}

function formatearMinutos(minutos) {
  const m = Number(minutos) || 0
  const horas = Math.floor(m / 60)
  const mins = m % 60
  return `${String(horas).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
}

export function generarReporteCajaPdf({
  kpis,
  sesiones = [],
  ventasBarra = [],
  fechaInicio,
  fechaFin
}) {
  const ajustes = useAjustesStore.getState().ajustes
  const nombreLocal = ajustes?.nombre_local || 'Mi Billar'

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()

  // 1. Encabezado Principal
  doc.setFillColor(11, 19, 38) // #0b1326
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(78, 222, 163) // #4edea3 Primary
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(nombreLocal.toUpperCase(), 14, 11)

  doc.setTextColor(218, 226, 253) // #dae2fd On Surface
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('REPORTE CONSOLIDADO DE CAJA', 14, 18)

  doc.setFontSize(8)
  doc.setTextColor(187, 202, 191) // #bbcabf On Surface Variant
  const rangoTexto =
    fechaInicio === fechaFin ? `Fecha: ${fechaInicio}` : `Rango: ${fechaInicio} al ${fechaFin}`
  doc.text(rangoTexto, 14, 24)

  const fechaEmision = `Emisión: ${new Date().toLocaleDateString('es-BO')} ${new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}`
  doc.text(fechaEmision, pageWidth - 14, 24, { align: 'right' })

  // 2. Resumen de KPIs
  let startY = 34

  const totalRecaudado = Number(kpis?.totalRecaudado || 0).toFixed(2)
  const totalEfectivo = Number(kpis?.totalEfectivo || 0).toFixed(2)
  const totalQr = Number(kpis?.totalQr || 0).toFixed(2)
  const ingresoTiempo = Number(kpis?.ingresoTiempo || 0).toFixed(2)
  const porcentajeTiempo = kpis?.porcentajeTiempo || 0
  const ingresoConsumoMesas = Number(kpis?.ingresoConsumoMesas || 0).toFixed(2)
  const cantidadItemsMesas = kpis?.cantidadItemsMesas || 0
  const porcentajeConsumo = kpis?.porcentajeConsumoMesas || 0
  const ingresoBarra = Number(kpis?.ingresoBarra || 0).toFixed(2)
  const cantidadVentasBarra = kpis?.cantidadVentasBarra || 0
  const cantidadItemsBarra = kpis?.cantidadItemsBarra || 0

  autoTable(doc, {
    startY,
    theme: 'grid',
    head: [['TOTAL RECAUDADO', 'TIEMPO EN MESAS', 'CONSUMO EN MESAS', 'VENTAS EN BARRA']],
    body: [
      [
        `Bs. ${totalRecaudado}\n(Efvo: Bs. ${totalEfectivo} | QR: Bs. ${totalQr})`,
        `Bs. ${ingresoTiempo}\n(${porcentajeTiempo}% del total)`,
        `Bs. ${ingresoConsumoMesas}\n(${cantidadItemsMesas} ítems - ${porcentajeConsumo}%)`,
        `Bs. ${ingresoBarra}\n(${cantidadVentasBarra} ventas - ${cantidadItemsBarra} ítems)`
      ]
    ],
    headStyles: {
      fillColor: [23, 31, 51], // #171f33
      textColor: [78, 222, 163], // #4edea3
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontSize: 8.5,
      halign: 'center',
      cellPadding: 3
    },
    styles: {
      lineColor: [203, 213, 225],
      lineWidth: 0.1
    }
  })

  startY = doc.lastAutoTable.finalY + 8

  // 3. Tabla de Sesiones de Mesas
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(11, 19, 38)
  doc.text(`1. SESIONES DE MESAS (${sesiones.length} registros)`, 14, startY)

  const sesionesBody = sesiones.map((s) => [
    s.mesa_nombre,
    formatearHora(s.fecha_inicio),
    formatearHora(s.fecha_fin),
    formatearMinutos(s.minutos_jugados),
    `Bs. ${Number(s.costo_tiempo || 0).toFixed(2)}`,
    `Bs. ${Number(s.costo_consumo || 0).toFixed(2)} (${s.total_items})`,
    `Bs. ${Number(s.total_pagar || 0).toFixed(2)}`,
    s.metodo_pago || 'EFECTIVO'
  ])

  // Fila de totales para mesas
  if (sesiones.length > 0) {
    sesionesBody.push([
      'TOTAL MESAS',
      '-',
      '-',
      '-',
      `Bs. ${ingresoTiempo}`,
      `Bs. ${ingresoConsumoMesas}`,
      `Bs. ${(Number(ingresoTiempo) + Number(ingresoConsumoMesas)).toFixed(2)}`,
      '-'
    ])
  }

  autoTable(doc, {
    startY: startY + 3,
    theme: 'striped',
    head: [['Mesa', 'Inicio', 'Fin', 'Duración', 'Costo Tiempo', 'Consumos', 'Total', 'Método']],
    body:
      sesionesBody.length > 0
        ? sesionesBody
        : [['No se registraron sesiones finalizadas en este periodo.', '', '', '', '', '', '', '']],
    headStyles: {
      fillColor: [23, 31, 51],
      textColor: [218, 226, 253],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    didParseCell: (data) => {
      // Resaltar la fila de totales
      if (
        sesiones.length > 0 &&
        data.row.index === sesionesBody.length - 1 &&
        data.section === 'body'
      ) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [226, 232, 240]
      }
    }
  })

  startY = doc.lastAutoTable.finalY + 8

  // 4. Tabla de Ventas en Barra
  // Si queda poco espacio en la página, crear una nueva página
  if (startY > 230) {
    doc.addPage()
    startY = 18
  }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(11, 19, 38)
  doc.text(`2. VENTAS DIRECTAS EN BARRA (${ventasBarra.length} registros)`, 14, startY)

  const ventasBody = ventasBarra.map((v) => [
    `#${v.id_venta}`,
    formatearFechaHora(v.fecha_hora),
    v.nota || '-',
    `${v.total_items} uds.`,
    `Bs. ${Number(v.total || 0).toFixed(2)}`,
    v.metodo_pago || 'EFECTIVO'
  ])

  if (ventasBarra.length > 0) {
    ventasBody.push([
      'TOTAL BARRA',
      '-',
      '-',
      `${cantidadItemsBarra} uds.`,
      `Bs. ${ingresoBarra}`,
      '-'
    ])
  }

  autoTable(doc, {
    startY: startY + 3,
    theme: 'striped',
    head: [['N° Venta', 'Fecha y Hora', 'Nota / Referencia', 'Ítems', 'Total', 'Método']],
    body:
      ventasBody.length > 0
        ? ventasBody
        : [['No se registraron ventas en barra en este periodo.', '', '', '', '', '']],
    headStyles: {
      fillColor: [23, 31, 51],
      textColor: [218, 226, 253],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59]
    },
    didParseCell: (data) => {
      // Resaltar la fila de totales
      if (
        ventasBarra.length > 0 &&
        data.row.index === ventasBody.length - 1 &&
        data.section === 'body'
      ) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [226, 232, 240]
      }
    }
  })

  // 5. Pie de página con numeración
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Página ${i} de ${pageCount} - Generado por ${nombreLocal} POS`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    )
  }

  // Descarga del archivo
  const nombreArchivo =
    fechaInicio === fechaFin
      ? `reporte-caja-${fechaInicio}.pdf`
      : `reporte-caja-${fechaInicio}_a_${fechaFin}.pdf`
  doc.save(nombreArchivo)
}
