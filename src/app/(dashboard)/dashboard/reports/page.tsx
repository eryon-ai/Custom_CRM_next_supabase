'use client';

import { useState, useCallback } from 'react';
import { Download, FileSpreadsheet, Calendar, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useLeadsQuery } from '@/hooks/use-queries';

export default function ReportsPage() {
  const { data, isLoading } = useLeadsQuery();
  const leads = data?.leads || [];
  const [selectedReport, setSelectedReport] = useState<string>('leads');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exporting, setExporting] = useState(false);

  // Filter leads by date range
  const dateFilter = useCallback(() => {
    const now = new Date();
    let start: Date;
    switch (dateRange) {
      case '7d': start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }
    return leads.filter((l: any) => new Date(l.createdAt) >= start);
  }, [leads, dateRange]);

  const filteredLeads = dateFilter();
  const convertedLeads = filteredLeads.filter((l: any) => l.status === 'Converted');
  const totalValue = filteredLeads.reduce((s: number, l: any) => s + (l.dealValue || 0), 0);

  const exportToCSV = useCallback(async () => {
    setExporting(true);
    try {
      const headers = ['Name', 'Phone', 'Marble Type', 'Quantity', 'Status', 'Deal Value', 'Agent', 'Created'];
      const rows = filteredLeads.map((l: any) => [
        l.name,
        l.phone,
        l.marbleType || '',
        l.quantity || '',
        l.status,
        String(l.dealValue || 0),
        l.assignedTo || '',
        l.createdAt,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marble-mart-report-${selectedReport}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [filteredLeads, selectedReport]);

  const exportToPDF = useCallback(async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Marble Mart CRM Report', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report: ${selectedReport.toUpperCase()}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 34);

      const tableData = filteredLeads.map((l: any) => [
        l.name,
        l.phone,
        l.marbleType || '',
        l.quantity || '',
        l.status,
        `₹${(l.dealValue || 0).toLocaleString('en-IN')}`,
      ]);

      (doc as any).autoTable({
        startY: 42,
        head: [['Name', 'Phone', 'Marble', 'Qty', 'Status', 'Value']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`marble-mart-report-${selectedReport}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  }, [selectedReport]);

  const reportTypes = [
    { id: 'leads', label: 'Lead Report', desc: 'All leads with status and value' },
    { id: 'conversion', label: 'Conversion Report', desc: 'Conversion rates and funnel data' },
    { id: 'revenue', label: 'Revenue Report', desc: 'Monthly revenue and projections' },
    { id: 'agent', label: 'Agent Performance', desc: 'Agent-wise metrics and rankings' },
    { id: 'inventory', label: 'Inventory Report', desc: 'Stock levels and valuations' },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${leads.length} leads available for export`}
          </p>
        </div>
      </div>

      {/* Stats from real data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Leads</p><p className="text-xl font-bold">{isLoading ? '—' : leads.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Converted</p><p className="text-xl font-bold text-emerald-500">{isLoading ? '—' : convertedLeads.length}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Pipeline Value</p><p className="text-xl font-bold">{isLoading ? '—' : formatCurrency(totalValue)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Conv. Rate</p><p className="text-xl font-bold text-blue-500">{isLoading || leads.length === 0 ? '—' : `${Math.round((convertedLeads.length / leads.length) * 100)}%`}</p></CardContent></Card>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {(['7d', '30d', '90d', '1y'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              dateRange === range
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {range === '7d' && '7 Days'}
            {range === '30d' && '30 Days'}
            {range === '90d' && '90 Days'}
            {range === '1y' && '1 Year'}
          </button>
        ))}
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedReport === report.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedReport(report.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{report.label}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
                </div>
                {selectedReport === report.id && (
                  <Badge variant="default" className="text-[10px]">Selected</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Preview — {reportTypes.find((r) => r.id === selectedReport)?.label}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} disabled={exporting}>
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button size="sm" onClick={exportToPDF} disabled={exporting}>
                <Download className="h-4 w-4 mr-1" />
                {exporting ? 'Exporting...' : 'PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Marble</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Value</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeads.map((lead: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.marbleType}</td>
                    <td className="px-4 py-3">{lead.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{lead.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(lead.value)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
