import React from 'react';
import { motion } from 'framer-motion';

export default function EmptyState({ emoji, title, description, action }) {
  return (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {emoji && (
        <span className="text-4xl mb-3 block opacity-50 select-none">{emoji}</span>
      )}
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </p>
      {description && (
        <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
