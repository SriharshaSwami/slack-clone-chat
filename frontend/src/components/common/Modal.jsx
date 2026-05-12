import React from 'react';
import './Modal.css';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && <div className="modal-title">{title}</div>}
        <div className="modal-body">{children}</div>
        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
