'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Habit } from '@/types';

// ─── Helpers ─────────────────────────────

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── Chart data builder ───────────────────

function buildChartData(habits: Habit[]) {
  const days = getLast30Days();
  const total = habits.length;

  return days.map((date) => {
    const completed = habits.filter((h) => h.completedDates.includes(date)).length;
    return {
      date: shortDate(date),
      completed,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
}

// ─── Custom tooltip ───────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}{p.name === 'Rate' ? '%' : ''}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────

interface Props {
  habits: Habit[];
}

export function HabitAnalytics({ habits }: Props) {
  if (habits.length === 0) return null;

  const data = buildChartData(habits);
  const totalCompletions = data.reduce((s, d) => s + d.completed, 0);
  const avgRate = Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length);
  const maxDay = data.reduce((m, d) => (d.completed > m.completed ? d : m), data[0]);

  // Show every 5th label to avoid crowding
  const tickFormatter = (_: string, index: number) =>
    index % 5 === 0 ? data[index]?.date ?? '' : '';

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total completions (30d)', value: totalCompletions },
          { label: 'Avg completion rate',     value: `${avgRate}%` },
          { label: 'Best day',                value: `${maxDay.date} (${maxDay.completed})` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart — completions per day */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">Daily Completions — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="completed"
              name="Completed"
              fill="#6366f1"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart — completion rate */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">Completion Rate % — Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="rate"
              name="Rate"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
