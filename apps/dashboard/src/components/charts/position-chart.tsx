'use client';

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export interface ChartPoint {
  date: string;
  [keyword: string]: number | null | string;
}

interface Props {
  data:     ChartPoint[];
  keywords: string[];
}

const COLORS = [
  '#4338CA', '#7C3AED', '#0EA5E9',
  '#8B5CF6', '#06B6D4', '#6366F1',
];

function shortDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });
}

export function PositionChart({ data, keywords }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[#9A97C0]">
        Aucune donnée de positionnement encore.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAE8F8" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={{ fill: '#9A97C0', fontSize: 11 }}
          axisLine={{ stroke: '#D9D7F0' }}
          tickLine={false}
        />
        <YAxis
          reversed
          domain={[1, 100]}
          tick={{ fill: '#9A97C0', fontSize: 11 }}
          axisLine={{ stroke: '#D9D7F0' }}
          tickLine={false}
          label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: '#9A97C0', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '1px solid #D9D7F0', borderRadius: 6, fontSize: 12 }}
          labelStyle={{ color: '#6B6B9E' }}
          labelFormatter={shortDate}
          formatter={(value: unknown) => [
            typeof value === 'number' ? `#${value}` : '—',
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#6B6B9E', paddingTop: 8 }}
        />
        {keywords.slice(0, 6).map((kw, i) => (
          <Line
            key={kw}
            type="monotone"
            dataKey={kw}
            name={kw}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
