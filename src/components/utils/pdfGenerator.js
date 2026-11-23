import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Mengekspor elemen DOM template laporan A4 menjadi file PDF tanpa terpengaruh warna oklch Tailwind v4.
 */
export async function exportElementToPdfA4(element, fileName = 'Laporan-Supervisi.pdf') {
  if (!element) throw new Error('Template laporan tidak ditemukan.');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      // Hapus tag <style> dan <link rel="stylesheet"> milik Tailwind v4 pada dokumen kloningan
      // agar html2canvas tidak mem-parsing fungsi warna oklch(...) yang belum didukungnya.
      clonedDoc
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((node) => node.remove());

      const target = clonedDoc.querySelector('[data-pdf-root="true"]');
      if (target) {
        target.style.position = 'static';
        target.style.left = '0';
        target.style.top = '0';
      }
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = heightLeft - contentHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save(fileName);
}