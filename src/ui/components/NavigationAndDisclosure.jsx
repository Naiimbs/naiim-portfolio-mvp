import React, { useState, useEffect } from 'react';

export function Tabs({
  tabs = [],
  activeKey,
  onChange,
  variant = 'pills',
  className = '',
}) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.key || '');
  const currentKey = activeKey !== undefined ? activeKey : internalActive;

  const handleTabClick = (key) => {
    if (activeKey === undefined) {
      setInternalActive(key);
    }
    if (onChange) onChange(key);
  };

  const navClass = variant === 'pills' ? 'nav nav-pills gap-1' : 'nav nav-tabs';

  return (
    <div className={`tabs-container ${className}`.trim()}>
      <ul className={navClass} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === currentKey;
          return (
            <li key={tab.key} className="nav-item" role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={tab.disabled}
                className={`nav-link rounded-pill px-3 py-1 fw-semibold small ${isActive ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.icon && <span className="me-1">{tab.icon}</span>}
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="tab-content pt-3">
        {tabs.map((tab) => (tab.key === currentKey ? <div key={tab.key} role="tabpanel">{tab.content}</div> : null))}
      </div>
    </div>
  );
}

export function Accordion({ items = [], allowMultiple = false, className = '' }) {
  const [openIndices, setOpenIndices] = useState([0]);

  const toggle = (idx) => {
    if (openIndices.includes(idx)) {
      if (allowMultiple) {
        setOpenIndices(openIndices.filter((i) => i !== idx));
      } else {
        setOpenIndices([]);
      }
    } else {
      if (allowMultiple) {
        setOpenIndices([...openIndices, idx]);
      } else {
        setOpenIndices([idx]);
      }
    }
  };

  return (
    <div className={`accordion ${className}`.trim()}>
      {items.map((item, idx) => {
        const isOpen = openIndices.includes(idx);
        return (
          <div key={idx} className="accordion-item border rounded-3 mb-2 overflow-hidden">
            <h2 className="accordion-header">
              <button
                type="button"
                className={`accordion-button fw-semibold py-3 px-4 ${isOpen ? '' : 'collapsed'}`}
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
              >
                {item.title}
              </button>
            </h2>
            {isOpen && (
              <div className="accordion-collapse show">
                <div className="accordion-body px-4 py-3 small text-secondary">
                  {item.content}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Modal({
  show = false,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    if (!show) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : size === 'xl' ? 'modal-xl' : '';

  return (
    <div
      className={`modal d-block bg-dark bg-opacity-50 ${className}`.trim()}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={`modal-dialog modal-dialog-centered ${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
          {title && (
            <div className="modal-header border-bottom px-4 py-3 bg-white">
              <h5 className="modal-title fw-bold font-heading">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
          )}
          <div className="modal-body p-4">{children}</div>
          {footer && <div className="modal-footer border-top px-4 py-3 bg-light">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
