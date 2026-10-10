import React from 'react';

export function FormField({
  label,
  error = null,
  hint = null,
  required = false,
  children,
  className = 'mb-3',
  id,
}) {
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="form-label small fw-semibold d-flex align-items-center gap-1">
          {label}
          {required && <span className="text-danger" title="Required">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="form-text small text-muted mt-1">{hint}</div>}
      {error && <div className="invalid-feedback d-block small mt-1">{error}</div>}
    </div>
  );
}

export function Input({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  error = false,
  className = '',
  size = 'md',
  id,
  name,
  ...props
}) {
  const sizeClass = size === 'sm' ? 'form-control-sm' : size === 'lg' ? 'form-control-lg' : '';
  const errorClass = error ? 'is-invalid' : '';

  return (
    <input
      type={type}
      id={id}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`form-control rounded-3 ${sizeClass} ${errorClass} ${className}`.trim()}
      {...props}
    />
  );
}

export function Textarea({
  value,
  onChange,
  rows = 3,
  placeholder = '',
  disabled = false,
  error = false,
  className = '',
  id,
  name,
  ...props
}) {
  const errorClass = error ? 'is-invalid' : '';

  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`form-control rounded-3 ${errorClass} ${className}`.trim()}
      {...props}
    />
  );
}

export function Select({
  options = [],
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option...',
  className = '',
  size = 'md',
  id,
  name,
  ...props
}) {
  const sizeClass = size === 'sm' ? 'form-select-sm' : size === 'lg' ? 'form-select-lg' : '';

  return (
    <select
      id={id}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
      className={`form-select rounded-3 ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map((opt) => {
        const val = typeof opt === 'object' ? opt.value : opt;
        const lbl = typeof opt === 'object' ? opt.label : opt;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
}

export function Checkbox({
  checked = false,
  onChange,
  label,
  id,
  name,
  disabled = false,
  className = 'mb-2',
  ...props
}) {
  return (
    <div className={`form-check ${className}`.trim()}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        className="form-check-input"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="form-check-label small">
          {label}
        </label>
      )}
    </div>
  );
}

export function Radio({
  checked = false,
  onChange,
  label,
  id,
  name,
  value,
  disabled = false,
  className = 'mb-2',
  ...props
}) {
  return (
    <div className={`form-check ${className}`.trim()}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={Boolean(checked)}
        onChange={onChange}
        disabled={disabled}
        className="form-check-input"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="form-check-label small">
          {label}
        </label>
      )}
    </div>
  );
}
