'use client';

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineTrendProps {
  data: any[];
  lines: { dataKey: string; name: string; color?: string }[];
  xKey: string;
}

export function LineTrend({ data, lines, xKey }: LineTrendProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey={xKey} stroke="#cbd5f5" />
        <YAxis stroke="#cbd5f5" />
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} labelStyle={{ color: 'white' }} />
        <Legend />
        {lines.map((line) => (
          <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.name} stroke={line.color ?? '#38bdf8'} dot={false} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
