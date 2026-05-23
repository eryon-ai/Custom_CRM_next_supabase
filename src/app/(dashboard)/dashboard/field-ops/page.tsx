'use client';

import { useEffect, useRef, useState, memo } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { MapPin, Navigation, Clock, User, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon on client only (avoids SSR window reference)
if (typeof window !== 'undefined') {
  import('leaflet').then((L) => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  });
}

// Dynamically import react-leaflet to avoid SSR issues — load once
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-lg" /> }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);

interface AgentLocation {
  id: string;
  agentId: string;
  agentName: string;
  lat: number;
  lng: number;
  timestamp: string;
  address: string;
  status?: string;
}

interface Checkin {
  id: string;
  agentId: string;
  type: 'checkin' | 'checkout';
  lat: number;
  lng: number;
  address: string;
  createdAt: string;
}

// Separate map component with unique key to prevent re-initialization
const LiveMap = memo(function LiveMap({
  locations,
  userLocation,
  mapKey,
}: {
  locations: AgentLocation[];
  userLocation: GeolocationCoordinates | null;
  mapKey: string;
}) {
  return (
    <MapContainer
      key={mapKey}
      center={[20.5937, 78.9629]}
      zoom={5}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.lat, loc.lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{loc.agentName}</p>
              <p className="text-xs text-muted-foreground">{loc.address}</p>
              <p className="text-xs text-muted-foreground">{loc.timestamp}</p>
            </div>
          </Popup>
        </Marker>
      ))}
      {userLocation && (
        <Marker position={[userLocation.latitude, userLocation.longitude]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-primary">Your Location</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
});

export default function FieldOpsPage() {
  const [locations, setLocations] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Load locations
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch('/api/locations');
        const json = await res.json();
        if (!mounted) return;
        if (res.ok) setLocations(json.locations || []);
        else setError(json.error);
      } catch (err) {
        if (mounted) setError((err as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('field-ops')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_locations' },
        (payload) => {
          const newLoc = payload.new as any;
          if (!mounted) return;
          setLocations((prev) => [
            {
              id: newLoc.id,
              agentId: newLoc.agent_id,
              agentName: 'Agent',
              lat: newLoc.latitude,
              lng: newLoc.longitude,
              timestamp: newLoc.recorded_at,
              address: newLoc.address || `${newLoc.latitude}, ${newLoc.longitude}`,
            },
            ...prev.slice(0, 99),
          ]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Get user location for check-in
  function handleCheckIn() {
    setIsCheckingIn(true);
    if (!navigator.geolocation) {
      setError('Geolocation not available');
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setUserLocation(position.coords);

        try {
          const res = await fetch('/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
              type: 'checkin',
            }),
          });

          const json = await res.json();
          if (!res.ok) throw new Error(json.error);

          setCheckins((prev) => [
            {
              id: json.id || Date.now().toString(),
              agentId: 'current',
              type: 'checkin',
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location',
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsCheckingIn(false);
        }
      },
      () => {
        setError('Could not get location. Enable GPS.');
        setIsCheckingIn(false);
      },
      { enableHighAccuracy: true }
    );
  }

  const filteredLocations = activeAgent
    ? locations.filter((l) => l.agentId === activeAgent)
    : locations;

  const uniqueAgents = [...new Set(locations.map((l) => l.agentId))].map(
    (id) => locations.find((l) => l.agentId === id)!
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Field Operations</h2>
          <p className="text-sm text-muted-foreground">Live GPS tracking & agent check-ins</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCheckIn} disabled={isCheckingIn}>
            <Navigation className="h-4 w-4 mr-2" />
            {isCheckingIn ? 'Locating...' : 'Check In'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950 border border-amber-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)] min-h-0">
        {/* Agent List */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Active Agents</span>
              <Badge variant="outline">{uniqueAgents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-2">
              <div className="space-y-1">
                {uniqueAgents.map((agent) => (
                  <button
                    key={agent.agentId}
                    onClick={() =>
                      setActiveAgent(
                        activeAgent === agent.agentId ? null : agent.agentId
                      )
                    }
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors ${
                      activeAgent === agent.agentId
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{agent.agentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.timestamp}
                      </p>
                    </div>
                  </button>
                ))}
                {uniqueAgents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No active agents
                  </p>
                )}
              </div>
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3 relative overflow-hidden">
          <CardContent className="p-0 h-full">
            {mounted ? (
              <LiveMap
                key={`map-${mounted ? 'ready' : 'loading'}`}
                mapKey={`field-map-${mounted ? 'active' : 'init'}`}
                locations={filteredLocations}
                userLocation={userLocation}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent check-ins */}
      {checkins.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Your Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex gap-3 overflow-x-auto">
              {checkins.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50 text-xs shrink-0"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      c.type === 'checkin' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="capitalize">{c.type}</span>
                  <span className="text-muted-foreground">
                    {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
