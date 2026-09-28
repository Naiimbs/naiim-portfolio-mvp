import React, { useState, useEffect } from 'react';
import { getAdminMedia, uploadMedia, updateMedia, deleteMedia } from '../../services/media';
import { isSupabaseConfigured } from '../../lib/supabase';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminMedia() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [search, setSearch] = useState('');

  // Selected asset for details/edit modal
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    setLoading(true);
    const res = await getAdminMedia();
    setMediaList(res.data || []);
    setLoading(false);
  }

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setSuccessMsg('');

    let uploadedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await uploadMedia(file, { folder: 'case-studies' });
      if (res.error) {
        setUploadError(res.error.message || `Failed to upload ${file.name}`);
        break;
      } else {
        uploadedCount++;
      }
    }

    if (uploadedCount > 0) {
      setSuccessMsg(`Successfully uploaded ${uploadedCount} asset(s).`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }

    await loadMedia();
    setUploading(false);
  };

  const handleOpenEdit = (m) => {
    setSelectedMedia(m);
    setEditAlt(m.alt_text || '');
    setEditCaption(m.caption || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedMedia) return;
    setSavingEdit(true);

    const res = await updateMedia(selectedMedia.id, {
      alt_text: editAlt,
      caption: editCaption,
    });

    if (res.error) {
      alert(`Error updating metadata: ${res.error.message}`);
    } else {
      setSelectedMedia(null);
      await loadMedia();
    }
    setSavingEdit(false);
  };

  const handleDelete = async (m) => {
    if (window.confirm(`Are you sure you want to delete "${m.filename}"?`)) {
      const res = await deleteMedia(m.id, m.storage_path);
      if (res.error) {
        alert(res.error.message || 'Failed to delete media asset.');
      } else {
        if (selectedMedia?.id === m.id) setSelectedMedia(null);
        await loadMedia();
      }
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    alert('Public URL copied to clipboard!');
  };

  const filtered = mediaList.filter(
    (m) =>
      m.filename?.toLowerCase().includes(search.toLowerCase()) ||
      m.alt_text?.toLowerCase().includes(search.toLowerCase()) ||
      m.caption?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header & Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fs-4 fw-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Media Library
          </h2>
          <p className="text-muted small mb-0">
            Assets stored in Supabase Storage bucket <code>portfolio-media</code>.
          </p>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <div className="btn-group me-2" role="group">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <i className="bi bi-grid-3x3-gap-fill"></i>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <i className="bi bi-list-ul"></i>
            </button>
          </div>

          <label className="admin-btn admin-btn-primary mb-0" style={{ cursor: 'pointer' }}>
            <i className="bi bi-cloud-upload"></i> {uploading ? 'Uploading...' : 'Upload Media'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              style={{ display: 'none' }}
              disabled={uploading || !isSupabaseConfigured}
            />
          </label>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert admin-alert-warning mb-4">
          <i className="bi bi-info-circle-fill"></i>
          <div>
            <strong>Storage Offline:</strong> Connect Supabase in <code>.env</code> to enable live image uploads and bucket synchronization.
          </div>
        </div>
      )}

      {uploadError && (
        <div className="admin-alert admin-alert-error mb-4">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{uploadError}</div>
        </div>
      )}

      {successMsg && (
        <div className="admin-alert admin-alert-success mb-4">
          <i className="bi bi-check-circle-fill"></i>
          <div>{successMsg}</div>
        </div>
      )}

      {/* Filter / Search bar */}
      <div className="admin-card p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="input-group" style={{ maxWidth: '360px' }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="admin-form-input border-start-0"
              placeholder="Search by filename or caption..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="text-muted small">
            Showing <strong>{filtered.length}</strong> of {mediaList.length} assets
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-card text-center py-5 text-muted">
          <div className="spinner-border text-success mb-3" role="status"></div>
          <div>Loading media assets...</div>
        </div>
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon="bi-images"
          title="No uploaded media found"
          description="Upload your first case study screenshot or project banner above."
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="row g-3">
          {filtered.map((m) => (
            <div className="col-6 col-md-4 col-lg-3" key={m.id}>
              <div className="admin-media-card">
                <div
                  className="admin-media-img-container"
                  onClick={() => handleOpenEdit(m)}
                  role="button"
                  tabIndex="0"
                >
                  <img src={m.public_url} alt={m.alt_text || m.filename} loading="lazy" />
                  <div className="admin-media-overlay">
                    <span className="btn btn-sm btn-light py-1 px-2">
                      <i className="bi bi-pencil me-1"></i> Edit
                    </span>
                  </div>
                </div>
                <div className="admin-media-body">
                  <div className="admin-media-title" title={m.filename}>
                    {m.filename}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 text-muted small" style={{ fontSize: '0.72rem' }}>
                    <span>{m.width && m.height ? `${m.width}×${m.height}` : 'Asset'}</span>
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-muted"
                        onClick={() => copyToClipboard(m.public_url)}
                        title="Copy Public URL"
                      >
                        <i className="bi bi-link-45deg fs-6"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 text-danger"
                        onClick={() => handleDelete(m)}
                        title="Delete Media"
                      >
                        <i className="bi bi-trash fs-6"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Filename</th>
                <th>MIME Type</th>
                <th>Dimensions</th>
                <th>Alt Text</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ width: '80px' }}>
                    <img
                      src={m.public_url}
                      alt={m.alt_text || m.filename}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                      onClick={() => handleOpenEdit(m)}
                    />
                  </td>
                  <td>
                    <strong>{m.filename}</strong>
                    {m.storage_path && (
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {m.storage_path}
                      </div>
                    )}
                  </td>
                  <td><code>{m.mime_type || 'image/png'}</code></td>
                  <td>{m.width && m.height ? `${m.width} × ${m.height}` : '—'}</td>
                  <td className="text-muted small" style={{ maxWidth: '180px' }}>{m.alt_text || '—'}</td>
                  <td className="text-muted small">{m.created_at ? m.created_at.split('T')[0] : '—'}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary py-1 px-2"
                        onClick={() => handleOpenEdit(m)}
                        title="Edit Metadata"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary py-1 px-2 text-muted"
                        onClick={() => copyToClipboard(m.public_url)}
                        title="Copy Public URL"
                      >
                        <i className="bi bi-link-45deg"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-1 px-2"
                        onClick={() => handleDelete(m)}
                        title="Delete Media"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Media Modal */}
      {selectedMedia && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedMedia(null)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fs-5 fw-bold mb-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <i className="bi bi-image me-2 text-success"></i> Media Details
              </h3>
              <button type="button" className="btn-close" onClick={() => setSelectedMedia(null)} aria-label="Close"></button>
            </div>

            <div className="text-center mb-3 p-2 bg-light rounded border">
              <img
                src={selectedMedia.public_url}
                alt={selectedMedia.filename}
                style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            <div className="row g-2 mb-3 text-muted small">
              <div className="col-6"><strong>Filename:</strong> {selectedMedia.filename}</div>
              <div className="col-6"><strong>Dimensions:</strong> {selectedMedia.width && selectedMedia.height ? `${selectedMedia.width}×${selectedMedia.height}` : '—'}</div>
              <div className="col-6"><strong>MIME Type:</strong> {selectedMedia.mime_type}</div>
              <div className="col-6"><strong>Size:</strong> {selectedMedia.size_bytes ? `${(selectedMedia.size_bytes / 1024).toFixed(1)} KB` : '—'}</div>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="admin-form-group">
                <label className="admin-form-label">Alt Text (Accessibility)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="Describe image content for accessibility"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Caption / Description</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Image caption displayed below the figure"
                />
              </div>

              <div className="admin-form-group mb-4">
                <label className="admin-form-label">Public CDN URL</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="admin-form-input"
                    value={selectedMedia.public_url}
                    readOnly
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => copyToClipboard(selectedMedia.public_url)}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDelete(selectedMedia)}
                >
                  <i className="bi bi-trash me-1"></i> Delete Asset
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setSelectedMedia(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={savingEdit}
                  >
                    {savingEdit ? 'Saving...' : 'Save Metadata'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
