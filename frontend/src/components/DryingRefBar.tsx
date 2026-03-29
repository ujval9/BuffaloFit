// components/DryingRefBar.tsx
// Bottom reference bar: Cotton: High/40-60m | Wool: Low/90m | Synthetics: Med/30-45m
import React from 'react';
import './DryingRefBar.css';

export default function DryingRefBar() {
  return (
    <div className="drying-ref-bar">
      <span className="drying-ref-bar__icon">🌡️</span>
      <span className="drying-ref-bar__label">DRYING REF</span>
      <span className="drying-ref-bar__divider" />
      <span className="drying-ref-bar__item">
        <strong>Cotton:</strong> High Heat / 40-60m
      </span>
      <span className="drying-ref-bar__divider" />
      <span className="drying-ref-bar__item">
        <strong>Wool:</strong> Low Heat / 90m
      </span>
      <span className="drying-ref-bar__divider" />
      <span className="drying-ref-bar__item">
        <strong>Synthetics:</strong> Med Heat / 30-45m
      </span>
      <span className="drying-ref-bar__spacer" />
      <span className="drying-ref-bar__live">🟢 Real-time sync active</span>
    </div>
  );
}
