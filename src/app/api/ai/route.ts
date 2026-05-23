import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateLeadSummary,
  generateFollowUpSuggestions,
  predictConversion,
  generateWhatsAppReply,
  generateSalesInsights,
} from '@/lib/ai/deepseek';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json({ error: 'action and data are required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'summarize':
        result = await generateLeadSummary(data);
        break;

      case 'suggest':
        result = await generateFollowUpSuggestions(data);
        break;

      case 'predict':
        result = await predictConversion(data);
        break;

      case 'reply':
        result = await generateWhatsAppReply(data.message, data.context);
        break;

      case 'insights':
        result = await generateSalesInsights(data);
        break;

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'AI request failed' },
      { status: 500 }
    );
  }
}
