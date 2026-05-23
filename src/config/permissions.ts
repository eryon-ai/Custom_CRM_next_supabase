// ============================================================
// Enterprise RBAC — Permission Configuration
// ============================================================

export type Resource =
  | 'leads'
  | 'agents'
  | 'pipeline'
  | 'quotations'
  | 'invoices'
  | 'inventory'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'field_ops'
  | 'communication'
  | 'workflow'
  | 'audit'
  | 'ai';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'assign' | 'export' | 'approve' | 'manage';

export type RoleId =
  | 'super_admin'
  | 'director'
  | 'sales_manager'
  | 'sales_executive'
  | 'marketing'
  | 'accountant'
  | 'warehouse';

export interface PermissionDefinition {
  resource: Resource;
  action: Action;
  description: string;
}

export interface RoleDefinition {
  id: RoleId;
  label: string;
  level: number;
  permissions: PermissionDefinition[];
}

// Define all permissions per role
const ALL: PermissionDefinition[] = [
  { resource: 'leads', action: 'manage', description: 'Full access to leads' },
  { resource: 'agents', action: 'manage', description: 'Full access to agents' },
  { resource: 'pipeline', action: 'manage', description: 'Full access to pipeline' },
  { resource: 'quotations', action: 'manage', description: 'Full access to quotations' },
  { resource: 'invoices', action: 'manage', description: 'Full access to invoices' },
  { resource: 'inventory', action: 'manage', description: 'Full access to inventory' },
  { resource: 'reports', action: 'manage', description: 'Full access to reports' },
  { resource: 'analytics', action: 'manage', description: 'Full access to analytics' },
  { resource: 'settings', action: 'manage', description: 'Full access to settings' },
  { resource: 'field_ops', action: 'manage', description: 'Full access to field ops' },
  { resource: 'communication', action: 'manage', description: 'Full access to communication' },
  { resource: 'workflow', action: 'manage', description: 'Full access to workflows' },
  { resource: 'audit', action: 'manage', description: 'Full access to audit logs' },
  { resource: 'ai', action: 'manage', description: 'Full access to AI features' },
];

export const ROLE_DEFINITIONS: Record<RoleId, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    label: 'Super Admin',
    level: 1,
    permissions: ALL,
  },
  director: {
    id: 'director',
    label: 'Director',
    level: 2,
    permissions: [
      ...ALL.filter(
        (p) =>
          !['settings', 'workflow', 'audit'].includes(p.resource) ||
          p.action === 'read'
      ),
      { resource: 'settings', action: 'read', description: 'View settings' },
      { resource: 'audit', action: 'read', description: 'View audit logs' },
    ],
  },
  sales_manager: {
    id: 'sales_manager',
    label: 'Sales Manager',
    level: 3,
    permissions: [
      { resource: 'leads', action: 'manage', description: 'Full access to leads' },
      { resource: 'pipeline', action: 'manage', description: 'Full access to pipeline' },
      { resource: 'agents', action: 'read', description: 'View agents' },
      { resource: 'quotations', action: 'manage', description: 'Full access to quotations' },
      { resource: 'invoices', action: 'read', description: 'View invoices' },
      { resource: 'reports', action: 'manage', description: 'Full access to reports' },
      { resource: 'analytics', action: 'manage', description: 'Full access to analytics' },
      { resource: 'communication', action: 'manage', description: 'Full access to communication' },
      { resource: 'field_ops', action: 'read', description: 'View field ops' },
      { resource: 'ai', action: 'manage', description: 'Full access to AI' },
      { resource: 'inventory', action: 'read', description: 'View inventory' },
    ],
  },
  sales_executive: {
    id: 'sales_executive',
    label: 'Sales Executive',
    level: 4,
    permissions: [
      { resource: 'leads', action: 'create', description: 'Create leads' },
      { resource: 'leads', action: 'read', description: 'View assigned leads' },
      { resource: 'leads', action: 'update', description: 'Update assigned leads' },
      { resource: 'pipeline', action: 'read', description: 'View pipeline' },
      { resource: 'pipeline', action: 'update', description: 'Move own leads' },
      { resource: 'quotations', action: 'create', description: 'Create quotations' },
      { resource: 'quotations', action: 'read', description: 'View own quotations' },
      { resource: 'agents', action: 'read', description: 'View agents' },
      { resource: 'field_ops', action: 'manage', description: 'Full access to field ops' },
      { resource: 'communication', action: 'manage', description: 'Full access to communication' },
      { resource: 'ai', action: 'read', description: 'Use AI suggestions' },
      { resource: 'analytics', action: 'read', description: 'View personal analytics' },
    ],
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing Team',
    level: 5,
    permissions: [
      { resource: 'leads', action: 'read', description: 'View leads' },
      { resource: 'leads', action: 'create', description: 'Create leads' },
      { resource: 'leads', action: 'update', description: 'Update leads' },
      { resource: 'communication', action: 'manage', description: 'Full access to communication' },
      { resource: 'analytics', action: 'read', description: 'View analytics' },
      { resource: 'reports', action: 'read', description: 'View reports' },
      { resource: 'agents', action: 'read', description: 'View agents' },
      { resource: 'ai', action: 'read', description: 'Use AI suggestions' },
      { resource: 'pipeline', action: 'read', description: 'View pipeline' },
    ],
  },
  accountant: {
    id: 'accountant',
    label: 'Accountant',
    level: 6,
    permissions: [
      { resource: 'quotations', action: 'read', description: 'View quotations' },
      { resource: 'invoices', action: 'manage', description: 'Full access to invoices' },
      { resource: 'reports', action: 'manage', description: 'Full access to reports' },
      { resource: 'analytics', action: 'read', description: 'View analytics' },
      { resource: 'inventory', action: 'read', description: 'View inventory' },
      { resource: 'leads', action: 'read', description: 'View leads' },
    ],
  },
  warehouse: {
    id: 'warehouse',
    label: 'Warehouse Manager',
    level: 7,
    permissions: [
      { resource: 'inventory', action: 'manage', description: 'Full access to inventory' },
      { resource: 'inventory', action: 'create', description: 'Add stock' },
      { resource: 'inventory', action: 'update', description: 'Update stock' },
      { resource: 'inventory', action: 'read', description: 'View inventory' },
      { resource: 'leads', action: 'read', description: 'View related leads' },
      { resource: 'invoices', action: 'read', description: 'View dispatch invoices' },
      { resource: 'reports', action: 'read', description: 'View inventory reports' },
    ],
  },
};

// Permission checking helpers
export function hasPermission(role: RoleId, resource: Resource, action: Action): boolean {
  const roleDef = ROLE_DEFINITIONS[role];
  if (!roleDef) return false;
  return roleDef.permissions.some(
    (p) =>
      p.resource === resource && (p.action === action || p.action === 'manage')
  );
}

export function canManage(role: RoleId, resource: Resource): boolean {
  return hasPermission(role, resource, 'manage');
}

export function getRoleLevel(role: RoleId): number {
  return ROLE_DEFINITIONS[role]?.level ?? 999;
}

export function isRoleAtLeast(role: RoleId, minLevel: number): boolean {
  return getRoleLevel(role) <= minLevel;
}
