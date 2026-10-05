import React, { useState, useEffect } from 'react';
import {
  getAdminNavigationItems,
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
  seedDefaultNavigation,
} from '../../services/siteCms';

export default function AdminNavigation() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('header'); // 'header' | 'footer' | 'all'
  const [feedback, setFeedback] = useState(null);

  // Form state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [location, setLocation] = useState('header');
  const [sortOrder, setSortOrder] = useState(0);
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    const res = await getAdminNavigationItems();
    setItems(res.data || []);
    setLoading(false);
  }

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setLabel('');
    setHref('');
    setLocation(selectedLocation === 'all' ? 'header' : selectedLocation);
    const relevantItems = items.filter((i) => i.location === (selectedLocation === 'all' ? 'header' : selectedLocation));
    setSortOrder((relevantItems.length + 1) * 10);
    setOpenInNewTab(false);
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setLabel(item.label || '');
    setHref(item.href || '');
    setLocation(item.location || 'header');
    setSortOrder(item.sort_order || 0);
    setOpenInNewTab(Boolean(item.open_in_new_tab));
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSubmitting(true);
    setFeedback(null);

    const payload = {
      label: label.trim(),
      href: href.trim() || '#',
      location,
      sort_order: Number(sortOrder) || 0,
      open_in_new_tab: openInNewTab,
    };

    let res;
    if (editingItem) {
      res = await updateNavigationItem(editingItem.id, payload);
    } else {
      res = await createNavigationItem(payload);
    }

    if (res.error) {
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save navigation item.' });
    } else {
      setFeedback({ type: 'success', message: `Navigation item "${payload.label}" saved.` });
      setTimeout(() => setFeedback(null), 3500);
    }

    setSubmitting(false);
    setShowModal(false);
    loadItems();
  };

  const handleToggleVisibility = async (item) => {
    const updated = !item.is_visible;
    await updateNavigationItem(item.id, { is_visible: updated });
    setFeedback({ type: 'info', message: `Link "${item.label}" set to ${updated ? 'Visible' : 'Hidden'}.` });
    setTimeout(() => setFeedback(null), 3000);
    loadItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete navigation item "${item.label}"?`)) return;
    await deleteNavigationItem(item.id);
    setFeedback({ type: 'info', message: `Link "${item.label}" deleted.` });
    setTimeout(() => setFeedback(null), 3000);
    loadItems();
  };

  const handleMoveItem = async (item, direction) => {
    const list = items
      .filter((i) => i.location === item.location)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const index = list.findIndex((i) => i.id === item.id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= list.length) return;

    const adjacent = list[targetIndex];
    const itemOrder = adjacent.sort_order;
    const adjacentOrder = item.sort_order === adjacent.sort_order ? adjacent.sort_order + 10 : item.sort_order;

    await Promise.all([
      updateNavigationItem(item.id, { sort_order: itemOrder }),
      updateNavigationItem(adjacent.id, { sort_order: adjacentOrder }),
    ]);

    loadItems();
  };

  const handleSeedDefaults = async () => {
    if (items.length > 0 && !window.confirm('Reset/seed navigation with canonical defaults? Existing items will be preserved.')) {
      return;
    }
    setLoading(true);
    const res = await seedDefaultNavigation();
    if (res.error) {
      setFeedback({ type: 'danger', message: 'Failed to seed default navigation.' });
    } else {
      setFeedback({ type: 'success', message: 'Canonical navigation defaults successfully initialized!' });
      setTimeout(() => setFeedback(null), 4000);
      setItems(res.data || []);
    }
    setLoading(false);
  };

  const getTargetBadge = (targetHref) => {
    const trimmed = (targetHref || '').trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return <span className="badge bg-info-subtle text-info border border-info-subtle">External URL</span>;
    }
    if (trimmed.startsWith('#')) {
      return <span className="badge bg-secondary-subtle text-secondary border">Page Anchor</span>;
    }
    return <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Internal Route</span>;
  };

  const filteredItems = items
    .filter((i) => (selectedLocation === 'all' ? true : i.location === selectedLocation))
    .sort((a, b) => {
      if (a.location !== b.location) return a.location.localeCompare(b.location);
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

  return (
    <div className="admin-navigation-container p-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Navigation Management</h1>
          <p className="text-muted small mb-0">Authoritative control of public site Header and Footer links.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary rounded-pill px-3" onClick={handleSeedDefaults} title="Seed Canonical Defaults">
            <i className="bi bi-arrow-repeat me-1"></i> Seed Defaults
          </button>
          <button className="btn btn-primary rounded-pill px-4" onClick={handleOpenAddModal}>
            <i className="bi bi-plus-lg me-2"></i> Add Link
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show rounded-3 mb-4`} role="alert">
          <i className={`bi bi-${feedback.type === 'success' ? 'check-circle' : 'info-circle'} me-2`}></i>
          {feedback.message}
          <button type="button" className="btn-close" onClick={() => setFeedback(null)}></button>
        </div>
      )}

      {/* Location Filter Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-item-btn btn me-2 rounded-pill px-4 ${selectedLocation === 'header' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedLocation('header')}
          >
            <i className="bi bi-layout-text-window-reverse me-2"></i> Header Navigation ({items.filter((i) => i.location === 'header').length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-item-btn btn me-2 rounded-pill px-4 ${selectedLocation === 'footer' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedLocation('footer')}
          >
            <i className="bi bi-layout-south me-2"></i> Footer Links ({items.filter((i) => i.location === 'footer').length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-item-btn btn rounded-pill px-3 ${selectedLocation === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedLocation('all')}
          >
            All Links ({items.length})
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading navigation...</span>
          </div>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4" style={{ width: '110px' }}>Order</th>
                  <th>Label</th>
                  <th>URL / Destination</th>
                  <th>Target Type</th>
                  <th>Window</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const locationList = filteredItems.filter((i) => i.location === item.location);
                  const isFirst = locationList[0]?.id === item.id;
                  const isLast = locationList[locationList.length - 1]?.id === item.id;

                  return (
                    <tr key={item.id} className={!item.is_visible ? 'bg-light text-muted' : ''}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-1">
                          <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{item.sort_order}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-dark p-0"
                            disabled={isFirst}
                            onClick={() => handleMoveItem(item, -1)}
                            title="Move Up"
                          >
                            <i className="bi bi-chevron-up"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-dark p-0"
                            disabled={isLast}
                            onClick={() => handleMoveItem(item, 1)}
                            title="Move Down"
                          >
                            <i className="bi bi-chevron-down"></i>
                          </button>
                        </div>
                      </td>
                      <td className="fw-semibold">{item.label}</td>
                      <td>
                        <code className="text-muted">{item.href}</code>
                      </td>
                      <td>{getTargetBadge(item.href)}</td>
                      <td>
                        <span className="small text-muted">{item.open_in_new_tab ? 'New Tab (_blank)' : 'Same Tab'}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border text-uppercase" style={{ fontSize: '0.65rem' }}>
                          {item.location}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn-sm py-0 px-2 rounded-pill ${item.is_visible ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => handleToggleVisibility(item)}
                          title="Click to Toggle Visibility"
                        >
                          {item.is_visible ? '✓ Visible' : 'Hidden'}
                        </button>
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-sm btn-outline-secondary rounded-pill me-2" onClick={() => handleOpenEditModal(item)} title="Edit Link">
                          <i className="bi bi-pencil me-1"></i> Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDelete(item)} title="Delete Link">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <i className="bi bi-compass display-4 text-muted mb-3"></i>
          <h4 className="fw-bold">No Links Configured</h4>
          <p className="text-muted mb-4">
            Initialize canonical defaults for Header and Footer or create custom links.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={handleSeedDefaults}>
              <i className="bi bi-arrow-repeat me-1"></i> Initialize Defaults
            </button>
            <button className="btn btn-primary rounded-pill px-4" onClick={handleOpenAddModal}>
              <i className="bi bi-plus-lg me-1"></i> Add Custom Link
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{editingItem ? 'Edit Navigation Item' : 'Add Navigation Item'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Label</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="e.g. Portfolio"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Destination URL (href)</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="e.g. /work or #contact or https://..."
                      value={href}
                      onChange={(e) => setHref(e.target.value)}
                      required
                    />
                    <div className="form-text small" style={{ fontSize: '0.72rem' }}>
                      {getTargetBadge(href)} Use <code>/route</code> for internal pages, <code>#anchor</code> for home sections, or <code>https://...</code> for external links.
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Location</label>
                      <select className="form-select rounded-3" value={location} onChange={(e) => setLocation(e.target.value)}>
                        <option value="header">Header</option>
                        <option value="footer">Footer</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Sort Order</label>
                      <input
                        type="number"
                        className="form-control rounded-3"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="newTabSwitch"
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="newTabSwitch">
                      Open in new browser tab (target="_blank")
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={submitting}>
                    {submitting ? 'Saving...' : editingItem ? 'Update Link' : 'Add Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
