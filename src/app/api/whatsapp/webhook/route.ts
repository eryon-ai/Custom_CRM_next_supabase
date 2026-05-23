import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/whatsapp/webhook — Meta webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'marble_mart_webhook_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Verification failed', { status: 403 });
}

// POST /api/whatsapp/webhook — Receive incoming WhatsApp messages
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Meta sends messages in entry[].changes[].value.messages[]
    const entries = body?.entry || [];
    const supabase = await createClient();

    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const messages = change?.value?.messages || [];
        const contacts = change?.value?.contacts || [];
        const metadata = change?.value?.metadata || {};

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const contact = contacts[i] || contacts[0] || {};

          // Try to find the lead by phone number
          const phoneNumber = msg?.from;
          let leadId = null;

          if (phoneNumber) {
            const { data: leads } = await supabase
              .from('leads')
              .select('id')
              .or(`phone.ilike.%${phoneNumber.slice(-10)}%`)
              .limit(1);

            if (leads?.length > 0) {
              leadId = leads[0].id;
            }
          }

          // Store the inbound message
          await supabase.from('whatsapp_messages').insert({
            lead_id: leadId,
            direction: 'inbound',
            message_type: msg?.type === 'image' ? 'image' : msg?.type === 'document' ? 'document' : 'text',
            content: msg?.text?.body || msg?.type || 'Media message',
            media_url: msg?.image?.link || msg?.document?.link || null,
            status: 'delivered',
            whatsapp_message_id: msg?.id || null,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    // Always return 200 to Meta to avoid retries
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
