import type { PipelineStage, ActivityType } from './database';

// ============================================================
// CRM Domain Types
// ============================================================

// --- API Responses ---
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// --- Lead Display Types ---
export interface LeadCard {
  id: string;
  name: string;
  phone: string;
  marbleType: string;
  quantity: string;
  siteLocation: string;
  city: string;
  status: string;
  pipelineStage: PipelineStage;
  dealValue: number;
  probability: number;
  leadScore: number;
  leadSource: string;
  assignedTo: string;
  assignedAgentName?: string;
  createdAt: string;
  followUpAt?: string;
  notes?: string;
}

export function mapLeadToCard(lead: Record<string, unknown>): LeadCard {
  return {
    id: lead.id as string,
    name: (lead.name as string) ?? '',
    phone: (lead.phone as string) ?? '',
    marbleType: (lead.marble_type as string) ?? '',
    quantity: (lead.quantity as string) ?? '',
    siteLocation: (lead.site_location as string) ?? '',
    city: (lead.city as string) ?? '',
    status: (lead.status as string) ?? 'New',
    pipelineStage: (lead.pipeline_stage as PipelineStage) ?? 'New',
    dealValue: (lead.deal_value as number) ?? 0,
    probability: (lead.probability as number) ?? 0,
    leadScore: (lead.lead_score as number) ?? 0,
    leadSource: (lead.lead_source as string) ?? '',
    assignedTo: (lead.assigned_to as string) ?? '',
    createdAt: (lead.created_at as string) ?? '',
    followUpAt: lead.follow_up_at as string | undefined,
    notes: lead.notes as string | undefined,
  };
}

// --- Pipeline Types ---
export interface PipelineColumn {
  id: PipelineStage;
  title: string;
  leads: LeadCard[];
  color: string;
}

export interface PipelineMove {
  leadId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  position: number;
}

// --- Activity Types ---
export interface ActivityItem {
  id: string;
  leadId: string;
  userId: string | null;
  userName?: string;
  activityType: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  totalLeads: number;
  activeAgents: number;
  pendingOrders: number;
  convertedLeads: number;
  totalRevenue: number;
  monthlyGrowth: number;
  conversionRate: number;
  avgDealValue: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
}

// --- Analytics ---
export interface AnalyticsSummary {
  revenue: ChartDataPoint[];
  conversionFunnel: FunnelStage[];
  agentPerformance: AgentPerformance[];
  leadSources: { source: string; count: number }[];
  monthlyTrend: ChartDataPoint[];
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  avgResponseTime: number;
}

// --- Notification ---
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: string;
}

// --- AI ---
export interface AISummary {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPoints: string[];
  suggestedAction: string;
}

export interface AISuggestion {
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface AIConversionPrediction {
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
  recommendedAction: string;
}

// --- Filter Types ---
export interface LeadFilters {
  search?: string;
  status?: string;
  pipelineStage?: PipelineStage;
  assignedTo?: string;
  leadSource?: string;
  dateFrom?: string;
  dateTo?: string;
  minValue?: number;
  maxValue?: number;
}

export interface AgentFilters {
  search?: string;
  status?: string;
  sortBy?: 'name' | 'leads' | 'conversion' | 'revenue';
}

// --- Sort ---
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}
