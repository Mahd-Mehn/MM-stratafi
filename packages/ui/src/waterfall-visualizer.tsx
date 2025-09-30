import React from 'react';

export interface WaterfallVisualizerProps { seniorPaid: number; seniorTarget: number; mezzPaid: number; mezzTarget: number; juniorPaid: number; }
export function WaterfallVisualizer({ seniorPaid, seniorTarget, mezzPaid, mezzTarget, juniorPaid }: WaterfallVisualizerProps): JSX.Element {
  const seniorPct = seniorTarget ? Math.min(100, (seniorPaid / seniorTarget) * 100) : 0;
  const mezzPct = mezzTarget ? Math.min(100, (mezzPaid / mezzTarget) * 100) : 0;
  return (
    <div style={{ border: '1px solid #333', padding: 12 }}>
      <h4>Payment Waterfall</h4>
      <div>Senior: {seniorPaid}/{seniorTarget} ({seniorPct.toFixed(1)}%)</div>
      <div>Mezzanine: {mezzPaid}/{mezzTarget} ({mezzPct.toFixed(1)}%)</div>
      <div>Junior Residual: {juniorPaid}</div>
    </div>
  );
}
