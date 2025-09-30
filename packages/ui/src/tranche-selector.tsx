import React from 'react';

export interface TrancheSelectorProps { value: string; onChange: (v: string) => void }
export function TrancheSelector({ value, onChange }: TrancheSelectorProps): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {['Senior', 'Mezzanine', 'Junior'].map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            background: value === t ? '#2563eb' : '#eee',
            padding: '4px 10px',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
