// ============================================================
// Marble Images API — Supabase Storage-backed image gallery
// GET  /api/marbles/images?marbleId=italian-carrara
// POST /api/marbles/images — multipart upload admin-only
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cachedResponse } from '@/lib/api-helpers';

const BUCKET = 'marbleimages';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Marble ID → Supabase Storage filename mapping (flat bucket, no folders)
const MARBLE_IMAGE_MAP: Record<string, string[]> = {
  'italian-carrara': ['1.Bianco White.png', '1 Ambaji White 1.jpg'],
  'statuario': ['13.Statuario.png', '12.Statuario.png', '15.Statuario.png'],
  'calacatta': ['4.Kalkata white.png', '5.IMPERIAL WHITE.png'],
  'makrana-white': ['2 Ambaji White 2.jpg', '3 Ambaji White 3.jpg', '9.cotton white.png'],
  'makrana-dungri': ['1 Ambaji White 1.jpg', '1.Bianco White.png'],
  'indian-green': ['4 UDAIPUR_GREEN.jpg', '3.Green Levanto.png', '29.Green Levanto.png'],
  'rainforest-green': ['5 JAISALMER YELLOW.jpg', '6.crystal brown.png', '7.Coffee Brown.png'],
  'onyx-white': ['8.White Onyx.png', '10.Pakistani Onyx.png', '11.Mango Onyx.png'],
  'travertine-roman': ['19.white travetine.png', '25.beige travetine.png', '26.noche travertine.png'],
  'bidasar-brown': ['1.ANGOLA BROWN.jpg', '25Gd Brown.jpeg', '15.Carbon brown.png'],
  'katni-beige': ['17 Alaska Pink.jpeg', '18 Alaska Red .jpeg', '19 Alaska White .png'],
  'albeta-grey': ['8.Majestic grey.png', '9.Armani Grey.png', '11.Cera Grey.png'],
};

function getStorageUrl(filename: string): string {
  return `https://chpfbsnouurelmfsdvsx.supabase.co/storage/v1/object/public/${BUCKET}/${encodeURIComponent(filename)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marbleId = searchParams.get('marbleId');

  try {
    if (marbleId && MARBLE_IMAGE_MAP[marbleId]) {
      // Return mapped images from Supabase Storage (flat bucket)
      const filenames = MARBLE_IMAGE_MAP[marbleId];
      const images = filenames.map((name) => ({
        name,
        url: getStorageUrl(name),
      }));
      return cachedResponse({ images });
    }

    // Return all categories (marble IDs that have images)
    const categories = Object.keys(MARBLE_IMAGE_MAP);
    return cachedResponse({ categories });
  } catch (error) {
    console.error('[marble-images] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check — only authenticated users can upload
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const marbleId = formData.get('marbleId') as string | null;

    if (!file || !marbleId) {
      return NextResponse.json({ error: 'Missing file or marbleId' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Sanitize filename
    const ext = file.name.split('.').pop() || 'jpg';
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${marbleId}/${safeName}`, file, {
        cacheControl: '31536000',
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    const publicUrl = supabase.storage
      .from(BUCKET)
      .getPublicUrl(`${marbleId}/${safeName}`).data.publicUrl;

    return NextResponse.json({ url: publicUrl, name: safeName }, { status: 201 });
  } catch (error) {
    console.error('[marble-images] POST error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Missing path param' }, { status: 400 });
    }

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[marble-images] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
