import React, { useState, useEffect } from 'react';
import { getAdminMedia, uploadMedia } from '../../../services/media';
import { isSupabaseConfigured } from '../../../lib/supabase';

export default function MediaPickerModal({
  isOpen,
  onClose,
  onSelectMedia,
  multiple = false,
  selectedMediaIds = [],
}) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(multiple ? selectedMediaIds : []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelectedIds(multiple ? selectedMediaIds : []);
      setUploadError(null);
    }
  }, [isOpen]);

  async function loadMedia() {
    setLoading(true);
    const res = await getAdminMedia();
    setMediaList(res.data || []);
    setLoading(false);
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await uploadMedia(file, { folder: 'case-studies' });
      if (res.error) {
        setUploadError(res.error.message || 'Failed to upload media.');
        break;
      }
    }

    await loadMedia();
    setUploading(false);
  };

  const handleToggleSelect = (m) => {
    if (multiple) {
      if (selectedIds.includes(m.id)) {
        setSelectedIds(selectedIds.filter((id) => id !== m.id));
      } else {
        setSelectedIds([...selectedIds, m.id]);
      }
    } else {
      onSelectMedia(m);
      onClose();
    }
  };

  const handleConfirmMultiple = () => {
    const selectedObjects = mediaList.filter((m) => selectedIds.includes(m.id));
    onSelectMedia(selectedObjects);
    onClose();
  };

  const handleApplyManualUrl = () => {
    if (!manualUrl.trim()) return;
    onSelectMedia({
      id: `manual-${Date.now()}`,
      public_url: manualUrl.trim(),
      filename: manualUrl.split('/').pop() || 'external-asset',
      alt_text: 'Manual Image Asset',
      caption: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  const filteredMedia = mediaList.filter(
    (m) =>
      m.filename?.toLowerCase().includes(search.toLowerCase()) ||
      m.alt_text?.toLowerCase().includes(search.toLowerCase()) ||
      m.caption?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-box admin-modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <i className="bi bi-images me-2 text-success"></i> Select Media Asset
            </h3>
            <p className="text-muted small mb-0">
              {multiple ? 'Choose one or more assets for the gallery' : 'Choose an image from your library'}
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>

        {uploadError && (
          <div className="admin-alert admin-alert-error mb-3">
            <i className="bi bi-exclamation-circle-fill"></i>
            <div>{uploadError}</div>
          </div>
        )}

        {/* Toolbar: Search + Quick Upload */}
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
          <div className="input-group" style={{ maxWidth: '320px' }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="admin-form-input border-start-0"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="admin-btn admin-btn-primary py-1 px-3 mb-0" style={{ cursor: 'pointer' }}>
            <i className="bi bi-cloud-upload"></i> {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              accept="image/*"
              multiple={multiple}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading || !isSupabaseConfigured}
            />
          </label>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-success mb-2" role="status"></div>
            <div>Loading media library...</div>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="p-4 bg-light rounded-3 text-center border mb-3">
            <i className="bi bi-image fs-1 text-muted d-block mb-2"></i>
            <h5 className="fs-6 fw-bold mb-1">No media assets found</h5>
            <p className="text-muted small mb-3">
              Upload an image to your Supabase Storage or specify a direct URL below.
            </p>

            <div className="d-flex gap-2 max-w-md mx-auto" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="text"
                className="admin-form-input"
                placeholder="https://... or /assets/..."
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
              />
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleApplyManualUrl}>
                Use URL
              </button>
            </div>
          </div>
        ) : (
          <div
            className="row g-3 mb-3"
            style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}
          >
            {filteredMedia.map((m) => {
              const isSelected = selectedIds.includes(m.id);
              return (
                <div className="col-6 col-md-3" key={m.id}>
                  <div
                    className={`admin-media-picker-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleSelect(m)}
                    role="button"
                    tabIndex="0"
                  >
                    <div className="admin-media-thumb-wrap">
                      <img src={m.public_url} alt={m.alt_text || m.filename} loading="lazy" />
                      {isSelected && (
                        <div className="admin-media-check">
                          <i className="bi bi-check-circle-fill text-success fs-5"></i>
                        </div>
                      )}
                    </div>
                    <div className="admin-media-picker-meta">
                      <div className="admin-media-picker-name" title={m.filename}>
                        {m.filename}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {m.width && m.height ? `${m.width}×${m.height}` : 'Image'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fallback Manual URL Accordion */}
        <div className="pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">Direct URL:</span>
            <input
              type="text"
              className="admin-form-input py-1"
              style={{ width: '220px', fontSize: '0.8rem' }}
              placeholder="/assets/images/cover.png"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
            />
            <button
              type="button"
              className="admin-btn admin-btn-secondary py-1 px-2"
              onClick={handleApplyManualUrl}
              disabled={!manualUrl.trim()}
            >
              Use
            </button>
          </div>

          <div className="d-flex gap-2">
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            {multiple && (
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleConfirmMultiple}
                disabled={selectedIds.length === 0}
              >
                Insert Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
