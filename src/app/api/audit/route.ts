import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

function mapAuditLog(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: (row.user_id as string) ?? '',
    action: (row.action as string) ?? '',
    resource: (row.resource as string) ?? '',
    resourceId: (row.resource_id as string) ?? '',
    oldValues: row.old_values ?? null,
    newValues: row.new_values ?? null,
    ipAddress: (row.ip_address as string) ?? '',
    userAgent: (row.user_agent as string) ?? '',
    createdAt: (row.created_at as string) ?? '',
  };
}

// GET /api/audit — Paginated audit logs with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
    const userId = searchParams.get('userId');
    const resource = searchParams.get('resource');
    const action = searchParams.get('action');
    const resourceId = searchParams.get('resourceId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const supabase = await createClient();

    // Build count query
    let countQuery = (supabase as any)
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (userId) countQuery = countQuery.eq('user_id', userId);
    if (resource) countQuery = countQuery.eq('resource', resource);
    if (action) countQuery = countQuery.eq('action', action);
    if (resourceId) countQuery = countQuery.eq('resource_id', resourceId);
    if (dateFrom) countQuery = countQuery.gte('created_at', dateFrom);
    if (dateTo) countQuery = countQuery.lte('created_at', dateTo);

    const { count, error: countErr } = await countQuery;
    if (countErr) throw countErr;

    // Build data query
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let dataQuery = (supabase as any)
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (userId) dataQuery = dataQuery.eq('user_id', userId);
    if (resource) dataQuery = dataQuery.eq('resource', resource);
    if (action) dataQuery = dataQuery.eq('action', action);
    if (resourceId) dataQuery = dataQuery.eq('resource_id', resourceId);
    if (dateFrom) dataQuery = dataQuery.gte('created_at', dateFrom);
    if (dateTo) dataQuery = dataQuery.lte('created_at', dateTo);

    const { data, error } = await dataQuery;
    if (error) throw error;

    return cachedResponse({
      logs: (data || []).map(mapAuditLog),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
