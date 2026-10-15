import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageRenderer from '../../components/cms/PageRenderer';
import SectionPropertyEditor from '../components/cms/editors/SectionPropertyEditor';
import AddSectionModal from '../components/cms/AddSectionModal';
import BlogPageCanvasPreview from '../components/cms/BlogPageCanvasPreview';
import {
  getAdminPages,
  updatePage,
  getAdminPageSections,
  createPageSection,
  updatePageSection,
  deletePageSection,
  publishPageSnapshot,
  ABOUT_PROPOSAL_SECTIONS,
} from '../../services/siteCms';
import { getPagePublishingReadiness } from '../../utils/registryHealth';
import { PAGE_SECTION_TYPES, validateSection, normalizeSectionConfig } from '../../components/cms/sectionSchemas';
import { resolvePageRoute, isSectionBuilderLive, isCodeOwnedSlug } from '../utils/pageRoutes';

export default function AdminPageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeTab, setActiveTab] = useState('section'); // 'section' | 'page' | 'translations'
  const [txLang, setTxLang] = useState('fr'); // 'fr' | 'ar'

  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Unsaved changes tracking & Persistence Feedback
  const [isPageDirty, setIsPageDirty] = useState(false);
  const [dirtySectionIds, setDirtySectionIds] = useState(new Set());
  const [savedJustNow, setSavedJustNow] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // UI state & Viewports
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [leftPanelOpen, setLeftPanelOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 991 : true));
  const [rightPanelOpen, setRightPanelOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth > 1200 : true));
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState(null);
  const [sectionPendingDelete, setSectionPendingDelete] = useState(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    loadPageAndSections();
  }, [id]);

  // Warn before leaving page with unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isPageDirty || dirtySectionIds.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPageDirty, dirtySectionIds]);

  async function loadPageAndSections() {
    setLoading(true);
    const pagesRes = await getAdminPages();
    const target = (pagesRes.data || []).find((p) => String(p.id) === String(id) || String(p.slug) === String(id));
    if (!target) {
      setPage(null);
      setLoading(false);
      return;
    }
    setPage(target);

    const secRes = await getAdminPageSections(target.id);
    let loadedSecs = (secRes.data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    if (target.slug === 'about') {
      const isLegacy = loadedSecs.length > 0 && loadedSecs.every((s) => ['hero', 'rich_text', 'timeline', 'workflow', 'cta'].includes(s.section_type));
      if (loadedSecs.length === 0 || isLegacy) {
        loadedSecs = ABOUT_PROPOSAL_SECTIONS.map((s, idx) => ({
          ...s,
          id: `sec-about-${s.section_type}-${Date.now()}-${idx}`,
          page_id: target.id,
        }));
      }
    }
    setSections(loadedSecs);

    if (target.slug === 'blog') {
      setActiveTab('page');
    } else if (target.slug === 'about' && loadedSecs.length > 0) {
      setActiveSectionId(loadedSecs[0].id);
      setActiveTab('section');
    }
    setLoading(false);
  }

  const handleSyncAboutProposal = () => {
    if (!page) return;
    const synced = ABOUT_PROPOSAL_SECTIONS.map((s, idx) => ({
      ...s,
      page_id: page.id,
      id: `sec-about-${s.section_type}-${Date.now()}-${idx}`,
    }));
    setSections(synced);
    setDirtySectionIds(new Set(synced.map((s) => s.id)));
    if (synced.length > 0) {
      setActiveSectionId(synced[0].id);
      setActiveTab('section');
    }
    setFeedback({
      type: 'success',
      message: 'Synchronized with 9 authoritative Proposal sections (Hero, Journey, Philosophy, Expertise, Proof, Share, Building, Human, Closing). Remember to click "Save All Changes" to persist.',
    });
  };

  const tx = page?.metadata?.i18n?.[txLang] || page?.i18n?.[txLang] || {};
  const txAbout = tx.about || {};

  const setTxField = (patch) => {
    setPage((prev) => {
      const curI18n = prev.metadata?.i18n || prev.i18n || {};
      const curLangTx = curI18n[txLang] || {};
      const updatedLangTx = { ...curLangTx, ...patch };
      const updatedI18n = { ...curI18n, [txLang]: updatedLangTx };

      return {
        ...prev,
        i18n: updatedI18n,
        metadata: {
          ...(prev.metadata || {}),
          i18n: updatedI18n,
        },
      };
    });
    setIsPageDirty(true);
  };

  const setTxAboutField = (patch) => {
    setPage((prev) => {
      const curI18n = prev.metadata?.i18n || prev.i18n || {};
      const curLangTx = curI18n[txLang] || {};
      const curAbout = curLangTx.about || {};
      const updatedAbout = { ...curAbout, ...patch };
      const updatedLangTx = { ...curLangTx, about: updatedAbout };
      const updatedI18n = { ...curI18n, [txLang]: updatedLangTx };

      return {
        ...prev,
        i18n: updatedI18n,
        metadata: {
          ...(prev.metadata || {}),
          i18n: updatedI18n,
        },
      };
    });
    setIsPageDirty(true);
  };

  const setAboutField = (patch) => {
    setPage((prev) => {
      const curAbout = prev.metadata?.about || {};
      const updatedAbout = { ...curAbout, ...patch };
      return {
        ...prev,
        metadata: {
          ...(prev.metadata || {}),
          about: updatedAbout,
        },
      };
    });
    setIsPageDirty(true);
  };

  const activeSection = sections.find((s) => String(s.id) === String(activeSectionId)) || null;

  // Elementor-style selection: Select section, switch to section tab, open properties, and smooth-scroll canvas
  const handleSelectSection = (secId) => {
    setActiveSectionId(secId);
    setActiveTab('section');
    setRightPanelOpen(true);

    setTimeout(() => {
      const canvasEl = document.getElementById(`builder-section-${secId}`);
      if (canvasEl) {
        canvasEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  // Canvas selection: Select section, open properties, and scroll structure panel
  const handleCanvasSelectSection = (secId) => {
    setActiveSectionId(secId);
    setActiveTab('section');
    setRightPanelOpen(true);

    setTimeout(() => {
      const itemEl = document.getElementById(`structure-item-${secId}`);
      if (itemEl) {
        itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  };

  // In-memory update of section config (updates center preview live)
  const handleSectionChange = (updatedSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)));
    setDirtySectionIds(new Set([...dirtySectionIds, updatedSection.id]));
  };

  const handleSaveActiveSection = async () => {
    if (!activeSection) return;
    setSavingSection(true);
    setFeedback(null);
    setSaveError(null);

    const res = await updatePageSection(activeSection.id, {
      label: activeSection.label,
      section_type: activeSection.section_type,
      sort_order: activeSection.sort_order,
      is_visible: activeSection.is_visible,
      config: activeSection.config,
    });

    if (res.error) {
      setSaveError(res.error.message || 'Failed to save section.');
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save section.' });
    } else {
      setFeedback({ type: 'success', message: `Section "${activeSection.label || activeSection.section_type}" saved.` });
      const nextDirty = new Set(dirtySectionIds);
      nextDirty.delete(activeSection.id);
      setDirtySectionIds(nextDirty);
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 3000);
    }
    setSavingSection(false);
  };

  const handleSaveAllChanges = async () => {
    setSavingAll(true);
    setFeedback(null);
    setSaveError(null);

    try {
      // 1. Save page settings if dirty
      if (isPageDirty && page) {
        await updatePage(id, page);
        setIsPageDirty(false);
      }

      // 2. Save all dirty sections
      const dirtyIds = Array.from(dirtySectionIds);
      for (const sId of dirtyIds) {
        const sec = sections.find((s) => s.id === sId);
        if (sec) {
          await updatePageSection(sec.id, {
            label: sec.label,
            section_type: sec.section_type,
            sort_order: sec.sort_order,
            is_visible: sec.is_visible,
            config: sec.config,
          });
        }
      }

      setDirtySectionIds(new Set());
      setFeedback({ type: 'success', message: 'All pending page & section changes saved successfully.' });
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 3000);
    } catch (err) {
      setSaveError(err.message);
      setFeedback({ type: 'danger', message: `Failed to save changes: ${err.message}` });
    } finally {
      setSavingAll(false);
    }
  };

  const handleSavePageMetadata = async (e) => {
    if (e) e.preventDefault();
    setSavingPage(true);
    setFeedback(null);
    setSaveError(null);

    const res = await updatePage(id, page);
    if (res.error) {
      setSaveError(res.error.message || 'Failed to save page settings.');
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save page settings.' });
    } else {
      setFeedback({ type: 'success', message: 'Page settings saved successfully.' });
      setIsPageDirty(false);
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 3000);
      if (res.data) setPage(res.data);
    }
    setSavingPage(false);
  };

  const handleSaveDraft = async () => {
    setSavingPage(true);
    setFeedback(null);
    setSaveError(null);
    const updated = { ...page, status: 'draft' };
    const res = await updatePage(id, updated);
    if (res.error) {
      setSaveError(res.error.message || 'Failed to save draft.');
      setFeedback({ type: 'danger', message: res.error.message || 'Failed to save draft.' });
    } else {
      setPage(res.data || updated);
      setIsPageDirty(false);
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 3000);
      setFeedback({ type: 'success', message: 'Page saved as draft. It remains private and hidden from the public portfolio.' });
    }
    setSavingPage(false);
  };

  const handlePublishPage = async () => {
    setSavingPage(true);
    setFeedback(null);
    setSaveError(null);

    // 1. Publishing readiness check
    const readiness = getPagePublishingReadiness(page, sections);
    if (!readiness.isReady) {
      const gateMsgs = readiness.gates.map((g) => g.message).join(' ');
      setFeedback({ type: 'danger', message: `Cannot publish: ${gateMsgs}` });
      setSavingPage(false);
      return;
    }

    // 2. Advisories check
    if (readiness.advisories.length > 0) {
      const advMsgs = readiness.advisories.slice(0, 3).map((a) => `• ${a.message}`).join('\n');
      if (!window.confirm(`Some recommended fields are missing:\n\n${advMsgs}\n\nPublish anyway?`)) {
        setSavingPage(false);
        return;
      }
    }

    try {
      // Flush pending edits so the published snapshot captures the latest
      // working copy (page settings + any dirty sections).
      if (isPageDirty && page) {
        const pr = await updatePage(id, page);
        if (pr.error) throw new Error(pr.error.message);
        setIsPageDirty(false);
      }
      for (const sId of Array.from(dirtySectionIds)) {
        const sec = sections.find((s) => s.id === sId);
        if (sec) {
          await updatePageSection(sec.id, { label: sec.label, section_type: sec.section_type, sort_order: sec.sort_order, is_visible: sec.is_visible, config: sec.config });
        }
      }
      setDirtySectionIds(new Set());

      // Freeze the working sections into the published snapshot (goes live).
      const res = await publishPageSnapshot(id);
      if (res.error) throw new Error(res.error.message);

      setPage(res.data || { ...page, status: 'published' });
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 3000);
      const publicUrl = resolvePageRoute(page.slug);
      setFeedback({ type: 'success', message: `Published! The live site now shows this version at ${publicUrl}.` });
    } catch (err) {
      setSaveError(err.message);
      setFeedback({ type: 'danger', message: `Failed to publish page: ${err.message}` });
    }
    setSavingPage(false);
  };

  // Open modal to add section at specific index (between existing sections)
  const handleOpenAddModalAt = (targetIndex) => {
    setInsertAtIndex(targetIndex);
    setShowAddSectionModal(true);
  };

  const handleAddSection = async (type, label, layoutConfig) => {
    if (!page) return;

    const resolvedLayout = typeof layoutConfig === 'object' && layoutConfig !== null
      ? layoutConfig
      : (typeof layoutConfig === 'string' ? getLayoutPresetById(layoutConfig) : null);

    const safeLabel = typeof label === 'string' && label.trim()
      ? label.trim()
      : (PAGE_SECTION_TYPES[type]?.label || `${String(type).toUpperCase()} Section`);

    let sortOrder = 10;
    if (insertAtIndex !== null && insertAtIndex >= 0 && sections.length > 0) {
      if (insertAtIndex === 0) {
        sortOrder = Math.max(5, (sections[0]?.sort_order || 10) - 5);
      } else {
        const prevSort = sections[insertAtIndex - 1]?.sort_order || 10;
        const nextSort = sections[insertAtIndex]?.sort_order || prevSort + 20;
        sortOrder = Math.round((prevSort + nextSort) / 2);
      }
    } else if (sections.length > 0) {
      sortOrder = Math.max(...sections.map((s) => s.sort_order || 0)) + 10;
    }

    const initialConfig = normalizeSectionConfig(type, {});
    if (resolvedLayout) {
      initialConfig.layout = resolvedLayout;
      initialConfig.columnLayout = resolvedLayout.presetId;
    }

    const res = await createPageSection({
      page_id: page.id,
      section_type: type,
      label: safeLabel,
      sort_order: sortOrder,
      is_visible: true,
      config: initialConfig,
    });

    if (res.error) {
      setFeedback({ type: 'danger', message: `Failed to add section: ${res.error.message}` });
      return;
    }

    if (res.data) {
      let updatedList;
      if (insertAtIndex !== null && insertAtIndex >= 0) {
        updatedList = [...sections];
        updatedList.splice(insertAtIndex, 0, res.data);
      } else {
        updatedList = [...sections, res.data];
      }

      // Renumber sort_orders deterministically
      updatedList.forEach((s, idx) => {
        s.sort_order = (idx + 1) * 10;
        updatePageSection(s.id, { sort_order: s.sort_order });
      });

      setSections(updatedList);
      setInsertAtIndex(null);
      handleSelectSection(res.data.id);
    }
  };

  const handleToggleVisibility = async (sec) => {
    const updated = { ...sec, is_visible: !sec.is_visible };
    await updatePageSection(sec.id, { is_visible: updated.is_visible });
    setSections(sections.map((s) => (s.id === sec.id ? updated : s)));
  };

  const handleDuplicateSection = async (sec) => {
    if (!page || !sec) return;
    const originalIndex = sections.findIndex((s) => s.id === sec.id);
    const clonedConfig = JSON.parse(JSON.stringify(sec.config || {}));

    const res = await createPageSection({
      page_id: page.id,
      section_type: sec.section_type,
      label: `${sec.label || sec.section_type} (Copy)`,
      sort_order: (sec.sort_order || 0) + 5,
      is_visible: true,
      config: clonedConfig,
    });

    if (res.data) {
      const updatedList = [...sections];
      if (originalIndex !== -1) {
        updatedList.splice(originalIndex + 1, 0, res.data);
      } else {
        updatedList.push(res.data);
      }

      updatedList.forEach((s, idx) => {
        s.sort_order = (idx + 1) * 10;
        updatePageSection(s.id, { sort_order: s.sort_order });
      });

      setSections(updatedList);
      handleSelectSection(res.data.id);
      setFeedback({ type: 'success', message: `Duplicated "${sec.label || sec.section_type}".` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Reordering updates local structure and sort_orders, marking dirty without premature DB persistence
  const handleMoveSection = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSecs = [...sections];
    const temp = newSecs[index];
    newSecs[index] = newSecs[targetIdx];
    newSecs[targetIdx] = temp;

    const nextDirty = new Set(dirtySectionIds);
    newSecs.forEach((sec, idx) => {
      sec.sort_order = (idx + 1) * 10;
      nextDirty.add(sec.id);
    });

    setSections(newSecs);
    setDirtySectionIds(nextDirty);
  };

  // HTML5 Drag and Drop Reordering (Explicit Save Model)
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {
      // Fallback
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, dropTargetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropTargetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...sections];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropTargetIndex, 0, movedItem);

    // Update sort_order deterministically and mark dirty without immediate database write
    const nextDirty = new Set(dirtySectionIds);
    reordered.forEach((sec, idx) => {
      sec.sort_order = (idx + 1) * 10;
      nextDirty.add(sec.id);
    });

    setSections(reordered);
    setDirtySectionIds(nextDirty);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDeleteSection = (sec) => {
    if (!sec) return;
    setSectionPendingDelete(sec);
  };

  const confirmDeleteSection = async () => {
    if (!sectionPendingDelete) return;
    const sec = sectionPendingDelete;
    setSectionPendingDelete(null);

    await deletePageSection(sec.id);
    const deletedIdx = sections.findIndex((s) => s.id === sec.id);
    const remaining = sections.filter((s) => s.id !== sec.id);
    setSections(remaining);

    const nextDirty = new Set(dirtySectionIds);
    nextDirty.delete(sec.id);
    setDirtySectionIds(nextDirty);

    if (remaining.length > 0) {
      const nextIdx = deletedIdx > 0 ? deletedIdx - 1 : 0;
      const nextId = remaining[nextIdx]?.id || remaining[0]?.id;
      handleSelectSection(nextId);
    } else {
      setActiveSectionId(null);
    }

    setFeedback({ type: 'success', message: `Section "${sec.label || sec.section_type}" removed.` });
    setTimeout(() => setFeedback(null), 3000);
  };

  if (loading) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading builder...</span>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-4 text-center">
        <h4>Page Not Found</h4>
        <Link to="/admin/pages" className="btn btn-outline-dark rounded-pill mt-3">
          Back to Pages
        </Link>
      </div>
    );
  }

  const isAnyDirty = isPageDirty || dirtySectionIds.size > 0;
  const dirtyCount = dirtySectionIds.size + (isPageDirty ? 1 : 0);
  const dirtyLabel = dirtyCount === 1
    ? (isPageDirty && dirtySectionIds.size === 0 ? 'Unsaved changes · Page settings' : 'Unsaved changes · 1 section')
    : `Unsaved changes · ${dirtyCount} sections`;

  const canonicalRoute = resolvePageRoute(page.slug);
  const previewUrl = canonicalRoute === '/' ? '/?preview=true' : `${canonicalRoute}?preview=true`;
  const readiness = getPagePublishingReadiness(page, sections);
  const sectionBuilderLive = isSectionBuilderLive(page.slug);
  const codeOwned = isCodeOwnedSlug(page.slug);

  return (
    <div className="admin-visual-builder d-flex flex-column h-100 w-100 overflow-hidden">
      {/* 1. Top Action Bar */}
      <div className="builder-topbar bg-dark text-white px-3 py-2 d-flex justify-content-between align-items-center shadow-sm">
        <div className="d-flex align-items-center gap-2">
          <Link
            to="/admin/pages"
            className="btn btn-sm btn-outline-light rounded-circle p-1 d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            title="Back to Pages"
          >
            <i className="bi bi-arrow-left"></i>
          </Link>
          <div className="me-2">
            <h6 className="mb-0 fw-bold">{page.title}</h6>
            <small className="text-light opacity-75 font-monospace">{canonicalRoute}</small>
          </div>
          <span className={`badge bg-${page.status === 'published' ? 'success' : 'warning text-dark'}`}>
            {page.status}
          </span>
          <span className={`badge ${page.status === 'published' ? 'bg-info text-dark' : 'bg-secondary bg-opacity-50 text-light'}`} style={{ fontSize: '0.68rem' }}>
            {page.status === 'published' ? 'Public' : 'Private'}
          </span>
          <span
            className={`badge rounded-pill ${readiness.isReady ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning-emphasis border border-warning'}`}
            style={{ fontSize: '0.7rem' }}
            title={readiness.isReady ? 'Page satisfies all publication readiness checks' : readiness.gates.map((g) => g.message).join(' | ')}
          >
            {readiness.isReady ? '✓ Ready' : `⚠️ Incomplete (${readiness.score}%)`}
          </span>

          {savingPage || savingSection || savingAll ? (
            <span className="badge bg-info text-dark d-flex align-items-center gap-1">
              <span className="spinner-border spinner-border-sm" style={{ width: '0.65rem', height: '0.65rem' }} role="status"></span>
              Saving…
            </span>
          ) : isAnyDirty ? (
            <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
              <i className="bi bi-circle-fill text-dark" style={{ fontSize: '0.45rem' }}></i>
              Unsaved changes ({dirtySectionIds.size + (isPageDirty ? 1 : 0)})
            </span>
          ) : (
            <span className="badge bg-secondary bg-opacity-25 text-light border border-light border-opacity-25">
              <i className="bi bi-check2 me-1"></i>Saved
            </span>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Panel Toggles */}
          <button
            type="button"
            className={`btn btn-sm ${leftPanelOpen ? 'btn-light' : 'btn-outline-light'} rounded-pill px-2 py-1 small`}
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            title={leftPanelOpen ? 'Hide Structure Sidebar' : 'Show Structure Sidebar'}
          >
            <i className="bi bi-layers me-1"></i>
            <span className="d-none d-sm-inline">Structure</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${rightPanelOpen ? 'btn-light' : 'btn-outline-light'} rounded-pill px-2 py-1 small`}
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title={rightPanelOpen ? 'Hide Properties Sidebar' : 'Show Properties Sidebar'}
          >
            <i className="bi bi-sliders me-1"></i>
            <span className="d-none d-sm-inline">Properties</span>
          </button>

          {/* Viewport Switcher */}
          <div className="btn-group btn-group-sm bg-secondary bg-opacity-50 rounded-pill p-1 ms-1">
            <button
              className={`btn btn-sm rounded-pill border-0 text-white ${previewViewport === 'desktop' ? 'bg-primary' : 'bg-transparent'}`}
              onClick={() => setPreviewViewport('desktop')}
              title="Desktop View (Fluid 100%)"
            >
              <i className="bi bi-display"></i>
            </button>
            <button
              className={`btn btn-sm rounded-pill border-0 text-white ${previewViewport === 'tablet' ? 'bg-primary' : 'bg-transparent'}`}
              onClick={() => setPreviewViewport('tablet')}
              title="Tablet View (768px)"
            >
              <i className="bi bi-tablet"></i>
            </button>
            <button
              className={`btn btn-sm rounded-pill border-0 text-white ${previewViewport === 'mobile' ? 'bg-primary' : 'bg-transparent'}`}
              onClick={() => setPreviewViewport('mobile')}
              title="Mobile View (375px)"
            >
              <i className="bi bi-phone"></i>
            </button>
          </div>

          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline-light rounded-pill px-3"
            title={
              isAnyDirty
                ? 'Preview last saved version in new tab (Unsaved builder edits are not in this preview)'
                : 'Preview saved page layout in new tab'
            }
          >
            <i className="bi bi-box-arrow-up-right me-1"></i>{' '}
            {isAnyDirty ? 'Preview (Saved Version)' : 'Preview Saved Version'}
          </a>

          {isAnyDirty && (
            <button
              type="button"
              className="btn btn-sm btn-outline-warning rounded-pill px-3"
              onClick={handleSaveAllChanges}
              disabled={savingAll}
              title="Save all modified sections and page settings at once"
            >
              {savingAll ? 'Saving All…' : 'Save All'}
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-light rounded-pill px-3"
            onClick={handleSaveDraft}
            disabled={savingPage}
          >
            {savingPage && page.status === 'draft' ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            className={`btn btn-sm ${page.status === 'published' ? 'btn-success' : 'btn-primary'} rounded-pill px-4 fw-semibold`}
            onClick={handlePublishPage}
            disabled={savingPage}
            title="Freeze the current draft into the live site"
          >
            {savingPage && page.status === 'published' ? 'Publishing…' : page.status === 'published' ? 'Publish changes' : 'Publish Page'}
          </button>
        </div>
      </div>

      {sectionBuilderLive ? (
        <div className="bg-light border-bottom text-muted small px-3 py-1" style={{ fontSize: '0.74rem' }}>
          <i className="bi bi-info-circle me-1"></i> Your edits are saved as a <strong>draft</strong> — the live site keeps showing the last <strong>published</strong> version. Use <strong>Preview</strong> to see the draft, then <strong>Publish</strong> to push it live.
        </div>
      ) : (
        <div className="bg-info-subtle border-bottom border-info-subtle text-info-emphasis small px-3 py-2" style={{ fontSize: '0.78rem' }}>
          <i className="bi bi-code-slash me-1"></i>{' '}
          {codeOwned ? (
            <>
              <strong>Code-owned page.</strong> The live <code>{canonicalRoute}</code> page is built in the app’s code{page.slug === 'blog' ? ' and reads your published blog posts' : page.slug === 'agents' ? ' and reads the Content Registry' : ''}. Sections edited here are <strong>not shown to visitors</strong> and publishing will <strong>not</strong> change the live page — manage its content from {page.slug === 'blog' ? 'the Blog editor' : page.slug === 'agents' ? 'the Agents / Content Registry editors' : 'the relevant editor'}.
            </>
          ) : (
            <>
              <strong>This page is not managed by the section builder.</strong> Editing sections here will not change the live <code>{canonicalRoute}</code> route.
            </>
          )}
        </div>
      )}

      {feedback && <div className={`alert alert-${feedback.type} mb-0 py-2 rounded-0 small`}>{feedback.message}</div>}

      {/* 2. Main 3-Column Visual Builder Workspace */}
      <div className="builder-main flex-grow-1 d-flex overflow-hidden position-relative">
        {/* LEFT COLUMN: STRUCTURE / LAYERS PANEL */}
        {leftPanelOpen && (
          <div
            className="builder-col-left border-end bg-light d-flex flex-column shadow-sm transition-all"
            style={{ width: '310px', minWidth: '310px', zIndex: 10 }}
          >
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
              <div>
                <h6 className="fw-bold mb-0">Page Structure</h6>
                <small className="text-muted">{sections.length} {sections.length === 1 ? 'section' : 'sections'}</small>
              </div>
              <div className="d-flex align-items-center gap-1">
                {page?.slug === 'about' && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-pill py-1 px-2 fw-semibold"
                    style={{ fontSize: '0.75rem' }}
                    onClick={handleSyncAboutProposal}
                    title="Synchronize all 9 sections from docs/about-me-page-proposal.md"
                  >
                    <i className="bi bi-arrow-repeat me-1"></i> Sync Proposal
                  </button>
                )}
                <button
                  className="btn btn-sm btn-primary rounded-pill py-1 px-3 shadow-sm"
                  onClick={() => setShowAddSectionModal(true)}
                  title="Add Section"
                >
                  <i className="bi bi-plus-lg me-1"></i> Add
                </button>
                <button
                  className="btn btn-sm btn-link text-muted p-1"
                  onClick={() => setLeftPanelOpen(false)}
                  title="Collapse Structure Panel"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </div>
            </div>

            <div className="sections-list flex-grow-1 overflow-auto p-2">
              {sections.length > 0 ? (
                sections.map((sec, idx) => {
                  const isActive = String(sec.id) === String(activeSectionId);
                  const isSecDirty = dirtySectionIds.has(sec.id);
                  const isDraggingThis = draggedIndex === idx;
                  const isOverThis = dragOverIndex === idx;
                  const schemaMeta = PAGE_SECTION_TYPES[sec.section_type] || {};
                  const sectionLabel = sec.label || schemaMeta.label || sec.section_type;
                  const validation = validateSection(sec.section_type, sec.config || {});

                  return (
                    <div
                      key={sec.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`section-row p-2 mb-2 rounded-3 border bg-white cursor-pointer transition-all ${
                        isActive ? 'border-primary shadow-sm bg-primary bg-opacity-10' : 'border-light'
                      } ${!sec.is_visible ? 'opacity-60 bg-light' : ''} ${isOverThis ? 'border-top border-3 border-primary' : ''} ${
                        isDraggingThis ? 'opacity-25' : ''
                      }`}
                      onClick={() => handleSelectSection(sec.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center text-truncate me-2">
                          <i
                            className="bi bi-grip-vertical text-muted me-2"
                            style={{ cursor: 'grab' }}
                            title="Drag to reorder"
                          ></i>
                          <span
                            className={`p-1 px-2 rounded me-2 ${isActive ? 'bg-primary text-white' : 'bg-light text-primary'}`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            <i className={`bi ${schemaMeta.icon || 'bi-box'}`}></i>
                          </span>
                          <div className="text-truncate">
                            <div className="fw-semibold text-truncate small d-flex align-items-center gap-1">
                              <span className="text-truncate">{sectionLabel}</span>
                              {isSecDirty && <span className="text-warning fw-bold" title="Unsaved changes">•</span>}
                              {!validation.valid && (
                                <i className="bi bi-exclamation-circle-fill text-danger" style={{ fontSize: '0.7rem' }} title={validation.errors.join(' ')}></i>
                              )}
                            </div>
                            <div className="d-flex align-items-center gap-1 mt-1">
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: '0.62rem' }}>
                                #{idx + 1} {sec.section_type}
                              </span>
                              <span className="badge bg-light text-muted border" style={{ fontSize: '0.62rem' }} title={`Layout: ${sec.config?.layout?.presetId || sec.config?.columnLayout || '12'}`}>
                                {sec.config?.layout?.presetId || sec.config?.columnLayout || '12'}
                              </span>
                              {sec.is_visible ? (
                                <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle fw-semibold" style={{ fontSize: '0.62rem' }}>
                                  Visible
                                </span>
                              ) : (
                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-semibold" style={{ fontSize: '0.62rem' }}>
                                  Hidden
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-dark p-0"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSection(idx, -1);
                            }}
                            title="Move Section Up"
                          >
                            <i className="bi bi-chevron-up"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-dark p-0"
                            disabled={idx === sections.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveSection(idx, 1);
                            }}
                            title="Move Section Down"
                          >
                            <i className="bi bi-chevron-down"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-muted p-0 ms-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(sec);
                            }}
                            title={sec.is_visible ? 'Hide section' : 'Show section'}
                          >
                            <i className={`bi bi-${sec.is_visible ? 'eye' : 'eye-slash'}`}></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-muted p-0 ms-1"
                            title="Duplicate Section"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateSection(sec);
                            }}
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0 ms-1"
                            title="Delete Section"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(sec);
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted small">
                  No sections added yet. Click &quot;+ Add&quot; above to create a section.
                </div>
              )}
            </div>
          </div>
        )}

        {/* CENTER COLUMN: INTERACTIVE VISUAL PAGE CANVAS */}
        <div className="builder-col-center flex-grow-1 bg-secondary bg-opacity-10 d-flex flex-column overflow-hidden position-relative">
          <div className="preview-toolbar bg-white border-bottom px-3 py-1 d-flex justify-content-between align-items-center">
            <span className="small text-muted fw-semibold">
              <i className="bi bi-palette2 me-1"></i> Visual Page Canvas
              {activeSection && (
                <span className="ms-2 text-primary">
                  — Editing: <strong>{activeSection.label || activeSection.section_type}</strong>
                </span>
              )}
            </span>
            <span className="small text-muted">
              {previewViewport === 'mobile'
                ? 'Mobile Viewport (375px)'
                : previewViewport === 'tablet'
                ? 'Tablet Viewport (768px)'
                : 'Desktop Viewport (Fluid 100%)'}
            </span>
          </div>

          <div className="preview-canvas-wrapper flex-grow-1 overflow-y-auto overflow-x-hidden p-3 p-md-4 d-flex justify-content-center align-items-start">
            <div
              className={`preview-canvas bg-white shadow rounded-4 overflow-hidden transition-all ${
                previewViewport !== 'desktop' ? 'border border-2 border-dark border-opacity-25' : ''
              }`}
              style={{
                maxWidth: previewViewport === 'mobile' ? '375px' : previewViewport === 'tablet' ? '768px' : '100%',
                width: '100%',
                minHeight: '400px',
                transition: 'max-width 0.2s ease',
              }}
            >
              {/* Renders center preview with live in-memory page & sections state */}
              <div className="p-3">
                {page.slug === 'blog' ? (
                  <BlogPageCanvasPreview
                    page={page}
                    activeLang={activeTab === 'translations' ? txLang : 'en'}
                    onSelectHeader={() => {
                      setActiveTab('page');
                      setRightPanelOpen(true);
                    }}
                  />
                ) : page.slug === 'about' && sections.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-4 border shadow-sm p-4 my-3">
                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary p-3 d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                      <i className="bi bi-layout-text-window-reverse fs-2" />
                    </div>
                    <h5 className="fw-bold text-dark mb-2">Editorial About Me Proposal</h5>
                    <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '480px' }}>
                      Populate all 9 modular sections (Hero, Journey, Philosophy, Expertise, Proof, Share, Building, Human, Closing) into this page to customize each block.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm"
                      onClick={handleSyncAboutProposal}
                    >
                      <i className="bi bi-magic me-2" /> Populate 9 Proposal Sections
                    </button>
                  </div>
                ) : (
                  <PageRenderer
                    page={page}
                    sections={sections}
                    loading={false}
                    error={null}
                    activeSectionId={activeSectionId}
                    viewport={previewViewport}
                    onSelectSection={handleSelectSection}
                    onMoveSection={handleMoveSection}
                    onToggleVisibility={handleToggleVisibility}
                    onDuplicateSection={handleDuplicateSection}
                    onDeleteSection={handleDeleteSection}
                    onInsertSection={handleOpenAddModalAt}
                  />
                )}

                {/* Inline Add Section Button at the bottom of the canvas */}
                <div className="text-center py-4 my-2 border border-2 border-dashed border-secondary border-opacity-25 rounded-4 bg-light">
                  <p className="text-muted small mb-2">Want to add another block to this page?</p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-pill px-4"
                    onClick={() => setShowAddSectionModal(true)}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Section Here
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROPERTIES PANEL */}
        {rightPanelOpen && (
          <div
            className="builder-col-right border-start bg-white d-flex flex-column shadow-sm transition-all"
            style={{ width: '380px', minWidth: '380px', zIndex: 10 }}
          >
            {/* Header Tabs */}
            <div className="d-flex align-items-center justify-content-between border-bottom bg-light px-2 pt-2">
              <ul className="nav nav-tabs border-0 flex-grow-1">
                {page.slug !== 'blog' && (
                  <li className="nav-item">
                    <button
                      type="button"
                      className={`nav-link small py-2 px-3 border-0 transition-all ${activeTab === 'section' ? 'active bg-white text-dark fw-bold shadow-xs' : 'text-secondary fw-semibold'}`}
                      style={{
                        color: activeTab === 'section' ? '#0f172a' : '#64748b',
                        fontWeight: activeTab === 'section' ? 700 : 500,
                        borderTop: activeTab === 'section' ? '3px solid #0d6efd' : '3px solid transparent',
                        backgroundColor: activeTab === 'section' ? '#ffffff' : 'transparent',
                      }}
                      onClick={() => setActiveTab('section')}
                    >
                      <i className={`bi bi-sliders me-1 ${activeTab === 'section' ? 'text-primary' : 'text-muted'}`}></i>
                      Section Properties
                    </button>
                  </li>
                )}
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link small py-2 px-3 border-0 transition-all ${activeTab === 'page' ? 'active bg-white text-dark fw-bold shadow-xs' : 'text-secondary fw-semibold'}`}
                    style={{
                      color: activeTab === 'page' ? '#0f172a' : '#64748b',
                      fontWeight: activeTab === 'page' ? 700 : 500,
                      borderTop: activeTab === 'page' ? '3px solid #0d6efd' : '3px solid transparent',
                      backgroundColor: activeTab === 'page' ? '#ffffff' : 'transparent',
                    }}
                    onClick={() => setActiveTab('page')}
                  >
                    <i className={`bi bi-file-earmark-text me-1 ${activeTab === 'page' ? 'text-primary' : 'text-muted'}`}></i>
                    {page.slug === 'about' ? 'About Content & SEO' : page.slug === 'blog' ? 'Blog Header & SEO' : 'Page Settings'}
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    className={`nav-link small py-2 px-3 border-0 transition-all ${activeTab === 'translations' ? 'active bg-white text-dark fw-bold shadow-xs' : 'text-secondary fw-semibold'}`}
                    style={{
                      color: activeTab === 'translations' ? '#0f172a' : '#64748b',
                      fontWeight: activeTab === 'translations' ? 700 : 500,
                      borderTop: activeTab === 'translations' ? '3px solid #0d6efd' : '3px solid transparent',
                      backgroundColor: activeTab === 'translations' ? '#ffffff' : 'transparent',
                    }}
                    onClick={() => setActiveTab('translations')}
                  >
                    <i className={`bi bi-translate me-1 ${activeTab === 'translations' ? 'text-primary' : 'text-muted'}`}></i>
                    Translations
                  </button>
                </li>
              </ul>
              <button
                className="btn btn-sm btn-link text-muted p-1 mb-1 me-1"
                onClick={() => setRightPanelOpen(false)}
                title="Collapse Properties"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="properties-content flex-grow-1 overflow-auto">
              {activeTab === 'section' ? (
                <SectionPropertyEditor
                  section={activeSection}
                  onChange={handleSectionChange}
                  onSave={handleSaveActiveSection}
                  dirty={activeSection ? dirtySectionIds.has(activeSection.id) : false}
                />
              ) : activeTab === 'translations' ? (
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">Page Translations</h6>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className={`btn ${txLang === 'fr' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setTxLang('fr')}
                      >
                        Français (FR)
                      </button>
                      <button
                        type="button"
                        className={`btn ${txLang === 'ar' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setTxLang('ar')}
                      >
                        العربية (AR)
                      </button>
                    </div>
                  </div>

                  <div className="alert alert-light border rounded-3 p-2 small mb-3 text-muted">
                    <i className="bi bi-info-circle me-1"></i> Enter the {txLang === 'fr' ? 'French' : 'Arabic'} version of this page. Any empty fields will fall back to the default (English) text.
                  </div>

                  <form onSubmit={handleSavePageMetadata} dir={txLang === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Page Title ({txLang.toUpperCase()})</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={tx.title || ''}
                        onChange={(e) => setTxField({ title: e.target.value })}
                        placeholder={page.title || ''}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">SEO Title ({txLang.toUpperCase()})</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={tx.seo_title || ''}
                        onChange={(e) => setTxField({ seo_title: e.target.value })}
                        placeholder={page.seo_title || page.title || ''}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">SEO Description ({txLang.toUpperCase()})</label>
                      <textarea
                        className="form-control form-control-sm rounded-3"
                        rows="2"
                        value={tx.seo_description || tx.description || ''}
                        onChange={(e) => setTxField({ seo_description: e.target.value, description: e.target.value })}
                        placeholder={page.seo_description || ''}
                      />
                    </div>

                    {/* Blog Page Specific Translation Fields */}
                    {page.slug === 'blog' && (
                      <div className="border-top pt-3 mt-3">
                        <h6 className="fw-bold small mb-2 text-primary">Blog Header Translation</h6>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Header Eyebrow ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={tx.eyebrow || ''}
                            onChange={(e) => setTxField({ eyebrow: e.target.value })}
                            placeholder={page.metadata?.eyebrow || 'WRITING & THOUGHTS'}
                          />
                        </div>
                      </div>
                    )}

                    {/* About Page Specific Translation Fields */}
                    {page.slug === 'about' && (
                      <div className="border-top pt-3 mt-3">
                        <h6 className="fw-bold small mb-2 text-primary">About Page Hero & Editorial Translation</h6>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Hero Eyebrow ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.heroEyebrow || ''}
                            onChange={(e) => setTxAboutField({ heroEyebrow: e.target.value })}
                            placeholder="PRODUCT DESIGNER · AI BUILDER"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Hero Headline ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.heroHeadline || ''}
                            onChange={(e) => setTxAboutField({ heroHeadline: e.target.value })}
                            placeholder="JE CONÇOIS. JE BÂTIS. J'EXPÉRIMENTE."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Hero Supporting Text ({txLang.toUpperCase()})</label>
                          <textarea
                            className="form-control form-control-sm rounded-3"
                            rows="2"
                            value={txAbout.heroLead || ''}
                            onChange={(e) => setTxAboutField({ heroLead: e.target.value })}
                            placeholder="Je transforme des problèmes complexes en produits numériques utilisables..."
                          />
                        </div>
                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <label className="form-label small fw-semibold">CTA 1 Label ({txLang.toUpperCase()})</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={txAbout.exploreCta || ''}
                              onChange={(e) => setTxAboutField({ exploreCta: e.target.value })}
                              placeholder="Explorer mon travail"
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold">CTA 2 Label ({txLang.toUpperCase()})</label>
                            <input
                              type="text"
                              className="form-control form-control-sm rounded-3"
                              value={txAbout.talkCta || ''}
                              onChange={(e) => setTxAboutField({ talkCta: e.target.value })}
                              placeholder="Discutons"
                            />
                          </div>
                        </div>

                        <h6 className="fw-bold small mb-2 text-primary pt-2 border-top">Journey & Editorial Content</h6>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Journey Eyebrow ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.eyebrow || ''}
                            onChange={(e) => setTxAboutField({ eyebrow: e.target.value })}
                            placeholder="LE PARCOURS"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Headline Line 1 ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.titleLine1 || ''}
                            onChange={(e) => setTxAboutField({ titleLine1: e.target.value })}
                            placeholder="De la création de mes propres mains"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Headline Line 2 ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.titleLine2 || ''}
                            onChange={(e) => setTxAboutField({ titleLine2: e.target.value })}
                            placeholder="à la conception de produits intelligents."
                          />
                        </div>

                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Card Eyebrow ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.cardEyebrow || ''}
                            onChange={(e) => setTxAboutField({ cardEyebrow: e.target.value })}
                            placeholder="À PROPOS DE MOI"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Card Title Line 1 ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.cardTitleLine1 || ''}
                            onChange={(e) => setTxAboutField({ cardTitleLine1: e.target.value })}
                            placeholder="Concevoir avec curiosité."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Card Title Line 2 ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.cardTitleLine2 || ''}
                            onChange={(e) => setTxAboutField({ cardTitleLine2: e.target.value })}
                            placeholder="Bâtir avec raison d'être."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Biography ({txLang.toUpperCase()})</label>
                          <textarea
                            className="form-control form-control-sm rounded-3"
                            rows="3"
                            value={txAbout.bio || ''}
                            onChange={(e) => setTxAboutField({ bio: e.target.value })}
                            placeholder="Je m'appelle Naïm..."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Skills (comma-separated) ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={Array.isArray(txAbout.skills) ? txAbout.skills.join(', ') : (txAbout.skills || '')}
                            onChange={(e) =>
                              setTxAboutField({
                                skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="UX/UI, Product Design, IA, Low-Code, Design Systems, Automatisation"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Languages ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.languagesLine1 || ''}
                            onChange={(e) => setTxAboutField({ languagesLine1: e.target.value })}
                            placeholder="Arabe · Français · Anglais · Italien"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold">Certifications ({txLang.toUpperCase()})</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={txAbout.certLine1 || ''}
                            onChange={(e) => setTxAboutField({ certLine1: e.target.value })}
                            placeholder="PSM I · Mendix Rapid Developer · Design ISSAT"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-sm btn-primary rounded-pill w-100 py-2 mt-2"
                      disabled={savingPage}
                    >
                      {savingPage ? 'Saving...' : `Save ${txLang.toUpperCase()} Translations`}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-3">
                  <h6 className="fw-bold mb-3">Page Metadata & SEO</h6>
                  <form onSubmit={handleSavePageMetadata}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={page.title || ''}
                        onChange={(e) => {
                          setPage({ ...page, title: e.target.value });
                          setIsPageDirty(true);
                        }}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Slug (URL)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={page.slug || ''}
                        onChange={(e) => {
                          setPage({ ...page, slug: e.target.value });
                          setIsPageDirty(true);
                        }}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Publish Status</label>
                      <select
                        className="form-select form-select-sm rounded-3"
                        value={page.status || 'draft'}
                        onChange={(e) => {
                          setPage({ ...page, status: e.target.value });
                          setIsPageDirty(true);
                        }}
                      >
                        <option value="draft">Draft (Private)</option>
                        <option value="published">Published (Public)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Template</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={page.template || 'default'}
                        onChange={(e) => {
                          setPage({ ...page, template: e.target.value });
                          setIsPageDirty(true);
                        }}
                      />
                    </div>
                    <hr />
                    <h6 className="fw-bold mb-3">SEO Configuration</h6>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">SEO Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={page.seo_title || ''}
                        onChange={(e) => {
                          setPage({ ...page, seo_title: e.target.value });
                          setIsPageDirty(true);
                        }}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">SEO Description</label>
                      <textarea
                        className="form-control form-control-sm rounded-3"
                        rows="3"
                        value={page.seo_description || ''}
                        onChange={(e) => {
                          setPage({ ...page, seo_description: e.target.value });
                          setIsPageDirty(true);
                        }}
                      />
                    </div>

                    {/* About Content in English */}
                    {page.slug === 'about' && (
                      <div className="border-top pt-3 mt-3">
                        <h6 className="fw-bold small mb-2 text-primary">About Page Default Content</h6>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Journey Eyebrow</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.eyebrow || ''}
                            onChange={(e) => setAboutField({ eyebrow: e.target.value })}
                            placeholder="THE JOURNEY"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Headline Line 1</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.titleLine1 || ''}
                            onChange={(e) => setAboutField({ titleLine1: e.target.value })}
                            placeholder="From making things with my hands"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Headline Line 2</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.titleLine2 || ''}
                            onChange={(e) => setAboutField({ titleLine2: e.target.value })}
                            placeholder="to building intelligent products."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Card Eyebrow</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.cardEyebrow || ''}
                            onChange={(e) => setAboutField({ cardEyebrow: e.target.value })}
                            placeholder="ABOUT ME"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Card Title Line 1</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.cardTitleLine1 || ''}
                            onChange={(e) => setAboutField({ cardTitleLine1: e.target.value })}
                            placeholder="Designing with curiosity."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Card Title Line 2</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.cardTitleLine2 || ''}
                            onChange={(e) => setAboutField({ cardTitleLine2: e.target.value })}
                            placeholder="Building with purpose."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Biography</label>
                          <textarea
                            className="form-control form-control-sm rounded-3"
                            rows="3"
                            value={page.metadata?.about?.bio || ''}
                            onChange={(e) => setAboutField({ bio: e.target.value })}
                            placeholder="I'm Naïm, a product designer and AI builder..."
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Skills (comma-separated)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={Array.isArray(page.metadata?.about?.skills) ? page.metadata?.about?.skills.join(', ') : (page.metadata?.about?.skills || '')}
                            onChange={(e) =>
                              setAboutField({
                                skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              })
                            }
                            placeholder="UX/UI, Product Design, AI, Low-Code, Design Systems, Automation"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Languages</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.languagesLine1 || ''}
                            onChange={(e) => setAboutField({ languagesLine1: e.target.value })}
                            placeholder="Arabic · French · English · Italian"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small fw-semibold">Certifications</label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3"
                            value={page.metadata?.about?.certLine1 || ''}
                            onChange={(e) => setAboutField({ certLine1: e.target.value })}
                            placeholder="PSM I · Mendix Rapid Developer · Design ISSAT"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-sm btn-primary rounded-pill w-100 py-2 mt-2"
                      disabled={savingPage}
                    >
                      {savingPage ? 'Saving...' : 'Save Page Settings'}
                    </button>
                  </form>

                  {/* Page Publishing Readiness Card */}
                  {(() => {
                    const readiness = getPagePublishingReadiness(page, sections);
                    return (
                      <div className="mt-4 pt-3 border-top">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-bold text-uppercase text-secondary" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                            Publishing Readiness
                          </span>
                          <span className={`badge ${readiness.isReady ? 'bg-success' : 'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>
                            {readiness.isReady ? '✓ Ready to Publish' : '⚠ Action Required'}
                          </span>
                        </div>

                        <div className="progress mb-3" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${readiness.isReady ? 'bg-success' : 'bg-warning'}`}
                            role="progressbar"
                            style={{ width: `${readiness.score}%` }}
                            aria-valuenow={readiness.score}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>

                        {readiness.gates.length > 0 && (
                          <div className="mb-2">
                            <div className="text-danger small fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-x-circle me-1" /> Blocking Issues ({readiness.gates.length}):
                            </div>
                            <ul className="list-unstyled mb-0 ps-2" style={{ fontSize: '0.72rem' }}>
                              {readiness.gates.map((g, idx) => (
                                <li key={idx} className="text-danger d-flex align-items-start gap-1 mb-1">
                                  <span>•</span> <span>{g.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {readiness.advisories.length > 0 && (
                          <div>
                            <div className="text-warning-emphasis small fw-semibold mb-1" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-info-circle me-1" /> Recommendations ({readiness.advisories.length}):
                            </div>
                            <ul className="list-unstyled mb-0 ps-2" style={{ fontSize: '0.72rem' }}>
                              {readiness.advisories.map((a, idx) => (
                                <li key={idx} className="text-muted d-flex align-items-start gap-1 mb-1">
                                  <span>•</span> <span>{a.message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sectionPendingDelete && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSectionPendingDelete(null); }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-danger bg-opacity-10 px-4 pt-4 pb-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-15"
                    style={{ width: '44px', height: '44px', flexShrink: 0 }}
                  >
                    <i className="bi bi-trash text-danger fs-5" />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-danger-emphasis">Delete Section?</h5>
                    <p className="text-muted small mb-0 mt-1">
                      <strong>{sectionPendingDelete.label || sectionPendingDelete.section_type}</strong> will be permanently removed
                      from this page.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-body px-4 py-3">
                <div className="alert alert-warning border-0 rounded-3 py-2 px-3 d-flex align-items-start gap-2 mb-0" style={{ fontSize: '0.82rem' }}>
                  <i className="bi bi-exclamation-triangle-fill text-warning mt-1" style={{ flexShrink: 0 }} />
                  <span>This action cannot be undone. All content configured in this section will be lost.</span>
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4 pt-0 d-flex gap-2 justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={() => setSectionPendingDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-semibold"
                  onClick={confirmDeleteSection}
                >
                  <i className="bi bi-trash me-2" />
                  Delete Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Categorized Modal */}
      <AddSectionModal
        show={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onAddSection={handleAddSection}
      />
    </div>
  );
}
