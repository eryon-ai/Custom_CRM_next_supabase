'use client';

import { useState, useCallback } from 'react';
import { Bot, Sparkles, Send, X, Loader2, Lightbulb, TrendingUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AISummary, AISuggestion, AIConversionPrediction } from '@/types/crm';

interface AIAssistantProps {
  leadId?: string;
  leadData?: Record<string, unknown>;
}

type AIView = 'summary' | 'suggestions' | 'predictions' | 'insights';

export function AIAssistant({ leadData }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<AIView | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [prediction, setPrediction] = useState<AIConversionPrediction | null>(null);
  const [insights, setInsights] = useState<string>('');

  const callAI = useCallback(async (action: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.result;
    } catch (err) {
      throw err;
    }
  }, []);

  const handleSummarize = useCallback(async () => {
    if (!leadData) return;
    setLoading('summary');
    try {
      const result = await callAI('summarize', leadData);
      setSummary(result);
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }, [leadData, callAI]);

  const handleSuggest = useCallback(async () => {
    if (!leadData) return;
    setLoading('suggestions');
    try {
      const result = await callAI('suggest', leadData);
      setSuggestions(result);
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }, [leadData, callAI]);

  const handlePredict = useCallback(async () => {
    if (!leadData) return;
    setLoading('predictions');
    try {
      const result = await callAI('predict', leadData);
      setPrediction(result);
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }, [leadData, callAI]);

  const handleInsights = useCallback(async () => {
    if (!leadData) return;
    setLoading('insights');
    try {
      const result = await callAI('insights', leadData);
      setInsights(result);
    } catch {
      // silent
    } finally {
      setLoading(null);
    }
  }, [leadData, callAI]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-12 w-12"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 shadow-2xl border-2 max-h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">AI Assistant</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[450px] p-4">
          {!leadData ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a lead to get AI insights</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleSummarize}
                  disabled={loading === 'summary'}
                >
                  {loading === 'summary' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-blue-500" />
                  )}
                  Generate Summary
                </Button>
                {summary && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm space-y-2">
                    <p>{summary.summary}</p>
                    {summary.keyPoints.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {summary.keyPoints.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    )}
                    {summary.suggestedAction && (
                      <div className="flex items-start gap-1.5 text-xs font-medium text-primary pt-1 border-t">
                        <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                        {summary.suggestedAction}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleSuggest}
                  disabled={loading === 'suggestions'}
                >
                  {loading === 'suggestions' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                  )}
                  Follow-up Suggestions
                </Button>
                {suggestions.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {suggestions.map((s, i) => (
                      <div key={i} className="p-2 rounded-lg border bg-card text-sm">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full mt-2 shrink-0',
                              s.priority === 'high' && 'bg-red-500',
                              s.priority === 'medium' && 'bg-amber-500',
                              s.priority === 'low' && 'bg-blue-500'
                            )}
                          />
                          <div>
                            <p>{s.suggestion}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prediction */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handlePredict}
                  disabled={loading === 'predictions'}
                >
                  {loading === 'predictions' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                  )}
                  Conversion Prediction
                </Button>
                {prediction && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Probability</span>
                      <span className={cn(
                        'font-bold text-lg',
                        prediction.probability >= 70 && 'text-emerald-500',
                        prediction.probability >= 40 && prediction.probability < 70 && 'text-amber-500',
                        prediction.probability < 40 && 'text-red-500'
                      )}>
                        {prediction.probability}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium capitalize">{prediction.confidence}</span>
                    </div>
                    {prediction.factors.length > 0 && (
                      <div className="pt-1 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Key Factors:</p>
                        <ul className="list-disc list-inside text-xs space-y-0.5">
                          {prediction.factors.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {prediction.recommendedAction && (
                      <div className="flex items-start gap-1.5 text-xs font-medium text-primary pt-1 border-t">
                        <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                        {prediction.recommendedAction}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Insights */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleInsights}
                  disabled={loading === 'insights'}
                >
                  {loading === 'insights' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                  )}
                  Sales Insights
                </Button>
                {insights && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                    {insights}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
