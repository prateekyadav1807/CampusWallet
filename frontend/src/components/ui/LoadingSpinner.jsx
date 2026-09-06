import React from 'react';

const SZ = {
  sm: { w: 14, b: 2 },
  md: { w: 22, b: 2 },
  lg: { w: 36, b: 3 },
  xl: { w: 48, b: 3 },
};

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const { w, b } = SZ[size] ?? SZ.md;
  return (
    <span
      className={`inline-block rounded-full animate-spin flex-shrink-0 ${className}`}
      style={{
        width: w, height: w,
        border: `${b}px solid rgba(255,255,255,0.08)`,
        borderTopColor: 'var(--color-accent)',
      }}
    />
  );
}
