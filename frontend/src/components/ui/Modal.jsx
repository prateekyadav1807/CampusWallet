import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
        >
          <motion.div
            className={`w-full ${SIZES[size]} max-h-[88vh] overflow-y-auto rounded-xl`}
            style={{
              background:  'var(--color-card)',
              border:      '1px solid var(--color-border-strong)',
              boxShadow:   'var(--shadow-modal)',
            }}
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{    opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {title}
              </h2>
              <button onClick={onClose} className="btn-icon" style={{ width: 28, height: 28 }}>
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="px-5 py-4 flex items-center justify-end gap-2"
                style={{ borderTop: '1px solid var(--color-border)' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
