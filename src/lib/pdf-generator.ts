// ============================================================
// Professional PDF Generator — Marble Mart Branded Templates
// ============================================================

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getGstInfo, calculateGst } from '@/config/gst';

// Branding config — replace with actual company details
const BRAND = {
  companyName: 'MARBLE MART',
  tagline: 'Premium Marble & Construction Materials',
  gstNumber: '08ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  address: '123, Marble Market, Kishangarh, Rajasthan — 305801',
  phone: '+91-98765-43210',
  email: 'info@marblemart.com',
  website: 'www.marblemart.com',
  bankName: 'HDFC Bank',
  bankAccount: '12345678901234',
  bankIfsc: 'HDFC0001234',
  logo: null as string | null, // Base64 logo can be set here
};

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGst?: string;
  items: Array<{
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
  notes?: string;
  transportCost?: number;
  isInterstate?: boolean;
}

export function generateProfessionalInvoice(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Colors ──
  const primaryColor = [30, 41, 59] as [number, number, number]; // Slate-800
  const accentColor = [59, 130, 246] as [number, number, number]; // Blue-500
  const lightGray = [241, 245, 249] as [number, number, number]; // Slate-100

  // ── Header Bar ──
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND.companyName, margin, 18);

  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(BRAND.tagline, margin, 26);
  doc.text(`GST: ${BRAND.gstNumber}`, margin, 32);

  // ── Document Title ──
  doc.setTextColor(...primaryColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - margin, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  // Invoice Info — right side
  const infoX = pageWidth - margin;
  doc.text(`Invoice #: ${data.invoiceNumber}`, infoX, 32, { align: 'right' });
  doc.text(`Date: ${data.date}`, infoX, 38, { align: 'right' });
  if (data.dueDate) {
    doc.text(`Due Date: ${data.dueDate}`, infoX, 44, { align: 'right' });
  }

  // ── Customer Details ──
  let yPos = 50;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, yPos);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  yPos += 7;
  doc.text(data.customerName || 'Customer', margin, yPos);
  doc.setFont('helvetica', 'normal');

  if (data.customerAddress) {
    const addressLines = doc.splitTextToSize(data.customerAddress, pageWidth / 2 - margin);
    yPos += 6;
    doc.text(addressLines, margin, yPos);
    yPos += (addressLines.length - 1) * 5;
  }
  if (data.customerPhone) {
    yPos += 6;
    doc.text(`Phone: ${data.customerPhone}`, margin, yPos);
  }
  if (data.customerGst) {
    yPos += 6;
    doc.text(`GST: ${data.customerGst}`, margin, yPos);
  }
  if (data.customerEmail) {
    yPos += 6;
    doc.text(`Email: ${data.customerEmail}`, margin, yPos);
  }

  // ── Company Details — right side ──
  const rightX = pageWidth / 2 + 5;
  let ryPos = 50;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`From: ${BRAND.companyName}`, rightX, ryPos);
  ryPos += 5;
  doc.text(BRAND.address, rightX, ryPos);
  ryPos += 5;
  doc.text(`Phone: ${BRAND.phone}`, rightX, ryPos);
  ryPos += 5;
  doc.text(`GST: ${BRAND.gstNumber}`, rightX, ryPos);
  ryPos += 5;
  doc.text(`PAN: ${BRAND.pan}`, rightX, ryPos);

  // ── Items Table ──
  yPos = Math.max(yPos, ryPos) + 12;

  const tableHeaders = [
    ['#', 'Description', 'HSN', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)'],
  ];

  const tableBody = data.items.map((item, i) => [
    String(i + 1),
    item.description,
    item.hsnCode || '68022110',
    String(item.quantity),
    item.unit || 'sqft',
    item.rate.toLocaleString('en-IN'),
    item.amount.toLocaleString('en-IN'),
  ]);

  (doc as any).autoTable({
    startY: yPos,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
    foot: [
      [
        { content: '', colSpan: 5 },
        { content: 'Subtotal', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: `₹${data.subtotal.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', halign: 'right' } },
      ],
      ...(data.cgst > 0
        ? [[
            { content: '', colSpan: 5 },
            { content: `CGST (${(data.gstRate / 2).toFixed(1)}%)`, styles: { halign: 'right' } },
            { content: `₹${data.cgst.toLocaleString('en-IN')}`, styles: { halign: 'right' } },
          ]]
        : []),
      ...(data.sgst > 0
        ? [[
            { content: '', colSpan: 5 },
            { content: `SGST (${(data.gstRate / 2).toFixed(1)}%)`, styles: { halign: 'right' } },
            { content: `₹${data.sgst.toLocaleString('en-IN')}`, styles: { halign: 'right' } },
          ]]
        : []),
      ...(data.igst > 0
        ? [[
            { content: '', colSpan: 5 },
            { content: `IGST (${data.gstRate}%)`, styles: { halign: 'right' } },
            { content: `₹${data.igst.toLocaleString('en-IN')}`, styles: { halign: 'right' } },
          ]]
        : []),
      ...(data.transportCost
        ? [[
            { content: '', colSpan: 5 },
            { content: 'Transport', styles: { halign: 'right' } },
            { content: `₹${data.transportCost.toLocaleString('en-IN')}`, styles: { halign: 'right' } },
          ]]
        : []),
      [
        { content: '', colSpan: 5 },
        { content: 'Grand Total', styles: { fontStyle: 'bold', fontSize: 11, halign: 'right', fillColor: primaryColor, textColor: [255, 255, 255] } },
        { content: `₹${data.totalAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fontSize: 11, halign: 'right', fillColor: primaryColor, textColor: [255, 255, 255] } },
      ],
    ],
    footStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // ── Amount in Words ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Amount in Words:', margin, finalY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(numberToWords(data.totalAmount) + ' only', margin, finalY + 5);

  // ── Payment Details ──
  finalY += 14;
  if (data.amountPaid !== undefined && data.balanceDue !== undefined) {
    doc.setFontSize(8);
    doc.text(`Paid: ₹${(data.amountPaid || 0).toLocaleString('en-IN')}  |  Balance Due: ₹${(data.balanceDue || 0).toLocaleString('en-IN')}`, margin, finalY);
    finalY += 5;
  }

  // ── Bank Details ──
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Bank: ${BRAND.bankName}  |  A/c: ${BRAND.bankAccount}  |  IFSC: ${BRAND.bankIfsc}`, margin, finalY);
  finalY += 10;

  // ── Terms & Footer ──
  doc.setDrawColor(200);
  doc.line(margin, finalY, pageWidth - margin, finalY);
  finalY += 7;

  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text('Terms & Conditions:', margin, finalY);
  doc.text('1. Payment due within 30 days of invoice date.', margin, finalY + 4);
  doc.text('2. Interest @18% p.a. on overdue payments.', margin, finalY + 9);
  doc.text('3. All disputes subject to Kishangarh (Rajasthan) jurisdiction.', margin, finalY + 14);
  doc.text('4. Goods once sold will not be taken back.', margin, finalY + 19);

  finalY += 25;
  doc.text('This is a computer-generated invoice. No signature required.', pageWidth / 2, finalY, { align: 'center' });
  doc.text(`${BRAND.website}  |  ${BRAND.email}`, pageWidth / 2, finalY + 5, { align: 'center' });

  return doc;
}

// ── Number to Words (Indian numbering system) ──
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n: number): string {
    if (n < 20) return ones[n]!;
    if (n < 100) {
      const t = Math.floor(n / 10);
      const o = n % 10;
      return tens[t] + (o ? ' ' + ones[o] : '');
    }
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rest = n % 100;
      return ones[h] + ' Hundred' + (rest ? ' ' + convertHundreds(rest) : '');
    }
    return '';
  }

  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;

  const parts: string[] = [];
  if (crores > 0) parts.push(convertHundreds(crores) + ' Crore');
  if (lakhs > 0) parts.push(convertHundreds(lakhs) + ' Lakh');
  if (thousands > 0) parts.push(convertHundreds(thousands) + ' Thousand');
  if (hundreds > 0) parts.push(convertHundreds(hundreds));

  return parts.join(' ');
}

// ── Convenience: Generate invoice PDF from API data ──
export function generateInvoicePDF(invoice: any): jsPDF {
  return generateProfessionalInvoice({
    invoiceNumber: invoice.invoiceNumber || invoice.invoice_number || 'N/A',
    date: new Date(invoice.createdAt || invoice.created_at || Date.now()).toLocaleDateString('en-IN'),
    dueDate: invoice.dueDate || invoice.due_date,
    customerName: invoice.customerName || invoice.customer_name || 'Customer',
    customerPhone: invoice.customerPhone || invoice.customer_phone,
    customerEmail: invoice.customerEmail || invoice.customer_email,
    customerAddress: invoice.customerAddress || invoice.customer_address,
    customerGst: invoice.gstNumber || invoice.gst_number,
    items: (invoice.items || []).map((item: any) => ({
      description: item.name || item.description || 'Marble Item',
      hsnCode: item.hsn_code || '68022110',
      quantity: item.quantity || 1,
      unit: item.unit || 'sqft',
      rate: item.unitPrice || item.unit_price || item.rate || 0,
      amount: item.total || (item.quantity * (item.unitPrice || item.unit_price || 0)),
    })),
    subtotal: invoice.subtotal || 0,
    gstRate: invoice.gstRate || invoice.gst_rate || 18,
    cgst: invoice.cgst || 0,
    sgst: invoice.sgst || 0,
    igst: invoice.igst || 0,
    totalAmount: invoice.totalAmount || invoice.total_amount || 0,
    amountPaid: invoice.amountPaid || invoice.amount_paid || 0,
    balanceDue: invoice.balanceDue || invoice.balance_due || 0,
  });
}

// ── Generate quotation PDF ──
export function generateQuotationPDF(quotation: any): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MARBLE MART', margin, 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Marble & Construction Materials  |  GST: 08ABCDE1234F1Z5', margin, 24);
  doc.text('123, Marble Market, Kishangarh, Rajasthan — 305801  |  +91-98765-43210', margin, 30);

  // Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth - margin, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Quote #: ${quotation.quotationNumber || quotation.quotation_number || 'N/A'}`, pageWidth - margin, 30, { align: 'right' });
  doc.text(`Date: ${new Date(quotation.createdAt || quotation.created_at || Date.now()).toLocaleDateString('en-IN')}`, pageWidth - margin, 36, { align: 'right' });
  doc.text(`Valid Until: ${quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-IN') : '30 days'}`, pageWidth - margin, 42, { align: 'right' });

  // Customer
  let y = 48;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Prepared For:', margin, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(quotation.customerName || quotation.customer_name || 'Customer', margin, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (quotation.customerPhone || quotation.customer_phone) {
    doc.text(`Phone: ${quotation.customerPhone || quotation.customer_phone}`, margin, y + 13);
  }

  // Items Table
  y = 72;
  const items = quotation.items || [];
  const tableBody = items.map((item: any, i: number) => [
    i + 1,
    `${item.name || item.description || 'Marble'} (${item.marble_type || item.marbleType || 'Standard'})`,
    item.quantity || 1,
    item.unit || 'sqft',
    `₹${(item.unitPrice || item.unit_price || 0).toLocaleString('en-IN')}`,
    `₹${(item.total || (item.quantity * (item.unitPrice || item.unit_price || 0))).toLocaleString('en-IN')}`,
  ]);

  (doc as any).autoTable({
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit', 'Rate', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    foot: [
      [
        { content: '', colSpan: 4 },
        { content: 'Subtotal', styles: { fontStyle: 'bold' } },
        { content: `₹${(quotation.subtotal || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
      ],
      [
        { content: '', colSpan: 4 },
        { content: `GST (${quotation.gstRate || quotation.gst_rate || 18}%)`, styles: { fontStyle: 'bold' } },
        { content: `₹${(quotation.gstAmount || quotation.gst_amount || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
      ],
      [
        { content: '', colSpan: 4 },
        { content: 'Total', styles: { fontStyle: 'bold', fontSize: 10 } },
        { content: `₹${(quotation.totalAmount || quotation.total_amount || 0).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fontSize: 10 } },
      ],
    ],
  });

  let fy = (doc as any).lastAutoTable.finalY + 12;

  // Terms
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Terms:', margin, fy);
  doc.text('1. Quotation valid for 30 days | 2. Prices exclude transportation | 3. 50% advance for order confirmation', margin, fy + 5);
  doc.text('4. GST as applicable | 5. Delivery: 7-15 working days after order confirmation', margin, fy + 10);

  fy += 20;
  doc.setFontSize(7);
  doc.text('This is a computer-generated quotation.', pageWidth / 2, fy, { align: 'center' });

  return doc;
}
