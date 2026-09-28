import React, { useState, useEffect } from 'react';
import { getAdminMedia } from '../../services/media';
import { isSupabaseConfigured } from '../../lib/supabase';
import AdminEmptyState from '../components/AdminEmptyState';

export default function AdminMedia() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMedia() {
      setLoading(true);
      const res = await getAdminMedia();
      setMediaList(res.data || []);
      setLoading(false);
    }
    loadMedia();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fs-4 text-white mb-1">Media Library</h2>
          <p className="text-muted small mb-0">Assets stored in Supabase Storage (<code>portfolio-media</code>).</p>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert admin-alert-warning mb-4">
          <i className="bi bi-info-circle-fill"></i>
          <div>
            <strong>Storage Offline:</strong> Connect Supabase to sync remote media bucket objects and upload new assets.
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-card text-center py-5 text-muted">
          <div className="spinner-border text-success mb-3" role="status"></div>
          <div>Loading media assets...</div>
        </div>
      ) : mediaList.length === 0 ? (
        <AdminEmptyState
          icon="bi-images"
          title="No uploaded media yet"
          description="Media uploaded to the 'portfolio-media' Supabase storage bucket will be indexed here in Phase 13."
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Filename</th>
                <th>MIME Type</th>
                <th>Dimensions</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {mediaList.map((m) => (
                <tr key={m.id}>
                  <td style={{ width: '80px' }}>
                    <img
                      src={m.public_url}
                      alt={m.alt_text || m.filename}
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                    />
                  </td>
                  <td>
                    <strong className="text-white">{m.filename}</strong>
                    {m.storage_path && (
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        {m.storage_path}
                      </div>
                    )}
                  </td>
                  <td><code>{m.mime_type || 'image/png'}</code></td>
                  <td>{m.width && m.height ? `${m.width} × ${m.height}` : '—'}</td>
                  <td className="text-muted small">{m.created_at ? m.created_at.split('T')[0] : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
