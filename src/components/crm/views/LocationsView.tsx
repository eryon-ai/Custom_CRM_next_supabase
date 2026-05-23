'use client';

import { memo } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LocationsViewProps {
  locations: unknown[];
  error?: string | null;
}

export const LocationsView = memo(function LocationsView({ locations, error }: LocationsViewProps) {
  return (
    <div className="space-y-6 h-[calc(100vh-200px)] flex flex-col">
      <h2 className="text-xl font-bold text-foreground">Live Field Tracking</h2>

      {error ? (
        <div className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 rounded-lg px-3 py-2">
          {error}
        </div>
      ) : null}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Map placeholder */}
        <Card className="lg:col-span-2 relative overflow-hidden bg-muted flex items-center justify-center">
          <div className="text-center p-8">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Field Operations Map</p>
            <p className="text-muted-foreground text-xs mt-1">
              {locations.length} agent{locations.length !== 1 ? 's' : ''} currently tracked
            </p>
            {locations.length > 0 && (
              <div className="mt-4 space-y-2 text-left max-w-sm">
                {locations.slice(0, 3).map((loc: Record<string, unknown>) => (
                  <div key={loc.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/80 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-medium">{loc.agentName}</span>
                    <span className="text-muted-foreground ml-auto">{loc.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Locations list */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle>Agent Locations</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-2">
              <div className="space-y-1">
                {locations.map((loc: Record<string, unknown>) => (
                  <div key={loc.id} className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium text-foreground">{loc.agentName}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground flex items-start">
                      <MapPin className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                      {loc.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{loc.timestamp}</p>
                  </div>
                ))}
                {locations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No locations recorded yet</p>
                )}
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
});
