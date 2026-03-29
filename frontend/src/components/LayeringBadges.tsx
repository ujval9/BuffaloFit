// components/LayeringBadges.tsx
// Shows the BASE / MID / OUTER layer chips from the weather recommendation
import React from 'react';
import { LayeringData } from '../types';
import './LayeringBadges.css';

interface Props {
  layering: LayeringData | null;
}

export default function LayeringBadges({ layering }: Props) {
  if (!layering || (!layering.base && !layering.mid && !layering.outer)) {
    return (
      <div className="layering-section card">
        <div className="layering-header">
          <span className="layering-icon">🧥</span>
          <span className="layering-title">RECOMMENDED LAYERING</span>
        </div>
        <div style={{ padding: '20px', fontSize: 13, color: 'var(--text-muted)' }}>
          Check your outfit readiness to see layering suggestions for your commute time.
        </div>
      </div>
    );
  }

  return (
    <div className="layering-section card">
      <div className="layering-header">
        <span className="layering-icon">🧥</span>
        <span className="layering-title">RECOMMENDED LAYERING</span>
      </div>
      <div className="layering-chips">
        {layering.base && (
          <div className="layer-chip layer-chip--base">
            <span className="layer-chip__label">BASE</span>
            <span className="layer-chip__value">{layering.base}</span>
          </div>
        )}
        {layering.mid && (
          <div className="layer-chip layer-chip--mid">
            <span className="layer-chip__label">MID</span>
            <span className="layer-chip__value">{layering.mid}</span>
          </div>
        )}
        {layering.outer && (
          <div className="layer-chip layer-chip--outer">
            <span className="layer-chip__label">OUTER</span>
            <span className="layer-chip__value">{layering.outer}</span>
          </div>
        )}
      </div>
      {layering.note && (
        <p className="layering-note">⚠️ {layering.note}</p>
      )}
    </div>
  );
}
