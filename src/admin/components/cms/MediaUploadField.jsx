import React, { useRef, useState } from 'react';
import { uploadMedia } from '../../../services/media';

/**
 * Reusable image field: free-text URL + drag-free upload button.
 * On upload it stores the file in the `portfolio-media` bucket via uploadMedia
 * and sets the returned public URL.
 */
export default function MediaUploadField({ value = '', onChange, placeholder = 'https://… or upload an image', folder = 'blog', label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    const res = await uploadMedia(file, { folder });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    if (res.error) {
      setErr(res.error.message || 'Upload failed.');
      return;
    }
    const url = res.data?.public_url || res.data?.publicUrl || '';
    if (url) onChange(url);
    else setErr('Upload succeeded but no public URL was returned.');
  };

  return (
    <div>
      {label && <label className="form-label small fw-semibold">{label}</label>}
      <div className="input-group input-group-sm">
        <input
          type="text"
          className="form-control rounded-start-3"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="btn btn-outline-secondary" onClick={() => inputRef.current?.click()} disabled={uploading} title="Upload image">
          {uploading ? <span className="spinner-border spinner-border-sm" role="status" /> : <><i className="bi bi-upload me-1" />Upload</>}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="d-none" onChange={handleFile} />
      </div>
      {value && (
        <div className="mt-2">
          <img src={value} alt="" style={{ maxHeight: '80px' }} className="rounded border" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
      )}
      {err && <div className="small text-danger mt-1"><i className="bi bi-exclamation-triangle me-1" />{err}</div>}
    </div>
  );
}
