// components/ReadinessCard.tsx
// The "Ready for Class?" hero banner — green = ready, red = not ready
import React from 'react';
import './ReadinessCard.css';

interface Props {
  isReady: boolean | null;   // null = not checked yet
  message: string;
  leaveAt?: string;
}

export default function ReadinessCard({ isReady, message, leaveAt }: Props) {
  if (isReady === null) {
    return (
      <div className="readiness-card readiness-card--idle card">
        <div className="readiness-card__content">
          <h2 className="readiness-card__title">Ready for Class?</h2>
          <p className="readiness-card__msg">
            Select clothes from your closet/washer below and pick a class to check outfit readiness.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`readiness-card card ${isReady ? 'readiness-card--ready' : 'readiness-card--not-ready'}`}>
      <div className="readiness-card__content">
        <h2 className="readiness-card__title">Ready for Class?</h2>
        <p className="readiness-card__msg">"{message}"</p>
        {leaveAt && (
          <p className="readiness-card__leave">
            🚶 Leave by: <strong>{new Date(leaveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          </p>
        )}
      </div>
      <div className={`readiness-card__badge ${isReady ? 'readiness-card__badge--green' : 'readiness-card__badge--red'}`}>
        {isReady ? '✓ STATUS: READY TO GO!' : '✗ NOT READY'}
      </div>
    </div>
  );
}
