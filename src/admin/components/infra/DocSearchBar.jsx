import React, { useState } from 'react';

/**
 * DocSearchBar — lightweight client-side documentation search.
 * No API calls. No database. Filters categories by matching query string.
 */
export default function DocSearchBar({ onSearch, placeholder = 'Search documentation...' }) {
  const [value, setValue] = useState('');

  const handleChange = (e) => {
    const query = e.target.value;
    setValue(query);
    onSearch(query);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div style={{ position: 'relative', maxWidth: '480px' }}>
      <i
        className="bi bi-search"
        style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#718187',
          fontSize: '0.9rem',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 36px 9px 36px',
          border: '1.5px solid #dfe7e4',
          borderRadius: '8px',
          fontSize: '0.88rem',
          color: '#10242a',
          background: '#ffffff',
          outline: 'none',
          fontFamily: 'DM Sans, sans-serif',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#087f66')}
        onBlur={(e) => (e.target.style.borderColor = '#dfe7e4')}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#718187',
            cursor: 'pointer',
            padding: '2px',
            fontSize: '0.9rem',
            lineHeight: 1,
          }}
        >
          <i className="bi bi-x-lg" />
        </button>
      )}
    </div>
  );
}
