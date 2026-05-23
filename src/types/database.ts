// ============================================================
// Database Type Definitions — Generated from Supabase Schema
// ============================================================

export interface Json {
  [key: string]: unknown;
}

export interface Database {
  public: {
    Tables: {
      agents: AgentsTable;
      user_profiles: UserProfilesTable;
      leads: LeadsTable;
      agent_locations: AgentLocationsTable;
      lead_activities: LeadActivitiesTable;
      lead_attachments: LeadAttachmentsTable;
      follow_ups: FollowUpsTable;
      quotations: QuotationsTable;
      invoices: InvoicesTable;
      inventory_items: InventoryItemsTable;
      stock_movements: StockMovementsTable;
      audit_logs: AuditLogsTable;
      whatsapp_messages: WhatsappMessagesTable;
      workflow_rules: WorkflowRulesTable;
      field_checkins: FieldCheckinsTable;
      geofences: GeofencesTable;
      roles: RolesTable;
      permissions: PermissionsTable;
      role_permissions: RolePermissionsTable;
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: { Args: Record<string, never>; Returns: unknown };
      current_user_role: { Args: Record<string, never>; Returns: string };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_permission: { Args: { resource: string; action: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}

// --- Agents ---
export interface AgentsTable {
  Row: Agent;
  Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  Update: Partial<Agent>;
  Relationships: [];
}

export interface Agent {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'Active' | 'Offline';
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- User Profiles ---
export interface UserProfilesTable {
  Row: UserProfile;
  Insert: Omit<UserProfile, 'created_at' | 'updated_at'> & { created_at?: string };
  Update: Partial<UserProfile>;
  Relationships: [];
}

export interface UserProfile {
  id: string;
  role: 'admin' | 'agent' | 'super_admin' | 'director' | 'sales_manager' | 'sales_executive' | 'marketing' | 'accountant' | 'warehouse';
  role_id: string | null;
  agent_id: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// --- Leads ---
export interface LeadsTable {
  Row: Lead;
  Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  Update: Partial<Lead>;
  Relationships: [];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  contact_person: string | null;
  marble_type: string | null;
  quantity: string | null;
  site_location: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: 'New' | 'Contacted' | 'Converted' | 'Lost';
  pipeline_stage: PipelineStage;
  deal_value: number | null;
  probability: number;
  lead_score: number;
  lead_source: string | null;
  assigned_to: string | null;
  created_by: string | null;
  notes: string | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- Agent Locations ---
export interface AgentLocationsTable {
  Row: AgentLocation;
  Insert: Omit<AgentLocation, 'id' | 'recorded_at'> & { id?: string };
  Update: Partial<AgentLocation>;
  Relationships: [];
}

export interface AgentLocation {
  id: string;
  agent_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  recorded_at: string;
}

// --- Lead Activities ---
export interface LeadActivitiesTable {
  Row: LeadActivity;
  Insert: Omit<LeadActivity, 'id' | 'created_at'> & { id?: string };
  Update: Partial<LeadActivity>;
  Relationships: [];
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: ActivityType;
  description: string;
  metadata: Json | null;
  created_at: string;
}

// --- Lead Attachments ---
export interface LeadAttachmentsTable {
  Row: LeadAttachment;
  Insert: Omit<LeadAttachment, 'id' | 'created_at'> & { id?: string };
  Update: Partial<LeadAttachment>;
  Relationships: [];
}

export interface LeadAttachment {
  id: string;
  lead_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

// --- Follow Ups ---
export interface FollowUpsTable {
  Row: FollowUp;
  Insert: Omit<FollowUp, 'id' | 'created_at'> & { id?: string };
  Update: Partial<FollowUp>;
  Relationships: [];
}

export interface FollowUp {
  id: string;
  lead_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  due_at: string;
  completed_at: string | null;
  notification_sent: boolean;
  created_by: string | null;
  created_at: string;
}

// --- Quotations ---
export interface QuotationsTable {
  Row: Quotation;
  Insert: Omit<Quotation, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  Update: Partial<Quotation>;
  Relationships: [];
}

export interface Quotation {
  id: string;
  quotation_number: string;
  lead_id: string | null;
  agent_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  items: QuotationItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Converted';
  valid_until: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  name: string;
  marble_type: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

// --- Invoices ---
export interface InvoicesTable {
  Row: Invoice;
  Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  Update: Partial<Invoice>;
  Relationships: [];
}

export interface Invoice {
  id: string;
  invoice_number: string;
  quotation_id: string | null;
  lead_id: string | null;
  gst_number: string | null;
  items: QuotationItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: 'Unpaid' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';
  due_date: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// --- Inventory ---
export interface InventoryItemsTable {
  Row: InventoryItem;
  Insert: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'> & { id?: string };
  Update: Partial<InventoryItem>;
  Relationships: [];
}

export interface InventoryItem {
  id: string;
  name: string;
  marble_type: string;
  color: string | null;
  finish: string | null;
  thickness: number | null;
  size: string | null;
  quantity_available: number;
  unit: string;
  unit_price: number | null;
  location: string | null;
  supplier: string | null;
  min_stock_level: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  created_at: string;
  updated_at: string;
}

// --- Stock Movements ---
export interface StockMovementsTable {
  Row: StockMovement;
  Insert: Omit<StockMovement, 'id' | 'created_at'> & { id?: string };
  Update: Partial<StockMovement>;
  Relationships: [];
}

export interface StockMovement {
  id: string;
  item_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

// --- Audit Logs ---
export interface AuditLogsTable {
  Row: AuditLog;
  Insert: Omit<AuditLog, 'id' | 'created_at'> & { id?: string };
  Update: Partial<AuditLog>;
  Relationships: [];
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// --- WhatsApp Messages ---
export interface WhatsappMessagesTable {
  Row: WhatsappMessage;
  Insert: Omit<WhatsappMessage, 'id' | 'created_at'> & { id?: string };
  Update: Partial<WhatsappMessage>;
  Relationships: [];
}

export interface WhatsappMessage {
  id: string;
  lead_id: string | null;
  agent_id: string | null;
  direction: 'outbound' | 'inbound';
  message_type: 'text' | 'template' | 'image' | 'document';
  content: string;
  media_url: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  whatsapp_message_id: string | null;
  created_at: string;
}

// --- Workflow Rules ---
export interface WorkflowRulesTable {
  Row: WorkflowRule;
  Insert: Omit<WorkflowRule, 'id' | 'created_at'> & { id?: string };
  Update: Partial<WorkflowRule>;
  Relationships: [];
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger_event: string;
  conditions: Json | null;
  actions: Json;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

// --- Field Checkins ---
export interface FieldCheckinsTable {
  Row: FieldCheckin;
  Insert: Omit<FieldCheckin, 'id' | 'created_at'> & { id?: string };
  Update: Partial<FieldCheckin>;
  Relationships: [];
}

export interface FieldCheckin {
  id: string;
  agent_id: string;
  lead_id: string | null;
  type: 'checkin' | 'checkout';
  latitude: number;
  longitude: number;
  address: string | null;
  notes: string | null;
  created_at: string;
}

// --- Geofences ---
export interface GeofencesTable {
  Row: Geofence;
  Insert: Omit<Geofence, 'id' | 'created_at'> & { id?: string };
  Update: Partial<Geofence>;
  Relationships: [];
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  agent_id: string | null;
  is_active: boolean;
  created_at: string;
}

// --- Roles ---
export interface RolesTable {
  Row: Role;
  Insert: Omit<Role, 'id' | 'created_at'> & { id?: string };
  Update: Partial<Role>;
  Relationships: [];
}

export interface Role {
  id: string;
  name: string;
  hierarchy_level: number;
  created_at: string;
}

// --- Permissions ---
export interface PermissionsTable {
  Row: Permission;
  Insert: Omit<Permission, 'id'> & { id?: string };
  Update: Partial<Permission>;
  Relationships: [];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

// --- Role Permissions ---
export interface RolePermissionsTable {
  Row: RolePermission;
  Insert: RolePermission;
  Update: Partial<RolePermission>;
  Relationships: [];
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

// --- Enums / Union Types ---
export type PipelineStage =
  | 'New'
  | 'Interested'
  | 'Site Visit'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Converted'
  | 'Lost';

export type ActivityType =
  | 'note'
  | 'status_change'
  | 'call'
  | 'visit'
  | 'quotation'
  | 'followup'
  | 'assignment'
  | 'pipeline_move';
