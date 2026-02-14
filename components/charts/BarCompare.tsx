'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function BarCompare({ data, xKey, barKey, color = '#22d3ee' }: { data: any[]; xKey: string; barKey: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey={xKey} stroke="#cbd5f5" interval={0} tick={{ fontSize: 12 }} />
        <YAxis stroke="#cbd5f5" />
        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} labelStyle={{ color: 'white' }} />
        <Bar dataKey={barKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
