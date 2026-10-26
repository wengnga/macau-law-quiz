import React from 'react';

interface ProgressBarProps {
  /** 0..1, e.g. attempted ratio. */
  value: number;
  /** 0..1 drawn on top, e.g. mastered ratio. */
  highlight?: number;
}

const toPercent = (ratio: number): string => `${Math.min(Math.max(ratio, 0), 1) * 100}%`;

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, highlight }) => (
  <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
    <div className="progress-value" style={{ width: toPercent(value) }} />
    {highlight !== undefined ? <div className="progress-highlight" style={{ width: toPercent(highlight) }} /> : null}
  </div>
);
