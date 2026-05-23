'use client';

import { useState, useCallback } from 'react';
import { FileText, Download, Plus, Loader2, Trash2, Edit3, Send, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  useQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
} from '@/hooks/use-queries';

interface QuotationItem {
  name: string;
  marbleType: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Quotation {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: QuotationItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  status: string;
  notes: string;
  validUntil: string;
  createdAt: string;
  updatedAt?: string;
}

const emptyQuote = (): Quotation => ({
  id: '',
  number: `Q-${Date.now().toString(36).toUpperCase()}`,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerAddress: '',
  items: [{ name: '', marbleType: '', quantity: 1, unit: 'sqft', unitPrice: 0, total: 0 }],
  subtotal: 0,
  discountPercent: 0,
  discountAmount: 0,
  taxableAmount: 0,
  gstRate: 18,
  gstAmount: 0,
  totalAmount: 0,
  status: 'Draft',
  notes: '',
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '',
  createdAt: new Date().toISOString(),
});

export default function QuotationsPage() {
  const { data, isLoading, error: queryError, refetch } = useQuotationsQuery();
  const createQuote = useCreateQuotationMutation();
  const updateQuote = useUpdateQuotationMutation();
  const deleteQuote = useDeleteQuotationMutation();

  // Map API response with safe defaults
  const quotations: Quotation[] = (data?.quotations || []).map((q: Record<string, unknown>): Quotation => ({
    id: q.id || '',
    number: q.quotationNumber || '',
    customerName: q.customerName || '',
    customerPhone: q.customerPhone || '',
    customerEmail: q.customerEmail || '',
    customerAddress: q.customerAddress || '',
    items: q.items || [],
    subtotal: q.subtotal || 0,
    discountPercent: q.discountPercent || q.discount_percent || 0,
    discountAmount: q.discountAmount || q.discount_amount || 0,
    taxableAmount: q.taxableAmount || q.taxable_amount || 0,
    gstRate: q.gstRate || q.gst_rate || 18,
    gstAmount: q.gstAmount || q.gst_amount || 0,
    totalAmount: q.totalAmount || q.total_amount || 0,
    status: q.status || 'Draft',
    notes: q.notes || '',
    validUntil: q.validUntil || q.valid_until || '',
    createdAt: q.createdAt || q.created_at || '',
  }));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quotation>(emptyQuote());
  const [submitting, setSubmitting] = useState(false);
  const [localError, setError] = useState('');

  const error = localError || (queryError ? (queryError as Error).message : '');

  const statusFlow: Record<string, { next: string[]; icon: React.ComponentType<{ className?: string }>; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    Draft: { next: ['Sent'], icon: Send, variant: 'outline' },
    Sent: { next: ['Approved', 'Rejected'], icon: CheckCircle, variant: 'secondary' },
    Approved: { next: ['Converted'], icon: CheckCircle, variant: 'default' },
    Converted: { next: [], icon: CheckCircle, variant: 'default' },
    Rejected: { next: ['Draft'], icon: XCircle, variant: 'destructive' },
  };

  const calculateTotals = useCallback((items: QuotationItem[], gstRate: number, discountPercent = 0) => {
    const itemsWithTotal = items.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = Math.round(subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = Math.round(taxableAmount * gstRate) / 100;
    return { items: itemsWithTotal, subtotal, discountAmount, taxableAmount, gstAmount, totalAmount: taxableAmount + gstAmount };
  }, []);

  function updateItem(index: number, field: keyof QuotationItem, value: string | number) {
    const newItems = currentQuote.items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice;
      }
      return updated;
    });

