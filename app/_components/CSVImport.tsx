'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useToast } from '@/app/_components/Toast';
import { useLocale } from '@/app/_components/Providers';
import type { EntityConfig } from '@/lib/config';

interface CSVImportProps {
  entity: EntityConfig;
  entityName: string;
  onClose: () => void;
  onImported: () => void;
}

type Step = 'upload' | 'map' | 'preview' | 'done';

export function CSVImport({ entity, entityName, onClose, onImported }: CSVImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLocale();

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || [];
        setCsvHeaders(headers);
        setCsvRows(result.data as Record<string, string>[]);
        // Auto-map matching headers
        const autoMap: Record<string, string> = {};
        for (const field of entity.fields) {
          const match = headers.find(
            (h) => h.toLowerCase() === field.name.toLowerCase()
          );
          if (match) autoMap[field.name] = match;
        }
        setMapping(autoMap);
        setStep('map');
      },
    });
  };

  const handleImport = async () => {
    setImporting(true);
    const rows = csvRows.map((row) => {
      const mapped: Record<string, any> = {};
      for (const [fieldName, csvCol] of Object.entries(mapping)) {
        if (csvCol && row[csvCol] !== undefined) {
          mapped[fieldName] = row[csvCol];
        }
      }
      return mapped;
    });

    const res = await fetch(`/api/bulk-create/${entityName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setImporting(false);

    if (res.ok) {
      setResult(data);
      setStep('done');
      toast(`Imported ${data.created} records`, 'success');
      onImported();
    } else {
      toast(data.error || 'Import failed', 'error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="glass animate-in" style={{ width: '560px', borderRadius: '12px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Syne' }}>CSV Import — {entityName}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['upload', 'map', 'preview', 'done'] as Step[]).map((s, i) => (
            <div key={s} style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '100px',
              fontSize: '0.7rem',
              fontFamily: 'Syne',
              fontWeight: 600,
              background: step === s ? 'var(--accent)' : 'var(--surface2)',
              color: step === s ? 'white' : 'var(--text2)',
            }}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>

        {/* Upload step */}
        {step === 'upload' && (
          <div
            style={{
              border: '2px dashed var(--border)', borderRadius: '10px',
              padding: '3rem', textAlign: 'center', cursor: 'pointer',
            }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>↑</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 600 }}>Drop CSV or click to upload</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Supports any CSV with headers
            </div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {/* Map step */}
        {step === 'map' && (
          <div>
            <div style={{ marginBottom: '1rem', color: 'var(--text2)', fontSize: '0.8rem' }}>
              {csvRows.length} rows detected. Map CSV columns to entity fields:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
              {entity.fields.map((field) => (
                <div key={field.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '120px', fontFamily: 'Syne', fontSize: '0.8rem', fontWeight: 600 }}>
                    {field.name}
                    {field.required && <span style={{ color: 'var(--error)' }}>*</span>}
                  </div>
                  <select
                    value={mapping[field.name] || ''}
                    onChange={(e) => setMapping({ ...mapping, [field.name]: e.target.value })}
                    style={{ flex: 1 }}
                  >
                    <option value="">— skip —</option>
                    {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setStep('upload')}>← Back</button>
              <button className="btn-primary" onClick={() => setStep('preview')}>Preview →</button>
            </div>
          </div>
        )}

        {/* Preview step */}
        {step === 'preview' && (
          <div>
            <div style={{ marginBottom: '1rem', color: 'var(--text2)', fontSize: '0.8rem' }}>
              Preview (first 3 rows):
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <table>
                <thead>
                  <tr>
                    {Object.keys(mapping).filter(k => mapping[k]).map((f) => <th key={f}>{f}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {Object.entries(mapping).filter(([, v]) => v).map(([field, col]) => (
                        <td key={field}>{row[col]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setStep('map')}>← Back</button>
              <button className="btn-primary" onClick={handleImport} disabled={importing}>
                {importing ? '...' : `Import ${csvRows.length} rows`}
              </button>
            </div>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && result && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.25rem', color: 'var(--success)' }}>
              Import Complete
            </div>
            <div style={{ color: 'var(--text2)', marginTop: '0.75rem', fontSize: '0.875rem' }}>
              ✓ {result.created} created · ✗ {result.skipped} skipped
            </div>
            {result.errors.length > 0 && (
              <div style={{ marginTop: '1rem', textAlign: 'left', background: 'var(--surface2)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--error)' }}>
                {result.errors.slice(0, 5).map((e: string, i: number) => <div key={i}>{e}</div>)}
              </div>
            )}
            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
