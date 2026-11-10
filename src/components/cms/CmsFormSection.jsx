import React, { useMemo, useState } from 'react';
import { submitCmsForm } from '../../services/marketing';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fieldId(field, index) {
  return field.id || `cms-form-field-${index}`;
}

export default function CmsFormSection({ config = {} }) {
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const [values, setValues] = useState({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const variantLabel = useMemo(() => {
    const labels = {
      contact: 'Contact form',
      registration: 'Registration form',
      newsletter: 'Newsletter signup',
      resource_download: 'Resource download form',
      custom: 'Custom form',
    };
    return labels[config.variant] || labels.custom;
  }, [config.variant]);

  const updateValue = (id, value) => {
    setValues((current) => ({ ...current, [id]: value }));
    if (status !== 'idle') {
      setStatus('idle');
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const missing = fields.find((field, index) => field.required && !String(values[fieldId(field, index)] || '').trim());
    if (missing) {
      setError(config.validationMessage || 'Please complete the required fields.');
      return;
    }

    const emailField = fields.find((field) => field.type === 'email');
    if (emailField && values[emailField.id] && !EMAIL_PATTERN.test(String(values[emailField.id]).trim())) {
      setError(config.emailValidationMessage || 'Please enter a valid email address.');
      return;
    }

    if (config.isNonSubmittingPreview || config.submissionMode === 'preview') {
      setStatus('success');
      return;
    }

    setStatus('submitting');
    try {
      await submitCmsForm({
        formId: config.formId || config.id || 'cms-form',
        formTitle: config.title || 'CMS Form',
        variant: config.variant || 'custom',
        values,
        marketingConsent: Boolean(config.marketingConsent),
      });
      if (config.variant === 'resource_download' && config.downloadUrl) {
        const link = document.createElement('a');
        link.href = config.downloadUrl;
        link.download = config.downloadName || '';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setStatus('success');
    } catch (submitError) {
      setStatus('error');
      setError(submitError.message || config.errorMessage || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <section className="cms-section cms-section-form py-5">
        <div className="container max-w-xl mx-auto">
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white text-center">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-3" style={{ width: 52, height: 52 }}>
              <i className="bi bi-check-lg fs-4" />
            </div>
            <h3 className="fw-bold font-heading mb-2">{config.successTitle || 'Thank you.'}</h3>
            <p className="text-muted small mb-0">{config.successMessage || 'Your submission has been received.'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cms-section cms-section-form py-5">
      <div className="container max-w-xl mx-auto">
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
          <div className="text-center mb-4">
            {config.eyebrow && <div className="text-uppercase tracking-wider text-primary fw-semibold small mb-2">{config.eyebrow}</div>}
            <h3 className="fw-bold font-heading mb-1">{config.title || 'Get in Touch'}</h3>
            {config.description && <p className="text-muted small mb-0">{config.description}</p>}
          </div>

          {config.showVariantBadge !== false && (
            <div className="alert alert-light border small text-muted text-center py-2 mb-4 rounded-3">
              <i className="bi bi-ui-checks me-1 text-primary" /> {variantLabel}
            </div>
          )}

          {error && <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {fields.map((field, index) => {
              const id = fieldId(field, index);
              const commonProps = {
                id,
                name: id,
                required: Boolean(field.required),
                value: values[id] || '',
                placeholder: field.placeholder || '',
                className: 'form-control rounded-3',
                onChange: (event) => updateValue(id, event.target.value),
              };
              return (
                <div key={id} className="mb-3">
                  <label className="form-label small fw-semibold" htmlFor={id}>
                    {field.label || 'Field'} {field.required && <span className="text-danger">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea {...commonProps} rows={field.rows || 4} />
                  ) : field.type === 'select' ? (
                    <select {...commonProps}>
                      <option value="">{field.placeholder || 'Choose an option'}</option>
                      {(field.options || []).map((option) => (
                        <option key={option.value || option} value={option.value || option}>{option.label || option}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div className="form-check">
                      <input {...commonProps} type="checkbox" checked={Boolean(values[id])} onChange={(event) => updateValue(id, event.target.checked)} className="form-check-input" />
                      <span className="form-check-label small text-muted">{field.helpText || field.label}</span>
                    </div>
                  ) : (
                    <input {...commonProps} type={field.type || 'text'} />
                  )}
                  {field.helpText && field.type !== 'checkbox' && <div className="form-text small">{field.helpText}</div>}
                </div>
              );
            })}
            <button type="submit" disabled={status === 'submitting'} className="btn btn-primary rounded-pill w-100 py-2 fw-semibold mt-2 shadow-sm">
              {status === 'submitting' ? <><span className="spinner-border spinner-border-sm me-2" role="status" />{config.submittingLabel || 'Sending…'}</> : (config.submitLabel || 'Send Message')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
