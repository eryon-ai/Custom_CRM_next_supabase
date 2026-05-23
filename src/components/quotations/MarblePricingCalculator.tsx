'use client';

import { useState, useMemo } from 'react';
import { Calculator, IndianRupee, Truck, Ruler, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MARBLE_TYPES,
  MARBLE_THICKNESSES,
  MARBLE_FINISHES,
  WASTAGE_PERCENTAGE,
  calculateMarbleEstimate,
  type MarbleEstimate,
} from '@/config/marbles';
import { formatCurrency } from '@/lib/utils';

export function MarblePricingCalculator() {
  const [selectedMarble, setSelectedMarble] = useState(MARBLE_TYPES[0]!.id);
  const [lengthFt, setLengthFt] = useState(20);
  const [widthFt, setWidthFt] = useState(10);
  const [thickness, setThickness] = useState(18);
  const [finish, setFinish] = useState('polished');
  const [distanceKm, setDistanceKm] = useState(25);
  const [quantity, setQuantity] = useState(1);

  const marble = MARBLE_TYPES.find((m) => m.id === selectedMarble)!;
  const areaSqft = lengthFt * widthFt * quantity;
  const pricePerSqft = marble.pricePerSqft;
  const estimate = useMemo(() => calculateMarbleEstimate(lengthFt, widthFt, pricePerSqft, distanceKm), [lengthFt, widthFt, pricePerSqft, distanceKm]);

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5 text-primary" />
          Marble Pricing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-4">
            {/* Marble Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">Marble Type</label>
              <select
                className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-background"
                value={selectedMarble}
                onChange={(e) => setSelectedMarble(e.target.value)}
              >
                {MARBLE_TYPES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ₹{m.pricePerSqft}/sqft ({m.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Length (ft)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
                  value={lengthFt}
                  onChange={(e) => setLengthFt(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Ruler className="h-3 w-3" /> Width (ft)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
                  value={widthFt}
                  onChange={(e) => setWidthFt(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Thickness</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
                  value={thickness}
                  onChange={(e) => setThickness(parseInt(e.target.value))}
                >
                  {MARBLE_THICKNESSES.map((t) => (
                    <option key={t.mm} value={t.mm}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Finish</label>
                <select
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                >
                  {MARBLE_FINISHES.map((f) => (
                    <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Distance (km)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Marble Info */}
            <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
              <p className="font-medium">{marble.name}</p>
              <p className="text-muted-foreground">{marble.origin} • {marble.grade} Grade</p>
              <p className="text-muted-foreground">{marble.description}</p>
            </div>
          </div>

          {/* Estimate Output */}
          <div className="space-y-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Area</span>
                  <span>{areaSqft.toLocaleString()} sqft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wastage ({WASTAGE_PERCENTAGE}%)</span>
                  <span className="text-amber-500">+{estimate.wastageSqft.toLocaleString()} sqft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Required</span>
                  <span className="font-medium">{estimate.totalAreaSqft.toLocaleString()} sqft</span>
                </div>
                <div className="border-t pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" /> Marble ({pricePerSqft}/sqft)
                    </span>
                    <span>{formatCurrency(estimate.marbleCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> Installation
                    </span>
                    <span>{formatCurrency(estimate.installationCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" /> Transportation
                    </span>
                    <span>{formatCurrency(estimate.transportationCost)}</span>
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(estimate.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>{formatCurrency(estimate.gstAmount)}</span>
                  </div>
                </div>
                <div className="border-t pt-2 flex justify-between text-base font-bold">
                  <span>Grand Total</span>
                  <span className="text-primary">{formatCurrency(estimate.grandTotal)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  ₹{Math.round(estimate.grandTotal / estimate.totalAreaSqft)}/sqft all-in
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" variant="outline">
              Add to Quotation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
