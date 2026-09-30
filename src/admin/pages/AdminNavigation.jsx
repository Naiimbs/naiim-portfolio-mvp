import React, { useState, useEffect } from 'react';
import {
  getAdminNavigationItems,
  createNavigationItem,
  updateNavigationItem,
  deleteNavigationItem,
} from '../../services/siteCms';

export default function AdminNavigation() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('header');

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
    setLocation(selectedLocation);
    setSortOrder((filteredItems.length + 1) * 10);
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

    const payload = {
      label: label.trim(),
      href: href.trim() || '#',
      location,
      sort_order: Number(sortOrder) || 0,
      open_in_new_tab: openInNewTab,
    };

    if (editingItem) {
      await updateNavigationItem(editingItem.id, payload);
    } else {
      await createNavigationItem(payload);
    }

    setSubmitting(false);
    setShowModal(false);
    loadItems();
  };

  const handleToggleVisibility = async (item) => {
    await updateNavigationItem(item.id, { is_visible: !item.is_visible });
    loadItems();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete navigation item "${item.label}"?`)) return;
    await deleteNavigationItem(item.id);
    loadItems();
  };

  const filteredItems = items
    .filter((i) => i.location === selectedLocation)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="admin-navigation-container p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold">Navigation Management</h1>
          <p className="text-muted small mb-0">Configure header and footer links for site navigation.</p>
        </div>
        <button className="btn btn-primary rounded-pill px-4" onClick={handleOpenAddModal}>
          <i className="bi bi-plus-lg me-2"></i> Add Link
        </button>
      </div>

      {/* Location Filter Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-item-btn btn me-2 rounded-pill px-4 ${selectedLocation === 'header' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedLocation('header')}
          >
            <i className="bi bi-layout-text-window-reverse me-2"></i> Header Navigation
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-item-btn btn rounded-pill px-4 ${selectedLocation === 'footer' ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => setSelectedLocation('footer')}
          >
            <i className="bi bi-layout-south me-2"></i> Footer Links
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
                  <th className="ps-4" style={{ width: '80px' }}>Order</th>
                  <th>Label</th>
                  <th>URL / Destination</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className={!item.is_visible ? 'bg-light text-muted' : ''}>
                    <td className="ps-4">
                      <span className="badge bg-secondary">{item.sort_order}</span>
                    </td>
                    <td className="fw-semibold">{item.label}</td>
                    <td>
                      <code className="text-muted">{item.href}</code>
                    </td>
                    <td>
                      <span className="small text-muted">{item.open_in_new_tab ? 'New Tab (_blank)' : 'Same Window'}</span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm btn-outline-${item.is_visible ? 'success' : 'secondary'} rounded-pill`}
                        onClick={() => handleToggleVisibility(item)}
                      >
                        {item.is_visible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="text-end pe-4">
                      <button className="btn btn-sm btn-outline-secondary rounded-pill me-2" onClick={() => handleOpenEditModal(item)}>
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDelete(item)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <i className="bi bi-compass display-4 text-muted mb-3"></i>
          <h4 className="fw-bold">No Links in {selectedLocation.toUpperCase()}</h4>
          <p className="text-muted mb-4">Click "Add Link" to add navigation links for the {selectedLocation}.</p>
          <div>
            <button className="btn btn-primary rounded-pill px-4" onClick={handleOpenAddModal}>
              Add Link
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
                      placeholder="e.g. /work or https://..."
                      value={href}
                      onChange={(e) => setHref(e.target.value)}
                      required
                    />
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
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="openInNewTab"
                      checked={openInNewTab}
                      onChange={(e) => setOpenInNewTab(e.target.checked)}
                    />
                    <label className="form-check-label small" htmlFor="openInNewTab">
                      Open link in new browser tab
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowModal(false)}>
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
