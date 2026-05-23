'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, Filter, IndianRupee, MapPin, Star, Info, Camera, Upload, X, ImageIcon, ChevronLeft, ChevronRight, ZoomIn, Ruler, CheckCircle2, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MARBLE_TYPES,
  MARBLE_COLORS,
  getMarblesByColor,
} from '@/config/marbles';
import { formatCurrency } from '@/lib/utils';
import { useMarbleImagesQuery } from '@/hooks/use-queries';

const GRADES = ['Economy', 'Standard', 'Premium', 'Luxury'] as const;
const CATEGORIES = ['Indian Classic', 'Indian Premium', 'Imported Italian', 'Imported Onyx', 'Imported'] as const;

// Marble images from Supabase Storage (real marble photos)
const SUPABASE_STORAGE = 'https://chpfbsnouurelmfsdvsx.supabase.co/storage/v1/object/public/marbleimages';
const MARBLE_FALLBACK_IMAGES: Record<string, string> = {
  'italian-carrara': `${SUPABASE_STORAGE}/1.Bianco%20White.png`,
  'statuario': `${SUPABASE_STORAGE}/13.Statuario.png`,
  'calacatta': `${SUPABASE_STORAGE}/4.Kalkata%20white.png`,
  'makrana-white': `${SUPABASE_STORAGE}/2%20Ambaji%20White%202.jpg`,
  'makrana-dungri': `${SUPABASE_STORAGE}/1%20Ambaji%20White%201.jpg`,
  'indian-green': `${SUPABASE_STORAGE}/4%20UDAIPUR_GREEN.jpg`,
  'rainforest-green': `${SUPABASE_STORAGE}/5%20JAISALMER%20%20YELLOW.jpg`,
  'onyx-white': `${SUPABASE_STORAGE}/8.White%20Onyx.png`,
  'travertine-roman': `${SUPABASE_STORAGE}/19.white%20travetine.png`,
  'bidasar-brown': `${SUPABASE_STORAGE}/1.ANGOLA%20BROWN.jpg`,
  'katni-beige': `${SUPABASE_STORAGE}/17%20Alaska%20Pink.jpeg`,
  'albeta-grey': `${SUPABASE_STORAGE}/8.Majestic%20grey.png`,
};

// Local SVG fallbacks included in the repo to guarantee images load
const LOCAL_MARBLE_COUNT = 6;
function getLocalFallback(marble: { id: string }, idx: number) {
  const n = (Math.abs(idx) % LOCAL_MARBLE_COUNT) + 1;
  return `/marbles/marble-${n}.svg`;
}

