'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  New: '#3b82f6',
  Contacted: '#f59e0b',
  Converted: '#10b981',
  Lost: '#ef4444',
};

interface LeadStatusChartProps {
  data: { status: string; count: number; percentage: number }[];
}

export function LeadStatusChart({ data }: LeadStatusChartProps) {
  if (data.length === 0) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No lead data yet</div>;
  }

  return (
    <>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [`${value} leads`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] || '#6b7280' }} />
            <span className="font-medium">{entry.status}</span>
            <span className="text-muted-foreground">{entry.count} ({entry.percentage}%)</span>
          </div>
        ))}
      </div>
    </>
  );
}
