import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen, onConfirm, onCancel,
  title, message,
  confirmLabel = 'Delete', confirmClass = 'btn-danger',
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-full max-w-sm rounded-xl"
            style={{
              background: 'var(--color-card)',
              border:     '1px solid var(--color-border-strong)',
              boxShadow:  'var(--shadow-modal)',
            }}
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1,    opacity: 1, y: 0 }}
            exit={{    scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="p-6 text-center">
              <div
                className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--color-danger-muted)' }}
              >
                <AlertTriangle size={20} strokeWidth={1.75} style={{ color: 'var(--color-danger)' }} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5"
                style={{ color: 'var(--color-text)' }}>
                {title ?? 'Are you sure?'}
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {message ?? 'This action cannot be undone.'}
              </p>
              <div className="flex gap-2">
                <button onClick={onCancel}  className="btn-secondary flex-1">{confirmLabel === 'Delete' ? 'Cancel' : 'No'}</button>
                <button onClick={onConfirm} className={`${confirmClass} flex-1`}>{confirmLabel}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
