import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

function mapSlab(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    slabCode: (row.slab_code as string) ?? '',
    blockId: (row.block_id as string) ?? null,
    marbleType: (row.marble_type as string) ?? '',
    colorVariation: (row.color_variation as string) ?? '',
    veinPattern: (row.vein_pattern as string) ?? '',
    grade: (row.grade as string) ?? 'Standard',
    lengthCm: (row.length_cm as number) ?? null,
    widthCm: (row.width_cm as number) ?? null,
    thicknessMm: (row.thickness_mm as number) ?? null,
    areaSqft: (row.area_sqft as number) ?? null,
    weightKg: (row.weight_kg as number) ?? null,
    purchasePrice: (row.purchase_price as number) ?? null,
    sellingPrice: (row.selling_price as number) ?? null,
    photos: (row.photos as string[]) ?? [],
    qrCode: (row.qr_code as string) ?? null,
    warehouseLocation: (row.warehouse_location as string) ?? '',
    supplier: (row.supplier as string) ?? '',
    batchNumber: (row.batch_number as string) ?? '',
    status: (row.status as string) ?? 'Available',
    notes: (row.notes as string) ?? '',
    reservedForLead: (row.reserved_for_lead as string) ?? null,
    reservedAt: (row.reserved_at as string) ?? null,
    soldAt: (row.sold_at as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
    updatedAt: (row.updated_at as string) ?? '',
  };
}

// GET /api/slabs — List slabs with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const marbleType = searchParams.get('marbleType');
    const grade = searchParams.get('grade');
    const warehouse = searchParams.get('warehouse');
    const leadId = searchParams.get('leadId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const supabase = await createClient();

    // Count query
    let countQuery = (supabase as any)
      .from('slabs')
      .select('*', { count: 'exact', head: true });

    if (status) countQuery = countQuery.eq('status', status);
    if (marbleType) countQuery = countQuery.eq('marble_type', marbleType);
    if (grade) countQuery = countQuery.eq('grade', grade);
    if (warehouse) countQuery = countQuery.ilike('warehouse_location', `%${warehouse}%`);
    if (leadId) countQuery = countQuery.eq('reserved_for_lead', leadId);

    const { count, error: countErr } = await countQuery;
    if (countErr) throw countErr;

    // Data query
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let dataQuery = (supabase as any)
      .from('slabs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) dataQuery = dataQuery.eq('status', status);
    if (marbleType) dataQuery = dataQuery.eq('marble_type', marbleType);
    if (grade) dataQuery = dataQuery.eq('grade', grade);
    if (warehouse) dataQuery = dataQuery.ilike('warehouse_location', `%${warehouse}%`);
    if (leadId) dataQuery = dataQuery.eq('reserved_for_lead', leadId);

    const { data, error } = await dataQuery;
    if (error) throw error;

    return cachedResponse({
      slabs: (data || []).map(mapSlab),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch slabs' },
      { status: 500 }
    );
  }
}

// POST /api/slabs — Add a new slab
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.marbleType) {
      return NextResponse.json({ error: 'Marble type is required' }, { status: 400 });
    }

    // Calculate area if dimensions provided
    let areaSqft = null;
    if (body.lengthCm && body.widthCm) {
      areaSqft = Math.round((body.lengthCm * body.widthCm / 929.0304) * 100) / 100;
    }

    const supabase = await createClient();

    // Generate slab code
    const year = new Date().getFullYear().toString();
    const { count: slabCount } = await (supabase as any)
      .from('slabs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`);

    const slabCode = `SLB-${year}-${String((slabCount || 0) + 1).padStart(4, '0')}`;

    const payload: Record<string, unknown> = {
      slab_code: slabCode,
      block_id: body.blockId ? String(body.blockId).trim() : null,
      marble_type: String(body.marbleType).trim(),
      color_variation: body.colorVariation ? String(body.colorVariation).trim() : null,
      vein_pattern: body.veinPattern ? String(body.veinPattern).trim() : null,
      grade: body.grade ? String(body.grade).trim() : 'Standard',
      length_cm: body.lengthCm ? Number(body.lengthCm) : null,
      width_cm: body.widthCm ? Number(body.widthCm) : null,
      thickness_mm: body.thicknessMm ? Number(body.thicknessMm) : null,
      area_sqft: areaSqft,
      weight_kg: body.weightKg ? Number(body.weightKg) : null,
      purchase_price: body.purchasePrice ? Number(body.purchasePrice) : null,
      selling_price: body.sellingPrice ? Number(body.sellingPrice) : null,
      warehouse_location: body.warehouseLocation ? String(body.warehouseLocation).trim() : null,
      supplier: body.supplier ? String(body.supplier).trim() : null,
      batch_number: body.batchNumber ? String(body.batchNumber).trim() : null,
      status: body.status ? String(body.status).trim() : 'Available',
      notes: body.notes ? String(body.notes).trim() : null,
    };

    const { data, error } = await (supabase as any)
      .from('slabs')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ slab: mapSlab(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create slab' },
      { status: 500 }
    );
  }
}

// PATCH /api/slabs — Update a slab (status, location, reservation, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Slab id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const dbUpdates: Record<string, unknown> = {};

    // Special actions
    if (action === 'reserve') {
      if (!body.leadId) {
        return NextResponse.json({ error: 'leadId required for reservation' }, { status: 400 });
      }
      // P0 FIX: Atomic reservation — only update if currently Available
      const { data: slab, error: slabErr } = await (supabase as any)
        .from('slabs')
        .update({
          status: 'Reserved',
          reserved_for_lead: body.leadId,
          reserved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'Available')
        .select('*')
        .single();

      if (slabErr) throw slabErr;
      if (!slab) {
        return NextResponse.json({ error: 'Slab is no longer available' }, { status: 409 });
      }

      // Create reservation record
      await (supabase as any).from('slab_reservations').insert({
        slab_id: id,
        lead_id: body.leadId,
        reserved_by: body.userId || null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Active',
      });

      return NextResponse.json({ slab: mapSlab(slab) });
    } else if (action === 'release') {
      dbUpdates.status = 'Available';
      dbUpdates.reserved_for_lead = null;
      dbUpdates.reserved_at = null;

      // Update reservation record
      await (supabase as any)
        .from('slab_reservations')
        .update({ status: 'Released' })
        .eq('slab_id', id)
        .eq('status', 'Active');
    } else if (action === 'mark_sold') {
      dbUpdates.status = 'Sold';
      dbUpdates.sold_at = new Date().toISOString();

      // Update reservation to Converted
      await (supabase as any)
        .from('slab_reservations')
        .update({ status: 'Converted' })
        .eq('slab_id', id)
        .eq('status', 'Active');
    } else {
      // Regular field updates
      if (updates.status !== undefined) dbUpdates.status = String(updates.status).trim();
      if (updates.warehouseLocation !== undefined) dbUpdates.warehouse_location = String(updates.warehouseLocation).trim();
      if (updates.sellingPrice !== undefined) dbUpdates.selling_price = Number(updates.sellingPrice);
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = Number(updates.purchasePrice);
      if (updates.grade !== undefined) dbUpdates.grade = String(updates.grade).trim();
      if (updates.notes !== undefined) dbUpdates.notes = String(updates.notes).trim();
      if (updates.photos !== undefined) dbUpdates.photos = updates.photos;
    }

    if (Object.keys(dbUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('slabs')
      .update(dbUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ slab: mapSlab(row) });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update slab' },
      { status: 500 }
    );
  }
}

// DELETE /api/slabs — Delete a slab
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Slab id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await (supabase as any)
      .from('slabs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete slab' },
      { status: 500 }
    );
  }
}
