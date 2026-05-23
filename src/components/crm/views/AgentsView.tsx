import { Phone, Users as UsersIcon, CheckCircle, Plus } from 'lucide-react';
import { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

const INITIAL_AGENT = { name: '', email: '', phone: '', status: 'Offline' };

interface AgentsViewProps {
  agents: unknown[];
  error?: string | null;
  onCreateAgent?: (agent: Record<string, unknown>) => Promise<boolean>;
}

export const AgentsView = memo(function AgentsView({ agents, error, onCreateAgent }: AgentsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState(INITIAL_AGENT);
  const [submitting, setSubmitting] = useState(false);

  async function handleAddAgent() {
    if (!newAgent.name || !onCreateAgent) return;
    setSubmitting(true);
    const ok = await onCreateAgent(newAgent);
    setSubmitting(false);
    if (ok) {
      setIsModalOpen(false);
      setNewAgent(INITIAL_AGENT);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Marketing Team</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </div>

      {error ? (
        <div className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 rounded-lg px-3 py-2">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent: Record<string, unknown>) => (
          <Card key={agent.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-foreground">{agent.name}</h3>
                <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>{agent.status}</Badge>
              </div>
              <div className="space-y-3 pt-3 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <Phone className="w-3 h-3 mr-2" /> Phone
                  </span>
                  <span>{agent.phone || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <UsersIcon className="w-3 h-3 mr-2" /> Total Leads
                  </span>
                  <span className="font-medium">{agent.totalLeads}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2" /> Last Active
                  </span>
                  <span>{agent.lastActive}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Agent Card */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors min-h-[200px]"
        >
          <Plus className="w-6 h-6" />
          <span className="font-medium mt-2">Add New Agent</span>
        </button>
      </div>

      {/* Add Agent Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <input
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Agent Name"
              value={newAgent.name}
              onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
            />
            <input
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Agent Email"
              value={newAgent.email}
              onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
            />
            <input
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Agent Phone"
              value={newAgent.phone}
              onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
            />
            <select
              className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
              value={newAgent.status}
              onChange={(e) => setNewAgent({ ...newAgent, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Offline">Offline</option>
            </select>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAgent} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Agent'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
