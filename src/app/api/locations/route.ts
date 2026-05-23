import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('agent_locations')
      .select('id, latitude, longitude, address, recorded_at, agents(id, name)')
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const locations = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      agentId: (row.agents as Record<string, unknown>)?.id as string || '',
      agentName: (row.agents as Record<string, unknown>)?.name as string || 'Unknown Agent',
      lat: row.latitude,
      lng: row.longitude,
      timestamp: row.recorded_at
        ? new Date(row.recorded_at).toLocaleTimeString()
        : '',
      address: row.address || `${row.latitude}, ${row.longitude}`,
    }));

    return cachedResponse({ locations });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { latitude, longitude, address, type } = body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user's agent profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('agent_id')
      .eq('id', user.id)
      .single();

    const agentId = profile?.agent_id || user.id;

    // Insert location
    const { data: loc, error: locError } = await supabase
      .from('agent_locations')
      .insert({
        agent_id: agentId,
        latitude,
        longitude,
        address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      })
      .select('*')
      .single();

    if (locError) throw locError;

    // If type is checkin/checkout, also log it
    if (type === 'checkin' || type === 'checkout') {
      await supabase
        .from('field_checkins')
        .insert({
          agent_id: agentId,
          type,
          latitude,
          longitude,
          address: address || null,
        });
    }

    return NextResponse.json({ location: loc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save location' },
      { status: 500 }
    );
  }
}
