import { useEffect, useState, useCallback } from "react";
import api, {
  fetchAdminConceptStats,
  fetchAdminConcepts,
  createAdminConcept,
  updateAdminConcept,
  updateAdminConceptPrice,
  toggleAdminConceptLock,
  deleteAdminConcept,
  fetchAdminDocuments,
  toggleAdminDocumentLock,
  fetchAdminVideos,
  toggleAdminVideoLock,
} from "../api/client";

export default function LectureMaterialManager() {
  const [activeSubTab, setActiveSubTab] = useState("overview"); // 'overview' | 'concepts' | 'documents' | 'videos'

  // Stats
  const [stats, setStats] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_admin_stats");
      return cached ? JSON.parse(cached) : {
        total_concepts: 0,
        active_concepts: 0,
        total_documents: 0,
        total_videos: 0,
      };
    } catch {
      return { total_concepts: 0, active_concepts: 0, total_documents: 0, total_videos: 0 };
    }
  });

  // Data lists with Instant Cache Initialization
  const [concepts, setConcepts] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_admin_concepts");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [documents, setDocuments] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_admin_docs");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [videos, setVideos] = useState(() => {
    try {
      const cached = sessionStorage.getItem("oc_cache_admin_vids");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  // Quick Price Modal State for Concepts (Subjects)
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [pricingConcept, setPricingConcept] = useState(null);
  const [quickPrice, setQuickPrice] = useState(499);
  const [quickOriginalPrice, setQuickOriginalPrice] = useState(999);
  const [quickOfferEnabled, setQuickOfferEnabled] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);

  // Filters
  const [conceptSearch, setConceptSearch] = useState("");
  const [conceptStatus, setConceptStatus] = useState("");
  const [docFilterConcept, setDocFilterConcept] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [vidFilterConcept, setVidFilterConcept] = useState("");
  const [vidSearch, setVidSearch] = useState("");

  // Modals & Form State
  const [conceptModalOpen, setConceptModalOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState(null);
  const [conceptFormData, setConceptFormData] = useState({
    name: "",
    short_description: "",
    description: "",
    important_points: "",
    topics_covered: "",
    examples_notes: "",
    color_scheme: "blue",
    rating: 5.0,
    price: 499,
    original_price: 999,
    offer_enabled: false,
    sort_order: 0,
    is_active: true,
    is_locked: true,
  });
  const [conceptImageFile, setConceptImageFile] = useState(null);

  // Document Modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docFormData, setDocFormData] = useState({
    concept_id: "",
    title: "",
    description: "",
    sort_order: 0,
    is_active: true,
    is_locked: true,
  });
  const [docFile, setDocFile] = useState(null);

  // Video Modal
  const [vidModalOpen, setVidModalOpen] = useState(false);
  const [editingVid, setEditingVid] = useState(null);
  const [vidFormData, setVidFormData] = useState({
    concept_id: "",
    title: "",
    description: "",
    video_url: "",
    duration: "",
    sort_order: 0,
    is_active: true,
    is_locked: true,
  });
  const [vidFile, setVidFile] = useState(null);
  const [vidThumbnail, setVidThumbnail] = useState(null);

  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.allSettled([
      fetchAdminConceptStats(),
      fetchAdminConcepts({ search: conceptSearch, status: conceptStatus }),
      fetchAdminDocuments({ concept_id: docFilterConcept, search: docSearch }),
      fetchAdminVideos({ concept_id: vidFilterConcept, search: vidSearch }),
    ])
      .then(([sRes, cRes, dRes, vRes]) => {
        if (sRes.status === "fulfilled" && sRes.value.data) {
          setStats(sRes.value.data);
          try { sessionStorage.setItem("oc_cache_admin_stats", JSON.stringify(sRes.value.data)); } catch {}
        }
        if (cRes.status === "fulfilled" && cRes.value.data?.data) {
          const list = cRes.value.data.data;
          setConcepts(list);
          try { sessionStorage.setItem("oc_cache_admin_concepts", JSON.stringify(list)); } catch {}
        }
        if (dRes.status === "fulfilled" && dRes.value.data?.data) {
          const list = dRes.value.data.data;
          setDocuments(list);
          try { sessionStorage.setItem("oc_cache_admin_docs", JSON.stringify(list)); } catch {}
        }
        if (vRes.status === "fulfilled" && vRes.value.data?.data) {
          const list = vRes.value.data.data;
          setVideos(list);
          try { sessionStorage.setItem("oc_cache_admin_vids", JSON.stringify(list)); } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [conceptSearch, conceptStatus, docFilterConcept, docSearch, vidFilterConcept, vidSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flash Notice
  const showNotice = (msg, isErr = false) => {
    setNotice({ msg, isErr });
    setTimeout(() => setNotice(null), 4000);
  };

  // Quick Price Modal Handlers
  const handleOpenQuickPrice = (c) => {
    setPricingConcept(c);
    setQuickPrice(c.price ?? 499);
    setQuickOriginalPrice(c.original_price ?? Math.round((c.price ?? 499) * 2));
    setQuickOfferEnabled(Boolean(c.offer_enabled));
    setShowPriceModal(true);
  };

  const handleSaveQuickPrice = async (e) => {
    e.preventDefault();
    if (!pricingConcept) return;
    setSavingPrice(true);
    try {
      await updateAdminConceptPrice(pricingConcept.id, {
        price: Number(quickPrice),
        original_price: quickOriginalPrice === "" ? null : Number(quickOriginalPrice),
        offer_enabled: quickOfferEnabled,
      });
      showNotice(`Price for "${pricingConcept.name}" updated to ₹${quickPrice} successfully.`);
      setShowPriceModal(false);
      loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error updating price.", true);
    } finally {
      setSavingPrice(false);
    }
  };

  // ==========================================
  // CONCEPT CRUD
  // ==========================================
  const handleOpenCreateConcept = () => {
    setEditingConcept(null);
    setConceptFormData({
      name: "",
      slug: "",
      short_description: "",
      description: "",
      important_points: "",
      topics_covered: "",
      examples_notes: "",
      color_scheme: "blue",
      rating: 5.0,
      price: 499,
      original_price: 999,
      offer_enabled: false,
      sort_order: concepts.length + 1,
      is_active: true,
      is_locked: true,
    });
    setConceptImageFile(null);
    setConceptModalOpen(true);
  };

  const handleOpenEditConcept = (c) => {
    setEditingConcept(c);

    let formattedPoints = "";
    if (Array.isArray(c.important_points)) {
      formattedPoints = c.important_points.join("\n");
    } else if (typeof c.important_points === "string" && c.important_points.trim()) {
      try {
        const parsed = JSON.parse(c.important_points);
        formattedPoints = Array.isArray(parsed) ? parsed.join("\n") : c.important_points;
      } catch {
        formattedPoints = c.important_points;
      }
    }

    let formattedTopics = "";
    if (Array.isArray(c.topics_covered)) {
      formattedTopics = c.topics_covered.join("\n");
    } else if (typeof c.topics_covered === "string" && c.topics_covered.trim()) {
      try {
        const parsed = JSON.parse(c.topics_covered);
        formattedTopics = Array.isArray(parsed) ? parsed.join("\n") : c.topics_covered;
      } catch {
        formattedTopics = c.topics_covered;
      }
    }

    setConceptFormData({
      name: c.name || "",
      slug: c.slug || "",
      short_description: c.short_description || "",
      description: c.description || "",
      important_points: formattedPoints,
      topics_covered: formattedTopics,
      examples_notes: c.examples_notes || "",
      color_scheme: c.color_scheme || "blue",
      rating: c.rating || 5.0,
      price: c.price ?? 499,
      original_price: c.original_price ?? Math.round((c.price ?? 499) * 2),
      offer_enabled: Boolean(c.offer_enabled),
      sort_order: c.sort_order ?? 0,
      is_active: Boolean(c.is_active),
      is_locked: c.is_locked !== false,
    });
    setConceptImageFile(null);
    setConceptModalOpen(true);
  };

  const handleToggleConceptLock = async (c) => {
    const newLock = c.is_locked === false ? true : false;
    try {
      await toggleAdminConceptLock(c.id, newLock);
      showNotice(
        `Subject "${c.name}" is now ${newLock ? "🔒 Locked (Payment required when global payment ON)" : "🔓 Free Access (No payment required)"}.`
      );
      loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error updating subject lock status.", true);
    }
  };

  const handleSaveConcept = async (e) => {
    e.preventDefault();
    if (!conceptFormData.name.trim()) {
      showNotice("Concept Name is required.", true);
      return;
    }
    setSaving(true);
    try {
      const data = new FormData();
      data.append("name", conceptFormData.name.trim());
      if (conceptFormData.slug) {
        data.append("slug", conceptFormData.slug.trim());
      }
      data.append("short_description", conceptFormData.short_description || "");
      data.append("description", conceptFormData.description || "");
      data.append("important_points", conceptFormData.important_points || "");
      data.append("topics_covered", conceptFormData.topics_covered || "");
      data.append("examples_notes", conceptFormData.examples_notes || "");
      data.append("color_scheme", conceptFormData.color_scheme || "blue");
      data.append("rating", conceptFormData.rating || 5.0);
      data.append("price", parseInt(conceptFormData.price, 10) || 499);
      data.append("original_price", conceptFormData.original_price === "" ? "" : (parseInt(conceptFormData.original_price, 10) || 0));
      data.append("offer_enabled", conceptFormData.offer_enabled ? "1" : "0");
      data.append("sort_order", parseInt(conceptFormData.sort_order, 10) || 0);
      data.append("is_active", conceptFormData.is_active ? "1" : "0");
      data.append("is_locked", conceptFormData.is_locked ? "1" : "0");

      if (conceptImageFile) {
        data.append("image", conceptImageFile);
      }

      if (editingConcept) {
        await updateAdminConcept(editingConcept.id, data);
        showNotice(`Concept "${conceptFormData.name}" updated successfully.`);
      } else {
        await createAdminConcept(data);
        showNotice(`Concept "${conceptFormData.name}" created successfully.`);
      }

      try { sessionStorage.removeItem("oc_cache_curriculum_concepts"); } catch {}
      setConceptModalOpen(false);
      loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error saving concept.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConcept = async (c) => {
    if (!window.confirm(`Are you sure you want to delete concept "${c.name}" and all attached documents and videos?`)) {
      return;
    }
    try {
      await api.delete(`/admin/concepts/${c.id}`);
      try { sessionStorage.removeItem("oc_cache_curriculum_concepts"); } catch {}
      showNotice(`Concept "${c.name}" deleted.`);
      loadData();
    } catch (err) {
      showNotice("Error deleting concept.", true);
    }
  };

  // ==========================================
  // DOCUMENT CRUD
  // ==========================================
  const handleOpenCreateDoc = () => {
    setEditingDoc(null);
    setDocFormData({
      concept_id: concepts[0]?.id || "",
      title: "",
      description: "",
      sort_order: documents.length + 1,
      is_active: true,
      is_locked: true,
    });
    setDocFile(null);
    setDocModalOpen(true);
  };

  const handleOpenEditDoc = (d) => {
    setEditingDoc(d);
    setDocFormData({
      concept_id: d.concept_id || "",
      title: d.title || "",
      description: d.description || "",
      sort_order: d.sort_order || 0,
      is_active: Boolean(d.is_active),
      is_locked: d.is_locked !== false,
    });
    setDocFile(null);
    setDocModalOpen(true);
  };

  const handleToggleDocLock = async (d) => {
    const newLock = d.is_locked === false ? true : false;
    try {
      await toggleAdminDocumentLock(d.id, newLock);
      showNotice(
        `Document "${d.title}" is now ${newLock ? "🔒 Locked (Requires module unlock / payment)" : "🔓 Free Access (Freely viewable by all students)"}.`
      );
      loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error updating document lock status.", true);
    }
  };

  const upsertAdminResource = (kind, resource) => {
    if (!resource?.id) return;

    const updateList = kind === "document" ? setDocuments : setVideos;
    const cacheKey = kind === "document" ? "oc_cache_admin_docs" : "oc_cache_admin_vids";

    updateList((current) => {
      const next = [resource, ...current.filter((item) => item.id !== resource.id)].sort(
        (a, b) => Number(a.concept_id) - Number(b.concept_id) || Number(a.sort_order) - Number(b.sort_order) || Number(a.id) - Number(b.id)
      );
      try { sessionStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleSaveDoc = async (e) => {
    e.preventDefault();
    if (!docFormData.concept_id) {
      showNotice("Please select a related concept.", true);
      return;
    }
    if (!docFormData.title.trim()) {
      showNotice("Document title is required.", true);
      return;
    }
    if (!editingDoc && !docFile) {
      showNotice("Please select a file to upload.", true);
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("concept_id", docFormData.concept_id);
      data.append("title", docFormData.title);
      data.append("description", docFormData.description || "");
      data.append("sort_order", docFormData.sort_order);
      data.append("is_active", docFormData.is_active ? 1 : 0);
      data.append("is_locked", docFormData.is_locked ? 1 : 0);

      if (docFile) {
        data.append("file", docFile);
      }

      if (editingDoc) {
        const response = await api.post(`/admin/concept-documents/${editingDoc.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        upsertAdminResource("document", response.data?.data);
        showNotice(`Document "${docFormData.title}" updated.`);
      } else {
        const response = await api.post("/admin/concept-documents", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        upsertAdminResource("document", response.data?.data);
        showNotice(`Document "${docFormData.title}" uploaded.`);
      }

      try { sessionStorage.removeItem("oc_cache_curriculum_concepts"); } catch {}
      setDocModalOpen(false);
      loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error saving document.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async (d) => {
    if (!window.confirm(`Delete document "${d.title}"?`)) return;
    try {
      await api.delete(`/admin/concept-documents/${d.id}`);
      try { sessionStorage.removeItem("oc_cache_curriculum_concepts"); } catch {}
      showNotice(`Document "${d.title}" deleted.`);
      loadData();
    } catch {
      showNotice("Error deleting document.", true);
    }
  };

  // ==========================================
  // VIDEO CRUD
  // ==========================================
  const handleOpenCreateVid = () => {
    setEditingVid(null);
    setVidFormData({
      concept_id: concepts[0]?.id || "",
      title: "",
      description: "",
      video_url: "",
      duration: "",
      sort_order: videos.length + 1,
      is_active: true,
      is_locked: true,
    });
    setVidFile(null);
    setVidThumbnail(null);
    setVidModalOpen(true);
  };

  const handleOpenEditVid = (v) => {
    setEditingVid(v);
    setVidFormData({
      concept_id: v.concept_id || "",
      title: v.title || "",
      description: v.description || "",
      video_url: v.video_url || "",
      duration: v.duration || "",
      sort_order: v.sort_order || 0,
      is_active: Boolean(v.is_active),
      is_locked: v.is_locked !== false,
    });
    setVidFile(null);
    setVidThumbnail(null);
    setVidModalOpen(true);
  };

  const handleToggleVidLock = async (v) => {
    const newLock = v.is_locked === false ? true : false;
    try {
      await toggleAdminVideoLock(v.id, newLock);
      showNotice(
        `Video "${v.title}" is now ${newLock ? "🔒 Locked (Requires module unlock / payment)" : "🔓 Free Access (Freely watchable by all students)"}.`
      );
      loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error updating video lock status.", true);
    }
  };

  const handleSaveVid = async (e) => {
    e.preventDefault();
    if (!vidFormData.concept_id) {
      showNotice("Please select a related concept.", true);
      return;
    }
    if (!vidFormData.title.trim()) {
      showNotice("Video title is required.", true);
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("concept_id", vidFormData.concept_id);
      data.append("title", vidFormData.title);
      data.append("description", vidFormData.description || "");
      data.append("video_url", vidFormData.video_url || "");
      data.append("duration", vidFormData.duration || "");
      data.append("sort_order", vidFormData.sort_order);
      data.append("is_active", vidFormData.is_active ? 1 : 0);
      data.append("is_locked", vidFormData.is_locked ? 1 : 0);

      if (vidFile) {
        data.append("video_file", vidFile);
      }
      if (vidThumbnail) {
        data.append("thumbnail", vidThumbnail);
      }

      if (editingVid) {
        const response = await api.post(`/admin/concept-videos/${editingVid.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        upsertAdminResource("video", response.data?.data);
        showNotice(`Video "${vidFormData.title}" updated.`);
      } else {
        const response = await api.post("/admin/concept-videos", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        upsertAdminResource("video", response.data?.data);
        showNotice(`Video "${vidFormData.title}" created.`);
      }

      try { sessionStorage.removeItem("oc_cache_curriculum_concepts"); } catch {}
      setVidModalOpen(false);
      loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Error saving video.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVid = async (v) => {
    if (!window.confirm(`Delete video "${v.title}"?`)) return;
    try {
      await api.delete(`/admin/concept-videos/${v.id}`);
      try { sessionStorage.removeItem("oc_cache_curriculum_concepts"); } catch {}
      showNotice(`Video "${v.title}" deleted.`);
      loadData();
    } catch {
      showNotice("Error deleting video.", true);
    }
  };

  return (
    <div className="oc-admin-lecture-mgmt">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
            <span className="oc-folder-icon" style={{ background: "var(--tab-1)", width: 36, height: 36, fontSize: "1.1rem" }}>
              <i className="bi bi-journal-text" />
            </span>
            <span>Lecture &amp; Material Management</span>
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            Complete database management for Student Curriculum Concepts, Attached Documents, and Video Lectures.
            {loading && <span className="spinner-border spinner-border-sm text-primary ms-2" role="status" />}
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
            onClick={handleOpenCreateConcept}
          >
            <i className="bi bi-plus-circle-fill" /> Add Concept
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill px-3 d-inline-flex align-items-center gap-1"
            onClick={handleOpenCreateDoc}
          >
            <i className="bi bi-file-earmark-plus-fill" /> Upload Document
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger rounded-pill px-3 d-inline-flex align-items-center gap-1"
            onClick={handleOpenCreateVid}
          >
            <i className="bi bi-camera-video-fill" /> Add Video
          </button>
        </div>
      </div>

      {/* Notice alert */}
      {notice && (
        <div className={`alert ${notice.isErr ? "alert-danger" : "alert-success"} py-2 px-3 mb-4 rounded-3 shadow-sm`}>
          <i className={`bi ${notice.isErr ? "bi-exclamation-circle-fill" : "bi-check-circle-fill"} me-2`} />
          {notice.msg}
        </div>
      )}

      {/* Admin Statistics Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">Total Concepts</small>
                <h3 className="fw-bold mb-0 text-primary">{stats.total_concepts}</h3>
              </div>
              <span className="p-3 bg-primary-subtle text-primary rounded-3">
                <i className="bi bi-mortarboard-fill fs-5" />
              </span>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">Active Concepts</small>
                <h3 className="fw-bold mb-0 text-success">{stats.active_concepts}</h3>
              </div>
              <span className="p-3 bg-success-subtle text-success rounded-3">
                <i className="bi bi-check-circle-fill fs-5" />
              </span>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">Total Documents</small>
                <h3 className="fw-bold mb-0 text-info">{stats.total_documents}</h3>
              </div>
              <span className="p-3 bg-info-subtle text-info rounded-3">
                <i className="bi bi-file-earmark-text-fill fs-5" />
              </span>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="text-muted fw-semibold">Total Videos</small>
                <h3 className="fw-bold mb-0 text-danger">{stats.total_videos}</h3>
              </div>
              <span className="p-3 bg-danger-subtle text-danger rounded-3">
                <i className="bi bi-play-circle-fill fs-5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="oc-admin-subtabs mb-4">
        <button
          type="button"
          className={`oc-admin-subtab ${activeSubTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveSubTab("overview")}
        >
          <i className="bi bi-grid-fill me-1" /> Overview
        </button>
        <button
          type="button"
          className={`oc-admin-subtab ${activeSubTab === "concepts" ? "active" : ""}`}
          onClick={() => setActiveSubTab("concepts")}
        >
          <i className="bi bi-card-heading me-1" /> Concepts ({concepts.length})
        </button>
        <button
          type="button"
          className={`oc-admin-subtab ${activeSubTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveSubTab("documents")}
        >
          <i className="bi bi-files me-1" /> Documents ({documents.length})
        </button>
        <button
          type="button"
          className={`oc-admin-subtab ${activeSubTab === "videos" ? "active" : ""}`}
          onClick={() => setActiveSubTab("videos")}
        >
          <i className="bi bi-camera-video me-1" /> Videos ({videos.length})
        </button>
      </div>

      {/* ============================================================
          OVERVIEW / QUICK MANAGE TAB
          ============================================================ */}
      {activeSubTab === "overview" && (
        <div className="row g-4">
          {/* Column 1: Curriculum Concepts */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-card-heading text-primary" />
                  <span>Curriculum Concepts</span>
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={() => setActiveSubTab("concepts")}
                >
                  View All ({concepts.length}) &rarr;
                </button>
              </div>
              <div className="list-group list-group-flush">
                {concepts.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No concepts created yet.</p>
                ) : (
                  concepts.slice(0, 6).map((c) => (
                    <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom-0" key={c.id}>
                      <div className="d-flex align-items-center gap-2 text-truncate me-2">
                        <span className={`badge bg-${c.color_scheme || "primary"} rounded-circle p-2`} />
                        <div className="text-truncate">
                          <div className="fw-semibold text-dark text-truncate" style={{ fontSize: "0.88rem" }} title={c.name}>{c.name}</div>
                          <small className="text-muted">
                            {c.documents_count || 0} docs &bull; {c.videos_count || 0} vids &bull; <strong className="text-success">₹{c.price ?? 499}</strong>
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-1 flex-shrink-0">
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success rounded-pill px-2 py-0"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => handleOpenQuickPrice(c)}
                          title="Quick Price"
                        >
                          ₹{c.price ?? 499}
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-primary rounded-pill px-2 py-1"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => handleOpenEditConcept(c)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Recent Documents */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text-fill text-info" />
                  <span>Recent Documents</span>
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={() => setActiveSubTab("documents")}
                >
                  View All ({documents.length}) &rarr;
                </button>
              </div>
              <div className="list-group list-group-flush">
                {documents.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No documents uploaded yet.</p>
                ) : (
                  documents.slice(0, 6).map((d) => (
                    <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom-0" key={d.id}>
                      <div className="text-truncate me-2">
                        <div className="fw-semibold text-truncate text-dark" style={{ fontSize: "0.86rem" }} title={d.title}>
                          {d.title}
                        </div>
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <small className="badge bg-light text-dark border text-uppercase" style={{ fontSize: "0.62rem" }}>
                            {d.concept?.name || "General"}
                          </small>
                          <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                            {d.formatted_size || d.file_type || "PDF"}
                          </small>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1 flex-shrink-0"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => handleOpenEditDoc(d)}
                      >
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Recent Videos */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-play-circle-fill text-danger" />
                  <span>Video Lectures</span>
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={() => setActiveSubTab("videos")}
                >
                  View All ({videos.length}) &rarr;
                </button>
              </div>
              <div className="list-group list-group-flush">
                {videos.length === 0 ? (
                  <p className="text-muted small py-3 mb-0">No video lectures added yet.</p>
                ) : (
                  videos.slice(0, 6).map((v) => (
                    <div className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom-0" key={v.id}>
                      <div className="text-truncate me-2">
                        <div className="fw-semibold text-truncate text-dark" style={{ fontSize: "0.86rem" }} title={v.title}>
                          {v.title}
                        </div>
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <small className="badge bg-light text-dark border text-uppercase" style={{ fontSize: "0.62rem" }}>
                            {v.concept?.name || "General"}
                          </small>
                          <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                            <i className="bi bi-clock me-1" />{v.duration || "Video"}
                          </small>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-1 flex-shrink-0"
                        style={{ fontSize: "0.75rem" }}
                        onClick={() => handleOpenEditVid(v)}
                      >
                        Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CONCEPTS MANAGEMENT TAB
          ============================================================ */}
      {activeSubTab === "concepts" && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search concepts by name..."
                  value={conceptSearch}
                  onChange={(e) => setConceptSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select form-select-sm"
                value={conceptStatus}
                onChange={(e) => setConceptStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div className="col-12 col-md-2 text-md-end">
              <button
                type="button"
                className="btn btn-sm btn-primary w-100 rounded-pill"
                onClick={handleOpenCreateConcept}
              >
                <i className="bi bi-plus-lg me-1" /> New Concept
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Concept</th>
                  <th>Theme</th>
                  <th>Unlock Price (₹)</th>
                  <th>Lock / Pay Access</th>
                  <th>Docs</th>
                  <th>Videos</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {concepts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className={`oc-badge-dot oc-theme-${c.color_scheme || "blue"}`} />
                        <div>
                          <span className="fw-bold text-dark">{c.name}</span>
                          <div className="text-muted small text-truncate" style={{ maxWidth: 260 }}>
                            {c.short_description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border text-capitalize">
                        {c.color_scheme || "blue"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 text-start"
                        onClick={() => handleOpenQuickPrice(c)}
                        title="Click to quickly change unlock price"
                      >
                        <span className="badge bg-success-subtle text-success fs-6 fw-bold px-3 py-1 border border-success-subtle rounded-pill d-inline-flex align-items-center gap-1">
                          <span>₹{c.price ?? 499}</span>
                          <i className="bi bi-pencil-square ms-1" style={{ fontSize: "0.75rem", opacity: 0.7 }} />
                        </span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleConceptLock(c)}
                        className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                          c.is_locked !== false
                            ? "btn-outline-warning text-dark border-warning"
                            : "btn-outline-success border-success"
                        }`}
                        title={c.is_locked !== false ? "Click to make this module Free" : "Click to Lock (Require payment)"}
                      >
                        <i className={`bi ${c.is_locked !== false ? "bi-lock-fill text-warning" : "bi-unlock-fill text-success"}`} />
                        <span style={{ fontSize: "0.8rem" }}>
                          {c.is_locked !== false ? "Locked (Paid)" : "Free (Unlocked)"}
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary border">
                        {c.documents_count || 0}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-danger-subtle text-danger border">
                        {c.videos_count || 0}
                      </span>
                    </td>
                    <td>{c.sort_order}</td>
                    <td>
                      <span className={`badge ${c.is_active ? "bg-success-subtle text-success" : "bg-secondary text-white"}`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          title="Quick Price Update"
                          onClick={() => handleOpenQuickPrice(c)}
                        >
                          <i className="bi bi-currency-rupee me-1" /> Price
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleOpenEditConcept(c)}
                        >
                          <i className="bi bi-pencil-fill" /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteConcept(c)}
                        >
                          <i className="bi bi-trash-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          DOCUMENTS MANAGEMENT TAB
          ============================================================ */}
      {activeSubTab === "documents" && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-5">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search document title..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select form-select-sm"
                value={docFilterConcept}
                onChange={(e) => setDocFilterConcept(e.target.value)}
              >
                <option value="">All Concepts</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3 text-md-end">
              <button
                type="button"
                className="btn btn-sm btn-primary w-100 rounded-pill"
                onClick={handleOpenCreateDoc}
              >
                <i className="bi bi-upload me-1" /> Upload Document
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Document Title</th>
                  <th>Related Concept</th>
                  <th>Lock / Pay Access</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="fw-bold text-dark">{d.title}</div>
                      <small className="text-muted">{d.file_name}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {d.concept?.name || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleDocLock(d)}
                        className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                          d.is_locked !== false
                            ? "btn-outline-warning text-dark border-warning"
                            : "btn-outline-success border-success"
                        }`}
                        title={d.is_locked !== false ? "Click to make this Document Free for all" : "Click to Lock (Require module payment)"}
                      >
                        <i className={`bi ${d.is_locked !== false ? "bi-lock-fill text-warning" : "bi-unlock-fill text-success"}`} />
                        <span style={{ fontSize: "0.8rem" }}>
                          {d.is_locked !== false ? "Locked (Paid)" : "Free (Unlocked)"}
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-dark text-uppercase">
                        {d.file_type || "PDF"}
                      </span>
                    </td>
                    <td>{d.formatted_size || "-"}</td>
                    <td>
                      <span className={`badge ${d.is_active ? "bg-success-subtle text-success" : "bg-secondary text-white"}`}>
                        {d.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {d.file_url && (
                          <a
                            href={d.file_url}
                            className="btn btn-outline-secondary"
                            target="_blank"
                            rel="noreferrer"
                            title="View uploaded document"
                          >
                            <i className="bi bi-eye-fill" />
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleOpenEditDoc(d)}
                        >
                          <i className="bi bi-pencil-fill" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteDoc(d)}
                        >
                          <i className="bi bi-trash-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          VIDEOS MANAGEMENT TAB
          ============================================================ */}
      {activeSubTab === "videos" && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-5">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search video lectures..."
                value={vidSearch}
                onChange={(e) => setVidSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select form-select-sm"
                value={vidFilterConcept}
                onChange={(e) => setVidFilterConcept(e.target.value)}
              >
                <option value="">All Concepts</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3 text-md-end">
              <button
                type="button"
                className="btn btn-sm btn-danger w-100 rounded-pill"
                onClick={handleOpenCreateVid}
              >
                <i className="bi bi-play-circle-fill me-1" /> Add Video Lecture
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.88rem" }}>
              <thead className="table-light">
                <tr>
                  <th>Video Title</th>
                  <th>Related Concept</th>
                  <th>Lock / Pay Access</th>
                  <th>Duration</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="fw-bold text-dark">{v.title}</div>
                      <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: 260 }}>
                        {v.description || "No description"}
                      </small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {v.concept?.name || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleVidLock(v)}
                        className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1 ${
                          v.is_locked !== false
                            ? "btn-outline-warning text-dark border-warning"
                            : "btn-outline-success border-success"
                        }`}
                        title={v.is_locked !== false ? "Click to make this Video Free for all" : "Click to Lock (Require module payment)"}
                      >
                        <i className={`bi ${v.is_locked !== false ? "bi-lock-fill text-warning" : "bi-unlock-fill text-success"}`} />
                        <span style={{ fontSize: "0.8rem" }}>
                          {v.is_locked !== false ? "Locked (Paid)" : "Free (Unlocked)"}
                        </span>
                      </button>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-clock me-1" />
                        {v.duration || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">
                        {v.video_url ? "URL / Embed" : "Uploaded File"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${v.is_active ? "bg-success-subtle text-success" : "bg-secondary text-white"}`}>
                        {v.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {v.stream_url && (
                          <a
                            href={v.stream_url}
                            className="btn btn-outline-secondary"
                            target="_blank"
                            rel="noreferrer"
                            title="Preview uploaded video"
                          >
                            <i className="bi bi-play-circle-fill" />
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleOpenEditVid(v)}
                        >
                          <i className="bi bi-pencil-fill" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteVid(v)}
                        >
                          <i className="bi bi-trash-fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD / EDIT CONCEPT
          ============================================================ */}
      {conceptModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: "92vh" }}>
            <form
              onSubmit={handleSaveConcept}
              className="modal-content rounded-4 shadow-lg border-0 d-flex flex-column"
              style={{ maxHeight: "90vh", overflow: "hidden" }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-light rounded-top-4 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <span className="badge bg-primary rounded-circle p-2" />
                    <span>{editingConcept ? `Edit Curriculum Concept: ${editingConcept.name}` : "Create New Curriculum Concept"}</span>
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    Configure curriculum details, access lock rules, pricing, and syllabus content.
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setConceptModalOpen(false)} />
              </div>
              <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                  
                  {/* Card 1: Identity & Category */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-info-circle text-primary" />
                      <span>Basic Identity &amp; Visual Theme</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-5">
                        <label className="form-label fw-semibold">Concept / Subject Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Python Programming, Flask Architecture"
                          required
                          value={conceptFormData.name}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, name: e.target.value })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">URL Identifier Slug</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. python-programming"
                          value={conceptFormData.slug}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, slug: e.target.value })}
                        />
                        <small className="text-muted" style={{ fontSize: "0.72rem" }}>Leave blank to generate automatically</small>
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label fw-semibold">Theme Color</label>
                        <select
                          className="form-select"
                          value={conceptFormData.color_scheme}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, color_scheme: e.target.value })}
                        >
                          <option value="blue">Blue (Python)</option>
                          <option value="amber">Amber / Orange (Flask)</option>
                          <option value="cyan">Cyan / Neon (Frontend)</option>
                          <option value="purple">Purple / Violet (AI/ML)</option>
                          <option value="emerald">Emerald / Teal (Database)</option>
                          <option value="indigo">Indigo / Java</option>
                          <option value="rose">Rose / Pink</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Pricing, Offers & Access Gates */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-currency-rupee text-success" />
                      <span>Payment, Pricing &amp; Access Lock</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-bold text-success">Unlock Price (₹ INR) *</label>
                        <div className="input-group">
                          <span className="input-group-text bg-success-subtle text-success fw-bold">₹</span>
                          <input
                            type="number"
                            className="form-control fw-bold text-success"
                            placeholder="499"
                            min="0"
                            required
                            value={conceptFormData.price}
                            onChange={(e) => setConceptFormData({ ...conceptFormData, price: e.target.value })}
                          />
                        </div>
                        <div className="d-flex gap-1 mt-2 flex-wrap">
                          {[199, 299, 399, 499, 599, 799, 999].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              className={`btn btn-xs py-0 px-2 rounded-pill small ${Number(conceptFormData.price) === amt ? "btn-success text-white" : "btn-outline-secondary"}`}
                              style={{ fontSize: "0.72rem" }}
                              onClick={() => setConceptFormData({ ...conceptFormData, price: amt })}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">Promotional Offer Display</label>
                        <div className="form-check form-switch mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="conceptOfferEnabled"
                            checked={conceptFormData.offer_enabled}
                            onChange={(e) => setConceptFormData({ ...conceptFormData, offer_enabled: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="conceptOfferEnabled">
                            {conceptFormData.offer_enabled ? "Offer Enabled (Strikethrough Price)" : "Standard Price Only"}
                          </label>
                        </div>
                        {conceptFormData.offer_enabled && (
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light">Original ₹</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="999"
                              min="0"
                              value={conceptFormData.original_price}
                              onChange={(e) => setConceptFormData({ ...conceptFormData, original_price: e.target.value })}
                            />
                          </div>
                        )}
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">Subject Access Lock</label>
                        <div className="form-check form-switch mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="conceptLockToggle"
                            checked={conceptFormData.is_locked}
                            onChange={(e) => setConceptFormData({ ...conceptFormData, is_locked: e.target.checked })}
                          />
                          <label className="form-check-label fw-bold" htmlFor="conceptLockToggle">
                            {conceptFormData.is_locked ? "🔒 Locked (Requires Payment)" : "🔓 Free (No Payment Required)"}
                          </label>
                        </div>
                        <small className="text-muted d-block" style={{ fontSize: "0.74rem" }}>
                          When Locked, students must unlock or purchase this subject when global payment is ON.
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Curriculum Syllabus & Academic Content */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-book-half text-warning-emphasis" />
                      <span>Curriculum Syllabus &amp; Description</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Short Summary (Displayed on Overview Card)</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Brief 1-2 sentence overview summarizing this curriculum subject..."
                          value={conceptFormData.short_description}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, short_description: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Detailed Information &amp; Architecture Overview</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Comprehensive academic syllabus, deep architecture notes, learning objectives..."
                          value={conceptFormData.description}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, description: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Topics Covered / Syllabus (One per line)</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Syntax &amp; Variables&#10;Data Structures &amp; Collections&#10;OOP Concepts &amp; Classes&#10;Error Handling &amp; Debugging"
                          value={conceptFormData.topics_covered}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, topics_covered: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Key Highlights &amp; Takeaways (One per line)</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          placeholder="Dynamic typing &amp; high productivity&#10;Extensive open-source ecosystem&#10;Enterprise-ready backend frameworks"
                          value={conceptFormData.important_points}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, important_points: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Code Examples &amp; Syntax Snippets (Optional)</label>
                        <textarea
                          className="form-control font-monospace"
                          rows="3"
                          placeholder="# Example code syntax..."
                          value={conceptFormData.examples_notes}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, examples_notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Publishing & Media */}
                  <div className="card border shadow-none rounded-4 p-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-sliders text-secondary" />
                      <span>Publishing &amp; Display Settings</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-5">
                        <label className="form-label fw-semibold">Concept Banner Image (Optional)</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={(e) => setConceptImageFile(e.target.files[0] || null)}
                        />
                      </div>

                      <div className="col-6 col-md-2">
                        <label className="form-label fw-semibold">Display Order</label>
                        <input
                          type="number"
                          className="form-control"
                          value={conceptFormData.sort_order}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>

                      <div className="col-6 col-md-2">
                        <label className="form-label fw-semibold">Rating (1.0 - 5.0)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          className="form-control"
                          value={conceptFormData.rating}
                          onChange={(e) => setConceptFormData({ ...conceptFormData, rating: parseFloat(e.target.value) || 5.0 })}
                        />
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label fw-semibold">Publish Status</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="conceptActiveToggle"
                            checked={conceptFormData.is_active}
                            onChange={(e) => setConceptFormData({ ...conceptFormData, is_active: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="conceptActiveToggle">
                            {conceptFormData.is_active ? "Active (Visible to Students)" : "Draft (Hidden)"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
                <div
                  className="modal-footer px-4 py-3 bg-light rounded-bottom-4 border-top flex-shrink-0 d-flex justify-content-end align-items-center gap-2"
                  style={{ position: "sticky", bottom: 0, zIndex: 10, background: "#f8fafc" }}
                >
                  <button type="button" className="btn btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setConceptModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : editingConcept ? (
                      "Save Changes"
                    ) : (
                      "Create Concept"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}

      {/* ============================================================
          MODAL: ADD / EDIT DOCUMENT
          ============================================================ */}
      {docModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: "92vh" }}>
            <form
              onSubmit={handleSaveDoc}
              className="modal-content rounded-4 shadow-lg border-0 d-flex flex-column"
              style={{ maxHeight: "90vh", overflow: "hidden" }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-light rounded-top-4 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <span className="badge bg-info text-white rounded-circle p-2" />
                    <span>{editingDoc ? `Edit Study Document: ${editingDoc.title}` : "Upload New Study Document"}</span>
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    Attach educational study materials, handbooks, PDF notes, and slides to subjects.
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setDocModalOpen(false)} />
              </div>
              <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                  
                  {/* Card 1: Subject Association & Title */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-tag text-info" />
                      <span>Document Classification &amp; Title</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Related Subject / Concept *</label>
                        <select
                          className="form-select"
                          required
                          value={docFormData.concept_id}
                          onChange={(e) => setDocFormData({ ...docFormData, concept_id: e.target.value })}
                        >
                          <option value="">-- Select Subject Concept --</option>
                          {concepts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Document Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Python Core Fundamentals Handbook PDF"
                          required
                          value={docFormData.title}
                          onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: File Upload & Current Attached File */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-file-earmark-arrow-up text-primary" />
                      <span>Attached File &amp; Upload</span>
                    </h6>

                    {editingDoc && (
                      <div className="alert alert-light border rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-file-earmark-pdf fs-4 text-danger" />
                          <div>
                            <div className="fw-semibold text-dark small">{editingDoc.file_name || editingDoc.title}</div>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                              Format: <strong className="text-uppercase">{editingDoc.file_type || "PDF"}</strong> &bull; Size: <strong>{editingDoc.formatted_size || "N/A"}</strong>
                            </div>
                          </div>
                        </div>
                        {editingDoc.file_url && (
                          <a
                            href={editingDoc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-xs btn-outline-primary rounded-pill px-3 py-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <i className="bi bi-eye me-1" /> View Current File
                          </a>
                        )}
                      </div>
                    )}

                    <div className="mb-1">
                      <label className="form-label fw-semibold">
                        {editingDoc ? "Replace Document File (Optional)" : "Select Document File *"}
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                        required={!editingDoc}
                        onChange={(e) => setDocFile(e.target.files[0] || null)}
                      />
                      <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                        Supported formats: PDF, DOCX, PPTX, TXT, ZIP. Maximum size: 50MB.
                      </small>
                    </div>
                  </div>

                  {/* Card 3: Description & Summary */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-card-text text-secondary" />
                      <span>Description &amp; Study Guidance (Optional)</span>
                    </h6>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Brief notes summarizing this study document, chapters included, prerequisites..."
                      value={docFormData.description}
                      onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                    />
                  </div>

                  {/* Card 4: Access Lock & Publishing Settings */}
                  <div className="card border shadow-none rounded-4 p-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-shield-lock text-warning-emphasis" />
                      <span>Access Lock &amp; Publishing</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">Display Order</label>
                        <input
                          type="number"
                          className="form-control"
                          value={docFormData.sort_order}
                          onChange={(e) => setDocFormData({ ...docFormData, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">Publish Status</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="docActiveToggle"
                            checked={docFormData.is_active}
                            onChange={(e) => setDocFormData({ ...docFormData, is_active: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="docActiveToggle">
                            {docFormData.is_active ? "Active (Visible)" : "Draft (Hidden)"}
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">Document Access Lock</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="docLockToggle"
                            checked={docFormData.is_locked}
                            onChange={(e) => setDocFormData({ ...docFormData, is_locked: e.target.checked })}
                          />
                          <label className="form-check-label fw-bold" htmlFor="docLockToggle">
                            {docFormData.is_locked ? "🔒 Locked (Paid Access)" : "🔓 Free (Free Preview)"}
                          </label>
                        </div>
                        <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                          When Free, students can read online without paying for the concept.
                        </small>
                      </div>
                    </div>
                  </div>

                </div>
                <div
                  className="modal-footer px-4 py-3 bg-light rounded-bottom-4 border-top flex-shrink-0 d-flex justify-content-end align-items-center gap-2"
                  style={{ position: "sticky", bottom: 0, zIndex: 10, background: "#f8fafc" }}
                >
                  <button type="button" className="btn btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setDocModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : editingDoc ? (
                      "Save Changes"
                    ) : (
                      "Upload Document"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}

      {/* ============================================================
          MODAL: ADD / EDIT VIDEO
          ============================================================ */}
      {vidModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style={{ maxHeight: "92vh" }}>
            <form
              onSubmit={handleSaveVid}
              className="modal-content rounded-4 shadow-lg border-0 d-flex flex-column"
              style={{ maxHeight: "90vh", overflow: "hidden" }}
            >
              <div className="modal-header border-bottom px-4 py-3 bg-light rounded-top-4 flex-shrink-0">
                <div>
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                    <span className="badge bg-danger text-white rounded-circle p-2" />
                    <span>{editingVid ? `Edit Video Lecture: ${editingVid.title}` : "Add New Video Lecture"}</span>
                  </h5>
                  <p className="text-muted small mb-0 mt-1">
                    Manage high-definition lecture recordings, video streaming links, and individual lock controls.
                  </p>
                </div>
                <button type="button" className="btn-close" onClick={() => setVidModalOpen(false)} />
              </div>
              <div className="modal-body p-4" style={{ overflowY: "auto", flex: "1 1 auto" }}>
                  
                  {/* Card 1: Related Subject & Video Title */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-play-circle text-danger" />
                      <span>Video Subject &amp; Lecture Title</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Related Subject / Concept *</label>
                        <select
                          className="form-select"
                          required
                          value={vidFormData.concept_id}
                          onChange={(e) => setVidFormData({ ...vidFormData, concept_id: e.target.value })}
                        >
                          <option value="">-- Select Subject Concept --</option>
                          {concepts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Video Lecture Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Master Class 01: Functions &amp; Variable Scopes"
                          required
                          value={vidFormData.title}
                          onChange={(e) => setVidFormData({ ...vidFormData, title: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Video Source & Live Preview */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-camera-reels text-primary" />
                      <span>Video Stream Source &amp; Media Files</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Video URL (YouTube, Vimeo, Cloud MP4 stream link)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light"><i className="bi bi-link-45deg" /></span>
                          <input
                            type="url"
                            className="form-control"
                            placeholder="https://www.youtube.com/watch?v=... or https://cdn.example.com/video.mp4"
                            value={vidFormData.video_url}
                            onChange={(e) => setVidFormData({ ...vidFormData, video_url: e.target.value })}
                          />
                        </div>
                        <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                          Paste a YouTube or Vimeo or direct MP4 URL, or upload a video file below.
                        </small>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Or Upload Video File (MP4, WebM)</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="video/*"
                          onChange={(e) => setVidFile(e.target.files[0] || null)}
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Custom Thumbnail Image (Optional)</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          onChange={(e) => setVidThumbnail(e.target.files[0] || null)}
                        />
                      </div>

                      {/* Video Live Preview Banner */}
                      {(vidFormData.video_url || editingVid?.thumbnail_url) && (
                        <div className="col-12">
                          <div className="p-3 bg-dark rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2 text-white">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-film fs-4 text-danger" />
                              <div>
                                <strong className="small">Video Stream Configured</strong>
                                <div className="text-white-50 text-truncate" style={{ fontSize: "0.75rem", maxWidth: 450 }}>
                                  {vidFormData.video_url || "Uploaded Video File"}
                                </div>
                              </div>
                            </div>
                            {editingVid?.stream_url && (
                              <a
                                href={editingVid.stream_url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-xs btn-outline-light rounded-pill px-3 py-1"
                                style={{ fontSize: "0.75rem" }}
                              >
                                <i className="bi bi-play-circle me-1" /> Test Stream URL
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Lecture Description */}
                  <div className="card border shadow-none rounded-4 p-3 mb-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-card-text text-secondary" />
                      <span>Lecture Description &amp; Topic Summary</span>
                    </h6>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Detailed topics covered in this video lecture, hands-on demonstrations, timestamps..."
                      value={vidFormData.description}
                      onChange={(e) => setVidFormData({ ...vidFormData, description: e.target.value })}
                    />
                  </div>

                  {/* Card 4: Playback Details & Access Control */}
                  <div className="card border shadow-none rounded-4 p-3 bg-light-subtle">
                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <i className="bi bi-sliders text-warning-emphasis" />
                      <span>Playback Details &amp; Access Lock</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-3">
                        <label className="form-label fw-semibold">Duration (e.g. 24:15)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light"><i className="bi bi-clock" /></span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="24:15"
                            value={vidFormData.duration}
                            onChange={(e) => setVidFormData({ ...vidFormData, duration: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label fw-semibold">Display Order</label>
                        <input
                          type="number"
                          className="form-control"
                          value={vidFormData.sort_order}
                          onChange={(e) => setVidFormData({ ...vidFormData, sort_order: parseInt(e.target.value, 10) || 0 })}
                        />
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label fw-semibold">Publish Status</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="vidActiveToggle"
                            checked={vidFormData.is_active}
                            onChange={(e) => setVidFormData({ ...vidFormData, is_active: e.target.checked })}
                          />
                          <label className="form-check-label fw-semibold" htmlFor="vidActiveToggle">
                            {vidFormData.is_active ? "Active (Published)" : "Draft (Hidden)"}
                          </label>
                        </div>
                      </div>

                      <div className="col-12 col-md-3">
                        <label className="form-label fw-semibold">Video Access Lock</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="vidLockToggle"
                            checked={vidFormData.is_locked}
                            onChange={(e) => setVidFormData({ ...vidFormData, is_locked: e.target.checked })}
                          />
                          <label className="form-check-label fw-bold" htmlFor="vidLockToggle">
                            {vidFormData.is_locked ? "🔒 Locked (Paid Access)" : "🔓 Free (Preview)"}
                          </label>
                        </div>
                        <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                          When Free, students can play this lecture without subject enrollment.
                        </small>
                      </div>
                    </div>
                  </div>

                </div>
                <div
                  className="modal-footer px-4 py-3 bg-light rounded-bottom-4 border-top flex-shrink-0 d-flex justify-content-end align-items-center gap-2"
                  style={{ position: "sticky", bottom: 0, zIndex: 10, background: "#f8fafc" }}
                >
                  <button type="button" className="btn btn-secondary rounded-pill px-4 fw-semibold" onClick={() => setVidModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger rounded-pill px-5 fw-bold shadow-sm" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : editingVid ? (
                      "Save Changes"
                    ) : (
                      "Save Video"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}

      {/* ============================================================
          MODAL: QUICK PRICE UPDATE FOR SUBJECT / CONCEPT
          ============================================================ */}
      {showPriceModal && pricingConcept && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1060 }}
          onClick={() => setShowPriceModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveQuickPrice} className="modal-content rounded-4 border-0 shadow-lg d-flex flex-column">
              <div className="modal-header bg-success text-white rounded-top-4 flex-shrink-0">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-currency-rupee" />
                  <span>Update Unlock Price: {pricingConcept.name}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowPriceModal(false)}
                />
              </div>
              <div className="modal-body p-4">
                  <div className="text-center mb-4">
                    <span
                      className={`oc-badge-dot oc-theme-${pricingConcept.color_scheme || "blue"} d-inline-block mb-2`}
                      style={{ width: 28, height: 28, borderRadius: "50%" }}
                    />
                    <h5 className="fw-bold text-dark mb-1">{pricingConcept.name}</h5>
                    <p className="text-muted small mb-0">Set the payment fee students must pay to unlock this subject's materials and video lectures.</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-dark small">Subject Unlock Price (INR ₹) *</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-success-subtle text-success fw-bold">₹</span>
                      <input
                        type="number"
                        className="form-control fw-bold text-success"
                        min="0"
                        step="1"
                        value={quickPrice}
                        onChange={(e) => setQuickPrice(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="d-flex justify-content-between mt-2 flex-wrap gap-1">
                      <span className="text-muted small">Quick presets:</span>
                      <div className="d-flex gap-1 flex-wrap">
                        {[299, 399, 499, 599, 799, 999].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            className={`btn btn-xs rounded-pill small py-0 px-2 ${Number(quickPrice) === amt ? "btn-success text-white" : "btn-outline-secondary"}`}
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => setQuickPrice(amt)}
                          >
                            ₹{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-4 border bg-light p-3">
                    <div className="form-check form-switch mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="conceptQuickOfferEnabled"
                        checked={quickOfferEnabled}
                        onChange={(e) => setQuickOfferEnabled(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold" htmlFor="conceptQuickOfferEnabled">
                        Show promotional offer to students
                      </label>
                    </div>
                    <small className="text-muted d-block mb-2">
                      When off, students see only the normal subject unlock amount. The configured price remains the payment amount.
                    </small>
                    {quickOfferEnabled && (
                      <div>
                        <label className="form-label fw-semibold small">Original price before offer (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          value={quickOriginalPrice}
                          onChange={(e) => setQuickOriginalPrice(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer bg-light rounded-bottom-4 flex-shrink-0 d-flex justify-content-end align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4 fw-semibold"
                    onClick={() => setShowPriceModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
                    disabled={savingPrice}
                  >
                    {savingPrice ? "Saving..." : "Update Subject Price"}
                  </button>
                </div>
              </form>
            </div>
          </div>
      )}
    </div>
  );
}
