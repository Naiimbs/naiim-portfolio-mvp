import React, { useState, useEffect } from 'react';
import { getAdminProjects } from '../../../services/projects';

export default function ProjectSelector({ selectedIds = [], onChange }) {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    const res = await getAdminProjects();
    setAllProjects(res.data || []);
    setLoading(false);
  }

  const selectedProjects = selectedIds
    .map((id) => allProjects.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  const availableProjects = allProjects.filter((p) => {
    const isSelected = selectedIds.some((id) => String(id) === String(p.id));
    const matchesSearch = (p.title || '').toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase());
    return !isSelected && matchesSearch;
  });

  const handleAddProject = (id) => {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
  };

  const handleRemoveProject = (id) => {
    onChange(selectedIds.filter((item) => String(item) !== String(id)));
  };

  const handleMove = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= selectedIds.length) return;
    const next = [...selectedIds];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onChange(next);
  };

  return (
    <div className="project-selector-component border rounded-3 p-3 bg-light">
      <h6 className="fw-bold mb-2 small text-uppercase tracking-wider">Selected Projects ({selectedProjects.length})</h6>

      {/* Selected Projects List */}
      {selectedProjects.length > 0 ? (
        <div className="list-group list-group-flush border rounded-3 mb-3 bg-white">
          {selectedProjects.map((proj, idx) => (
            <div key={proj.id} className="list-group-item p-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center text-truncate me-2">
                <span className="badge bg-secondary me-2">{idx + 1}</span>
                <span className="fw-semibold text-truncate small">{proj.title}</span>
              </div>
              <div className="d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-sm btn-link text-dark p-0 px-1"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, -1)}
                >
                  <i className="bi bi-chevron-up"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-dark p-0 px-1"
                  disabled={idx === selectedProjects.length - 1}
                  onClick={() => handleMove(idx, 1)}
                >
                  <i className="bi bi-chevron-down"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger rounded-circle p-0 ms-1 d-flex align-items-center justify-content-center"
                  style={{ width: '22px', height: '22px' }}
                  onClick={() => handleRemoveProject(proj.id)}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted small fst-italic mb-3">No projects selected. Add projects from below.</p>
      )}

      {/* Add Projects Picker */}
      <h6 className="fw-bold mb-2 small text-uppercase tracking-wider">Add Projects</h6>
      <input
        type="text"
        className="form-control form-control-sm rounded-3 mb-2"
        placeholder="Filter available projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <small className="text-muted">Loading projects...</small>
      ) : availableProjects.length > 0 ? (
        <div className="list-group list-group-flush border rounded-3 bg-white max-vh-25 overflow-auto" style={{ maxHeight: '160px' }}>
          {availableProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              className="list-group-item list-group-item-action p-2 d-flex align-items-center justify-content-between text-start"
              onClick={() => handleAddProject(p.id)}
            >
              <span className="small text-truncate me-2">{p.title}</span>
              <i className="bi bi-plus-circle text-primary"></i>
            </button>
          ))}
        </div>
      ) : (
        <small className="text-muted fst-italic">All projects selected or no match found.</small>
      )}
    </div>
  );
}
