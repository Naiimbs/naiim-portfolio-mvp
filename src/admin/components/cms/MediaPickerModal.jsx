import React, { useState, useEffect } from 'react';
import { getAdminMedia } from '../../../services/media';

export default function MediaPickerModal({ show, onClose, onSelectMedia, selectedMediaId }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (show) {
      loadMedia();
    }
  }, [show]);

  async function loadMedia() {
    setLoading(true);
    const res = await getAdminMedia();
    setMediaList(res.data || []);
    setLoading(false);
  }

  if (!show) return null;

  const filteredMedia = mediaList.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (m.filename || '').toLowerCase().includes(q) || (m.alt_text || '').toLowerCase().includes(q);
  });

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1" style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content rounded-4 border-0 shadow">
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title fw-bold">Select Media Asset</h5>
              <p className="text-muted small mb-0">Choose an image from your Media CMS library.</p>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body py-3">
            <div className="mb-3">
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Search media files by name or alt text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading media...</span>
                </div>
              </div>
            ) : filteredMedia.length > 0 ? (
              <div className="row g-3">
                {filteredMedia.map((media) => {
                  const isSelected = String(media.id) === String(selectedMediaId);
                  return (
                    <div key={media.id} className="col-6 col-md-4 col-lg-3">
                      <div
                        className={`card h-100 border-2 rounded-3 overflow-hidden cursor-pointer position-relative ${
                          isSelected ? 'border-primary shadow-sm' : 'border-light'
                        }`}
                        onClick={() => {
                          onSelectMedia(media);
                          onClose();
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div
                          className="ratio ratio-4x3 bg-light d-flex align-items-center justify-content-center"
                          style={{ backgroundImage: `url(${media.public_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                          {!media.public_url && <i className="bi bi-image text-muted fs-3"></i>}
                        </div>
                        <div className="card-body p-2 text-truncate">
                          <small className="fw-semibold d-block text-truncate" title={media.filename}>
                            {media.filename}
                          </small>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {media.mime_type?.split('/')[1]?.toUpperCase() || 'IMAGE'}
                          </small>
                        </div>
                        {isSelected && (
                          <span className="position-absolute top-0 end-0 m-1 bg-primary text-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                            <i className="bi bi-check small"></i>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-images display-6 mb-2 d-block"></i>
                No media assets found in library. Upload images in the Media Manager.
              </div>
            )}
          </div>

          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light rounded-pill" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