export default function MarbleCatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [selectedGrade, setSelectedGrade] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMarble, setSelectedMarble] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images for selected marble
  const { data: imagesData, isLoading: imagesLoading } = useMarbleImagesQuery(selectedMarble);
  const marbleImages = imagesData?.images || [];
  const fallbackImage = MARBLE_FALLBACK_IMAGES[selectedMarble || ''] || MARBLE_FALLBACK_IMAGES['italian-carrara'];

  const filteredMarbles = useMemo(() => {
    let results = MARBLE_TYPES;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.origin.toLowerCase().includes(q) ||
          m.colors.some((c) => c.toLowerCase().includes(q)) ||
          m.description.toLowerCase().includes(q)
      );
    }

    if (selectedColor !== 'All') {
      results = results.filter((m) => m.colorFamily === selectedColor);
    }

    if (selectedGrade !== 'All') {
      results = results.filter((m) => m.grade === selectedGrade);
    }

    if (selectedCategory !== 'All') {
      results = results.filter((m) => m.category === selectedCategory);
    }

    return results;
  }, [searchTerm, selectedColor, selectedGrade, selectedCategory]);

  const selectedMarbleData = MARBLE_TYPES.find((m) => m.id === selectedMarble);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedMarble) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('marbleId', selectedMarble);

      const res = await fetch('/api/marbles/images', { method: 'POST', body: formData });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Upload failed');
      }
      // Clear the input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marble Catalog</h2>
          <p className="text-sm text-muted-foreground">
            Browse premium marble collection — {MARBLE_TYPES.length} varieties
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm"
            placeholder="Search by name, origin, or color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {/* Colors */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <button
              onClick={() => setSelectedColor('All')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedColor === 'All' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
              }`}
            >
              All Colors
            </button>
            {MARBLE_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedColor === color ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
                }`}
              >
                {color}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap ml-4">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                selectedCategory === 'All' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                  selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grade filter */}
        <div className="flex items-center gap-1.5">
          {GRADES.map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(selectedGrade === grade ? 'All' : grade)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedGrade === grade
                  ? grade === 'Luxury' ? 'bg-yellow-500 text-white'
                    : grade === 'Premium' ? 'bg-blue-500 text-white'
                    : grade === 'Standard' ? 'bg-emerald-500 text-white'
                    : 'bg-gray-500 text-white'
                  : 'bg-muted hover:bg-accent'
              }`}
            >
              <Star className="h-3 w-3 inline mr-1" />
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredMarbles.length} of {MARBLE_TYPES.length} marble types
      </p>

      {/* Marble Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMarbles.map((marble, idx) => (
          <Card
            key={marble.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedMarble === marble.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() =>
              setSelectedMarble(selectedMarble === marble.id ? null : marble.id)
            }
          >
            <CardContent className="p-4">
              {/* Image Thumbnail — fallback to Unsplash if no uploaded image */}
              <div className="w-full h-36 rounded-lg bg-muted/50 mb-3 overflow-hidden flex items-center justify-center">
                <img
                  src={
                    marbleImages[0]?.url ||
                    MARBLE_FALLBACK_IMAGES[marble.id] ||
                    getLocalFallback(marble, idx) ||
                    fallbackImage
                  }
                  alt={marble.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{marble.name}</h3>
                  <p className="text-xs text-muted-foreground">{marble.category}</p>
                </div>
                <Badge
                  variant={
                    marble.grade === 'Luxury'
                      ? 'destructive'
                      : marble.grade === 'Premium'
                      ? 'default'
                      : 'secondary'
                  }
                  className="text-[10px]"
                >
                  {marble.grade}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {marble.colors.map((c) => (
                  <span
                    key={c}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-muted font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="space-y-1 mb-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {marble.origin}
                </div>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  ₹{marble.pricePerSqft}/sqft
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {marble.availableFinishes.map((f) => (
                  <span
                    key={f}
                    className="px-1.5 py-0.5 rounded text-[10px] border border-input"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2">
                {marble.description}
              </p>

              {/* Expanded details */}
              {selectedMarble === marble.id && (
                <div className="mt-4 pt-3 border-t space-y-3 text-xs">
                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground flex items-center gap-1"><Ruler className="h-3 w-3"/> Thickness</p>
                      <p className="font-medium">{marble.thicknesses.join(', ')}mm</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Vein Pattern</p>
                      <p className="font-medium">{marble.veins.join(', ')}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Finishes</p>
                      <p className="font-medium">{marble.availableFinishes.join(', ')}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3"/> Grade</p>
                      <p className="font-medium">{marble.grade}</p>
                    </div>
                  </div>

                  {/* Image Gallery with Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-muted-foreground">
                        Gallery {marbleImages.length > 0 && `(${marbleImages.length})`}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <span className="animate-pulse">Uploading...</span>
                        ) : (
                          <>
                            <Camera className="h-3 w-3" /> Add Photo
                          </>
                        )}
                      </Button>
                    </div>
                    {uploadError && (
                      <p className="text-red-500 text-xs mb-2">{uploadError}</p>
                    )}
                    {imagesLoading ? (
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 rounded" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {(marbleImages.length > 0 ? marbleImages : [{ name: 'fallback', url: MARBLE_FALLBACK_IMAGES[marble.id] || getLocalFallback(marble, idx) || fallbackImage }]).slice(0, 6).map((img, gidx) => (
                          <img
                            key={img.name + gidx}
                            src={img.url}
                            alt={marble.name}
                            className="w-full h-20 object-cover rounded border hover:opacity-80 transition-opacity cursor-pointer"
                            loading="lazy"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(img.url, '_blank');
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" variant="outline">
                      <Info className="h-3 w-3 mr-1" /> Request Sample
                    </Button>
                    <Button size="sm" className="flex-1" variant="default">
                      <IndianRupee className="h-3 w-3 mr-1" /> Get Quote
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
