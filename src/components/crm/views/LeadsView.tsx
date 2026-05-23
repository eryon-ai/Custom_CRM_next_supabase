import { useMemo, useState, memo } from 'react';
import { Plus, Package, Search, X, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { MARBLE_TYPES, PROJECT_TYPES, MARBLE_FINISHES, MARBLE_THICKNESSES, calculateMarbleEstimate } from '@/config/marbles';
import { formatCurrency } from '@/lib/utils';

const INITIAL_LEAD = {
  name: '',
  phone: '',
  marbleType: '',
  marbleFinish: '',
  marbleThickness: '18',
  projectType: '',
  lengthFt: '',
  widthFt: '',
  quantity: '',
  siteLocation: '',
  budget: '',
  status: 'New',
  assignedTo: '',
};

interface LeadsViewProps {
  leads: any[];
  agents: any[];
  onCreateLead?: (lead: any) => Promise<boolean>;
  onAdvanceStatus?: (id: string, status: string) => void;
  loading?: boolean;
  error?: string | null;
}

export const LeadsView = memo(function LeadsView({ leads, agents, onCreateLead, onAdvanceStatus, loading, error }: LeadsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newLead, setNewLead] = useState(INITIAL_LEAD);

  const filteredLeads = useMemo(
    () =>
      leads.filter(
        (lead: any) =>
          (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.phone.includes(searchTerm)) &&
          (filterStatus === 'All' || lead.status === filterStatus)
      ),
    [leads, searchTerm, filterStatus]
  );

  async function handleAddLead() {
    if (!newLead.name || !newLead.phone || !onCreateLead) return;
    setSubmitting(true);
    const ok = await onCreateLead(newLead);
    setSubmitting(false);
    if (ok) {
      setIsModalOpen(false);
      setNewLead(INITIAL_LEAD);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name or phone..."
          />
        </div>
        <select
          className="px-3 py-2.5 bg-background border border-input rounded-lg text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Converted">Converted</option>
          <option value="Lost">Lost</option>
        </select>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Error */}
      {error ? (
        <div className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 rounded-lg px-3 py-2">
          {error}
        </div>
      ) : null}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Client</th>
                  <th className="px-6 py-4 font-medium">Requirement</th>
                  <th className="px-6 py-4 font-medium">Site</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLeads.map((lead: any) => (
                  <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{lead.marbleType}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center">
                        <Package className="w-3 h-3 mr-1" />
                        {lead.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{lead.siteLocation}</td>
                    <td className="px-6 py-4"><Badge variant="outline">{lead.status}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAdvanceStatus?.(lead.id, lead.status)}
                      >
                        Next Status
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && (
            <div className="px-6 py-3 text-sm text-muted-foreground">Loading leads...</div>
          )}
        </CardContent>
      </Card>

      {/* Add Lead Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Lead — Marble Requirement</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            <input
              className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Client Name *"
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Phone Number *"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Budget (₹)"
              value={newLead.budget}
              onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
            />

            {/* Marble Type Dropdown */}
            <select
              className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
              value={newLead.marbleType}
              onChange={(e) => setNewLead({ ...newLead, marbleType: e.target.value })}
            >
              <option value="">Select Marble Type</option>
              {MARBLE_TYPES.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} — ₹{m.pricePerSqft}/sqft ({m.grade})
                </option>
              ))}
            </select>

            {/* Finish & Thickness */}
            <select
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              value={newLead.marbleFinish}
              onChange={(e) => setNewLead({ ...newLead, marbleFinish: e.target.value })}
            >
              <option value="">Finish</option>
              {MARBLE_FINISHES.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              value={newLead.marbleThickness}
              onChange={(e) => setNewLead({ ...newLead, marbleThickness: e.target.value })}
            >
              <option value="">Thickness</option>
              {MARBLE_THICKNESSES.map((t) => (
                <option key={t.mm} value={t.mm}>{t.label} — {t.usage}</option>
              ))}
            </select>

            {/* Project Type */}
            <select
              className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
              value={newLead.projectType}
              onChange={(e) => setNewLead({ ...newLead, projectType: e.target.value })}
            >
              <option value="">Project Type</option>
              {PROJECT_TYPES.map((p) => (
                <option key={p.id} value={p.label}>{p.label}</option>
              ))}
            </select>

            {/* Area dimensions */}
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Area (ft)</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">L:</span>
                  <input
                    className="flex-1 px-3 py-2 border border-input rounded-lg text-sm bg-background"
                    type="number"
                    placeholder="Length (ft)"
                    value={newLead.lengthFt}
                    onChange={(e) => setNewLead({ ...newLead, lengthFt: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">W:</span>
                  <input
                    className="flex-1 px-3 py-2 border border-input rounded-lg text-sm bg-background"
                    type="number"
                    placeholder="Width (ft)"
                    value={newLead.widthFt}
                    onChange={(e) => setNewLead({ ...newLead, widthFt: e.target.value })}
                  />
                </div>
              </div>
              {newLead.lengthFt && newLead.widthFt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Area: {(parseFloat(newLead.lengthFt) * parseFloat(newLead.widthFt)).toLocaleString()} sqft
                  {newLead.marbleType && (
                    <>
                      {' · '}Est: {formatCurrency(
                        parseFloat(newLead.lengthFt) *
                          parseFloat(newLead.widthFt) *
                          (MARBLE_TYPES.find((m) => m.name === newLead.marbleType)?.pricePerSqft || 0)
                      )}
                    </>
                  )}
                </p>
              )}
            </div>

            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Quantity (optional)"
              value={newLead.quantity}
              onChange={(e) => setNewLead({ ...newLead, quantity: e.target.value })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Site Location"
              value={newLead.siteLocation}
              onChange={(e) => setNewLead({ ...newLead, siteLocation: e.target.value })}
            />

            <Button className="col-span-2" onClick={handleAddLead} disabled={submitting}>
              <Calculator className="h-4 w-4 mr-2" />
              {submitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
