import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const toDataUrl = async (url) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export const downloadPdfReport = async ({
  fileName,
  title,
  rows,
  columns,
  metadata = [],
  logoUrl = '/ubuntu_logo.png',
}) => {
  const safeColumns = Array.isArray(columns) ? columns : []
  const safeRows = Array.isArray(rows) ? rows : []
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const logoDataUrl = await toDataUrl(logoUrl)

  pdf.setFillColor(245, 248, 245)
  pdf.rect(0, 0, pageWidth, 88, 'F')

  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', 36, 16, 56, 56)
  }

  pdf.setTextColor(50, 84, 41)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text(title || 'Report', 104, 40)

  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(102, 102, 102)
  pdf.setFontSize(10)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, 104, 58)
  pdf.text(`Total records: ${safeRows.length}`, 104, 74)

  let startY = 106
  if (metadata.length > 0) {
    const metaText = metadata
      .filter((item) => item && item.label)
      .map((item) => `${item.label}: ${item.value || 'All'}`)
      .join('   |   ')
    if (metaText) {
      pdf.setTextColor(85, 85, 85)
      pdf.setFontSize(9)
      pdf.text(metaText, 36, startY)
      startY += 16
    }
  }

  autoTable(pdf, {
    startY,
    head: [safeColumns.map((col) => col.label)],
    body: safeRows.map((row) => safeColumns.map((col) => {
      const raw = col.getValue(row)
      return raw === null || raw === undefined ? '' : String(raw)
    })),
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 6,
      lineColor: [225, 232, 225],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [67, 112, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 249],
    },
    margin: { left: 36, right: 36 },
    didDrawPage: () => {
      const footerY = pdf.internal.pageSize.getHeight() - 18
      pdf.setFontSize(8)
      pdf.setTextColor(120, 120, 120)
      pdf.text('Ubuntu HRMS Report', 36, footerY)
    },
  })

  pdf.save(fileName || 'report.pdf')
}
