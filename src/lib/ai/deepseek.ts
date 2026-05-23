import type { AISummary, AISuggestion, AIConversionPrediction } from '@/types/crm';

interface DeepSeekConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

const config: DeepSeekConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '',
  model: 'deepseek-chat',
  baseUrl: 'https://api.deepseek.com/v1',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatCompletion(messages: ChatMessage[], temperature = 0.3): Promise<string> {
  if (!config.apiKey) {
    throw new Error('DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env.local');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function generateLeadSummary(leadData: {
  name: string;
  marbleType?: string;
  quantity?: string;
  siteLocation?: string;
  status: string;
  pipelineStage: string;
  dealValue?: number;
  notes?: string;
  activities?: string[];
}): Promise<AISummary> {
  const prompt = `You are a CRM sales assistant for a premium marble and construction company. Generate a concise lead summary.

Lead Details:
- Name: ${leadData.name}
- Marble Type: ${leadData.marbleType || 'Not specified'}
- Quantity: ${leadData.quantity || 'Not specified'}
- Site Location: ${leadData.siteLocation || 'Not specified'}
- Status: ${leadData.status}
- Pipeline Stage: ${leadData.pipelineStage}
- Deal Value: ${leadData.dealValue ? `₹${leadData.dealValue}` : 'Not set'}
- Notes: ${leadData.notes || 'None'}
${leadData.activities?.length ? `- Recent Activity: ${leadData.activities.slice(0, 3).join(', ')}` : ''}

Respond with JSON only:
{
  "summary": "2-3 sentence summary",
  "sentiment": "positive|neutral|negative",
  "keyPoints": ["point1", "point2", "point3"],
  "suggestedAction": "One clear suggested next action"
}`;

  const content = await chatCompletion([
    { role: 'system', content: 'You are a CRM sales assistant. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ]);

  try {
    return JSON.parse(content) as AISummary;
  } catch {
    return {
      summary: content,
      sentiment: 'neutral',
      keyPoints: [],
      suggestedAction: 'Review lead details',
    };
  }
}

export async function generateFollowUpSuggestions(leadData: {
  name: string;
  pipelineStage: string;
  daysSinceLastContact?: number;
  dealValue?: number;
  activities?: string[];
}): Promise<AISuggestion[]> {
  const prompt = `Based on this CRM lead, suggest 3 follow-up actions:

Lead: ${leadData.name}
Stage: ${leadData.pipelineStage}
Days since last contact: ${leadData.daysSinceLastContact || 'Unknown'}
Deal value: ${leadData.dealValue ? `₹${leadData.dealValue}` : 'Unknown'}
Activity: ${leadData.activities?.slice(0, 2).join(', ') || 'No recent activity'}

Respond with JSON array only:
[
  {"suggestion": "action text", "priority": "high|medium|low", "reason": "why this action"}
]`;

  const content = await chatCompletion([
    { role: 'system', content: 'You are a CRM sales coach. Respond only with valid JSON arrays.' },
    { role: 'user', content: prompt },
  ]);

  try {
    return JSON.parse(content) as AISuggestion[];
  } catch {
    return [
      { suggestion: 'Contact lead for follow-up', priority: 'medium', reason: 'Based on lead activity' },
    ];
  }
}

export async function predictConversion(leadData: {
  name: string;
  pipelineStage: string;
  dealValue: number;
  leadSource: string;
  daysSinceCreated: number;
  activitiesCount: number;
  marbleType?: string;
}): Promise<AIConversionPrediction> {
  const prompt = `Predict conversion probability for this CRM lead:

Lead: ${leadData.name}
Stage: ${leadData.pipelineStage}
Deal Value: ₹${leadData.dealValue}
Source: ${leadData.leadSource}
Days in system: ${leadData.daysSinceCreated}
Total interactions: ${leadData.activitiesCount}
Marble type: ${leadData.marbleType || 'Not specified'}

Respond with JSON only:
{
  "probability": 0-100,
  "confidence": "high|medium|low",
  "factors": ["factor1", "factor2"],
  "recommendedAction": "best next action"
}`;

  const content = await chatCompletion([
    { role: 'system', content: 'You are an AI sales analyst. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ]);

  try {
    return JSON.parse(content) as AIConversionPrediction;
  } catch {
    return {
      probability: 50,
      confidence: 'medium',
      factors: ['Insufficient data for detailed analysis'],
      recommendedAction: 'Gather more information about this lead',
    };
  }
}

export async function generateWhatsAppReply(
  customerMessage: string,
  context: { name: string; marbleType?: string; pipelineStage: string }
): Promise<string> {
  const prompt = `Generate a professional WhatsApp reply for a marble company CRM agent.

Customer: ${context.name}
Marble Interest: ${context.marbleType || 'General'}
Pipeline Stage: ${context.pipelineStage}
Customer Message: "${customerMessage}"

Reply should be:
- Professional and warm
- Under 200 characters
- Include next step suggestion
- In English (keep natural)`;

  return chatCompletion([
    { role: 'system', content: 'You are a professional sales representative for a premium marble company.' },
    { role: 'user', content: prompt },
  ], 0.5);
}

export async function generateSalesInsights(leadsData: {
  totalLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  topPerformingAgent?: string;
  stageDistribution: Record<string, number>;
}): Promise<string> {
  const prompt = `Analyze this CRM sales data and provide key insights:

Total Leads: ${leadsData.totalLeads}
Converted: ${leadsData.convertedLeads}
Conversion Rate: ${((leadsData.convertedLeads / leadsData.totalLeads) * 100).toFixed(1)}%
Revenue: ₹${leadsData.totalRevenue}
Top Agent: ${leadsData.topPerformingAgent || 'N/A'}
Stage Distribution: ${JSON.stringify(leadsData.stageDistribution)}

Provide 3-4 actionable insights in bullet points.`;

  return chatCompletion([
    { role: 'system', content: 'You are a senior sales analytics consultant.' },
    { role: 'user', content: prompt },
  ], 0.2);
}

export const ai = {
  summarize: generateLeadSummary,
  suggest: generateFollowUpSuggestions,
  predict: predictConversion,
  reply: generateWhatsAppReply,
  insights: generateSalesInsights,
};
