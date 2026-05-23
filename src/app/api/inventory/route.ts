import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

function mapItem(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    marbleType: (row.marble_type as string) ?? '',
    color: (row.color as string) ?? '',
    finish: (row.finish as string) ?? '',
    thickness: (row.thickness as number) ?? null,
    size: (row.size as string) ?? '',
    quantityAvailable: (row.quantity_available as number) ?? 0,
    unit: (row.unit as string) ?? 'sqft',
    unitPrice: (row.unit_price as number) ?? null,
    location: (row.location as string) ?? '',
    supplier: (row.supplier as string) ?? '',
    minStockLevel: (row.min_stock_level as number) ?? 0,
    status: (row.status as string) ?? 'In Stock',
    createdAt: (row.created_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
  };
}

// GET /api/inventory — List all inventory items
// ?lowStock=true — Only items at/below reorder threshold
// ?status=Low+Stock — Filter by status
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const lowStock = searchParams.get('lowStock') === 'true';
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    let items = (data || []).map(mapItem);

    // Post-filter for low stock (cross-column comparison)
    if (lowStock) {
      items = items.filter(
        (item: ReturnType<typeof mapItem>) => item.quantityAvailable <= item.minStockLevel
      );
    }

    return cachedResponse({ items });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory — Add new inventory item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.marbleType) {
      return NextResponse.json(
        { error: 'Name and marble type are required' },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      name: String(body.name).trim(),
      marble_type: String(body.marbleType).trim(),
      color: body.color ? String(body.color).trim() : null,
      finish: body.finish ? String(body.finish).trim() : null,
      thickness: body.thickness ? Number(body.thickness) : null,
      size: body.size ? String(body.size).trim() : null,
      quantity_available: body.quantityAvailable ? Number(body.quantityAvailable) : 0,
      unit: body.unit ? String(body.unit).trim() : 'sqft',
      unit_price: body.unitPrice ? Number(body.unitPrice) : null,
      location: body.location ? String(body.location).trim() : null,
      supplier: body.supplier ? String(body.supplier).trim() : null,
      min_stock_level: body.minStockLevel ? Number(body.minStockLevel) : 0,
      status: body.status ? String(body.status).trim() : 'In Stock',
    };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ item: mapItem(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory — Update an inventory item
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = String(updates.name).trim();
    if (updates.marbleType !== undefined) dbUpdates.marble_type = String(updates.marbleType).trim();
    if (updates.color !== undefined) dbUpdates.color = updates.color ? String(updates.color).trim() : null;
    if (updates.finish !== undefined) dbUpdates.finish = updates.finish ? String(updates.finish).trim() : null;
    if (updates.thickness !== undefined) dbUpdates.thickness = updates.thickness ? Number(updates.thickness) : null;
    if (updates.size !== undefined) dbUpdates.size = updates.size ? String(updates.size).trim() : null;
    if (updates.quantityAvailable !== undefined) dbUpdates.quantity_available = Number(updates.quantityAvailable);
    if (updates.unit !== undefined) dbUpdates.unit = String(updates.unit).trim();
    if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice ? Number(updates.unitPrice) : null;
    if (updates.location !== undefined) dbUpdates.location = updates.location ? String(updates.location).trim() : null;
    if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier ? String(updates.supplier).trim() : null;
    if (updates.minStockLevel !== undefined) dbUpdates.min_stock_level = Number(updates.minStockLevel);
    if (updates.status !== undefined) dbUpdates.status = String(updates.status).trim();

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    dbUpdates.updated_at = new Date().toISOString();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory_items')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ item: mapItem(row) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory — Delete an inventory item (send id in query or body)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
