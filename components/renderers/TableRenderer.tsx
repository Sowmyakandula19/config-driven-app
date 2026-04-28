'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/_components/Toast';
import { useLocale } from '@/app/_components/Providers';
//import { CSVImport } from './CSVImport';
import type { PageConfig, EntityConfig, FieldConfig } from '@/lib/config';

interface TableRendererProps {
  page: PageConfig;
}

export function TableRenderer({ page }: TableRendererProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [entity, setEntity] = useState<EntityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();
  const { t } = useLocale();

  const fetchRecords = useCallback(async () => {
    if (!page.entity) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/entities/${page.entity}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.data || []);
        setEntity(data.entity || null);
      } else {
        toast(data.error || t('common.error'), 'error');
      }
    } catch {
      toast(t('common.error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page.entity, t, toast]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    const res = await fetch(`/api/entities/${page.entity}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Deleted successfully', 'success');
      fetchRecords();
    } else {
      toast('Failed to delete', 'error');
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>{page.title}</h1>
          <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            {records.length} record{records.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            ↑ {t('table.import')}
          </button>
          {page.actions.includes('create') && (
            <button className="btn-primary" onClick={() => { setEditRecord(null); setShowForm(true); }}>
              + {t('table.add')}
            </button>
          )}
        </div>
      </div>

    

      {/* Form Modal */}
      {showForm && entity && (
        <FormModal
          entity={entity}
          entityName={page.entity!}
          record={editRecord}
          onClose={() => { setShowForm(false); setEditRecord(null); }}
          onSaved={fetchRecords}
        />
      )}

      {/* Table */}
      {records.length === 0 ? (
        <EmptyState entityName={page.entity || 'records'} onAdd={() => setShowForm(true)} />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                {entity?.fields.map((f) => <th key={f.name}>{f.name}</th>)}
                <th>Created</th>
                {(page.actions.includes('edit') || page.actions.includes('delete')) && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  {entity?.fields.map((f) => (
                    <td key={f.name}>
                      {f.type === 'boolean'
                        ? (record[f.name] ? '✓' : '✗')
                        : record[f.name] ?? <span style={{ color: 'var(--text2)' }}>—</span>}
                    </td>
                  ))}
                  <td style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>
                    {new Date(record.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {page.actions.includes('edit') && (
                        <button
                          className="btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                          onClick={() => { setEditRecord(record); setShowForm(true); }}
                        >
                          {t('table.edit')}
                        </button>
                      )}
                      {page.actions.includes('delete') && (
                        <button className="btn-danger" onClick={() => handleDelete(record.id)}>
                          {t('table.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: '2rem', width: '200px', marginBottom: '1.5rem' }} />
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
            {[...Array(4)].map((_, j) => (
              <div key={j} className="skeleton" style={{ height: '1rem', flex: 1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ entityName, onAdd }: { entityName: string; onAdd: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '300px', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '10px', gap: '1rem',
    }}>
      <div style={{ fontSize: '3rem', opacity: 0.3 }}>▤</div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: 'var(--text2)' }}>
        No {entityName} records yet
      </div>
      <button className="btn-primary" onClick={onAdd}>+ Add First Record</button>
    </div>
  );
}

function FormModal({
  entity, entityName, record, onClose, onSaved
}: {
  entity: EntityConfig;
  entityName: string;
  record: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, any>>(record || {});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { t } = useLocale();

  const handleSubmit = async () => {
    setSaving(true);
    const url = record
      ? `/api/entities/${entityName}/${record.id}`
      : `/api/entities/${entityName}`;
    const method = record ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      toast(record ? 'Updated!' : 'Created!', 'success');
      onSaved();
      onClose();
    } else {
      if (data.fields) setErrors(data.fields);
      toast(data.error || t('common.error'), 'error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="glass animate-in" style={{
        width: '480px', borderRadius: '12px', padding: '2rem',
      }}>
        <h2 style={{ fontFamily: 'Syne', marginBottom: '1.5rem' }}>
          {record ? 'Edit' : 'Add'} {entityName}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {entity.fields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              value={values[field.name]}
              onChange={(v) => setValues({ ...values, [field.name]: v })}
              error={errors[field.name]}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>{t('form.cancel')}</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '...' : t('form.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange, error }: {
  field: FieldConfig; value: any; onChange: (v: any) => void; error?: string;
}) {
  return (
    <div>
      <label>
        {field.name} {field.required && <span style={{ color: 'var(--error)' }}>*</span>}
      </label>
      {field.type === 'enum' && field.options ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : field.type === 'boolean' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 'auto' }}
          />
          <span style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{field.name}</span>
        </div>
      ) : (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
        />
      )}
      {error && <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</div>}
    </div>
  );
}
