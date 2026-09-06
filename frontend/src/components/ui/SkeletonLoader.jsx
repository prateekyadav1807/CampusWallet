import React from 'react';

/* Single skeleton block */
export function Sk({ h = 4, w = 'full', rounded = 'md', className = '' }) {
  return (
    <div
      className={`skeleton w-${w} ${className}`}
      style={{ height: h * 4, borderRadius: rounded === 'full' ? 999 : rounded === 'lg' ? 8 : rounded === 'xl' ? 12 : 6 }}
    />
  );
}

/* Card skeleton */
export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton rounded" style={{ height: 12, width: 80 }} />
          <div className="skeleton rounded" style={{ height: 28, width: 110 }} />
        </div>
        <div className="skeleton rounded-lg" style={{ width: 36, height: 36 }} />
      </div>
      <div className="skeleton rounded" style={{ height: 36, width: '100%' }} />
      <div className="skeleton rounded" style={{ height: 12, width: 90 }} />
    </div>
  );
}

/* List rows skeleton */
export function SkeletonList({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <div className="skeleton rounded-lg flex-shrink-0" style={{ width: 36, height: 36 }} />
          <div className="flex-1 space-y-2">
            <div className="skeleton rounded" style={{ height: 13, width: '35%' }} />
            <div className="skeleton rounded" style={{ height: 11, width: '55%' }} />
          </div>
          <div className="skeleton rounded" style={{ height: 14, width: 64 }} />
        </div>
      ))}
    </div>
  );
}

/* Table rows skeleton */
export function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
      {[60, 130, 90, 80, 70].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="skeleton rounded" style={{ height: 13, width: w }} />
        </td>
      ))}
    </tr>
  );
}

export default SkeletonCard;
