'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PageConfig, WidgetConfig } from '@/lib/config';
import { useLocale } from '@/app/_components/Providers';

const COLORS = ['#7c6aff', '#ff6a7c', '#4ade80', '#fbbf24', '#60a5fa', '#f472b6'];

export function DashboardRenderer({ page }: { page: PageConfig }) {
  const { t } = useLocale();
  return (
    <div className="animate-in">
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.75rem', marginBottom: '2rem' }}>
        {page.title}
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {page.widgets?.filter((w) => w.type === 'stat').map((widget, i) => (
          <StatWidget key={i} widget={widget} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {page.widgets?.filter((w) => w.type === 'chart').map((widget, i) => (
          <ChartWidget key={i} widget={widget} />
        ))}
      </div>
    </div>
  );
}

function StatWidget({ widget }: { widget: WidgetConfig }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/stats?entity=${widget.entity}`)
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, [widget.entity]);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '1.5rem',
    }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text2)', fontFamily: 'Syne', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {widget.label || widget.entity}
      </div>
      <div style={{ fontSize: '2.5rem', fontFamily: 'Syne', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent)' }}>
        {count === null ? <span className="skeleton" style={{ display: 'inline-block', width: '60px', height: '2.5rem' }} /> : count}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '0.25rem' }}>total records</div>
    </div>
  );
}

function ChartWidget({ widget }: { widget: WidgetConfig }) {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stats?entity=${widget.entity}&groupBy=${widget.groupBy || ''}`)
      .then((r) => r.json())
      .then((d) => { setData(d.grouped || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [widget.entity, widget.groupBy]);

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '1.5rem',
    }}>
      <div style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '1.25rem' }}>
        {widget.label || `${widget.entity} by ${widget.groupBy}`}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: '200px', borderRadius: '8px' }} />
      ) : data.length === 0 ? (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: '0.875rem' }}>
          No data yet
        </div>
      ) : widget.chartType === 'pie' ? (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px' }} />
            <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
