import React from 'react';

export function HealthScoreGauge({ score }: { score: number }): JSX.Element {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct > 70 ? '#16a34a' : pct > 40 ? '#f59e0b' : '#dc2626';
  return (
    <div style={{ width: 120 }}>
      <div style={{ fontSize: 12, color: '#555' }}>Health Score</div>
      <div style={{ background: '#eee', height: 10, borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', background: color, height: '100%' }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{pct}</div>
    </div>
  );
}
