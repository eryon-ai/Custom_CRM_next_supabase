import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  try {
    const { action, data } = await req.json();

    switch (action) {
      case 'check-inactive-leads': {
        // Find leads with no activity for 3+ days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: leads } = await supabase
          .from('leads')
          .select('id, name, assigned_to')
          .lt('last_contacted_at', threeDaysAgo)
          .not('status', 'in', '("Converted","Lost")');

        // Create follow-ups for each
        for (const lead of leads || []) {
          if (lead.assigned_to) {
            await supabase.from('follow_ups').insert({
              lead_id: lead.id,
              assigned_to: lead.assigned_to,
              title: `Follow up with ${lead.name} (inactive 3+ days)`,
              due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }

        return new Response(JSON.stringify({ processed: leads?.length || 0 }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'auto-assign-leads': {
        // Round-robin assignment for unassigned leads
        const { data: agents } = await supabase
          .from('agents')
          .select('id')
          .eq('status', 'Active')
          .order('last_active_at', { ascending: true });

        const { data: unassigned } = await supabase
          .from('leads')
          .select('id')
          .is('assigned_to', null)
          .limit(10);

        if (agents && unassigned) {
          for (let i = 0; i < unassigned.length; i++) {
            const agentIndex = i % agents.length;
            await supabase
              .from('leads')
              .update({ assigned_to: agents[agentIndex]?.id })
              .eq('id', unassigned[i]?.id);
          }
        }

        return new Response(JSON.stringify({ assigned: unassigned?.length || 0 }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'generate-daily-report': {
        const today = new Date().toISOString().slice(0, 10);
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .gte('created_at', today);

        const { data: activities } = await supabase
          .from('lead_activities')
          .select('*')
          .gte('created_at', today);

        return new Response(
          JSON.stringify({
            date: today,
            newLeads: leads?.length || 0,
            activities: activities?.length || 0,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
