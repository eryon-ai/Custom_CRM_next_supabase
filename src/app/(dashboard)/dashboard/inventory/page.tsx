'use client';

import { useState, useMemo } from 'react';
import { Package, Plus, AlertTriangle, Search, Loader2, Trash2, Edit3, TrendingDown, TrendingUp, Warehouse, IndianRupee } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  useInventoryQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} from '@/hooks/use-queries';

interface InventoryItem {
  id: string;
  name: string;
  marbleType: string;
  color: string;
  finish: string;
  thickness: number | null;
  size: string;
  quantityAvailable: number;
  unit: string;
  unitPrice: number | null;
  location: string;
  supplier: string;
  minStockLevel: number;
  status: string;
  createdAt: string;
}

const emptyItem = (): InventoryItem => ({
  id: '',
  name: '',
  marbleType: '',
  color: '',
  finish: '',
  thickness: null,
  size: '',
  quantityAvailable: 0,
  unit: 'sqft',
  unitPrice: 0,
  location: '',
  supplier: '',
  minStockLevel: 10,
  status: 'In Stock',
  createdAt: new Date().toISOString(),
});

export default function InventoryPage() {
  const { data, isLoading, error: queryError, refetch } = useInventoryQuery();
  const items: InventoryItem[] = data?.items || [];
  const createItem = useCreateInventoryMutation();
  const updateItem = useUpdateInventoryMutation();
  const deleteItem = useDeleteInventoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<InventoryItem>(emptyItem());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setError] = useState('');

  const error = localError || (queryError ? (queryError as Error).message : '');

  // Derived analytics
  const analytics = useMemo(() => {
    const totalValue = items.reduce((s, i) => s + i.quantityAvailable * (i.unitPrice || 0), 0);
    const lowStock = items.filter((i) => i.quantityAvailable <= i.minStockLevel && i.quantityAvailable > 0);
    const outOfStock = items.filter((i) => i.status === 'Out of Stock' || i.quantityAvailable === 0);
    const uniqueMarbleTypes = new Set(items.map((i) => i.marbleType).filter(Boolean)).size;
    const uniqueSuppliers = new Set(items.map((i) => i.supplier).filter(Boolean)).size;
    return { totalValue, lowStock, outOfStock, uniqueMarbleTypes, uniqueSuppliers };
  }, [items]);

  // Filters
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marbleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColor: Record<string, string> = {
    'In Stock': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400',
    'Low Stock': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400',
    'Out of Stock': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400',
    Discontinued: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  };

  async function handleSaveItem() {
    if (!newItem.name || !newItem.marbleType) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateItem.mutateAsync({ ...newItem, id: editingId } as any);
      } else {
        await createItem.mutateAsync(newItem as any);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewItem(emptyItem());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(item: InventoryItem) {
    setEditingId(item.id);
    setNewItem(item);
    setIsModalOpen(true);
  }

  function openCreateModal() {
    setEditingId(null);
    setNewItem(emptyItem());
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this inventory item?')) return;
    try {
      await deleteItem.mutateAsync(id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // Stats from analytics memo
  const totalValue = analytics.totalValue;
  const lowStockCount = analytics.lowStock.length;
  const outOfStockCount = analytics.outOfStock.length;

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-20 rounded-xl" />))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-sm text-muted-foreground">Marble stock & warehouse management</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Stock
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400 border border-red-200 rounded-lg px-3 py-2">
          {error}
          <button className="ml-2 underline" onClick={() => { setError(''); refetch(); }}>Retry</button>
        </div>
      )}

      {/* Stats + Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inventory Value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 dark:border-amber-900">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" /> Low Stock
            </p>
            <p className="text-2xl font-bold text-amber-500">{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Marble Types</p>
            <p className="text-2xl font-bold text-blue-500">{analytics.uniqueMarbleTypes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm"
            placeholder="Search by name, type, location, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-accent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Marble Type</th>
                  <th className="px-4 py-3 font-medium">Color/Finish</th>
                  <th className="px-4 py-3 font-medium text-right">Available</th>
                  <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      {item.supplier && <div className="text-xs text-muted-foreground">{item.supplier}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.marbleType}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {item.color}{item.finish ? ` / ${item.finish}` : ''}
                      {item.thickness ? ` · ${item.thickness}mm` : ''}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${item.quantityAvailable < item.minStockLevel ? 'text-amber-500' : ''}`}>
                        {item.quantityAvailable.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-xs ml-1">{item.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.unitPrice ? formatCurrency(item.unitPrice) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.location || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor[item.status] || ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(item)} className="text-muted-foreground hover:text-primary transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      {items.length === 0 ? 'No inventory items yet. Add your first stock item above.' : 'No items match your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Inventory Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Product Name *"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Marble Type *"
              value={newItem.marbleType}
              onChange={(e) => setNewItem({ ...newItem, marbleType: e.target.value })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Color"
              value={newItem.color}
              onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
            />
            <select
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              value={newItem.finish}
              onChange={(e) => setNewItem({ ...newItem, finish: e.target.value })}
            >
              <option value="">Select Finish</option>
              <option value="Polished">Polished</option>
              <option value="Honed">Honed</option>
              <option value="Leathered">Leathered</option>
              <option value="Brushed">Brushed</option>
              <option value="Tumbled">Tumbled</option>
            </select>
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Thickness (mm)"
              type="number"
              value={newItem.thickness ?? ''}
              onChange={(e) => setNewItem({ ...newItem, thickness: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Quantity *"
              type="number"
              value={newItem.quantityAvailable || ''}
              onChange={(e) => setNewItem({ ...newItem, quantityAvailable: Number(e.target.value) || 0 })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Unit Price (₹)"
              type="number"
              value={newItem.unitPrice || ''}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) || 0 })}
            />
            <input
              className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Warehouse Location"
              value={newItem.location}
              onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
            />
            <input
              className="col-span-2 px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Supplier"
              value={newItem.supplier}
              onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
            />
            <input
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              placeholder="Min Stock Level"
              type="number"
              value={newItem.minStockLevel || ''}
              onChange={(e) => setNewItem({ ...newItem, minStockLevel: Number(e.target.value) || 0 })}
            />
            <select
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
              value={newItem.status}
              onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
            >
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {submitting ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
