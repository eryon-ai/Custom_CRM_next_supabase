import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return cachedResponse({ leads: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { leadId, pipelineStage, position } = body;

    if (!leadId || !pipelineStage) {
      return NextResponse.json(
        { error: 'leadId and pipelineStage are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // P1 FIX: Fire update + activity log in parallel, not sequentially
    await Promise.all([
      (supabase as any).from('leads').update({ pipeline_stage: pipelineStage }).eq('id', leadId),
      (supabase as any).from('lead_activities').insert({
        lead_id: leadId,
        activity_type: 'pipeline_move',
        description: `Moved to ${pipelineStage}`,
        metadata: { to_stage: pipelineStage, position },
      }),
    ]);

    const { data, error } = await (supabase as any)
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    return NextResponse.json({ lead: data });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to move lead' },
      { status: 500 }
    );
  }
}
