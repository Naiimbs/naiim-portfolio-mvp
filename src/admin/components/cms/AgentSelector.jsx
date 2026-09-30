import React, { useState, useEffect } from 'react';
import { getAdminAgents } from '../../../services/agents';

export default function AgentSelector({ selectedIds = [], onChange }) {
  const [allAgents, setAllAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    setLoading(true);
    const res = await getAdminAgents();
    setAllAgents(res.data || []);
    setLoading(false);
  }

  const selectedAgents = selectedIds
    .map((id) => allAgents.find((a) => String(a.id) === String(id)))
    .filter(Boolean);

  const availableAgents = allAgents.filter((a) => {
    const isSelected = selectedIds.some((id) => String(id) === String(a.id));
    const matchesSearch = (a.name || '').toLowerCase().includes(search.toLowerCase()) || (a.role || '').toLowerCase().includes(search.toLowerCase());
    return !isSelected && matchesSearch;
  });

  const handleAddAgent = (id) => {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
  };

  const handleRemoveAgent = (id) => {
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
    <div className="agent-selector-component border rounded-3 p-3 bg-light">
      <h6 className="fw-bold mb-2 small text-uppercase tracking-wider">Selected AI Agents ({selectedAgents.length})</h6>

      {/* Selected Agents List */}
      {selectedAgents.length > 0 ? (
        <div className="list-group list-group-flush border rounded-3 mb-3 bg-white">
          {selectedAgents.map((ag, idx) => (
            <div key={ag.id} className="list-group-item p-2 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center text-truncate me-2">
                <span className="badge bg-secondary me-2">{idx + 1}</span>
                <span className="fw-semibold text-truncate small">{ag.name}</span>
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
                  disabled={idx === selectedAgents.length - 1}
                  onClick={() => handleMove(idx, 1)}
                >
                  <i className="bi bi-chevron-down"></i>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger rounded-circle p-0 ms-1 d-flex align-items-center justify-content-center"
                  style={{ width: '22px', height: '22px' }}
                  onClick={() => handleRemoveAgent(ag.id)}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted small fst-italic mb-3">No AI agents selected. Add agents from below.</p>
      )}

      {/* Add Agents Picker */}
      <h6 className="fw-bold mb-2 small text-uppercase tracking-wider">Add AI Agents</h6>
      <input
        type="text"
        className="form-control form-control-sm rounded-3 mb-2"
        placeholder="Filter available agents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <small className="text-muted">Loading agents...</small>
      ) : availableAgents.length > 0 ? (
        <div className="list-group list-group-flush border rounded-3 bg-white max-vh-25 overflow-auto" style={{ maxHeight: '160px' }}>
          {availableAgents.map((a) => (
            <button
              key={a.id}
              type="button"
              className="list-group-item list-group-item-action p-2 d-flex align-items-center justify-content-between text-start"
              onClick={() => handleAddAgent(a.id)}
            >
              <span className="small text-truncate me-2">{a.name}</span>
              <i className="bi bi-plus-circle text-primary"></i>
            </button>
          ))}
        </div>
      ) : (
        <small className="text-muted fst-italic">All agents selected or no match found.</small>
      )}
    </div>
  );
}
