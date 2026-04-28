import { TableRenderer } from './renderers/TableRenderer';
import { DashboardRenderer } from './renderers/DashboardRenderer';
import type { PageConfig } from '@/lib/config';

// ============================================================
// COMPONENT REGISTRY
// To add a new page type:
// 1. Create a new renderer component in components/renderers/
// 2. Import it here
// 3. Add it to the registry below
// That's it — no other changes needed.
// ============================================================

type RendererComponent = React.ComponentType<{ page: PageConfig }>;

const ComponentRegistry: Record<string, RendererComponent> = {
  table: TableRenderer,
  dashboard: DashboardRenderer,
  // Add new types here:
  // form: FormRenderer,
  // kanban: KanbanRenderer,
  // calendar: CalendarRenderer,
};

export function getRenderer(type: string): RendererComponent {
  return ComponentRegistry[type] || FallbackRenderer;
}

function FallbackRenderer({ page }: { page: PageConfig }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', background: 'var(--surface)', border: '2px dashed var(--border)',
      borderRadius: '12px', gap: '1rem',
    }}>
      <div style={{ fontSize: '2.5rem', opacity: 0.4 }}>◈</div>
      <div style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text2)' }}>
        Unknown component type: <code style={{ color: 'var(--accent)' }}>"{page.type}"</code>
      </div>
      <div style={{ color: 'var(--text2)', fontSize: '0.8rem' }}>
        Add a renderer for this type in <code>components/renderers/</code> and register it in <code>components/registry.tsx</code>
      </div>
    </div>
  );
}