    const totals = calculateTotals(newItems, currentQuote.gstRate, currentQuote.discountPercent);
    setCurrentQuote({ ...currentQuote, ...totals });
  }

  function addItem() {
    setCurrentQuote({
      ...currentQuote,
      items: [...currentQuote.items, { name: '', marbleType: '', quantity: 1, unit: 'sqft', unitPrice: 0, total: 0 }],
    });
  }

  function removeItem(index: number) {
    if (currentQuote.items.length <= 1) return;
    const newItems = currentQuote.items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems, currentQuote.gstRate, currentQuote.discountPercent);
    setCurrentQuote({ ...currentQuote, ...totals });
  }

  // Generate PDF quotation with full error handling
  async function generatePDF(quote: Quotation) {
    try {
      const [{ jsPDF }, _] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MARBLE MART', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Marble & Construction Materials', pageWidth / 2, 27, { align: 'center' });
    doc.text('GST: 07ABCDE1234F1Z5', pageWidth / 2, 33, { align: 'center' });

    // Line
    doc.setDrawColor(200);
    doc.line(14, 38, pageWidth - 14, 38);

    // Quotation Details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', 14, 48);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Quotation #: ${quote.number}`, 14, 56);
    doc.text(`Date: ${formatDate(quote.createdAt)}`, 14, 62);
    doc.text(`Valid Until: ${quote.validUntil ? formatDate(quote.validUntil) : 'N/A'}`, 14, 68);
    // Discount line
    if (quote.discountPercent > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`Discount: ${quote.discountPercent}% (-₹${quote.discountAmount.toLocaleString('en-IN')})`, 14, 74);
      doc.setTextColor(0);
    }

    // Customer Details
    doc.text('Bill To:', pageWidth - 14, 56, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(quote.customerName, pageWidth - 14, 62, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(quote.customerPhone, pageWidth - 14, 68, { align: 'right' });

    // Items Table
    const tableBody = quote.items.map((item, i) => [
      i + 1,
      `${item.name} (${item.marbleType})`,
      (item.quantity ?? 0).toString(),
      item.unit || 'sqft',
      `₹${(item.unitPrice ?? 0).toLocaleString('en-IN')}`,
      `₹${(item.total ?? 0).toLocaleString('en-IN')}`,
    ]);

    (doc).autoTable({
      startY: quote.discountPercent > 0 ? 82 : 75,
      head: [['#', 'Description', 'Qty', 'Unit', 'Rate', 'Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      foot: [
        [
          { content: '', colSpan: 4 },
          { content: 'Subtotal', styles: { fontStyle: 'bold' } },
          { content: `₹${quote.subtotal.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
        ],
        ...(quote.discountPercent > 0 ? [[
          { content: '', colSpan: 4 },
          { content: `Discount (${quote.discountPercent}%)`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
          { content: `-₹${quote.discountAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
        ]] : []),
        [
          { content: '', colSpan: 4 },
          { content: `GST (${quote.gstRate}%)`, styles: { fontStyle: 'bold' } },
          { content: `₹${quote.gstAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold' } },
        ],
        [
          { content: '', colSpan: 4 },
          { content: 'Total', styles: { fontStyle: 'bold', fontSize: 11 } },
          { content: `₹${quote.totalAmount.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fontSize: 11 } },
        ],
      ],
    });

    // Footer
    const finalY = (doc).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.text('Terms & Conditions:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text('1. Quotation valid for 30 days', 14, finalY + 7);
    doc.text('2. Delivery charges extra as applicable', 14, finalY + 13);
    doc.text('3. GST will be charged as per government rates', 14, finalY + 19);
    doc.text('4. Payment terms: 50% advance, 50% on delivery', 14, finalY + 25);

    doc.setFontSize(8);
    doc.text('This is a computer-generated quotation.', pageWidth / 2, finalY + 35, { align: 'center' });

    doc.save(`Quotation-${quote.number}.pdf`);
    } catch (err) {
      console.error('[PDF] Generation failed:', err);
      setError('Failed to generate PDF: ' + ((err as Error).message || 'Unknown error'));
    }
  }

  async function handleCreateOrUpdate() {
    if (!currentQuote.customerName) return;
    setSubmitting(true);
    try {
      const payload = {
        customerName: currentQuote.customerName,
        customerPhone: currentQuote.customerPhone,
        customerEmail: currentQuote.customerEmail,
        customerAddress: currentQuote.customerAddress,
        items: currentQuote.items.map((item) => ({
          name: item.name,
          marble_type: item.marbleType,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total: item.total,
        })),
        subtotal: currentQuote.subtotal,
        discountPercent: currentQuote.discountPercent,
        discountAmount: currentQuote.discountAmount,
        taxableAmount: currentQuote.taxableAmount,
        gstRate: currentQuote.gstRate,
        gstAmount: currentQuote.gstAmount,
        totalAmount: currentQuote.totalAmount,
        notes: currentQuote.notes,
        validUntil: currentQuote.validUntil,
      };

      if (editingId) {
        await updateQuote.mutateAsync({ id: editingId, ...payload, status: currentQuote.status });
      } else {
        await createQuote.mutateAsync(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setCurrentQuote(emptyQuote());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(quote: Quotation, newStatus: string) {
    try {
      await updateQuote.mutateAsync({ id: quote.id, status: newStatus });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function openEditModal(quote: Quotation) {
    setEditingId(quote.id);
    setCurrentQuote(quote);
    setIsModalOpen(true);
  }

  function openCreateModal() {
    setEditingId(null);
    setCurrentQuote(emptyQuote());
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this quotation?')) return;
    try {
      await deleteQuote.mutateAsync(id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-20 rounded-xl" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quotations</h2>
          <p className="text-sm text-muted-foreground">Create & manage GST-compliant quotations</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          New Quotation
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400 border border-red-200 rounded-lg px-3 py-2">
          {error}
          <button className="ml-2 underline" onClick={() => { setError(''); refetch(); }}>Retry</button>
        </div>
      )}

      {/* Quotation list */}
      <div className="grid gap-4">
        {quotations.map((quote) => (
          <Card key={quote.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{quote.number}</span>
                    <Badge variant={
                      quote.status === 'Approved' || quote.status === 'Converted' ? 'default' :
                      quote.status === 'Rejected' ? 'destructive' : 'secondary'
                    }>
                      {quote.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold">{quote.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {quote.items?.length || 0} items · {formatCurrency(quote.totalAmount)} · {formatDate(quote.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Status workflow buttons */}
                  {statusFlow[quote.status]?.next.map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(quote, nextStatus)}
                      className={
                        nextStatus === 'Approved' ? 'text-emerald-600 border-emerald-300 hover:bg-emerald-50' :
                        nextStatus === 'Rejected' ? 'text-red-600 border-red-300 hover:bg-red-50' :
                        ''
                      }
                    >
                      {nextStatus === 'Approved' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                      {nextStatus === 'Rejected' && <XCircle className="h-3.5 w-3.5 mr-1" />}
                      {nextStatus === 'Sent' && <Send className="h-3.5 w-3.5 mr-1" />}
                      {nextStatus}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => openEditModal(quote)}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => generatePDF(quote)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(quote.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {quotations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No quotations yet. Create your first one.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Quotation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Quotation' : 'New Quotation'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-3">
              <input
                className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
                placeholder="Customer Name *"
                value={currentQuote.customerName}
                onChange={(e) => setCurrentQuote({ ...currentQuote, customerName: e.target.value })}
              />
              <input
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
                placeholder="Phone"
                value={currentQuote.customerPhone}
                onChange={(e) => setCurrentQuote({ ...currentQuote, customerPhone: e.target.value })}
              />
              <input
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
                placeholder="Email"
                value={currentQuote.customerEmail}
                onChange={(e) => setCurrentQuote({ ...currentQuote, customerEmail: e.target.value })}
              />
              <input
                className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
                placeholder="Address"
                value={currentQuote.customerAddress}
                onChange={(e) => setCurrentQuote({ ...currentQuote, customerAddress: e.target.value })}
              />
              <input
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
                placeholder="Notes"
                value={currentQuote.notes}
                onChange={(e) => setCurrentQuote({ ...currentQuote, notes: e.target.value })}
              />
              <input
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
                type="date"
                placeholder="Valid Until"
                value={currentQuote.validUntil}
                onChange={(e) => setCurrentQuote({ ...currentQuote, validUntil: e.target.value })}
              />
              <input
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
                type="number"
                placeholder="GST Rate %"
                value={currentQuote.gstRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value) || 0;
                  const totals = calculateTotals(currentQuote.items, rate, currentQuote.discountPercent);
                  setCurrentQuote({ ...currentQuote, gstRate: rate, ...totals });
                }}
              />
              <input
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
                type="number"
                placeholder="Discount %"
                value={currentQuote.discountPercent}
                onChange={(e) => {
                  const disc = parseFloat(e.target.value) || 0;
                  const totals = calculateTotals(currentQuote.items, currentQuote.gstRate, disc);
                  setCurrentQuote({ ...currentQuote, discountPercent: disc, ...totals });
                }}
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Items</span>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              {currentQuote.items.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-2 items-center">
                  <input
                    className="col-span-2 px-2 py-1.5 border border-input rounded text-sm bg-background"
                    placeholder="Description"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                  />
                  <input
                    className="px-2 py-1.5 border border-input rounded text-sm bg-background"
                    placeholder="Type"
                    value={item.marbleType}
                    onChange={(e) => updateItem(index, 'marbleType', e.target.value)}
                  />
                  <input
                    className="px-2 py-1.5 border border-input rounded text-sm bg-background"
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                  <input
                    className="px-2 py-1.5 border border-input rounded text-sm bg-background"
                    type="number"
                    placeholder="Rate"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">₹{item.total.toLocaleString('en-IN')}</span>
                    {currentQuote.items.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 text-xs hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{currentQuote.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {currentQuote.discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({currentQuote.discountPercent}%)</span>
                  <span>-₹{currentQuote.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST ({currentQuote.gstRate}%)</span>
                <span className="font-medium">₹{currentQuote.gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-1 border-t">
                <span>Total</span>
                <span>₹{currentQuote.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleCreateOrUpdate} disabled={!currentQuote.customerName || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {submitting ? 'Saving...' : editingId ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
