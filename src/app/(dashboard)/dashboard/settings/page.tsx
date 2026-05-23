'use client';

import { useState, useMemo } from 'react';
import { Shield, Users, Key, Bell, Palette, Database, RefreshCw, Loader2, ChevronDown, ChevronUp, Search, CheckCircle2, XCircle, UserCog, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_DEFINITIONS, type RoleId, type Resource, type Action } from '@/config/permissions';
import { useAgentsQuery } from '@/hooks/use-queries';

interface User {
  id: string;
  name: string;
  email: string;
  role: RoleId;
  status: 'active' | 'inactive';
}

export default function SettingsPage() {
  const { data, isLoading } = useAgentsQuery();
  const agents = data?.agents || [];

  // Map agents to users for display (in production, fetch from auth.users)
  const users: User[] = agents.map((a: Record<string, unknown>) => ({
    id: a.id,
    name: a.name,
    email: a.email || '',
    role: (a.role || 'sales_executive') as RoleId,
    status: (a.status === 'Active' ? 'active' : 'inactive') as 'active' | 'inactive',
  }));

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'security' | 'preferences'>('users');

  const tabs = [
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'roles' as const, label: 'Roles & Permissions', icon: Shield },
    { id: 'security' as const, label: 'Security', icon: Key },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
  ];

  const roleLevels: Record<RoleId, string> = {
    super_admin: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
    director: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    sales_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    sales_executive: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    marketing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    accountant: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
    warehouse: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  // ── Role Management State (additive — existing code untouched) ──
  const [expandedRole, setExpandedRole] = useState<RoleId | null>(null);
  const [editingRoleForUser, setEditingRoleForUser] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Compute user counts per role
  const roleUserCounts = useMemo(() => {
    const counts: Partial<Record<RoleId, number>> = {};
    const allRoles: RoleId[] = ['super_admin', 'director', 'sales_manager', 'sales_executive', 'marketing', 'accountant', 'warehouse'];
    allRoles.forEach((r) => {
      counts[r] = users.filter((u) => u.role === r).length;
    });
    return counts;
  }, [users]);

  // Group permissions by resource for display
  const groupedPermissions = useMemo(() => {
    const roleDef = ROLE_DEFINITIONS;
    const grouped: Partial<Record<string, { resource: string; actions: string[]; description: string }[]>> = {};
    Object.entries(roleDef).forEach(([roleId, def]) => {
      const byResource = new Map<string, { resource: string; actions: string[]; description: string }>();
      def.permissions.forEach((p) => {
        const existing = byResource.get(p.resource);
        if (existing) {
          existing.actions.push(p.action);
        } else {
          byResource.set(p.resource, { resource: p.resource, actions: [p.action], description: p.description });
        }
      });
      grouped[roleId] = Array.from(byResource.values());
    });
    return grouped;
  }, []);

  const resourceLabels: Record<string, string> = {
    leads: 'Leads', agents: 'Agents', pipeline: 'Pipeline', quotations: 'Quotations',
    invoices: 'Invoices', inventory: 'Inventory', reports: 'Reports', analytics: 'Analytics',
    settings: 'Settings', field_ops: 'Field Ops', communication: 'Communication',
    workflow: 'Workflows', audit: 'Audit Logs', ai: 'AI Features',
  };

  async function handleRoleChange(userId: string, agentId: string, newRole: RoleId) {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole, agentId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to update role');
      }
      setSaveMsg(`Role updated to ${ROLE_DEFINITIONS[newRole]?.label || newRole}`);
      setEditingRoleForUser(null);
    } catch (err) {
      setSaveMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">Manage users, roles, and system preferences</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Users Tab — with Role Assignment */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Management</CardTitle>
            <CardDescription>Manage user accounts and role assignments — click a role badge to change it</CardDescription>
          </CardHeader>
          {saveMsg && (
            <div className="px-6 pb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full inline-block ${
                saveMsg.startsWith('Role') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
              }`}>
                {saveMsg}
              </span>
            </div>
          )}
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="py-3 font-medium">{user.name}</td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3">
                        {editingRoleForUser === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              className="px-2 py-1 border border-input rounded text-xs bg-background"
                              defaultValue={user.role}
                              onChange={(e) => {
                                handleRoleChange(user.id, user.id, e.target.value as RoleId);
                              }}
                              disabled={saving}
                            >
                              {(Object.keys(ROLE_DEFINITIONS) as RoleId[]).map((r) => (
                                <option key={r} value={r}>{ROLE_DEFINITIONS[r].label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingRoleForUser(null)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRoleForUser(user.id)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${roleLevels[user.role] || ''}`}
                            title="Click to change role"
                          >
                            {ROLE_DEFINITIONS[user.role]?.label || user.role}
                          </button>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {isLoading && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Loading users...</td></tr>
                  )}
                  {!isLoading && users.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No users found. Add agents to see them here.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Tab — Enhanced Role Management */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          {/* Role summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {(Object.keys(ROLE_DEFINITIONS) as RoleId[]).map((roleId) => {
              const role = ROLE_DEFINITIONS[roleId];
              const count = roleUserCounts[roleId] || 0;
              return (
                <button
                  key={roleId}
                  onClick={() => setExpandedRole(expandedRole === roleId ? null : roleId)}
                  className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm ${
                    expandedRole === roleId ? 'ring-2 ring-primary bg-primary/5' : 'bg-card hover:bg-muted/50'
                  }`}
                >
                  <p className="text-xs font-semibold truncate">{role.label}</p>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground">users</p>
                </button>
              );
            })}
          </div>

          {/* Expanded Role Detail */}
          {expandedRole && (() => {
            const role = ROLE_DEFINITIONS[expandedRole];
            const perms = groupedPermissions[expandedRole] || [];
            return (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        {role.label}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${roleLevels[expandedRole] || ''}`}>
                          Level {role.level}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {role.permissions.length} permissions across {perms.length} resources · {roleUserCounts[expandedRole] || 0} users assigned
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedRole(null)}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filter/Search permissions */}
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      className="w-full pl-8 pr-3 py-1.5 border border-input rounded-lg text-xs bg-background"
                      placeholder="Filter permissions..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                    />
                  </div>

                  {/* Permission Grid by Resource */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms
                      .filter((p) =>
                        !roleSearch ||
                        p.resource.toLowerCase().includes(roleSearch.toLowerCase()) ||
                        p.description.toLowerCase().includes(roleSearch.toLowerCase())
                      )
                      .map((perm) => (
                        <div
                          key={perm.resource}
                          className="flex items-start gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors"
                        >
                          <div className={`p-1.5 rounded mt-0.5 ${
                            perm.actions.includes('manage') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                            perm.actions.length >= 3 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {perm.actions.includes('manage') ? (
                              <ShieldCheck className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">
                              {resourceLabels[perm.resource] || perm.resource}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {perm.actions.map((action) => (
                                <span
                                  key={action}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                                    action === 'manage' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400' :
                                    action === 'delete' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400' :
                                    'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {action}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Users with this role */}
                  {roleUserCounts[expandedRole]! > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-xs font-medium mb-2 text-muted-foreground">
                        Users with this role ({roleUserCounts[expandedRole]})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {users
                          .filter((u) => u.role === expandedRole)
                          .map((u) => (
                            <span key={u.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs">
                              <UserCog className="h-3 w-3" />
                              {u.name}
                              <span className="text-[10px] text-muted-foreground">({u.email})</span>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Quick Role Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Role Hierarchy
              </CardTitle>
              <CardDescription>Permission inheritance from highest to lowest access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(Object.keys(ROLE_DEFINITIONS) as RoleId[])
                  .sort((a, b) => ROLE_DEFINITIONS[a].level - ROLE_DEFINITIONS[b].level)
                  .map((roleId) => {
                    const role = ROLE_DEFINITIONS[roleId];
                    const manageCount = role.permissions.filter((p) => p.action === 'manage').length;
                    return (
                      <div key={roleId} className="flex items-center gap-3 py-1.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${roleLevels[roleId] || ''}`}>
                          {role.level}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{role.label}</span>
                            <span className="text-xs text-muted-foreground">{roleUserCounts[roleId] || 0} users</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (manageCount / 14) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {role.permissions.length} permissions · {manageCount} full-access resources
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Settings</CardTitle>
              <CardDescription>Configure authentication and session policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Timeout</span>
                <span className="text-sm font-medium">24 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Max Login Attempts</span>
                <span className="text-sm font-medium">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Two-Factor Auth</span>
                <span className="text-sm font-medium text-muted-foreground">Coming soon</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Audit Trail</CardTitle>
              <CardDescription>Recent security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Login attempts (24h)</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Failed logins</span>
                  <span className="font-medium text-amber-500">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active sessions</span>
                  <span className="font-medium text-emerald-500">2</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Preferences</CardTitle>
            <CardDescription>Configure CRM defaults and display options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Default Pipeline View</p>
                <p className="text-xs text-muted-foreground">Kanban or List view for pipeline</p>
              </div>
              <select className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background">
                <option>Kanban</option>
                <option>List</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Currency</p>
                <p className="text-xs text-muted-foreground">Default currency for deals</p>
              </div>
              <select className="px-3 py-1.5 border border-input rounded-lg text-sm bg-background">
                <option>INR (₹)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-muted-foreground">Email notifications for lead updates</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
