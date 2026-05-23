import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

function mapMessage(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    leadId: (row.lead_id as string) ?? null,
    agentId: (row.agent_id as string) ?? null,
    direction: (row.direction as string) ?? 'outbound',
    messageType: (row.message_type as string) ?? 'text',
    content: (row.content as string) ?? '',
    mediaUrl: (row.media_url as string) ?? null,
    status: (row.status as string) ?? 'sent',
    whatsappMessageId: (row.whatsapp_message_id as string) ?? null,
    createdAt: (row.created_at as string) ?? '',
  };
}

// GET /api/whatsapp — List WhatsApp messages with filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const agentId = searchParams.get('agentId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (leadId) query = query.eq('lead_id', leadId);
    if (agentId) query = query.eq('agent_id', agentId);

    const { data, count, error } = await query;

    if (error) throw error;
    return cachedResponse({
      messages: (data || []).map(mapMessage),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch WhatsApp messages' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp — Send a WhatsApp message via Meta Cloud API
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, agentId, phoneNumber, content, messageType = 'text', mediaUrl } = body;

    if (!phoneNumber || !content) {
      return NextResponse.json(
        { error: 'Phone number and content are required' },
        { status: 400 }
      );
    }

    const whatsappToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    // Store the outbound message in the database

    const messagePayload: Record<string, unknown> = {
      lead_id: leadId ? String(leadId).trim() : null,
      agent_id: agentId ? String(agentId).trim() : null,
      direction: 'outbound',
      message_type: messageType,
      content: String(content).trim(),
      media_url: mediaUrl ? String(mediaUrl).trim() : null,
      status: 'sent',
    };

    // If WhatsApp Cloud API is configured, attempt to send via Meta
    if (whatsappToken && whatsappPhoneId) {
      try {
        const waPayload: Record<string, unknown> = {
          messaging_product: 'whatsapp',
          to: String(phoneNumber).replace(/[^0-9]/g, ''),
          type: messageType === 'template' ? 'template' : 'text',
        };

        if (messageType === 'template') {
          waPayload.template = {
            name: String(content).trim(),
            language: { code: 'en' },
          };
        } else if (mediaUrl) {
          const mimeType =
            messageType === 'image'
              ? 'image/jpeg'
              : messageType === 'document'
                ? 'application/pdf'
                : 'text/plain';
          waPayload.type = messageType === 'document' ? 'document' : 'image';
          waPayload[waPayload.type as string] = {
            link: mediaUrl,
            ...(messageType === 'document' ? { filename: 'document.pdf' } : {}),
          };
        } else {
          waPayload.text = { body: String(content).trim() };
        }

        const waRes = await fetch(
          `https://graph.facebook.com/v21.0/${whatsappPhoneId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(waPayload),
          }
        );

        const waData = await waRes.json();
        if (waRes.ok) {
          messagePayload.whatsapp_message_id = waData.messages?.[0]?.id || null;
          messagePayload.status = 'delivered';
        } else {
          messagePayload.status = 'failed';
          console.error('WhatsApp API error:', waData);
        }
      } catch (waErr) {
        messagePayload.status = 'failed';
        console.error('WhatsApp send failed:', waErr);
      }
    }

    // Always persist the message
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert(messagePayload)
      .select('*')
      .single();

    if (error) throw error;
    const row = data as unknown as Record<string, unknown>;
    return NextResponse.json({ message: mapMessage(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
